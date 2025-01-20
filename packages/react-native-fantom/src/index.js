/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  FantomRenderedOutput,
  RenderOutputConfig,
} from './getFantomRenderedOutput';
import type {MixedElement} from 'react';

import ReactNativeElement from '../../react-native/src/private/webapis/dom/nodes/ReadOnlyNode';
import {getShadowNode} from '../../react-native/src/private/webapis/dom/nodes/ReadOnlyNode';
import * as Benchmark from './Benchmark';
import getFantomRenderedOutput from './getFantomRenderedOutput';
import ReactFabric from 'react-native/Libraries/Renderer/shims/ReactFabric';
import NativeFantom from 'react-native/src/private/specs/modules/NativeFantom';

let globalSurfaceIdCounter = 1;

const nativeRuntimeScheduler = global.nativeRuntimeScheduler;
const schedulerPriorityImmediate =
  nativeRuntimeScheduler.unstable_ImmediatePriority;

export type RootConfig = {
  viewportWidth?: number,
  viewportHeight?: number,
  devicePixelRatio?: number,
};

// Defaults use iPhone 14 values (very common device).
const DEFAULT_VIEWPORT_WIDTH = 390;
const DEFAULT_VIEWPORT_HEIGHT = 844;
const DEFAULT_DEVICE_PIXEL_RATIO = 3;

class Root {
  #surfaceId: number;
  #viewportWidth: number;
  #viewportHeight: number;
  #devicePixelRatio: number;

  #hasRendered: boolean = false;

  constructor(config?: RootConfig) {
    this.#surfaceId = globalSurfaceIdCounter;
    this.#viewportWidth = config?.viewportWidth ?? DEFAULT_VIEWPORT_WIDTH;
    this.#viewportHeight = config?.viewportHeight ?? DEFAULT_VIEWPORT_HEIGHT;
    this.#devicePixelRatio =
      config?.devicePixelRatio ?? DEFAULT_DEVICE_PIXEL_RATIO;
    globalSurfaceIdCounter += 10;
  }

  render(element: MixedElement) {
    if (!this.#hasRendered) {
      NativeFantom.startSurface(
        this.#surfaceId,
        this.#viewportWidth,
        this.#viewportHeight,
        this.#devicePixelRatio,
      );
      this.#hasRendered = true;
    }

    ReactFabric.render(element, this.#surfaceId, null, true);
  }

  getMountingLogs(): Array<string> {
    return NativeFantom.getMountingManagerLogs(this.#surfaceId);
  }

  destroy() {
    // TODO: check for leaks.
    NativeFantom.stopSurface(this.#surfaceId);
    NativeFantom.flushMessageQueue();
  }

  getRenderedOutput(config: RenderOutputConfig = {}): FantomRenderedOutput {
    return getFantomRenderedOutput(this.#surfaceId, config);
  }

  // TODO: add an API to check if all surfaces were deallocated when tests are finished.
}

export type {Root};

const DEFAULT_TASK_PRIORITY = schedulerPriorityImmediate;

/**
 * Schedules a task to run on the event loop.
 * If the work loop is running, it will be executed according to its priority.
 * Otherwise, it will wait in the queue until the work loop runs.
 */
export function scheduleTask(task: () => void | Promise<void>) {
  nativeRuntimeScheduler.unstable_scheduleCallback(DEFAULT_TASK_PRIORITY, task);
}

let flushingQueue = false;

/*
 * Runs a task on the event loop. To be used together with root.render.
 *
 * React must run inside of event loop to ensure scheduling environment is closer to production.
 */
export function runTask(task: () => void | Promise<void>) {
  if (flushingQueue) {
    throw new Error(
      'Nested `runTask` calls are not allowed. If you want to schedule a task from inside another task, use `scheduleTask` instead.',
    );
  }

  scheduleTask(task);
  runWorkLoop();
}

/*
 * Simmulates running a task on the UI thread and forces side effect to drain the event queue, dispatching events to JavaScript.
 */
export function runOnUIThread(task: () => void) {
  task();
  NativeFantom.flushEventQueue();
}

/**
 * Runs the event loop until all tasks are executed.
 */
export function runWorkLoop(): void {
  if (flushingQueue) {
    throw new Error(
      'Cannot start the work loop because it is already running. If you want to schedule a task from inside another task, use `scheduleTask` instead.',
    );
  }

  try {
    flushingQueue = true;
    NativeFantom.flushMessageQueue();
  } finally {
    flushingQueue = false;
  }
}

// TODO: Add option to define surface props and pass it to startSurface
// Surfacep rops: concurrentRoot, surfaceWidth, surfaceHeight, layoutDirection, pointScaleFactor.
export function createRoot(rootConfig?: RootConfig): Root {
  return new Root(rootConfig);
}

export function dispatchNativeEvent(node: ReactNativeElement, type: string) {
  const shadowNode = getShadowNode(node);
  NativeFantom.dispatchNativeEvent(shadowNode, type);
}

export const unstable_benchmark = Benchmark;

type FantomConstants = $ReadOnly<{
  isRunningFromCI: boolean,
}>;

let constants: FantomConstants = {
  isRunningFromCI: false,
};

export function getConstants(): FantomConstants {
  return constants;
}

export function setConstants(newConstants: FantomConstants): void {
  constants = newConstants;
}

/**
 * Quick and dirty polyfills required by tinybench.
 */

if (typeof global.Event === 'undefined') {
  global.Event = class Event {
    constructor() {}
  };
} else {
  console.warn(
    'The global Event class is already defined. If this API is already defined by React Native, you might want to remove this logic.',
  );
}

if (typeof global.EventTarget === 'undefined') {
  global.EventTarget = class EventTarget {
    listeners: $FlowFixMe;

    constructor() {
      this.listeners = {};
    }

    addEventListener(type: string, cb: () => void) {
      if (!(type in this.listeners)) {
        this.listeners[type] = [];
      }
      this.listeners[type].push(cb);
    }

    removeEventListener(type: string, cb: () => void): void {
      if (!(type in this.listeners)) {
        return;
      }
      let handlers = this.listeners[type];
      for (let i in handlers) {
        if (cb === handlers[i]) {
          handlers.splice(i, 1);
          return;
        }
      }
    }

    dispatchEvent(type: string, event: Event) {
      if (!(type in this.listeners)) {
        return;
      }
      let handlers = this.listeners[type];
      for (let i in handlers) {
        handlers[i].call(this, event);
      }
    }

    clearEventListeners() {
      for (let i in this.listeners) {
        delete this.listeners[i];
      }
    }
  };
} else {
  console.warn(
    'The global Event class is already defined. If this API is already defined by React Native, you might want to remove this logic.',
  );
}
