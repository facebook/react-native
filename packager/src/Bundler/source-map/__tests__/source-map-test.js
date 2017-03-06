 /**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.disableAutomock();

const Generator = require('../Generator');
const {compactMapping, fromRawMappings} = require('..');

describe('flattening mappings / compacting', () => {
  it('flattens simple mappings', () => {
    expect(compactMapping({generated: {line: 12, column: 34}}))
      .toEqual([12, 34]);
  });

  it('flattens mappings with a source location', () => {
    expect(compactMapping({
      generated: {column: 34, line: 12},
      original: {column: 78, line: 56},
    })).toEqual([12, 34, 56, 78]);
  });

  it('flattens mappings with a source location and a symbol name', () => {
    expect(compactMapping({
      generated: {column: 34, line: 12},
      name: 'arbitrary',
      original: {column: 78, line: 56},
    })).toEqual([12, 34, 56, 78, 'arbitrary']);
  });
});

describe('build map from raw mappings', () => {
  it('returns a `Generator` instance', () => {
    expect(fromRawMappings([])).toBeInstanceOf(Generator);
  });

  it('returns a working source map containing all mappings', () => {
    const input = [{
      code: lines(11),
      map: [
        [1, 2],
        [3, 4, 5, 6, 'apples'],
        [7, 8, 9, 10],
        [11, 12, 13, 14, 'pears'],
      ],
      sourceCode: 'code1',
      sourcePath: 'path1',
    }, {
      code: lines(3),
      map: [
        [1, 2],
        [3, 4, 15, 16, 'bananas'],
      ],
      sourceCode: 'code2',
      sourcePath: 'path2',
    }, {
      code: lines(23),
      map: [
        [11, 12],
        [13, 14, 15, 16, 'bananas'],
        [17, 18, 19, 110],
        [21, 112, 113, 114, 'pears'],
      ],
      sourceCode: 'code3',
      sourcePath: 'path3',
    }];

    expect(fromRawMappings(input).toMap())
      .toEqual({
        mappings: 'E;;IAIMA;;;;QAII;;;;YAIIC;E;;ICEEC;;;;;;;;;;;Y;;cCAAA;;;;kBAI8F;;;;gHA8FID',
        names: ['apples', 'pears', 'bananas'],
        sources: ['path1', 'path2', 'path3'],
        sourcesContent: ['code1', 'code2', 'code3'],
        version: 3,
      });
  });
});

const lines = n => Array(n).join('\n');
