/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.disableAutomock();

const SourceMapGenerator = require('../../../Bundler/source-map/Generator');
const {symbolicate} = require('../worker');

let connection;
beforeEach(() => {
  connection = {end: jest.fn()};
});

it('symbolicates stack frames', () => {
  const mappings = [
    {
      from: {file: 'bundle1.js', lineNumber: 1, column: 2},
      to: {file: 'apples.js', lineNumber: 12, column: 34},
    },
    {
      from: {file: 'bundle2.js', lineNumber: 3, column: 4},
      to: {file: 'bananas.js', lineNumber: 56, column: 78},
    },
    {
      from: {file: 'bundle1.js', lineNumber: 5, column: 6},
      to: {file: 'clementines.js', lineNumber: 90, column: 12},
    },
  ];

  const stack = mappings.map(m => m.to);
  const maps =
    Object.entries(groupBy(mappings, m => m.from.file))
    .map(([file, ms]) => [file, sourceMap(file, ms)]);

  return symbolicate(connection, makeData(stack, maps))
    .then(() =>
      expect(connection.end).toBeCalledWith(
        JSON.stringify({result: mappings.map(m => m.to)})
      )
    );
});

it('ignores stack frames without corresponding map', () => {
  const frame = {
    file: 'arbitrary.js',
    lineNumber: 123,
    column: 456,
  };

  return symbolicate(connection, makeData([frame], [['other.js', emptyMap()]]))
    .then(() =>
      expect(connection.end).toBeCalledWith(
        JSON.stringify({result: [frame]})
      )
    );
});

it('ignores `/debuggerWorker.js` stack frames', () => {
  const frame = {
    file: 'http://localhost:8081/debuggerWorker.js',
    lineNumber: 123,
    column: 456,
  };

  return symbolicate(connection, makeData([frame]))
    .then(() =>
      expect(connection.end).toBeCalledWith(
        JSON.stringify({result: [frame]})
      )
    );
});

function makeData(stack, maps = []) {
  return JSON.stringify({maps, stack});
}

function sourceMap(file, mappings) {
  const g = new SourceMapGenerator();
  g.startFile(file, null);
  mappings.forEach(({from, to}) =>
    g.addSourceMapping(to.lineNumber, to.column, from.lineNumber, from.column));
  return g.toMap();
}

function groupBy(xs, key) {
  const grouped = {};
  xs.forEach(x => {
    const k = key(x);
    if (k in grouped) {
      grouped[k].push(x);
    } else {
      grouped[k] = [x];
    }
  });
  return grouped;
}

function emptyMap() {
  return {
    version: 3,
    sources: [],
    mappings: '',
  };
}
