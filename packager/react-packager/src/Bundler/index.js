/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Promise = require('promise');
const ProgressBar = require('progress');
const Cache = require('../Cache');
const Transformer = require('../JSTransformer');
const DependencyResolver = require('../DependencyResolver');
const Bundle = require('./Bundle');
const Activity = require('../Activity');
const ModuleTransport = require('../lib/ModuleTransport');
const declareOpts = require('../lib/declareOpts');
const imageSize = require('image-size');

const sizeOf = Promise.denodeify(imageSize);
const readFile = Promise.denodeify(fs.readFile);

const validateOpts = declareOpts({
  projectRoots: {
    type: 'array',
    required: true,
  },
  blacklistRE: {
    type: 'object', // typeof regex is object
  },
  moduleFormat: {
    type: 'string',
    default: 'haste',
  },
  polyfillModuleNames: {
    type: 'array',
    default: [],
  },
  cacheVersion: {
    type: 'string',
    default: '1.0',
  },
  resetCache: {
    type: 'boolean',
    default: false,
  },
  transformModulePath: {
    type:'string',
    required: false,
  },
  nonPersistent: {
    type: 'boolean',
    default: false,
  },
  assetRoots: {
    type: 'array',
    required: false,
  },
  assetExts: {
    type: 'array',
    default: ['png'],
  },
  fileWatcher: {
    type: 'object',
    required: true,
  },
  assetServer: {
    type: 'object',
    required: true,
  },
  transformTimeoutInterval: {
    type: 'number',
    required: false,
  },
});

class Bundler {

  constructor(options) {
    const opts = this._opts = validateOpts(options);

    opts.projectRoots.forEach(verifyRootExists);

    this._cache = new Cache({
      resetCache: opts.resetCache,
      cacheVersion: opts.cacheVersion,
      projectRoots: opts.projectRoots,
      transformModulePath: opts.transformModulePath,
    });

    this._resolver = new DependencyResolver({
      projectRoots: opts.projectRoots,
      blacklistRE: opts.blacklistRE,
      polyfillModuleNames: opts.polyfillModuleNames,
      moduleFormat: opts.moduleFormat,
      assetRoots: opts.assetRoots,
      fileWatcher: opts.fileWatcher,
      assetExts: opts.assetExts,
      cache: this._cache,
    });

    this._transformer = new Transformer({
      projectRoots: opts.projectRoots,
      blacklistRE: opts.blacklistRE,
      cache: this._cache,
      transformModulePath: opts.transformModulePath,
    });

    this._projectRoots = opts.projectRoots;
    this._assetServer = opts.assetServer;
  }

  kill() {
    this._transformer.kill();
    return this._cache.end();
  }

  bundle(main, runModule, sourceMapUrl, isDev, platform) {
    const bundle = new Bundle(sourceMapUrl);
    const findEventId = Activity.startEvent('find dependencies');
    let transformEventId;

    return this.getDependencies(main, isDev, platform).then((response) => {
      Activity.endEvent(findEventId);
      transformEventId = Activity.startEvent('transform');

      let bar;
      if (process.stdout.isTTY) {
        bar = new ProgressBar('transforming [:bar] :percent :current/:total', {
          complete: '=',
          incomplete: ' ',
          width: 40,
          total: response.dependencies.length,
        });
      }

      bundle.setMainModuleId(response.mainModuleId);
      return Promise.all(
        response.dependencies.map(
          module => this._transformModule(
            bundle,
            response,
            module,
            platform
          ).then(transformed => {
            if (bar) {
              bar.tick();
            }
            return transformed;
          })
        )
      );
    }).then((transformedModules) => {
      Activity.endEvent(transformEventId);

      transformedModules.forEach(function(moduleTransport) {
        bundle.addModule(moduleTransport);
      });

      bundle.finalize({ runMainModule: runModule });
      return bundle;
    });
  }

  invalidateFile(filePath) {
    this._transformer.invalidateFile(filePath);
  }

  getDependencies(main, isDev, platform) {
    return this._resolver.getDependencies(main, { dev: isDev, platform });
  }

  _transformModule(bundle, response, module, platform = null) {
    let transform;

    if (module.isAsset_DEPRECATED()) {
      transform = this.generateAssetModule_DEPRECATED(bundle, module);
    } else if (module.isAsset()) {
      transform = this.generateAssetModule(bundle, module);
    } else if (module.isJSON()) {
      transform = generateJSONModule(module);
    } else {
      transform = this._transformer.loadFileAndTransform(
        path.resolve(module.path)
      );
    }

    const resolver = this._resolver;
    return transform.then(
      transformed => resolver.wrapModule(
        response,
        module,
        transformed.code
      ).then(
        code => new ModuleTransport({
          code: code,
          map: transformed.map,
          sourceCode: transformed.sourceCode,
          sourcePath: transformed.sourcePath,
          virtual: transformed.virtual,
        })
      )
    );
  }

  getGraphDebugInfo() {
    return this._resolver.getDebugInfo();
  }

  generateAssetModule_DEPRECATED(bundle, module) {
    return Promise.all([
      sizeOf(module.path),
      module.getName(),
    ]).then(([dimensions, id]) => {
      const img = {
        __packager_asset: true,
        isStatic: true,
        path: module.path,
        uri: id.replace(/^[^!]+!/, ''),
        width: dimensions.width / module.resolution,
        height: dimensions.height / module.resolution,
        deprecated: true,
      };

      bundle.addAsset(img);

      const code = 'module.exports = ' + JSON.stringify(img) + ';';

      return new ModuleTransport({
        code: code,
        sourceCode: code,
        sourcePath: module.path,
        virtual: true,
      });
    });
  }

  generateAssetModule(bundle, module) {
    const relPath = getPathRelativeToRoot(this._projectRoots, module.path);

    return Promise.all([
      sizeOf(module.path),
      this._assetServer.getAssetData(relPath),
    ]).then(function(res) {
      const dimensions = res[0];
      const assetData = res[1];
      const img = {
        __packager_asset: true,
        fileSystemLocation: path.dirname(module.path),
        httpServerLocation: path.join('/assets', path.dirname(relPath)),
        width: dimensions.width / module.resolution,
        height: dimensions.height / module.resolution,
        scales: assetData.scales,
        hash: assetData.hash,
        name: assetData.name,
        type: assetData.type,
      };

      bundle.addAsset(img);

      const ASSET_TEMPLATE = 'module.exports = require("AssetRegistry").registerAsset(%json);';
      const code = ASSET_TEMPLATE.replace('%json', JSON.stringify(img));

      return new ModuleTransport({
        code: code,
        sourceCode: code,
        sourcePath: module.path,
        virtual: true,
      });
    });
  }
}

function generateJSONModule(module) {
  return readFile(module.path).then(function(data) {
    const code = 'module.exports = ' + data.toString('utf8') + ';';

    return new ModuleTransport({
      code: code,
      sourceCode: code,
      sourcePath: module.path,
      virtual: true,
    });
  });
}

function getPathRelativeToRoot(roots, absPath) {
  for (let i = 0; i < roots.length; i++) {
    const relPath = path.relative(roots[i], absPath);
    if (relPath[0] !== '.') {
      return relPath;
    }
  }

  throw new Error(
    'Expected root module to be relative to one of the project roots'
  );
}

function verifyRootExists(root) {
  // Verify that the root exists.
  assert(fs.statSync(root).isDirectory(), 'Root has to be a valid directory');
}

class DummyCache {
  get(filepath, field, loaderCb) {
    return loaderCb();
  }

  end(){}
  invalidate(filepath){}
}
module.exports = Bundler;
