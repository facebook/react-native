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


import type {Module} from './types.flow';

exports.empty = (): Module => virtual('');

// creates a virtual module (i.e. not corresponding to a file on disk)
// with the given source code.
const virtual = exports.virtual = (code: string): Module => ({
  dependencies: [],
  file: {
    code,
    map: null,
    path: '',
    type: 'script',
  },
});
