/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type Constructor<T> = new (...args: any[]) => T;

export interface TimerMixin {
  setTimeout: typeof setTimeout;
  clearTimeout: typeof clearTimeout;
  setInterval: typeof setInterval;
  clearInterval: typeof clearInterval;
  setImmediate: typeof setImmediate;
  clearImmediate: typeof clearImmediate;
  requestAnimationFrame: typeof requestAnimationFrame;
  cancelAnimationFrame: typeof cancelAnimationFrame;
}

export interface Insets {
  top?: number | undefined;
  left?: number | undefined;
  bottom?: number | undefined;
  right?: number | undefined;
}
