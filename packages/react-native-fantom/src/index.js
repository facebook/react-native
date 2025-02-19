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
import type {RootTag} from 'react-native/Libraries/ReactNative/RootTag';

import ReactNativeElement from '../../react-native/src/private/webapis/dom/nodes/ReadOnlyNode';
import * as Benchmark from './Benchmark';
import getFantomRenderedOutput from './getFantomRenderedOutput';
import {createRootTag} from 'react-native/Libraries/ReactNative/RootTag';
import ReactFabric from 'react-native/Libraries/Renderer/shims/ReactFabric';
import NativeFantom, {
  NativeEventCategory,
} from 'react-native/src/private/testing/fantom/specs/NativeFantom';
import {getNativeNodeReference} from 'react-native/src/private/webapis/dom/nodes/internals/NodeInternals';

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

  render(element: MixedElement): void {
    if (!flushingQueue) {
      throw new Error(
        'Unexpected call to `render` outside of the event loop. Please call `render` within a `runTask` callback.',
      );
    }

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

  takeMountingManagerLogs(): Array<string> {
    return NativeFantom.takeMountingManagerLogs(this.#surfaceId);
  }

  destroy() {
    // TODO: check for leaks.
    NativeFantom.stopSurface(this.#surfaceId);
    NativeFantom.flushMessageQueue();
  }

  getRenderedOutput(config: RenderOutputConfig = {}): FantomRenderedOutput {
    return getFantomRenderedOutput(this.#surfaceId, config);
  }

  getRootTag(): RootTag {
    return createRootTag(this.#surfaceId);
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
function scheduleTask(task: () => void | Promise<void>) {
  nativeRuntimeScheduler.unstable_scheduleCallback(DEFAULT_TASK_PRIORITY, task);
}

let flushingQueue = false;

/*
 * Runs a task on the event loop. To be used together with root.render.
 *
 * React must run inside of event loop to ensure scheduling environment is closer to production.
 */
function runTask(task: () => void | Promise<void>) {
  if (flushingQueue) {
    throw new Error(
      'Nested `runTask` calls are not allowed. If you want to schedule a task from inside another task, use `scheduleTask` instead.',
    );
  }

  scheduleTask(task);
  runWorkLoop();
}

/*
 * Simmulates running a task on the UI thread and forces side effect to drain the event queue, scheduling events to be dispatched to JavaScript.
 */
function runOnUIThread(task: () => void) {
  task();
  NativeFantom.flushEventQueue();
}

/*
 * Runs a side effect to drain the event queue and dispatches events to JavaScript.
 * Useful to flash out all tasks.
 */
function flushAllNativeEvents() {
  NativeFantom.flushEventQueue();
  runWorkLoop();
}

/**
 * Runs the event loop until all tasks are executed.
 */
function runWorkLoop(): void {
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
function createRoot(rootConfig?: RootConfig): Root {
  return new Root(rootConfig);
}

/**
 * This is a low level method to enqueue a native event to a node.
 * It does not wait for it to be flushed in the UI thread or for it to be
 * processed by JS.
 *
 * For a higher level API, use `dispatchNativeEvent`.
 */
function enqueueNativeEvent(
  node: ReactNativeElement,
  type: string,
  payload?: {[key: string]: mixed},
  options?: {category?: NativeEventCategory, isUnique?: boolean},
) {
  const shadowNode = getNativeNodeReference(node);
  NativeFantom.enqueueNativeEvent(
    shadowNode,
    type,
    payload,
    options?.category,
    options?.isUnique,
  );
}

function dispatchNativeEvent(
  node: ReactNativeElement,
  type: string,
  payload?: {[key: string]: mixed},
  options?: {category?: NativeEventCategory, isUnique?: boolean},
) {
  runOnUIThread(() => {
    enqueueNativeEvent(node, type, payload, options);
  });

  runWorkLoop();
}

function scrollTo(
  node: ReactNativeElement,
  options: {x: number, y: number, zoomScale?: number},
) {
  const shadowNode = getNativeNodeReference(node);
  NativeFantom.scrollTo(shadowNode, options);
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

function saveJSMemoryHeapSnapshot(filePath: string): void {
  if (getConstants().isRunningFromCI) {
    throw new Error('Unexpected call to `saveJSMemoryHeapSnapshot` from CI');
  }

  NativeFantom.saveJSMemoryHeapSnapshot(filePath);
}

export default {
  scheduleTask,
  runTask,
  runOnUIThread,
  runWorkLoop,
  createRoot,
  dispatchNativeEvent,
  enqueueNativeEvent,
  flushAllNativeEvents,
  unstable_benchmark: Benchmark,
  scrollTo,
  saveJSMemoryHeapSnapshot,
};
