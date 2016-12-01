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

import type {Module} from '../types.flow';

// Transformed modules have the form
//   __d(function(require, module, global, exports, dependencyMap) {
//       /* code */
//   });
//
// This function adds the numeric module ID, and an array with dependencies of
// the dependencies of the module before the closing parenthesis.
exports.addModuleIdsToModuleWrapper = (
  module: Module,
  idForPath: {path: string} => number,
): string => {
  const {dependencies, file} = module;
  const {code} = file;
  const index = code.lastIndexOf(')');
  const depencyIds =
    dependencies.length ? `, [${dependencies.map(idForPath).join(', ')}]` : '';
  return (
    code.slice(0, index) +
    `, ${idForPath(file)}` +
    depencyIds +
    code.slice(index)
  );
};

// Creates an idempotent function that returns numeric IDs for objects based
// on their `path` property.
exports.createIdForPathFn = (): ({path: string} => number) => {
  const seen = new Map();
  let next = 0;
  return ({path}) => {
    let id = seen.get(path);
    if (id == null) {
      id = next++;
      seen.set(path, id);
    }
    return id;
  };
};
