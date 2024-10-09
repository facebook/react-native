/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// NOTE: This entire file should be codegen'ed.

#import <vector>

#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>

#import <ReactCommon/RCTTurboModule.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * The ObjC protocol based on the JS Flow type for SampleTurboModule.
 */
@protocol NativeSampleTurboModuleSpec <RCTBridgeModule, RCTTurboModule>

- (void)voidFunc;
- (NSNumber *)getBool:(BOOL)arg;
- (NSNumber *)getEnum:(double)arg;
- (NSNumber *)getNumber:(double)arg;
- (NSString *)getString:(NSString *)arg;
- (NSArray<id<NSObject>> *)getArray:(NSArray *)arg;
- (NSDictionary *)getObject:(NSDictionary *)arg;
- (NSDictionary *)getUnsafeObject:(NSDictionary *)arg;
- (NSNumber *)getRootTag:(double)arg;
- (NSDictionary *)getValue:(double)x y:(NSString *)y z:(NSDictionary *)z;
- (void)getValueWithCallback:(RCTResponseSenderBlock)callback;
- (void)getValueWithPromise:(BOOL)error resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)voidFuncThrows;
- (NSDictionary *)getObjectThrows:(NSDictionary *)arg;
- (void)promiseThrows:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)voidFuncAssert;
- (NSDictionary *)getObjectAssert:(NSDictionary *)arg;
- (void)promiseAssert:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (NSDictionary *)constantsToExport;
- (NSDictionary *)getConstants;

@end

@interface NativeSampleTurboModuleSpecBase : NSObject {
 @protected
  facebook::react::EventEmitterCallback _eventEmitterCallback;
}
- (void)setEventEmitterCallback:(EventEmitterCallbackWrapper *_Nonnull)eventEmitterCallbackWrapper;
- (void)emitOnPress;
- (void)emitOnClick:(NSString *)value;
- (void)emitOnChange:(NSDictionary *)value;
- (void)emitOnSubmit:(NSArray *)value;
@end

namespace facebook::react {

/**
 * The iOS TurboModule impl specific to SampleTurboModule.
 */
class JSI_EXPORT NativeSampleTurboModuleSpecJSI : public ObjCTurboModule {
 public:
  NativeSampleTurboModuleSpecJSI(const ObjCTurboModule::InitParams &params);
};

} // namespace facebook::react

NS_ASSUME_NONNULL_END
