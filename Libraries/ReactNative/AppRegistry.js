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

const BatchedBridge = require('BatchedBridge');
const BugReporting = require('BugReporting');
const FrameRateLogger = require('FrameRateLogger');
const NativeModules = require('NativeModules');
const ReactNative = require('ReactNative');
const SceneTracker = require('SceneTracker');

const infoLog = require('infoLog');
const invariant = require('fbjs/lib/invariant');
const renderApplication = require('renderApplication');

if (__DEV__) {
  // In order to use Cmd+P to record/dump perf data, we need to make sure
  // this module is available in the bundle
  require('RCTRenderingPerf');
}

type Task = (taskData: any) => Promise<void>;
type TaskProvider = () => Task;
export type ComponentProvider = () => ReactClass<any>;
export type ComponentProviderInstrumentationHook =
  (component: ComponentProvider) => ReactClass<any>;
export type AppConfig = {
  appKey: string,
  component?: ComponentProvider,
  run?: Function,
  section?: boolean,
};
export type Runnable = {
  component?: ComponentProvider,
  run: Function,
};
export type Runnables = {
  [appKey: string]: Runnable,
};
export type Registry = {
  sections: Array<string>,
  runnables: Runnables,
};

const runnables: Runnables = {};
let runCount = 1;
const sections: Runnables = {};
const tasks: Map<string, TaskProvider> = new Map();
let componentProviderInstrumentationHook: ComponentProviderInstrumentationHook =
  (component: ComponentProvider) => component();
let _frameRateLoggerSceneListener = null;


/**
 * `AppRegistry` is the JS entry point to running all React Native apps.  App
 * root components should register themselves with
 * `AppRegistry.registerComponent`, then the native system can load the bundle
 * for the app and then actually run the app when it's ready by invoking
 * `AppRegistry.runApplication`.
 *
 * To "stop" an application when a view should be destroyed, call
 * `AppRegistry.unmountApplicationComponentAtRootTag` with the tag that was
 * passed into `runApplication`. These should always be used as a pair.
 *
 * `AppRegistry` should be `require`d early in the `require` sequence to make
 * sure the JS execution environment is setup before other modules are
 * `require`d.
 */
const AppRegistry = {
  registerConfig(config: Array<AppConfig>): void {
    config.forEach((appConfig) => {
      if (appConfig.run) {
        AppRegistry.registerRunnable(appConfig.appKey, appConfig.run);
      } else {
        invariant(
          appConfig.component != null,
          'AppRegistry.registerConfig(...): Every config is expected to set ' +
          'either `run` or `component`, but `%s` has neither.',
          appConfig.appKey
        );
        AppRegistry.registerComponent(
          appConfig.appKey,
          appConfig.component,
          appConfig.section,
        );
      }
    });
  },

  registerComponent(
    appKey: string,
    component: ComponentProvider,
    section?: boolean,
  ): string {
    runnables[appKey] = {
      component,
      run: (appParameters) =>
        renderApplication(
          componentProviderInstrumentationHook(component),
          appParameters.initialProps,
          appParameters.rootTag
        )
    };
    if (section) {
      sections[appKey] = runnables[appKey];
    }
    return appKey;
  },

  registerRunnable(appKey: string, run: Function): string {
    runnables[appKey] = {run};
    return appKey;
  },

  registerSection(appKey: string, component: ComponentProvider): void {
    AppRegistry.registerComponent(appKey, component, true);
  },

  getAppKeys(): Array<string> {
    return Object.keys(runnables);
  },

  getSectionKeys(): Array<string> {
    return Object.keys(sections);
  },

  getSections(): Runnables {
    return {
      ...sections
    };
  },

  getRunnable(appKey: string): ?Runnable {
    return runnables[appKey];
  },

  getRegistry(): Registry {
    return {
      sections: AppRegistry.getSectionKeys(),
      runnables: {...runnables},
    };
  },

  setComponentProviderInstrumentationHook(hook: ComponentProviderInstrumentationHook) {
    componentProviderInstrumentationHook = hook;
  },

  runApplication(appKey: string, appParameters: any): void {
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
      'Application ' + appKey + ' has not been registered.\n\n' +
      'Hint: This error often happens when you\'re running the packager ' +
      '(local dev server) from a wrong folder. For example you have ' +
      'multiple apps and the packager is still running for the app you ' +
      'were working on before.\nIf this is the case, simply kill the old ' +
      'packager instance (e.g. close the packager terminal window) ' +
      'and start the packager in the correct app folder (e.g. cd into app ' +
      'folder and run \'npm start\').\n\n' +
      'This error can also happen due to a require() error during ' +
      'initialization or failure to call AppRegistry.registerComponent.\n\n'
    );
    if (!_frameRateLoggerSceneListener) {
      _frameRateLoggerSceneListener = SceneTracker.addActiveSceneChangedListener(
        (scene) => FrameRateLogger.setContext(scene.name)
      );
    }
    SceneTracker.setActiveScene({name: appKey});
    runnables[appKey].run(appParameters);
  },

  unmountApplicationComponentAtRootTag(rootTag: number): void {
    ReactNative.unmountComponentAtNodeAndRemoveContainer(rootTag);
  },

  /**
   * Register a headless task. A headless task is a bit of code that runs without a UI.
   * @param taskKey the key associated with this task
   * @param task    a promise returning function that takes some data passed from the native side as
   *                the only argument; when the promise is resolved or rejected the native side is
   *                notified of this event and it may decide to destroy the JS context.
   */
  registerHeadlessTask(taskKey: string, task: TaskProvider): void {
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
  startHeadlessTask(taskId: number, taskKey: string, data: any): void {
    const taskProvider = tasks.get(taskKey);
    if (!taskProvider) {
      throw new Error(`No task registered for key ${taskKey}`);
    }
    taskProvider()(data)
      .then(() => NativeModules.HeadlessJsTaskSupport.notifyTaskFinished(taskId))
      .catch(reason => {
        console.error(reason);
        NativeModules.HeadlessJsTaskSupport.notifyTaskFinished(taskId);
      });
  }

};

BatchedBridge.registerCallableModule(
  'AppRegistry',
  AppRegistry
);

module.exports = AppRegistry;
