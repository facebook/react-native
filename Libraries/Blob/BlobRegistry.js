/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BlobRegistry
 * @flow
 * @format
 */

const registry: {[key: string]: number} = {};

const register = (id: string) => {
  if (registry[id]) {
    registry[id]++;
  } else {
    registry[id] = 1;
  }
};

const unregister = (id: string) => {
  if (registry[id]) {
    registry[id]--;
    if (registry[id] <= 0) {
      delete registry[id];
    }
  }
};

const has = (id: string) => {
  return registry[id] && registry[id] > 0;
};

module.exports = {
  register,
  unregister,
  has,
};
