// @flow

import invariant from 'invariant';

import type { FrameGetter, FrameFormatter } from './AggrowExpander';
import type { Stack } from './StackRegistry';
import StackRegistry from './StackRegistry';
import StringInterner from './StringInterner';

export type AggrowColumnDef =
  AggrowStringColumnDef |
  AggrowIntColumnDef |
  AggrowDoubleColumnDef |
  AggrowStackColumnDef;

type AggrowStringColumnDef = {
  type: 'string';
  name: string;
  strings: StringInterner;
}

type AggrowIntColumnDef = {
  type: 'int';
  name: string;
}

type AggrowDoubleColumnDef = {
  type: 'double';
  name: string;
}

type AggrowStackColumnDef = {
  type: 'stack';
  name: string;
  stacks: StackRegistry,
  getter: FrameGetter,
  formatter: FrameFormatter,
}

export interface AggrowColumn {
  name: string;
  get(row: number): number;
  insert(row: number, s: any): void;
  extend(count: number): void;
}

class AggrowColumnBase {
  name: string;

  constructor(def: AggrowColumnDef) {
    this.name = def.name;
  }
}

export class AggrowStringColumn extends AggrowColumnBase {
  strings: StringInterner;
  data: Int32Array = new Int32Array(0);

  constructor(def: AggrowStringColumnDef) {
    super(def);
    this.strings = def.strings;
  }

  get(row: number): number {
    return this.data[row];
  }

  insert(row: number, s: string) {
    this.data[row] = this.strings.intern(s);
  }

  extend(count: number) {
    const newData = new Int32Array(this.data.length + count);
    newData.set(this.data);
    this.data = newData;
  }
}

export class AggrowIntColumn extends AggrowColumnBase {
  data: Int32Array = new Int32Array(0);

  get(row: number): number {
    return this.data[row];
  }

  insert(row: number, i: number) {
    this.data[row] = i;
  }

  extend(count: number) {
    const newData = new Int32Array(this.data.length + count);
    newData.set(this.data);
    this.data = newData;
  }
}

export class AggrowDoubleColumn extends AggrowColumnBase {
  data: Float64Array = new Float64Array(0);

  get(row: number): number {
    return this.data[row];
  }

  insert(row: number, d: number) {
    this.data[row] = d;
  }

  extend(count: number) {
    const newData = new Float64Array(this.data.length + count);
    newData.set(this.data);
    this.data = newData;
  }
}

export class AggrowStackColumn extends AggrowColumnBase {
  data: Int32Array = new Int32Array(0);
  stacks: StackRegistry;
  getter: FrameGetter;
  formatter: FrameFormatter;

  constructor(def: AggrowStackColumnDef) {
    super(def);
    this.stacks = def.stacks;
    this.getter = def.getter;
    this.formatter = def.formatter;
  }

  get(row: number): number {
    return this.data[row];
  }

  insert(row: number, s: Stack) {
    this.data[row] = s.id;
  }

  extend(count: number) {
    const newData = new Int32Array(this.data.length + count);
    newData.set(this.data);
    this.data = newData;
  }
}

function newColumn(def: AggrowColumnDef): AggrowColumn {
  switch (def.type) {
    case 'string':
      return new AggrowStringColumn(def);
    case 'int':
      return new AggrowIntColumn(def);
    case 'double':
      return new AggrowDoubleColumn(def);
    case 'stack':
      return new AggrowStackColumn(def);
    default:
      throw new Error(`Unknown column type: ${def.type}`);
  }
}

export default class AggrowData {
  columns: Array<AggrowColumn>;
  rowCount = 0;

  constructor(columnDefs: Array<AggrowColumnDef>) {
    this.columns = columnDefs.map(newColumn);
  }

  rowInserter(numRows: number): RowInserter {
    const columns = this.columns;
    columns.forEach((c: AggrowColumn): void => c.extend(numRows));
    const currRow = this.rowCount;
    const endRow = currRow + numRows;
    this.rowCount = endRow;

    return new RowInserter(columns, { currRow, endRow });
  }

  getColumn(name: string): ?AggrowColumn {
    return this.columns.find((c: AggrowColumn): boolean => c.name === name);
  }

  flattenStacks() {
    this.columns.forEach((c: AggrowColumn) => {
      if (c instanceof AggrowStackColumn) {
        c.stacks.flatten();
      }
    });
  }
}

class RowInserter {
  columns: Array<AggrowColumn>;
  currRow: number;
  endRow: number;

  constructor(
      columns: Array<AggrowColumn>,
      params: { currRow: number, endRow: number }) {
    this.columns = columns;
    this.currRow = params.currRow;
    this.endRow = params.endRow;
  }

  insertRow(...args: Array<number | string | Stack>) {
    invariant(this.currRow < this.endRow, 'Tried to insert data off end of added range!');
    invariant(
      args.length === this.columns.length,
      `Expected data for ${this.columns.length} columns, got ${args.length} columns`);

    args.forEach((arg: number | string | Stack, i: number): void =>
      this.columns[i].insert(this.currRow, arg));
    this.currRow += 1;
  }

  done() {
    invariant(this.currRow === this.endRow, 'Unfilled rows!');
  }
}
