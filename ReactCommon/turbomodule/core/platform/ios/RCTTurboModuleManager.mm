/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTurboModuleManager.h"

#import <atomic>
#import <cassert>
#import <mutex>

#import <objc/runtime.h>

#import <React/RCTBridge+Private.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTCxxModule.h>
#import <React/RCTLog.h>
#import <React/RCTModuleData.h>
#import <React/RCTPerformanceLogger.h>
#import <React/RCTUtils.h>
#import <ReactCommon/TurboCxxModule.h>
#import <ReactCommon/TurboModuleBinding.h>

using namespace facebook;

/**
 * A global variable whose address we use to associate method queues to id<RCTTurboModule> objects.
 */
static char kAssociatedMethodQueueKey;

namespace {
class MethodQueueNativeCallInvoker : public facebook::react::CallInvoker {
 private:
  dispatch_queue_t methodQueue_;

 public:
  MethodQueueNativeCallInvoker(dispatch_queue_t methodQueue) : methodQueue_(methodQueue) {}
  void invokeAsync(std::function<void()> &&work) override
  {
    if (methodQueue_ == RCTJSThread) {
      work();
      return;
    }

    __block auto retainedWork = std::move(work);
    dispatch_async(methodQueue_, ^{
      retainedWork();
    });
  }

  void invokeSync(std::function<void()> &&work) override
  {
    if (methodQueue_ == RCTJSThread) {
      work();
      return;
    }

    __block auto retainedWork = std::move(work);
    dispatch_sync(methodQueue_, ^{
      retainedWork();
    });
  }
};
}

// Fallback lookup since RCT class prefix is sometimes stripped in the existing NativeModule system.
// This will be removed in the future.
static Class getFallbackClassFromName(const char *name)
{
  Class moduleClass = NSClassFromString([NSString stringWithUTF8String:name]);
  if (!moduleClass) {
    moduleClass = NSClassFromString([NSString stringWithFormat:@"RCT%s", name]);
  }
  return moduleClass;
}

@implementation RCTTurboModuleManager {
  jsi::Runtime *_runtime;
  std::shared_ptr<facebook::react::CallInvoker> _jsInvoker;
  id<RCTTurboModulePerformanceLogger> _performanceLogger;
  __weak id<RCTTurboModuleManagerDelegate> _delegate;
  __weak RCTBridge *_bridge;
  /**
   * TODO(T48018690):
   * All modules are currently long-lived.
   * We need to come up with a mechanism to allow modules to specify whether
   * they want to be long-lived or short-lived.
   */
  std::unordered_map<std::string, id<RCTTurboModule>> _rctTurboModuleCache;
  std::unordered_map<std::string, std::shared_ptr<react::TurboModule>> _turboModuleCache;

  /**
   * _rctTurboModuleCache can be accessed by multiple threads at once via
   * the provideRCTTurboModule method. This can lead to races. Therefore, we
   * need to protect access to this unordered_map.
   *
   * Note:
   * There's no need to protect access to _turboModuleCache because that cache
   * is only accessed within provideTurboModule, which is only invoked by the
   * JS thread.
   */
  std::mutex _rctTurboModuleCacheLock;
  std::atomic<bool> _invalidating;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
                      delegate:(id<RCTTurboModuleManagerDelegate>)delegate
                     jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  return [self initWithBridge:bridge delegate:delegate jsInvoker:jsInvoker performanceLogger:nil];
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
                      delegate:(id<RCTTurboModuleManagerDelegate>)delegate
                     jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
             performanceLogger:(id<RCTTurboModulePerformanceLogger>)performanceLogger
{
  if (self = [super init]) {
    _jsInvoker = jsInvoker;
    _delegate = delegate;
    _bridge = bridge;
    _invalidating = false;
    _performanceLogger = performanceLogger;

    // Necessary to allow NativeModules to lookup TurboModules
    [bridge setRCTTurboModuleLookupDelegate:self];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(bridgeWillInvalidateModules:)
                                                 name:RCTBridgeWillInvalidateModulesNotification
                                               object:_bridge.parentBridge];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(bridgeDidInvalidateModules:)
                                                 name:RCTBridgeDidInvalidateModulesNotification
                                               object:_bridge.parentBridge];
  }
  return self;
}

- (void)notifyAboutTurboModuleSetup:(const char *)name
{
  NSString *moduleName = [[NSString alloc] initWithUTF8String:name];
  if (moduleName) {
    int64_t setupTime = [self->_bridge.performanceLogger durationForTag:RCTPLTurboModuleSetup];
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTDidSetupModuleNotification
                                                        object:nil
                                                      userInfo:@{
                                                        RCTDidSetupModuleNotificationModuleNameKey : moduleName,
                                                        RCTDidSetupModuleNotificationSetupTimeKey : @(setupTime)
                                                      }];
  }
}

/**
 * Given a name for a TurboModule, return a C++ object which is the instance
 * of that TurboModule C++ class. This class wraps the TurboModule's ObjC instance.
 * If no TurboModule ObjC class exist with the provided name, abort program.
 *
 * Note: All TurboModule instances are cached, which means they're all long-lived
 * (for now).
 */

- (std::shared_ptr<react::TurboModule>)provideTurboModule:(const char *)moduleName
{
  auto turboModuleLookup = _turboModuleCache.find(moduleName);
  if (turboModuleLookup != _turboModuleCache.end()) {
    [_performanceLogger createTurboModuleCacheHit:moduleName];
    return turboModuleLookup->second;
  }

  /**
   * Step 1: Look for pure C++ modules.
   * Pure C++ modules get priority.
   */
  if ([_delegate respondsToSelector:@selector(getTurboModule:jsInvoker:)]) {
    [_performanceLogger getCppTurboModuleFromTMMDelegateStart:moduleName];
    auto turboModule = [_delegate getTurboModule:moduleName jsInvoker:_jsInvoker];
    [_performanceLogger getCppTurboModuleFromTMMDelegateEnd:moduleName];
    if (turboModule != nullptr) {
      _turboModuleCache.insert({moduleName, turboModule});
      return turboModule;
    }
  }

  /**
   * Step 2: Look for platform-specific modules.
   */
  [_performanceLogger createRCTTurboModuleStart:moduleName];
  id<RCTTurboModule> module = [self provideRCTTurboModule:moduleName];
  [_performanceLogger createRCTTurboModuleEnd:moduleName];

  // If we request that a TurboModule be created, its respective ObjC class must exist
  // If the class doesn't exist, then provideRCTTurboModule returns nil
  if (!module) {
    return nullptr;
  }

  Class moduleClass = [module class];

  dispatch_queue_t methodQueue = (dispatch_queue_t)objc_getAssociatedObject(module, &kAssociatedMethodQueueKey);

  /**
   * Step 2c: Create and native CallInvoker from the TurboModule's method queue.
   */
  std::shared_ptr<facebook::react::CallInvoker> nativeInvoker =
      std::make_shared<MethodQueueNativeCallInvoker>(methodQueue);

  /**
   * Have RCTCxxBridge decorate native CallInvoker, so that it's aware of TurboModule async method calls.
   * This helps the bridge fire onBatchComplete as readily as it should.
   */
  if ([_bridge respondsToSelector:@selector(decorateNativeCallInvoker:)]) {
    nativeInvoker = [_bridge decorateNativeCallInvoker:nativeInvoker];
  }

  // If RCTTurboModule supports creating its own C++ TurboModule object,
  // allow it to do so.
  if ([module respondsToSelector:@selector(getTurboModuleWithJsInvoker:nativeInvoker:perfLogger:)]) {
    [_performanceLogger getTurboModuleFromRCTTurboModuleStart:moduleName];
    auto turboModule = [module getTurboModuleWithJsInvoker:_jsInvoker
                                             nativeInvoker:nativeInvoker
                                                perfLogger:_performanceLogger];
    [_performanceLogger getTurboModuleFromRCTTurboModuleEnd:moduleName];
    assert(turboModule != nullptr);
    _turboModuleCache.insert({moduleName, turboModule});
    return turboModule;
  }

  /**
   * Step 2d: If the moduleClass is a legacy CxxModule, return a TurboCxxModule instance that
   * wraps CxxModule.
   */
  if ([moduleClass isSubclassOfClass:RCTCxxModule.class]) {
    // Use TurboCxxModule compat class to wrap the CxxModule instance.
    // This is only for migration convenience, despite less performant.
    [_performanceLogger getTurboModuleFromRCTCxxModuleStart:moduleName];
    auto turboModule = std::make_shared<react::TurboCxxModule>([((RCTCxxModule *)module) createModule], _jsInvoker);
    [_performanceLogger getTurboModuleFromRCTCxxModuleEnd:moduleName];
    _turboModuleCache.insert({moduleName, turboModule});
    return turboModule;
  }

  /**
   * Step 2e: Return an exact sub-class of ObjC TurboModule
   */
  [_performanceLogger getTurboModuleFromTMMDelegateStart:moduleName];
  auto turboModule = [_delegate getTurboModule:moduleName
                                      instance:module
                                     jsInvoker:_jsInvoker
                                 nativeInvoker:nativeInvoker
                                    perfLogger:_performanceLogger];
  [_performanceLogger getTurboModuleFromTMMDelegateEnd:moduleName];
  if (turboModule != nullptr) {
    _turboModuleCache.insert({moduleName, turboModule});
  }
  return turboModule;
}

/**
 * Given a name for a TurboModule, return an ObjC object which is the instance
 * of that TurboModule ObjC class. If no TurboModule exist with the provided name,
 * return nil.
 *
 * Note: All TurboModule instances are cached, which means they're all long-lived
 * (for now).
 */
- (id<RCTTurboModule>)provideRCTTurboModule:(const char *)moduleName
{
  Class moduleClass;
  id<RCTTurboModule> module = nil;

  {
    std::unique_lock<std::mutex> lock(_rctTurboModuleCacheLock);

    auto rctTurboModuleCacheLookup = _rctTurboModuleCache.find(moduleName);
    if (rctTurboModuleCacheLookup != _rctTurboModuleCache.end()) {
      [_performanceLogger createRCTTurboModuleCacheHit:moduleName];
      return rctTurboModuleCacheLookup->second;
    }

    if (_invalidating) {
      // Don't allow creating new instances while invalidating.
      return nil;
    }

    /**
     * Step 2a: Resolve platform-specific class.
     */
    [_performanceLogger getRCTTurboModuleClassStart:moduleName];

    if ([_delegate respondsToSelector:@selector(getModuleClassFromName:)]) {
      moduleClass = [_delegate getModuleClassFromName:moduleName];
    }

    if (!moduleClass) {
      moduleClass = getFallbackClassFromName(moduleName);
    }

    [_performanceLogger getRCTTurboModuleClassEnd:moduleName];

    if (![moduleClass conformsToProtocol:@protocol(RCTTurboModule)]) {
      return nil;
    }

    /**
     * Step 2b: Ask hosting application/delegate to instantiate this class
     */
    [_performanceLogger getRCTTurboModuleInstanceStart:moduleName];

    if ([_delegate respondsToSelector:@selector(getModuleInstanceFromClass:)]) {
      module = [_delegate getModuleInstanceFromClass:moduleClass];
    } else {
      module = [moduleClass new];
    }

    [_performanceLogger getRCTTurboModuleInstanceEnd:moduleName];

    if ([module respondsToSelector:@selector(setTurboModuleLookupDelegate:)]) {
      [module setTurboModuleLookupDelegate:self];
    }

    _rctTurboModuleCache.insert({moduleName, module});
  }

  [self setUpRCTTurboModule:module moduleName:moduleName];
  return module;
}

- (void)setUpRCTTurboModule:(id<RCTTurboModule>)module moduleName:(const char *)moduleName
{
  __weak id<RCTBridgeModule> weakModule = (id<RCTBridgeModule>)module;
  __weak RCTBridge *weakBridge = _bridge;
  id<RCTTurboModulePerformanceLogger> performanceLogger = _performanceLogger;

  auto setUpTurboModule = ^{
    if (!weakModule) {
      return;
    }

    [performanceLogger setupRCTTurboModuleStart:moduleName];

    id<RCTBridgeModule> strongModule = weakModule;
    RCTBridge *strongBridge = weakBridge;

    /**
     * It is reasonable for NativeModules to not want/need the bridge.
     * In such cases, they won't have `@synthesize bridge = _bridge` in their
     * implementation, and a `- (RCTBridge *) bridge { ... }` method won't be
     * generated by the ObjC runtime. The property will also not be backed
     * by an ivar, which makes writing to it unsafe. Therefore, we check if
     * this method exists to know if we can safely set the bridge to the
     * NativeModule.
     */
    if ([strongModule respondsToSelector:@selector(bridge)] && strongBridge) {
      [performanceLogger attachRCTBridgeToRCTTurboModuleStart:moduleName];

      /**
       * Just because a NativeModule has the `bridge` method, it doesn't mean
       * that it has synthesized the bridge in its implementation. Therefore,
       * we need to surround the code that sets the bridge to the NativeModule
       * inside a try/catch. This catches the cases where the NativeModule
       * author specifies a `bridge` method manually.
       */
      @try {
        /**
         * RCTBridgeModule declares the bridge property as readonly.
         * Therefore, when authors of NativeModules synthesize the bridge
         * via @synthesize bridge = bridge;, the ObjC runtime generates
         * only a - (RCTBridge *) bridge: { ... } method. No setter is
         * generated, so we have have to rely on the KVC API of ObjC to set
         * the bridge property of these NativeModules.
         */
        [(id)strongModule setValue:strongBridge forKey:@"bridge"];
      } @catch (NSException *exception) {
        RCTLogError(
            @"%@ has no setter or ivar for its bridge, which is not "
             "permitted. You must either @synthesize the bridge property, "
             "or provide your own setter method.",
            RCTBridgeModuleNameForClass([strongModule class]));
      }

      [performanceLogger attachRCTBridgeToRCTTurboModuleEnd:moduleName];
    }

    /**
     * Some modules need their own queues, but don't provide any, so we need to create it for them.
     * These modules typically have the following:
     *   `@synthesize methodQueue = _methodQueue`
     */

    [performanceLogger attachMethodQueueToRCTTurboModuleStart:moduleName];

    dispatch_queue_t methodQueue = nil;
    BOOL moduleHasMethodQueueGetter = [strongModule respondsToSelector:@selector(methodQueue)];

    if (moduleHasMethodQueueGetter) {
      methodQueue = [strongModule methodQueue];
    }

    /**
     * Note: RCTJSThread, which is a valid method queue, is defined as (id)kCFNull. It should rightfully not enter the
     * following if condition's block.
     */
    if (!methodQueue) {
      NSString *methodQueueName = [NSString stringWithFormat:@"com.facebook.react.%sQueue", moduleName];
      methodQueue = dispatch_queue_create(methodQueueName.UTF8String, DISPATCH_QUEUE_SERIAL);

      if (moduleHasMethodQueueGetter) {
        /**
         * If the module has a method queue getter, two cases are possible:
         *  - We @synthesized the method queue. In this case, the getter will initially return nil.
         *  - We had a custom methodQueue function on the NativeModule. If we got this far, then that getter returned
         *    nil.
         *
         * Therefore, we do a try/catch and use ObjC's KVC API and try to assign the method queue to the NativeModule.
         * In case 1, we'll succeed. In case 2, an exception will be thrown, which we'll ignore.
         */

        @try {
          [(id)strongModule setValue:methodQueue forKey:@"methodQueue"];
        } @catch (NSException *exception) {
          RCTLogError(
              @"%@ has no setter or ivar for its methodQueue, which is not "
               "permitted. You must either @synthesize the bridge property, "
               "or provide your own setter method.",
              RCTBridgeModuleNameForClass([strongModule class]));
        }
      }
    }

    /**
     * Attach method queue to id<RCTTurboModule> object.
     * This is necessary because the id<RCTTurboModule> object can be eagerly created/initialized before the method
     * queue is required. The method queue is required for an id<RCTTurboModule> for JS -> Native calls. So, we need it
     * before we create the id<RCTTurboModule>'s TurboModule jsi::HostObject in provideTurboModule:.
     */
    objc_setAssociatedObject(strongModule, &kAssociatedMethodQueueKey, methodQueue, OBJC_ASSOCIATION_RETAIN);

    [performanceLogger attachMethodQueueToRCTTurboModuleEnd:moduleName];

    /**
     * NativeModules that implement the RCTFrameUpdateObserver protocol
     * require registration with RCTDisplayLink.
     *
     * TODO(T55504345): Investigate whether we can improve this after TM
     * rollout.
     */
    if (strongBridge) {
      [performanceLogger registerRCTTurboModuleForFrameUpdatesStart:moduleName];
      RCTModuleData *data = [[RCTModuleData alloc] initWithModuleInstance:strongModule bridge:strongBridge];
      [strongBridge registerModuleForFrameUpdates:strongModule withModuleData:data];
      [performanceLogger registerRCTTurboModuleForFrameUpdatesEnd:moduleName];
    }

    /**
     * Broadcast that this TurboModule was created.
     *
     * TODO(T41180176): Investigate whether we can delete this after TM
     * rollout.
     */
    [performanceLogger dispatchDidInitializeModuleNotificationForRCTTurboModuleStart:moduleName];
    [[NSNotificationCenter defaultCenter]
        postNotificationName:RCTDidInitializeModuleNotification
                      object:strongBridge
                    userInfo:@{@"module" : module, @"bridge" : RCTNullIfNil([strongBridge parentBridge])}];
    [performanceLogger dispatchDidInitializeModuleNotificationForRCTTurboModuleEnd:moduleName];

    [performanceLogger setupRCTTurboModuleEnd:moduleName];
  };

  /**
   * TODO(T64991809): Fix TurboModule race:
   *  - When NativeModules that don't require main queue setup are required from different threads, they'll
   *    concurrently run setUpRCTTurboModule:
   */
  if ([[module class] respondsToSelector:@selector(requiresMainQueueSetup)] &&
      [[module class] requiresMainQueueSetup]) {
    /**
     * If the main thread synchronously calls into JS that creates a TurboModule,
     * we could deadlock. This behaviour is migrated over from the legacy NativeModule
     * system.
     *
     * TODO(T63807674): Investigate the right migration plan off of this
     */
    [_performanceLogger setupRCTTurboModuleDispatch:moduleName];
    RCTUnsafeExecuteOnMainQueueSync(setUpTurboModule);
  } else {
    setUpTurboModule();
  }
}

- (void)installJSBindingWithRuntime:(jsi::Runtime *)runtime
{
  _runtime = runtime;

  if (!_runtime) {
    // jsi::Runtime doesn't exist when attached to Chrome debugger.
    return;
  }

  __weak __typeof(self) weakSelf = self;

  react::TurboModuleBinding::install(
      *_runtime,
      [weakSelf,
       performanceLogger = _performanceLogger](const std::string &name) -> std::shared_ptr<react::TurboModule> {
        if (!weakSelf) {
          return nullptr;
        }

        __strong __typeof(self) strongSelf = weakSelf;

        auto moduleName = name.c_str();
        auto moduleWasNotInitialized = ![strongSelf moduleIsInitialized:moduleName];
        if (moduleWasNotInitialized) {
          [strongSelf->_bridge.performanceLogger markStartForTag:RCTPLTurboModuleSetup];
        }

        [performanceLogger createTurboModuleStart:moduleName];

        /**
         * By default, all TurboModules are long-lived.
         * Additionally, if a TurboModule with the name `name` isn't found, then we
         * trigger an assertion failure.
         */
        auto turboModule = [strongSelf provideTurboModule:moduleName];

        [performanceLogger createTurboModuleEnd:moduleName];

        if (moduleWasNotInitialized && [strongSelf moduleIsInitialized:moduleName]) {
          [strongSelf->_bridge.performanceLogger markStopForTag:RCTPLTurboModuleSetup];
          [strongSelf notifyAboutTurboModuleSetup:moduleName];
        }

        return turboModule;
      });
}

#pragma mark RCTTurboModuleLookupDelegate

- (id)moduleForName:(const char *)moduleName
{
  return [self moduleForName:moduleName warnOnLookupFailure:YES];
}

- (id)moduleForName:(const char *)moduleName warnOnLookupFailure:(BOOL)warnOnLookupFailure
{
  id<RCTTurboModule> module = [self provideRCTTurboModule:moduleName];

  if (warnOnLookupFailure && !module) {
    RCTLogError(@"Unable to find module for %@", [NSString stringWithUTF8String:moduleName]);
  }

  return module;
}

- (BOOL)moduleIsInitialized:(const char *)moduleName
{
  std::unique_lock<std::mutex> lock(_rctTurboModuleCacheLock);
  return _rctTurboModuleCache.find(std::string(moduleName)) != _rctTurboModuleCache.end();
}

#pragma mark Invalidation logic

- (void)bridgeWillInvalidateModules:(NSNotification *)notification
{
  RCTBridge *bridge = notification.userInfo[@"bridge"];
  if (bridge != _bridge) {
    return;
  }

  _invalidating = true;
}

- (void)bridgeDidInvalidateModules:(NSNotification *)notification
{
  RCTBridge *bridge = notification.userInfo[@"bridge"];
  if (bridge != _bridge) {
    return;
  }

  std::unordered_map<std::string, id<RCTTurboModule>> rctCacheCopy;
  {
    std::unique_lock<std::mutex> lock(_rctTurboModuleCacheLock);
    rctCacheCopy.insert(_rctTurboModuleCache.begin(), _rctTurboModuleCache.end());
  }

  // Backward-compatibility: RCTInvalidating handling.
  dispatch_group_t moduleInvalidationGroup = dispatch_group_create();
  for (const auto &p : rctCacheCopy) {
    id<RCTTurboModule> module = p.second;
    if ([module respondsToSelector:@selector(invalidate)]) {
      if ([module respondsToSelector:@selector(methodQueue)]) {
        dispatch_queue_t methodQueue = [module performSelector:@selector(methodQueue)];
        if (methodQueue) {
          dispatch_group_enter(moduleInvalidationGroup);
          [bridge
              dispatchBlock:^{
                [((id<RCTInvalidating>)module) invalidate];
                dispatch_group_leave(moduleInvalidationGroup);
              }
                      queue:methodQueue];
          continue;
        }
      }
      [((id<RCTInvalidating>)module) invalidate];
    }
  }

  if (dispatch_group_wait(moduleInvalidationGroup, dispatch_time(DISPATCH_TIME_NOW, 10 * NSEC_PER_SEC))) {
    RCTLogError(@"TurboModuleManager: Timed out waiting for modules to be invalidated");
  }

  {
    std::unique_lock<std::mutex> lock(_rctTurboModuleCacheLock);
    _rctTurboModuleCache.clear();
  }

  _turboModuleCache.clear();
}

- (void)invalidate
{
  std::unordered_map<std::string, id<RCTTurboModule>> rctCacheCopy;
  {
    std::unique_lock<std::mutex> lock(_rctTurboModuleCacheLock);
    rctCacheCopy.insert(_rctTurboModuleCache.begin(), _rctTurboModuleCache.end());
  }

  // Backward-compatibility: RCTInvalidating handling, but not adhering to desired methodQueue.
  for (const auto &p : rctCacheCopy) {
    id<RCTTurboModule> module = p.second;
    if ([module respondsToSelector:@selector(invalidate)]) {
      [((id<RCTInvalidating>)module) invalidate];
    }
  }

  {
    std::unique_lock<std::mutex> lock(_rctTurboModuleCacheLock);
    _rctTurboModuleCache.clear();
  }

  _turboModuleCache.clear();
}

@end
