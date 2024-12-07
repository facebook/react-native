/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTPerformanceLoggerLabels.h"
#import <React/RCTAssert.h>

NSString *RCTPLLabelForTag(RCTPLTag tag)
{
  switch (tag) {
    case RCTPLScriptDownload:
      return @"ScriptDownload";
    case RCTPLScriptExecution:
      return @"ScriptExecution";
    case RCTPLRAMBundleLoad:
      return @"RAMBundleLoad";
    case RCTPLRAMStartupCodeSize:
      return @"RAMStartupCodeSize";
    case RCTPLRAMStartupNativeRequires:
      return @"RAMStartupNativeRequires";
    case RCTPLRAMStartupNativeRequiresCount:
      return @"RAMStartupNativeRequiresCount";
    case RCTPLRAMNativeRequires:
      return @"RAMNativeRequires";
    case RCTPLRAMNativeRequiresCount:
      return @"RAMNativeRequiresCount";
    case RCTPLNativeModuleInit:
      return @"NativeModuleInit";
    case RCTPLNativeModuleMainThread:
      return @"NativeModuleMainThread";
    case RCTPLNativeModulePrepareConfig:
      return @"NativeModulePrepareConfig";
    case RCTPLNativeModuleMainThreadUsesCount:
      return @"NativeModuleMainThreadUsesCount";
    case RCTPLNativeModuleSetup:
      return @"NativeModuleSetup";
    case RCTPLTurboModuleSetup:
      return @"TurboModuleSetup";
    case RCTPLJSCWrapperOpenLibrary:
      return @"JSCWrapperOpenLibrary";
    case RCTPLBridgeStartup:
      return @"BridgeStartup";
    case RCTPLTTI:
      return @"RootViewTTI";
    case RCTPLBundleSize:
      return @"BundleSize";
    case RCTPLReactInstanceInit:
      return @"ReactInstanceInit";
    case RCTPLAppStartup:
      return @"AppStartup";
    case RCTPLInitReactRuntime:
      return @"InitReactRuntime";
    case RCTPLSize: // Only used to count enum size
      RCTAssert(NO, @"RCTPLSize should not be used to track performance timestamps.");
      return nil;
  }
}
