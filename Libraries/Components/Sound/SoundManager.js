/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

import NativeSoundManager from './NativeSoundManager';

const SoundManager = {
  playTouchSound: function(): void {
    if (NativeSoundManager) {
      NativeSoundManager.playTouchSound();
    }
  },
};

module.exports = SoundManager;
