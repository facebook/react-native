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

var BatchedBridge = require('BatchedBridge');
var BugReporting = require('BugReporting');
var ReactNative = require('ReactNative');

const infoLog = require('infoLog');
var invariant = require('fbjs/lib/invariant');
var renderApplication = require('renderApplication');

const { HeadlessJsTaskSupport } = require('NativeModules');

if (__DEV__) {
  // In order to use Cmd+P to record/dump perf data, we need to make sure
  // this module is available in the bundle
  require('RCTRenderingPerf');
}

type Task = (taskData: any) => Promise<void>;
type TaskProvider = () => Task;

var runnables = {};
var runCount = 1;
const tasks: Map<string, TaskProvider> = new Map();

type ComponentProvider = () => ReactClass<any>;

type AppConfig = {
  appKey: string,
  component?: ComponentProvider,
  run?: Function,
};

/**
 * `AppRegistry` is the JS entry point to running all React Native apps.  App
 * root components should register themselves with
 * `AppRegistry.registerComponent`, then the native system can load the bundle
 * for the app and then actually run the app when it's ready by invoking
 * `AppRegistry.runApplication`.
 *
 * To "stop" an application when a view should be destroyed, call
 * `AppRegistry.unmountApplicationComponentAtRootTag` with the tag that was
 * pass into `runApplication`. These should always be used as a pair.
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
        invariant(appConfig.component, 'No component provider passed in');
        AppRegistry.registerComponent(appConfig.appKey, appConfig.component);
      }
    }
  },

  registerComponent: function(appKey: string, getComponentFunc: ComponentProvider): string {
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

  getAppKeys: function(): Array<string> {
    return Object.keys(runnables);
  },

  runApplication: function(appKey: string, appParameters: any): void {
    const msg =
      'Running application "' + appKey + '" with appParams: ' +
      JSON.stringify(appParameters) + '. ' +
      '__DEV__ === ' + String(__DEV__) +
      ', development-level warning are ' + (__DEV__ ? 'ON' : 'OFF') +
      ', performance optimizations are ' + (__DEV__ ? 'OFF' : 'ON');
    infoLog(msg);
    BugReporting.addSource('AppRegistry.runApplication' + runCount++, () => msg);
    invariant(
      runnables[appKey] && runnables[appKey].run,
      'Application ' + appKey + ' has not been registered. This ' +
      'is either due to a require() error during initialization ' +
      'or failure to call AppRegistry.registerComponent.'
    );
    runnables[appKey].run(appParameters);
  },

  unmountApplicationComponentAtRootTag: function(rootTag : number) {
    ReactNative.unmountComponentAtNodeAndRemoveContainer(rootTag);
  },

  /**
   * Register a headless task. A headless task is a bit of code that runs without a UI.
   * @param taskKey the key associated with this task
   * @param task    a promise returning function that takes some data passed from the native side as
   *                the only argument; when the promise is resolved or rejected the native side is
   *                notified of this event and it may decide to destroy the JS context.
   */
  registerHeadlessTask: function(taskKey: string, task: TaskProvider): void {
    if (tasks.has(taskKey)) {
      console.warn(`registerHeadlessTask called multiple times for same key '${taskKey}'`);
    }
    tasks.set(taskKey, task);
  },

  /**
   * Only called from native code. Starts a headless task.
   *
   * @param taskId the native id for this task instance to keep track of its execution
   * @param taskKey the key for the task to start
   * @param data the data to pass to the task
   */
  startHeadlessTask: function(taskId: number, taskKey: string, data: any): void {
    const taskProvider = tasks.get(taskKey);
    if (!taskProvider) {
      throw new Error(`No task registered for key ${taskKey}`);
    }
    taskProvider()(data)
      .then(() => HeadlessJsTaskSupport.notifyTaskFinished(taskId))
      .catch(reason => {
        console.error(reason);
        HeadlessJsTaskSupport.notifyTaskFinished(taskId);
      });
  }

};

BatchedBridge.registerCallableModule(
  'AppRegistry',
  AppRegistry
);

module.exports = AppRegistry;
