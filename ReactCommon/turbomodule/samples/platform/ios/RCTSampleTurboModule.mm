/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSampleTurboModule.h"

#import <UIKit/UIKit.h>

using namespace facebook::react;

@implementation RCTSampleTurboModule

// Backward-compatible export
RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;
@synthesize turboModuleLookupDelegate = _turboModuleLookupDelegate;

// Backward-compatible queue configuration
+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<facebook::react::JSCallInvoker>)jsInvoker
{
  return std::make_shared<NativeSampleTurboModuleSpecJSI>(self, jsInvoker);
}

// Backward compatible invalidation
- (void)invalidate
{
  // Actually do nothing here.
  NSLog(@"Invalidating RCTSampleTurboModule...");
}

- (NSDictionary *)getConstants
{
  UIScreen *mainScreen = UIScreen.mainScreen;
  CGSize screenSize = mainScreen.bounds.size;

  return @{
    @"const1": @YES,
    @"const2": @(screenSize.width),
    @"const3": @"something",
  };
}

// TODO: Remove once fully migrated to TurboModule.
- (NSDictionary *)constantsToExport
{
  return [self getConstants];
}

RCT_EXPORT_METHOD(voidFunc)
{
  // Nothing to do
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, getBool:(BOOL)arg)
{
  return @(arg);
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, getNumber:(double)arg)
{
  return @(arg);
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSString *, getString:(NSString *)arg)
{
  return arg;
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSArray<id<NSObject>> *, getArray:(NSArray *)arg)
{
  return arg;
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSDictionary *, getObject:(NSDictionary *)arg)
{
  return arg;
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSDictionary *, getValue:(double)x y:(NSString *)y z:(NSDictionary *)z)
{
  return @{
    @"x": @(x),
    @"y": y ?: [NSNull null],
    @"z": z ?: [NSNull null],
  };
}

RCT_EXPORT_METHOD(getValueWithCallback:(RCTResponseSenderBlock)callback)
{
  if (!callback) {
    return;
  }
  callback(@[@"value from callback!"]);
}

RCT_EXPORT_METHOD(getValueWithPromise:(BOOL)error resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
{
  if (!resolve || !reject) {
    return;
  }

  if (error) {
    reject(@"code_1", @"intentional promise rejection", [NSError errorWithDomain:@"RCTSampleTurboModule" code:1 userInfo:nil]);
  } else {
    resolve(@"result!");
  }
}

@end
