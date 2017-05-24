/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */

'use strict';

class MapWithDefaults<TK, TV> extends Map<TK, TV> {
  _factory: TK => TV;

  constructor(factory: TK => TV, iterable?: Iterable<[TK, TV]>) {
    super(iterable);
    this._factory = factory;
  }

  get(key: TK): TV {
    if (this.has(key)) {
      /* $FlowFixMe: can never be `undefined` since we tested with `has`
       * (except if `TV` includes `void` as subtype, ex. is nullable) */
      return Map.prototype.get.call(this, key);
    }
    const value = this._factory(key);
    this.set(key, value);
    return value;
  }
}

module.exports = MapWithDefaults;
