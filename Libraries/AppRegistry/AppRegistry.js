/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule AppRegistry
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
  registerConfig: function(config) {
    for (var i = 0; i < config.length; ++i) {
      if (config[i].run) {
        AppRegistry.registerRunnable(config[i].appKey, config[i].run);
      } else {
        AppRegistry.registerComponent(config[i].appKey, config[i].component);
      }
    }
  },

  registerComponent: function(appKey, getComponentFunc) {
    runnables[appKey] = {
      run: (appParameters) =>
        renderApplication(getComponentFunc(), appParameters.initialProps, appParameters.rootTag)
    };
    return appKey;
  },

  registerRunnable: function(appKey, func) {
    runnables[appKey] = {run: func};
    return appKey;
  },

  runApplication: function(appKey, appParameters) {
    console.log(
      'Running application "' + appKey + '" with appParams: ' +
      JSON.stringify(appParameters) + '. ' +
      '__DEV__ === ' + __DEV__ +
      ', development-level warning are ' + (__DEV__ ? 'ON' : 'OFF') +
      ', performance optimizations are ' + (__DEV__ ? 'OFF' : 'ON')
    );
    invariant(
      runnables[appKey] && runnables[appKey].run,
      'Application ' + appKey + ' has not been registered.'
    );
    runnables[appKey].run(appParameters);
  },
};

module.exports = AppRegistry;
