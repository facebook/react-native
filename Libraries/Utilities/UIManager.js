/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule UIManager
 * @flow
 */
'use strict';

const NativeModules = require('NativeModules');
const Platform = require('Platform');

const defineLazyObjectProperty = require('defineLazyObjectProperty');
const findNodeHandle = require('react/lib/findNodeHandle');
const invariant = require('fbjs/lib/invariant');

const { UIManager } = NativeModules;

invariant(UIManager, 'UIManager is undefined. The native module config is probably incorrect.');

const _takeSnapshot = UIManager.takeSnapshot;

/**
 * Capture an image of the screen, window or an individual view. The image
 * will be stored in a temporary file that will only exist for as long as the
 * app is running.
 *
 * The `view` argument can be the literal string `window` if you want to
 * capture the entire window, or it can be a reference to a specific
 * React Native component.
 *
 * The `options` argument may include:
 * - width/height (number) - the width and height of the image to capture.
 * - format (string) - either 'png' or 'jpeg'. Defaults to 'png'.
 * - quality (number) - the quality when using jpeg. 0.0 - 1.0 (default).
 *
 * Returns a Promise.
 * @platform ios
 */
UIManager.takeSnapshot = async function(
  view ?: 'window' | ReactElement<any> | number,
  options ?: {
    width ?: number,
    height ?: number,
    format ?: 'png' | 'jpeg',
    quality ?: number,
  },
) {
  if (!_takeSnapshot) {
    console.warn('UIManager.takeSnapshot is not available on this platform');
    return;
  }
  if (typeof view !== 'number' && view !== 'window') {
    view = findNodeHandle(view) || 'window';
  }
  return _takeSnapshot(view, options);
};

/**
 * Copies the ViewManager constants and commands into UIManager. This is
 * only needed for iOS, which puts the constants in the ViewManager
 * namespace instead of UIManager, unlike Android.
 */
if (Platform.OS === 'ios') {
  Object.keys(UIManager).forEach(viewName => {
    const viewConfig = UIManager[viewName];
    if (viewConfig.Manager) {
      defineLazyObjectProperty(viewConfig, 'Constants', {
        get: () => {
          const viewManager = NativeModules[viewConfig.Manager];
          const constants = {};
          viewManager && Object.keys(viewManager).forEach(key => {
            const value = viewManager[key];
            if (typeof value !== 'function') {
              constants[key] = value;
            }
          });
          return constants;
        },
      });
      defineLazyObjectProperty(viewConfig, 'Commands', {
        get: () => {
          const viewManager = NativeModules[viewConfig.Manager];
          const commands = {};
          let index = 0;
          viewManager && Object.keys(viewManager).forEach(key => {
            const value = viewManager[key];
            if (typeof value === 'function') {
              commands[key] = index++;
            }
          });
          return commands;
        },
      });
    }
  });
} else if (Platform.OS === 'android' && UIManager.AndroidLazyViewManagersEnabled) {
  // TODO fill this out
}

module.exports = UIManager;
