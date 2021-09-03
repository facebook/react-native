/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

/**
 * `global` is a object containing all the global variables for React Native.
 *
 * NOTE: Consider cross-platform as well as JS environments compatibility
 * when defining the types here. Consider both presence (`?`) as well as
 * writeability (`+`) when defining types.
 */
declare var global: {
  // setUpGlobals
  +window: typeof global,
  +self: typeof global,

  // setXHR
  +XMLHttpRequest: typeof XMLHttpRequest,
  +FormData: typeof FormData,
  +fetch: typeof fetch,
  +Headers: typeof Headers,
  +Request: typeof Request,
  +Response: typeof Response,
  +WebSocket: typeof WebSocket,
  +Blob: typeof Blob,
  +File: typeof File,
  +FileReader: typeof FileReader,
  +URL: typeof URL,
  +URLSearchParams: typeof URLSearchParams,
  +AbortController: typeof AbortController,
  +AbortSignal: typeof AbortSignal,

  // setUpAlert
  +alert: typeof alert,

  // setUpTimers
  +clearInterval: typeof clearInterval,
  +clearTimeout: typeof clearTimeout,
  +setInterval: typeof setInterval,
  +setTimeout: typeof setTimeout,
  +requestAnimationFrame: typeof requestAnimationFrame,
  +cancelAnimationFrame: typeof cancelAnimationFrame,
  +requestIdleCallback: typeof requestIdleCallback,
  +cancelIdleCallback: typeof cancelIdleCallback,
  +setTimeout: typeof setTimeout,
  // TODO(T97509743): use `typeof` when the next Flow release is available.
  +queueMicrotask: <TArguments: Array<mixed>>(
    jobCallback: (...args: TArguments) => mixed,
  ) => void,

  +console: typeof console,

  // JavaScript environments specific
  +HermesInternal: ?$HermesInternalType,

  // Internal-specific
  +__DEV__?: boolean,
  +RN$Bridgeless?: boolean,

  // Undeclared properties are implicitly `any`.
  [string | symbol]: any,
};
