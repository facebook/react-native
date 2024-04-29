/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

typedef NS_ENUM(NSInteger, RCTPLTag) {
  RCTPLScriptDownload = 0,
  RCTPLScriptExecution,
  RCTPLRAMBundleLoad,
  RCTPLRAMStartupCodeSize,
  RCTPLRAMStartupNativeRequires,
  RCTPLRAMStartupNativeRequiresCount,
  RCTPLRAMNativeRequires,
  RCTPLRAMNativeRequiresCount,
  RCTPLNativeModuleInit,
  RCTPLNativeModuleMainThread,
  RCTPLNativeModulePrepareConfig,
  RCTPLNativeModuleMainThreadUsesCount,
  RCTPLNativeModuleSetup,
  RCTPLTurboModuleSetup,
  RCTPLJSCWrapperOpenLibrary,
  RCTPLBridgeStartup,
  RCTPLTTI,
  RCTPLBundleSize,
  RCTPLReactInstanceInit,
  RCTPLAppStartup,
  RCTPLInitReactRuntime,
  RCTPLSize // This is used to count the size
};
