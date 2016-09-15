/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Keyboard
 * @flow
 */
'use strict';

const NativeEventEmitter = require('NativeEventEmitter');
const KeyboardObserver = require('NativeModules').KeyboardObserver;
const dismissKeyboard = require('dismissKeyboard');

let keyboard = new NativeEventEmitter(KeyboardObserver);
// Add dismissKeyboard helper function
keyboard.dismiss = dismissKeyboard;

module.exports = keyboard;
