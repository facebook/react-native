/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';
/*eslint no-bitwise: "off"*/
/*eslint no-console-disallow: "off"*/

// TODO: future features
// put in a module.exports
// filtering / search
// pivot around frames in the middle of a stack by callers / callees
// graphing?

function stringInterner() { // eslint-disable-line no-unused-vars
  const strings = [];
  const ids = {};
  return {
    intern: function internString(s) {
      const find = ids[s];
      if (find === undefined) {
        const id = strings.length;
        ids[s] = id;
        strings.push(s);
        return id;
      } else {
        return find;
      }
    },
    get: function getString(id) {
      return strings[id];
    },
  };
}

function stackData(stackIdMap, maxDepth) { // eslint-disable-line no-unused-vars
  return {
    maxDepth: maxDepth,
    get: function getStack(id) {
      return stackIdMap[id];
    },
  };
}

function stackRegistry(interner) { // eslint-disable-line no-unused-vars
  return {
    root: { id: 0 },
    nodeCount: 1,
    insert: function insertNode(parent, label) {
      const labelId = interner.intern(label);
      let node = parent[labelId];
      if (node === undefined) {
        node = { id: this.nodeCount };
        this.nodeCount++;
        parent[labelId] = node;
      }
      return node;
    },
    flatten: function flattenStacks() {
      let stackFrameCount = 0;
      function countStacks(tree, depth) {
        let leaf = true;
        for (const frameId in tree) {
          if (frameId !== 'id') {
            leaf = countStacks(tree[frameId], depth + 1);
          }
        }
        if (leaf) {
          stackFrameCount += depth;
        }
        return false;
      }
      countStacks(this.root, 0);
      console.log('size needed to store stacks: ' + (stackFrameCount * 4).toString() + 'B');
      const stackIdMap = new Array(this.nodeCount);
      const stackArray = new Int32Array(stackFrameCount);
      let maxStackDepth = 0;
      stackFrameCount = 0;
      function flattenStacksImpl(tree, stack) {
        let childStack;
        maxStackDepth = Math.max(maxStackDepth, stack.length);
        for (const frameId in tree) {
          if (frameId !== 'id') {
            stack.push(Number(frameId));
            childStack = flattenStacksImpl(tree[frameId], stack);
            stack.pop();
          }
        }

        const id = tree.id;
        if (id < 0 || id >= stackIdMap.length || stackIdMap[id] !== undefined) {
          throw 'invalid stack id!';
        }

        if (childStack !== undefined) {
          // each child must have our stack as a prefix, so just use that
          stackIdMap[id] = childStack.subarray(0, stack.length);
        } else {
          const newStack = stackArray.subarray(stackFrameCount, stackFrameCount + stack.length);
          stackFrameCount += stack.length;
          for (let i = 0; i < stack.length; i++) {
            newStack[i] = stack[i];
          }
          stackIdMap[id] = newStack;
        }
        return stackIdMap[id];
      }
      flattenStacksImpl(this.root, []);

      return new stackData(stackIdMap, maxStackDepth);
    },
  };
}

function aggrow(strings, stacks, numRows) { // eslint-disable-line no-unused-vars
  // expander ID definitions
  const FIELD_EXPANDER_ID_MIN       = 0x0000;
  const FIELD_EXPANDER_ID_MAX       = 0x7fff;
  const STACK_EXPANDER_ID_MIN       = 0x8000;
  const STACK_EXPANDER_ID_MAX       = 0xffff;

  // used for row.expander which reference state.activeExpanders (with frame index masked in)
  const INVALID_ACTIVE_EXPANDER     = -1;
  const ACTIVE_EXPANDER_MASK        = 0xffff;
  const ACTIVE_EXPANDER_FRAME_SHIFT = 16;

  // aggregator ID definitions
  const AGGREGATOR_ID_MAX           = 0xffff;

  // active aggragators can have sort order changed in the reference
  const ACTIVE_AGGREGATOR_MASK      = 0xffff;
  const ACTIVE_AGGREGATOR_ASC_BIT   = 0x10000;

  // tree node state definitions
  const NODE_EXPANDED_BIT           = 0x0001; // this row is expanded
  const NODE_REAGGREGATE_BIT        = 0x0002; // children need aggregates
  const NODE_REORDER_BIT            = 0x0004; // children need to be sorted
  const NODE_REPOSITION_BIT         = 0x0008; // children need position
  const NODE_INDENT_SHIFT           = 16;

  function calleeFrameGetter(stack, depth) {
    return stack[depth];
  }

  function callerFrameGetter(stack, depth) {
    return stack[stack.length - depth - 1];
  }

  function createStackComparers(stackGetter, frameGetter) {
    const comparers = new Array(stacks.maxDepth);
    for (let depth = 0; depth < stacks.maxDepth; depth++) {
      const captureDepth = depth; // NB: to capture depth per loop iteration
      comparers[depth] = function calleeStackComparer(rowA, rowB) {
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
        return frameGetter(a, captureDepth) - frameGetter(b, captureDepth);
      };
    }
    return comparers;
  }

  function createTreeNode(parent, label, indices, expander) {
    const indent = parent === null ? 0 : (parent.state >>> NODE_INDENT_SHIFT) + 1;
    const state = NODE_REPOSITION_BIT |
      NODE_REAGGREGATE_BIT |
      NODE_REORDER_BIT |
      (indent << NODE_INDENT_SHIFT);
    return {
      parent: parent,     // null if root
      children: null,     // array of children nodes
      label: label,       // string to show in UI
      indices: indices,   // row indices under this node
      aggregates: null,   // result of aggregate on indices
      expander: expander, // index into state.activeExpanders
      top: 0,             // y position of top row (in rows)
      height: 1,          // number of rows including children
      state: state,       // see NODE_* definitions above
    };
  }

  function noSortOrder(a, b) {
    return 0;
  }

  const indices = new Int32Array(numRows);
  for (let i = 0; i < numRows; i++) {
    indices[i] = i;
  }

  const state = {
    fieldExpanders: [],     // tree expanders that expand on simple values
    stackExpanders: [],     // tree expanders that expand stacks
    activeExpanders: [],    // index into field or stack expanders, hierarchy of tree
    aggregators: [],        // all available aggregators, might not be used
    activeAggregators: [],  // index into aggregators, to actually compute
    sorter: noSortOrder,    // compare function that uses sortOrder to sort row.children
    root: createTreeNode(null, '<root>', indices, INVALID_ACTIVE_EXPANDER),
  };

  function evaluateAggregate(row) {
    const activeAggregators = state.activeAggregators;
    const aggregates = new Array(activeAggregators.length);
    for (let j = 0; j < activeAggregators.length; j++) {
      const aggregator = state.aggregators[activeAggregators[j]];
      aggregates[j] = aggregator.aggregator(row.indices);
    }
    row.aggregates = aggregates;
    row.state |= NODE_REAGGREGATE_BIT;
  }

  function evaluateAggregates(row) {
    if ((row.state & NODE_EXPANDED_BIT) !== 0) {
      const children = row.children;
      for (let i = 0; i < children.length; i++) {
        evaluateAggregate(children[i]);
      }
      row.state |= NODE_REORDER_BIT;
    }
    row.state ^= NODE_REAGGREGATE_BIT;
  }

  function evaluateOrder(row) {
    if ((row.state & NODE_EXPANDED_BIT) !== 0) {
      const children = row.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        child.state |= NODE_REORDER_BIT;
      }
      children.sort(state.sorter);
      row.state |= NODE_REPOSITION_BIT;
    }
    row.state ^= NODE_REORDER_BIT;
  }

  function evaluatePosition(row) {
    if ((row.state & NODE_EXPANDED_BIT) !== 0) {
      const children = row.children;
      let childTop = row.top + 1;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.top !== childTop) {
          child.top = childTop;
          child.state |= NODE_REPOSITION_BIT;
        }
        childTop += child.height;
      }
    }
    row.state ^= NODE_REPOSITION_BIT;
  }

  function getRowsImpl(row, top, height, result) {
    if ((row.state & NODE_REAGGREGATE_BIT) !== 0) {
      evaluateAggregates(row);
    }
    if ((row.state & NODE_REORDER_BIT) !== 0) {
      evaluateOrder(row);
    }
    if ((row.state & NODE_REPOSITION_BIT) !== 0) {
      evaluatePosition(row);
    }

    if (row.top >= top && row.top < top + height) {
      if (result[row.top - top] != null) {
        throw 'getRows put more than one row at position ' + row.top + ' into result';
      }
      result[row.top - top] = row;
    }
    if ((row.state & NODE_EXPANDED_BIT) !== 0) {
      const children = row.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.top < top + height && top < child.top + child.height) {
          getRowsImpl(child, top, height, result);
        }
      }
    }
  }

  function updateHeight(row, heightChange) {
    while (row !== null) {
      row.height += heightChange;
      row.state |= NODE_REPOSITION_BIT;
      row = row.parent;
    }
  }

  function addChildrenWithFieldExpander(row, expander, nextActiveIndex) {
    const rowIndices = row.indices;
    const comparer = expander.comparer;
    rowIndices.sort(comparer);
    let begin = 0;
    let end = 1;
    row.children = [];
    while (end < rowIndices.length) {
      if (comparer(rowIndices[begin], rowIndices[end]) !== 0) {
        row.children.push(createTreeNode(
          row,
          expander.name + ': ' + expander.formatter(rowIndices[begin]),
          rowIndices.subarray(begin, end),
          nextActiveIndex));
        begin = end;
      }
      end++;
    }
    row.children.push(createTreeNode(
      row,
      expander.name + ': ' + expander.formatter(rowIndices[begin]),
      rowIndices.subarray(begin, end),
      nextActiveIndex));
  }

  function addChildrenWithStackExpander(row, expander, activeIndex, depth, nextActiveIndex) {
    const rowIndices = row.indices;
    const stackGetter = expander.stackGetter;
    const frameGetter = expander.frameGetter;
    const comparer = expander.comparers[depth];
    const expandNextFrame = activeIndex | ((depth + 1) << ACTIVE_EXPANDER_FRAME_SHIFT);
    rowIndices.sort(comparer);
    let columnName = '';
    if (depth === 0) {
      columnName = expander.name + ': ';
    }

    // put all the too-short stacks under <exclusive>
    let begin = 0;
    let beginStack = null;
    row.children = [];
    while (begin < rowIndices.length) {
      beginStack = stackGetter(rowIndices[begin]);
      if (beginStack.length > depth) {
        break;
      }
      begin++;
    }
    if (begin > 0) {
      row.children.push(createTreeNode(
        row,
        columnName + '<exclusive>',
        rowIndices.subarray(0, begin),
        nextActiveIndex));
    }
    // aggregate the rest under frames
    if (begin < rowIndices.length) {
      let end = begin + 1;
      while (end < rowIndices.length) {
        const endStack = stackGetter(rowIndices[end]);
        if (frameGetter(beginStack, depth) !== frameGetter(endStack, depth)) {
          row.children.push(createTreeNode(
            row,
            columnName + strings.get(frameGetter(beginStack, depth)),
            rowIndices.subarray(begin, end),
            expandNextFrame));
          begin = end;
          beginStack = endStack;
        }
        end++;
      }
      row.children.push(createTreeNode(
        row,
        columnName + strings.get(frameGetter(beginStack, depth)),
        rowIndices.subarray(begin, end),
        expandNextFrame));
    }
  }

  function contractRow(row) {
      if ((row.state & NODE_EXPANDED_BIT) === 0) {
        throw 'can not contract row, already contracted';
      }
      row.state ^= NODE_EXPANDED_BIT;
      const heightChange = 1 - row.height;
      updateHeight(row, heightChange);
  }

  function pruneExpanders(row, oldExpander, newExpander) {
    row.state |= NODE_REPOSITION_BIT;
    if (row.expander === oldExpander) {
      row.state |= NODE_REAGGREGATE_BIT | NODE_REORDER_BIT | NODE_REPOSITION_BIT;
      if ((row.state & NODE_EXPANDED_BIT) !== 0) {
        contractRow(row);
      }
      row.children = null;
      row.expander = newExpander;
    } else {
      row.state |= NODE_REPOSITION_BIT;
      const children = row.children;
      if (children != null) {
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          pruneExpanders(child, oldExpander, newExpander);
        }
      }
    }
  }

  return {
    addFieldExpander: function addFieldExpander(name, formatter, comparer) {
      if (FIELD_EXPANDER_ID_MIN + state.fieldExpanders.length >= FIELD_EXPANDER_ID_MAX) {
        throw 'too many field expanders!';
      }
      state.fieldExpanders.push({
        name: name, // name for column
        formatter: formatter, // row index -> display string
        comparer: comparer, // compares by two row indices
      });
      return FIELD_EXPANDER_ID_MIN + state.fieldExpanders.length - 1;
    },
    addCalleeStackExpander: function addCalleeStackExpander(name, stackGetter) {
      if (STACK_EXPANDER_ID_MIN + state.fieldExpanders.length >= STACK_EXPANDER_ID_MAX) {
        throw 'too many stack expanders!';
      }
      state.stackExpanders.push({
        name: name, // name for column
        stackGetter: stackGetter, // row index -> stack array
        comparers: createStackComparers(stackGetter, calleeFrameGetter),  // depth -> comparer
        frameGetter: calleeFrameGetter, // (stack, depth) -> string id
      });
      return STACK_EXPANDER_ID_MIN + state.stackExpanders.length - 1;
    },
    addCallerStackExpander: function addCallerStackExpander(name, stackGetter) {
      if (STACK_EXPANDER_ID_MIN + state.fieldExpanders.length >= STACK_EXPANDER_ID_MAX) {
        throw 'too many stack expanders!';
      }
      state.stackExpanders.push({
        name: name,
        stackGetter: stackGetter,
        comparers: createStackComparers(stackGetter, callerFrameGetter),
        frameGetter: callerFrameGetter,
      });
      return STACK_EXPANDER_ID_MIN + state.stackExpanders.length - 1;
    },
    getExpanders: function getExpanders() {
      const expanders = [];
      for (let i = 0; i < state.fieldExpanders.length; i++) {
        expanders.push(FIELD_EXPANDER_ID_MIN + i);
      }
      for (let i = 0; i < state.stackExpanders.length; i++) {
        expanders.push(STACK_EXPANDER_ID_MIN + i);
      }
      return expanders;
    },
    getExpanderName: function getExpanderName(id) {
      if (id >= FIELD_EXPANDER_ID_MIN && id <= FIELD_EXPANDER_ID_MAX) {
        return state.fieldExpanders[id - FIELD_EXPANDER_ID_MIN].name;
      } else if (id >= STACK_EXPANDER_ID_MIN && id <= STACK_EXPANDER_ID_MAX) {
        return state.stackExpanders[id - STACK_EXPANDER_ID_MIN].name;
      }
      throw 'Unknown expander ID ' + id.toString();
    },
    setActiveExpanders: function setActiveExpanders(ids) {
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        if (id >= FIELD_EXPANDER_ID_MIN && id <= FIELD_EXPANDER_ID_MAX) {
          if (id - FIELD_EXPANDER_ID_MIN >= state.fieldExpanders.length) {
            throw 'field expander for id ' + id.toString() + ' does not exist!';
          }
        } else if (id >= STACK_EXPANDER_ID_MIN && id <= STACK_EXPANDER_ID_MAX) {
          if (id - STACK_EXPANDER_ID_MIN >= state.stackExpanders.length) {
            throw 'stack expander for id ' + id.toString() + ' does not exist!';
          }
        }
      }
      for (let i = 0; i < ids.length; i++) {
        if (state.activeExpanders.length <= i) {
          pruneExpanders(state.root, INVALID_ACTIVE_EXPANDER, i);
          break;
        } else if (ids[i] !== state.activeExpanders[i]) {
          pruneExpanders(state.root, i, i);
          break;
        }
      }
      // TODO: if ids is prefix of activeExpanders, we need to make an expander invalid
      state.activeExpanders = ids.slice();
    },
    getActiveExpanders: function getActiveExpanders() {
      return state.activeExpanders.slice();
    },
    addAggregator: function addAggregator(name, aggregator, formatter, sorter) {
      if (state.aggregators.length >= AGGREGATOR_ID_MAX) {
        throw 'too many aggregators!';
      }
      state.aggregators.push({
        name: name,             // name for column
        aggregator: aggregator, // index array -> aggregate value
        formatter: formatter,   // aggregate value -> display string
        sorter: sorter,         // compare two aggregate values
      });
      return state.aggregators.length - 1;
    },
    getAggregators: function getAggregators() {
      const aggregators = [];
      for (let i = 0; i < state.aggregators.length; i++) {
        aggregators.push(i);
      }
      return aggregators;
    },
    getAggregatorName: function getAggregatorName(id) {
      return state.aggregators[id & ACTIVE_AGGREGATOR_MASK].name;
    },
    setActiveAggregators: function setActiveAggregators(ids) {
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i] & ACTIVE_AGGREGATOR_MASK;
        if (id < 0 || id > state.aggregators.length) {
          throw 'aggregator id ' + id.toString() + ' not valid';
        }
      }
      state.activeAggregators = ids.slice();
      // NB: evaluate root here because dirty bit is for children
      // so someone has to start with root, and it might as well be right away
      evaluateAggregate(state.root);
      let sorter = noSortOrder;
      for (let i = ids.length - 1; i >= 0; i--) {
        const ascending = (ids[i] & ACTIVE_AGGREGATOR_ASC_BIT) !== 0;
        const id = ids[i] & ACTIVE_AGGREGATOR_MASK;
        const comparer = state.aggregators[id].sorter;
        const captureSorter = sorter;
        const captureIndex = i;
        sorter = function (a, b) {
          const c = comparer(a.aggregates[captureIndex], b.aggregates[captureIndex]);
          if (c === 0) {
            return captureSorter(a, b);
          }
          return ascending ? -c : c;
        };
      }
      state.sorter = sorter;
      state.root.state |= NODE_REORDER_BIT;
    },
    getActiveAggregators: function getActiveAggregators() {
      return state.activeAggregators.slice();
    },
    getRows: function getRows(top, height) {
      const result = new Array(height);
      for (let i = 0; i < height; i++) {
        result[i] = null;
      }
      getRowsImpl(state.root, top, height, result);
      return result;
    },
    getRowLabel: function getRowLabel(row) {
      return row.label;
    },
    getRowIndent: function getRowIndent(row) {
      return row.state >>> NODE_INDENT_SHIFT;
    },
    getRowAggregate: function getRowAggregate(row, index) {
      const aggregator = state.aggregators[state.activeAggregators[index]];
      return aggregator.formatter(row.aggregates[index]);
    },
    getHeight: function getHeight() {
      return state.root.height;
    },
    canExpand: function canExpand(row) {
      return (row.state & NODE_EXPANDED_BIT) === 0 && (row.expander !== INVALID_ACTIVE_EXPANDER);
    },
    canContract: function canContract(row) {
      return (row.state & NODE_EXPANDED_BIT) !== 0;
    },
    expand: function expand(row) {
      if ((row.state & NODE_EXPANDED_BIT) !== 0) {
        throw 'can not expand row, already expanded';
      }
      if (row.height !== 1) {
        throw 'unexpanded row has height ' + row.height.toString() + ' != 1';
      }
      if (row.children === null) {  // first expand, generate children
        const activeIndex = row.expander & ACTIVE_EXPANDER_MASK;
        let nextActiveIndex = activeIndex + 1;  // NB: if next is stack, frame is 0
        if (nextActiveIndex >= state.activeExpanders.length) {
          nextActiveIndex = INVALID_ACTIVE_EXPANDER;
        }
        if (activeIndex >= state.activeExpanders.length) {
          throw 'invalid active expander index ' + activeIndex.toString();
        }
        const exId = state.activeExpanders[activeIndex];
        if (exId >= FIELD_EXPANDER_ID_MIN &&
            exId < FIELD_EXPANDER_ID_MIN + state.fieldExpanders.length) {
          const expander = state.fieldExpanders[exId - FIELD_EXPANDER_ID_MIN];
          addChildrenWithFieldExpander(row, expander, nextActiveIndex);
        } else if (exId >= STACK_EXPANDER_ID_MIN &&
            exId < STACK_EXPANDER_ID_MIN + state.stackExpanders.length) {
          const depth = row.expander >>> ACTIVE_EXPANDER_FRAME_SHIFT;
          const expander = state.stackExpanders[exId - STACK_EXPANDER_ID_MIN];
          addChildrenWithStackExpander(row, expander, activeIndex, depth, nextActiveIndex);
        } else {
          throw 'state.activeIndex ' + activeIndex.toString()
            + ' has invalid expander' + exId.toString();
        }
      }
      row.state |= NODE_EXPANDED_BIT
        | NODE_REAGGREGATE_BIT | NODE_REORDER_BIT | NODE_REPOSITION_BIT;
      let heightChange = 0;
      for (let i = 0; i < row.children.length; i++) {
        heightChange += row.children[i].height;
      }
      updateHeight(row, heightChange);
      // if children only contains one node, then expand it as well
      if (row.children.length === 1 && this.canExpand(row.children[0])) {
        this.expand(row.children[0]);
      }
    },
    contract: function contract(row) {
      contractRow(row);
    },
  };
}
