/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const buildSourceMapWithMetaData = require('../../../../local-cli/bundle/output/unbundle/build-unbundle-sourcemap-with-metadata.js');

const {buildTableAndContents, createModuleGroups} = require('../../../../local-cli/bundle/output/unbundle/as-indexed-file');
const {concat} = require('./util');

import type {FBIndexMap} from '../../lib/SourceMap.js';
import type {OutputFn} from '../types.flow';

function asIndexedRamBundle({
  filename,
  idForPath,
  modules,
  preloadedModules,
  requireCalls,
}) {
  const [startup, deferred] = partition(modules, preloadedModules);
  const startupModules = Array.from(concat(startup, requireCalls));
  const deferredModules = deferred.map(m => toModuleTransport(m.file, idForPath));
  const moduleGroups = createModuleGroups(new Map(), deferredModules);

  const tableAndContents = buildTableAndContents(
    startupModules.map(getModuleCode).join('\n'),
    deferredModules,
    moduleGroups,
    'utf8',
  );

  return {
    code: Buffer.concat(tableAndContents),
    map: buildSourceMapWithMetaData({
      fixWrapperOffset: false,
      startupModules: startupModules.map(m => toModuleTransport(m.file, idForPath)),
      lazyModules: deferredModules,
    }),
  };
}

function toModuleTransport(file, idForPath) {
  return {
    code: file.code,
    id: idForPath(file),
    map: file.map,
    name: file.path,
    sourcePath: file.path,
  };
}

function getModuleCode(module) {
  return module.file.code;
}

function partition(modules, preloadedModules) {
  const startup = [];
  const deferred = [];
  for (const module of modules) {
    (preloadedModules.has(module.file.path) ? startup : deferred).push(module);
  }

  return [startup, deferred];
}

function createBuilder(preloadedModules: Set<string>): OutputFn<FBIndexMap> {
  return x => asIndexedRamBundle({preloadedModules, ...x});
}
exports.createBuilder = createBuilder;
