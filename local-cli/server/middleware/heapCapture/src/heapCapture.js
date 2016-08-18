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

function getTypeName(ref) {
  if (ref.type === 'Function' && !!ref.value) {
    return 'Function ' + ref.value.name;
  }
  return ref.type;
}

function idGetProp(refs, id, prop) {
  const ref = refs[id];
  if (ref && ref.edges) {
    const edges = ref.edges;
    for (const edgeId in edges) {
      if (edges[edgeId] === prop) {
        return edgeId;
      }
    }
  }
  return undefined;
}

function idPropForEach(refs, id, callback) {
  const ref = refs[id];
  if (ref && ref.edges) {
    const edges = ref.edges;
    for (const edgeId in edges) {
      callback(edges[edgeId], edgeId);
    }
  }
}

function getInternalInstanceName(refs, id) {
  const elementId = idGetProp(refs, id, '_currentElement');
  const typeId = idGetProp(refs, elementId, 'type');
  const typeRef = refs[typeId];
  if (typeRef) {
    if (typeRef.type === 'string') {  // element.type is string
      if (typeRef.value) {
        return typeRef.value;
      }
    } else if (typeRef.type === 'Function') { // element.type is function
      const displayNameId = idGetProp(refs, typeId, 'displayName');
      if (displayNameId) {
        const displayNameRef = refs[displayNameId];
        if (displayNameRef && displayNameRef.value) {
          return displayNameRef.value;  // element.type.displayName
        }
      }
      const nameId = idGetProp(refs, typeId, 'name');
      if (nameId) {
        const nameRef = refs[nameId];
        if (nameRef && nameRef.value) {
          return nameRef.value; // element.type.name
        }
      }
      if (typeRef.value && typeRef.value.name) {
        return typeRef.value.name;  // element.type symbolicated function name
      }
    }
  }
  return '#unknown';
}

function registerReactComponentTreeImpl(refs, registry, parents, inEdgeNames, trees, id) {
  if (parents[id] === undefined) {
    // not a component
  } else if (parents[id] === null) {
    trees[id] = registry.insert(registry.root, getInternalInstanceName(refs, id));
  } else {
    const parent = parents[id];
    const inEdgeName = inEdgeNames[id];
    let parentTree = trees[parent];
    if (parentTree === undefined) {
      parentTree = registerReactComponentTreeImpl(
        refs,
        registry,
        parents,
        inEdgeNames,
        trees,
        parent);
    }
    trees[id] = registry.insert(parentTree, inEdgeName);
  }
  return trees[id];
}

// TODO: make it easier to query the heap graph, it's super annoying to deal with edges directly
function registerReactComponentTree(refs, registry) {
  // build list of parents for react interal instances, so we can connect a tree
  const parents = {};
  const inEdgeNames = {};
  for (const id in refs) {
    idPropForEach(refs, id, (name, propId) => {
      if (propId !== '0x0') {
        if (name === '_renderedChildren') {
          if (parents[id] === undefined) {
            // mark that we are a react component, even if we don't have a parent
            parents[id] = null;
          }
          idPropForEach(refs, propId, (childName, childPropId) => {
            if (childName.startsWith('.')) {
              parents[childPropId] = id;
              inEdgeNames[childPropId] = childName + ': '
                + getInternalInstanceName(refs, childPropId);
            }
          });
        } else if (name === '_renderedComponent') {
          if (parents[id] === undefined) {
            parents[id] = null;
          }
          parents[propId] = id;
          inEdgeNames[propId] = getInternalInstanceName(refs, propId);
        }
      }
    });
  }
  // build tree of react internal instances (since that's what has the structure)
  const trees = {};
  for (const id in refs) {
    registerReactComponentTreeImpl(refs, registry, parents, inEdgeNames, trees, id);
  }
  // hook in components by looking at their _reactInternalInstance fields
  for (const id in refs) {
    const internalInstance = idGetProp(refs, id, '_reactInternalInstance');
    if (internalInstance && trees[internalInstance]) {
      trees[id] = trees[internalInstance];
    }
  }
  return trees;
}

function registerPathToRoot(roots, refs, registry, reactComponentTree) {
  const visited = {};
  let breadth = [];
  for (let i = 0; i < roots.length; i++) {
    const id = roots[i];
    if (visited[id] === undefined) {
      const ref = refs[id];
      visited[id] = registry.insert(registry.root, getTypeName(ref));
      breadth.push(id);
    }
  }

  while (breadth.length > 0) {
    const nextBreadth = [];
    for (let i = 0; i < breadth.length; i++) {
      const id = breadth[i];
      const ref = refs[id];
      const node = visited[id];
      // TODO: make edges map id -> name, (empty for none) seems that would be better

      const edges = Object.getOwnPropertyNames(ref.edges);
      edges.sort(function putUnknownLast(a, b) {
        const aName = ref.edges[a];
        const bName = ref.edges[b];
        if (aName === null && bName !== null) {
          return 1;
        } else if (aName !== null && bName === null) {
          return -1;
        } else if (aName === null && bName === null) {
          return 0;
        } else {
          return a.localeCompare(b);
        }
      });

      for (let j = 0; j < edges.length; j++) {
        const edgeId = edges[j];
        let edgeName = '';
        if (ref.edges[edgeId]) {
          edgeName = ref.edges[edgeId] + ': ';
        }
        if (visited[edgeId] === undefined) {
          const edgeRef = refs[edgeId];
          if (edgeRef === undefined) {
            // TODO: figure out why we have edges that point to things not JSCell
            //console.log('registerPathToRoot unable to follow edge from ' + id + ' to ' + edgeId);
          } else {
            visited[edgeId] = registry.insert(node, edgeName + getTypeName(edgeRef));
            nextBreadth.push(edgeId);
            if (reactComponentTree[edgeId] === undefined) {
              reactComponentTree[edgeId] = reactComponentTree[id];
            }
          }
        }
      }
    }
    breadth = nextBreadth;
  }
  return visited;
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
  const numFields = 6;

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

      const reactComponentTreeMap = registerReactComponentTree(capture.refs, this.stacks);
      const rootPathMap = registerPathToRoot(
        capture.roots,
        capture.refs,
        this.stacks,
        reactComponentTreeMap
      );
      const internedCaptureId = this.strings.intern(captureId);
      for (const id in capture.refs) {
        const ref = capture.refs[id];
        newData[dataOffset + idField] = parseInt(id, 16);
        newData[dataOffset + typeField] = this.strings.intern(getTypeName(ref));
        newData[dataOffset + sizeField] = ref.size;
        newData[dataOffset + traceField] = internedCaptureId;
        const pathNode = rootPathMap[id];
        if (pathNode === undefined) {
          throw 'did not find path for ref!';
        }
        newData[dataOffset + pathField] = pathNode.id;
        const reactTree = reactComponentTreeMap[id];
        if (reactTree === undefined) {
          newData[dataOffset + reactField] =
            this.stacks.insert(this.stacks.root, '<not-under-tree>').id;
        } else {
          newData[dataOffset + reactField] = reactTree.id;
        }
        dataOffset += numFields;
      }
      for (const id in capture.markedBlocks) {
        const block = capture.markedBlocks[id];
        newData[dataOffset + idField] = parseInt(id, 16);
        newData[dataOffset + typeField] = this.strings.intern('Marked Block Overhead');
        newData[dataOffset + sizeField] = block.capacity - block.size;
        newData[dataOffset + traceField] = internedCaptureId;
        newData[dataOffset + pathField] = this.stacks.root;
        newData[dataOffset + reactField] = this.stacks.root;
        dataOffset += numFields;
      }
      this.data = newData;
    },
    getAggrow: function getAggrow() {
      const agStrings = this.strings;
      const agStacks = this.stacks.flatten();
      const agData = this.data;
      const agNumRows = agData.length / numFields;
      const ag = new aggrow(agStrings, agStacks, agNumRows);

      const idExpander = ag.addFieldExpander('Id',
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
        function getSize(row) { return agStrings.get(agData[row * numFields + typeField]); },
        function compareSize(rowA, rowB) {
          return agData[rowA * numFields + typeField] - agData[rowB * numFields + typeField];
        });

      ag.addFieldExpander('Size',
        function getSize(row) { return agData[row * numFields + sizeField].toString(); },
        function compareSize(rowA, rowB) {
          return agData[rowA * numFields + sizeField] - agData[rowB * numFields + sizeField];
        });

      const traceExpander = ag.addFieldExpander('Trace',
        function getSize(row) { return agStrings.get(agData[row * numFields + traceField]); },
        function compareSize(rowA, rowB) {
          return agData[rowA * numFields + traceField] - agData[rowB * numFields + traceField];
        });

      const pathExpander = ag.addCalleeStackExpander('Path',
        function getStack(row) { return agStacks.get(agData[row * numFields + pathField]); });

      const reactExpander = ag.addCalleeStackExpander('React Tree',
        function getStack(row) { return agStacks.get(agData[row * numFields + reactField]); });

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

      ag.setActiveExpanders([pathExpander, reactExpander, typeExpander, idExpander, traceExpander]);
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
