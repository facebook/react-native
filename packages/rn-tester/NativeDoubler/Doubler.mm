/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "Doubler.h"

@implementation Doubler

RCT_EXPORT_MODULE();

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeDoublerSpecJSI>(params);
}

- (void)doubleTheValueBoxedString:(JS::NativeDoubler::BoxedString &)value resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  NSString * stringValue = value.aString();
  NSString * result = [NSString stringWithFormat:@"%@%@", stringValue, stringValue];
  resolve(@{@"aString": result});
}

- (void)doubleTheValueNumber:(double)value resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  resolve(@(value * 2));
}

- (void)doubleTheValueObject:(JS::NativeDoubler::SpecDoubleTheValueObjectValue &)value resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  resolve(@{@"aNumber": @(value.aNumber() * 2)});
}

- (void)doubleTheValueString:(NSString *)value resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  resolve([NSString stringWithFormat:@"%@%@", value, value]);
}

@end
