// @flow

import invariant from 'invariant';

import AggrowData, {
  AggrowDoubleColumn,
  AggrowIntColumn,
  AggrowStackColumn,
  AggrowStringColumn } from './AggrowData';
import AggrowExpander from './AggrowExpander';
import type { FlattenedStack } from './StackRegistry';
import StackRegistry from './StackRegistry';

export type FocusConfig = {
  pattern: RegExp,
  firstMatch: boolean,
  leftSide: boolean,
}
type FocusPredicate = (frameId: number) => boolean;

export default class Aggrow {
  data: AggrowData;
  expander: AggrowExpander;

  constructor(aggrowData: AggrowData) {
    aggrowData.flattenStacks();
    this.data = aggrowData;
    this.expander = new AggrowExpander(aggrowData.rowCount);
  }

  addSumAggregator(aggregatorName: string, columnName: string): number {
    const column = this.data.getColumn(columnName);

    invariant(column, `Column ${columnName} does not exist.`);
    invariant(column instanceof AggrowIntColumn || column instanceof AggrowDoubleColumn,
      `Sum aggregator does not support ${column.constructor.name} columns!`);
    return this.expander.addAggregator(
      aggregatorName,
      (indices: Int32Array): number => {
        let size = 0;
        indices.forEach((i: number) => { size += column.get(i); });
        return size;
      },
      (value: any): string => value.toLocaleString(),
      (a: number, b: number): number => b - a,
    );
  }

  addCountAggregator(aggregatorName: string): number {
    return this.expander.addAggregator(
      aggregatorName,
      (indices: Int32Array): number => indices.length,
      (value: any): string => value.toLocaleString(),
      (a: number, b: number): number => b - a,
    );
  }

  addStringExpander(expanderName: string, columnName: string): number {
    const column = this.data.getColumn(columnName);
    invariant(column, `Column ${columnName} does not exist.`);
    invariant(column instanceof AggrowStringColumn, 'String expander needs a string column.');
    const strings = column.strings;
    return this.expander.addFieldExpander(
      expanderName,
      (rowA: number, rowB: number): number => column.get(rowA) - column.get(rowB),
      (row: number): string => strings.get(column.get(row)),
      (s: string): string => s,
    );
  }

  addNumberExpander(expanderName: string, columnName: string): number {
    const column = this.data.getColumn(columnName);
    invariant(column, `Column ${columnName} does not exist.`);
    invariant(
      column instanceof AggrowIntColumn || column instanceof AggrowDoubleColumn,
      `Number expander does not support ${column.constructor.name} columns.`);
    return this.expander.addFieldExpander(
      expanderName,
      (rowA: number, rowB: number): number => column.get(rowA) - column.get(rowB),
      (row: number): number => column.get(row),
      (n: any): string => n.toLocaleString(),
    );
  }

  addPointerExpander(expanderName: string, columnName: string): number {
    const column = this.data.getColumn(columnName);
    invariant(column, `Column ${columnName} does not exist.`);
    invariant(
      column instanceof AggrowIntColumn,
      `Pointer expander does not support ${column.constructor.name} columns.`);
    return this.expander.addFieldExpander(
      expanderName,
      (rowA: number, rowB: number): number => column.get(rowA) - column.get(rowB),
      (row: number): number => column.get(row),
      (p: number): string => `0x${(p >>> 0).toString(16)}`,  // eslint-disable-line no-bitwise
    );
  }

  addStackExpander(
      expanderName: string,
      columnName: string,
      reverse: boolean,
      focus: ?FocusConfig): number {
    const column = this.data.getColumn(columnName);
    invariant(column, `Column ${columnName} does not exist.`);
    invariant(
      column instanceof AggrowStackColumn,
      `Stack expander does not support ${column.constructor.name} columns.`);
    let stacks = column.stacks;
    const getter = column.getter;
    const formatter = column.formatter;
    if (focus) {
      const re = focus.pattern;
      const predicate = (frameId: number): boolean => re.test(formatter(getter(frameId)));
      stacks = focusStacks(stacks, predicate, focus.firstMatch, focus.leftSide);
    }
    return this.expander.addStackExpander(
      expanderName,
      stacks.maxDepth,
      (row: number): FlattenedStack => stacks.get(column.get(row)),
      getter,
      formatter,
      !!reverse,
    );
  }
}

function focusStacks(
    stacks: StackRegistry,
    predicate: FocusPredicate,
    firstMatch: boolean,
    leftSide: boolean): FocusedStackRegistry {
  let stackMapper;
  if (firstMatch && leftSide) {
    stackMapper = (stack: FlattenedStack): FlattenedStack => {
      for (let i = 0; i < stack.length; i++) {
        if (predicate(stack[i])) {
          return stack.subarray(0, i + 1);
        }
      }
      return stack.subarray(0, 0);
    };
  } else if (firstMatch && !leftSide) {
    stackMapper = (stack: FlattenedStack): FlattenedStack => {
      for (let i = 0; i < stack.length; i++) {
        if (predicate(stack[i])) {
          return stack.subarray(i, stack.length);
        }
      }
      return stack.subarray(0, 0);
    };
  } else if (!firstMatch && leftSide) {
    stackMapper = (stack: FlattenedStack): FlattenedStack => {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (predicate(stack[i])) {
          return stack.subarray(0, i + 1);
        }
      }
      return stack.subarray(0, 0);
    };
  } else {  // !firstMatch && !leftSide
    stackMapper = (stack: FlattenedStack): FlattenedStack => {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (predicate(stack[i])) {
          return stack.subarray(i, stack.length);
        }
      }
      return stack.subarray(0, 0);
    };
  }

  invariant(stacks.stackIdMap, 'Stacks were not flattened.');
  return new FocusedStackRegistry(
    stacks.stackIdMap.map(stackMapper),
    stacks.maxDepth);
}

class FocusedStackRegistry {
  maxDepth: number;
  stackIdMap: Array<FlattenedStack>;

  constructor(stackIdMap: Array<FlattenedStack>, maxDepth: number) {
    this.maxDepth = maxDepth;
    this.stackIdMap = stackIdMap;
  }

  get(id: number): FlattenedStack {
    return this.stackIdMap[id];
  }
}
