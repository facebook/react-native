/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTModuleData.h"

#ifndef RCT_FIT_RM_OLD_RUNTIME

#import <objc/runtime.h>
#import <atomic>
#import <mutex>

#import <reactperflogger/BridgeNativeModulePerfLogger.h>

#import "RCTBridge+Private.h"
#import "RCTBridge.h"
#import "RCTBridgeModuleDecorator.h"
#import "RCTCallInvokerModule.h"
#import "RCTConstants.h"
#import "RCTInitializing.h"
#import "RCTLog.h"
#import "RCTModuleMethod.h"
#import "RCTProfile.h"
#import "RCTUtils.h"

using namespace facebook::react;

namespace {
int32_t getUniqueId()
{
  static std::atomic<int32_t> counter{0};
  return counter++;
}
} // namespace

@implementation RCTModuleData {
  NSDictionary<NSString *, id> *_constantsToExport;
  NSString *_queueName;
  __weak RCTBridge *_bridge;
  RCTBridgeModuleProvider _moduleProvider;
  std::mutex _instanceLock;
  BOOL _setupComplete;
  RCTModuleRegistry *_moduleRegistry;
  RCTViewRegistry *_viewRegistry_DEPRECATED;
  RCTBundleManager *_bundleManager;
  RCTCallableJSModules *_callableJSModules;
  BOOL _isInitialized;
}

@synthesize methods = _methods;
@synthesize methodsByName = _methodsByName;
@synthesize instance = _instance;
@synthesize methodQueue = _methodQueue;

- (void)_setUpWithBridge:(RCTBridge *)bridge
             moduleRegistry:(RCTModuleRegistry *)moduleRegistry
    viewRegistry_DEPRECATED:(RCTViewRegistry *)viewRegistry_DEPRECATED
              bundleManager:(RCTBundleManager *)bundleManager
          callableJSModules:(RCTCallableJSModules *)callableJSModules
{
  // start with the ivars
  {
    _bridge = bridge;
    _moduleRegistry = moduleRegistry;
    _viewRegistry_DEPRECATED = viewRegistry_DEPRECATED;
    _bundleManager = bundleManager;
    _callableJSModules = callableJSModules;
  }

  _implementsBatchDidComplete = [_moduleClass instancesRespondToSelector:@selector(batchDidComplete)];

  // If a module overrides `constantsToExport` and doesn't implement `requiresMainQueueSetup`, then we must assume
  // that it must be called on the main thread, because it may need to access UIKit.
  _hasConstantsToExport = [_moduleClass instancesRespondToSelector:@selector(constantsToExport)];

  const BOOL implementsRequireMainQueueSetup = [_moduleClass respondsToSelector:@selector(requiresMainQueueSetup)];
  if (implementsRequireMainQueueSetup) {
    _requiresMainQueueSetup = [_moduleClass requiresMainQueueSetup];
  } else {
    static IMP objectInitMethod;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      objectInitMethod = [NSObject instanceMethodForSelector:@selector(init)];
    });

    // If a module overrides `init` then we must assume that it expects to be
    // initialized on the main thread, because it may need to access UIKit.
    const BOOL hasCustomInit =
        !_instance && [_moduleClass instanceMethodForSelector:@selector(init)] != objectInitMethod;

    _requiresMainQueueSetup = _hasConstantsToExport || hasCustomInit;
  }
}

- (instancetype)initWithModuleClass:(Class)moduleClass
                             bridge:(RCTBridge *)bridge
                     moduleRegistry:(RCTModuleRegistry *)moduleRegistry
            viewRegistry_DEPRECATED:(RCTViewRegistry *)viewRegistry_DEPRECATED
                      bundleManager:(RCTBundleManager *)bundleManager
                  callableJSModules:(RCTCallableJSModules *)callableJSModules
{
  if (self = [super init]) {
    _moduleClass = moduleClass;
    _moduleProvider = [^id<RCTBridgeModule> {
      return [moduleClass new];
    } copy];
    [self _setUpWithBridge:bridge
                 moduleRegistry:moduleRegistry
        viewRegistry_DEPRECATED:viewRegistry_DEPRECATED
                  bundleManager:bundleManager
              callableJSModules:callableJSModules];
  }
  return self;
}

- (instancetype)initWithModuleInstance:(id<RCTBridgeModule>)instance
                                bridge:(RCTBridge *)bridge
                        moduleRegistry:(RCTModuleRegistry *)moduleRegistry
               viewRegistry_DEPRECATED:(RCTViewRegistry *)viewRegistry_DEPRECATED
                         bundleManager:(RCTBundleManager *)bundleManager
                     callableJSModules:(RCTCallableJSModules *)callableJSModules
{
  if (self = [super init]) {
    _instance = instance;
    _moduleClass = [instance class];
    [self _setUpWithBridge:bridge
                 moduleRegistry:moduleRegistry
        viewRegistry_DEPRECATED:viewRegistry_DEPRECATED
                  bundleManager:bundleManager
              callableJSModules:callableJSModules];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)init);

#pragma mark - private setup methods

- (void)setUpInstanceAndBridge:(int32_t)requestId
{
  NSString *moduleName = [self name];

  RCT_PROFILE_BEGIN_EVENT(
      RCTProfileTagAlways,
      @"[RCTModuleData setUpInstanceAndBridge]",
      @{@"moduleClass" : NSStringFromClass(_moduleClass)});
  {
    std::unique_lock<std::mutex> lock(_instanceLock);
    BOOL shouldSetup = !_setupComplete && _bridge.valid;

    if (shouldSetup) {
      if (!_instance) {
        if (RCT_DEBUG && _requiresMainQueueSetup) {
          RCTAssertMainQueue();
        }
        RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"[RCTModuleData setUpInstanceAndBridge] Create module", nil);

        BridgeNativeModulePerfLogger::moduleCreateConstructStart([moduleName UTF8String], requestId);
        _instance = _moduleProvider ? _moduleProvider() : nil;
        BridgeNativeModulePerfLogger::moduleCreateConstructEnd([moduleName UTF8String], requestId);

        RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
        if (!_instance) {
          // Module init returned nil, probably because automatic instantiation
          // of the module is not supported, and it is supposed to be passed in to
          // the bridge constructor. Mark setup complete to avoid doing more work.
          _setupComplete = YES;
          RCTLogWarn(
              @"The module %@ is returning nil from its constructor. You "
               "may need to instantiate it yourself and pass it into the "
               "bridge.",
              _moduleClass);
        }
      }

      if (_instance && RCTProfileIsProfiling()) {
        RCTProfileHookInstance(_instance);
      }
    }

    if (_instance) {
      BridgeNativeModulePerfLogger::moduleCreateSetUpStart([moduleName UTF8String], requestId);
    }

    if (shouldSetup) {
      // Bridge must be set before methodQueue is set up, as methodQueue
      // initialization requires it (View Managers get their queue by calling
      // self.bridge.uiManager.methodQueue)
      [self setBridgeForInstance];

      RCTBridgeModuleDecorator *moduleDecorator =
          [[RCTBridgeModuleDecorator alloc] initWithViewRegistry:_viewRegistry_DEPRECATED
                                                  moduleRegistry:_moduleRegistry
                                                   bundleManager:_bundleManager
                                               callableJSModules:_callableJSModules];
      [moduleDecorator attachInteropAPIsToModule:_instance];

      // This is a more performant alternative for conformsToProtocol:@protocol(RCTCallInvokerModule)
      if ([_instance respondsToSelector:@selector(setCallInvoker:)]) {
        [(id<RCTCallInvokerModule>)_instance setCallInvoker:[self.callInvokerProvider callInvokerForModuleData:self]];
      }
    }

    [self setUpMethodQueue];

    if (shouldSetup) {
      [self _initializeModule];
    }
  }
  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");

  // This is called outside of the lock in order to prevent deadlock issues
  // because the logic in `finishSetupForInstance` can cause
  // `moduleData.instance` to be accessed re-entrantly.
  if (_bridge.moduleSetupComplete) {
    [self finishSetupForInstance];
  } else {
    // If we're here, then the module is completely initialized,
    // except for what finishSetupForInstance does.  When the instance
    // method is called after moduleSetupComplete,
    // finishSetupForInstance will run.  If _requiresMainQueueSetup
    // is true, getting the instance will block waiting for the main
    // thread, which could take a while if the main thread is busy
    // (I've seen 50ms in testing).  So we clear that flag, since
    // nothing in finishSetupForInstance needs to be run on the main
    // thread.
    _requiresMainQueueSetup = NO;
  }

  if (_instance) {
    BridgeNativeModulePerfLogger::moduleCreateSetUpEnd([moduleName UTF8String], requestId);
  }
}

- (void)setBridgeForInstance
{
  if ([_instance respondsToSelector:@selector(bridge)] && _instance.bridge != _bridge) {
    RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"[RCTModuleData setBridgeForInstance]", nil);
    @try {
      [(id)_instance setValue:_bridge forKey:@"bridge"];
    } @catch (NSException *exception) {
      RCTLogError(
          @"%@ has no setter or ivar for its bridge, which is not "
           "permitted. You must either @synthesize the bridge property, "
           "or provide your own setter method.",
          self.name);
    }
    RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
  }
}

- (void)_initializeModule
{
  if (!_isInitialized && [_instance respondsToSelector:@selector(initialize)]) {
    _isInitialized = YES;
    [(id<RCTInitializing>)_instance initialize];
  }
}

- (void)finishSetupForInstance
{
  if (!_setupComplete && _instance) {
    RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"[RCTModuleData finishSetupForInstance]", nil);
    _setupComplete = YES;
    [_bridge registerModuleForFrameUpdates:_instance withModuleData:self];
    [[NSNotificationCenter defaultCenter]
        postNotificationName:RCTDidInitializeModuleNotification
                      object:_bridge
                    userInfo:@{@"module" : _instance, @"bridge" : RCTNullIfNil(_bridge.parentBridge)}];
    RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
  }
}

- (void)setUpMethodQueue
{
  if (_instance && !_methodQueue && _bridge.valid) {
    RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"[RCTModuleData setUpMethodQueue]", nil);
    BOOL implementsMethodQueue = [_instance respondsToSelector:@selector(methodQueue)];
    if (implementsMethodQueue && _bridge.valid) {
      _methodQueue = _instance.methodQueue;
    }
    if (!_methodQueue && _bridge.valid) {
      // Create new queue (store queueName, as it isn't retained by dispatch_queue)
      _queueName = [NSString stringWithFormat:@"com.facebook.react.%@Queue", self.name];
      _methodQueue = dispatch_queue_create(_queueName.UTF8String, DISPATCH_QUEUE_SERIAL);

      // assign it to the module
      if (implementsMethodQueue) {
        @try {
          [(id)_instance setValue:_methodQueue forKey:@"methodQueue"];
        } @catch (NSException *exception) {
          RCTLogError(
              @"%@ is returning nil for its methodQueue, which is not "
               "permitted. You must either return a pre-initialized "
               "queue, or @synthesize the methodQueue to let the bridge "
               "create a queue for you.",
              self.name);
        }
      }
    }
    RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
  }
}

- (void)calculateMethods
{
  if (_methods && _methodsByName) {
    return;
  }

  NSMutableArray<id<RCTBridgeMethod>> *moduleMethods = [NSMutableArray new];
  NSMutableDictionary<NSString *, id<RCTBridgeMethod>> *moduleMethodsByName = [NSMutableDictionary new];

  if ([_moduleClass instancesRespondToSelector:@selector(methodsToExport)]) {
    [moduleMethods addObjectsFromArray:[self.instance methodsToExport]];
  }

  unsigned int methodCount;
  Class cls = _moduleClass;
  while (cls && cls != [NSObject class] && cls != [NSProxy class]) {
    Method *methods = class_copyMethodList(object_getClass(cls), &methodCount);

    for (unsigned int i = 0; i < methodCount; i++) {
      Method method = methods[i];
      SEL selector = method_getName(method);
      if ([NSStringFromSelector(selector) hasPrefix:@"__rct_export__"]) {
        IMP imp = method_getImplementation(method);
        auto exportedMethod = ((const RCTMethodInfo *(*)(id, SEL))imp)(_moduleClass, selector);
        id<RCTBridgeMethod> moduleMethod = [[RCTModuleMethod alloc] initWithExportedMethod:exportedMethod
                                                                               moduleClass:_moduleClass];

        NSString *str = [NSString stringWithUTF8String:moduleMethod.JSMethodName];
        [moduleMethodsByName setValue:moduleMethod forKey:str];
        [moduleMethods addObject:moduleMethod];
      }
    }

    free(methods);
    cls = class_getSuperclass(cls);
  }

  _methods = [moduleMethods copy];
  _methodsByName = [moduleMethodsByName copy];
}

#pragma mark - public getters

- (BOOL)hasInstance
{
  std::unique_lock<std::mutex> lock(_instanceLock);
  return _instance != nil;
}

- (id<RCTBridgeModule>)instance
{
  NSString *moduleName = [self name];
  int32_t requestId = getUniqueId();
  BridgeNativeModulePerfLogger::moduleCreateStart([moduleName UTF8String], requestId);

  if (!_setupComplete) {
    RCT_PROFILE_BEGIN_EVENT(
        RCTProfileTagAlways, ([NSString stringWithFormat:@"[RCTModuleData instanceForClass:%@]", _moduleClass]), nil);
    if (_requiresMainQueueSetup) {
      // The chances of deadlock here are low, because module init very rarely
      // calls out to other threads, however we can't control when a module might
      // get accessed by client code during bridge setup, and a very low risk of
      // deadlock is better than a fairly high risk of an assertion being thrown.
      RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"[RCTModuleData instance] main thread setup", nil);

      if (!RCTIsMainQueue()) {
        RCTLogWarn(@"RCTBridge required dispatch_sync to load %@. This may lead to deadlocks", _moduleClass);
      }

      RCTUnsafeExecuteOnMainQueueSync(^{
        [self setUpInstanceAndBridge:requestId];
      });
      RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
    } else {
      [self setUpInstanceAndBridge:requestId];
    }
    RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
  } else {
    BridgeNativeModulePerfLogger::moduleCreateCacheHit([moduleName UTF8String], requestId);
  }

  if (_instance) {
    BridgeNativeModulePerfLogger::moduleCreateEnd([moduleName UTF8String], requestId);
  } else {
    BridgeNativeModulePerfLogger::moduleCreateFail([moduleName UTF8String], requestId);
  }
  return _instance;
}

- (NSString *)name
{
  return RCTBridgeModuleNameForClass(_moduleClass);
}

- (NSArray<id<RCTBridgeMethod>> *)methods
{
  [self calculateMethods];
  return _methods;
}

- (NSDictionary<NSString *, id<RCTBridgeMethod>> *)methodsByName
{
  [self calculateMethods];
  return _methodsByName;
}

- (void)gatherConstants
{
  return [self gatherConstantsAndSignalJSRequireEnding:NO];
}

- (void)gatherConstantsAndSignalJSRequireEnding:(BOOL)startMarkers
{
  NSString *moduleName = [self name];

  if (_hasConstantsToExport && !_constantsToExport) {
    RCT_PROFILE_BEGIN_EVENT(
        RCTProfileTagAlways, ([NSString stringWithFormat:@"[RCTModuleData gatherConstants] %@", _moduleClass]), nil);
    (void)[self instance];

    if (startMarkers) {
      /**
       * Why do we instrument moduleJSRequireEndingStart here?
       *  - NativeModule requires from JS go through ModuleRegistry::getConfig().
       *  - ModuleRegistry::getConfig() calls NativeModule::getConstants() first.
       *  - This delegates to RCTNativeModule::getConstants(), which calls RCTModuleData gatherConstants().
       *  - Therefore, this is the first statement that executes after the NativeModule is created/initialized in a JS
       *    require.
       */
      BridgeNativeModulePerfLogger::moduleJSRequireEndingStart([moduleName UTF8String]);
    }

    if (_requiresMainQueueSetup) {
      if (!RCTIsMainQueue()) {
        RCTLogWarn(@"Required dispatch_sync to load constants for %@. This may lead to deadlocks", _moduleClass);
      }

      RCTUnsafeExecuteOnMainQueueSync(^{
        self->_constantsToExport = [self->_instance constantsToExport] ?: @{};
      });
    } else {
      _constantsToExport = [_instance constantsToExport] ?: @{};
    }

    RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
  } else if (startMarkers) {
    /**
     * If a NativeModule doesn't have constants, it isn't eagerly loaded until its methods are first invoked.
     * Therefore, we should immediately start JSRequireEnding
     */
    BridgeNativeModulePerfLogger::moduleJSRequireEndingStart([moduleName UTF8String]);
  }
}

- (NSDictionary<NSString *, id> *)exportedConstants
{
  [self gatherConstantsAndSignalJSRequireEnding:YES];
  NSDictionary<NSString *, id> *constants = _constantsToExport;
  _constantsToExport = nil; // Not needed anymore
  return constants;
}

- (dispatch_queue_t)methodQueue
{
  if (_bridge.valid) {
    __unused id instance = self.instance;
    RCTAssert(_methodQueue != nullptr, @"Module %@ has no methodQueue (instance: %@)", self, instance);
  }
  return _methodQueue;
}

- (void)invalidate
{
  _methodQueue = nil;
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@: %p; name=\"%@\">", [self class], self, self.name];
}

@end

#else // RCT_FIT_RM_OLD_RUNTIME
@implementation RCTModuleData

- (instancetype)initWithModuleClass:(Class)moduleClass
                             bridge:(RCTBridge *)bridge
                     moduleRegistry:(RCTModuleRegistry *)moduleRegistry
            viewRegistry_DEPRECATED:(RCTViewRegistry *)viewRegistry_DEPRECATED
                      bundleManager:(RCTBundleManager *)bundleManager
                  callableJSModules:(RCTCallableJSModules *)callableJSModules
{
  return self;
}

- (instancetype)initWithModuleInstance:(id<RCTBridgeModule>)instance
                                bridge:(RCTBridge *)bridge
                        moduleRegistry:(RCTModuleRegistry *)moduleRegistry
               viewRegistry_DEPRECATED:(RCTViewRegistry *)viewRegistry_DEPRECATED
                         bundleManager:(RCTBundleManager *)bundleManager
                     callableJSModules:(RCTCallableJSModules *)callableJSModules
{
  return self;
}

- (void)gatherConstants
{
}

- (void)invalidate
{
}

@end

#endif // RCT_FIT_RM_OLD_RUNTIME
