/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
 'use strict';

// beeper@1.1.0 has a return statement outside of a function
// and therefore doesn't parse. Let's mock it so that we can
// run the tests.
module.exports = function () {};
