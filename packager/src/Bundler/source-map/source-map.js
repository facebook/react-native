/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const Generator = require('./Generator');

import type ModuleTransport from '../../lib/ModuleTransport';
import type {RawMapping as BabelRawMapping} from 'babel-generator';

type GeneratedCodeMapping = [number, number];
type SourceMapping = [number, number, number, number];
type SourceMappingWithName =  [number, number, number, number, string];

export type RawMapping =
  SourceMappingWithName | SourceMapping | GeneratedCodeMapping;

/**
 * Creates a source map from modules with "raw mappings", i.e. an array of
 * tuples with either 2, 4, or 5 elements:
 * generated line, generated column, source line, source line, symbol name.
 */
function fromRawMappings(modules: Array<ModuleTransport>): Generator {
  const generator = new Generator();
  let carryOver = 0;

  for (var j = 0, o = modules.length; j < o; ++j) {
    var module = modules[j];
    var {code, map} = module;

    if (Array.isArray(map)) {
      addMappingsForFile(generator, map, module, carryOver);
    } else if (map != null) {
      throw new Error(
        `Unexpected module with full source map found: ${module.sourcePath}`
      );
    }

    carryOver += countLines(code);
  }

  return generator;
}

function compactMapping(mapping: BabelRawMapping): RawMapping {
  const {column, line} = mapping.generated;
  const {name, original} = mapping;

  if (original == null) {
    return [line, column];
  }

  if (typeof name !== 'string') {
    return [line, column, original.line, original.column];
  }

  return [line, column, original.line, original.column, name];
}

function addMappingsForFile(generator, mappings, module, carryOver) {
  generator.startFile(module.sourcePath, module.sourceCode);

  const columnOffset = module.code.indexOf('{') + 1;
  for (let i = 0, n = mappings.length; i < n; ++i) {
    addMapping(generator, mappings[i], carryOver, columnOffset);
  }

  generator.endFile();

}

function addMapping(generator, mapping, carryOver, columnOffset) {
  const n = mapping.length;
  const line = mapping[0] + carryOver;
  // lines start at 1, columns start at 0
  const column = mapping[0] === 1 ? mapping[1] + columnOffset : mapping[1];
  if (n === 2) {
    generator.addSimpleMapping(line, column);
  } else if (n === 4) {
    // $FlowIssue #15579526
    generator.addSourceMapping(line, column, mapping[2], mapping[3]);
  } else if (n === 5) {
    generator.addNamedSourceMapping(
      // $FlowIssue #15579526
      line, column, mapping[2], mapping[3], mapping[4]);
  } else {
    throw new Error(`Invalid mapping: [${mapping.join(', ')}]`);
  }
}

function countLines(string) {
  return string.split('\n').length;
}

exports.fromRawMappings = fromRawMappings;
exports.compactMapping = compactMapping;
