/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ShimRCTInstance.h"

#import <ReactCommon/RCTInstance.h>

#import "RCTSwizzleHelpers.h"

static __weak ShimRCTInstance *weakShim = nil;

@implementation ShimRCTInstance

- (instancetype)init
{
  if (self = [super init]) {
    _initCount = 0;
    RCTSwizzleInstanceSelector(
        [RCTInstance class],
        [ShimRCTInstance class],
        @selector(initWithDelegate:
                  jsEngineInstance:bundleManager:turboModuleManagerDelegate:onInitialBundleLoad:moduleRegistry:));
    RCTSwizzleInstanceSelector([RCTInstance class], [ShimRCTInstance class], @selector(invalidate));
    RCTSwizzleInstanceSelector(
        [RCTInstance class], [ShimRCTInstance class], @selector(callFunctionOnJSModule:method:args:));
    weakShim = self;
  }
  return self;
}

- (void)reset
{
  RCTSwizzleInstanceSelector(
      [RCTInstance class],
      [ShimRCTInstance class],
      @selector(initWithDelegate:
                jsEngineInstance:bundleManager:turboModuleManagerDelegate:onInitialBundleLoad:moduleRegistry:));
  RCTSwizzleInstanceSelector([RCTInstance class], [ShimRCTInstance class], @selector(invalidate));
  RCTSwizzleInstanceSelector(
      [RCTInstance class], [ShimRCTInstance class], @selector(callFunctionOnJSModule:method:args:));
  _initCount = 0;
  _invalidateCount = 0;
}

- (instancetype)initWithDelegate:(id<RCTInstanceDelegate>)delegate
                jsEngineInstance:(std::shared_ptr<facebook::react::JSEngineInstance>)jsEngineInstance
                   bundleManager:(RCTBundleManager *)bundleManager
      turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)tmmDelegate
             onInitialBundleLoad:(RCTInstanceInitialBundleLoadCompletionBlock)onInitialBundleLoad
                  moduleRegistry:(RCTModuleRegistry *)moduleRegistry
{
  weakShim.initCount++;
  return self;
}

- (void)invalidate
{
  weakShim.invalidateCount++;
}

- (void)callFunctionOnJSModule:(NSString *)moduleName method:(NSString *)method args:(NSArray *)args
{
  weakShim.jsModuleName = moduleName;
  weakShim.method = method;
  weakShim.args = [args copy];
}

@end
