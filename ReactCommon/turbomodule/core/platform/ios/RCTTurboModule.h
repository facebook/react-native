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

namespace facebook {
namespace react {

class Instance;

/**
 * ObjC++ specific TurboModule base class.
 */
class JSI_EXPORT ObjCTurboModule : public TurboModule {
 public:
  ObjCTurboModule(const std::string &name, id<RCTTurboModule> instance, std::shared_ptr<CallInvoker> jsInvoker);

  jsi::Value invokeObjCMethod(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind valueKind,
      const std::string &methodName,
      SEL selector,
      const jsi::Value *args,
      size_t count);

  id<RCTTurboModule> instance_;

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

  NSInvocation *getMethodInvocation(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind valueKind,
      const id<RCTTurboModule> module,
      std::shared_ptr<CallInvoker> jsInvoker,
      const std::string &methodName,
      SEL selector,
      const jsi::Value *args,
      size_t count,
      NSMutableArray *retainedObjectsForInvocation);

  BOOL hasMethodArgConversionSelector(NSString *methodName, int argIndex);
  SEL getMethodArgConversionSelector(NSString *methodName, int argIndex);

  using PromiseInvocationBlock =
      void (^)(jsi::Runtime &rt, RCTPromiseResolveBlock resolveWrapper, RCTPromiseRejectBlock rejectWrapper);
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
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModuleWithJsInvoker:
    (std::shared_ptr<facebook::react::CallInvoker>)jsInvoker;

@end

// TODO: Consolidate this extension with the one in RCTSurfacePresenter.
@interface RCTBridge ()

- (std::weak_ptr<facebook::react::Instance>)reactInstance;

@end
