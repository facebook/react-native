/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <atomic>
#include <future>

#import <React/RCTAssert.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTBridgeMethod.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTConstants.h>
#import <React/RCTConvert.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <React/RCTCxxModule.h>
#import <React/RCTCxxUtils.h>
#import <React/RCTDevSettings.h>
#import <React/RCTDisplayLink.h>
#import <React/RCTFollyConvert.h>
#import <React/RCTJavaScriptLoader.h>
#import <React/RCTLog.h>
#import <React/RCTModuleData.h>
#import <React/RCTPerformanceLogger.h>
#import <React/RCTProfile.h>
#import <React/RCTRedBox.h>
#import <React/RCTReloadCommand.h>
#import <React/RCTUtils.h>
#import <cxxreact/CxxNativeModule.h>
#import <cxxreact/Instance.h>
#import <cxxreact/JSBundleType.h>
#import <cxxreact/JSIndexedRAMBundle.h>
#import <cxxreact/ModuleRegistry.h>
#import <cxxreact/RAMBundleRegistry.h>
#import <cxxreact/ReactMarker.h>
#import <jsireact/JSIExecutor.h>
#import <reactperflogger/BridgeNativeModulePerfLogger.h>

#ifndef RCT_USE_HERMES
#if __has_include(<reacthermes/HermesExecutorFactory.h>)
#define RCT_USE_HERMES 1
#else
#define RCT_USE_HERMES 0
#endif
#endif

#if RCT_USE_HERMES
#import <reacthermes/HermesExecutorFactory.h>
#else
#import "JSCExecutorFactory.h"
#endif
#import "RCTJSIExecutorRuntimeInstaller.h"

#import "NSDataBigString.h"
#import "RCTMessageThread.h"
#import "RCTObjcExecutor.h"

#ifdef WITH_FBSYSTRACE
#import <React/RCTFBSystrace.h>
#endif

#if (RCT_DEV | RCT_ENABLE_LOADING_VIEW) && __has_include(<React/RCTDevLoadingViewProtocol.h>)
#import <React/RCTDevLoadingViewProtocol.h>
#endif

static NSString *const RCTJSThreadName = @"com.facebook.react.JavaScript";

typedef void (^RCTPendingCall)();

using namespace facebook::jsi;
using namespace facebook::react;

/**
 * Must be kept in sync with `MessageQueue.js`.
 */
typedef NS_ENUM(NSUInteger, RCTBridgeFields) {
  RCTBridgeFieldRequestModuleIDs = 0,
  RCTBridgeFieldMethodIDs,
  RCTBridgeFieldParams,
  RCTBridgeFieldCallID,
};

namespace {

int32_t getUniqueId()
{
  static std::atomic<int32_t> counter{0};
  return counter++;
}

class GetDescAdapter : public JSExecutorFactory {
 public:
  GetDescAdapter(RCTCxxBridge *bridge, std::shared_ptr<JSExecutorFactory> factory) : bridge_(bridge), factory_(factory)
  {
  }
  std::unique_ptr<JSExecutor> createJSExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue) override
  {
    auto ret = factory_->createJSExecutor(delegate, jsQueue);
    bridge_.bridgeDescription = @(ret->getDescription().c_str());
    return ret;
  }

 private:
  RCTCxxBridge *bridge_;
  std::shared_ptr<JSExecutorFactory> factory_;
};

}

static bool isRAMBundle(NSData *script)
{
  BundleHeader header;
  [script getBytes:&header length:sizeof(header)];
  return parseTypeFromHeader(header) == ScriptTag::RAMBundle;
}

static void notifyAboutModuleSetup(RCTPerformanceLogger *performanceLogger, const char *tag)
{
  NSString *moduleName = [[NSString alloc] initWithUTF8String:tag];
  if (moduleName) {
    int64_t setupTime = [performanceLogger durationForTag:RCTPLNativeModuleSetup];
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTDidSetupModuleNotification
                                                        object:nil
                                                      userInfo:@{
                                                        RCTDidSetupModuleNotificationModuleNameKey : moduleName,
                                                        RCTDidSetupModuleNotificationSetupTimeKey : @(setupTime)
                                                      }];
  }
}

static void mapReactMarkerToPerformanceLogger(
    const ReactMarker::ReactMarkerId markerId,
    RCTPerformanceLogger *performanceLogger,
    const char *tag,
    int instanceKey)
{
  switch (markerId) {
    case ReactMarker::RUN_JS_BUNDLE_START:
      [performanceLogger markStartForTag:RCTPLScriptExecution];
      break;
    case ReactMarker::RUN_JS_BUNDLE_STOP:
      [performanceLogger markStopForTag:RCTPLScriptExecution];
      break;
    case ReactMarker::NATIVE_REQUIRE_START:
      [performanceLogger appendStartForTag:RCTPLRAMNativeRequires];
      break;
    case ReactMarker::NATIVE_REQUIRE_STOP:
      [performanceLogger appendStopForTag:RCTPLRAMNativeRequires];
      [performanceLogger addValue:1 forTag:RCTPLRAMNativeRequiresCount];
      break;
    case ReactMarker::NATIVE_MODULE_SETUP_START:
      [performanceLogger markStartForTag:RCTPLNativeModuleSetup];
      break;
    case ReactMarker::NATIVE_MODULE_SETUP_STOP:
      [performanceLogger markStopForTag:RCTPLNativeModuleSetup];
      notifyAboutModuleSetup(performanceLogger, tag);
      break;
      // Not needed in bridge mode.
    case ReactMarker::REACT_INSTANCE_INIT_START:
    case ReactMarker::REACT_INSTANCE_INIT_STOP:
      // Not used on iOS.
    case ReactMarker::CREATE_REACT_CONTEXT_STOP:
    case ReactMarker::JS_BUNDLE_STRING_CONVERT_START:
    case ReactMarker::JS_BUNDLE_STRING_CONVERT_STOP:
    case ReactMarker::REGISTER_JS_SEGMENT_START:
    case ReactMarker::REGISTER_JS_SEGMENT_STOP:
      break;
  }
}

static void registerPerformanceLoggerHooks(RCTPerformanceLogger *performanceLogger)
{
  __weak RCTPerformanceLogger *weakPerformanceLogger = performanceLogger;
  ReactMarker::logTaggedMarker = [weakPerformanceLogger](const ReactMarker::ReactMarkerId markerId, const char *tag) {
    mapReactMarkerToPerformanceLogger(markerId, weakPerformanceLogger, tag, 0);
  };

  ReactMarker::logTaggedMarkerWithInstanceKey =
      [weakPerformanceLogger](const ReactMarker::ReactMarkerId markerId, const char *tag, const int instanceKey) {
        mapReactMarkerToPerformanceLogger(markerId, weakPerformanceLogger, tag, instanceKey);
      };
}

@interface RCTCxxBridge ()

@property (nonatomic, weak, readonly) RCTBridge *parentBridge;
@property (nonatomic, assign, readonly) BOOL moduleSetupComplete;

- (instancetype)initWithParentBridge:(RCTBridge *)bridge;
- (void)partialBatchDidFlush;
- (void)batchDidComplete;

@end

struct RCTInstanceCallback : public InstanceCallback {
  __weak RCTCxxBridge *bridge_;
  RCTInstanceCallback(RCTCxxBridge *bridge) : bridge_(bridge){};
  void onBatchComplete() override
  {
    // There's no interface to call this per partial batch
    [bridge_ partialBatchDidFlush];
    [bridge_ batchDidComplete];
  }
};

@implementation RCTCxxBridge {
  BOOL _didInvalidate;
  BOOL _moduleRegistryCreated;

  NSMutableArray<RCTPendingCall> *_pendingCalls;
  std::atomic<NSInteger> _pendingCount;

  // Native modules
  NSMutableDictionary<NSString *, RCTModuleData *> *_moduleDataByName;
  NSMutableArray<RCTModuleData *> *_moduleDataByID;
  NSMutableArray<Class> *_moduleClassesByID;
  NSUInteger _modulesInitializedOnMainQueue;
  RCTDisplayLink *_displayLink;

  // JS thread management
  NSThread *_jsThread;
  std::shared_ptr<RCTMessageThread> _jsMessageThread;
  std::mutex _moduleRegistryLock;

  // This is uniquely owned, but weak_ptr is used.
  std::shared_ptr<Instance> _reactInstance;

  // Necessary for searching in TurboModules in TurboModuleManager
  id<RCTTurboModuleRegistry> _turboModuleRegistry;

  RCTModuleRegistry *_objCModuleRegistry;
  RCTViewRegistry *_viewRegistry_DEPRECATED;
  RCTBundleManager *_bundleManager;
  RCTCallableJSModules *_callableJSModules;
}

@synthesize bridgeDescription = _bridgeDescription;
@synthesize loading = _loading;
@synthesize performanceLogger = _performanceLogger;
@synthesize valid = _valid;

- (RCTModuleRegistry *)moduleRegistry
{
  return _objCModuleRegistry;
}

- (void)setRCTTurboModuleRegistry:(id<RCTTurboModuleRegistry>)turboModuleRegistry
{
  _turboModuleRegistry = turboModuleRegistry;
  [_objCModuleRegistry setTurboModuleRegistry:_turboModuleRegistry];
}

- (void)attachBridgeAPIsToTurboModule:(id<RCTTurboModule>)module
{
  id<RCTBridgeModule> bridgeModule = (id<RCTBridgeModule>)module;
  /**
   * Attach the RCTViewRegistry to this TurboModule, which allows this TurboModule
   * To query a React component's UIView, given its reactTag.
   *
   * Usage: In the TurboModule @implementation, include:
   *   `@synthesize viewRegistry_DEPRECATED = _viewRegistry_DEPRECATED`
   */
  if ([bridgeModule respondsToSelector:@selector(setViewRegistry_DEPRECATED:)]) {
    bridgeModule.viewRegistry_DEPRECATED = _viewRegistry_DEPRECATED;
  }

  /**
   * Attach the RCTBundleManager to this TurboModule, which allows this TurboModule to
   * read from/write to the app's bundle URL.
   *
   * Usage: In the TurboModule @implementation, include:
   *   `@synthesize bundleManager = _bundleManager`
   */
  if ([bridgeModule respondsToSelector:@selector(setBundleManager:)]) {
    bridgeModule.bundleManager = _bundleManager;
  }

  /**
   * Attach the RCTCallableJSModules to this TurboModule, which allows this TurboModule
   * to call JS Module methods.
   *
   * Usage: In the TurboModule @implementation, include:
   *   `@synthesize callableJSModules = _callableJSModules`
   */

  if ([bridgeModule respondsToSelector:@selector(setCallableJSModules:)]) {
    bridgeModule.callableJSModules = _callableJSModules;
  }

  /**
   * Attach the RCTModuleRegistry to this TurboModule, which allows this TurboModule
   * to require other TurboModules/NativeModules.
   *
   * Usage: In the TurboModule @implementation, include:
   *   `@synthesize moduleRegistry = _moduleRegistry`
   */

  if ([bridgeModule respondsToSelector:@selector(setModuleRegistry:)]) {
    bridgeModule.moduleRegistry = _objCModuleRegistry;
  }
}

- (std::shared_ptr<MessageQueueThread>)jsMessageThread
{
  return _jsMessageThread;
}

- (BOOL)isInspectable
{
  return _reactInstance ? _reactInstance->isInspectable() : NO;
}

- (instancetype)initWithParentBridge:(RCTBridge *)bridge
{
  RCTAssertParam(bridge);

  if ((self = [super initWithDelegate:bridge.delegate
                            bundleURL:bridge.bundleURL
                       moduleProvider:bridge.moduleProvider
                        launchOptions:bridge.launchOptions])) {
    _parentBridge = bridge;
    _performanceLogger = [bridge performanceLogger];

    registerPerformanceLoggerHooks(_performanceLogger);

    /**
     * Set Initial State
     */
    _valid = YES;
    _loading = YES;
    _moduleRegistryCreated = NO;
    _pendingCalls = [NSMutableArray new];
    _displayLink = [RCTDisplayLink new];
    _moduleDataByName = [NSMutableDictionary new];
    _moduleClassesByID = [NSMutableArray new];
    _moduleDataByID = [NSMutableArray new];
    _objCModuleRegistry = [RCTModuleRegistry new];
    [_objCModuleRegistry setBridge:self];
    _bundleManager = [RCTBundleManager new];
    [_bundleManager setBridge:self];
    _viewRegistry_DEPRECATED = [RCTViewRegistry new];
    [_viewRegistry_DEPRECATED setBridge:self];
    _callableJSModules = [RCTCallableJSModules new];
    [_callableJSModules setBridge:self];

    [RCTBridge setCurrentBridge:self];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleMemoryWarning)
                                                 name:UIApplicationDidReceiveMemoryWarningNotification
                                               object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

+ (void)runRunLoop
{
  @autoreleasepool {
    RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"-[RCTCxxBridge runJSRunLoop] setup", nil);

    // copy thread name to pthread name
    pthread_setname_np([NSThread currentThread].name.UTF8String);

    // Set up a dummy runloop source to avoid spinning
    CFRunLoopSourceContext noSpinCtx = {0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL};
    CFRunLoopSourceRef noSpinSource = CFRunLoopSourceCreate(NULL, 0, &noSpinCtx);
    CFRunLoopAddSource(CFRunLoopGetCurrent(), noSpinSource, kCFRunLoopDefaultMode);
    CFRelease(noSpinSource);

    RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");

    // run the run loop
    while (kCFRunLoopRunStopped !=
           CFRunLoopRunInMode(
               kCFRunLoopDefaultMode, ((NSDate *)[NSDate distantFuture]).timeIntervalSinceReferenceDate, NO)) {
      RCTAssert(NO, @"not reached assertion"); // runloop spun. that's bad.
    }
  }
}

- (void)_tryAndHandleError:(dispatch_block_t)block
{
  NSError *error = tryAndReturnError(block);
  if (error) {
    [self handleError:error];
  }
}

- (void)handleMemoryWarning
{
  // We only want to run garbage collector when the loading is finished
  // and the instance is valid.
  if (!_valid || _loading) {
    return;
  }

  // We need to hold a local retaining pointer to react instance
  // in case if some other tread resets it.
  auto reactInstance = _reactInstance;
  if (reactInstance) {
    reactInstance->handleMemoryPressure(15 /* TRIM_MEMORY_RUNNING_CRITICAL */);
  }
}

/**
 * Ensure block is run on the JS thread. If we're already on the JS thread, the block will execute synchronously.
 * If we're not on the JS thread, the block is dispatched to that thread. Any errors encountered while executing
 * the block will go through handleError:
 */
- (void)ensureOnJavaScriptThread:(dispatch_block_t)block
{
  RCTAssert(_jsThread, @"This method must not be called before the JS thread is created");

  // This does not use _jsMessageThread because it may be called early before the runloop reference is captured
  // and _jsMessageThread is valid. _jsMessageThread also doesn't allow us to shortcut the dispatch if we're
  // already on the correct thread.

  if ([NSThread currentThread] == _jsThread) {
    [self _tryAndHandleError:block];
  } else {
    [self performSelector:@selector(_tryAndHandleError:) onThread:_jsThread withObject:block waitUntilDone:NO];
  }
}

- (void)start
{
  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"-[RCTCxxBridge start]", nil);

  [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptWillStartLoadingNotification
                                                      object:_parentBridge
                                                    userInfo:@{@"bridge" : self}];

  // Set up the JS thread early
  _jsThread = [[NSThread alloc] initWithTarget:[self class] selector:@selector(runRunLoop) object:nil];
  _jsThread.name = RCTJSThreadName;
  _jsThread.qualityOfService = NSOperationQualityOfServiceUserInteractive;
#if RCT_DEBUG
  _jsThread.stackSize *= 2;
#endif
  [_jsThread start];

  dispatch_group_t prepareBridge = dispatch_group_create();

  [_performanceLogger markStartForTag:RCTPLNativeModuleInit];

  [self registerExtraModules];
  // Initialize all native modules that cannot be loaded lazily
  (void)[self _initializeModules:RCTGetModuleClasses() withDispatchGroup:prepareBridge lazilyDiscovered:NO];
  [self registerExtraLazyModules];

  [_performanceLogger markStopForTag:RCTPLNativeModuleInit];

  // This doesn't really do anything.  The real work happens in initializeBridge.
  _reactInstance.reset(new Instance);

  __weak RCTCxxBridge *weakSelf = self;

  // Prepare executor factory (shared_ptr for copy into block)
  std::shared_ptr<JSExecutorFactory> executorFactory;
  if (!self.executorClass) {
    if ([self.delegate conformsToProtocol:@protocol(RCTCxxBridgeDelegate)]) {
      id<RCTCxxBridgeDelegate> cxxDelegate = (id<RCTCxxBridgeDelegate>)self.delegate;
      executorFactory = [cxxDelegate jsExecutorFactoryForBridge:self];
    }
    if (!executorFactory) {
      auto installBindings = RCTJSIExecutorRuntimeInstaller(nullptr);
#if RCT_USE_HERMES
      executorFactory = std::make_shared<HermesExecutorFactory>(installBindings);
#else
      executorFactory = std::make_shared<JSCExecutorFactory>(installBindings);
#endif
    }
  } else {
    id<RCTJavaScriptExecutor> objcExecutor = [self moduleForClass:self.executorClass];
    executorFactory.reset(new RCTObjcExecutorFactory(objcExecutor, ^(NSError *error) {
      if (error) {
        [weakSelf handleError:error];
      }
    }));
  }

  /**
   * id<RCTCxxBridgeDelegate> jsExecutorFactory may create and assign an id<RCTTurboModuleRegistry> object to
   * RCTCxxBridge If id<RCTTurboModuleRegistry> is assigned by this time, eagerly initialize all TurboModules
   */
  if (_turboModuleRegistry && RCTTurboModuleEagerInitEnabled()) {
    for (NSString *moduleName in [_turboModuleRegistry eagerInitModuleNames]) {
      [_turboModuleRegistry moduleForName:[moduleName UTF8String]];
    }

    for (NSString *moduleName in [_turboModuleRegistry eagerInitMainQueueModuleNames]) {
      if (RCTIsMainQueue()) {
        [_turboModuleRegistry moduleForName:[moduleName UTF8String]];
      } else {
        id<RCTTurboModuleRegistry> turboModuleRegistry = _turboModuleRegistry;
        dispatch_group_async(prepareBridge, dispatch_get_main_queue(), ^{
          [turboModuleRegistry moduleForName:[moduleName UTF8String]];
        });
      }
    }
  }

  // Dispatch the instance initialization as soon as the initial module metadata has
  // been collected (see initModules)
  dispatch_group_enter(prepareBridge);
  [self ensureOnJavaScriptThread:^{
    [weakSelf _initializeBridge:executorFactory];
    dispatch_group_leave(prepareBridge);
  }];

  // Load the source asynchronously, then store it for later execution.
  dispatch_group_enter(prepareBridge);
  __block NSData *sourceCode;

#if (RCT_DEV | RCT_ENABLE_LOADING_VIEW) && __has_include(<React/RCTDevLoadingViewProtocol.h>)
  {
    id<RCTDevLoadingViewProtocol> loadingView = [self moduleForName:@"DevLoadingView" lazilyLoadIfNecessary:YES];
    [loadingView showWithURL:self.bundleURL];
  }
#endif

  [self
      loadSource:^(NSError *error, RCTSource *source) {
        if (error) {
          [weakSelf handleError:error];
        }

        sourceCode = source.data;
        dispatch_group_leave(prepareBridge);
      }
      onProgress:^(RCTLoadingProgress *progressData) {
#if (RCT_DEV | RCT_ENABLE_LOADING_VIEW) && __has_include(<React/RCTDevLoadingViewProtocol.h>)
        id<RCTDevLoadingViewProtocol> loadingView = [weakSelf moduleForName:@"DevLoadingView"
                                                      lazilyLoadIfNecessary:YES];
        [loadingView updateProgress:progressData];
#endif
      }];

  // Wait for both the modules and source code to have finished loading
  dispatch_group_notify(prepareBridge, dispatch_get_global_queue(QOS_CLASS_USER_INTERACTIVE, 0), ^{
    RCTCxxBridge *strongSelf = weakSelf;
    if (sourceCode && strongSelf.loading) {
      [strongSelf executeSourceCode:sourceCode sync:NO];
    }
  });
  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
}

- (void)loadSource:(RCTSourceLoadBlock)_onSourceLoad onProgress:(RCTSourceLoadProgressBlock)onProgress
{
  NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
  [center postNotificationName:RCTBridgeWillDownloadScriptNotification object:_parentBridge];
  [_performanceLogger markStartForTag:RCTPLScriptDownload];
  NSUInteger cookie = RCTProfileBeginAsyncEvent(0, @"JavaScript download", nil);

  // Suppress a warning if RCTProfileBeginAsyncEvent gets compiled out
  (void)cookie;

  RCTPerformanceLogger *performanceLogger = _performanceLogger;
  RCTSourceLoadBlock onSourceLoad = ^(NSError *error, RCTSource *source) {
    RCTProfileEndAsyncEvent(0, @"native", cookie, @"JavaScript download", @"JS async");
    [performanceLogger markStopForTag:RCTPLScriptDownload];
    [performanceLogger setValue:source.length forTag:RCTPLBundleSize];

    NSDictionary *userInfo = @{
      RCTBridgeDidDownloadScriptNotificationSourceKey : source ?: [NSNull null],
      RCTBridgeDidDownloadScriptNotificationBridgeDescriptionKey : self->_bridgeDescription ?: [NSNull null],
    };

    [center postNotificationName:RCTBridgeDidDownloadScriptNotification object:self->_parentBridge userInfo:userInfo];

    _onSourceLoad(error, source);
  };

  if ([self.delegate respondsToSelector:@selector(loadSourceForBridge:onProgress:onComplete:)]) {
    [self.delegate loadSourceForBridge:_parentBridge onProgress:onProgress onComplete:onSourceLoad];
  } else if ([self.delegate respondsToSelector:@selector(loadSourceForBridge:withBlock:)]) {
    [self.delegate loadSourceForBridge:_parentBridge withBlock:onSourceLoad];
  } else if (!self.bundleURL) {
    NSError *error = RCTErrorWithMessage(
        @"No bundle URL present.\n\nMake sure you're running a packager "
         "server or have included a .jsbundle file in your application bundle.");
    onSourceLoad(error, nil);
  } else {
    __weak RCTCxxBridge *weakSelf = self;
    [RCTJavaScriptLoader loadBundleAtURL:self.bundleURL
                              onProgress:onProgress
                              onComplete:^(NSError *error, RCTSource *source) {
                                if (error) {
                                  [weakSelf handleError:error];
                                  return;
                                }
                                onSourceLoad(error, source);
                              }];
  }
}

- (NSArray<Class> *)moduleClasses
{
  if (RCT_DEBUG && _valid && _moduleClassesByID == nil) {
    RCTLogError(
        @"Bridge modules have not yet been initialized. You may be "
         "trying to access a module too early in the startup procedure.");
  }
  return _moduleClassesByID;
}

/**
 * Used by RCTUIManager
 */
- (RCTModuleData *)moduleDataForName:(NSString *)moduleName
{
  return _moduleDataByName[moduleName];
}

- (id)moduleForName:(NSString *)moduleName
{
  return [self moduleForName:moduleName lazilyLoadIfNecessary:NO];
}

- (id)moduleForName:(NSString *)moduleName lazilyLoadIfNecessary:(BOOL)lazilyLoad
{
  if (RCTTurboModuleEnabled() && _turboModuleRegistry) {
    const char *moduleNameCStr = [moduleName UTF8String];
    if (lazilyLoad || [_turboModuleRegistry moduleIsInitialized:moduleNameCStr]) {
      id<RCTTurboModule> module = [_turboModuleRegistry moduleForName:moduleNameCStr warnOnLookupFailure:NO];
      if (module != nil) {
        return module;
      }
    }
  }

  if (!lazilyLoad) {
    return _moduleDataByName[moduleName].instance;
  }

  RCTModuleData *moduleData = _moduleDataByName[moduleName];
  if (moduleData) {
    if (![moduleData isKindOfClass:[RCTModuleData class]]) {
      // There is rare race condition where the data stored in the dictionary
      // may have been deallocated, which means the module instance is no longer
      // usable.
      return nil;
    }
    return moduleData.instance;
  }

  // Module may not be loaded yet, so attempt to force load it here.
  // Do this only if the bridge is still valid.
  if (_didInvalidate) {
    return nil;
  }

  const BOOL result = [self.delegate respondsToSelector:@selector(bridge:didNotFindModule:)] &&
      [self.delegate bridge:self didNotFindModule:moduleName];
  if (result) {
    // Try again.
    moduleData = _moduleDataByName[moduleName];
#if RCT_DEV
    // If the `_moduleDataByName` is nil, it must have been cleared by the reload.
  } else if (_moduleDataByName != nil) {
    RCTLogError(@"Unable to find module for %@", moduleName);
  }
#else
  } else {
    RCTLogError(@"Unable to find module for %@", moduleName);
  }
#endif

  return moduleData.instance;
}

- (BOOL)moduleIsInitialized:(Class)moduleClass
{
  NSString *moduleName = RCTBridgeModuleNameForClass(moduleClass);
  if (_moduleDataByName[moduleName].hasInstance) {
    return YES;
  }

  if (_turboModuleRegistry) {
    return [_turboModuleRegistry moduleIsInitialized:[moduleName UTF8String]];
  }

  return NO;
}

- (id)moduleForClass:(Class)moduleClass
{
  return [self moduleForName:RCTBridgeModuleNameForClass(moduleClass) lazilyLoadIfNecessary:YES];
}

- (std::shared_ptr<ModuleRegistry>)_buildModuleRegistryUnlocked
{
  if (!self.valid) {
    return {};
  }

  [_performanceLogger markStartForTag:RCTPLNativeModulePrepareConfig];
  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"-[RCTCxxBridge buildModuleRegistry]", nil);

  __weak __typeof(self) weakSelf = self;
  ModuleRegistry::ModuleNotFoundCallback moduleNotFoundCallback = ^bool(const std::string &name) {
    __strong __typeof(weakSelf) strongSelf = weakSelf;
    return [strongSelf.delegate respondsToSelector:@selector(bridge:didNotFindModule:)] &&
        [strongSelf.delegate bridge:strongSelf didNotFindModule:@(name.c_str())];
  };

  auto registry = std::make_shared<ModuleRegistry>(
      createNativeModules(_moduleDataByID, self, _reactInstance), moduleNotFoundCallback);

  [_performanceLogger markStopForTag:RCTPLNativeModulePrepareConfig];
  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");

  return registry;
}

- (void)_initializeBridge:(std::shared_ptr<JSExecutorFactory>)executorFactory
{
  if (!self.valid) {
    return;
  }

  __weak RCTCxxBridge *weakSelf = self;
  _jsMessageThread = std::make_shared<RCTMessageThread>([NSRunLoop currentRunLoop], ^(NSError *error) {
    if (error) {
      [weakSelf handleError:error];
    }
  });

  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"-[RCTCxxBridge initializeBridge:]", nil);
  // This can only be false if the bridge was invalidated before startup completed
  if (_reactInstance) {
#if RCT_DEV
    executorFactory = std::make_shared<GetDescAdapter>(self, executorFactory);
#endif

    [self _initializeBridgeLocked:executorFactory];

#if RCT_PROFILE
    if (RCTProfileIsProfiling()) {
      _reactInstance->setGlobalVariable("__RCTProfileIsProfiling", std::make_unique<JSBigStdString>("true"));
    }
#endif
  }

  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
}

- (void)_initializeBridgeLocked:(std::shared_ptr<JSExecutorFactory>)executorFactory
{
  std::lock_guard<std::mutex> guard(_moduleRegistryLock);

  // This is async, but any calls into JS are blocked by the m_syncReady CV in Instance
  _reactInstance->initializeBridge(
      std::make_unique<RCTInstanceCallback>(self),
      executorFactory,
      _jsMessageThread,
      [self _buildModuleRegistryUnlocked]);
  _moduleRegistryCreated = YES;
}

- (void)updateModuleWithInstance:(id<RCTBridgeModule>)instance
{
  NSString *const moduleName = RCTBridgeModuleNameForClass([instance class]);
  if (moduleName) {
    RCTModuleData *const moduleData = _moduleDataByName[moduleName];
    if (moduleData) {
      moduleData.instance = instance;
    }
  }
}

- (NSArray<RCTModuleData *> *)registerModulesForClasses:(NSArray<Class> *)moduleClasses
{
  return [self _registerModulesForClasses:moduleClasses lazilyDiscovered:NO];
}

- (NSArray<RCTModuleData *> *)_registerModulesForClasses:(NSArray<Class> *)moduleClasses
                                        lazilyDiscovered:(BOOL)lazilyDiscovered
{
  RCT_PROFILE_BEGIN_EVENT(
      RCTProfileTagAlways, @"-[RCTCxxBridge initModulesWithDispatchGroup:] autoexported moduleData", nil);

  NSArray *moduleClassesCopy = [moduleClasses copy];
  NSMutableArray<RCTModuleData *> *moduleDataByID = [NSMutableArray arrayWithCapacity:moduleClassesCopy.count];
  for (Class moduleClass in moduleClassesCopy) {
    if (RCTTurboModuleEnabled() && [moduleClass conformsToProtocol:@protocol(RCTTurboModule)]) {
      continue;
    }
    NSString *moduleName = RCTBridgeModuleNameForClass(moduleClass);

    // Check for module name collisions
    RCTModuleData *moduleData = _moduleDataByName[moduleName];
    if (moduleData) {
      if (moduleData.hasInstance || lazilyDiscovered) {
        // Existing module was preregistered, so it takes precedence
        continue;
      } else if ([moduleClass new] == nil) {
        // The new module returned nil from init, so use the old module
        continue;
      } else if ([moduleData.moduleClass new] != nil) {
        // Both modules were non-nil, so it's unclear which should take precedence
        RCTLogWarn(
            @"Attempted to register RCTBridgeModule class %@ for the "
             "name '%@', but name was already registered by class %@",
            moduleClass,
            moduleName,
            moduleData.moduleClass);
      }
    }

    // Instantiate moduleData
    // TODO #13258411: can we defer this until config generation?
    int32_t moduleDataId = getUniqueId();
    BridgeNativeModulePerfLogger::moduleDataCreateStart([moduleName UTF8String], moduleDataId);
    moduleData = [[RCTModuleData alloc] initWithModuleClass:moduleClass
                                                     bridge:self
                                             moduleRegistry:_objCModuleRegistry
                                    viewRegistry_DEPRECATED:_viewRegistry_DEPRECATED
                                              bundleManager:_bundleManager
                                          callableJSModules:_callableJSModules];
    BridgeNativeModulePerfLogger::moduleDataCreateEnd([moduleName UTF8String], moduleDataId);

    _moduleDataByName[moduleName] = moduleData;
    [_moduleClassesByID addObject:moduleClass];
    [moduleDataByID addObject:moduleData];
  }
  [_moduleDataByID addObjectsFromArray:moduleDataByID];

  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");

  return moduleDataByID;
}

- (void)registerExtraModules
{
  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"-[RCTCxxBridge initModulesWithDispatchGroup:] extraModules", nil);

  NSArray<id<RCTBridgeModule>> *appExtraModules = nil;
  if ([self.delegate respondsToSelector:@selector(extraModulesForBridge:)]) {
    appExtraModules = [self.delegate extraModulesForBridge:_parentBridge];
  } else if (self.moduleProvider) {
    appExtraModules = self.moduleProvider();
  }

  NSMutableArray<id<RCTBridgeModule>> *extraModules = [NSMutableArray new];

  // Prevent TurboModules from appearing the the NativeModule system
  for (id<RCTBridgeModule> module in appExtraModules) {
    if (!(RCTTurboModuleEnabled() && [module conformsToProtocol:@protocol(RCTTurboModule)])) {
      [extraModules addObject:module];
    }
  }

  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");

  RCT_PROFILE_BEGIN_EVENT(
      RCTProfileTagAlways, @"-[RCTCxxBridge initModulesWithDispatchGroup:] preinitialized moduleData", nil);
  // Set up moduleData for pre-initialized module instances
  for (id<RCTBridgeModule> module in extraModules) {
    Class moduleClass = [module class];
    NSString *moduleName = RCTBridgeModuleNameForClass(moduleClass);

    if (RCT_DEBUG) {
      // Check for name collisions between preregistered modules
      RCTModuleData *moduleData = _moduleDataByName[moduleName];
      if (moduleData) {
        RCTLogError(
            @"Attempted to register RCTBridgeModule class %@ for the "
             "name '%@', but name was already registered by class %@",
            moduleClass,
            moduleName,
            moduleData.moduleClass);
        continue;
      }
    }

    if (RCTTurboModuleEnabled() && [module conformsToProtocol:@protocol(RCTTurboModule)]) {
#if RCT_DEBUG
      // TODO: don't ask for extra module for when TurboModule is enabled.
      RCTLogError(
          @"NativeModule '%@' was marked as TurboModule, but provided as an extra NativeModule "
           "by the class '%@', ignoring.",
          moduleName,
          moduleClass);
#endif
      continue;
    }

    // Instantiate moduleData container
    int32_t moduleDataId = getUniqueId();
    BridgeNativeModulePerfLogger::moduleDataCreateStart([moduleName UTF8String], moduleDataId);
    RCTModuleData *moduleData = [[RCTModuleData alloc] initWithModuleInstance:module
                                                                       bridge:self
                                                               moduleRegistry:_objCModuleRegistry
                                                      viewRegistry_DEPRECATED:_viewRegistry_DEPRECATED
                                                                bundleManager:_bundleManager
                                                            callableJSModules:_callableJSModules];
    BridgeNativeModulePerfLogger::moduleDataCreateEnd([moduleName UTF8String], moduleDataId);

    _moduleDataByName[moduleName] = moduleData;
    [_moduleClassesByID addObject:moduleClass];
    [_moduleDataByID addObject:moduleData];
  }
  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
}

- (void)registerExtraLazyModules
{
#if RCT_DEBUG
  // This is debug-only and only when Chrome is attached, since it expects all modules to be already
  // available on start up. Otherwise, we can let the lazy module discovery to load them on demand.
  Class executorClass = [_parentBridge executorClass];
  if (executorClass && [NSStringFromClass(executorClass) isEqualToString:@"RCTWebSocketExecutor"]) {
    NSDictionary<NSString *, Class> *moduleClasses = nil;
    if ([self.delegate respondsToSelector:@selector(extraLazyModuleClassesForBridge:)]) {
      moduleClasses = [self.delegate extraLazyModuleClassesForBridge:_parentBridge];
    }

    if (!moduleClasses) {
      return;
    }

    // This logic is mostly copied from `registerModulesForClasses:`, but with one difference:
    // we must use the names provided by the delegate method here.
    for (NSString *moduleName in moduleClasses) {
      Class moduleClass = moduleClasses[moduleName];
      if (RCTTurboModuleEnabled() && [moduleClass conformsToProtocol:@protocol(RCTTurboModule)]) {
        continue;
      }

      // Check for module name collisions
      RCTModuleData *moduleData = _moduleDataByName[moduleName];
      if (moduleData) {
        if (moduleData.hasInstance) {
          // Existing module was preregistered, so it takes precedence
          continue;
        } else if ([moduleClass new] == nil) {
          // The new module returned nil from init, so use the old module
          continue;
        } else if ([moduleData.moduleClass new] != nil) {
          // Use existing module since it was already loaded but not yet instantiated.
          continue;
        }
      }

      int32_t moduleDataId = getUniqueId();
      BridgeNativeModulePerfLogger::moduleDataCreateStart([moduleName UTF8String], moduleDataId);
      moduleData = [[RCTModuleData alloc] initWithModuleClass:moduleClass
                                                       bridge:self
                                               moduleRegistry:_objCModuleRegistry
                                      viewRegistry_DEPRECATED:_viewRegistry_DEPRECATED
                                                bundleManager:_bundleManager
                                            callableJSModules:_callableJSModules];
      BridgeNativeModulePerfLogger::moduleDataCreateEnd([moduleName UTF8String], moduleDataId);

      _moduleDataByName[moduleName] = moduleData;
      [_moduleClassesByID addObject:moduleClass];
      [_moduleDataByID addObject:moduleData];
    }
  }
#endif
}

- (NSArray<RCTModuleData *> *)_initializeModules:(NSArray<Class> *)modules
                               withDispatchGroup:(dispatch_group_t)dispatchGroup
                                lazilyDiscovered:(BOOL)lazilyDiscovered
{
  // Set up moduleData for automatically-exported modules
  NSArray<RCTModuleData *> *moduleDataById = [self _registerModulesForClasses:modules
                                                             lazilyDiscovered:lazilyDiscovered];

  if (lazilyDiscovered) {
#if RCT_DEBUG
    // Lazily discovered modules do not require instantiation here,
    // as they are not allowed to have pre-instantiated instance
    // and must not require the main queue.
    for (RCTModuleData *moduleData in moduleDataById) {
      RCTAssert(
          !(moduleData.requiresMainQueueSetup || moduleData.hasInstance),
          @"Module \'%@\' requires initialization on the Main Queue or has pre-instantiated, which is not supported for the lazily discovered modules.",
          moduleData.name);
    }
#endif
  } else {
    RCT_PROFILE_BEGIN_EVENT(
        RCTProfileTagAlways, @"-[RCTCxxBridge initModulesWithDispatchGroup:] moduleData.hasInstance", nil);
    // Dispatch module init onto main thread for those modules that require it
    // For non-lazily discovered modules we run through the entire set of modules
    // that we have, otherwise some modules coming from the delegate
    // or module provider block, will not be properly instantiated.
    for (RCTModuleData *moduleData in _moduleDataByID) {
      if (moduleData.hasInstance && (!moduleData.requiresMainQueueSetup || RCTIsMainQueue())) {
        // Modules that were pre-initialized should ideally be set up before
        // bridge init has finished, otherwise the caller may try to access the
        // module directly rather than via `[bridge moduleForClass:]`, which won't
        // trigger the lazy initialization process. If the module cannot safely be
        // set up on the current thread, it will instead be async dispatched
        // to the main thread to be set up in _prepareModulesWithDispatchGroup:.
        (void)[moduleData instance];
      }
    }
    RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");

    // From this point on, RCTDidInitializeModuleNotification notifications will
    // be sent the first time a module is accessed.
    _moduleSetupComplete = YES;
    [self _prepareModulesWithDispatchGroup:dispatchGroup];
  }

#if RCT_PROFILE
  if (RCTProfileIsProfiling()) {
    // Depends on moduleDataByID being loaded
    RCTProfileHookModules(self);
  }
#endif
  return moduleDataById;
}

- (void)registerAdditionalModuleClasses:(NSArray<Class> *)modules
{
  std::lock_guard<std::mutex> guard(_moduleRegistryLock);
  if (_moduleRegistryCreated) {
    NSArray<RCTModuleData *> *newModules = [self _initializeModules:modules
                                                  withDispatchGroup:NULL
                                                   lazilyDiscovered:YES];
    assert(_reactInstance); // at this point you must have reactInstance as you already called
                            // reactInstance->initialzeBridge
    _reactInstance->getModuleRegistry().registerModules(createNativeModules(newModules, self, _reactInstance));
  } else {
    [self registerModulesForClasses:modules];
  }
}

- (void)_prepareModulesWithDispatchGroup:(dispatch_group_t)dispatchGroup
{
  RCT_PROFILE_BEGIN_EVENT(0, @"-[RCTCxxBridge _prepareModulesWithDispatchGroup]", nil);

  BOOL initializeImmediately = NO;
  if (dispatchGroup == NULL) {
    // If no dispatchGroup is passed in, we must prepare everything immediately.
    // We better be on the right thread too.
    RCTAssertMainQueue();
    initializeImmediately = YES;
  }

  // Set up modules that require main thread init or constants export
  [_performanceLogger setValue:0 forTag:RCTPLNativeModuleMainThread];

  for (RCTModuleData *moduleData in _moduleDataByID) {
    if (moduleData.requiresMainQueueSetup) {
      // Modules that need to be set up on the main thread cannot be initialized
      // lazily when required without doing a dispatch_sync to the main thread,
      // which can result in deadlock. To avoid this, we initialize all of these
      // modules on the main thread in parallel with loading the JS code, so
      // they will already be available before they are ever required.
      dispatch_block_t block = ^{
        if (self.valid && ![moduleData.moduleClass isSubclassOfClass:[RCTCxxModule class]]) {
          [self->_performanceLogger appendStartForTag:RCTPLNativeModuleMainThread];
          (void)[moduleData instance];
          if (!RCTIsMainQueueExecutionOfConstantsToExportDisabled()) {
            [moduleData gatherConstants];
          }
          [self->_performanceLogger appendStopForTag:RCTPLNativeModuleMainThread];
        }
      };

      if (initializeImmediately && RCTIsMainQueue()) {
        block();
      } else {
        // We've already checked that dispatchGroup is non-null, but this satisfies the
        // Xcode analyzer
        if (dispatchGroup) {
          dispatch_group_async(dispatchGroup, dispatch_get_main_queue(), block);
        }
      }
      _modulesInitializedOnMainQueue++;
    }
  }
  [_performanceLogger setValue:_modulesInitializedOnMainQueue forTag:RCTPLNativeModuleMainThreadUsesCount];
  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
}

- (void)registerModuleForFrameUpdates:(id<RCTBridgeModule>)module withModuleData:(RCTModuleData *)moduleData
{
  [_displayLink registerModuleForFrameUpdates:module withModuleData:moduleData];
}

- (void)executeSourceCode:(NSData *)sourceCode sync:(BOOL)sync
{
  // This will get called from whatever thread was actually executing JS.
  dispatch_block_t completion = ^{
    // Log start up metrics early before processing any other js calls
    [self logStartupFinish];
    // Flush pending calls immediately so we preserve ordering
    [self _flushPendingCalls];

    // Perform the state update and notification on the main thread, so we can't run into
    // timing issues with RCTRootView
    dispatch_async(dispatch_get_main_queue(), ^{
      [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptDidLoadNotification
                                                          object:self->_parentBridge
                                                        userInfo:@{@"bridge" : self}];

      // Starting the display link is not critical to startup, so do it last
      [self ensureOnJavaScriptThread:^{
        // Register the display link to start sending js calls after everything is setup
        [self->_displayLink addToRunLoop:[NSRunLoop currentRunLoop]];
      }];
    });
  };

  if (sync) {
    [self executeApplicationScriptSync:sourceCode url:self.bundleURL];
    completion();
  } else {
    [self enqueueApplicationScript:sourceCode url:self.bundleURL onComplete:completion];
  }

  [self.devSettings setupHMRClientWithBundleURL:self.bundleURL];
}

#if RCT_DEV_MENU | RCT_PACKAGER_LOADING_FUNCTIONALITY
- (void)loadAndExecuteSplitBundleURL:(NSURL *)bundleURL
                             onError:(RCTLoadAndExecuteErrorBlock)onError
                          onComplete:(dispatch_block_t)onComplete
{
  __weak __typeof(self) weakSelf = self;
  [RCTJavaScriptLoader loadBundleAtURL:bundleURL
      onProgress:^(RCTLoadingProgress *progressData) {
#if (RCT_DEV_MENU | RCT_ENABLE_LOADING_VIEW) && __has_include(<React/RCTDevLoadingViewProtocol.h>)
        id<RCTDevLoadingViewProtocol> loadingView = [weakSelf moduleForName:@"DevLoadingView"
                                                      lazilyLoadIfNecessary:YES];
        [loadingView updateProgress:progressData];
#endif
      }
      onComplete:^(NSError *error, RCTSource *source) {
        if (error) {
          onError(error);
          return;
        }

        [self enqueueApplicationScript:source.data
                                   url:source.url
                            onComplete:^{
                              [self.devSettings setupHMRClientWithAdditionalBundleURL:source.url];
                              onComplete();
                            }];
      }];
}
#else
- (void)loadAndExecuteSplitBundleURL:(NSURL *)bundleURL
                             onError:(RCTLoadAndExecuteErrorBlock)onError
                          onComplete:(dispatch_block_t)onComplete
{
}
#endif

- (void)handleError:(NSError *)error
{
  // This is generally called when the infrastructure throws an
  // exception while calling JS.  Most product exceptions will not go
  // through this method, but through RCTExceptionManager.

  // There are three possible states:
  // 1. initializing == _valid && _loading
  // 2. initializing/loading finished (success or failure) == _valid && !_loading
  // 3. invalidated == !_valid && !_loading

  // !_valid && _loading can't happen.

  // In state 1: on main queue, move to state 2, reset the bridge, and RCTFatal.
  // In state 2: go directly to RCTFatal.  Do not enqueue, do not collect $200.
  // In state 3: do nothing.

  if (self->_valid && !self->_loading) {
    if ([error userInfo][RCTJSRawStackTraceKey]) {
      [self.redBox showErrorMessage:[error localizedDescription] withRawStack:[error userInfo][RCTJSRawStackTraceKey]];
    }

    RCTFatal(error);

    // RN will stop, but let the rest of the app keep going.
    return;
  }

  if (!_valid || !_loading) {
    return;
  }

  // Hack: once the bridge is invalidated below, it won't initialize any new native
  // modules. Initialize the redbox module now so we can still report this error.
  RCTRedBox *redBox = [self redBox];

  _loading = NO;
  _valid = NO;
  _moduleRegistryCreated = NO;

  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_jsMessageThread) {
      // Make sure initializeBridge completed
      self->_jsMessageThread->runOnQueueSync([] {});
    }

    self->_reactInstance.reset();
    self->_jsMessageThread.reset();

    [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptDidFailToLoadNotification
                                                        object:self->_parentBridge
                                                      userInfo:@{@"bridge" : self, @"error" : error}];

    if ([error userInfo][RCTJSRawStackTraceKey]) {
      [redBox showErrorMessage:[error localizedDescription] withRawStack:[error userInfo][RCTJSRawStackTraceKey]];
    }

    RCTFatal(error);
  });
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithDelegate
                    : (__unused id<RCTBridgeDelegate>)delegate bundleURL
                    : (__unused NSURL *)bundleURL moduleProvider
                    : (__unused RCTBridgeModuleListProvider)block launchOptions
                    : (__unused NSDictionary *)launchOptions)

RCT_NOT_IMPLEMENTED(-(instancetype)initWithBundleURL
                    : (__unused NSURL *)bundleURL moduleProvider
                    : (__unused RCTBridgeModuleListProvider)block launchOptions
                    : (__unused NSDictionary *)launchOptions)

/**
 * Prevent super from calling setUp (that'd create another batchedBridge)
 */
- (void)setUp
{
}

- (Class)executorClass
{
  return _parentBridge.executorClass;
}

- (void)setExecutorClass:(Class)executorClass
{
  RCTAssertMainQueue();

  _parentBridge.executorClass = executorClass;
}

- (NSURL *)bundleURL
{
  return _parentBridge.bundleURL;
}

- (void)setBundleURL:(NSURL *)bundleURL
{
  _parentBridge.bundleURL = bundleURL;
}

- (id<RCTBridgeDelegate>)delegate
{
  return _parentBridge.delegate;
}

- (void)dispatchBlock:(dispatch_block_t)block queue:(dispatch_queue_t)queue
{
  if (queue == RCTJSThread) {
    [self ensureOnJavaScriptThread:block];
  } else if (queue) {
    dispatch_async(queue, block);
  }
}

#pragma mark - RCTInvalidating

- (void)invalidate
{
  if (_didInvalidate) {
    return;
  }

  RCTAssertMainQueue();
  RCTLogInfo(@"Invalidating %@ (parent: %@, executor: %@)", self, _parentBridge, [self executorClass]);

  _loading = NO;
  _valid = NO;
  _didInvalidate = YES;
  _moduleRegistryCreated = NO;

  if ([RCTBridge currentBridge] == self) {
    [RCTBridge setCurrentBridge:nil];
  }

  // Stop JS instance and message thread
  [self ensureOnJavaScriptThread:^{
    [self->_displayLink invalidate];
    self->_displayLink = nil;

    if (RCTProfileIsProfiling()) {
      RCTProfileUnhookModules(self);
    }

    // Invalidate modules

    [[NSNotificationCenter defaultCenter] postNotificationName:RCTBridgeWillInvalidateModulesNotification
                                                        object:self->_parentBridge
                                                      userInfo:@{@"bridge" : self}];

    // We're on the JS thread (which we'll be suspending soon), so no new calls will be made to native modules after
    // this completes. We must ensure all previous calls were dispatched before deallocating the instance (and module
    // wrappers) or we may have invalid pointers still in flight.
    dispatch_group_t moduleInvalidation = dispatch_group_create();
    for (RCTModuleData *moduleData in self->_moduleDataByID) {
      // Be careful when grabbing an instance here, we don't want to instantiate
      // any modules just to invalidate them.
      if (![moduleData hasInstance]) {
        continue;
      }

      if ([moduleData.instance respondsToSelector:@selector(invalidate)]) {
        dispatch_group_enter(moduleInvalidation);
        [self
            dispatchBlock:^{
              [(id<RCTInvalidating>)moduleData.instance invalidate];
              dispatch_group_leave(moduleInvalidation);
            }
                    queue:moduleData.methodQueue];
      }
      [moduleData invalidate];
    }

    if (dispatch_group_wait(moduleInvalidation, dispatch_time(DISPATCH_TIME_NOW, 10 * NSEC_PER_SEC))) {
      RCTLogError(@"Timed out waiting for modules to be invalidated");
    }

    [[NSNotificationCenter defaultCenter] postNotificationName:RCTBridgeDidInvalidateModulesNotification
                                                        object:self->_parentBridge
                                                      userInfo:@{@"bridge" : self}];

    self->_reactInstance.reset();
    self->_jsMessageThread.reset();

    self->_moduleDataByName = nil;
    self->_moduleDataByID = nil;
    self->_moduleClassesByID = nil;
    self->_pendingCalls = nil;

    [self->_jsThread cancel];
    self->_jsThread = nil;
    CFRunLoopStop(CFRunLoopGetCurrent());
  }];
}

- (void)logMessage:(NSString *)message level:(NSString *)level
{
  if (RCT_DEBUG && _valid) {
    [self enqueueJSCall:@"RCTLog" method:@"logIfNoNativeHook" args:@[ level, message ] completion:NULL];
  }
}

#pragma mark - RCTBridge methods

- (void)_runAfterLoad:(RCTPendingCall)block
{
  // Ordering here is tricky.  Ideally, the C++ bridge would provide
  // functionality to defer calls until after the app is loaded.  Until that
  // happens, we do this.  _pendingCount keeps a count of blocks which have
  // been deferred.  It is incremented using an atomic barrier call before each
  // block is added to the js queue, and decremented using an atomic barrier
  // call after the block is executed.  If _pendingCount is zero, there is no
  // work either in the js queue, or in _pendingCalls, so it is safe to add new
  // work to the JS queue directly.

  if (self.loading || _pendingCount > 0) {
    // From the callers' perspective:

    // Phase 1: jsQueueBlocks are added to the queue; _pendingCount is
    // incremented for each.  If the first block is created after self.loading is
    // true, phase 1 will be nothing.
    _pendingCount++;
    dispatch_block_t jsQueueBlock = ^{
      // From the perspective of the JS queue:
      if (self.loading) {
        // Phase A: jsQueueBlocks are executed.  self.loading is true, so they
        // are added to _pendingCalls.
        [self->_pendingCalls addObject:block];
      } else {
        // Phase C: More jsQueueBlocks are executed.  self.loading is false, so
        // each block is executed, adding work to the queue, and _pendingCount is
        // decremented.
        block();
        self->_pendingCount--;
      }
    };
    [self ensureOnJavaScriptThread:jsQueueBlock];
  } else {
    // Phase 2/Phase D: blocks are executed directly, adding work to the JS queue.
    block();
  }
}

- (void)logStartupFinish
{
  // Log metrics about native requires during the bridge startup.
  uint64_t nativeRequiresCount = [_performanceLogger valueForTag:RCTPLRAMNativeRequiresCount];
  [_performanceLogger setValue:nativeRequiresCount forTag:RCTPLRAMStartupNativeRequiresCount];
  uint64_t nativeRequires = [_performanceLogger valueForTag:RCTPLRAMNativeRequires];
  [_performanceLogger setValue:nativeRequires forTag:RCTPLRAMStartupNativeRequires];

  [_performanceLogger markStopForTag:RCTPLBridgeStartup];
}

- (void)_flushPendingCalls
{
  RCT_PROFILE_BEGIN_EVENT(0, @"Processing pendingCalls", @{@"count" : [@(_pendingCalls.count) stringValue]});
  // Phase B: _flushPendingCalls happens.  Each block in _pendingCalls is
  // executed, adding work to the queue, and _pendingCount is decremented.
  // loading is set to NO.
  NSArray<RCTPendingCall> *pendingCalls = _pendingCalls;
  _pendingCalls = nil;
  for (RCTPendingCall call in pendingCalls) {
    call();
    _pendingCount--;
  }
  _loading = NO;
  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
}

/**
 * Public. Can be invoked from any thread.
 */
- (void)enqueueJSCall:(NSString *)module
               method:(NSString *)method
                 args:(NSArray *)args
           completion:(dispatch_block_t)completion
{
  if (!self.valid) {
    return;
  }

  /**
   * AnyThread
   */
  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"-[RCTCxxBridge enqueueJSCall:]", nil);

  RCTProfileBeginFlowEvent();
  __weak __typeof(self) weakSelf = self;
  [self _runAfterLoad:^() {
    RCTProfileEndFlowEvent();
    __strong __typeof(weakSelf) strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }

    if (strongSelf->_reactInstance) {
      strongSelf->_reactInstance->callJSFunction(
          [module UTF8String], [method UTF8String], convertIdToFollyDynamic(args ?: @[]));

      // ensureOnJavaScriptThread may execute immediately, so use jsMessageThread, to make sure
      // the block is invoked after callJSFunction
      if (completion) {
        if (strongSelf->_jsMessageThread) {
          strongSelf->_jsMessageThread->runOnQueue(completion);
        } else {
          RCTLogWarn(@"Can't invoke completion without messageThread");
        }
      }
    }
  }];

  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
}

/**
 * Called by RCTModuleMethod from any thread.
 */
- (void)enqueueCallback:(NSNumber *)cbID args:(NSArray *)args
{
  if (!self.valid) {
    return;
  }

  /**
   * AnyThread
   */

  RCTProfileBeginFlowEvent();
  __weak __typeof(self) weakSelf = self;
  [self _runAfterLoad:^() {
    RCTProfileEndFlowEvent();
    __strong __typeof(weakSelf) strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }

    if (strongSelf->_reactInstance) {
      strongSelf->_reactInstance->callJSCallback([cbID unsignedLongLongValue], convertIdToFollyDynamic(args ?: @[]));
    }
  }];
}

/**
 * Private hack to support `setTimeout(fn, 0)`
 */
- (void)_immediatelyCallTimer:(NSNumber *)timer
{
  if (_reactInstance) {
    _reactInstance->callJSFunction(
        "JSTimers", "callTimers", folly::dynamic::array(folly::dynamic::array([timer doubleValue])));
  }
}

- (void)enqueueApplicationScript:(NSData *)script url:(NSURL *)url onComplete:(dispatch_block_t)onComplete
{
  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"-[RCTCxxBridge enqueueApplicationScript]", nil);

  [self executeApplicationScript:script url:url async:YES];

  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");

  // Assumes that onComplete can be called when the next block on the JS thread is scheduled
  if (onComplete) {
    RCTAssert(_jsMessageThread != nullptr, @"Cannot invoke completion without jsMessageThread");
    _jsMessageThread->runOnQueue(onComplete);
  }
}

- (void)executeApplicationScriptSync:(NSData *)script url:(NSURL *)url
{
  [self executeApplicationScript:script url:url async:NO];
}

- (void)executeApplicationScript:(NSData *)script url:(NSURL *)url async:(BOOL)async
{
  [self _tryAndHandleError:^{
    NSString *sourceUrlStr = deriveSourceURL(url);
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptWillStartExecutingNotification
                                                        object:self->_parentBridge
                                                      userInfo:@{@"bridge" : self}];

    // hold a local reference to reactInstance in case a parallel thread
    // resets it between null check and usage
    auto reactInstance = self->_reactInstance;
    if (reactInstance && RCTIsBytecodeBundle(script)) {
      UInt32 offset = 8;
      while (offset < script.length) {
        UInt32 fileLength = RCTReadUInt32LE(script, offset);
        NSData *unit = [script subdataWithRange:NSMakeRange(offset + 4, fileLength)];
        reactInstance->loadScriptFromString(std::make_unique<NSDataBigString>(unit), sourceUrlStr.UTF8String, false);
        offset += ((fileLength + RCT_BYTECODE_ALIGNMENT - 1) & ~(RCT_BYTECODE_ALIGNMENT - 1)) + 4;
      }
    } else if (isRAMBundle(script)) {
      [self->_performanceLogger markStartForTag:RCTPLRAMBundleLoad];
      auto ramBundle = std::make_unique<JSIndexedRAMBundle>(sourceUrlStr.UTF8String);
      std::unique_ptr<const JSBigString> scriptStr = ramBundle->getStartupCode();
      [self->_performanceLogger markStopForTag:RCTPLRAMBundleLoad];
      [self->_performanceLogger setValue:scriptStr->size() forTag:RCTPLRAMStartupCodeSize];
      if (reactInstance) {
        auto registry =
            RAMBundleRegistry::multipleBundlesRegistry(std::move(ramBundle), JSIndexedRAMBundle::buildFactory());
        reactInstance->loadRAMBundle(std::move(registry), std::move(scriptStr), sourceUrlStr.UTF8String, !async);
      }
    } else if (reactInstance) {
      reactInstance->loadScriptFromString(std::make_unique<NSDataBigString>(script), sourceUrlStr.UTF8String, !async);
    } else {
      std::string methodName = async ? "loadBundle" : "loadBundleSync";
      throw std::logic_error("Attempt to call " + methodName + ": on uninitialized bridge");
    }
  }];
}

- (void)registerSegmentWithId:(NSUInteger)segmentId path:(NSString *)path
{
  if (_reactInstance) {
    _reactInstance->registerBundle(static_cast<uint32_t>(segmentId), path.UTF8String);
  }
}

#pragma mark - Payload Processing

- (void)partialBatchDidFlush
{
  for (RCTModuleData *moduleData in _moduleDataByID) {
    if (moduleData.implementsPartialBatchDidFlush) {
      [self
          dispatchBlock:^{
            [moduleData.instance partialBatchDidFlush];
          }
                  queue:moduleData.methodQueue];
    }
  }
}

- (void)batchDidComplete
{
  // TODO #12592471: batchDidComplete is only used by RCTUIManager,
  // can we eliminate this special case?
  for (RCTModuleData *moduleData in _moduleDataByID) {
    if (moduleData.implementsBatchDidComplete) {
      [self
          dispatchBlock:^{
            [moduleData.instance batchDidComplete];
          }
                  queue:moduleData.methodQueue];
    }
  }
}

- (void)startProfiling
{
  RCTAssertMainQueue();

  [self ensureOnJavaScriptThread:^{
#if WITH_FBSYSTRACE
    [RCTFBSystrace registerCallbacks];
#endif
    RCTProfileInit(self);

    [self enqueueJSCall:@"Systrace" method:@"setEnabled" args:@[ @YES ] completion:NULL];
  }];
}

- (void)stopProfiling:(void (^)(NSData *))callback
{
  RCTAssertMainQueue();

  [self ensureOnJavaScriptThread:^{
    [self enqueueJSCall:@"Systrace" method:@"setEnabled" args:@[ @NO ] completion:NULL];
    RCTProfileEnd(self, ^(NSString *log) {
      NSData *logData = [log dataUsingEncoding:NSUTF8StringEncoding];
      callback(logData);
#if WITH_FBSYSTRACE
      if (![RCTFBSystrace verifyTraceSize:logData.length]) {
        RCTLogWarn(
            @"Your FBSystrace trace might be truncated, try to bump up the buffer size"
             " in RCTFBSystrace.m or capture a shorter trace");
      }
      [RCTFBSystrace unregisterCallbacks];
#endif
    });
  }];
}

- (BOOL)isBatchActive
{
  return _reactInstance ? _reactInstance->isBatchActive() : NO;
}

- (void *)runtime
{
  if (!_reactInstance) {
    return nullptr;
  }

  return _reactInstance->getJavaScriptContext();
}

- (void)invokeAsync:(std::function<void()> &&)func
{
  __block auto retainedFunc = std::move(func);
  __weak __typeof(self) weakSelf = self;
  [self _runAfterLoad:^{
    __strong __typeof(self) strongSelf = weakSelf;

    if (std::shared_ptr<CallInvoker> jsInvoker = strongSelf.jsCallInvoker) {
      jsInvoker->invokeAsync(std::move(retainedFunc));
    }
  }];
}

#pragma mark - RCTBridge (RCTTurboModule)

- (std::shared_ptr<CallInvoker>)jsCallInvoker
{
  return _reactInstance ? _reactInstance->getJSCallInvoker() : nullptr;
}

- (std::shared_ptr<CallInvoker>)decorateNativeCallInvoker:(std::shared_ptr<CallInvoker>)nativeInvoker
{
  return _reactInstance ? _reactInstance->getDecoratedNativeCallInvoker(nativeInvoker) : nullptr;
}

@end
