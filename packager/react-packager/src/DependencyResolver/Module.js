/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const Promise = require('promise');
const docblock = require('./DependencyGraph/docblock');
const isAbsolutePath = require('absolute-path');
const path = require('path');
const replacePatterns = require('./replacePatterns');

class Module {

  constructor(file, fastfs, moduleCache, cache) {
    if (!isAbsolutePath(file)) {
      throw new Error('Expected file to be absolute path but got ' + file);
    }

    this.path = path.resolve(file);
    this.type = 'Module';

    this._fastfs = fastfs;
    this._moduleCache = moduleCache;
    this._cache = cache;
  }

  isHaste() {
    return this._cache.get(this.path, 'haste', () =>
      this._read().then(data => !!data.id)
    );
  }

  getName() {
    return this._cache.get(
      this.path,
      'name',
      () => this._read().then(data => {
        if (data.id) {
          return data.id;
        }

        const p = this.getPackage();

        if (!p) {
          // Name is full path
          return this.path;
        }

        return p.getName()
          .then(name => {
            if (!name) {
              return this.path;
            }

            return path.join(name, path.relative(p.root, this.path));
          });
      })
    );
  }

  getPackage() {
    return this._moduleCache.getPackageForModule(this);
  }

  getDependencies() {
    return this._cache.get(this.path, 'dependencies', () =>
      this._read().then(data => data.dependencies)
    );
  }

  invalidate() {
    this._cache.invalidate(this.path);
  }

  getAsyncDependencies() {
    return this._read().then(data => data.asyncDependencies);
  }

  _read() {
    if (!this._reading) {
      this._reading = this._fastfs.readFile(this.path).then(content => {
        const data = {};
        const moduleDocBlock = docblock.parseAsObject(content);
        if (moduleDocBlock.providesModule || moduleDocBlock.provides) {
          data.id = /^(\S*)/.exec(
            moduleDocBlock.providesModule || moduleDocBlock.provides
          )[1];
        }

        // Ignore requires in generated code. An example of this is prebuilt
        // files like the SourceMap library.
        if ('extern' in moduleDocBlock) {
          data.dependencies = [];
        } else {
          var dependencies = extractRequires(content);
          data.dependencies = dependencies.sync;
          data.asyncDependencies = dependencies.async;
        }

        return data;
      });
    }

    return this._reading;
  }

  hash() {
    return `Module : ${this.path}`;
  }

  isJSON() {
    return path.extname(this.path) === '.json';
  }

  isAsset() {
    return false;
  }

  isPolyfill() {
    return false;
  }

  isAsset_DEPRECATED() {
    return false;
  }
}

/**
 * Extract all required modules from a `code` string.
 */
const blockCommentRe = /\/\*(.|\n)*?\*\//g;
const lineCommentRe = /\/\/.+(\n|$)/g;
const trailingCommaRe = /,\s*$/g;
const removeSpacesRe = /\s/g;
const quotesRe = /'/g;
function extractRequires(code /*: string*/) /*: Array<string>*/ {
  var deps = {
    sync: [],
    async: [],
  };

  code
    .replace(blockCommentRe, '')
    .replace(lineCommentRe, '')
    // Parse sync dependencies. See comment below for further detils.
    .replace(replacePatterns.IMPORT_RE, (match, pre, quot, dep, post) => {
      deps.sync.push(dep);
      return match;
    })
    // Parse the sync dependencies this module has. When the module is
    // required, all it's sync dependencies will be loaded into memory.
    // Sync dependencies can be defined either using `require` or the ES6
    // `import` syntax:
    //   var dep1 = require('dep1');
    .replace(replacePatterns.REQUIRE_RE, (match, pre, quot, dep, post) => {
      deps.sync.push(dep);
    })
    // Parse async dependencies this module has. As opposed to what happens
    // with sync dependencies, when the module is required, it's async
    // dependencies won't be loaded into memory. This is deferred till the
    // code path gets to a `require.ensure` statement. The syntax is similar
    // to webpack's one:
    //   require.ensure(['dep1', 'dep2'], () => {
    //     var dep1 = require('dep1');
    //     var dep2 = require('dep2');
    //     // do something with dep1 and dep2
    //   });
    .replace(replacePatterns.REQUIRE_ENSURE_RE, (match, dep, post) => {
      dep = dep
        .replace(blockCommentRe, '')
        .replace(lineCommentRe, '')
        .replace(trailingCommaRe, '')
        .replace(removeSpacesRe, '')
        .replace(quotesRe, '"');

      if (dep) {
        try {
          dep = JSON.parse('[' + dep + ']');
        } catch(e) {
          throw 'Error processing `require.ensure` while attemping to parse ' +
                'dependencies `[' + dep + ']`: ' + e;
        }

        dep.forEach(d => {
          if (typeof d !== 'string') {
            throw 'Error processing `require.ensure`: dependencies `[' +
                  d + ']` must be string literals';
          }
        });

        // TODO: throw error if there are duplicate dependencies

        deps.async.push(dep);
      }
    });

  return deps;
}

module.exports = Module;
