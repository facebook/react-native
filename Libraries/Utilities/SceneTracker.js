/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SceneTracker
 * @flow
 */

'use strict';

type Scene = {name: string};

let _listeners: Array<(scene: Scene) => void> = [];

let _activeScene = {name: 'default'};

const SceneTracker = {
  setActiveScene(scene: Scene) {
    _activeScene = scene;
    _listeners.forEach((listener) => listener(_activeScene));
  },

  getActiveScene(): Scene {
    return _activeScene;
  },

  addActiveSceneChangedListener(callback: (scene: Scene) => void): {remove: () => void} {
    _listeners.push(callback);
    return {
      remove: () => {
        _listeners = _listeners.filter((listener) => callback !== listener);
      },
    };
  },
};

module.exports = SceneTracker;
