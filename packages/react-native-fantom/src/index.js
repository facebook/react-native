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
import type ReactNativeDocument from 'react-native/src/private/webapis/dom/nodes/ReactNativeDocument';

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
  #document: ?ReactNativeDocument;

  #hasRendered: boolean = false;

  constructor(config?: RootConfig) {
    this.#surfaceId = globalSurfaceIdCounter;
    this.#viewportWidth = config?.viewportWidth ?? DEFAULT_VIEWPORT_WIDTH;
    this.#viewportHeight = config?.viewportHeight ?? DEFAULT_VIEWPORT_HEIGHT;
    this.#devicePixelRatio =
      config?.devicePixelRatio ?? DEFAULT_DEVICE_PIXEL_RATIO;
    globalSurfaceIdCounter += 10;
  }

  // $FlowExpectedError[unsafe-getters-setters]
  get document(): ReactNativeDocument {
    if (this.#document == null) {
      throw new Error(
        'Cannot get `document` from root because it has not been rendered.',
      );
    }

    return this.#document;
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

    if (this.#document == null) {
      // $FlowExpectedError[incompatible-type] We know that `getPublicInstanceFromRootTag` returns `ReactNativeDocument | null` in Fantom.
      this.#document = ReactFabric.getPublicInstanceFromRootTag(
        this.#surfaceId,
      );
    }
  }

  takeMountingManagerLogs(): Array<string> {
    return NativeFantom.takeMountingManagerLogs(this.#surfaceId);
  }

  destroy() {
    // TODO: check for leaks.
    NativeFantom.stopSurface(this.#surfaceId);
    NativeFantom.flushMessageQueue();
    this.#document = null;
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
 *
 * @param task - The task to be scheduled.
 *
 * @example
 * ```
 * Fantom.scheduleTask(() => {
 *   // Task to be run within React Native's scheduling.
 * });
 *
 * // The task has not run yet.
 *
 * Fantom.runWorkLoop(); // Trigger work loop.
 *
 * // The task has been executed.
 * ```
 */
export function scheduleTask(task: () => void | Promise<void>) {
  nativeRuntimeScheduler.unstable_scheduleCallback(DEFAULT_TASK_PRIORITY, task);
}

let flushingQueue = false;

/**
 * Runs a task on the event loop.
 * React must run inside of event loop to ensure scheduling environment is closer to production.
 *
 * @param task - The task to run.
 *
 * @example
 * ```
 * const root = Fantom.createRoot();
 * Fantom.runTask(() => {
 *   root.render(<View />);
 * });
 * ```
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

/**
 * Simulates running a task on the UI thread and forces side effect to drain
 * the event queue, scheduling events to be dispatched to JavaScript.
 * To be used when enqueuing native events.
 *
 * @param task - The task to run on the UI thread.
 *
 * @example
 * ```
 * Fantom.runOnUIThread(() => {
 *   Fantom.enqueueNativeEvent(element, 'focus');
 * });
 *
 * // The effects of `focus` event are *not* yet observable.
 *
 * Fantom.runWorkLoop();
 *
 * // The effects of `focus` event are now observable.
 * ```
 */
export function runOnUIThread(task: () => void) {
  task();
  NativeFantom.flushEventQueue();
}

/**
 * Runs a side effect to drain the event queue and dispatches events to JavaScript.
 * Useful to flash out all tasks.
 */
export function flushAllNativeEvents() {
  NativeFantom.flushEventQueue();
  runWorkLoop();
}

/**
 * Runs the event loop until all tasks are executed.
 * To be used with `Fantom.enqueueNativeEvent` and `Fantom.scheduleTask`.
 *
 * @example
 * ```
 * Fantom.scheduleTask(() => {
 *   // Task to be run within React Native's scheduling.
 * });
 *
 * // The task has not run yet.
 *
 * Fantom.runWorkLoop();
 *
 * // The task has been executed.
 * ```
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

/**
 * Create a Root that can render a React component tree.
 *
 * Accepts an optional RootConfig with the following optional options:
 * @param devicePixelRatio - Numeric value, defaults to 3 (iPhone 14).
 * @param viewportHeight - Numeric value, defaults to 844 (iPhone 14).
 * @param viewportWidth - Numeric value, defaults to 390 (iPhone 14).
 *
 * @example
 * ```
 * const root = Fantom.createRoot({
 *  viewportWidth: 200, // default is 390
 *  viewportHeight: 600, // default is 844
 *  devicePixelRatio: 2, // default is 3
 * });
 * ```
 */
export function createRoot(rootConfig?: RootConfig): Root {
  return new Root(rootConfig);
}

/**
 * This is a low level method to enqueue a native event to a node.
 * It does not wait for it to be flushed in the UI thread or for it to be
 * processed by JS.
 *
 * When you simply need to dispatch a native event and observe its effects, use `dispatchNativeEvent`.
 *
 * @param node - The node to which the event will be dispatched. You must make sure the event is appropriate for the provided node. For example, if sending a scroll event, you must make sure the node is of type <ScrollView />.
 * @param type - The type of the event. e.g 'focus', 'blur', 'change', 'scroll', etc.
 * @param payload - The data associated with the event. What is delivered as `event.nativeEvent` on a component.
 * @param options - Object describing what priority the event is and whether it gets coalesced. For event priority, see `NativeEventCategory`.
 *
 * @example
 * ```
 * Fantom.runOnUIThread(() => {
 *   Fantom.enqueueNativeEvent(element, 'focus');
 * });
 *
 * // The effects of `focus` event are *not* yet observable.
 *
 * Fantom.runWorkLoop();
 *
 * // The effects of `focus` event are observable.
 * ```
 */
export function enqueueNativeEvent(
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

/**
 * Dispatches a native event and makes sure its effects are observable after calling this method.
 *
 * @param node - The node to which the event will be dispatched. You must make sure the event is appropriate for the provided node. For example, if sending a scroll event, you must make sure the node is of type <ScrollView />.
 * @param type - The type of the event. e.g 'focus', 'blur', 'change', 'scroll', etc.
 * @param payload - The data associated with the event. What is delivered as `event.nativeEvent` on a component.
 * @param options - Object describing what priority the event is and whether it gets coalesced. For event priority, see `NativeEventCategory`.
 *
 * @example
 * ```
 * Fantom.dispatchNativeEvent(element, 'focus');
 *
 * // The effects of `focus` are immediately observable.
 * ```
 */
export function dispatchNativeEvent(
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

export type ScrollEventOptions = {
  x: number,
  y: number,
  zoomScale?: number,
};

/**
 * Enqueues an event to scroll a <ScrollView /> node to the given coordinates.
 * It does not wait for it to be flushed in the UI thread or for it to be
 * processed by JS.
 *
 * When you need to simply scroll a <ScrollView /> and observe effects immediately, use `Fantom.scrollTo`.
 *
 * @params node - A node to be scrolled. Must be of type <ScrollView />.
 * @params options - Object describing the scroll position and zoom level. See `ScrollEventOptions` for more details.
 *
 * @example
 * ```
 * const root = Fantom.createRoot();
 * let maybeScrollViewNode;
 *
 * Fantom.runTask(() => {
 *   root.render(
 *     <ScrollView
 *       ref={node => {
 *         maybeScrollViewNode = node;
 *       }} />
 *       <ScrollViewContent />
 *     </ScrollView>,
 *   );
 * });
 *
 * const element = ensureInstance(maybeScrollViewNode, ReactNativeElement);
 *
 * Fantom.runOnUIThread(() => {
 *   Fantom.enqueueScrollEvent(element, {
 *     x: 20,
 *     y: 10,
 *  });
 *
 * // The changes from scroll event are *not* yet observable.
 *
 * Fantom.runWorkLoop();
 *
 * // The changes from scroll event are observable.
 * ```
 */
export function enqueueScrollEvent(
  node: ReactNativeElement,
  options: ScrollEventOptions,
) {
  const shadowNode = getNativeNodeReference(node);
  NativeFantom.enqueueScrollEvent(shadowNode, options);
}

/**
 * Scrolls the specified ScrollView node to the given coordinates on the UI thread.
 * The call is immediately observable unlike `Fantom.enqueueScrollEvent` where the
 * event is queued and not processed.
 *
 * @params node - A node to be scrolled. Must be of type <ScrollView />.
 * @params options - Object describing the scroll position and zoom level. See `ScrollEventOptions` for more details.
 *
 * @example
 * ```
 * const root = Fantom.createRoot();
 * let maybeScrollViewNode;
 *
 * Fantom.runTask(() => {
 *   root.render(
 *     <ScrollView
 *       ref={node => {
 *         maybeScrollViewNode = node;
 *       }} />
 *       <ScrollViewContent />
 *     </ScrollView>,
 *   );
 * });
 *
 * const element = ensureInstance(maybeScrollViewNode, ReactNativeElement);
 *
 * Fantom.scrollTo(element, {x: 0, y: 20});
 *
 * // Assert that changes from Fantom.scrollTo are in effect.
 * ```
 */
export function scrollTo(
  node: ReactNativeElement,
  options: ScrollEventOptions,
) {
  runOnUIThread(() => {
    enqueueScrollEvent(node, options);
  });

  runWorkLoop();
}

/**
 * Enqueues modal size update for a given node.
 * It does not wait for it to be processed and effects are not observable after calling this method.
 * Can only be called on <Modal />.
 *
 * @params node - A node to have its size updated. Must be of type <Modal />.
 * @params size - New size for the node. This would typically be screen size.
 *
 * @example
 * ```
 * Fantom.runOnUIThread(() => {
 *   Fantom.enqueueModalSizeUpdate(modalElement, {
 *     width: 100,
 *     height: 100,
 *   });
 * });
 *
 * // The effects of `enqueueModalSizeUpdate` are *not* yet observable.
 *
 * Fantom.runWorkLoop();
 *
 * // The effects of `enqueueModalSizeUpdate` are yet observable.
 * ```
 */
export function enqueueModalSizeUpdate(
  node: ReactNativeElement,
  size: {width: number, height: number},
) {
  const shadowNode = getNativeNodeReference(node);
  NativeFantom.enqueueModalSizeUpdate(shadowNode, size.width, size.height);
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

/**
 * Saves a heap snapshot after forcing garbage collection.
 *
 * The heapsnapshot is saved to the filename supplied as an argument.
 * If a relative path is supplied, it will be saved relative to where you are invoking the tests.
 *
 * The supplied filename should end in .heapsnapshot, and it can be opened
 * using the "Memory" pane in Chrome DevTools.
 *
 * @param filepath - File where JS memory heap will be saved.
 */
export function saveJSMemoryHeapSnapshot(filePath: string): void {
  if (getConstants().isRunningFromCI) {
    throw new Error('Unexpected call to `saveJSMemoryHeapSnapshot` from CI');
  }

  NativeFantom.saveJSMemoryHeapSnapshot(filePath);
}
