/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBridge.h"
#import "RCTBridge+Inspector.h"
#import "RCTBridge+Private.h"

#import <objc/runtime.h>

#import "RCTConvert.h"
#if RCT_ENABLE_INSPECTOR
#import "RCTInspectorDevServerHelper.h"
#endif
#import <jsinspector-modern/InspectorFlags.h>
#import <jsinspector-modern/InspectorInterfaces.h>
#import <jsinspector-modern/ReactCdp.h>
#import <optional>
#import "RCTDevLoadingViewProtocol.h"
#import "RCTInspectorNetworkHelper.h"
#import "RCTInspectorUtils.h"
#import "RCTJSThread.h"
#import "RCTLog.h"
#import "RCTModuleData.h"
#import "RCTPausedInDebuggerOverlayController.h"
#import "RCTPerformanceLogger.h"
#import "RCTProfile.h"
#import "RCTReloadCommand.h"
#import "RCTUtils.h"

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

static BOOL turboModuleInteropEnabled = NO;
BOOL RCTTurboModuleInteropEnabled(void)
{
  return turboModuleInteropEnabled;
}
void RCTEnableTurboModuleInterop(BOOL enabled)
{
  turboModuleInteropEnabled = enabled;
}

static BOOL turboModuleInteropBridgeProxyEnabled = NO;
BOOL RCTTurboModuleInteropBridgeProxyEnabled(void)
{
  return turboModuleInteropBridgeProxyEnabled;
}

void RCTEnableTurboModuleInteropBridgeProxy(BOOL enabled)
{
  turboModuleInteropBridgeProxyEnabled = enabled;
}

static BOOL fabricInteropLayerEnabled = YES;
BOOL RCTFabricInteropLayerEnabled()
{
  return fabricInteropLayerEnabled;
}

void RCTEnableFabricInteropLayer(BOOL enabled)
{
  fabricInteropLayerEnabled = enabled;
}

static RCTBridgeProxyLoggingLevel bridgeProxyLoggingLevel = kRCTBridgeProxyLoggingLevelNone;
RCTBridgeProxyLoggingLevel RCTTurboModuleInteropBridgeProxyLogLevel(void)
{
  return bridgeProxyLoggingLevel;
}

void RCTSetTurboModuleInteropBridgeProxyLogLevel(RCTBridgeProxyLoggingLevel logLevel)
{
  bridgeProxyLoggingLevel = logLevel;
}

static BOOL useTurboModuleInteropForAllTurboModules = NO;
BOOL RCTTurboModuleInteropForAllTurboModulesEnabled(void)
{
  return useTurboModuleInteropForAllTurboModules;
}
void RCTEnableTurboModuleInteropForAllTurboModules(BOOL enabled)
{
  useTurboModuleInteropForAllTurboModules = enabled;
}

// Turn on TurboModule sync execution of void methods
static BOOL gTurboModuleEnableSyncVoidMethods = NO;
BOOL RCTTurboModuleSyncVoidMethodsEnabled(void)
{
  return gTurboModuleEnableSyncVoidMethods;
}
void RCTEnableTurboModuleSyncVoidMethods(BOOL enabled)
{
  gTurboModuleEnableSyncVoidMethods = enabled;
}

BOOL kDispatchAccessibilityManagerInitOntoMain = NO;
BOOL RCTUIManagerDispatchAccessibilityManagerInitOntoMain(void)
{
  return kDispatchAccessibilityManagerInitOntoMain;
}

void RCTUIManagerSetDispatchAccessibilityManagerInitOntoMain(BOOL enabled)
{
  kDispatchAccessibilityManagerInitOntoMain = enabled;
}

class RCTBridgeHostTargetDelegate : public facebook::react::jsinspector_modern::HostTargetDelegate {
 public:
  RCTBridgeHostTargetDelegate(RCTBridge *bridge)
      : bridge_(bridge),
        pauseOverlayController_([[RCTPausedInDebuggerOverlayController alloc] init]),
        networkHelper_([[RCTInspectorNetworkHelper alloc] init])
  {
  }

  facebook::react::jsinspector_modern::HostTargetMetadata getMetadata() override
  {
    auto metadata = [RCTInspectorUtils getHostMetadata];

    return {
        .appDisplayName = [metadata.appDisplayName UTF8String],
        .appIdentifier = [metadata.appIdentifier UTF8String],
        .deviceName = [metadata.deviceName UTF8String],
        .integrationName = "iOS Bridge (RCTBridge)",
        .platform = [metadata.platform UTF8String],
        .reactNativeVersion = [metadata.reactNativeVersion UTF8String],
    };
  }

  void onReload(const PageReloadRequest &request) override
  {
    RCTAssertMainQueue();
    [bridge_ reload];
  }

  void onSetPausedInDebuggerMessage(const OverlaySetPausedInDebuggerMessageRequest &request) override
  {
    RCTAssertMainQueue();
    if (!request.message.has_value()) {
      [pauseOverlayController_ hide];
    } else {
      __weak RCTBridge *bridgeWeak = bridge_;
      [pauseOverlayController_ showWithMessage:@(request.message.value().c_str())
                                      onResume:^{
                                        RCTAssertMainQueue();
                                        RCTBridge *bridgeStrong = bridgeWeak;
                                        if (!bridgeStrong) {
                                          return;
                                        }
                                        if (!bridgeStrong.inspectorTarget) {
                                          return;
                                        }
                                        bridgeStrong.inspectorTarget->sendCommand(
                                            facebook::react::jsinspector_modern::HostCommand::DebuggerResume);
                                      }];
    }
  }

  void loadNetworkResource(const RCTInspectorLoadNetworkResourceRequest &params, RCTInspectorNetworkExecutor executor)
      override
  {
    [networkHelper_ loadNetworkResourceWithParams:params executor:executor];
  }

 private:
  __weak RCTBridge *bridge_;
  RCTPausedInDebuggerOverlayController *pauseOverlayController_;
  RCTInspectorNetworkHelper *networkHelper_;
};

@interface RCTBridge () <RCTReloadListener>
@end

@implementation RCTBridge {
  NSURL *_delegateBundleURL;

  std::unique_ptr<RCTBridgeHostTargetDelegate> _inspectorHostDelegate;
  std::shared_ptr<facebook::react::jsinspector_modern::HostTarget> _inspectorTarget;
  std::optional<int> _inspectorPageId;
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
    _inspectorHostDelegate = std::make_unique<RCTBridgeHostTargetDelegate>(self);

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
  // NOTE: RCTCxxBridge will use _inspectorTarget during [self invalidate], so we must
  // keep it alive until after the call returns.
  [self invalidate];

  // `invalidate` is asynchronous if we aren't on the main queue. Unregister
  // the HostTarget on the main queue so that `invalidate` can complete safely
  // in that case.
  if (_inspectorPageId.has_value()) {
    // Since we can't keep using `self` after dealloc, steal its inspector
    // state into block-mutable variables
    __block auto inspectorPageId = std::move(_inspectorPageId);
    __block auto inspectorTarget = std::move(_inspectorTarget);
    RCTExecuteOnMainQueue(^{
      facebook::react::jsinspector_modern::getInspectorInstance().removePage(*inspectorPageId);
      inspectorPageId.reset();
      inspectorTarget.reset();
    });
  }
}

- (void)setRCTTurboModuleRegistry:(id<RCTTurboModuleRegistry>)turboModuleRegistry
{
  [self.batchedBridge setRCTTurboModuleRegistry:turboModuleRegistry];
}

- (RCTBridgeModuleDecorator *)bridgeModuleDecorator
{
  return [self.batchedBridge bridgeModuleDecorator];
}

- (void)didReceiveReloadCommand
{
#if RCT_ENABLE_INSPECTOR
  auto &inspectorFlags = facebook::react::jsinspector_modern::InspectorFlags::getInstance();
  if (!inspectorFlags.getFuseboxEnabled()) {
    // Disable debugger to resume the JsVM & avoid thread locks while reloading
    [RCTInspectorDevServerHelper disableDebugger];
  }
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
  [_performanceLogger markStartForTag:RCTPLInitReactRuntime];
  [_performanceLogger markStartForTag:RCTPLBridgeStartup];
  [_performanceLogger markStartForTag:RCTPLTTI];

  auto &inspectorFlags = facebook::react::jsinspector_modern::InspectorFlags::getInstance();
  if (inspectorFlags.getFuseboxEnabled() && !_inspectorPageId.has_value()) {
    _inspectorTarget =
        facebook::react::jsinspector_modern::HostTarget::create(*_inspectorHostDelegate, [](auto callback) {
          RCTExecuteOnMainQueue(^{
            callback();
          });
        });
    __weak RCTBridge *weakSelf = self;
    _inspectorPageId = facebook::react::jsinspector_modern::getInspectorInstance().addPage(
        "React Native Bridge",
        /* vm */ "",
        [weakSelf](std::unique_ptr<facebook::react::jsinspector_modern::IRemoteConnection> remote)
            -> std::unique_ptr<facebook::react::jsinspector_modern::ILocalConnection> {
          RCTBridge *strongSelf = weakSelf;
          if (!strongSelf) {
            // This can happen if we're about to be dealloc'd. Reject the connection.
            return nullptr;
          }
          return strongSelf->_inspectorTarget->connect(std::move(remote));
        },
        {.nativePageReloads = true, .prefersFuseboxFrontend = true});
  }

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

- (facebook::react::jsinspector_modern::HostTarget *)inspectorTarget
{
  return _inspectorTarget.get();
}
@end
