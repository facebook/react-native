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

const {combineSourceMaps, joinModules} = require('./util');

import type {ModuleGroups, ModuleTransportLike} from '../../types.flow';

type Params = {
  lazyModules: Array<ModuleTransportLike>,
  moduleGroups?: ModuleGroups,
  startupModules: Array<ModuleTransportLike>,
};

module.exports = ({startupModules, lazyModules, moduleGroups}: Params) => {
  const startupModule: ModuleTransportLike = {
    code: joinModules(startupModules),
    id:  Number.MIN_SAFE_INTEGER,
    map: combineSourceMaps({modules: startupModules}),
  };
  return combineSourceMaps({
    modules: [startupModule].concat(lazyModules),
    moduleGroups,
    withCustomOffsets: true,
  });
};
