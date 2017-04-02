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

import {Writable} from 'stream';

class JsonReporter<TEvent: {}> {

  _stream: Writable;

  constructor(stream: Writable) {
    this._stream = stream;
  }

  /**
   * There is a special case for errors because they have non-enumerable fields.
   * (Perhaps we should switch in favor of plain object?)
   */
  update(event: TEvent) {
    /* $FlowFixMe: fine to call on `undefined`. */
    if (Object.prototype.toString.call(event.error) === '[object Error]') {
      event = {...event};
      event.error = {
        ...event.error,
        message: event.error.message,
        stack: event.error.stack,
      };
    }
    this._stream.write(JSON.stringify(event) + '\n');
  }

}

module.exports = JsonReporter;
