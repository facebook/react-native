/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {EmitterSubscription} from '../vendor/emitter/EventEmitter';

export type Handle = number;

export type SimpleTask = {
  name: string;
  gen: () => void;
};
export type PromiseTask = {
  name: string;
  gen: () => Promise<any>;
};

export interface InteractionManagerStatic {
  Events: {
    interactionStart: string;
    interactionComplete: string;
  };

  /**
   * Adds a listener to be invoked when events of the specified type are
   * emitted. An optional calling context may be provided. The data arguments
   * emitted will be passed to the listener function.
   *
   * @param eventType - Name of the event to listen to
   * @param listener - Function to invoke when the specified event is
   *   emitted
   * @param context - Optional context object to use when invoking the
   *   listener
   */
  addListener(
    eventType: string,
    listener: (...args: any[]) => any,
    context?: any,
  ): EmitterSubscription;

  /**
   * Schedule a function to run after all interactions have completed.
   * Returns a cancellable
   */
  runAfterInteractions(task?: (() => any) | SimpleTask | PromiseTask): {
    then: (onfulfilled?: () => any, onrejected?: () => any) => Promise<any>;
    done: (...args: any[]) => any;
    cancel: () => void;
  };

  /**
   * Notify manager that an interaction has started.
   */
  createInteractionHandle(): Handle;

  /**
   * Notify manager that an interaction has completed.
   */
  clearInteractionHandle(handle: Handle): void;

  /**
   * A positive number will use setTimeout to schedule any tasks after
   * the eventLoopRunningTime hits the deadline value, otherwise all
   * tasks will be executed in one setImmediate batch (default).
   */
  setDeadline(deadline: number): void;
}

export const InteractionManager: InteractionManagerStatic;
