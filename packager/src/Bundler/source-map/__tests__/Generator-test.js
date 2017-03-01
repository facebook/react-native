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

const {objectContaining} = expect;

let generator;
beforeEach(() => {
  generator = new Generator();
});

it('adds file name and source code when starting a file', () => {
  const file1 = 'just/a/file';
  const file2 = 'another/file';
  const source1 = 'var a = 1;';
  const source2 = 'var a = 2;';

  generator.startFile(file1, source1);
  generator.startFile(file2, source2);

  expect(generator.toMap())
    .toEqual(objectContaining({
      sources: [file1, file2],
      sourcesContent: [source1, source2],
    }));
});

it('throws when adding a mapping without starting a file', () => {
  expect(() => generator.addSimpleMapping(1, 2)).toThrow();
});

it('throws when adding a mapping after ending a file', () => {
  generator.startFile('apples', 'pears');
  generator.endFile();
  expect(() => generator.addSimpleMapping(1, 2)).toThrow();
});

it('can add a mapping for generated code without corresponding original source', () => {
  generator.startFile('apples', 'pears');
  generator.addSimpleMapping(12, 87);
  expect(generator.toMap())
    .toEqual(objectContaining({
      mappings: ';;;;;;;;;;;uF',
    }));
});

it('can add a mapping with corresponding location in the original source', () => {
  generator.startFile('apples', 'pears');
  generator.addSourceMapping(2, 3, 456, 7);
  expect(generator.toMap())
    .toEqual(objectContaining({
      mappings: ';GAucO',
    }));
});

it('can add a mapping with source location and symbol name', () => {
  generator.startFile('apples', 'pears');
  generator.addNamedSourceMapping(9, 876, 54, 3, 'arbitrary');
  expect(generator.toMap())
    .toEqual(objectContaining({
      mappings: ';;;;;;;;42BAqDGA',
      names: ['arbitrary'],
    }));
});

describe('full map generation', () => {
  beforeEach(() => {
    generator.startFile('apples', 'pears');
    generator.addSimpleMapping(1, 2);
    generator.addNamedSourceMapping(3, 4, 5, 6, 'plums');
    generator.endFile();
    generator.startFile('lemons', 'oranges');
    generator.addNamedSourceMapping(7, 8, 9, 10, 'tangerines');
    generator.addNamedSourceMapping(11, 12, 13, 14, 'tangerines');
    generator.addSimpleMapping(15, 16);
  });

  it('can add multiple mappings for each file', () => {
    expect(generator.toMap()).toEqual({
      version: 3,
      mappings: 'E;;IAIMA;;;;QCIIC;;;;YAIIA;;;;gB',
      sources: ['apples', 'lemons'],
      sourcesContent: ['pears', 'oranges'],
      names: ['plums', 'tangerines'],
    });
  });

  it('can add a `file` property to the map', () => {
    expect(generator.toMap('arbitrary'))
      .toEqual(objectContaining({
        file: 'arbitrary',
      }));
  });

  it('supports direct JSON serialization', () => {
    expect(JSON.parse(generator.toString())).toEqual(generator.toMap());
  });

  it('supports direct JSON serialization with a file name', () => {
    const file = 'arbitrary/file';
    expect(JSON.parse(generator.toString(file))).toEqual(generator.toMap(file));
  });
});
