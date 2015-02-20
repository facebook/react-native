/**
 * @generated SignedSource<<5c985f16e4f2e576657ab2b1551adf97>>
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !! This file is a check-in of a static_upstream project!      !!
 * !!                                                            !!
 * !! You should not modify this file directly. Instead:         !!
 * !! 1) Use `fjs use-upstream` to temporarily replace this with !!
 * !!    the latest version from upstream.                       !!
 * !! 2) Make your changes, test them, etc.                      !!
 * !! 3) Use `fjs push-upstream` to copy your changes back to    !!
 * !!    static_upstream.                                        !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule throwImmediate
 * @typechecks
 */

'use strict';

var setImmediate = require('setImmediate');

function throwArg(error) {
  throw error;
}

/**
 * Throws the supplied error in a new execution loop.
 *
 * @param {*} error
 */
function throwImmediate(error) {
  setImmediate(throwArg, error);
}

module.exports = throwImmediate;
