/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AppRegistry
 * @flow
 */
'use strict';

var invariant = require('invariant');
var renderApplication = require('renderApplication');

if (__DEV__) {
  // In order to use Cmd+P to record/dump perf data, we need to make sure
  // this module is available in the bundle
  require('RCTRenderingPerf');
}

var runnables = {};

type AppConfig = {
  appKey: string;
  component: ReactClass<any, any, any>;
  run?: Function;
};

/**
 * `AppRegistry` is the JS entry point to running all React Native apps.  App
 * root components should register themselves with
 * `AppRegistry.registerComponent`, then the native system can load the bundle
 * for the app and then actually run the app when it's ready by invoking
 * `AppRegistry.runApplication`.
 *
 * `AppRegistry` should be `require`d early in the `require` sequence to make
 * sure the JS execution environment is setup before other modules are
 * `require`d.
 */
var AppRegistry = {
  registerConfig: function(config: Array<AppConfig>) {
    for (var i = 0; i < config.length; ++i) {
      var appConfig = config[i];
      if (appConfig.run) {
        AppRegistry.registerRunnable(appConfig.appKey, appConfig.run);
      } else {
        AppRegistry.registerComponent(appConfig.appKey, appConfig.component);
      }
    }
  },

  registerComponent: function(appKey: string, getComponentFunc: Function): string {
    runnables[appKey] = {
      run: (appParameters) =>
        renderApplication(getComponentFunc(), appParameters.initialProps, appParameters.rootTag)
    };
    return appKey;
  },

  registerRunnable: function(appKey: string, func: Function): string {
    runnables[appKey] = {run: func};
    return appKey;
  },

  runApplication: function(appKey: string, appParameters: any): void {
    console.log(
      'Running application "' + appKey + '" with appParams: ' +
      JSON.stringify(appParameters) + '. ' +
      '__DEV__ === ' + String(__DEV__) +
      ', development-level warning are ' + (__DEV__ ? 'ON' : 'OFF') +
      ', performance optimizations are ' + (__DEV__ ? 'OFF' : 'ON')
    );
    invariant(
      runnables[appKey] && runnables[appKey].run,
      'Application ' + appKey + ' has not been registered. This ' +
      'is either due to a require() error during initialization ' +
      'or failure to call AppRegistry.registerComponent.'
    );
    runnables[appKey].run(appParameters);
  },
};

module.exports = AppRegistry;
