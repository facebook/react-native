/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ShimRCTInstance.h"

#import <ReactCommon/RCTInstance.h>

#import "RCTSwizzleHelpers.h"

@implementation ShimRCTInstance

- (instancetype)init
{
  if (self = [super init]) {
    RCTSwizzleInstanceSelector(
        [RCTInstance class],
        [ShimRCTInstance class],
        @selector(initWithDelegate:
                  jsEngineInstance:bundleManager:turboModuleManagerDelegate:onInitialBundleLoad:moduleRegistry:));
  }
  return self;
}

- (instancetype)initWithDelegate:(id<RCTInstanceDelegate>)delegate
                jsEngineInstance:(std::shared_ptr<facebook::react::JSEngineInstance>)jsEngineInstance
                   bundleManager:(RCTBundleManager *)bundleManager
      turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)tmmDelegate
             onInitialBundleLoad:(RCTInstanceInitialBundleLoadCompletionBlock)onInitialBundleLoad
                  moduleRegistry:(RCTModuleRegistry *)moduleRegistry
{
  return self;
}

@end
