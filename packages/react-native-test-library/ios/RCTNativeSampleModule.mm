/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef RCT_NEW_ARCH_ENABLED
#import "OSSLibraryExampleSpec/OSSLibraryExampleSpec.h"
#else
#import <React/RCTBridge.h>
#endif

#import <Foundation/Foundation.h>
#include <react/debug/react_native_assert.h>
#include <stdlib.h>

#ifdef RCT_NEW_ARCH_ENABLED
@interface RCTNativeSampleModule : NSObject <NativeSampleModuleSpec>
#else
@interface RCTNativeSampleModule : NSObject <RCTBridgeModule>
#endif

@end

@implementation RCTNativeSampleModule

RCT_EXPORT_MODULE();

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeSampleModuleSpecJSI>(params);
}
#endif

#ifdef RCT_NEW_ARCH_ENABLED
- (NSNumber *)getRandomNumber
#else
RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, getRandomNumber)
#endif
{
  return @(arc4random_uniform(99));
}

@end
