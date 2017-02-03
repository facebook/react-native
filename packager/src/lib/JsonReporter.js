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

class JsonReporter<TEvent> {

  _stream: Writable;

  constructor(stream: Writable) {
    this._stream = stream;
  }

  update(event: TEvent) {
    this._stream.write(JSON.stringify(event) + '\n');
  }

}

module.exports = JsonReporter;
