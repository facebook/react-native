/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNCalculator.h"
#import "AppSpecs.h"

@implementation RNCalculator

RCT_EXPORT_MODULE(Calculator)

RCT_REMAP_METHOD(add, addA
                 : (NSInteger)a andB
                 : (NSInteger)b withResolver
                 : (RCTPromiseResolveBlock)resolve withRejecter
                 : (RCTPromiseRejectBlock)reject)
{
  NSNumber *result = [[NSNumber alloc] initWithInteger:a + b];
  resolve(result);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeCalculatorSpecJSI>(params);
}
@end
