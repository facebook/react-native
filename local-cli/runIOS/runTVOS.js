/**
* Copyright (c) 2015-present, Facebook, Inc.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*/
'use strict';

const RunIOSInternals = require('./RunIOSInternals');

const run_ios = new RunIOSInternals('appletvos',
                                    'appletvsimulator',
                                    '-tvOS',
                                    'tvOS',
                                    'run-tvos',
                                    'Apple TV 1080p');

module.exports = run_ios.makeExports();
