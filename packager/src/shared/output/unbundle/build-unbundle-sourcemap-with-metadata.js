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

const {combineSourceMaps, combineSourceMapsAddingOffsets, joinModules} = require('./util');

import type {ModuleGroups, ModuleTransportLike} from '../../types.flow';

type Params = {|
  fixWrapperOffset: boolean,
  lazyModules: $ReadOnlyArray<ModuleTransportLike>,
  moduleGroups: ?ModuleGroups,
  startupModules: $ReadOnlyArray<ModuleTransportLike>,
|};

module.exports = ({fixWrapperOffset, lazyModules, moduleGroups, startupModules}: Params) => {
  const options = fixWrapperOffset ? {fixWrapperOffset: true} : undefined;
  const startupModule: ModuleTransportLike = {
    code: joinModules(startupModules),
    id:  Number.MIN_SAFE_INTEGER,
    map: combineSourceMaps(startupModules, undefined, options),
    sourcePath: '',
  };

  const map = combineSourceMapsAddingOffsets(
    [startupModule].concat(lazyModules),
    moduleGroups,
    options,
  );
  delete map.x_facebook_offsets[Number.MIN_SAFE_INTEGER];
  return map;
};
