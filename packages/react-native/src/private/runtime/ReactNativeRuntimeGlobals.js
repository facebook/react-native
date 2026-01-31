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
 * This module exports global variables that are defined by the native runtime.
 * These are NOT assigned in JS files but are set directly by the native code.
 */

'use strict';

import type {BlobCollector} from '../../../Libraries/Blob/BlobTypes';
import type {ExtendedExceptionData} from '../../../Libraries/LogBox/Data/parseLogBoxLog';

// =============================================================================
// Bridgeless Mode
// =============================================================================

/**
 * Indicates if the app is running in bridgeless mode (new architecture).
 * When true, communication with native happens through JSI directly
 * rather than through the bridge.
 * Set by the native runtime.
 */
export const isBridgeless: boolean = global.RN$Bridgeless === true;

// =============================================================================
// Runtime Diagnostics
// =============================================================================

/**
 * Diagnostic flags for the React Native runtime.
 * Can include flags like 'early_js_errors', 'all', etc.
 * Set by the native runtime.
 */
export const diagnosticFlags: ?string = global.RN$DiagnosticFlags;

// =============================================================================
// Error Handling
// =============================================================================

/**
 * Flag indicating whether to use always-available JS error handling.
 * When true, error handling is enabled even in bridgeless mode.
 * Set by the native runtime.
 */
export const useAlwaysAvailableJSErrorHandling: boolean =
  global.RN$useAlwaysAvailableJSErrorHandling === true;

/**
 * Flag to disable the exceptions manager (redbox).
 * Set by the native runtime.
 */
export const disableExceptionsManager: boolean = Boolean(
  global.__fbDisableExceptionsManager,
);

/**
 * Handles exceptions in bridgeless mode.
 * Returns true if the exception was handled and should not be propagated.
 * Set by the native JSI runtime.
 */
export const handleException: ?(
  error: mixed,
  isFatal: boolean,
  reportToConsole: boolean,
) => boolean = global.RN$handleException;

/**
 * Checks if the runtime is currently inside an exception handler.
 * Only available in bridgeless mode.
 * Set by the native JSI runtime.
 */
export const inExceptionHandler: ?() => boolean = global.RN$inExceptionHandler;

/**
 * Checks if a fatal exception has already been handled.
 * Only available in bridgeless mode.
 * Set by the native JSI runtime.
 */
export const hasHandledFatalException: ?() => boolean =
  global.RN$hasHandledFatalException;

/**
 * Notifies the runtime that a fatal exception has occurred.
 * Only available in bridgeless mode.
 * Set by the native JSI runtime.
 */
export const notifyOfFatalException: ?() => void =
  global.RN$notifyOfFatalException;

// =============================================================================
// Callable Modules
// =============================================================================

/**
 * Registers a JavaScript module that can be called from native code.
 * Only available in bridgeless mode.
 * Set by the native JSI runtime.
 */
export const registerCallableModule: ?(
  name: string,
  moduleOrFactory: {...} | (() => {...}),
) => void = global.RN$registerCallableModule;

// =============================================================================
// UIManager (Bridgeless Mode)
// =============================================================================

/**
 * Gets UIManager constants in bridgeless mode.
 * Set by the native JSI runtime.
 */
export const UIManager_getConstants: ?() => {[viewManagerName: string]: {...}} =
  global.RN$LegacyInterop_UIManager_getConstants;

/**
 * Gets constants for a specific view manager in bridgeless mode.
 * Set by the native JSI runtime.
 */
export const UIManager_getConstantsForViewManager: ?(
  viewManagerName: string,
) => ?{...} = global.RN$LegacyInterop_UIManager_getConstantsForViewManager;

/**
 * Gets default event types in bridgeless mode.
 * Set by the native JSI runtime.
 */
export const UIManager_getDefaultEventTypes: ?() => {...} =
  global.RN$LegacyInterop_UIManager_getDefaultEventTypes;

// =============================================================================
// Native Component Registry
// =============================================================================

/**
 * Checks if a native component is registered.
 * Set by the native JSI runtime.
 */
export const nativeComponentRegistryHasComponent: ?(name: string) => boolean =
  global.__nativeComponentRegistry__hasComponent;

// =============================================================================
// Performance Tracing (Systrace)
// =============================================================================

/**
 * Checks if profiling/tracing is currently enabled.
 * Set by the native JSI runtime.
 */
export const nativeTraceIsTracing: ?(tag: number) => boolean =
  global.nativeTraceIsTracing;

/**
 * Flag indicating if profiling is currently active.
 * Set by the native runtime.
 */
export const isProfilingEnabled: boolean = Boolean(
  global.__RCTProfileIsProfiling,
);

/**
 * Marks the beginning of a synchronous trace section.
 * Set by the native JSI runtime.
 */
export const nativeTraceBeginSection: ?(
  tag: number,
  sectionName: string,
  args?: ?{[string]: string},
) => void = global.nativeTraceBeginSection;

/**
 * Marks the end of a synchronous trace section.
 * Set by the native JSI runtime.
 */
export const nativeTraceEndSection: ?(
  tag: number,
  args?: ?{[string]: string},
) => void = global.nativeTraceEndSection;

/**
 * Marks the beginning of an asynchronous trace section.
 * Set by the native JSI runtime.
 */
export const nativeTraceBeginAsyncSection: ?(
  tag: number,
  sectionName: string,
  cookie: number,
  args?: ?{[string]: string},
) => void = global.nativeTraceBeginAsyncSection;

/**
 * Marks the end of an asynchronous trace section.
 * Set by the native JSI runtime.
 */
export const nativeTraceEndAsyncSection: ?(
  tag: number,
  sectionName: string,
  cookie: number,
  args?: ?{[string]: string},
) => void = global.nativeTraceEndAsyncSection;

/**
 * Marks the beginning of an async flow for tracing.
 * Set by the native JSI runtime.
 */
export const nativeTraceBeginAsyncFlow: ?(
  tag: number,
  sectionName: string,
  cookie: number,
) => void = global.nativeTraceBeginAsyncFlow;

/**
 * Records a trace counter event.
 * Set by the native JSI runtime.
 */
export const nativeTraceCounter: ?(
  tag: number,
  sectionName: string,
  value: number,
) => void = global.nativeTraceCounter;

// =============================================================================
// Native Module Bridge (MessageQueue)
// =============================================================================

/**
 * Synchronous hook for calling native modules.
 * Not available when running in Chrome debugger.
 * Set by the native JSI runtime.
 */
export const nativeCallSyncHook: ?(
  moduleID: number,
  methodID: number,
  params: $ReadOnlyArray<mixed>,
) => mixed = global.nativeCallSyncHook;

/**
 * Function to immediately flush the native call queue.
 * Set by the native JSI runtime.
 */
export const nativeFlushQueueImmediate: ?(
  queue: [Array<number>, Array<number>, Array<mixed>, number],
) => void = global.nativeFlushQueueImmediate;

// =============================================================================
// Native Modules
// =============================================================================

/**
 * Configuration for a native module.
 * Tuple containing module name, constants, functions, promise method IDs, and sync method IDs.
 */
export type ModuleConfig = [
  string /* name */,
  ?{...} /* constants */,
  ?ReadonlyArray<string> /* functions */,
  ?ReadonlyArray<number> /* promise method IDs */,
  ?ReadonlyArray<number> /* sync method IDs */,
];

/**
 * The native module proxy for bridgeless mode.
 * Provides access to native modules without the bridge.
 * Set by the native JSI runtime.
 */
export const nativeModuleProxy: ?{[moduleName: string]: {...}, ...} =
  global.nativeModuleProxy;

/**
 * Configuration for the batched bridge, containing module definitions.
 * Used to lazily initialize native modules.
 * Set by the native runtime.
 */
export const batchedBridgeConfig: ?{
  remoteModuleConfig?: $ReadOnlyArray<ModuleConfig>,
  ...
} = global.__fbBatchedBridgeConfig;

/**
 * Function to lazily require native module configuration.
 * Set by the native JSI runtime.
 */
export const nativeRequireModuleConfig: ?(moduleName: string) => ModuleConfig =
  global.nativeRequireModuleConfig;

// =============================================================================
// Performance
// =============================================================================

/**
 * High-resolution performance timestamp function.
 * Falls back to Date.now if not available.
 * Set by the native JSI runtime.
 */
export const nativePerformanceNow: ?() => number = global.nativePerformanceNow;

// =============================================================================
// TurboModules
// =============================================================================

/**
 * The TurboModule proxy function for accessing TurboModules.
 * This is the main entry point for the new native modules architecture.
 * Set by the native runtime.
 */
export const turboModuleProxy: ?<T>(name: string) => ?T =
  global.__turboModuleProxy;

// =============================================================================
// Logging
// =============================================================================

/**
 * Native logging hook for sending console messages to native.
 * Set by the native JSI runtime.
 */
export const nativeLoggingHook: ?(message: string, level: number) => void =
  global.nativeLoggingHook;

// =============================================================================
// Blob Management
// =============================================================================

/**
 * Provider function for creating blob collectors.
 * Set by the native JSI runtime.
 */
export const blobCollectorProvider: ?(blobId: string) => ?BlobCollector =
  global.__blobCollectorProvider;

// =============================================================================
// LogBox and Exception Handling
// =============================================================================

/**
 * Registers an exception listener that can handle and prevent exceptions.
 * Set by the native JSI runtime.
 */
export const registerExceptionListener: ?(
  listener: (
    error: ExtendedExceptionData & {preventDefault: () => unknown},
  ) => void,
) => void = global.RN$registerExceptionListener;

/**
 * Checks if the runtime is ready.
 * Set by the native JSI runtime.
 */
export const isRuntimeReady: ?() => boolean = global.RN$isRuntimeReady;
