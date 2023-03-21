/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

const babel = require('@babel/core');
const {OptionManager, DEFAULT_EXTENSIONS} = require('@babel/core');
const sourceMapSupport = require('source-map-support');
const {addHook} = require('pirates');
const path = require('path');
const fs = require('fs');
const diskCache = require('./disk-cache');

function compile(sourceMapManager, cache, options, code, filename) {
  const opts = new OptionManager().init({
    sourceRoot: path.dirname(filename) + path.sep,
    ...options,
    filename,
  });

  // Bail out ASAP if the file has been ignored.
  if (opts === null) {
    return code;
  }

  let output = cache[filename];

  if (!output || output.mtime !== mtime(filename)) {
    output = babel.transformSync(code, {
      ...opts,
      sourceMaps: opts.sourceMaps === undefined ? 'both' : opts.sourceMaps,
      ast: false,
    });

    cache[filename] = output;
    output.mtime = mtime(filename);
  }

  if (!sourceMapManager.isInstalled) {
    sourceMapManager.install();
  }

  if (output.map) {
    sourceMapManager.maps[filename] = output.map;
  }

  return output.code;
}

function mtime(filename) {
  return +fs.statSync(filename).mtime;
}

function withBabelRegister(options, fn) {
  let revertHook;
  /**
   * TODO: Do source maps break when we use a require hook
   * to before we initialize the ESLint plugin?
   */
  const sourceMapManager = {
    isInstalled: false,
    maps: {},
    install() {
      if (sourceMapManager.isInstalled) {
        return;
      }
      sourceMapManager.isInstalled = true;
      sourceMapSupport.install({
        handleUncaughtExceptions: true,
        environment: 'node',
        retrieveSourceMap(filename) {
          const map = sourceMapManager.maps && sourceMapManager.maps[filename];
          if (map) {
            return {
              url: null,
              map: map,
            };
          } else {
            return null;
          }
        },
      });
    },
  };

  diskCache.load();
  const cache = diskCache.get();

  try {
    revertHook = addHook(
      (code, filename) => {
        return compile(sourceMapManager, cache, options, code, filename);
      },
      {
        exts: DEFAULT_EXTENSIONS,
        ignoreNodeModules: false,
      },
    );
    return fn();
  } finally {
    revertHook();
  }
}

module.exports = withBabelRegister;
