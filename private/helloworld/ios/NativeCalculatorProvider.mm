/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactCommon/RCTTurboModule.h>
#import "HelloWorld-Swift.h"

using namespace facebook::react;

/**
 * Provider class that bridges the Swift NativeCalculator module
 * to the TurboModule infrastructure.
 */
@interface NativeCalculatorProvider : NSObject <RCTModuleProvider>
@end

@implementation NativeCalculatorProvider

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params {
  return std::make_shared<ObjCTurboModule>(params);
}

- (Class<RCTModule>)getAppleModule {
  return [NativeCalculator class];
}

@end
