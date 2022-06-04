/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBridge.h"
#import "RCTBridge+Private.h"

#import <objc/runtime.h>

#import "RCTConvert.h"
#if RCT_ENABLE_INSPECTOR
#import "RCTInspectorDevServerHelper.h"
#endif
#import "RCTDevLoadingViewProtocol.h"
#import "RCTJSThread.h"
#import "RCTLog.h"
#import "RCTModuleData.h"
#import "RCTPerformanceLogger.h"
#import "RCTProfile.h"
#import "RCTReloadCommand.h"
#import "RCTUtils.h"

NSString *const RCTJavaScriptDidFailToLoadNotification = @"RCTJavaScriptDidFailToLoadNotification";
NSString *const RCTJavaScriptDidLoadNotification = @"RCTJavaScriptDidLoadNotification";
NSString *const RCTJavaScriptWillStartExecutingNotification = @"RCTJavaScriptWillStartExecutingNotification";
NSString *const RCTJavaScriptWillStartLoadingNotification = @"RCTJavaScriptWillStartLoadingNotification";
NSString *const RCTDidInitializeModuleNotification = @"RCTDidInitializeModuleNotification";
NSString *const RCTDidSetupModuleNotification = @"RCTDidSetupModuleNotification";
NSString *const RCTDidSetupModuleNotificationModuleNameKey = @"moduleName";
NSString *const RCTDidSetupModuleNotificationSetupTimeKey = @"setupTime";
NSString *const RCTBridgeWillReloadNotification = @"RCTBridgeWillReloadNotification";
NSString *const RCTBridgeFastRefreshNotification = @"RCTBridgeFastRefreshNotification";
NSString *const RCTBridgeWillDownloadScriptNotification = @"RCTBridgeWillDownloadScriptNotification";
NSString *const RCTBridgeDidDownloadScriptNotification = @"RCTBridgeDidDownloadScriptNotification";
NSString *const RCTBridgeWillInvalidateModulesNotification = @"RCTBridgeWillInvalidateModulesNotification";
NSString *const RCTBridgeDidInvalidateModulesNotification = @"RCTBridgeDidInvalidateModulesNotification";
NSString *const RCTBridgeWillBeInvalidatedNotification = @"RCTBridgeWillBeInvalidatedNotification";
NSString *const RCTBridgeDidDownloadScriptNotificationSourceKey = @"source";
NSString *const RCTBridgeDidDownloadScriptNotificationBridgeDescriptionKey = @"bridgeDescription";

static NSMutableArray<Class> *RCTModuleClasses;
static dispatch_queue_t RCTModuleClassesSyncQueue;
NSArray<Class> *RCTGetModuleClasses(void)
{
  __block NSArray<Class> *result;
  dispatch_sync(RCTModuleClassesSyncQueue, ^{
    result = [RCTModuleClasses copy];
  });
  return result;
}

/**
 * Register the given class as a bridge module. All modules must be registered
 * prior to the first bridge initialization.
 * TODO: (T115656171) Refactor RCTRegisterModule out of Bridge.m since it doesn't use the Bridge.
 */
void RCTRegisterModule(Class);
void RCTRegisterModule(Class moduleClass)
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    RCTModuleClasses = [NSMutableArray new];
    RCTModuleClassesSyncQueue =
        dispatch_queue_create("com.facebook.react.ModuleClassesSyncQueue", DISPATCH_QUEUE_CONCURRENT);
  });

  RCTAssert(
      [moduleClass conformsToProtocol:@protocol(RCTBridgeModule)],
      @"%@ does not conform to the RCTBridgeModule protocol",
      moduleClass);

  // Register module
  dispatch_barrier_async(RCTModuleClassesSyncQueue, ^{
    [RCTModuleClasses addObject:moduleClass];
  });
}

/**
 * This function returns the module name for a given class.
 */
NSString *RCTBridgeModuleNameForClass(Class cls)
{
#if RCT_DEBUG
  RCTAssert(
      [cls conformsToProtocol:@protocol(RCTBridgeModule)],
      @"Bridge module `%@` does not conform to RCTBridgeModule",
      cls);
#endif

  NSString *name = [cls moduleName];
  if (name.length == 0) {
    name = NSStringFromClass(cls);
  }

  return RCTDropReactPrefixes(name);
}

static BOOL turboModuleEnabled = NO;
BOOL RCTTurboModuleEnabled(void)
{
#if RCT_DEBUG
  // TODO(T53341772): Allow TurboModule for test environment. Right now this breaks RNTester tests if enabled.
  if (RCTRunningInTestEnvironment()) {
    return NO;
  }
#endif
  return turboModuleEnabled;
}

void RCTEnableTurboModule(BOOL enabled)
{
  turboModuleEnabled = enabled;
}

static BOOL turboModuleEagerInitEnabled = NO;
BOOL RCTTurboModuleEagerInitEnabled(void)
{
  return turboModuleEagerInitEnabled;
}

void RCTEnableTurboModuleEagerInit(BOOL enabled)
{
  turboModuleEagerInitEnabled = enabled;
}

static BOOL turboModuleSharedMutexInitEnabled = NO;
BOOL RCTTurboModuleSharedMutexInitEnabled(void)
{
  return turboModuleSharedMutexInitEnabled;
}

void RCTEnableTurboModuleSharedMutexInit(BOOL enabled)
{
  turboModuleSharedMutexInitEnabled = enabled;
}

static RCTTurboModuleCleanupMode turboModuleCleanupMode = kRCTGlobalScope;
RCTTurboModuleCleanupMode RCTGetTurboModuleCleanupMode(void)
{
  return turboModuleCleanupMode;
}

void RCTSetTurboModuleCleanupMode(RCTTurboModuleCleanupMode mode)
{
  turboModuleCleanupMode = mode;
}

// Turn off TurboModule delegate locking
static BOOL turboModuleManagerDelegateLockingDisabled = YES;
BOOL RCTTurboModuleManagerDelegateLockingDisabled(void)
{
  return turboModuleManagerDelegateLockingDisabled;
}

void RCTDisableTurboModuleManagerDelegateLocking(BOOL disabled)
{
  turboModuleManagerDelegateLockingDisabled = disabled;
}

// Turn off TurboModule delegate locking
static BOOL viewConfigEventValidAttributesDisabled = NO;
BOOL RCTViewConfigEventValidAttributesDisabled(void)
{
  return viewConfigEventValidAttributesDisabled;
}

void RCTDisableViewConfigEventValidAttributes(BOOL disabled)
{
  viewConfigEventValidAttributesDisabled = disabled;
}

@interface RCTBridge () <RCTReloadListener>
@end

@implementation RCTBridge {
  NSURL *_delegateBundleURL;
}

+ (void)initialize
{
  _RCTInitializeJSThreadConstantInternal();
}

static RCTBridge *RCTCurrentBridgeInstance = nil;

/**
 * The last current active bridge instance. This is set automatically whenever
 * the bridge is accessed. It can be useful for static functions or singletons
 * that need to access the bridge for purposes such as logging, but should not
 * be relied upon to return any particular instance, due to race conditions.
 */
+ (instancetype)currentBridge
{
  return RCTCurrentBridgeInstance;
}

+ (void)setCurrentBridge:(RCTBridge *)currentBridge
{
  RCTCurrentBridgeInstance = currentBridge;
}

- (instancetype)initWithDelegate:(id<RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  return [self initWithDelegate:delegate bundleURL:nil moduleProvider:nil launchOptions:launchOptions];
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                   moduleProvider:(RCTBridgeModuleListProvider)block
                    launchOptions:(NSDictionary *)launchOptions
{
  return [self initWithDelegate:nil bundleURL:bundleURL moduleProvider:block launchOptions:launchOptions];
}

- (instancetype)initWithDelegate:(id<RCTBridgeDelegate>)delegate
                       bundleURL:(NSURL *)bundleURL
                  moduleProvider:(RCTBridgeModuleListProvider)block
                   launchOptions:(NSDictionary *)launchOptions
{
  if (self = [super init]) {
    RCTEnforceNewArchitectureValidation(RCTNotAllowedInBridgeless, self, nil);
    _delegate = delegate;
    _bundleURL = bundleURL;
    _moduleProvider = block;
    _launchOptions = [launchOptions copy];

    [self setUp];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (void)dealloc
{
  /**
   * This runs only on the main thread, but crashes the subclass
   * RCTAssertMainQueue();
   */
  [self invalidate];
}

- (void)setRCTTurboModuleRegistry:(id<RCTTurboModuleRegistry>)turboModuleRegistry
{
  [self.batchedBridge setRCTTurboModuleRegistry:turboModuleRegistry];
}

- (void)attachBridgeAPIsToTurboModule:(id<RCTTurboModule>)module
{
  [self.batchedBridge attachBridgeAPIsToTurboModule:module];
}

- (void)didReceiveReloadCommand
{
#if RCT_ENABLE_INSPECTOR
  // Disable debugger to resume the JsVM & avoid thread locks while reloading
  [RCTInspectorDevServerHelper disableDebugger];
#endif

  [[NSNotificationCenter defaultCenter] postNotificationName:RCTBridgeWillReloadNotification object:self userInfo:nil];

  /**
   * Any thread
   */
  dispatch_async(dispatch_get_main_queue(), ^{
    // WARNING: Invalidation is async, so it may not finish before re-setting up the bridge,
    // causing some issues. TODO: revisit this post-Fabric/TurboModule.
    [self invalidate];
    // Reload is a special case, do not preserve launchOptions and treat reload as a fresh start
    self->_launchOptions = nil;
    [self setUp];
  });
}

- (RCTModuleRegistry *)moduleRegistry
{
  return self.batchedBridge.moduleRegistry;
}

- (NSArray<Class> *)moduleClasses
{
  return self.batchedBridge.moduleClasses;
}

- (id)moduleForName:(NSString *)moduleName
{
  return [self.batchedBridge moduleForName:moduleName];
}

- (id)moduleForName:(NSString *)moduleName lazilyLoadIfNecessary:(BOOL)lazilyLoad
{
  return [self.batchedBridge moduleForName:moduleName lazilyLoadIfNecessary:lazilyLoad];
}

- (id)moduleForClass:(Class)moduleClass
{
  id module = [self.batchedBridge moduleForClass:moduleClass];
  if (!module) {
    module = [self moduleForName:RCTBridgeModuleNameForClass(moduleClass)];
  }
  return module;
}

- (NSArray *)modulesConformingToProtocol:(Protocol *)protocol
{
  NSMutableArray *modules = [NSMutableArray new];
  for (Class moduleClass in [self.moduleClasses copy]) {
    if ([moduleClass conformsToProtocol:protocol]) {
      id module = [self moduleForClass:moduleClass];
      if (module) {
        [modules addObject:module];
      }
    }
  }
  return [modules copy];
}

- (BOOL)moduleIsInitialized:(Class)moduleClass
{
  return [self.batchedBridge moduleIsInitialized:moduleClass];
}

/**
 * DEPRECATED - please use RCTReloadCommand.
 */
- (void)reload
{
  RCTTriggerReloadCommandListeners(@"Unknown from bridge");
}

/**
 * DEPRECATED - please use RCTReloadCommand.
 */
- (void)reloadWithReason:(NSString *)reason
{
  RCTTriggerReloadCommandListeners(reason);
}

- (void)onFastRefresh
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTBridgeFastRefreshNotification object:self];
}

/**
 * DEPRECATED - please use RCTReloadCommand.
 */
- (void)requestReload
{
  [self reloadWithReason:@"Requested from bridge"];
}

- (Class)bridgeClass
{
  return [RCTCxxBridge class];
}

- (void)setUp
{
  RCT_PROFILE_BEGIN_EVENT(0, @"-[RCTBridge setUp]", nil);

  _performanceLogger = [RCTPerformanceLogger new];
  [_performanceLogger markStartForTag:RCTPLBridgeStartup];
  [_performanceLogger markStartForTag:RCTPLTTI];

  Class bridgeClass = self.bridgeClass;

  // Only update bundleURL from delegate if delegate bundleURL has changed
  NSURL *previousDelegateURL = _delegateBundleURL;
  _delegateBundleURL = [self.delegate sourceURLForBridge:self];
  if (_delegateBundleURL && ![_delegateBundleURL isEqual:previousDelegateURL]) {
    _bundleURL = _delegateBundleURL;
  }

  // Sanitize the bundle URL
  _bundleURL = [RCTConvert NSURL:_bundleURL.absoluteString];

  RCTExecuteOnMainQueue(^{
    RCTRegisterReloadCommandListener(self);
    RCTReloadCommandSetBundleURL(self->_bundleURL);
  });

  self.batchedBridge = [[bridgeClass alloc] initWithParentBridge:self];
  [self.batchedBridge start];

  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
}

- (BOOL)isLoading
{
  return self.batchedBridge.loading;
}

- (BOOL)isValid
{
  return self.batchedBridge.valid;
}

- (BOOL)isBatchActive
{
  return [_batchedBridge isBatchActive];
}

- (void)invalidate
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTBridgeWillBeInvalidatedNotification object:self];

  RCTBridge *batchedBridge = self.batchedBridge;
  self.batchedBridge = nil;

  if (batchedBridge) {
    RCTExecuteOnMainQueue(^{
      [batchedBridge invalidate];
    });
  }
}

- (void)updateModuleWithInstance:(id<RCTBridgeModule>)instance
{
  [self.batchedBridge updateModuleWithInstance:instance];
}

- (void)registerAdditionalModuleClasses:(NSArray<Class> *)modules
{
  [self.batchedBridge registerAdditionalModuleClasses:modules];
}

- (void)enqueueJSCall:(NSString *)moduleDotMethod args:(NSArray *)args
{
  NSArray<NSString *> *ids = [moduleDotMethod componentsSeparatedByString:@"."];
  NSString *module = ids[0];
  NSString *method = ids[1];
  [self enqueueJSCall:module method:method args:args completion:NULL];
}

- (void)enqueueJSCall:(NSString *)module
               method:(NSString *)method
                 args:(NSArray *)args
           completion:(dispatch_block_t)completion
{
  [self.batchedBridge enqueueJSCall:module method:method args:args completion:completion];
}

- (void)enqueueCallback:(NSNumber *)cbID args:(NSArray *)args
{
  [self.batchedBridge enqueueCallback:cbID args:args];
}

- (void)registerSegmentWithId:(NSUInteger)segmentId path:(NSString *)path
{
  [self.batchedBridge registerSegmentWithId:segmentId path:path];
}

- (void)loadAndExecuteSplitBundleURL:(NSURL *)bundleURL
                             onError:(RCTLoadAndExecuteErrorBlock)onError
                          onComplete:(dispatch_block_t)onComplete
{
  [self.batchedBridge loadAndExecuteSplitBundleURL:bundleURL onError:onError onComplete:onComplete];
}

@end
