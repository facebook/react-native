 /**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

module.exports = function MapWithDefaults(factory, iterable) {
  // This can't be `MapWithDefaults extends Map`, b/c the way babel transforms
  // super calls in constructors: Map.call(this, iterable) throws for native
  // Map objects in node 4+.
  // TODO(davidaurelio) switch to a transform that does not transform classes
  // and super calls, and change this into a class

  const map = iterable ? new Map(iterable) : new Map();
  const {get} = map;
  map.get = key => {
    if (map.has(key)) {
      return get.call(map, key);
    }

    const value = factory(key);
    map.set(key, value);
    return value;
  };
  return map;
};
