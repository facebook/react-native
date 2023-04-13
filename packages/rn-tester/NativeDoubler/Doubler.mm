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

- (void)doubleTheValue:(NSObject *)value resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  if ([value isKindOfClass:[NSNumber class]]) {
    double numberValue = ((NSNumber *)value).doubleValue;
    resolve(@(numberValue * 2));
  } else if ([value isKindOfClass:[NSString class]]) {
    NSString *stringValue = (NSString *)value;
    resolve([NSString stringWithFormat:@"%@%@", stringValue, stringValue]);
  } else if ([value isKindOfClass:[NSDictionary class]]) {
    NSDictionary *dictValue = (NSDictionary *)value;
    if (dictValue[@"aNumber"] != NULL) {
      double numberValue = ((NSNumber *)dictValue[@"aNumber"]).doubleValue;
      resolve(@{@"aNumber" : @(numberValue * 2)});
    } else if (dictValue[@"aString"] != NULL) {
      NSString *stringValue = (NSString *)dictValue[@"aString"];
      resolve(@{@"aString" : [NSString stringWithFormat:@"%@%@", stringValue, stringValue]});
    } else {
      reject(@"-11", [NSString stringWithFormat:@"Unrecognized dictionary %@", dictValue], NULL);
    }
  } else {
    reject(@"-12", [NSString stringWithFormat:@"Unrecognized value %@", value], NULL);
  }
}

@end
