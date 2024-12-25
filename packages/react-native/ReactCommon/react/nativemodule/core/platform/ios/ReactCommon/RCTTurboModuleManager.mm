/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTurboModuleManager.h"
#import "RCTInteropTurboModule.h"

#import <atomic>
#import <cassert>
#import <condition_variable>
#import <mutex>

#import <objc/runtime.h>

#import <React/RCTBridge+Private.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTBridgeProxy.h>
#import <React/RCTCallInvoker.h>
#import <React/RCTCallInvokerModule.h>
#import <React/RCTConstants.h>
#import <React/RCTCxxModule.h>
#import <React/RCTInitializing.h>
#import <React/RCTLog.h>
#import <React/RCTModuleData.h>
#import <React/RCTPerformanceLogger.h>
#import <React/RCTUtils.h>
#import <ReactCommon/CxxTurboModuleUtils.h>
#import <ReactCommon/RCTTurboModuleWithJSIBindings.h>
#import <ReactCommon/TurboCxxModule.h>
#import <ReactCommon/TurboModulePerfLogger.h>
#import <ReactCommon/TurboModuleUtils.h>

using namespace facebook;
using namespace facebook::react;

/**
 * A global variable whose address we use to associate method queues to id<RCTBridgeModule> objects.
 */
static char kAssociatedMethodQueueKey;

namespace {
int32_t getUniqueId()
{
  static std::atomic<int32_t> counter{0};
  return counter++;
}

class ModuleHolder {
 private:
  const int32_t moduleId_;
  id<RCTBridgeModule> module_;
  bool isTryingToCreateModule_;
  bool isDoneCreatingModule_;
  std::mutex mutex_;
  std::condition_variable cv_;

 public:
  ModuleHolder() : moduleId_(getUniqueId()), module_(nil), isTryingToCreateModule_(false), isDoneCreatingModule_(false)
  {
  }

  int32_t getModuleId() const
  {
    return moduleId_;
  }

  void setModule(id<RCTBridgeModule> module)
  {
    module_ = module;
  }

  id<RCTBridgeModule> getModule() const
  {
    return module_;
  }

  void startCreatingModule()
  {
    isTryingToCreateModule_ = true;
  }

  void endCreatingModule()
  {
    isTryingToCreateModule_ = false;
    isDoneCreatingModule_ = true;
  }

  bool isDoneCreatingModule() const
  {
    return isDoneCreatingModule_;
  }

  bool isCreatingModule() const
  {
    return isTryingToCreateModule_;
  }

  std::mutex &mutex()
  {
    return mutex_;
  }

  std::condition_variable &cv()
  {
    return cv_;
  }
};

class ModuleNativeMethodCallInvoker : public NativeMethodCallInvoker {
 private:
  dispatch_queue_t methodQueue_;

 public:
  ModuleNativeMethodCallInvoker(dispatch_queue_t methodQueue) : methodQueue_(methodQueue) {}
  void invokeAsync(const std::string &methodName, std::function<void()> &&work) noexcept override
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

  void invokeSync(const std::string &methodName, std::function<void()> &&work) override
  {
    work();
  }
};

class LegacyModuleNativeMethodCallInvoker : public ModuleNativeMethodCallInvoker {
  bool requiresMainQueueSetup_;

 public:
  LegacyModuleNativeMethodCallInvoker(dispatch_queue_t methodQueue, bool requiresMainQueueSetup)
      : ModuleNativeMethodCallInvoker(methodQueue), requiresMainQueueSetup_(requiresMainQueueSetup)
  {
  }

  void invokeSync(const std::string &methodName, std::function<void()> &&work) override
  {
    if (requiresMainQueueSetup_ && methodName == "getConstants") {
      __block auto retainedWork = std::move(work);
      RCTUnsafeExecuteOnMainQueueSync(^{
        retainedWork();
      });
      return;
    }

    ModuleNativeMethodCallInvoker::invokeSync(methodName, std::move(work));
  }
};

bool isTurboModuleClass(Class cls)
{
  return [cls conformsToProtocol:@protocol(RCTTurboModule)];
}

bool isTurboModuleInstance(id module)
{
  return isTurboModuleClass([module class]);
}
} // namespace

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

typedef struct {
  id<RCTBridgeModule> module;
  dispatch_queue_t methodQueue;
} ModuleQueuePair;

@implementation RCTTurboModuleManager {
  std::shared_ptr<CallInvoker> _jsInvoker;
  __weak id<RCTTurboModuleManagerDelegate> _delegate;
  __weak RCTBridge *_bridge;

  /**
   * TODO(T48018690):
   * All modules are currently long-lived.
   * We need to come up with a mechanism to allow modules to specify whether
   * they want to be long-lived or short-lived.
   *
   * All instances of ModuleHolder are owned by the _moduleHolders map.
   * We only reference ModuleHolders via pointers to entries in the _moduleHolders map.
   */
  std::unordered_map<std::string, ModuleHolder> _moduleHolders;
  std::unordered_map<std::string, std::shared_ptr<TurboModule>> _turboModuleCache;
  std::unordered_map<std::string, std::shared_ptr<TurboModule>> _legacyModuleCache;

  // Enforce synchronous access into _delegate
  std::mutex _turboModuleManagerDelegateMutex;

  // Enforce synchronous access to _invalidating and _moduleHolders
  std::mutex _moduleHoldersMutex;
  std::atomic<bool> _invalidating;

  NSDictionary<NSString *, id<RCTBridgeModule>> *_legacyEagerlyInitializedModules;
  NSDictionary<NSString *, Class> *_legacyEagerlyRegisteredModuleClasses;

  RCTBridgeProxy *_bridgeProxy;
  RCTBridgeModuleDecorator *_bridgeModuleDecorator;

  dispatch_queue_t _sharedModuleQueue;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
                   bridgeProxy:(RCTBridgeProxy *)bridgeProxy
         bridgeModuleDecorator:(RCTBridgeModuleDecorator *)bridgeModuleDecorator
                      delegate:(id<RCTTurboModuleManagerDelegate>)delegate
                     jsInvoker:(std::shared_ptr<CallInvoker>)jsInvoker
{
  if (self = [super init]) {
    _jsInvoker = std::move(jsInvoker);
    _delegate = delegate;
    _bridge = bridge;
    _bridgeProxy = bridgeProxy;
    _bridgeModuleDecorator = bridgeModuleDecorator;
    _invalidating = false;
    _sharedModuleQueue = dispatch_queue_create("com.meta.react.turbomodulemanager.queue", DISPATCH_QUEUE_SERIAL);

    if (RCTTurboModuleInteropEnabled()) {
      // TODO(T174674274): Implement lazy loading of legacy modules in the new architecture.
      NSMutableDictionary<NSString *, id<RCTBridgeModule>> *legacyInitializedModules = [NSMutableDictionary new];

      if ([_delegate respondsToSelector:@selector(extraModulesForBridge:)]) {
        for (id<RCTBridgeModule> module in [_delegate extraModulesForBridge:nil]) {
          if (!isTurboModuleInstance(module)) {
            [legacyInitializedModules setObject:module forKey:RCTBridgeModuleNameForClass([module class])];
          }
        }
      }
      _legacyEagerlyInitializedModules = legacyInitializedModules;

      NSMutableDictionary<NSString *, Class> *legacyEagerlyRegisteredModuleClasses = [NSMutableDictionary new];
      for (Class moduleClass in RCTGetModuleClasses()) {
        if (!isTurboModuleClass(moduleClass)) {
          [legacyEagerlyRegisteredModuleClasses setObject:moduleClass forKey:RCTBridgeModuleNameForClass(moduleClass)];
        }
      }
      _legacyEagerlyRegisteredModuleClasses = legacyEagerlyRegisteredModuleClasses;
    }

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(bridgeWillInvalidateModules:)
                                                 name:RCTBridgeWillInvalidateModulesNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(bridgeDidInvalidateModules:)
                                                 name:RCTBridgeDidInvalidateModulesNotification
                                               object:nil];
  }
  return self;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
                      delegate:(id<RCTTurboModuleManagerDelegate>)delegate
                     jsInvoker:(std::shared_ptr<CallInvoker>)jsInvoker
{
  return [self initWithBridge:bridge
                  bridgeProxy:nil
        bridgeModuleDecorator:[bridge bridgeModuleDecorator]
                     delegate:delegate
                    jsInvoker:jsInvoker];
}

- (instancetype)initWithBridgeProxy:(RCTBridgeProxy *)bridgeProxy
              bridgeModuleDecorator:(RCTBridgeModuleDecorator *)bridgeModuleDecorator
                           delegate:(id<RCTTurboModuleManagerDelegate>)delegate
                          jsInvoker:(std::shared_ptr<CallInvoker>)jsInvoker
{
  return [self initWithBridge:nil
                  bridgeProxy:bridgeProxy
        bridgeModuleDecorator:bridgeModuleDecorator
                     delegate:delegate
                    jsInvoker:jsInvoker];
}

/**
 * Given a name for a TurboModule, return a C++ object which is the instance
 * of that TurboModule C++ class. This class wraps the TurboModule's ObjC instance.
 * If no TurboModule ObjC class exist with the provided name, abort program.
 *
 * Note: All TurboModule instances are cached, which means they're all long-lived
 * (for now).
 */

- (std::shared_ptr<TurboModule>)provideTurboModule:(const char *)moduleName runtime:(jsi::Runtime *)runtime
{
  auto turboModuleLookup = _turboModuleCache.find(moduleName);
  if (turboModuleLookup != _turboModuleCache.end()) {
    TurboModulePerfLogger::moduleJSRequireBeginningCacheHit(moduleName);
    TurboModulePerfLogger::moduleJSRequireBeginningEnd(moduleName);
    return turboModuleLookup->second;
  }

  TurboModulePerfLogger::moduleJSRequireBeginningEnd(moduleName);

  /**
   * Step 1: Look for pure C++ modules.
   * Pure C++ modules get priority.
   */
  if ([_delegate respondsToSelector:@selector(getTurboModule:jsInvoker:)]) {
    int32_t moduleId = getUniqueId();
    TurboModulePerfLogger::moduleCreateStart(moduleName, moduleId);
    auto turboModule = [_delegate getTurboModule:moduleName jsInvoker:_jsInvoker];
    if (turboModule != nullptr) {
      _turboModuleCache.insert({moduleName, turboModule});
      TurboModulePerfLogger::moduleCreateEnd(moduleName, moduleId);
      return turboModule;
    }

    TurboModulePerfLogger::moduleCreateFail(moduleName, moduleId);
  }

  auto &cxxTurboModuleMapProvider = globalExportedCxxTurboModuleMap();
  auto it = cxxTurboModuleMapProvider.find(moduleName);
  if (it != cxxTurboModuleMapProvider.end()) {
    auto turboModule = it->second(_jsInvoker);
    _turboModuleCache.insert({moduleName, turboModule});
    return turboModule;
  }

  /**
   * Step 2: Look for platform-specific modules.
   */
  id<RCTBridgeModule> module =
      !RCTTurboModuleInteropEnabled() || [self _isTurboModule:moduleName] ? [self _provideObjCModule:moduleName] : nil;

  TurboModulePerfLogger::moduleJSRequireEndingStart(moduleName);

  // If we request that a TurboModule be created, its respective ObjC class must exist
  // If the class doesn't exist, then _provideObjCModule returns nil
  if (!module) {
    return nullptr;
  }

  Class moduleClass = [module class];

  dispatch_queue_t methodQueue = (dispatch_queue_t)objc_getAssociatedObject(module, &kAssociatedMethodQueueKey);
  if (methodQueue == nil) {
    RCTLogError(@"TurboModule \"%@\" was not associated with a method queue.", moduleClass);
  }

  /**
   * Step 2c: Create and native CallInvoker from the TurboModule's method queue.
   */
  std::shared_ptr<NativeMethodCallInvoker> nativeMethodCallInvoker =
      std::make_shared<ModuleNativeMethodCallInvoker>(methodQueue);

  /**
   * Have RCTCxxBridge decorate native CallInvoker, so that it's aware of TurboModule async method calls.
   * This helps the bridge fire onBatchComplete as readily as it should.
   */
  if ([_bridge respondsToSelector:@selector(decorateNativeMethodCallInvoker:)]) {
    nativeMethodCallInvoker = [_bridge decorateNativeMethodCallInvoker:nativeMethodCallInvoker];
  }

  /**
   * Step 2d: If the moduleClass is a legacy CxxModule, return a TurboCxxModule instance that
   * wraps CxxModule.
   */
  if ([moduleClass isSubclassOfClass:RCTCxxModule.class]) {
    // Use TurboCxxModule compat class to wrap the CxxModule instance.
    // This is only for migration convenience, despite less performant.
    auto turboModule = std::make_shared<TurboCxxModule>([((RCTCxxModule *)module) createModule], _jsInvoker);
    _turboModuleCache.insert({moduleName, turboModule});
    return turboModule;
  }

  /**
   * Step 2e: Return an exact sub-class of ObjC TurboModule
   *
   * Use respondsToSelector: below to infer conformance to @protocol(RCTTurboModule). Using conformsToProtocol: is
   * expensive.
   */
  if ([module respondsToSelector:@selector(getTurboModule:)]) {
    ObjCTurboModule::InitParams params = {
        .moduleName = moduleName,
        .instance = module,
        .jsInvoker = _jsInvoker,
        .nativeMethodCallInvoker = nativeMethodCallInvoker,
        .isSyncModule = methodQueue == RCTJSThread,
        .shouldVoidMethodsExecuteSync = (bool)RCTTurboModuleSyncVoidMethodsEnabled(),
    };

    auto turboModule = [(id<RCTTurboModule>)module getTurboModule:params];
    if (turboModule == nullptr) {
      RCTLogError(@"TurboModule \"%@\"'s getTurboModule: method returned nil.", moduleClass);
    }
    _turboModuleCache.insert({moduleName, turboModule});

    if ([module respondsToSelector:@selector(installJSIBindingsWithRuntime:callInvoker:)]) {
      [(id<RCTTurboModuleWithJSIBindings>)module installJSIBindingsWithRuntime:*runtime callInvoker:_jsInvoker];
    } else if ([module respondsToSelector:@selector(installJSIBindingsWithRuntime:)]) {
      // Old API without CallInvoker (deprecated)
      [(id<RCTTurboModuleWithJSIBindings>)module installJSIBindingsWithRuntime:*runtime];
    }
    return turboModule;
  }

  return nullptr;
}

- (std::shared_ptr<TurboModule>)provideLegacyModule:(const char *)moduleName
{
  auto legacyModuleLookup = _legacyModuleCache.find(moduleName);
  if (legacyModuleLookup != _legacyModuleCache.end()) {
    TurboModulePerfLogger::moduleJSRequireBeginningCacheHit(moduleName);
    TurboModulePerfLogger::moduleJSRequireBeginningEnd(moduleName);
    return legacyModuleLookup->second;
  }

  TurboModulePerfLogger::moduleJSRequireBeginningEnd(moduleName);

  // Create platform-specific native module object
  id<RCTBridgeModule> module = [self _isLegacyModule:moduleName] ? [self _provideObjCModule:moduleName] : nil;

  TurboModulePerfLogger::moduleJSRequireEndingStart(moduleName);

  // If we request that a TurboModule be created, its respective ObjC class must exist
  // If the class doesn't exist, then provideRCTBridgeModule returns nil
  if (!module) {
    return nullptr;
  }

  Class moduleClass = [module class];

  dispatch_queue_t methodQueue = (dispatch_queue_t)objc_getAssociatedObject(module, &kAssociatedMethodQueueKey);
  if (methodQueue == nil) {
    RCTLogError(@"Legacy NativeModule \"%@\" was not associated with a method queue.", moduleClass);
  }

  // Create a native call invoker from module's method queue
  std::shared_ptr<NativeMethodCallInvoker> nativeMethodCallInvoker =
      std::make_shared<LegacyModuleNativeMethodCallInvoker>(methodQueue, [self _requiresMainQueueSetup:moduleClass]);

  // If module is a legacy cxx module, return TurboCxxModule
  if ([moduleClass isSubclassOfClass:RCTCxxModule.class]) {
    // Use TurboCxxModule compat class to wrap the CxxModule instance.
    // This is only for migration convenience, despite less performant.
    auto turboModule = std::make_shared<TurboCxxModule>([((RCTCxxModule *)module) createModule], _jsInvoker);
    _legacyModuleCache.insert({moduleName, turboModule});
    return turboModule;
  }

  // Create interop module
  ObjCTurboModule::InitParams params = {
      .moduleName = moduleName,
      .instance = module,
      .jsInvoker = _jsInvoker,
      .nativeMethodCallInvoker = std::move(nativeMethodCallInvoker),
      .isSyncModule = methodQueue == RCTJSThread,
      .shouldVoidMethodsExecuteSync = (bool)RCTTurboModuleSyncVoidMethodsEnabled(),
  };

  auto turboModule = std::make_shared<ObjCInteropTurboModule>(params);
  _legacyModuleCache.insert({moduleName, turboModule});
  return turboModule;
}

- (BOOL)_isTurboModule:(const char *)moduleName
{
  Class moduleClass = [self _getModuleClassFromName:moduleName];
  return moduleClass != nil && (isTurboModuleClass(moduleClass) && ![moduleClass isSubclassOfClass:RCTCxxModule.class]);
}

- (BOOL)_isLegacyModule:(const char *)moduleName
{
  Class moduleClass = [self _getModuleClassFromName:moduleName];
  return [self _isLegacyModuleClass:moduleClass];
}

- (BOOL)_isLegacyModuleClass:(Class)moduleClass
{
  return moduleClass != nil && (!isTurboModuleClass(moduleClass) || [moduleClass isSubclassOfClass:RCTCxxModule.class]);
}

- (ModuleHolder *)_getOrCreateModuleHolder:(const char *)moduleName
{
  std::lock_guard<std::mutex> guard(_moduleHoldersMutex);
  if (_invalidating) {
    return nullptr;
  }

  return &_moduleHolders[moduleName];
}

/**
 * Given a name for a NativeModule, return an ObjC object which is the instance
 * of that NativeModule ObjC class. If no NativeModule exist with the provided name,
 * return nil.
 *
 * Note: All NativeModule instances are cached, which means they're all long-lived
 * (for now).
 */
- (id<RCTBridgeModule>)_provideObjCModule:(const char *)moduleName
{
  if (strncmp("RCT", moduleName, 3) == 0) {
    moduleName = [[[NSString stringWithUTF8String:moduleName] substringFromIndex:3] UTF8String];
  }

  ModuleHolder *moduleHolder = [self _getOrCreateModuleHolder:moduleName];

  if (!moduleHolder) {
    return nil;
  }

  TurboModulePerfLogger::moduleCreateStart(moduleName, moduleHolder->getModuleId());
  id<RCTBridgeModule> module = [self _provideObjCModule:moduleName moduleHolder:moduleHolder shouldPerfLog:YES];

  if (module) {
    TurboModulePerfLogger::moduleCreateEnd(moduleName, moduleHolder->getModuleId());
  } else {
    TurboModulePerfLogger::moduleCreateFail(moduleName, moduleHolder->getModuleId());
  }

  return module;
}

- (id<RCTBridgeModule>)_provideObjCModule:(const char *)moduleName
                             moduleHolder:(ModuleHolder *)moduleHolder
                            shouldPerfLog:(BOOL)shouldPerfLog
{
  bool shouldCreateModule = false;

  {
    std::lock_guard<std::mutex> guard(moduleHolder->mutex());

    if (moduleHolder->isDoneCreatingModule()) {
      if (shouldPerfLog) {
        TurboModulePerfLogger::moduleCreateCacheHit(moduleName, moduleHolder->getModuleId());
      }
      return moduleHolder->getModule();
    }

    if (!moduleHolder->isCreatingModule()) {
      shouldCreateModule = true;
      moduleHolder->startCreatingModule();
    }
  }

  if (shouldCreateModule) {
    /**
     * Step 2a: Resolve platform-specific class.
     */
    Class moduleClass = [self _getModuleClassFromName:moduleName];

    __block id<RCTBridgeModule> module = nil;

    if ([self _shouldCreateObjCModule:moduleClass]) {
      __weak __typeof(self) weakSelf = self;
      dispatch_block_t work = ^{
        auto strongSelf = weakSelf;
        if (!strongSelf) {
          return;
        }
        module = [strongSelf _createAndSetUpObjCModule:moduleClass moduleName:moduleName moduleId:moduleHolder
                      ->getModuleId()];
      };

      if ([self _requiresMainQueueSetup:moduleClass]) {
        RCTUnsafeExecuteOnMainQueueSync(work);
      } else {
        work();
      }
    }

    {
      std::lock_guard<std::mutex> guard(moduleHolder->mutex());

      moduleHolder->setModule(module);
      moduleHolder->endCreatingModule();
    }

    moduleHolder->cv().notify_all();

    return module;
  }

  std::unique_lock<std::mutex> guard(moduleHolder->mutex());

  while (moduleHolder->isCreatingModule()) {
    /**
     * TODO(T65905574):
     * If the thread responsible for creating and initializing the NativeModule stalls, we'll wait here indefinitely.
     * This is the behaviour in legacy NativeModules. Changing this now could lead to more crashes/problems in
     * TurboModules than in NativeModules, which'll make it more difficult to test the TurboModules infra. Therefore,
     * we should consider making it post TurboModule 100% rollout.
     */
    moduleHolder->cv().wait(guard);
  }

  return moduleHolder->getModule();
}

- (BOOL)_shouldCreateObjCModule:(Class)moduleClass
{
  if (RCTTurboModuleInteropEnabled()) {
    return [moduleClass conformsToProtocol:@protocol(RCTBridgeModule)];
  }

  return [moduleClass conformsToProtocol:@protocol(RCTTurboModule)];
}

/**
 * Given a NativeModule class, and its name, create and initialize it synchronously.
 *
 * This method can be called synchronously from two different contexts:
 *  - The thread that calls _provideObjCModule:
 *  - The main thread (if the NativeModule requires main queue init), blocking the thread that calls
 * _provideObjCModule:.
 */
- (id<RCTBridgeModule>)_createAndSetUpObjCModule:(Class)moduleClass
                                      moduleName:(const char *)moduleName
                                        moduleId:(int32_t)moduleId
{
  id<RCTBridgeModule> module = nil;

  /**
   * Step 2b: Ask hosting application/delegate to instantiate this class
   */

  TurboModulePerfLogger::moduleCreateConstructStart(moduleName, moduleId);
  module = [self _getModuleInstanceFromClass:moduleClass];
  TurboModulePerfLogger::moduleCreateConstructEnd(moduleName, moduleId);

  TurboModulePerfLogger::moduleCreateSetUpStart(moduleName, moduleId);

  /**
   * It is reasonable for NativeModules to not want/need the bridge.
   * In such cases, they won't have `@synthesize bridge = _bridge` in their
   * implementation, and a `- (RCTBridge *) bridge { ... }` method won't be
   * generated by the ObjC runtime. The property will also not be backed
   * by an ivar, which makes writing to it unsafe. Therefore, we check if
   * this method exists to know if we can safely set the bridge to the
   * NativeModule.
   */
  if ([module respondsToSelector:@selector(bridge)] && (_bridge || _bridgeProxy)) {
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
      if (_bridge) {
        [(id)module setValue:_bridge forKey:@"bridge"];
      } else if (_bridgeProxy) {
        [(id)module setValue:_bridgeProxy forKey:@"bridge"];
      }
    } @catch (NSException *exception) {
      RCTLogError(
          @"%@ has no setter or ivar for its bridge, which is not "
           "permitted. You must either @synthesize the bridge property, "
           "or provide your own setter method.",
          RCTBridgeModuleNameForClass([module class]));
    }
  }

  // This is a more performant alternative for conformsToProtocol:@protocol(RCTCallInvokerModule)
  if ([module respondsToSelector:@selector(setCallInvoker:)]) {
    RCTCallInvoker *callInvoker = [[RCTCallInvoker alloc] initWithCallInvoker:_jsInvoker];
    [(id<RCTCallInvokerModule>)module setCallInvoker:callInvoker];
  }

  /**
   * Some modules need their own queues, but don't provide any, so we need to create it for them.
   * These modules typically have the following:
   *   `@synthesize methodQueue = _methodQueue`
   */

  dispatch_queue_t methodQueue = nil;
  BOOL moduleHasMethodQueueGetter = [module respondsToSelector:@selector(methodQueue)];

  if (moduleHasMethodQueueGetter) {
    methodQueue = [(id<RCTBridgeModule>)module methodQueue];
  }

  /**
   * Note: RCTJSThread, which is a valid method queue, is defined as (id)kCFNull. It should rightfully not enter the
   * following if condition's block.
   */
  if (!methodQueue) {
    methodQueue = _sharedModuleQueue;

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
        [(id)module setValue:methodQueue forKey:@"methodQueue"];
      } @catch (NSException *exception) {
        RCTLogError(
            @"%@ has no setter or ivar for its methodQueue, which is not "
             "permitted. You must either @synthesize the methodQueue property, "
             "or provide your own setter method.",
            RCTBridgeModuleNameForClass([module class]));
      }
    }
  }

  /**
   * Decorate NativeModules with bridgeless-compatible APIs that call into the bridge.
   */
  if (_bridgeModuleDecorator) {
    [_bridgeModuleDecorator attachInteropAPIsToModule:module];
  }

  /**
   * If the NativeModule conforms to RCTInitializing, invoke its initialize method.
   */
  if ([module respondsToSelector:@selector(initialize)]) {
    [(id<RCTInitializing>)module initialize];
  }

  /**
   * Attach method queue to id<RCTBridgeModule> object.
   * This is necessary because the id<RCTBridgeModule> object can be eagerly created/initialized before the method
   * queue is required. The method queue is required for an id<RCTBridgeModule> for JS -> Native calls. So, we need it
   * before we create the id<RCTBridgeModule>'s TurboModule jsi::HostObject in provideTurboModule:runtime:.
   */
  objc_setAssociatedObject(module, &kAssociatedMethodQueueKey, methodQueue, OBJC_ASSOCIATION_RETAIN);

  /**
   * NativeModules that implement the RCTFrameUpdateObserver protocol
   * require registration with RCTDisplayLink.
   *
   * TODO(T55504345): Investigate whether we can improve this after TM
   * rollout.
   */
  if (_bridge) {
    RCTModuleData *data = [[RCTModuleData alloc] initWithModuleInstance:(id<RCTBridgeModule>)module
                                                                 bridge:_bridge
                                                         moduleRegistry:_bridge.moduleRegistry
                                                viewRegistry_DEPRECATED:nil
                                                          bundleManager:nil
                                                      callableJSModules:nil];
    [_bridge registerModuleForFrameUpdates:(id<RCTBridgeModule>)module withModuleData:data];
  }

  /**
   * Broadcast that this NativeModule was created.
   *
   * TODO(T41180176): Investigate whether we can delete this after TM
   * rollout.
   */
  [[NSNotificationCenter defaultCenter]
      postNotificationName:RCTDidInitializeModuleNotification
                    object:_bridge
                  userInfo:@{@"module" : module, @"bridge" : RCTNullIfNil([_bridge parentBridge])}];

  TurboModulePerfLogger::moduleCreateSetUpEnd(moduleName, moduleId);

  return module;
}

- (Class)_getModuleClassFromName:(const char *)moduleName
{
  NSString *moduleNameStr = @(moduleName);
  if (_legacyEagerlyInitializedModules && _legacyEagerlyInitializedModules[moduleNameStr]) {
    return [_legacyEagerlyInitializedModules[moduleNameStr] class];
  }

  if (_legacyEagerlyRegisteredModuleClasses && _legacyEagerlyRegisteredModuleClasses[moduleNameStr]) {
    return _legacyEagerlyRegisteredModuleClasses[moduleNameStr];
  }

  Class moduleClass = nil;
  {
    std::lock_guard<std::mutex> delegateGuard(_turboModuleManagerDelegateMutex);
    moduleClass = [_delegate getModuleClassFromName:moduleName];
  }

  if (moduleClass != nil) {
    return moduleClass;
  }

  moduleClass = getFallbackClassFromName(moduleName);
  if (moduleClass != nil) {
    return moduleClass;
  }

  // fallback on modules registered throught RCT_EXPORT_MODULE with custom names
  NSString *objcModuleName = [NSString stringWithUTF8String:moduleName];
  NSArray<Class> *modules = RCTGetModuleClasses();
  for (Class current in modules) {
    NSString *currentModuleName = [current moduleName];
    if ([objcModuleName isEqualToString:currentModuleName]) {
      return current;
    }
  }

  return moduleClass;
}

- (id<RCTBridgeModule>)_getModuleInstanceFromClass:(Class)moduleClass
{
  NSString *moduleNameStr = RCTBridgeModuleNameForClass(moduleClass);
  if (_legacyEagerlyInitializedModules && _legacyEagerlyInitializedModules[moduleNameStr]) {
    return _legacyEagerlyInitializedModules[moduleNameStr];
  }

  if (_legacyEagerlyRegisteredModuleClasses && _legacyEagerlyRegisteredModuleClasses[moduleNameStr]) {
    return [_legacyEagerlyRegisteredModuleClasses[moduleNameStr] new];
  }

  id<RCTBridgeModule> module = nil;
  {
    std::lock_guard<std::mutex> delegateGuard(_turboModuleManagerDelegateMutex);
    module = (id<RCTBridgeModule>)[_delegate getModuleInstanceFromClass:moduleClass];
  }

  if (!module) {
    module = [moduleClass new];
  }

  return module;
}

/**
 * Should this NativeModule be created and initialized on the main queue?
 *
 * For NativeModule ObjC classes that implement requiresMainQueueInit, return the result of this method.
 * For NativeModule ObjC classes that don't. Return true if they have a custom init or constantsToExport method.
 */
- (BOOL)_requiresMainQueueSetup:(Class)moduleClass
{
  const BOOL implementsRequireMainQueueSetup = [moduleClass respondsToSelector:@selector(requiresMainQueueSetup)];
  if (implementsRequireMainQueueSetup) {
    return [moduleClass requiresMainQueueSetup];
  }

  /**
   * WARNING!
   * This following logic exists for backwards compatibility with the legacy NativeModule system.
   *
   * TODO(T65864302) Remove the following logic after TM 100% rollout
   */

  /**
   * If a module overrides `constantsToExport` and doesn't implement `requiresMainQueueSetup`, then we must assume
   * that it must be called on the main thread, because it may need to access UIKit.
   */
  BOOL hasConstantsToExport = [moduleClass instancesRespondToSelector:@selector(constantsToExport)];

  static IMP objectInitMethod;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    objectInitMethod = [NSObject instanceMethodForSelector:@selector(init)];
  });

  /**
   * If a module overrides `init` then we must assume that it expects to be initialized on the main thread, because it
   * may need to access UIKit.
   */
  const BOOL hasCustomInit = [moduleClass instanceMethodForSelector:@selector(init)] != objectInitMethod;

  return hasConstantsToExport || hasCustomInit;
}

- (void)installJSBindings:(facebook::jsi::Runtime &)runtime
{
  /**
   * We keep TurboModuleManager alive until the JS VM is deleted.
   * It is perfectly valid to only use/create TurboModules from JS.
   * In such a case, we shouldn't dealloc TurboModuleManager if there
   * aren't any strong references to it in ObjC. Hence, we give
   * __turboModuleProxy a strong reference to TurboModuleManager.
   */
  auto turboModuleProvider = [self,
                              runtime = &runtime](const std::string &name) -> std::shared_ptr<react::TurboModule> {
    auto moduleName = name.c_str();

    TurboModulePerfLogger::moduleJSRequireBeginningStart(moduleName);
    auto moduleWasNotInitialized = ![self moduleIsInitialized:moduleName];
    if (moduleWasNotInitialized) {
      [self->_bridge.performanceLogger markStartForTag:RCTPLTurboModuleSetup];
    }

    /**
     * By default, all TurboModules are long-lived.
     * Additionally, if a TurboModule with the name `name` isn't found, then we
     * trigger an assertion failure.
     */
    auto turboModule = [self provideTurboModule:moduleName runtime:runtime];

    if (moduleWasNotInitialized && [self moduleIsInitialized:moduleName]) {
      [self->_bridge.performanceLogger markStopForTag:RCTPLTurboModuleSetup];
    }

    if (turboModule) {
      TurboModulePerfLogger::moduleJSRequireEndingEnd(moduleName);
    } else {
      TurboModulePerfLogger::moduleJSRequireEndingFail(moduleName);
    }
    return turboModule;
  };

  if (RCTTurboModuleInteropEnabled()) {
    auto legacyModuleProvider = [self](const std::string &name) -> std::shared_ptr<react::TurboModule> {
      auto moduleName = name.c_str();

      TurboModulePerfLogger::moduleJSRequireBeginningStart(moduleName);

      /**
       * By default, all TurboModules are long-lived.
       * Additionally, if a TurboModule with the name `name` isn't found, then we
       * trigger an assertion failure.
       */
      auto turboModule = [self provideLegacyModule:moduleName];

      if (turboModule) {
        TurboModulePerfLogger::moduleJSRequireEndingEnd(moduleName);
      } else {
        TurboModulePerfLogger::moduleJSRequireEndingFail(moduleName);
      }
      return turboModule;
    };

    TurboModuleBinding::install(runtime, std::move(turboModuleProvider), std::move(legacyModuleProvider));
  } else {
    TurboModuleBinding::install(runtime, std::move(turboModuleProvider));
  }
}

#pragma mark RCTTurboModuleRegistry

- (id)moduleForName:(const char *)moduleName
{
  return [self moduleForName:moduleName warnOnLookupFailure:YES];
}

- (id)moduleForName:(const char *)moduleName warnOnLookupFailure:(BOOL)warnOnLookupFailure
{
  // When the bridge is invalidating, TurboModules will be nil.
  // Therefore, don't (1) do the lookup, and (2) warn on lookup.
  if (_invalidating) {
    return nil;
  }

  id<RCTBridgeModule> module = [self _provideObjCModule:moduleName];

  if (warnOnLookupFailure && !module) {
    RCTLogError(@"Unable to find module for %@", [NSString stringWithUTF8String:moduleName]);
  }

  return module;
}

- (BOOL)moduleIsInitialized:(const char *)moduleName
{
  std::unique_lock<std::mutex> guard(_moduleHoldersMutex);
  return _moduleHolders.find(moduleName) != _moduleHolders.end();
}

#pragma mark Invalidation logic

- (void)bridgeWillInvalidateModules:(NSNotification *)notification
{
  RCTBridge *bridge = notification.userInfo[@"bridge"];
  if (bridge != _bridge) {
    return;
  }

  [self _enterInvalidatingState];
}

- (void)bridgeDidInvalidateModules:(NSNotification *)notification
{
  RCTBridge *bridge = notification.userInfo[@"bridge"];
  if (bridge != _bridge) {
    return;
  }

  [self _invalidateModules];
}

- (void)invalidate
{
  [self _enterInvalidatingState];
  [self _invalidateModules];
}

- (void)_enterInvalidatingState
{
  // This should halt all insertions into _moduleHolders
  std::lock_guard<std::mutex> guard(_moduleHoldersMutex);
  _invalidating = true;
}

- (void)_invalidateModules
{
  // Backward-compatibility: RCTInvalidating handling.
  dispatch_group_t moduleInvalidationGroup = dispatch_group_create();
  std::vector<ModuleQueuePair> modulesToInvalidate;
  for (auto &pair : _moduleHolders) {
    std::string moduleName = pair.first;
    ModuleHolder *moduleHolder = &pair.second;

    /**
     * We could start tearing down ReactNative before a NativeModule is fully initialized. In this case, we should wait
     * for NativeModule init to finish before calling invalidate on it. So, we call
     * _provideObjCModule:moduleHolder, because it's guaranteed to return a fully initialized NativeModule.
     */
    id<RCTBridgeModule> module = [self _provideObjCModule:moduleName.c_str()
                                             moduleHolder:moduleHolder
                                            shouldPerfLog:NO];

    if ([module respondsToSelector:@selector(invalidate)]) {
      dispatch_queue_t methodQueue = (dispatch_queue_t)objc_getAssociatedObject(module, &kAssociatedMethodQueueKey);

      if (methodQueue == nil) {
        RCTLogError(
            @"TurboModuleManager: Couldn't invalidate NativeModule \"%@\", because its method queue is nil.",
            [module class]);
        continue;
      }
      modulesToInvalidate.push_back({module, methodQueue});
    }
  }

  for (auto unused : modulesToInvalidate) {
    dispatch_group_enter(moduleInvalidationGroup);
  }

  for (auto &moduleQueuePair : modulesToInvalidate) {
    id<RCTBridgeModule> module = moduleQueuePair.module;
    dispatch_queue_t methodQueue = moduleQueuePair.methodQueue;

    dispatch_block_t invalidateModule = ^{
      [((id<RCTInvalidating>)module) invalidate];
      dispatch_group_leave(moduleInvalidationGroup);
    };

    if (_bridge) {
      [_bridge dispatchBlock:invalidateModule queue:methodQueue];
    } else {
      // Bridgeless mode
      if (methodQueue == RCTJSThread) {
        invalidateModule();
      } else {
        dispatch_async(methodQueue, invalidateModule);
      }
    }
  }

  if (dispatch_group_wait(moduleInvalidationGroup, dispatch_time(DISPATCH_TIME_NOW, 10 * NSEC_PER_SEC))) {
    RCTLogError(@"TurboModuleManager: Timed out waiting for modules to be invalidated");
  }

  _moduleHolders.clear();
  _turboModuleCache.clear();
  _legacyModuleCache.clear();
}

@end
