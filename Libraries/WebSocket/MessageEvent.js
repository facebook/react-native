/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule MessageEvent
 *
 */

'use strict';

var Event = require('Event');

class MessageEvent extends Event {
  constructor(type, eventInitDict) {
    super(type);

    Object.assign(this, eventInitDict);
  }
}

module.exports = MessageEvent;
