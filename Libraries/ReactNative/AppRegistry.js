/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule AppRegistry
 * @flow
 * @format
 */
'use strict';

const BatchedBridge = require('BatchedBridge');
const BugReporting = require('BugReporting');
const NativeModules = require('NativeModules');
const ReactNative = require('ReactNative');
const SceneTracker = require('SceneTracker');

const infoLog = require('infoLog');
const invariant = require('fbjs/lib/invariant');
const renderApplication = require('renderApplication');

type Task = (taskData: any) => Promise<void>;
type TaskProvider = () => Task;
export type ComponentProvider = () => React$ComponentType<any>;
export type ComponentProviderInstrumentationHook = (
  component: ComponentProvider,
) => React$ComponentType<any>;
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
export type WrapperComponentProvider = any => React$ComponentType<*>;

const runnables: Runnables = {};
let runCount = 1;
const sections: Runnables = {};
const tasks: Map<string, TaskProvider> = new Map();
let componentProviderInstrumentationHook: ComponentProviderInstrumentationHook = (
  component: ComponentProvider,
) => component();

let wrapperComponentProvider: ?WrapperComponentProvider;

/**
 * `AppRegistry` is the JavaScript entry point to running all React Native apps.
 *
 * See http://facebook.github.io/react-native/docs/appregistry.html
 */
const AppRegistry = {
  setWrapperComponentProvider(provider: WrapperComponentProvider) {
    wrapperComponentProvider = provider;
  },

  registerConfig(config: Array<AppConfig>): void {
    config.forEach(appConfig => {
      if (appConfig.run) {
        AppRegistry.registerRunnable(appConfig.appKey, appConfig.run);
      } else {
        invariant(
          appConfig.component != null,
          'AppRegistry.registerConfig(...): Every config is expected to set ' +
            'either `run` or `component`, but `%s` has neither.',
          appConfig.appKey,
        );
        AppRegistry.registerComponent(
          appConfig.appKey,
          appConfig.component,
          appConfig.section,
        );
      }
    });
  },

  /**
   * Registers an app's root component.
   *
   * See http://facebook.github.io/react-native/docs/appregistry.html#registercomponent
   */
  registerComponent(
    appKey: string,
    componentProvider: ComponentProvider,
    section?: boolean,
  ): string {
    runnables[appKey] = {
      componentProvider,
      run: appParameters =>
        renderApplication(
          componentProviderInstrumentationHook(componentProvider),
          appParameters.initialProps,
          appParameters.rootTag,
          wrapperComponentProvider && wrapperComponentProvider(appParameters),
        ),
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
      ...sections,
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

  setComponentProviderInstrumentationHook(
    hook: ComponentProviderInstrumentationHook,
  ) {
    componentProviderInstrumentationHook = hook;
  },

  /**
   * Loads the JavaScript bundle and runs the app.
   *
   * See http://facebook.github.io/react-native/docs/appregistry.html#runapplication
   */
  runApplication(appKey: string, appParameters: any): void {
    const msg =
      'Running application "' +
      appKey +
      '" with appParams: ' +
      JSON.stringify(appParameters) +
      '. ' +
      '__DEV__ === ' +
      String(__DEV__) +
      ', development-level warning are ' +
      (__DEV__ ? 'ON' : 'OFF') +
      ', performance optimizations are ' +
      (__DEV__ ? 'OFF' : 'ON');
    infoLog(msg);
    BugReporting.addSource(
      'AppRegistry.runApplication' + runCount++,
      () => msg,
    );
    invariant(
      runnables[appKey] && runnables[appKey].run,
      'Application ' +
        appKey +
        ' has not been registered.\n\n' +
        "Hint: This error often happens when you're running the packager " +
        '(local dev server) from a wrong folder. For example you have ' +
        'multiple apps and the packager is still running for the app you ' +
        'were working on before.\nIf this is the case, simply kill the old ' +
        'packager instance (e.g. close the packager terminal window) ' +
        'and start the packager in the correct app folder (e.g. cd into app ' +
        "folder and run 'npm start').\n\n" +
        'This error can also happen due to a require() error during ' +
        'initialization or failure to call AppRegistry.registerComponent.\n\n',
    );

    SceneTracker.setActiveScene({name: appKey});
    runnables[appKey].run(appParameters);
  },

  /**
   * Stops an application when a view should be destroyed.
   *
   * See http://facebook.github.io/react-native/docs/appregistry.html#unmountapplicationcomponentatroottag
   */
  unmountApplicationComponentAtRootTag(rootTag: number): void {
    ReactNative.unmountComponentAtNodeAndRemoveContainer(rootTag);
  },

  /**
   * Register a headless task. A headless task is a bit of code that runs without a UI.
   *
   * See http://facebook.github.io/react-native/docs/appregistry.html#registerheadlesstask
   */
  registerHeadlessTask(taskKey: string, task: TaskProvider): void {
    if (tasks.has(taskKey)) {
      console.warn(
        `registerHeadlessTask called multiple times for same key '${taskKey}'`,
      );
    }
    tasks.set(taskKey, task);
  },

  /**
   * Only called from native code. Starts a headless task.
   *
   * See http://facebook.github.io/react-native/docs/appregistry.html#startheadlesstask
   */
  startHeadlessTask(taskId: number, taskKey: string, data: any): void {
    const taskProvider = tasks.get(taskKey);
    if (!taskProvider) {
      throw new Error(`No task registered for key ${taskKey}`);
    }
    taskProvider()(data)
      .then(() =>
        NativeModules.HeadlessJsTaskSupport.notifyTaskFinished(taskId),
      )
      .catch(reason => {
        console.error(reason);
        NativeModules.HeadlessJsTaskSupport.notifyTaskFinished(taskId);
      });
  },
};

BatchedBridge.registerCallableModule('AppRegistry', AppRegistry);

module.exports = AppRegistry;
