// Copyright 2004-present Facebook. All Rights Reserved.

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <atomic>
#include <future>
#include <libkern/OSAtomic.h>

#import <React/RCTAssert.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTBridgeMethod.h>
#import <React/RCTConvert.h>
#import <React/RCTCxxModule.h>
#import <React/RCTCxxUtils.h>
#import <React/RCTDevLoadingView.h>
#import <React/RCTDevSettings.h>
#import <React/RCTDisplayLink.h>
#import <React/RCTJavaScriptLoader.h>
#import <React/RCTLog.h>
#import <React/RCTModuleData.h>
#import <React/RCTPerformanceLogger.h>
#import <React/RCTProfile.h>
#import <React/RCTRedBox.h>
#import <React/RCTUtils.h>
#import <cxxreact/CxxNativeModule.h>
#import <cxxreact/Instance.h>
#import <cxxreact/JSBundleType.h>
#import <cxxreact/JSCExecutor.h>
#import <cxxreact/JSIndexedRAMBundle.h>
#import <cxxreact/Platform.h>
#import <jschelpers/Value.h>

#import "NSDataBigString.h"
#import "RCTJSCHelpers.h"
#import "RCTMessageThread.h"
#import "RCTObjcExecutor.h"

#ifdef WITH_FBSYSTRACE
#import <React/RCTFBSystrace.h>
#endif

@interface RCTCxxBridge : RCTBridge
@end

#define RCTAssertJSThread() \
  RCTAssert(self.executorClass || self->_jsThread == [NSThread currentThread], \
            @"This method must be called on JS thread")

NSString *const RCTJSThreadName = @"com.facebook.React.JavaScript";

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

static bool isRAMBundle(NSData *script) {
  BundleHeader header;
  [script getBytes:&header length:sizeof(header)];
  return parseTypeFromHeader(header) == ScriptTag::RAMBundle;
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
  RCTInstanceCallback(RCTCxxBridge *bridge): bridge_(bridge) {};
  void onBatchComplete() override {
    // There's no interface to call this per partial batch
    [bridge_ partialBatchDidFlush];
    [bridge_ batchDidComplete];
  }
  void incrementPendingJSCalls() override {}
  void decrementPendingJSCalls() override {}
  ExecutorToken createExecutorToken() override {
    return ExecutorToken(std::make_shared<PlatformExecutorToken>());
  }
  void onExecutorStopped(ExecutorToken) override {}
};

@implementation RCTCxxBridge
{
  BOOL _wasBatchActive;

  NSMutableArray<dispatch_block_t> *_pendingCalls;
  // This is accessed using OSAtomic... calls.
  volatile int32_t _pendingCount;

  // Native modules
  NSMutableDictionary<NSString *, RCTModuleData *> *_moduleDataByName;
  NSArray<RCTModuleData *> *_moduleDataByID;
  NSArray<Class> *_moduleClassesByID;
  NSUInteger _modulesInitializedOnMainQueue;
  RCTDisplayLink *_displayLink;

  // JS thread management
  NSThread *_jsThread;
  std::promise<std::shared_ptr<RCTMessageThread>> _jsMessageThreadPromise;
  std::shared_ptr<RCTMessageThread> _jsMessageThread;

  // This is uniquely owned, but weak_ptr is used.
  std::shared_ptr<Instance> _reactInstance;
}

@synthesize loading = _loading;
@synthesize valid = _valid;
@synthesize performanceLogger = _performanceLogger;

+ (void)initialize
{
  if (self == [RCTCxxBridge class]) {
    RCTPrepareJSCExecutor();
  }
}

- (JSContext *)jsContext
{
  return contextForGlobalContextRef([self jsContextRef]);
}

- (JSGlobalContextRef)jsContextRef
{
  return (JSGlobalContextRef)self->_reactInstance->getJavaScriptContext();
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

    RCTLogInfo(@"Initializing %@ (parent: %@, executor: %@)", self, bridge, [self executorClass]);

    /**
     * Set Initial State
     */
    _valid = YES;
    _loading = YES;
    _pendingCalls = [NSMutableArray new];
    _displayLink = [RCTDisplayLink new];

    [RCTBridge setCurrentBridge:self];
  }
  return self;
}

- (void)runJSRunLoop
{
  @autoreleasepool {
    RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"-[RCTCxxBridge runJSRunLoop] setup", nil);

    // copy thread name to pthread name
    pthread_setname_np([NSThread currentThread].name.UTF8String);

    __typeof(self) weakSelf = self;
    _jsMessageThreadPromise.set_value(std::make_shared<RCTMessageThread>(
      [NSRunLoop currentRunLoop],
      ^(NSError *error) {
        if (error) {
          [weakSelf handleError:error];
        }
    }));

    // Set up a dummy runloop source to avoid spinning
    CFRunLoopSourceContext noSpinCtx = {0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL};
    CFRunLoopSourceRef noSpinSource = CFRunLoopSourceCreate(NULL, 0, &noSpinCtx);
    CFRunLoopAddSource(CFRunLoopGetCurrent(), noSpinSource, kCFRunLoopDefaultMode);
    CFRelease(noSpinSource);

    RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");

    // run the run loop
    while (kCFRunLoopRunStopped != CFRunLoopRunInMode(kCFRunLoopDefaultMode, ((NSDate *)[NSDate distantFuture]).timeIntervalSinceReferenceDate, NO)) {
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

- (void)executeBlockOnJavaScriptThread:(dispatch_block_t)block
{
  RCTAssert(_jsThread, @"This method must not be called before the JS thread is created");

  // This does not use _jsMessageThread because it may be called early
  // before the runloop reference is captured and _jsMessageThread is valid.

  if ([NSThread currentThread] == _jsThread) {
    [self _tryAndHandleError:block];
  } else {
    [self performSelector:@selector(_tryAndHandleError:)
          onThread:_jsThread
          withObject:block
          waitUntilDone:NO];
  }
}

- (void)start
{
  [[NSNotificationCenter defaultCenter]
    postNotificationName:RCTJavaScriptWillStartLoadingNotification
    object:_parentBridge userInfo:@{@"bridge": self}];

  // Set up the JS thread early
  _jsThread = [[NSThread alloc] initWithTarget:self
                                      selector:@selector(runJSRunLoop)
                                        object:nil];
  _jsThread.name = RCTJSThreadName;
  _jsThread.qualityOfService = NSOperationQualityOfServiceUserInteractive;
  [_jsThread start];

  dispatch_group_t initModulesAndLoadSource = dispatch_group_create();
  dispatch_queue_t bridgeQueue = dispatch_queue_create("com.facebook.react.RCTBridgeQueue",
                                                       DISPATCH_QUEUE_SERIAL);

  // Initialize all native modules that cannot be loaded lazily
  [self _initModulesWithDispatchGroup:initModulesAndLoadSource];

  // This doesn't really do anything.  The real work happens in initializeBridge.
  _reactInstance.reset(new Instance);

  // Prepare executor factory (shared_ptr for copy into block)
  __weak RCTCxxBridge *weakSelf = self;
  std::shared_ptr<JSExecutorFactory> executorFactory;
  if (!self.executorClass) {
    BOOL useCustomJSC =
      [self.delegate respondsToSelector:@selector(shouldBridgeUseCustomJSC:)] &&
      [self.delegate shouldBridgeUseCustomJSC:self];
    // The arg is a cache dir.  It's not used with standard JSC.
    executorFactory.reset(new JSCExecutorFactory("", folly::dynamic::object
      ("UseCustomJSC", (bool)useCustomJSC)
#if RCT_PROFILE
      ("StartSamplingProfilerOnInit", (bool)self.devSettings.startSamplingProfilerOnLaunch)
#endif
    ));
  } else {
    id<RCTJavaScriptExecutor> objcExecutor = [self moduleForClass:self.executorClass];
    executorFactory.reset(new RCTObjcExecutorFactory(objcExecutor, ^(NSError *error) {
      if (error) {
        [weakSelf handleError:error];
      }
    }));
  }

  // Dispatch the instance initialization as soon as the initial module metadata has
  // been collected (see initModules)
  dispatch_group_async(initModulesAndLoadSource, bridgeQueue, ^{
    [weakSelf _initializeBridge:executorFactory];
  });

  // Optional load and execute JS source synchronously
  // TODO #10487027: should this be async on reload?
  if (!self.executorClass &&
      [self.delegate respondsToSelector:@selector(shouldBridgeLoadJavaScriptSynchronously:)] &&
      [self.delegate shouldBridgeLoadJavaScriptSynchronously:_parentBridge]) {
    NSError *error;
    const int32_t bcVersion = systemJSCWrapper()->JSBytecodeFileFormatVersion;
    NSData *sourceCode = [RCTJavaScriptLoader attemptSynchronousLoadOfBundleAtURL:self.bundleURL
                                                                 runtimeBCVersion:bcVersion
                                                                     sourceLength:NULL
                                                                            error:&error];

    if (error) {
      [self handleError:error];
    } else {
      [self executeSourceCode:sourceCode sync:YES];
    }
  } else {
    // Load the source asynchronously, then store it for later execution.
    dispatch_group_enter(initModulesAndLoadSource);
    __block NSData *sourceCode;
    [self loadSource:^(NSError *error, NSData *source, int64_t sourceLength) {
      if (error) {
        [weakSelf handleError:error];
      }

      sourceCode = source;
      dispatch_group_leave(initModulesAndLoadSource);
    } onProgress:^(RCTLoadingProgress *progressData) {
#ifdef RCT_DEV
      RCTDevLoadingView *loadingView = [weakSelf moduleForClass:[RCTDevLoadingView class]];
      [loadingView updateProgress:progressData];
#endif
    }];

    // Wait for both the modules and source code to have finished loading
    dispatch_group_notify(initModulesAndLoadSource, bridgeQueue, ^{
      RCTCxxBridge *strongSelf = weakSelf;
      if (sourceCode && strongSelf.loading) {
        [strongSelf executeSourceCode:sourceCode sync:NO];
      }
    });
  }
}

- (void)loadSource:(RCTSourceLoadBlock)_onSourceLoad onProgress:(RCTSourceLoadProgressBlock)onProgress
{
  [_performanceLogger markStartForTag:RCTPLScriptDownload];
  NSUInteger cookie = RCTProfileBeginAsyncEvent(0, @"JavaScript download", nil);

  // Suppress a warning if RCTProfileBeginAsyncEvent gets compiled out
  (void)cookie;

  RCTPerformanceLogger *performanceLogger = _performanceLogger;
  RCTSourceLoadBlock onSourceLoad = ^(NSError *error, NSData *source, int64_t sourceLength) {
    RCTProfileEndAsyncEvent(0, @"native", cookie, @"JavaScript download", @"JS async");
    [performanceLogger markStopForTag:RCTPLScriptDownload];
    [performanceLogger setValue:sourceLength forTag:RCTPLBundleSize];
    _onSourceLoad(error, source, sourceLength);
  };

  if ([self.delegate respondsToSelector:@selector(loadSourceForBridge:onProgress:onComplete:)]) {
    [self.delegate loadSourceForBridge:_parentBridge onProgress:onProgress onComplete:onSourceLoad];
  } else if ([self.delegate respondsToSelector:@selector(loadSourceForBridge:withBlock:)]) {
    [self.delegate loadSourceForBridge:_parentBridge withBlock:onSourceLoad];
  } else if (!self.bundleURL) {
    NSError *error = RCTErrorWithMessage(@"No bundle URL present.\n\nMake sure you're running a packager " \
                                         "server or have included a .jsbundle file in your application bundle.");
    onSourceLoad(error, nil, 0);
  } else {
    [RCTJavaScriptLoader loadBundleAtURL:self.bundleURL onProgress:onProgress onComplete:^(NSError *error, NSData *source, int64_t sourceLength) {
      if (error && [self.delegate respondsToSelector:@selector(fallbackSourceURLForBridge:)]) {
        NSURL *fallbackURL = [self.delegate fallbackSourceURLForBridge:self->_parentBridge];
        if (fallbackURL && ![fallbackURL isEqual:self.bundleURL]) {
          RCTLogError(@"Failed to load bundle(%@) with error:(%@)", self.bundleURL, error.localizedDescription);
          self.bundleURL = fallbackURL;
          [RCTJavaScriptLoader loadBundleAtURL:self.bundleURL onProgress:onProgress onComplete:onSourceLoad];
          return;
        }
      }
      onSourceLoad(error, source, sourceLength);
    }];
  }
}

- (NSArray<Class> *)moduleClasses
{
  if (RCT_DEBUG && _valid && _moduleClassesByID == nil) {
    RCTLogError(@"Bridge modules have not yet been initialized. You may be "
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
  return _moduleDataByName[moduleName].instance;
}

- (BOOL)moduleIsInitialized:(Class)moduleClass
{
  return _moduleDataByName[RCTBridgeModuleNameForClass(moduleClass)].hasInstance;
}

- (std::shared_ptr<ModuleRegistry>)_buildModuleRegistry
{
  if (!self.valid) {
    return {};
  }

  [_performanceLogger markStartForTag:RCTPLNativeModulePrepareConfig];
  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"-[RCTCxxBridge buildModuleRegistry]", nil);

  auto registry = std::make_shared<ModuleRegistry>(createNativeModules(_moduleDataByID, self, _reactInstance));

  [_performanceLogger markStopForTag:RCTPLNativeModulePrepareConfig];
  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");

  return registry;
}

- (void)_initializeBridge:(std::shared_ptr<JSExecutorFactory>)executorFactory
{
  if (!self.valid) {
    return;
  }

  if (!_jsMessageThread) {
    _jsMessageThread = _jsMessageThreadPromise.get_future().get();
  }

  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"-[RCTCxxBridge initializeBridge:]", nil);
  // This can only be false if the bridge was invalidated before startup completed
  if (_reactInstance) {
    // This is async, but any calls into JS are blocked by the m_syncReady CV in Instance
    _reactInstance->initializeBridge(
      std::unique_ptr<RCTInstanceCallback>(new RCTInstanceCallback(self)),
      executorFactory,
      _jsMessageThread,
      [self _buildModuleRegistry]);

#if RCT_PROFILE
    if (RCTProfileIsProfiling()) {
      _reactInstance->setGlobalVariable(
        "__RCTProfileIsProfiling",
        std::make_unique<JSBigStdString>("true"));
    }
#endif
  }

  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
}

- (NSArray *)configForModuleName:(NSString *)moduleName
{
  RCTModuleData *moduleData = _moduleDataByName[moduleName];
  if (moduleData) {
#if RCT_DEV
    if ([self.delegate respondsToSelector:@selector(whitelistedModulesForBridge:)]) {
      NSArray *whitelisted = [self.delegate whitelistedModulesForBridge:self];
      RCTAssert(!whitelisted || [whitelisted containsObject:[moduleData moduleClass]],
                @"Required config for %@, which was not whitelisted", moduleName);
    }
#endif
  }
  return moduleData.config;
}

- (void)_initModulesWithDispatchGroup:(dispatch_group_t)dispatchGroup
{
  [_performanceLogger markStartForTag:RCTPLNativeModuleInit];

  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways,
                          @"-[RCTCxxBridge initModulesWithDispatchGroup:] extraModules", nil);
  NSArray<id<RCTBridgeModule>> *extraModules = nil;
  if (self.delegate) {
    if ([self.delegate respondsToSelector:@selector(extraModulesForBridge:)]) {
      extraModules = [self.delegate extraModulesForBridge:_parentBridge];
    }
  } else if (self.moduleProvider) {
    extraModules = self.moduleProvider();
  }
  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");

#if RCT_DEBUG
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    RCTVerifyAllModulesExported(extraModules);
  });
#endif

  NSMutableArray<Class> *moduleClassesByID = [NSMutableArray new];
  NSMutableArray<RCTModuleData *> *moduleDataByID = [NSMutableArray new];
  NSMutableDictionary<NSString *, RCTModuleData *> *moduleDataByName = [NSMutableDictionary new];

  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways,
                          @"-[RCTCxxBridge initModulesWithDispatchGroup:] preinitialized moduleData", nil);
  // Set up moduleData for pre-initialized module instances
  for (id<RCTBridgeModule> module in extraModules) {
    Class moduleClass = [module class];
    NSString *moduleName = RCTBridgeModuleNameForClass(moduleClass);

    if (RCT_DEBUG) {
      // Check for name collisions between preregistered modules
      RCTModuleData *moduleData = moduleDataByName[moduleName];
      if (moduleData) {
        RCTLogError(@"Attempted to register RCTBridgeModule class %@ for the "
                    "name '%@', but name was already registered by class %@",
                    moduleClass, moduleName, moduleData.moduleClass);
        continue;
      }
    }

    // Instantiate moduleData container
    RCTModuleData *moduleData = [[RCTModuleData alloc] initWithModuleInstance:module
                                                                       bridge:self];
    moduleDataByName[moduleName] = moduleData;
    [moduleClassesByID addObject:moduleClass];
    [moduleDataByID addObject:moduleData];
  }
  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");

  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways,
                          @"-[RCTCxxBridge initModulesWithDispatchGroup:] autoexported moduleData", nil);
  // Set up moduleData for automatically-exported modules
  for (Class moduleClass in RCTGetModuleClasses()) {
    NSString *moduleName = RCTBridgeModuleNameForClass(moduleClass);

    // Don't initialize the old executor in the new bridge.
    // TODO mhorowitz #10487027: after D3175632 lands, we won't need
    // this, because it won't be eagerly initialized.
    if ([moduleName isEqual:@"RCTJSCExecutor"]) {
      continue;
    }

    // Check for module name collisions
    RCTModuleData *moduleData = moduleDataByName[moduleName];
    if (moduleData) {
      if (moduleData.hasInstance) {
        // Existing module was preregistered, so it takes precedence
        continue;
      } else if ([moduleClass new] == nil) {
        // The new module returned nil from init, so use the old module
        continue;
      } else if ([moduleData.moduleClass new] != nil) {
        // Both modules were non-nil, so it's unclear which should take precedence
        RCTLogError(@"Attempted to register RCTBridgeModule class %@ for the "
                    "name '%@', but name was already registered by class %@",
                    moduleClass, moduleName, moduleData.moduleClass);
      }
    }

    // Instantiate moduleData
    // TODO #13258411: can we defer this until config generation?
    moduleData = [[RCTModuleData alloc] initWithModuleClass:moduleClass
                                                     bridge:self];
    moduleDataByName[moduleName] = moduleData;
    [moduleClassesByID addObject:moduleClass];
    [moduleDataByID addObject:moduleData];
  }
  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");

  // Store modules
  _moduleDataByID = [moduleDataByID copy];
  _moduleDataByName = [moduleDataByName copy];
  _moduleClassesByID = [moduleClassesByID copy];

  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways,
                          @"-[RCTCxxBridge initModulesWithDispatchGroup:] moduleData.hasInstance", nil);
  // Dispatch module init onto main thead for those modules that require it
  for (RCTModuleData *moduleData in _moduleDataByID) {
    if (moduleData.hasInstance &&
        (!moduleData.requiresMainQueueSetup || RCTIsMainQueue())) {
      // Modules that were pre-initialized should ideally be set up before
      // bridge init has finished, otherwise the caller may try to access the
      // module directly rather than via `[bridge moduleForClass:]`, which won't
      // trigger the lazy initialization process. If the module cannot safely be
      // set up on the current thread, it will instead be async dispatched
      // to the main thread to be set up in the loop below.
      (void)[moduleData instance];
    }
  }
  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");

  // From this point on, RCTDidInitializeModuleNotification notifications will
  // be sent the first time a module is accessed.
  _moduleSetupComplete = YES;

  [self _prepareModulesWithDispatchGroup:dispatchGroup];

  [_performanceLogger markStopForTag:RCTPLNativeModuleInit];
  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");

#if RCT_PROFILE
  if (RCTProfileIsProfiling()) {
    // Depends on moduleDataByID being loaded
    RCTProfileHookModules(self);
  }
#endif
}

- (void)_prepareModulesWithDispatchGroup:(dispatch_group_t)dispatchGroup
{
  RCT_PROFILE_BEGIN_EVENT(0, @"-[RCTBatchedBridge prepareModulesWithDispatch]", nil);

  NSArray<Class> *whitelistedModules = nil;
  if ([self.delegate respondsToSelector:@selector(whitelistedModulesForBridge:)]) {
    whitelistedModules = [self.delegate whitelistedModulesForBridge:self];
  }

  BOOL initializeImmediately = NO;
  if (dispatchGroup == NULL) {
    // If no dispatchGroup is passed in, we must prepare everything immediately.
    // We better be on the right thread too.
    RCTAssertMainQueue();
    initializeImmediately = YES;
  } else if ([self.delegate respondsToSelector:@selector(shouldBridgeInitializeNativeModulesSynchronously:)]) {
    initializeImmediately = [self.delegate shouldBridgeInitializeNativeModulesSynchronously:self];
  }

  // Set up modules that require main thread init or constants export
  [_performanceLogger setValue:0 forTag:RCTPLNativeModuleMainThread];
  for (RCTModuleData *moduleData in _moduleDataByID) {
    if (whitelistedModules && ![whitelistedModules containsObject:[moduleData moduleClass]]) {
      continue;
    }

    if (moduleData.requiresMainQueueSetup || moduleData.hasConstantsToExport) {
      // Modules that need to be set up on the main thread cannot be initialized
      // lazily when required without doing a dispatch_sync to the main thread,
      // which can result in deadlock. To avoid this, we initialize all of these
      // modules on the main thread in parallel with loading the JS code, so
      // they will already be available before they are ever required.
      dispatch_block_t block = ^{
        if (self.valid && ![moduleData.moduleClass isSubclassOfClass:[RCTCxxModule class]]) {
          [self->_performanceLogger appendStartForTag:RCTPLNativeModuleMainThread];
          (void)[moduleData instance];
          [moduleData gatherConstants];
          [self->_performanceLogger appendStopForTag:RCTPLNativeModuleMainThread];
        }
      };

      if (initializeImmediately && RCTIsMainQueue()) {
        block();
      } else {
        // We've already checked that dispatchGroup is non-null, but this satisifies the
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

- (void)whitelistedModulesDidChange
{
  RCTAssertMainQueue();
  [self _prepareModulesWithDispatchGroup:NULL];
}

- (void)registerModuleForFrameUpdates:(id<RCTBridgeModule>)module
                       withModuleData:(RCTModuleData *)moduleData
{
  [_displayLink registerModuleForFrameUpdates:module withModuleData:moduleData];
}

- (void)executeSourceCode:(NSData *)sourceCode sync:(BOOL)sync
{
  // This will get called from whatever thread was actually executing JS.
  dispatch_block_t completion = ^{
    // Flush pending calls immediately so we preserve ordering
    [self _flushPendingCalls];

    // Perform the state update and notification on the main thread, so we can't run into
    // timing issues with RCTRootView
    dispatch_async(dispatch_get_main_queue(), ^{
      [[NSNotificationCenter defaultCenter]
       postNotificationName:RCTJavaScriptDidLoadNotification
       object:self->_parentBridge userInfo:@{@"bridge": self}];

      // Starting the display link is not critical to startup, so do it last
      [self executeBlockOnJavaScriptThread:^{
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

#if RCT_DEV
  if ([RCTGetURLQueryParam(self.bundleURL, @"hot") boolValue]) {
    NSString *path = [self.bundleURL.path substringFromIndex:1]; // strip initial slash
    NSString *host = self.bundleURL.host;
    NSNumber *port = self.bundleURL.port;
    [self enqueueJSCall:@"HMRClient"
                 method:@"enable"
                   args:@[@"ios", path, host, RCTNullIfNil(port)]
             completion:NULL];  }
#endif
}

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
      [self.redBox showErrorMessage:[error localizedDescription]
                       withRawStack:[error userInfo][RCTJSRawStackTraceKey]];
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
  [self redBox];

  _loading = NO;
  _valid = NO;

  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_jsMessageThread) {
      auto thread = self->_jsMessageThread;
      self->_jsMessageThread->runOnQueue([thread] {
        thread->quitSynchronous();
      });
      self->_jsMessageThread.reset();
    }

    [[NSNotificationCenter defaultCenter]
     postNotificationName:RCTJavaScriptDidFailToLoadNotification
     object:self->_parentBridge userInfo:@{@"bridge": self, @"error": error}];

    if ([error userInfo][RCTJSRawStackTraceKey]) {
      [self.redBox showErrorMessage:[error localizedDescription]
                       withRawStack:[error userInfo][RCTJSRawStackTraceKey]];
    }

    RCTFatal(error);
  });
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithDelegate:(__unused id<RCTBridgeDelegate>)delegate
                                           bundleURL:(__unused NSURL *)bundleURL
                                      moduleProvider:(__unused RCTBridgeModuleListProvider)block
                                       launchOptions:(__unused NSDictionary *)launchOptions)

RCT_NOT_IMPLEMENTED(- (instancetype)initWithBundleURL:(__unused NSURL *)bundleURL
                                       moduleProvider:(__unused RCTBridgeModuleListProvider)block
                                        launchOptions:(__unused NSDictionary *)launchOptions)

/**
 * Prevent super from calling setUp (that'd create another batchedBridge)
 */
- (void)setUp {}

- (void)reload
{
  [_parentBridge reload];
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

- (void)dispatchBlock:(dispatch_block_t)block
                queue:(dispatch_queue_t)queue
{
  if (queue == RCTJSThread) {
    [self executeBlockOnJavaScriptThread:block];
  } else if (queue) {
    dispatch_async(queue, block);
  }
}

#pragma mark - RCTInvalidating

- (void)invalidate
{
  if (!_valid) {
    return;
  }

  RCTAssertMainQueue();
  RCTAssert(_reactInstance != nil, @"Can't complete invalidation without a react instance");

  _loading = NO;
  _valid = NO;
  if ([RCTBridge currentBridge] == self) {
    [RCTBridge setCurrentBridge:nil];
  }

  // Invalidate modules
  dispatch_group_t group = dispatch_group_create();
  for (RCTModuleData *moduleData in _moduleDataByID) {
    // Be careful when grabbing an instance here, we don't want to instantiate
    // any modules just to invalidate them.
    if (![moduleData hasInstance]) {
      continue;
    }

    if ([moduleData.instance respondsToSelector:@selector(invalidate)]) {
      dispatch_group_enter(group);
      [self dispatchBlock:^{
        [(id<RCTInvalidating>)moduleData.instance invalidate];
        dispatch_group_leave(group);
      } queue:moduleData.methodQueue];
    }
    [moduleData invalidate];
  }

  dispatch_group_notify(group, dispatch_get_main_queue(), ^{
    [self executeBlockOnJavaScriptThread:^{
      [self->_displayLink invalidate];
      self->_displayLink = nil;

      self->_reactInstance.reset();
      if (self->_jsMessageThread) {
        self->_jsMessageThread->quitSynchronous();
        self->_jsMessageThread.reset();
      }

      if (RCTProfileIsProfiling()) {
        RCTProfileUnhookModules(self);
      }

      self->_moduleDataByName = nil;
      self->_moduleDataByID = nil;
      self->_moduleClassesByID = nil;
      self->_pendingCalls = nil;
    }];
  });
}

- (void)logMessage:(NSString *)message level:(NSString *)level
{
  if (RCT_DEBUG && _valid) {
    [self enqueueJSCall:@"RCTLog"
                 method:@"logIfNoNativeHook"
                   args:@[level, message]
             completion:NULL];
  }
}

#pragma mark - RCTBridge methods

- (void)_runAfterLoad:(dispatch_block_t)block
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
    // From the callers' perspecive:

    // Phase 1: jsQueueBlocks are added to the queue; _pendingCount is
    // incremented for each.  If the first block is created after self.loading is
    // true, phase 1 will be nothing.
    OSAtomicIncrement32Barrier(&_pendingCount);
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
        OSAtomicDecrement32Barrier(&self->_pendingCount);
      }
    };
    [self executeBlockOnJavaScriptThread:jsQueueBlock];
  } else {
    // Phase 2/Phase D: blocks are executed directly, adding work to the JS queue.
    block();
  }
}

- (void)_flushPendingCalls
{
  [_performanceLogger markStopForTag:RCTPLBridgeStartup];

  RCT_PROFILE_BEGIN_EVENT(0, @"Processing pendingCalls", @{ @"count": @(_pendingCalls.count) });
  // Phase B: _flushPendingCalls happens.  Each block in _pendingCalls is
  // executed, adding work to the queue, and _pendingCount is decremented.
  // loading is set to NO.
  NSArray *pendingCalls = _pendingCalls;
  _pendingCalls = nil;
  for (dispatch_block_t call in pendingCalls) {
    call();
    OSAtomicDecrement32Barrier(&_pendingCount);
  }
  _loading = NO;
  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
}

/**
 * Public. Can be invoked from any thread.
 */
- (void)enqueueJSCall:(NSString *)module method:(NSString *)method args:(NSArray *)args completion:(dispatch_block_t)completion
{
  if (!self.valid) {
    return;
  }

  /**
   * AnyThread
   */
  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"-[RCTCxxBridge enqueueJSCall:]", nil);

  RCTProfileBeginFlowEvent();
  [self _runAfterLoad:^{
    RCTProfileEndFlowEvent();

    if (self->_reactInstance) {
      self->_reactInstance->callJSFunction(self->_reactInstance->getMainExecutorToken(),
                                           [module UTF8String], [method UTF8String],
                                           [RCTConvert folly_dynamic:args ?: @[]]);

      if (completion) {
        [self executeBlockOnJavaScriptThread:completion];
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

  [self _runAfterLoad:^{
    RCTProfileEndFlowEvent();

    if (self->_reactInstance)
      self->_reactInstance->callJSCallback(
        self->_reactInstance->getMainExecutorToken(), [cbID unsignedLongLongValue],
        [RCTConvert folly_dynamic:args ?: @[]]);
  }];
}

/**
 * Private hack to support `setTimeout(fn, 0)`
 */
- (void)_immediatelyCallTimer:(NSNumber *)timer
{
  RCTAssertJSThread();

  if (_reactInstance)
    _reactInstance->callJSFunction(_reactInstance->getMainExecutorToken(),
                                   "JSTimersExecution", "callTimers",
                                   folly::dynamic::array(folly::dynamic::array([timer doubleValue])));
}

- (void)enqueueApplicationScript:(NSData *)script
                             url:(NSURL *)url
                      onComplete:(dispatch_block_t)onComplete
{
  RCTAssert(onComplete != nil, @"onComplete block passed in should be non-nil");

  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways,
                          @"-[RCTCxxBridge enqueueApplicationScript]", nil);

  [self _tryAndHandleError:^{
    if (isRAMBundle(script)) {
      auto ramBundle = std::make_unique<JSIndexedRAMBundle>(url.path.UTF8String);
      std::unique_ptr<const JSBigString> scriptStr = ramBundle->getStartupCode();
      if (self->_reactInstance)
        self->_reactInstance->loadUnbundle(std::move(ramBundle), std::move(scriptStr),
                                           [[url absoluteString] UTF8String]);
    } else if (self->_reactInstance) {
      self->_reactInstance->loadScriptFromString(std::make_unique<NSDataBigString>(script),
                                                 [[url absoluteString] UTF8String]);
    }
  }];

  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");

  // Assumes that onComplete can be called when the next block on the JS thread is scheduled
  [self executeBlockOnJavaScriptThread:^{
    onComplete();
  }];
}

- (void)executeApplicationScriptSync:(NSData *)script url:(NSURL *)url
{
  [self _tryAndHandleError:^{
    if (isRAMBundle(script)) {
      auto ramBundle = std::make_unique<JSIndexedRAMBundle>(url.path.UTF8String);
      std::unique_ptr<const JSBigString> scriptStr = ramBundle->getStartupCode();
      if (self->_reactInstance) {
        self->_reactInstance->loadUnbundleSync(std::move(ramBundle), std::move(scriptStr),
                                               [[url absoluteString] UTF8String]);
      }
    } else if (self->_reactInstance) {
      self->_reactInstance->loadScriptFromStringSync(std::make_unique<NSDataBigString>(script),
                                                     [[url absoluteString] UTF8String]);
    } else {
      throw std::logic_error(
        "Attempt to call loadApplicationScriptSync: on uninitialized bridge");
    }
  }];
}



- (JSValue *)callFunctionOnModule:(NSString *)module
                           method:(NSString *)method
                        arguments:(NSArray *)arguments
                            error:(NSError **)error
{
  if (!_reactInstance) {
    if (error) {
      *error = RCTErrorWithMessage(
        @"Attempt to call sync callFunctionOnModule: on uninitialized bridge");
    }
    return nil;
  } else if (self.executorClass) {
    if (error) {
      *error = RCTErrorWithMessage(
        @"sync callFunctionOnModule: can only be used with JSC executor");
    }
    return nil;
  } else if (!self.valid) {
    if (error) {
      *error = RCTErrorWithMessage(
        @"sync callFunctionOnModule: bridge is no longer valid");
    }
    return nil;
  } else if (self.loading) {
    if (error) {
      *error = RCTErrorWithMessage(
        @"sync callFunctionOnModule: bridge is still loading");
    }
    return nil;
  }

  RCT_PROFILE_BEGIN_EVENT(0, @"callFunctionOnModule", (@{ @"module": module, @"method": method }));
  __block JSValue *ret = nil;
  NSError *errorObj = tryAndReturnError(^{
    Value result = self->_reactInstance->callFunctionSync(
      [module UTF8String], [method UTF8String], arguments);
    JSContext *context = contextForGlobalContextRef(JSC_JSContextGetGlobalContext(result.context()));
    ret = [JSC_JSValue(result.context()) valueWithJSValueRef:result inContext:context];
  });
  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"js_call");

  if (error) {
    *error = errorObj;
  }

  return ret;
}

#pragma mark - Payload Processing

- (void)partialBatchDidFlush
{
  for (RCTModuleData *moduleData in _moduleDataByID) {
    if (moduleData.implementsPartialBatchDidFlush) {
      [self dispatchBlock:^{
        [moduleData.instance partialBatchDidFlush];
      } queue:moduleData.methodQueue];
    }
  }
}

- (void)batchDidComplete
{
  // TODO #12592471: batchDidComplete is only used by RCTUIManager,
  // can we eliminate this special case?
  for (RCTModuleData *moduleData in _moduleDataByID) {
    if (moduleData.implementsBatchDidComplete) {
      [self dispatchBlock:^{
        [moduleData.instance batchDidComplete];
      } queue:moduleData.methodQueue];
    }
  }
}

- (void)startProfiling
{
  RCTAssertMainQueue();

  [self executeBlockOnJavaScriptThread:^{
    #if WITH_FBSYSTRACE
    [RCTFBSystrace registerCallbacks];
    #endif
    RCTProfileInit(self);
  }];
}

- (void)stopProfiling:(void (^)(NSData *))callback
{
  RCTAssertMainQueue();

  [self executeBlockOnJavaScriptThread:^{
    RCTProfileEnd(self, ^(NSString *log) {
      NSData *logData = [log dataUsingEncoding:NSUTF8StringEncoding];
      callback(logData);
      #if WITH_FBSYSTRACE
      [RCTFBSystrace unregisterCallbacks];
      #endif
    });
  }];
}

- (BOOL)isBatchActive
{
  return _wasBatchActive;
}

@end
