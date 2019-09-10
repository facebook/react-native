/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

import { Graph } from '../src/Graph.js';

// graph looks like this before test: https://pxl.cl/9k8t
let graph = null;

beforeEach(() => {
  graph = new Graph();
  graph.addEdge('A1', 'B1');
  graph.addEdge('A2', 'B1');
  graph.addEdge('A2', 'B2');
  graph.addEdge('A3', 'B2');
  graph.addEdge('A3', 'C3');
  graph.addEdge('B1', 'C1');
  graph.addEdge('B1', 'C2');
  graph.addEdge('B1', 'C3');
  graph.addEdge('B2', 'C2');
});

// checks id1 occurs after id2 in arr
function expectOccursAfter(arr, id1, id2) {
  let idx1 = arr.indexOf(id1);
  let idx2 = arr.indexOf(id2);

  expect(idx1).not.toBe(-1);
  expect(idx2).not.toBe(-1);
  expect(idx1).toBeGreaterThan(idx2);
}

test('detects cycle', () => {
  graph.addEdge('C2', 'A1');
  expect(() => graph.traverse(['A2'])).toThrow(/^Not a DAG/);
});

test('checks for presence of root', () => {
  expect(() => graph.traverse(['A1', 'NX'])).toThrow(/^No node/);
});

test('traverses partial graph', () => {
  let ids = graph.traverse(['B1', 'A3']);

  // Check that expected nodes are there
  let sortedIds = ids.slice().sort();
  expect(sortedIds).toEqual(['A3', 'B1', 'B2', 'C1', 'C2', 'C3']);

  // Check that the result is topologically sorted
  expectOccursAfter(ids, 'A3', 'B2');
  expectOccursAfter(ids, 'A3', 'C3');
  expectOccursAfter(ids, 'B1', 'C1');
  expectOccursAfter(ids, 'B1', 'C2');
  expectOccursAfter(ids, 'B1', 'C3');
  expectOccursAfter(ids, 'B2', 'C2');
});

test('traverses complete graph', () => {
  let ids = graph.traverse(['A1', 'A2', 'A3']);

  // Check that expected nodes are there
  let sortedIds = ids.slice().sort();
  expect(sortedIds).toEqual(['A1', 'A2', 'A3', 'B1', 'B2', 'C1', 'C2', 'C3']);

  // Check that the result is topologically sorted
  expectOccursAfter(ids, 'A1', 'B1');
  expectOccursAfter(ids, 'A2', 'B1');
  expectOccursAfter(ids, 'A2', 'B2');
  expectOccursAfter(ids, 'A3', 'B2');
  expectOccursAfter(ids, 'A3', 'C3');
  expectOccursAfter(ids, 'B1', 'C1');
  expectOccursAfter(ids, 'B1', 'C2');
  expectOccursAfter(ids, 'B1', 'C3');
  expectOccursAfter(ids, 'B2', 'C2');
});
