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

import getFantomRenderedOutput from './getFantomRenderedOutput';

let globalSurfaceIdCounter = 1;

const nativeRuntimeScheduler = global.nativeRuntimeScheduler;
const schedulerPriorityImmediate =
  nativeRuntimeScheduler.unstable_ImmediatePriority;

let ReactFabric = null;
function getReactFabric() {
  if (ReactFabric == null) {
    ReactFabric =
      require('react-native/Libraries/Renderer/shims/ReactFabric').default;
  }
  return ReactFabric;
}

class Root {
  #surfaceId: number;
  #hasRendered: boolean = false;

  constructor() {
    this.#surfaceId = globalSurfaceIdCounter;
    globalSurfaceIdCounter += 10;
  }

  render(element: MixedElement) {
    if (!this.#hasRendered) {
      global.$$JSTesterModuleName$$.startSurface(this.#surfaceId);
      this.#hasRendered = true;
    }

    getReactFabric().render(element, this.#surfaceId, () => {}, true);
  }

  getMountingLogs(): Array<string> {
    return global.$$JSTesterModuleName$$.getMountingManagerLogs(
      this.#surfaceId,
    );
  }

  destroy() {
    // TODO: check for leaks.
    global.$$JSTesterModuleName$$.stopSurface(this.#surfaceId);
    global.$$JSTesterModuleName$$.flushMessageQueue();
  }

  getRenderedOutput(config: RenderOutputConfig = {}): FantomRenderedOutput {
    return getFantomRenderedOutput(this.#surfaceId, config);
  }

  // TODO: add an API to check if all surfaces were deallocated when tests are finished.
}

let flushingQueue = false;

/*
 * Runs a task on on the event loop. To be used together with root.render.
 *
 * React must run inside of event loop to ensure scheduling environment is closer to production.
 */
export function runTask(task: () => void | Promise<void>) {
  if (flushingQueue) {
    throw new Error(
      'Nested runTask calls are not allowed. If you want to schedule a task from inside another task, use scheduleTask instead.',
    );
  }

  nativeRuntimeScheduler.unstable_scheduleCallback(
    schedulerPriorityImmediate,
    task,
  );

  try {
    flushingQueue = true;
    global.$$JSTesterModuleName$$.flushMessageQueue();
  } finally {
    flushingQueue = false;
  }
}

// TODO: Add option to define surface props and pass it to startSurface
// Surfacep rops: concurrentRoot, surfaceWidth, surfaceHeight, layoutDirection, pointScaleFactor.
export function createRoot(): Root {
  return new Root();
}
