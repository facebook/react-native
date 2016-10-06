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
/*global React ReactDOM Table stringInterner stackRegistry aggrow preLoadedCapture:true*/

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

function captureRegistry() {
  const strings = stringInterner();
  const stacks = stackRegistry(strings);
  const data = new Int32Array(0);

  const idField = 0;
  const typeField = 1;
  const sizeField = 2;
  const traceField = 3;
  const pathField = 4;
  const reactField = 5;
  const valueField = 6;
  const moduleField = 7;
  const numFields = 8;

  return {
    strings: strings,
    stacks: stacks,
    data: data,
    register: function registerCapture(captureId, capture) {
      // NB: capture.refs is potentially VERY large, so we try to avoid making
      // copies, even of iteration is a bit more annoying.
      let rowCount = 0;
      for (const id in capture.refs) { // eslint-disable-line no-unused-vars
        rowCount++;
      }
      for (const id in capture.markedBlocks) { // eslint-disable-line no-unused-vars
        rowCount++;
      }
      console.log(
        'increasing row data from ' + (this.data.length * 4).toString() + 'B to ' +
        (this.data.length * 4 + rowCount * numFields * 4).toString() + 'B'
      );
      const newData = new Int32Array(this.data.length + rowCount * numFields);
      newData.set(data);
      let dataOffset = this.data.length;
      this.data = null;

      registerPathToRoot(capture.refs, this.stacks, this.strings);
      const internedCaptureId = this.strings.intern(captureId);
      const noneString = this.strings.intern('#none');
      const noneStack = this.stacks.insert(this.stacks.root, noneString);
      forEachRef(capture.refs, (visitor) => {
        const ref = visitor.getRef();
        const id = visitor.id;
        newData[dataOffset + idField] = parseInt(id, 16);
        newData[dataOffset + typeField] = this.strings.intern(ref.type);
        newData[dataOffset + sizeField] = ref.size;
        newData[dataOffset + traceField] = internedCaptureId;
        if (ref.rootPath === undefined) {
          newData[dataOffset + pathField] = noneStack.id;
        } else {
          newData[dataOffset + pathField] = ref.rootPath.id;
        }
        if (ref.reactTree === undefined) {
          newData[dataOffset + reactField] = noneStack.id;
        } else {
          newData[dataOffset + reactField] = ref.reactTree.id;
        }
        newData[dataOffset + valueField] = this.strings.intern(visitor.getValue());
        if (ref.module) {
          newData[dataOffset + moduleField] = this.strings.intern(ref.module);
        } else {
          newData[dataOffset + moduleField] = noneString;
        }
        dataOffset += numFields;
      });
      for (const id in capture.markedBlocks) {
        const block = capture.markedBlocks[id];
        newData[dataOffset + idField] = parseInt(id, 16);
        newData[dataOffset + typeField] = this.strings.intern('Marked Block Overhead');
        newData[dataOffset + sizeField] = block.capacity - block.size;
        newData[dataOffset + traceField] = internedCaptureId;
        newData[dataOffset + pathField] = noneStack.id;
        newData[dataOffset + reactField] = noneStack.id;
        newData[dataOffset + valueField] = this.strings.intern(
          'capacity: ' + block.capacity +
          ', size: ' + block.size +
          ', granularity: ' + block.cellSize
        );
        newData[dataOffset + moduleField] = noneString;
        dataOffset += numFields;
      }
      this.data = newData;
    },
    getAggrow: function getAggrow() {
      const agStrings = this.strings;
      const agStacks = this.stacks.flatten();
      const agData = this.data;
      const agNumRows = agData.length / numFields;
      const ag = new aggrow(agNumRows);

      ag.addFieldExpander('Id',
        function getId(row) {
          let id = agData[row * numFields + idField];
          if (id < 0) {
            id += 0x100000000; // data is int32, id is uint32
          }
          return '0x' + id.toString(16);
        },
        function compareAddress(rowA, rowB) {
          return agData[rowA * numFields + idField] - agData[rowB * numFields + idField];
        });

      const typeExpander = ag.addFieldExpander('Type',
        function getType(row) { return agStrings.get(agData[row * numFields + typeField]); },
        function compareType(rowA, rowB) {
          return agData[rowA * numFields + typeField] - agData[rowB * numFields + typeField];
        });

      ag.addFieldExpander('Size',
        function getSize(row) { return agData[row * numFields + sizeField].toString(); },
        function compareSize(rowA, rowB) {
          return agData[rowA * numFields + sizeField] - agData[rowB * numFields + sizeField];
        });

      ag.addFieldExpander('Trace',
        function getSize(row) { return agStrings.get(agData[row * numFields + traceField]); },
        function compareSize(rowA, rowB) {
          return agData[rowA * numFields + traceField] - agData[rowB * numFields + traceField];
        });

      const pathExpander = ag.addCalleeStackExpander(
        'Path',
        agStacks.maxDepth,
        function getStack(row) { return agStacks.get(agData[row * numFields + pathField]); },
        function getFrame(id) { return agStrings.get(id); },
      );

      const reactExpander = ag.addCalleeStackExpander(
        'React Tree',
        agStacks.maxDepth,
        function getStack(row) { return agStacks.get(agData[row * numFields + reactField]); },
        function getFrame(id) { return agStrings.get(id); },
      );

      const valueExpander = ag.addFieldExpander('Value',
        function getValue(row) { return agStrings.get(agData[row * numFields + valueField]); },
        function compareValue(rowA, rowB) {
          return agData[rowA * numFields + valueField] - agData[rowB * numFields + valueField];
        });

      const moduleExpander = ag.addFieldExpander('Module',
        function getModule(row) { return agStrings.get(agData[row * numFields + moduleField]); },
        function compareModule(rowA, rowB) {
          return agData[rowA * numFields + moduleField] - agData[rowB * numFields + moduleField];
        });

      const sizeAggregator = ag.addAggregator('Size',
        function aggregateSize(indices) {
          let size = 0;
          for (let i = 0; i < indices.length; i++) {
            const row = indices[i];
            size += agData[row * numFields + sizeField];
          }
          return size;
        },
        function formatSize(value) { return value.toString(); },
        function sortSize(a, b) { return b - a; } );

      const countAggregator = ag.addAggregator('Count',
        function aggregateCount(indices) {
          return indices.length;
        },
        function formatCount(value) { return value.toString(); },
        function sortCount(a, b) { return b - a; } );

      ag.setActiveExpanders([
        pathExpander,
        reactExpander,
        moduleExpander,
        typeExpander,
        valueExpander,
      ]);
      ag.setActiveAggregators([sizeAggregator, countAggregator]);
      return ag;
    },
  };
}

if (preLoadedCapture) {
  const r = new captureRegistry();
  r.register('trace', preLoadedCapture);
  preLoadedCapture = undefined; // let GG clean up the capture
  ReactDOM.render(<Table aggrow={r.getAggrow()} />, document.body);
}
