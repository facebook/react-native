/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';
/*eslint no-console-disallow: "off"*/
/*global React ReactDOM Table StringInterner StackRegistry AggrowData Aggrow preLoadedCapture:true*/

function RefVisitor(refs, id) {
  this.refs = refs;
  this.id = id;
}

RefVisitor.prototype = {
  moveToEdge: function moveToEdge(name) {
    const ref = this.refs[this.id];
    if (ref && ref.edges) {
      const edges = ref.edges;
      for (const edgeId in edges) {
        if (edges[edgeId] === name) {
          this.id = edgeId;
          return this;
        }
      }
    }
    this.id = undefined;
    return this;
  },
  moveToFirst: function moveToFirst(callback) {
    const ref = this.refs[this.id];
    if (ref && ref.edges) {
      const edges = ref.edges;
      for (const edgeId in edges) {
        this.id = edgeId;
        if (callback(edges[edgeId], this)) {
          return this;
        }
      }
    }
    this.id = undefined;
    return this;
  },
  forEachEdge: function forEachEdge(callback) {
    const ref = this.refs[this.id];
    if (ref && ref.edges) {
      const edges = ref.edges;
      const visitor = new RefVisitor(this.refs, undefined);
      for (const edgeId in edges) {
        visitor.id = edgeId;
        callback(edges[edgeId], visitor);
      }
    }
  },
  getType: function getType() {
    const ref = this.refs[this.id];
    if (ref) {
      return ref.type;
    }
    return undefined;
  },
  getRef: function getRef() {
    return this.refs[this.id];
  },
  clone: function clone() {
    return new RefVisitor(this.refs, this.id);
  },
  isDefined: function isDefined() {
    return !!this.id;
  },
  getValue: function getValue() {
    const ref = this.refs[this.id];
    if (ref) {
      if (ref.type === 'string') {
        if (ref.value) {
          return ref.value;
        } else {
          const rope = [];
          this.forEachEdge((name, visitor) => {
            if (name && name.startsWith('[') && name.endsWith(']')) {
              const index = parseInt(name.substring(1, name.length - 1), 10);
              rope[index] = visitor.getValue();
            }
          });
          return rope.join('');
        }
      } else if (ref.type === 'ScriptExecutable'
              || ref.type === 'EvalExecutable'
              || ref.type === 'ProgramExecutable') {
        return ref.value.url + ':' + ref.value.line + ':' + ref.value.col;
      } else if (ref.type === 'FunctionExecutable') {
        return ref.value.name + '@' + ref.value.url + ':' + ref.value.line + ':' + ref.value.col;
      } else if (ref.type === 'NativeExecutable') {
        return ref.value.function + ' ' + ref.value.constructor + ' ' + ref.value.name;
      } else if (ref.type === 'Function') {
        const executable = this.clone().moveToEdge('@Executable');
        if (executable.id) {
          return executable.getRef().type + ' ' + executable.getValue();
        }
      }
    }
    return '#none';
  }
};

function forEachRef(refs, callback) {
  const visitor = new RefVisitor(refs, undefined);
  for (const id in refs) {
    visitor.id = id;
    callback(visitor);
  }
}

function firstRef(refs, callback) {
  for (const id in refs) {
    const ref = refs[id];
    if (callback(id, ref)) {
      return new RefVisitor(refs, id);
    }
  }
  return new RefVisitor(refs, undefined);
}

function getInternalInstanceName(visitor) {
  const type = visitor.clone().moveToEdge('_currentElement').moveToEdge('type');
  if (type.getType() === 'string') { // element.type is string
    return type.getValue();
  } else if (type.getType() === 'Function') { // element.type is function
    const displayName = type.clone().moveToEdge('displayName');
    if (displayName.isDefined()) {
      return displayName.getValue(); // element.type.displayName
    }
    const name = type.clone().moveToEdge('name');
    if (name.isDefined()) {
      return name.getValue(); // element.type.name
    }
    type.moveToEdge('@Executable');
    if (type.getType() === 'FunctionExecutable') {
      return type.getRef().value.name;  // element.type symbolicated name
    }
  }
  return '#unknown';
}

function buildReactComponentTree(visitor, registry, strings) {
  const ref = visitor.getRef();
  if (ref.reactTree || ref.reactParent === undefined) {
    return; // has one or doesn't need one
  }
  const parentVisitor = ref.reactParent;
  if (parentVisitor === null) {
    ref.reactTree = registry.insert(registry.root, strings.intern(getInternalInstanceName(visitor)));
  } else if (parentVisitor) {
    const parentRef = parentVisitor.getRef();
    buildReactComponentTree(parentVisitor, registry, strings);
    let relativeName = getInternalInstanceName(visitor);
    if (ref.reactKey) {
      relativeName = ref.reactKey + ': ' + relativeName;
    }
    ref.reactTree = registry.insert(parentRef.reactTree, strings.intern(relativeName));
  } else {
    throw 'non react instance parent of react instance';
  }
}

function markReactComponentTree(refs, registry, strings) {
  // annotate all refs that are react internal instances with their parent and name
  // ref.reactParent = visitor that points to parent instance,
  //   null if we know it's an instance, but don't have a parent yet
  // ref.reactKey = if a key is used to distinguish siblings
  forEachRef(refs, (visitor) => {
    const visitorClone = visitor.clone(); // visitor will get stomped on next iteration
    const ref = visitor.getRef();
    visitor.forEachEdge((edgeName, edgeVisitor) => {
      const edgeRef = edgeVisitor.getRef();
      if (edgeRef) {
        if (edgeName === '_renderedChildren') {
          if (ref.reactParent === undefined) {
            // ref is react component, even if we don't have a parent yet
            ref.reactParent = null;
          }
          edgeVisitor.forEachEdge((childName, childVisitor) => {
            const childRef = childVisitor.getRef();
            if (childRef && childName.startsWith('.')) {
              childRef.reactParent = visitorClone;
              childRef.reactKey = childName;
            }
          });
        } else if (edgeName === '_renderedComponent') {
          if (ref.reactParent === undefined) {
            ref.reactParent = null;
          }
          edgeRef.reactParent = visitorClone;
        }
      }
    });
  });
  // build tree of react internal instances (since that's what has the structure)
  // fill in ref.reactTree = path registry node
  forEachRef(refs, (visitor) => {
    buildReactComponentTree(visitor, registry, strings);
  });
  // hook in components by looking at their _reactInternalInstance fields
  forEachRef(refs, (visitor) => {
    const ref = visitor.getRef();
    const instanceRef = visitor.moveToEdge('_reactInternalInstance').getRef();
    if (instanceRef) {
      ref.reactTree = instanceRef.reactTree;
    }
  });
}

function functionUrlFileName(visitor) {
  const executable = visitor.clone().moveToEdge('@Executable');
  const ref = executable.getRef();
  if (ref && ref.value && ref.value.url) {
    const url = ref.value.url;
    let file = url.substring(url.lastIndexOf('/') + 1);
    if (file.endsWith('.js')) {
      file = file.substring(0, file.length - 3);
    }
    return file;
  }
  return undefined;
}

function markModules(refs) {
  const modules = firstRef(refs, (id, ref) => ref.type === 'CallbackGlobalObject');
  modules.moveToEdge('require');
  modules.moveToFirst((name, visitor) => visitor.getType() === 'JSActivation');
  modules.moveToEdge('modules');
  modules.forEachEdge((name, visitor) => {
    const ref = visitor.getRef();
    visitor.moveToEdge('exports');
    if (visitor.getType() === 'Object') {
      visitor.moveToFirst((memberName, member) => member.getType() === 'Function');
      if (visitor.isDefined()) {
        ref.module = functionUrlFileName(visitor);
      }
    } else if (visitor.getType() === 'Function') {
      const displayName = visitor.clone().moveToEdge('displayName');
      if (displayName.isDefined()) {
        ref.module = displayName.getValue();
      }
      ref.module = functionUrlFileName(visitor);
    }
    if (ref && !ref.module) {
      ref.module = '#unknown ' + name;
    }
  });
}

function registerPathToRoot(refs, registry, strings) {
  markReactComponentTree(refs, registry, strings);
  markModules(refs);
  let breadth = [];
  forEachRef(refs, (visitor) => {
    const ref = visitor.getRef();
    if (ref.type === 'CallbackGlobalObject') {
      ref.rootPath = registry.insert(registry.root, strings.intern(ref.type));
      breadth.push(visitor.clone());
    }
  });
  while (breadth.length > 0) {
    const nextBreadth = [];
    for (let i = 0; i < breadth.length; i++) {
      const visitor = breadth[i];
      const ref = visitor.getRef();
      visitor.forEachEdge((edgeName, edgeVisitor) => {
        const edgeRef = edgeVisitor.getRef();
        if (edgeRef && edgeRef.rootPath === undefined) {
          let pathName = edgeRef.type;
          if (edgeName) {
            pathName = edgeName + ': ' + pathName;
          }
          edgeRef.rootPath = registry.insert(ref.rootPath, strings.intern(pathName));
          nextBreadth.push(edgeVisitor.clone());
          // copy module and react tree forward
          if (edgeRef.module === undefined) {
            edgeRef.module = ref.module;
          }
          if (edgeRef.reactTree === undefined) {
            edgeRef.reactTree = ref.reactTree;
          }
        }
      });
    }
    breadth = nextBreadth;
  }
}

function registerCapture(data, captureId, capture, stacks, strings) {
  // NB: capture.refs is potentially VERY large, so we try to avoid making
  // copies, even if iteration is a bit more annoying.
  let rowCount = 0;
  for (const id in capture.refs) { // eslint-disable-line no-unused-vars
    rowCount++;
  }
  for (const id in capture.markedBlocks) { // eslint-disable-line no-unused-vars
    rowCount++;
  }
  const inserter = data.rowInserter(rowCount);
  registerPathToRoot(capture.refs, stacks, strings);
  const noneString = strings.intern('#none');
  const noneStack = stacks.insert(stacks.root, noneString);
  forEachRef(capture.refs, (visitor) => {
    // want to data.append(value, value, value), not IDs
    const ref = visitor.getRef();
    const id = visitor.id;
    inserter.insertRow(
      parseInt(id, 16),
      ref.type,
      ref.size,
      captureId,
      ref.rootPath === undefined ? noneStack : ref.rootPath,
      ref.reactTree === undefined ? noneStack : ref.reactTree,
      visitor.getValue(),
      ref.module === undefined ? '#none' : ref.module,
    );
  });
  for (const id in capture.markedBlocks) {
    const block = capture.markedBlocks[id];
    inserter.insertRow(
      parseInt(id, 16),
      'Marked Block Overhead',
      block.capacity - block.size,
      captureId,
      noneStack,
      noneStack,
      'capacity: ' + block.capacity + ', size: ' + block.size + ', granularity: ' + block.cellSize,
      '#none',
    );
  }
  inserter.done();
}

if (preLoadedCapture) {
  const strings = StringInterner();
  const stacks =  new StackRegistry();
  const columns = [
    { name: 'id', type: 'int' },
    { name: 'type', type: 'string', strings: strings },
    { name: 'size', type: 'int' },
    { name: 'trace', type: 'string', strings: strings },
    { name: 'path', type: 'stack', stacks: stacks },
    { name: 'react', type: 'stack', stacks: stacks },
    { name: 'value', type: 'string', strings: strings },
    { name: 'module', type: 'string', strings: strings },
  ];
  const data = new AggrowData(columns);
  registerCapture(data, 'trace', preLoadedCapture, stacks, strings);
  preLoadedCapture = undefined; // let GG clean up the capture
  const aggrow = new Aggrow(data);
  aggrow.addPointerExpander('Id', 'id');
  const typeExpander = aggrow.addStringExpander('Type', 'type');
  aggrow.addNumberExpander('Size', 'size');
  aggrow.addStringExpander('Trace', 'trace');
  const pathExpander = aggrow.addStackExpander('Path', 'path', strings.get);
  const reactExpander = aggrow.addStackExpander('React Tree', 'react', strings.get);
  const valueExpander = aggrow.addStringExpander('Value', 'value');
  const moduleExpander = aggrow.addStringExpander('Module', 'module');
  aggrow.expander.setActiveExpanders([
    pathExpander,
    reactExpander,
    moduleExpander,
    typeExpander,
    valueExpander,
  ]);
  const sizeAggregator = aggrow.addSumAggregator('Size', 'size');
  const countAggregator = aggrow.addCountAggregator('Count');
  aggrow.expander.setActiveAggregators([
    sizeAggregator,
    countAggregator,
  ]);
  ReactDOM.render(<Table aggrow={aggrow.expander} />, document.body);
}
