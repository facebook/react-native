/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {RootTag} from '../Types/RootTagTypes';
import type {IPerformanceLogger} from '../Utilities/createPerformanceLogger';

import BatchedBridge from '../BatchedBridge/BatchedBridge';
import BugReporting from '../BugReporting/BugReporting';
import createPerformanceLogger from '../Utilities/createPerformanceLogger';
import infoLog from '../Utilities/infoLog';
import SceneTracker from '../Utilities/SceneTracker';
import {coerceDisplayMode} from './DisplayMode';
import HeadlessJsTaskError from './HeadlessJsTaskError';
import NativeHeadlessJsTaskSupport from './NativeHeadlessJsTaskSupport';
import renderApplication from './renderApplication';
import {unmountComponentAtNodeAndRemoveContainer} from './RendererProxy';
import invariant from 'invariant';

type Task = (taskData: any) => Promise<void>;
export type TaskProvider = () => Task;
type TaskCanceller = () => void;
type TaskCancelProvider = () => TaskCanceller;

export type ComponentProvider = () => React$ComponentType<any>;
export type ComponentProviderInstrumentationHook = (
  component: ComponentProvider,
  scopedPerformanceLogger: IPerformanceLogger,
) => React$ComponentType<any>;
export type AppConfig = {
  appKey: string,
  component?: ComponentProvider,
  run?: Function,
  section?: boolean,
  ...
};
export type Runnable = {
  component?: ComponentProvider,
  run: Function,
  ...
};
export type Runnables = {[appKey: string]: Runnable, ...};
export type Registry = {
  sections: Array<string>,
  runnables: Runnables,
  ...
};
export type WrapperComponentProvider = (
  appParameters: any,
) => React$ComponentType<any>;

const runnables: Runnables = {};
let runCount = 1;
const sections: Runnables = {};
const taskProviders: Map<string, TaskProvider> = new Map();
const taskCancelProviders: Map<string, TaskCancelProvider> = new Map();
let componentProviderInstrumentationHook: ComponentProviderInstrumentationHook =
  (component: ComponentProvider) => component();

let wrapperComponentProvider: ?WrapperComponentProvider;
let showArchitectureIndicator = false;

/**
 * `AppRegistry` is the JavaScript entry point to running all React Native apps.
 *
 * See https://reactnative.dev/docs/appregistry
 */
const AppRegistry = {
  setWrapperComponentProvider(provider: WrapperComponentProvider) {
    wrapperComponentProvider = provider;
  },

  enableArchitectureIndicator(enabled: boolean): void {
    showArchitectureIndicator = enabled;
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
   * See https://reactnative.dev/docs/appregistry#registercomponent
   */
  registerComponent(
    appKey: string,
    componentProvider: ComponentProvider,
    section?: boolean,
  ): string {
    let scopedPerformanceLogger = createPerformanceLogger();
    runnables[appKey] = {
      componentProvider,
      run: (appParameters, displayMode) => {
        const concurrentRootEnabled =
          appParameters.initialProps?.concurrentRoot ||
          appParameters.concurrentRoot;
        renderApplication(
          componentProviderInstrumentationHook(
            componentProvider,
            scopedPerformanceLogger,
          ),
          appParameters.initialProps,
          appParameters.rootTag,
          wrapperComponentProvider && wrapperComponentProvider(appParameters),
          appParameters.fabric,
          showArchitectureIndicator,
          scopedPerformanceLogger,
          appKey === 'LogBox',
          appKey,
          coerceDisplayMode(displayMode),
          concurrentRootEnabled,
        );
      },
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
   * See https://reactnative.dev/docs/appregistry#runapplication
   */
  runApplication(
    appKey: string,
    appParameters: any,
    displayMode?: number,
  ): void {
    if (appKey !== 'LogBox') {
      const logParams = __DEV__
        ? '" with ' + JSON.stringify(appParameters)
        : '';
      const msg = 'Running "' + appKey + logParams;
      infoLog(msg);
      BugReporting.addSource(
        'AppRegistry.runApplication' + runCount++,
        () => msg,
      );
    }
    invariant(
      runnables[appKey] && runnables[appKey].run,
      `"${appKey}" has not been registered. This can happen if:\n` +
        '* Metro (the local dev server) is run from the wrong folder. ' +
        'Check if Metro is running, stop it and restart it in the current project.\n' +
        "* A module failed to load due to an error and `AppRegistry.registerComponent` wasn't called.",
    );

    SceneTracker.setActiveScene({name: appKey});
    runnables[appKey].run(appParameters, displayMode);
  },

  /**
   * Update initial props for a surface that's already rendered
   */
  setSurfaceProps(
    appKey: string,
    appParameters: any,
    displayMode?: number,
  ): void {
    if (appKey !== 'LogBox') {
      const msg =
        'Updating props for Surface "' +
        appKey +
        '" with ' +
        JSON.stringify(appParameters);
      infoLog(msg);
      BugReporting.addSource(
        'AppRegistry.setSurfaceProps' + runCount++,
        () => msg,
      );
    }
    invariant(
      runnables[appKey] && runnables[appKey].run,
      `"${appKey}" has not been registered. This can happen if:\n` +
        '* Metro (the local dev server) is run from the wrong folder. ' +
        'Check if Metro is running, stop it and restart it in the current project.\n' +
        "* A module failed to load due to an error and `AppRegistry.registerComponent` wasn't called.",
    );

    runnables[appKey].run(appParameters, displayMode);
  },

  /**
   * Stops an application when a view should be destroyed.
   *
   * See https://reactnative.dev/docs/appregistry#unmountapplicationcomponentatroottag
   */
  unmountApplicationComponentAtRootTag(rootTag: RootTag): void {
    unmountComponentAtNodeAndRemoveContainer(rootTag);
  },

  /**
   * Register a headless task. A headless task is a bit of code that runs without a UI.
   *
   * See https://reactnative.dev/docs/appregistry#registerheadlesstask
   */
  registerHeadlessTask(taskKey: string, taskProvider: TaskProvider): void {
    // $FlowFixMe[object-this-reference]
    this.registerCancellableHeadlessTask(taskKey, taskProvider, () => () => {
      /* Cancel is no-op */
    });
  },

  /**
   * Register a cancellable headless task. A headless task is a bit of code that runs without a UI.
   *
   * See https://reactnative.dev/docs/appregistry#registercancellableheadlesstask
   */
  registerCancellableHeadlessTask(
    taskKey: string,
    taskProvider: TaskProvider,
    taskCancelProvider: TaskCancelProvider,
  ): void {
    if (taskProviders.has(taskKey)) {
      console.warn(
        `registerHeadlessTask or registerCancellableHeadlessTask called multiple times for same key '${taskKey}'`,
      );
    }
    taskProviders.set(taskKey, taskProvider);
    taskCancelProviders.set(taskKey, taskCancelProvider);
  },

  /**
   * Only called from native code. Starts a headless task.
   *
   * See https://reactnative.dev/docs/appregistry#startheadlesstask
   */
  startHeadlessTask(taskId: number, taskKey: string, data: any): void {
    const taskProvider = taskProviders.get(taskKey);
    if (!taskProvider) {
      console.warn(`No task registered for key ${taskKey}`);
      if (NativeHeadlessJsTaskSupport) {
        NativeHeadlessJsTaskSupport.notifyTaskFinished(taskId);
      }
      return;
    }
    taskProvider()(data)
      .then(() => {
        if (NativeHeadlessJsTaskSupport) {
          NativeHeadlessJsTaskSupport.notifyTaskFinished(taskId);
        }
      })
      .catch(reason => {
        console.error(reason);

        if (
          NativeHeadlessJsTaskSupport &&
          reason instanceof HeadlessJsTaskError
        ) {
          NativeHeadlessJsTaskSupport.notifyTaskRetry(taskId).then(
            retryPosted => {
              if (!retryPosted) {
                NativeHeadlessJsTaskSupport.notifyTaskFinished(taskId);
              }
            },
          );
        }
      });
  },

  /**
   * Only called from native code. Cancels a headless task.
   *
   * See https://reactnative.dev/docs/appregistry#cancelheadlesstask
   */
  cancelHeadlessTask(taskId: number, taskKey: string): void {
    const taskCancelProvider = taskCancelProviders.get(taskKey);
    if (!taskCancelProvider) {
      throw new Error(`No task canceller registered for key '${taskKey}'`);
    }
    taskCancelProvider()();
  },
};

if (!(global.RN$Bridgeless === true)) {
  BatchedBridge.registerCallableModule('AppRegistry', AppRegistry);

  AppRegistry.registerComponent('LogBox', () => {
    if (__DEV__) {
      return require('../LogBox/LogBoxInspectorContainer').default;
    } else {
      return function NoOp() {
        return null;
      };
    }
  });
}

module.exports = AppRegistry;
