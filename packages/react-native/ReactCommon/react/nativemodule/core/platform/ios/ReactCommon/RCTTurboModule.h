/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <memory>

#import <Foundation/Foundation.h>

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTModuleMethod.h>
#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/TurboModule.h>
#import <string>
#import <unordered_map>

#define RCT_IS_TURBO_MODULE_CLASS(klass) \
  ((RCTTurboModuleEnabled() && [(klass) conformsToProtocol:@protocol(RCTTurboModule)]))
#define RCT_IS_TURBO_MODULE_INSTANCE(module) RCT_IS_TURBO_MODULE_CLASS([(module) class])

namespace facebook::react {

class CallbackWrapper;
class Instance;

namespace TurboModuleConvertUtils {
jsi::Value convertObjCObjectToJSIValue(jsi::Runtime &runtime, id value);
}

/**
 * ObjC++ specific TurboModule base class.
 */
class JSI_EXPORT ObjCTurboModule : public TurboModule {
 public:
  // TODO(T65603471): Should we unify this with a Fabric abstraction?
  struct InitParams {
    std::string moduleName;
    id<RCTBridgeModule> instance;
    std::shared_ptr<CallInvoker> jsInvoker;
    std::shared_ptr<CallInvoker> nativeInvoker;
    bool isSyncModule;
  };

  ObjCTurboModule(const InitParams &params);

  jsi::Value invokeObjCMethod(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind returnType,
      const std::string &methodName,
      SEL selector,
      const jsi::Value *args,
      size_t count);

  id<RCTBridgeModule> instance_;
  std::shared_ptr<CallInvoker> nativeInvoker_;

 protected:
  void setMethodArgConversionSelector(NSString *methodName, int argIndex, NSString *fnName);
  virtual jsi::Value convertReturnIdToJSIValue(
      jsi::Runtime &runtime,
      const char *methodName,
      TurboModuleMethodValueKind returnType,
      id result);

 private:
  // Does the NativeModule dispatch async methods to the JS thread?
  const bool isSyncModule_;

  /**
   * TODO(ramanpreet):
   * Investigate an optimization that'll let us get rid of this NSMutableDictionary.
   */
  NSMutableDictionary<NSString *, NSMutableArray *> *methodArgConversionSelectors_;
  NSDictionary<NSString *, NSArray<NSString *> *> *methodArgumentTypeNames_;

  bool isMethodSync(TurboModuleMethodValueKind returnType);
  BOOL hasMethodArgConversionSelector(NSString *methodName, int argIndex);
  SEL getMethodArgConversionSelector(NSString *methodName, int argIndex);
  NSString *getArgumentTypeName(jsi::Runtime &runtime, NSString *methodName, int argIndex);
  NSInvocation *createMethodInvocation(
      jsi::Runtime &runtime,
      bool isSync,
      const char *methodName,
      SEL selector,
      const jsi::Value *args,
      size_t count,
      NSMutableArray *retainedObjectsForInvocation);
  void setInvocationArg(
      jsi::Runtime &runtime,
      const char *methodName,
      const std::string &objCArgType,
      const jsi::Value &arg,
      size_t i,
      NSInvocation *inv,
      NSMutableArray *retainedObjectsForInvocation);
  id performMethodInvocation(
      jsi::Runtime &runtime,
      bool isSync,
      const char *methodName,
      NSInvocation *inv,
      NSMutableArray *retainedObjectsForInvocation);

  using PromiseInvocationBlock = void (^)(RCTPromiseResolveBlock resolveWrapper, RCTPromiseRejectBlock rejectWrapper);
  jsi::Value createPromise(jsi::Runtime &runtime, std::string methodName, PromiseInvocationBlock invoke);
};

} // namespace facebook::react

@protocol RCTTurboModule <NSObject>
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params;
@end

/**
 * These methods are all implemented by RCTCxxBridge, which subclasses RCTBridge. Hence, they must only be used in
 * contexts where the concrete class of an RCTBridge instance is RCTCxxBridge. This happens, for example, when
 * [RCTCxxBridgeDelegate jsExecutorFactoryForBridge:(RCTBridge *)] is invoked by RCTCxxBridge.
 *
 * TODO: Consolidate this extension with the one in RCTSurfacePresenter.
 */
@interface RCTBridge (RCTTurboModule)
- (std::shared_ptr<facebook::react::CallInvoker>)jsCallInvoker;
- (std::shared_ptr<facebook::react::CallInvoker>)decorateNativeCallInvoker:
    (std::shared_ptr<facebook::react::CallInvoker>)nativeInvoker;
@end
