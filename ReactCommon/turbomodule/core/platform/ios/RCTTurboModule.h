/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <memory>

#import <Foundation/Foundation.h>

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTModuleMethod.h>
#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/TurboModule.h>
#import <ReactCommon/TurboModuleUtils.h>
#import <string>
#import <unordered_map>

#define RCT_IS_TURBO_MODULE_CLASS(klass) \
  ((RCTTurboModuleEnabled() && [(klass) conformsToProtocol:@protocol(RCTTurboModule)]))
#define RCT_IS_TURBO_MODULE_INSTANCE(module) RCT_IS_TURBO_MODULE_CLASS([(module) class])

typedef int MethodCallId;

/**
 * This interface exists to allow the application to collect performance
 * metrics of the TurboModule system. By implementing each function, you can
 * hook into various stages of TurboModule creation and method dispatch (both async and sync).
 *
 * Note:
 *  - TurboModule async method invocations can interleave, so methodCallId should be used as a unique id for a method
 *    call.
 */
@protocol RCTTurboModulePerformanceLogger
// Create TurboModule JS Object
- (void)createTurboModuleStart:(const char *)moduleName;
- (void)createTurboModuleEnd:(const char *)moduleName;
- (void)createTurboModuleCacheHit:(const char *)moduleName;
- (void)getCppTurboModuleFromTMMDelegateStart:(const char *)moduleName;
- (void)getCppTurboModuleFromTMMDelegateEnd:(const char *)moduleName;
- (void)getTurboModuleFromRCTTurboModuleStart:(const char *)moduleName;
- (void)getTurboModuleFromRCTTurboModuleEnd:(const char *)moduleName;
- (void)getTurboModuleFromRCTCxxModuleStart:(const char *)moduleName;
- (void)getTurboModuleFromRCTCxxModuleEnd:(const char *)moduleName;
- (void)getTurboModuleFromTMMDelegateStart:(const char *)moduleName;
- (void)getTurboModuleFromTMMDelegateEnd:(const char *)moduleName;

// Create RCTTurboModule object
- (void)createRCTTurboModuleStart:(const char *)moduleName;
- (void)createRCTTurboModuleEnd:(const char *)moduleName;
- (void)createRCTTurboModuleCacheHit:(const char *)moduleName;
- (void)getRCTTurboModuleClassStart:(const char *)moduleName;
- (void)getRCTTurboModuleClassEnd:(const char *)moduleName;
- (void)getRCTTurboModuleInstanceStart:(const char *)moduleName;
- (void)getRCTTurboModuleInstanceEnd:(const char *)moduleName;
- (void)setupRCTTurboModuleDispatch:(const char *)moduleName;
- (void)setupRCTTurboModuleStart:(const char *)moduleName;
- (void)setupRCTTurboModuleEnd:(const char *)moduleName;
- (void)attachRCTBridgeToRCTTurboModuleStart:(const char *)moduleName;
- (void)attachRCTBridgeToRCTTurboModuleEnd:(const char *)moduleName;
- (void)attachMethodQueueToRCTTurboModuleStart:(const char *)moduleName;
- (void)attachMethodQueueToRCTTurboModuleEnd:(const char *)moduleName;
- (void)registerRCTTurboModuleForFrameUpdatesStart:(const char *)moduleName;
- (void)registerRCTTurboModuleForFrameUpdatesEnd:(const char *)moduleName;
- (void)dispatchDidInitializeModuleNotificationForRCTTurboModuleStart:(const char *)moduleName;
- (void)dispatchDidInitializeModuleNotificationForRCTTurboModuleEnd:(const char *)moduleName;

// Sync method invocation
- (void)syncMethodCallStart:(const char *)moduleName
                 methodName:(const char *)methodName
               methodCallId:(MethodCallId)methodCallId;
- (void)syncMethodCallEnd:(const char *)moduleName
               methodName:(const char *)methodName
             methodCallId:(MethodCallId)methodCallId;
- (void)syncMethodCallArgumentConversionStart:(const char *)moduleName
                                   methodName:(const char *)methodName
                                 methodCallId:(MethodCallId)methodCallId;
- (void)syncMethodCallArgumentConversionEnd:(const char *)moduleName
                                 methodName:(const char *)methodName
                               methodCallId:(MethodCallId)methodCallId;
- (void)syncRCTTurboModuleMethodCallStart:(const char *)moduleName
                               methodName:(const char *)methodName
                             methodCallId:(MethodCallId)methodCallId;
- (void)syncRCTTurboModuleMethodCallEnd:(const char *)moduleName
                             methodName:(const char *)methodName
                           methodCallId:(MethodCallId)methodCallId;
- (void)syncMethodCallReturnConversionStart:(const char *)moduleName
                                 methodName:(const char *)methodName
                               methodCallId:(MethodCallId)methodCallId;
- (void)syncMethodCallReturnConversionEnd:(const char *)moduleName
                               methodName:(const char *)methodName
                             methodCallId:(MethodCallId)methodCallId;

// Async method invocation
- (void)asyncMethodCallStart:(const char *)moduleName
                  methodName:(const char *)methodName
                methodCallId:(MethodCallId)methodCallId;
- (void)asyncMethodCallEnd:(const char *)moduleName
                methodName:(const char *)methodName
              methodCallId:(MethodCallId)methodCallId;
- (void)asyncMethodCallArgumentConversionStart:(const char *)moduleName
                                    methodName:(const char *)methodName
                                  methodCallId:(MethodCallId)methodCallId;
- (void)asyncMethodCallArgumentConversionEnd:(const char *)moduleName
                                  methodName:(const char *)methodName
                                methodCallId:(MethodCallId)methodCallId;
- (void)asyncRCTTurboModuleMethodCallDispatch:(const char *)moduleName
                                   methodName:(const char *)methodName
                                 methodCallId:(MethodCallId)methodCallId;
- (void)asyncRCTTurboModuleMethodCallStart:(const char *)moduleName
                                methodName:(const char *)methodName
                              methodCallId:(MethodCallId)methodCallId;
- (void)asyncRCTTurboModuleMethodCallEnd:(const char *)moduleName
                              methodName:(const char *)methodName
                            methodCallId:(MethodCallId)methodCallId;
@end

namespace facebook {
namespace react {

class Instance;

/**
 * ObjC++ specific TurboModule base class.
 */
class JSI_EXPORT ObjCTurboModule : public TurboModule {
 public:
  ObjCTurboModule(
      const std::string &name,
      id<RCTTurboModule> instance,
      std::shared_ptr<CallInvoker> jsInvoker,
      std::shared_ptr<CallInvoker> nativeInvoker,
      id<RCTTurboModulePerformanceLogger> perfLogger);

  jsi::Value invokeObjCMethod(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind valueKind,
      const std::string &methodName,
      SEL selector,
      const jsi::Value *args,
      size_t count);

  id<RCTTurboModule> instance_;
  std::shared_ptr<CallInvoker> nativeInvoker_;

 protected:
  void setMethodArgConversionSelector(NSString *methodName, int argIndex, NSString *fnName);

 private:
  /**
   * TODO(ramanpreet):
   * Investigate an optimization that'll let us get rid of this NSMutableDictionary.
   */
  NSMutableDictionary<NSString *, NSMutableArray *> *methodArgConversionSelectors_;
  NSDictionary<NSString *, NSArray<NSString *> *> *methodArgumentTypeNames_;
  NSString *getArgumentTypeName(NSString *methodName, int argIndex);
  id<RCTTurboModulePerformanceLogger> performanceLogger_;

  /**
   * Required for performance logging async method invocations.
   * This field is static because two nth async method calls from different
   * TurboModules can interleave, and should therefore be treated as two distinct calls.
   */
  static MethodCallId methodCallId_;

  static MethodCallId getNewMethodCallId();

  NSInvocation *getMethodInvocation(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind returnType,
      const char *methodName,
      SEL selector,
      const jsi::Value *args,
      size_t count,
      NSMutableArray *retainedObjectsForInvocation,
      MethodCallId methodCallId);
  jsi::Value performMethodInvocation(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind returnType,
      const char *methodName,
      NSInvocation *inv,
      NSMutableArray *retainedObjectsForInvocation,
      MethodCallId methodCallId);

  BOOL hasMethodArgConversionSelector(NSString *methodName, int argIndex);
  SEL getMethodArgConversionSelector(NSString *methodName, int argIndex);

  using PromiseInvocationBlock = void (^)(RCTPromiseResolveBlock resolveWrapper, RCTPromiseRejectBlock rejectWrapper);
  jsi::Value
  createPromise(jsi::Runtime &runtime, std::shared_ptr<react::CallInvoker> jsInvoker, PromiseInvocationBlock invoke);
};

} // namespace react
} // namespace facebook

@protocol RCTTurboModule <NSObject>
@optional
/**
 * Used by TurboModules to get access to other TurboModules.
 *
 * Usage:
 * Place `@synthesize turboModuleLookupDelegate = _turboModuleLookupDelegate`
 * in the @implementation section of your TurboModule.
 */
@property (nonatomic, weak) id<RCTTurboModuleLookupDelegate> turboModuleLookupDelegate;

@optional
// This should be required, after migration is done.
- (std::shared_ptr<facebook::react::TurboModule>)
    getTurboModuleWithJsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
                  nativeInvoker:(std::shared_ptr<facebook::react::CallInvoker>)nativeInvoker
                     perfLogger:(id<RCTTurboModulePerformanceLogger>)perfLogger;

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
