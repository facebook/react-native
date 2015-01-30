/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule Bundler
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

class Bundler {
  static registerConfig(config) {
    for (var i = 0; i < config.length; ++i) {
      if (config[i].run) {
        Bundler.registerRunnable(config[i].appKey, config[i].run);
      } else {
        Bundler.registerComponent(config[i].appKey, config[i].component);
      }
    }
  }

  static registerComponent(appKey, getComponentFunc) {
    runnables[appKey] = {
      run: (appParameters) =>
        renderApplication(getComponentFunc(), appParameters.initialProps, appParameters.rootTag)
    };
    return appKey;
  }

  static registerRunnable(appKey, func) {
    runnables[appKey] = {run: func};
    return appKey;
  }

  static runApplication(appKey, appParameters) {
    console.log(
      'Running application "' + appKey + '" with appParams: ',
      appParameters
    );

    invariant(
      runnables[appKey] && runnables[appKey].run,
      'Application ' + appKey + ' has not been registered.'
    );
    runnables[appKey].run(appParameters);
  }
}

module.exports = Bundler;
