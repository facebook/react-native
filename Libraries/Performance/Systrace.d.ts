/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

export interface RelayProfiler {
  attachProfileHandler(
    name: string,
    handler: (name: string, state?: any) => () => void,
  ): void;

  attachAggregateHandler(
    name: string,
    handler: (name: string, callback: () => void) => void,
  ): void;
}

export interface SystraceStatic {
  setEnabled(enabled: boolean): void;

  /**
   * beginEvent/endEvent for starting and then ending a profile within the same call stack frame
   **/
  beginEvent(profileName?: any, args?: any): void;
  endEvent(): void;

  /**
   * beginAsyncEvent/endAsyncEvent for starting and then ending a profile where the end can either
   * occur on another thread or out of the current stack frame, eg await
   * the returned cookie variable should be used as input into the endAsyncEvent call to end the profile
   **/
  beginAsyncEvent(profileName?: any): any;
  endAsyncEvent(profileName?: any, cookie?: any): void;

  /**
   * counterEvent registers the value to the profileName on the systrace timeline
   **/
  counterEvent(profileName?: any, value?: any): void;

  /**
   * Relay profiles use await calls, so likely occur out of current stack frame
   * therefore async variant of profiling is used
   **/
  attachToRelayProfiler(relayProfiler: RelayProfiler): void;

  /* This is not called by default due to perf overhead but it's useful
        if you want to find traces which spend too much time in JSON. */
  swizzleJSON(): void;

  /**
   * Measures multiple methods of a class. For example, you can do:
   * Systrace.measureMethods(JSON, 'JSON', ['parse', 'stringify']);
   *
   * @param methodNames Map from method names to method display names.
   */
  measureMethods(
    object: any,
    objectName: string,
    methodNames: Array<string>,
  ): void;

  /**
   * Returns an profiled version of the input function. For example, you can:
   * JSON.parse = Systrace.measure('JSON', 'parse', JSON.parse);
   *
   * @return replacement function
   */
  measure<T extends Function>(objName: string, fnName: string, func: T): T;
}

export const Systrace: SystraceStatic;
export type Systrace = SystraceStatic;
