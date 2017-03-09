// @flow
import invariant from 'invariant';

import type { FlattenedStack } from './StackRegistry';

// expander ID definitions
const FIELD_EXPANDER_ID_MIN = 0x0000;
const FIELD_EXPANDER_ID_MAX = 0x7fff;
const STACK_EXPANDER_ID_MIN = 0x8000;
const STACK_EXPANDER_ID_MAX = 0xffff;

// used for row.expander which reference state.activeExpanders (with frame index masked in)
const INVALID_ACTIVE_EXPANDER = -1;
const ACTIVE_EXPANDER_MASK = 0xffff;
const ACTIVE_EXPANDER_FRAME_SHIFT = 16;

// aggregator ID definitions
const AGGREGATOR_ID_MAX = 0xffff;

// active aggragators can have sort order changed in the reference
const ACTIVE_AGGREGATOR_MASK = 0xffff;
const ACTIVE_AGGREGATOR_ASC_BIT = 0x10000;

// tree node state definitions
const NODE_EXPANDED_BIT = 0x0001; // this row is expanded
const NODE_REAGGREGATE_BIT = 0x0002; // children need aggregates
const NODE_REORDER_BIT = 0x0004; // children need to be sorted
const NODE_REPOSITION_BIT = 0x0008; // children need position
const NODE_INDENT_SHIFT = 16;

function _calleeFrameIdGetter(stack: FlattenedStack, depth: number): number {
  return stack[depth];
}

function _callerFrameIdGetter(stack: FlattenedStack, depth: number): number {
  return stack[stack.length - depth - 1];
}

function _createStackComparers(
    stackGetter: StackGetter,
    frameIdGetter: FrameIdGetter,
    maxStackDepth: number): Array<Comparer<number>> {
  const comparers = new Array(maxStackDepth);
  for (let depth = 0; depth < maxStackDepth; depth++) {
    const captureDepth = depth; // NB: to capture depth per loop iteration
    comparers[depth] = function calleeStackComparer(rowA: number, rowB: number): number {
      const a = stackGetter(rowA);
      const b = stackGetter(rowB);
      // NB: we put the stacks that are too short at the top,
      // so they can be grouped into the '<exclusive>' bucket
      if (a.length <= captureDepth && b.length <= captureDepth) {
        return 0;
      } else if (a.length <= captureDepth) {
        return -1;
      } else if (b.length <= captureDepth) {
        return 1;
      }
      return frameIdGetter(a, captureDepth) - frameIdGetter(b, captureDepth);
    };
  }
  return comparers;
}

function _createTreeNode(
    parent: Row | null,
    label: string,
    indices: Int32Array,
    expander: number): Row {
  const indent = parent === null ? 0 : (parent.state >>> NODE_INDENT_SHIFT) + 1;  // eslint-disable-line no-bitwise, max-len
  const state = NODE_REPOSITION_BIT |  // eslint-disable-line no-bitwise
    NODE_REAGGREGATE_BIT |
    NODE_REORDER_BIT |
    (indent << NODE_INDENT_SHIFT);  // eslint-disable-line no-bitwise
  return {
    parent,     // null if root
    children: null,     // array of children nodes
    label,       // string to show in UI
    indices,   // row indices under this node
    aggregates: null,   // result of aggregate on indices
    expander, // index into state.activeExpanders
    top: 0,             // y position of top row (in rows)
    height: 1,          // number of rows including children
    state,       // see NODE_* definitions above
  };
}

const NO_SORT_ORDER: Comparer<*> = (): number => 0;

type Comparer<T> = (a: T, b: T) => number;

type Aggregator = {
  name: string,  // name for column
  aggregator: (indexes: Int32Array) => number,  // index array -> aggregate value
  formatter: (value: number) => string,  // aggregate value -> display string
  sorter: Comparer<number>,  // compare two aggregate values
}

type FieldExpander = {
  name: string,
  comparer: Comparer<number>,
  getter: (rowIndex: number) => any,
  formatter: (value: any) => string,
}

type StackGetter = (rowIndex: number) => FlattenedStack;  // (row) => [frameId int]
type FrameIdGetter = (stack: FlattenedStack, depth: number) => number;  // (stack,depth) -> frame id
export type FrameGetter = (id: number) => any;  // (frameId int) => frame obj
export type FrameFormatter = (frame: any) => string;  // (frame obj) => display string

type StackExpander = {
  name: string,  // display name of expander
  comparers: Array<Comparer<number>>,  // depth -> comparer
  stackGetter: StackGetter,
  frameIdGetter: FrameIdGetter,
  frameGetter: FrameGetter,
  frameFormatter: FrameFormatter,
}

export type Row = {
  top: number,
  height: number,
  state: number,
  parent: Row | null,
  indices: Int32Array,
  aggregates: Array<number> | null,
  children: Array<Row> | null,
  expander: number,
  label: string,
}

type State = {
  fieldExpanders: Array<FieldExpander>,  // tree expanders that expand on simple values
  stackExpanders: Array<StackExpander>,  // tree expanders that expand stacks
  activeExpanders: Array<number>,  // index into field or stack expanders, hierarchy of tree
  aggregators: Array<Aggregator>,  // all available aggregators, might not be used
  activeAggregators: Array<number>,  // index into aggregators, to actually compute
  sorter: Comparer<*>,
  root: Row,
}

export default class AggrowExpander { // eslint-disable-line no-unused-vars
  indices: Int32Array;
  state: State;

  constructor(numRows: number) {
    this.indices = new Int32Array(numRows);
    for (let i = 0; i < numRows; i++) {
      this.indices[i] = i;
    }

    this.state = {
      fieldExpanders: [],
      stackExpanders: [],
      activeExpanders: [],
      aggregators: [],
      activeAggregators: [],
      sorter: NO_SORT_ORDER,
      root: _createTreeNode(null, '<root>', this.indices, INVALID_ACTIVE_EXPANDER),
    };
  }

  _evaluateAggregate(row: Row) {
    const activeAggregators = this.state.activeAggregators;
    const aggregates = new Array(activeAggregators.length);
    for (let j = 0; j < activeAggregators.length; j++) {
      const aggregator = this.state.aggregators[activeAggregators[j]];
      aggregates[j] = aggregator.aggregator(row.indices);
    }
    row.aggregates = aggregates;  // eslint-disable-line no-param-reassign
    row.state |= NODE_REAGGREGATE_BIT;  // eslint-disable-line no-bitwise, no-param-reassign
  }

  _evaluateAggregates(row: Row) {
    if ((row.state & NODE_EXPANDED_BIT) !== 0) {  // eslint-disable-line no-bitwise
      const children = row.children;
      invariant(children, 'Expected non-null children');
      for (let i = 0; i < children.length; i++) {
        this._evaluateAggregate(children[i]);
      }
      row.state |= NODE_REORDER_BIT;  // eslint-disable-line no-bitwise, no-param-reassign
    }
    row.state ^= NODE_REAGGREGATE_BIT;  // eslint-disable-line no-bitwise, no-param-reassign
  }

  _evaluateOrder(row: Row) {
    if ((row.state & NODE_EXPANDED_BIT) !== 0) {  // eslint-disable-line no-bitwise
      const children = row.children;
      invariant(children, 'Expected non-null children');
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        child.state |= NODE_REORDER_BIT;  // eslint-disable-line no-bitwise
      }
      children.sort(this.state.sorter);
      row.state |= NODE_REPOSITION_BIT;  // eslint-disable-line no-bitwise, no-param-reassign
    }
    row.state ^= NODE_REORDER_BIT;  // eslint-disable-line no-bitwise, no-param-reassign
  }

  _evaluatePosition(row: Row) {  // eslint-disable-line class-methods-use-this
    if ((row.state & NODE_EXPANDED_BIT) !== 0) {  // eslint-disable-line no-bitwise
      const children = row.children;
      invariant(children, 'Expected a children array');
      let childTop = row.top + 1;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.top !== childTop) {
          child.top = childTop;
          child.state |= NODE_REPOSITION_BIT;  // eslint-disable-line no-bitwise
        }
        childTop += child.height;
      }
    }
    row.state ^= NODE_REPOSITION_BIT;  // eslint-disable-line no-bitwise, no-param-reassign
  }

  _getRowsImpl(row: Row, top: number, height: number, result: Array<Row | null>) {
    if ((row.state & NODE_REAGGREGATE_BIT) !== 0) {  // eslint-disable-line no-bitwise
      this._evaluateAggregates(row);
    }
    if ((row.state & NODE_REORDER_BIT) !== 0) {  // eslint-disable-line no-bitwise
      this._evaluateOrder(row);
    }
    if ((row.state & NODE_REPOSITION_BIT) !== 0) {  // eslint-disable-line no-bitwise
      this._evaluatePosition(row);
    }

    if (row.top >= top && row.top < top + height) {
      invariant(
        result[row.top - top] === null,
        `getRows put more than one row at position ${row.top} into result`);
      result[row.top - top] = row;  // eslint-disable-line no-param-reassign
    }
    if ((row.state & NODE_EXPANDED_BIT) !== 0) {  // eslint-disable-line no-bitwise
      const children = row.children;
      invariant(children, 'Expected non-null children');
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.top < top + height && top < child.top + child.height) {
          this._getRowsImpl(child, top, height, result);
        }
      }
    }
  }

  _updateHeight(row: Row | null, heightChange: number) {  // eslint-disable-line class-methods-use-this, max-len
    while (row !== null) {
      row.height += heightChange;  // eslint-disable-line no-param-reassign
      row.state |= NODE_REPOSITION_BIT;  // eslint-disable-line no-bitwise, no-param-reassign
      row = row.parent;  // eslint-disable-line no-param-reassign
    }
  }

  _addChildrenWithFieldExpander(row: Row, expander: FieldExpander, nextActiveIndex: number) {  // eslint-disable-line class-methods-use-this, max-len
    const rowIndices = row.indices;
    const comparer = expander.comparer;
    const formatter = expander.formatter;
    const getter = expander.getter;
    rowIndices.sort(comparer);
    let begin = 0;
    let end = 1;
    row.children = [];  // eslint-disable-line no-param-reassign
    while (end < rowIndices.length) {
      if (comparer(rowIndices[begin], rowIndices[end]) !== 0) {
        invariant(row.children, 'Expected a children array');
        row.children.push(_createTreeNode(
          row,
          `${expander.name}: ${formatter(getter(rowIndices[begin]))}`,
          rowIndices.subarray(begin, end),
          nextActiveIndex));
        begin = end;
      }
      end += 1;
    }
    row.children.push(_createTreeNode(
      row,
      `${expander.name}: ${formatter(getter(rowIndices[begin]))}`,
      rowIndices.subarray(begin, end),
      nextActiveIndex));
  }

  _addChildrenWithStackExpander(  // eslint-disable-line class-methods-use-this
      row: Row,
      expander: StackExpander,
      activeIndex: number,
      depth: number,
      nextActiveIndex: number) {
    const rowIndices = row.indices;
    const stackGetter = expander.stackGetter;
    const frameIdGetter = expander.frameIdGetter;
    const frameGetter = expander.frameGetter;
    const frameFormatter = expander.frameFormatter;
    const comparer = expander.comparers[depth];
    const expandNextFrame = activeIndex | ((depth + 1) << ACTIVE_EXPANDER_FRAME_SHIFT);  // eslint-disable-line no-bitwise, max-len
    rowIndices.sort(comparer);
    let columnName = '';
    if (depth === 0) {
      columnName = `${expander.name}: `;
    }

    // put all the too-short stacks under <exclusive>
    let begin = 0;
    let beginStack = null;
    row.children = [];  // eslint-disable-line no-param-reassign
    while (begin < rowIndices.length) {
      beginStack = stackGetter(rowIndices[begin]);
      if (beginStack.length > depth) {
        break;
      }
      begin += 1;
    }
    invariant(beginStack !== null, 'Expected beginStack at this point');
    if (begin > 0) {
      row.children.push(_createTreeNode(
        row,
        `${columnName}<exclusive>`,
        rowIndices.subarray(0, begin),
        nextActiveIndex));
    }
    // aggregate the rest under frames
    if (begin < rowIndices.length) {
      let end = begin + 1;
      while (end < rowIndices.length) {
        const endStack = stackGetter(rowIndices[end]);
        if (frameIdGetter(beginStack, depth) !== frameIdGetter(endStack, depth)) {
          invariant(row.children, 'Expected a children array');
          row.children.push(_createTreeNode(
            row,
            columnName + frameFormatter(frameGetter(frameIdGetter(beginStack, depth))),
            rowIndices.subarray(begin, end),
            expandNextFrame));
          begin = end;
          beginStack = endStack;
        }
        end += 1;
      }
      row.children.push(_createTreeNode(
        row,
        columnName + frameFormatter(frameGetter(frameIdGetter(beginStack, depth))),
        rowIndices.subarray(begin, end),
        expandNextFrame));
    }
  }

  _contractRow(row: Row) {
    invariant(
      (row.state & NODE_EXPANDED_BIT) !== 0,  // eslint-disable-line no-bitwise
      'Cannot contract row; already contracted!');
    row.state ^= NODE_EXPANDED_BIT;  // eslint-disable-line no-bitwise, no-param-reassign
    const heightChange = 1 - row.height;
    this._updateHeight(row, heightChange);
  }

  _pruneExpanders(row: Row, oldExpander: number, newExpander: number) {
    row.state |= NODE_REPOSITION_BIT;  // eslint-disable-line no-bitwise, no-param-reassign
    if (row.expander === oldExpander) {
      row.state |= NODE_REAGGREGATE_BIT | NODE_REORDER_BIT | NODE_REPOSITION_BIT;   // eslint-disable-line no-bitwise, no-param-reassign, max-len
      if ((row.state & NODE_EXPANDED_BIT) !== 0) {  // eslint-disable-line no-bitwise
        this._contractRow(row);
      }
      row.children = null;  // eslint-disable-line no-param-reassign
      row.expander = newExpander;  // eslint-disable-line no-param-reassign
    } else {
      row.state |= NODE_REPOSITION_BIT;  // eslint-disable-line no-bitwise, no-param-reassign
      const children = row.children;
      if (children != null) {
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          this._pruneExpanders(child, oldExpander, newExpander);
        }
      }
    }
  }

  addFieldExpander(
    name: string,
    comparer: Comparer<number>,
    getter: (rowIndex: number) => any,
    formatter: (value: any) => string): number {
    invariant(
      FIELD_EXPANDER_ID_MIN + this.state.fieldExpanders.length < FIELD_EXPANDER_ID_MAX,
      'too many field expanders!');
    this.state.fieldExpanders.push({ name, comparer, getter, formatter });
    return FIELD_EXPANDER_ID_MIN + this.state.fieldExpanders.length - 1;
  }

  addStackExpander(
    name: string,
    maxStackDepth: number,
    stackGetter: StackGetter,
    frameGetter: FrameGetter,
    frameFormatter: FrameFormatter,
    reverse: boolean): number {
    invariant(
      STACK_EXPANDER_ID_MIN + this.state.fieldExpanders.length < STACK_EXPANDER_ID_MAX,
      'Too many stack expanders!');
    const idGetter = reverse ? _callerFrameIdGetter : _calleeFrameIdGetter;
    this.state.stackExpanders.push({
      name,
      stackGetter,
      comparers: _createStackComparers(stackGetter, idGetter, maxStackDepth),
      frameIdGetter: idGetter,
      frameGetter,
      frameFormatter,
    });
    return STACK_EXPANDER_ID_MIN + this.state.stackExpanders.length - 1;
  }

  getExpanders(): Array<number> {
    const expanders = [];
    for (let i = 0; i < this.state.fieldExpanders.length; i++) {
      expanders.push(FIELD_EXPANDER_ID_MIN + i);
    }
    for (let i = 0; i < this.state.stackExpanders.length; i++) {
      expanders.push(STACK_EXPANDER_ID_MIN + i);
    }
    return expanders;
  }

  getExpanderName(id: number): string {
    if (id >= FIELD_EXPANDER_ID_MIN && id <= FIELD_EXPANDER_ID_MAX) {
      return this.state.fieldExpanders[id - FIELD_EXPANDER_ID_MIN].name;
    } else if (id >= STACK_EXPANDER_ID_MIN && id <= STACK_EXPANDER_ID_MAX) {
      return this.state.stackExpanders[id - STACK_EXPANDER_ID_MIN].name;
    }
    throw new Error(`Unknown expander ID ${id.toString()}`);
  }

  setActiveExpanders(ids: Array<number>) {
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if (id >= FIELD_EXPANDER_ID_MIN && id <= FIELD_EXPANDER_ID_MAX) {
        invariant(
          id - FIELD_EXPANDER_ID_MIN < this.state.fieldExpanders.length,
          `field expander for id ${id.toString()} does not exist!`);
      } else if (id >= STACK_EXPANDER_ID_MIN && id <= STACK_EXPANDER_ID_MAX) {
        invariant(id - STACK_EXPANDER_ID_MIN < this.state.stackExpanders.length,
          `stack expander for id ${id.toString()} does not exist!`);
      }
    }
    for (let i = 0; i < ids.length; i++) {
      if (this.state.activeExpanders.length <= i) {
        this._pruneExpanders(this.state.root, INVALID_ACTIVE_EXPANDER, i);
        break;
      } else if (ids[i] !== this.state.activeExpanders[i]) {
        this._pruneExpanders(this.state.root, i, i);
        break;
      }
    }
    // TODO: if ids is prefix of activeExpanders, we need to make an expander invalid
    this.state.activeExpanders = ids.slice();
  }

  getActiveExpanders(): Array<number> {
    return this.state.activeExpanders.slice();
  }

  addAggregator(
      name: string,
      aggregator: (indexes: Int32Array) => number,
      formatter: (value: number) => string,
      sorter: Comparer<number>): number {
    invariant(this.state.aggregators.length < AGGREGATOR_ID_MAX, 'too many aggregators!');
    this.state.aggregators.push({ name, aggregator, formatter, sorter });
    return this.state.aggregators.length - 1;
  }

  getAggregators(): Array<number> {
    const aggregators = [];
    for (let i = 0; i < this.state.aggregators.length; i++) {
      aggregators.push(i);
    }
    return aggregators;
  }

  getAggregatorName(id: number): string {
    return this.state.aggregators[id & ACTIVE_AGGREGATOR_MASK].name;  // eslint-disable-line no-bitwise, max-len
  }

  setActiveAggregators(ids: Array<number>) {
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i] & ACTIVE_AGGREGATOR_MASK;  // eslint-disable-line no-bitwise
      invariant(
        id >= 0 && id < this.state.aggregators.length,
        `aggregator id ${id.toString()} not valid`);
    }
    this.state.activeAggregators = ids.slice();
    // NB: evaluate root here because dirty bit is for children
    // so someone has to start with root, and it might as well be right away
    this._evaluateAggregate(this.state.root);
    let sorter = NO_SORT_ORDER;
    for (let i = ids.length - 1; i >= 0; i--) {
      const ascending = (ids[i] & ACTIVE_AGGREGATOR_ASC_BIT) !== 0;  // eslint-disable-line no-bitwise, max-len
      const id = ids[i] & ACTIVE_AGGREGATOR_MASK;  // eslint-disable-line no-bitwise
      const comparer = this.state.aggregators[id].sorter;
      const captureSorter = sorter;
      const captureIndex = i;
      sorter = (a: Row, b: Row): number => {
        invariant(a.aggregates && b.aggregates, 'Expected aggregates.');
        const c = comparer(a.aggregates[captureIndex], b.aggregates[captureIndex]);
        if (c === 0) {
          return captureSorter(a, b);
        }
        return ascending ? -c : c;
      };
    }
    this.state.sorter = sorter;  // eslint-disable-line no-param-reassign
    this.state.root.state |= NODE_REORDER_BIT;  // eslint-disable-line no-bitwise, no-param-reassign
  }

  getActiveAggregators(): Array<number> {
    return this.state.activeAggregators.slice();
  }

  getRows(top: number, height: number): Array<Row | null> {
    const result = new Array(height);
    for (let i = 0; i < height; i++) {
      result[i] = null;
    }
    this._getRowsImpl(this.state.root, top, height, result);
    return result;
  }

  _findRowImpl(fromRow: number, predicate: (row: Row) => boolean, row: Row): number {
    if (row.top > fromRow && predicate(row)) {
      return row.top; // this row is a match!
    }
    
    // remember how to clean up after ourselves so we only expand as little as possible
    const contractChildren = this.canExpand(row);
    const cleanUpChildren = row.children === null;
    if (contractChildren) {
      this.expand(row);
    }

    // evaluate position so we search in the correct order
    if ((row.state & NODE_REAGGREGATE_BIT) !== 0) {  // eslint-disable-line no-bitwise
      this._evaluateAggregates(row);
    }
    if ((row.state & NODE_REORDER_BIT) !== 0) {  // eslint-disable-line no-bitwise
      this._evaluateOrder(row);
    }
    if ((row.state & NODE_REPOSITION_BIT) !== 0) {  // eslint-disable-line no-bitwise
      this._evaluatePosition(row);
    }
    // TODO: encapsulate row state management somewhere so logic can be shared with _getRowsImpl

    // search in children
    const children = row.children;
    if (children !== null) {
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.top + child.height > fromRow) {
          const find = this._findRowImpl(fromRow, predicate, child);
          if (find >= 0) {
            return find;
          }
        }
      }
    }
    // clean up to leave the tree how it was if we didn't find anything
    // this also saves memory
    if (contractChildren) {
      this.contract(row);
    }
    if (cleanUpChildren) {
      row.children = null;
    }
    return -1;
  }

  // findRow - find the first row that matches a predicate
  // parameters
  //  predicate: returns true when row is found
  //  fromRow: start search from after this row index (negative for start at beginning)
  // returns: index of first row that matches, -1 if no match found
  findRow(predicate: (row: Row) => boolean, fromRow: ?number): number {
    return this._findRowImpl(!fromRow ? -1 : fromRow, predicate, this.state.root);
  }

  getRowLabel(row: Row): string {  // eslint-disable-line class-methods-use-this
    return row.label;
  }

  getRowIndent(row: Row): number {  // eslint-disable-line class-methods-use-this
    return row.state >>> NODE_INDENT_SHIFT;  // eslint-disable-line no-bitwise
  }

  getRowExpanderIndex(row: Row): number {  // eslint-disable-line class-methods-use-this
    if (row.parent) {
      return row.parent.expander & ACTIVE_EXPANDER_MASK;  // eslint-disable-line no-bitwise
    }
    return -1;
  }

  getRowExpansionPath(row: Row | null): Array<any> {
    const path = [];
    invariant(row, 'Expected non-null row here');
    const index = row.indices[0];
    row = row.parent;  // eslint-disable-line no-param-reassign
    while (row) {
      const exIndex = row.expander & ACTIVE_EXPANDER_MASK;  // eslint-disable-line no-bitwise
      const exId = this.state.activeExpanders[exIndex];
      if (exId >= FIELD_EXPANDER_ID_MIN &&
          exId < FIELD_EXPANDER_ID_MIN + this.state.fieldExpanders.length) {
        const expander = this.state.fieldExpanders[exId - FIELD_EXPANDER_ID_MIN];  // eslint-disable-line no-bitwise, max-len
        path.push(expander.getter(index));
        row = row.parent;  // eslint-disable-line no-param-reassign
      } else if (exId >= STACK_EXPANDER_ID_MIN &&
          exId < STACK_EXPANDER_ID_MIN + this.state.stackExpanders.length) {
        const expander = this.state.stackExpanders[exId - STACK_EXPANDER_ID_MIN];
        const stackGetter = expander.stackGetter;
        const frameIdGetter = expander.frameIdGetter;
        const frameGetter = expander.frameGetter;
        const stack = [];
        while (row && (row.expander & ACTIVE_EXPANDER_MASK) === exIndex) {  // eslint-disable-line no-bitwise, max-len
          const depth = row.expander >>> ACTIVE_EXPANDER_FRAME_SHIFT;  // eslint-disable-line no-bitwise, max-len
          const rowStack = stackGetter(index);
          if (depth >= rowStack.length) {
            stack.push('<exclusive>');
          } else {
            stack.push(frameGetter(frameIdGetter(rowStack, depth)));
          }
          row = row.parent;  // eslint-disable-line no-param-reassign
        }
        path.push(stack.reverse());
      }
    }
    return path.reverse();
  }

  getRowAggregate(row: Row, index: number): string {
    const aggregator = this.state.aggregators[this.state.activeAggregators[index]];
    invariant(row.aggregates, 'Expected aggregates');
    return aggregator.formatter(row.aggregates[index]);
  }

  getHeight(): number {
    return this.state.root.height;
  }

  canExpand(row: Row): boolean {  // eslint-disable-line class-methods-use-this
    return (row.state & NODE_EXPANDED_BIT) === 0 && (row.expander !== INVALID_ACTIVE_EXPANDER);  // eslint-disable-line no-bitwise, max-len
  }

  canContract(row: Row): boolean {  // eslint-disable-line class-methods-use-this
    return (row.state & NODE_EXPANDED_BIT) !== 0;  // eslint-disable-line no-bitwise
  }

  expand(row: Row) {
    invariant(
      (row.state & NODE_EXPANDED_BIT) === 0,  // eslint-disable-line no-bitwise
      'can not expand row, already expanded');
    invariant(row.height === 1, `unexpanded row has height ${row.height.toString()} != 1`);
    if (row.children === null) {  // first expand, generate children
      const activeIndex = row.expander & ACTIVE_EXPANDER_MASK;  // eslint-disable-line no-bitwise
      let nextActiveIndex = activeIndex + 1;  // NB: if next is stack, frame is 0
      if (nextActiveIndex >= this.state.activeExpanders.length) {
        nextActiveIndex = INVALID_ACTIVE_EXPANDER;
      }
      invariant(
        activeIndex < this.state.activeExpanders.length,
        `invalid active expander index ${activeIndex.toString()}`);
      const exId = this.state.activeExpanders[activeIndex];
      if (exId >= FIELD_EXPANDER_ID_MIN &&
          exId < FIELD_EXPANDER_ID_MIN + this.state.fieldExpanders.length) {
        const expander = this.state.fieldExpanders[exId - FIELD_EXPANDER_ID_MIN];
        this._addChildrenWithFieldExpander(row, expander, nextActiveIndex);
      } else if (exId >= STACK_EXPANDER_ID_MIN &&
          exId < STACK_EXPANDER_ID_MIN + this.state.stackExpanders.length) {
        const depth = row.expander >>> ACTIVE_EXPANDER_FRAME_SHIFT;  // eslint-disable-line no-bitwise, max-len
        const expander = this.state.stackExpanders[exId - STACK_EXPANDER_ID_MIN];
        this._addChildrenWithStackExpander(row, expander, activeIndex, depth, nextActiveIndex);
      } else {
        throw new Error(`state.activeIndex ${activeIndex} has invalid expander${exId}`);
      }
    }
    row.state |= NODE_EXPANDED_BIT | NODE_REAGGREGATE_BIT | NODE_REORDER_BIT | NODE_REPOSITION_BIT;    // eslint-disable-line no-bitwise, no-param-reassign, max-len
    let heightChange = 0;
    invariant(row.children, 'Expected a children array');
    for (let i = 0; i < row.children.length; i++) {
      heightChange += row.children[i].height;
    }
    this._updateHeight(row, heightChange);
    // if children only contains one node, then expand it as well
    invariant(row.children, 'Expected a children array');
    if (row.children.length === 1 && this.canExpand(row.children[0])) {
      this.expand(row.children[0]);
    }
  }

  contract(row: Row) {
    this._contractRow(row);
  }
}
