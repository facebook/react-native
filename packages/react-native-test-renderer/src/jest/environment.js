/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const NodeEnv = require('jest-environment-node').TestEnvironment;

module.exports = class ReactNativeEnvironment extends NodeEnv {
  customExportConditions = ['require', 'react-native'];

  constructor(config, context) {
    super(config, context);
  }

  async setup() {
    await super.setup();
    this.assignGlobals();
    this.initializeTurboModuleRegistry();
  }

  assignGlobals() {
    Object.defineProperties(this.global, {
      __DEV__: {
        configurable: true,
        enumerable: true,
        value: true,
        writable: true,
      },
    });
    this.global.IS_REACT_ACT_ENVIRONMENT = true;
  }

  initializeTurboModuleRegistry() {
    const dims = {width: 100, height: 100, scale: 1, fontScale: 1};
    const DIMS = {
      screen: {
        ...dims,
      },
      window: {
        ...dims,
      },
    };
    this.global.nativeModuleProxy = name => ({})[name];
    this.global.__turboModuleProxy = name =>
      ({
        SourceCode: {getConstants: () => ({scriptURL: ''})},
        WebSocketModule: {connect: () => {}},
        FileReaderModule: {},
        AppState: {getConstants: () => ({}), getCurrentAppState: () => ({})},
        DeviceInfo: {getConstants: () => ({Dimensions: DIMS})},
        UIManager: {getConstants: () => ({})},
        Timing: {},
        DevSettings: {},
        PlatformConstants: {
          getConstants: () => ({reactNativeVersion: '1000.0.0'}),
        },
        Networking: {},
        ImageLoader: {},
        NativePerformanceCxx: {},
        NativePerformanceObserverCxx: {},
        LogBox: {},
        SettingsManager: {
          getConstants: () => ({settings: {}}),
        },
        LinkingManager: {},
        I18n: {getConstants: () => ({})},
      })[name];
  }
};
