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

/**
 * Creates a source map from modules with "raw mappings", i.e. an array of
 * tuples with either 2, 4, or 5 elements:
 * generated line, generated column, source line, source line, symbol name.
 */
function fromRawMappings(modules: Array<ModuleTransport>): string {
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

    carryOver = carryOver + countLines(code);
  }

  return generator.toString();
}

function addMappingsForFile(generator, mappings, module, carryOver) {
  generator.startFile(module.sourcePath, module.sourceCode);

  const columnOffset = module.code.indexOf('{') + 1;
  for (let i = 0, n = mappings.length; i < n; ++i) {
    const mapping = mappings[i];
    generator.addMapping(
      mapping[0] + carryOver,
      // lines start at 1, columns start at 0
      mapping[0] === 1 && mapping[1] + columnOffset || mapping[1],
      mapping[2],
      mapping[3],
      mapping[4],
    );
  }
  generator.endFile();

}

function countLines(string) {
  return string.split('\n').length;
}

exports.fromRawMappings = fromRawMappings;
