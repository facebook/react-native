/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// NOTE: This entire file should be codegen'ed.

#import <vector>

#ifndef __cplusplus
#error This file must be compiled as Obj-C++. If you are importing it, you must change your file extension to .mm.
#endif

#import <Foundation/Foundation.h>
#import <RCTRequired/RCTRequired.h>
#import <RCTTypeSafety/RCTConvertHelpers.h>
#import <RCTTypeSafety/RCTTypedModuleConstants.h>
#import <React/RCTBridgeModule.h>
#import <ReactCommon/RCTTurboModule.h>

NS_ASSUME_NONNULL_BEGIN

namespace JS::NativeSampleTurboModule {
struct Constants {
  struct Builder {
    using ResultT = Constants;

    struct Input {
      RCTRequired<bool> const1;
      RCTRequired<double> const2;
      RCTRequired<NSString *> const3;
    };

    /** Initialize with a set of values */
    Builder(const Input i);
    /** Initialize with an existing Constants */
    Builder(Constants i);
    /** Builds the object. Generally used only by the infrastructure. */
    NSDictionary *buildUnsafeRawValue() const
    {
      return _factory();
    };

   private:
    NSDictionary * (^_factory)(void);
  };

  static Constants fromUnsafeRawValue(NSDictionary *const v)
  {
    return {v};
  }
  NSDictionary *unsafeRawValue() const
  {
    return _v;
  }

 private:
  Constants(NSDictionary *const v) : _v(v) {}
  NSDictionary *_v;
};

} // namespace JS::NativeSampleTurboModule

inline JS::NativeSampleTurboModule::Constants::Builder::Builder(const Input i)
    : _factory(^{
        NSMutableDictionary *d = [NSMutableDictionary new];
        auto const1 = i.const1.get();
        d[@"const1"] = @(const1);
        auto const2 = i.const2.get();
        d[@"const2"] = @(const2);
        auto const3 = i.const3.get();
        d[@"const3"] = const3;
        return d;
      })
{
}
inline JS::NativeSampleTurboModule::Constants::Builder::Builder(Constants i)
    : _factory(^{
        return i.unsafeRawValue();
      })
{
}

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
- (void)getImageUrl:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (facebook::react::ModuleConstants<JS::NativeSampleTurboModule::Constants>)constantsToExport;
- (facebook::react::ModuleConstants<JS::NativeSampleTurboModule::Constants>)getConstants;

@end

@interface NativeSampleTurboModuleSpecBase : NSObject {
 @protected
  facebook::react::EventEmitterCallback _eventEmitterCallback;
}
- (void)setEventEmitterCallback:(EventEmitterCallbackWrapper *)eventEmitterCallbackWrapper;

- (void)emitOnPress;
- (void)emitOnClick:(NSString *_Nonnull)value;
- (void)emitOnChange:(NSDictionary *)value;
- (void)emitOnSubmit:(NSArray<id<NSObject>> *)value;
@end

namespace facebook::react {
/**
 * ObjC++ class for module 'NativeSampleTurboModule'
 */
class JSI_EXPORT NativeSampleTurboModuleSpecJSI : public ObjCTurboModule {
 public:
  NativeSampleTurboModuleSpecJSI(const ObjCTurboModule::InitParams &params);
};
} // namespace facebook::react

NS_ASSUME_NONNULL_END
