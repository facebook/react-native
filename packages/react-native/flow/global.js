/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
// $FlowFixMe[libdef-override]
declare var global: {
  // setUpGlobals
  +window: typeof global,
  +self: typeof global,
  +process: {
    +env: {
      +NODE_ENV: 'development' | 'production',
    },
    +argv?: $ReadOnlyArray<string>,
  },

  // setUpPerformance
  +performance: Performance,

  // setUpXHR
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

  // setUpNavigator
  +navigator: {
    +product: 'ReactNative',
    +appName?: ?string,
    ...
  },

  // setUpTimers
  +setInterval: typeof setInterval,
  +clearInterval: typeof clearInterval,
  +setTimeout: typeof setTimeout,
  +clearTimeout: typeof clearTimeout,
  +requestAnimationFrame: typeof requestAnimationFrame,
  +cancelAnimationFrame: typeof cancelAnimationFrame,
  +requestIdleCallback: typeof requestIdleCallback,
  +cancelIdleCallback: typeof cancelIdleCallback,
  +queueMicrotask: typeof queueMicrotask,
  +setImmediate: typeof setImmediate,
  +clearImmediate: typeof clearImmediate,

  // Polyfills
  +console: typeof console,

  // JavaScript environments specific
  +HermesInternal: ?$HermesInternalType,

  // Internal-specific
  +__DEV__?: boolean,
  +RN$Bridgeless?: boolean,

  // setupDOM
  +DOMRect: typeof DOMRect,
  +DOMRectReadOnly: typeof DOMRectReadOnly,

  // Undeclared properties are implicitly `any`.
  [string | symbol]: any,
};
