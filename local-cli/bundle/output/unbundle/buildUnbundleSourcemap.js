/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const sourceMap  = require('source-map');
const SourceMapConsumer = sourceMap.SourceMapConsumer;

/**
 * Builds the sourcemaps for any type of unbundle provided the Bundle that
 * contains the modules reachable from the entry point.
 *
 * The generated sourcemaps correspond to a regular bundle on which each module
 * starts on a new line. Depending on the type of unbundle you're using, you
 * will have to pipe the line number to native and use it when injecting the
 * module's code into JSC. This way, we'll trick JSC to believe all the code is
 * on a single big regular bundle where as it could be on an indexed bundle or
 * as sparsed assets.
 */
function buildUnbundleSourcemap(bundle) {
  const generator = new sourceMap.SourceMapGenerator({});
  const nonPolyfillModules = bundle.getModules().filter(module =>
    !module.polyfill
  );

  let offset = 1;
  nonPolyfillModules.forEach(module => {
    if (module.map) { // assets have no sourcemap
      const consumer = new SourceMapConsumer(module.map);
      consumer.eachMapping(mapping => {
        generator.addMapping({
          original: {
            line: mapping.originalLine,
            column: mapping.originalColumn,
          },
          generated: {
            line: mapping.generatedLine + offset,
            column: mapping.generatedColumn,
          },
          source: module.sourcePath,
        });
      });

      generator.setSourceContent(module.sourcePath, module.sourceCode);
    }

    // some modules span more than 1 line
    offset += module.code.split('\n').length;
  });

  return generator.toString();
}

module.exports = buildUnbundleSourcemap;
