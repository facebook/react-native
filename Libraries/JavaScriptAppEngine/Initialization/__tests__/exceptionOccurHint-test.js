/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.unmock('../exceptionOccurHint');

const exceptionOccurHint = require('exceptionOccurHint');

describe('exceptionOccurHint', () => {

  pit('give a hint', () => {
    return exceptionOccurHint().then(hint => {
      expect(hint).toEqual('At: ViewExample.js:42');
    });
  });
});
