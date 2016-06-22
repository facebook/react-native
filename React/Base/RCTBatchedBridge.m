/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTBridge+Private.h"
#import "RCTBridgeMethod.h"
#import "RCTConvert.h"
#import "RCTDisplayLink.h"
#import "RCTJSCExecutor.h"
#import "RCTJavaScriptLoader.h"
#import "RCTLog.h"
#import "RCTModuleData.h"
#import "RCTPerformanceLogger.h"
#import "RCTProfile.h"
#import "RCTSourceCode.h"
#import "RCTUtils.h"
#import "RCTRedBox.h"

#define RCTAssertJSThread() \
  RCTAssert(![NSStringFromClass([_javaScriptExecutor class]) isEqualToString:@"RCTJSCExecutor"] || \
              [[[NSThread currentThread] name] isEqualToString:RCTJSCThreadName], \
            @"This method must be called on JS thread")

/**
 * Must be kept in sync with `MessageQueue.js`.
 */
typedef NS_ENUM(NSUInteger, RCTBridgeFields) {
  RCTBridgeFieldRequestModuleIDs = 0,
  RCTBridgeFieldMethodIDs,
  RCTBridgeFieldParams,
  RCTBridgeFieldCallID,
};

RCT_EXTERN NSArray<Class> *RCTGetModuleClasses(void);

@implementation RCTBatchedBridge
{
  BOOL _wasBatchActive;
  NSMutableArray<dispatch_block_t> *_pendingCalls;
  NSMutableDictionary<NSString *, RCTModuleData *> *_moduleDataByName;
  NSArray<RCTModuleData *> *_moduleDataByID;
  NSArray<Class> *_moduleClassesByID;
  RCTDisplayLink *_displayLink;
}

@synthesize flowID = _flowID;
@synthesize flowIDMap = _flowIDMap;
@synthesize flowIDMapLock = _flowIDMapLock;
@synthesize loading = _loading;
@synthesize valid = _valid;

- (instancetype)initWithParentBridge:(RCTBridge *)bridge
{
  RCTAssertParam(bridge);

  if ((self = [super initWithBundleURL:bridge.bundleURL
                        moduleProvider:bridge.moduleProvider
                         launchOptions:bridge.launchOptions])) {

    _parentBridge = bridge;

    /**
     * Set Initial State
     */
    _valid = YES;
    _loading = YES;
    _pendingCalls = [NSMutableArray new];
    _displayLink = [RCTDisplayLink new];

    [RCTBridge setCurrentBridge:self];

    [[NSNotificationCenter defaultCenter]
     postNotificationName:RCTJavaScriptWillStartLoadingNotification
     object:_parentBridge userInfo:@{@"bridge": self}];

    [self start];
  }
  return self;
}

- (void)start
{
  dispatch_queue_t bridgeQueue = dispatch_queue_create("com.facebook.react.RCTBridgeQueue", DISPATCH_QUEUE_CONCURRENT);

  dispatch_group_t initModulesAndLoadSource = dispatch_group_create();

  // Asynchronously load source code
  dispatch_group_enter(initModulesAndLoadSource);
  __weak RCTBatchedBridge *weakSelf = self;
  __block NSData *sourceCode;
  [self loadSource:^(NSError *error, NSData *source) {
    if (error) {
      dispatch_async(dispatch_get_main_queue(), ^{
        [weakSelf stopLoadingWithError:error];
      });
    }

    sourceCode = source;
    dispatch_group_leave(initModulesAndLoadSource);
  }];

  // Synchronously initialize all native modules that cannot be loaded lazily
  [self initModulesWithDispatchGroup:initModulesAndLoadSource];

  __block NSString *config;
  dispatch_group_enter(initModulesAndLoadSource);
  dispatch_async(bridgeQueue, ^{
    dispatch_group_t setupJSExecutorAndModuleConfig = dispatch_group_create();

    // Asynchronously initialize the JS executor
    dispatch_group_async(setupJSExecutorAndModuleConfig, bridgeQueue, ^{
      RCTPerformanceLoggerStart(RCTPLJSCExecutorSetup);
      [weakSelf setUpExecutor];
      RCTPerformanceLoggerEnd(RCTPLJSCExecutorSetup);
    });

    // Asynchronously gather the module config
    dispatch_group_async(setupJSExecutorAndModuleConfig, bridgeQueue, ^{
      if (weakSelf.valid) {
        RCTPerformanceLoggerStart(RCTPLNativeModulePrepareConfig);
        config = [weakSelf moduleConfig];
        RCTPerformanceLoggerEnd(RCTPLNativeModulePrepareConfig);
      }
    });

    dispatch_group_notify(setupJSExecutorAndModuleConfig, bridgeQueue, ^{
      // We're not waiting for this to complete to leave dispatch group, since
      // injectJSONConfiguration and executeSourceCode will schedule operations
      // on the same queue anyway.
      RCTPerformanceLoggerStart(RCTPLNativeModuleInjectConfig);
      [weakSelf injectJSONConfiguration:config onComplete:^(NSError *error) {
        RCTPerformanceLoggerEnd(RCTPLNativeModuleInjectConfig);
        if (error) {
          dispatch_async(dispatch_get_main_queue(), ^{
            [weakSelf stopLoadingWithError:error];
          });
        }
      }];
      dispatch_group_leave(initModulesAndLoadSource);
    });
  });

  dispatch_group_notify(initModulesAndLoadSource, bridgeQueue, ^{
    RCTBatchedBridge *strongSelf = weakSelf;
    if (sourceCode && strongSelf.loading) {
      [strongSelf executeSourceCode:sourceCode];
    }
  });
}

- (void)loadSource:(RCTSourceLoadBlock)_onSourceLoad
{
  RCTPerformanceLoggerStart(RCTPLScriptDownload);

  RCTSourceLoadBlock onSourceLoad = ^(NSError *error, NSData *source) {
    RCTPerformanceLoggerEnd(RCTPLScriptDownload);

    _onSourceLoad(error, source);
  };

  if ([self.delegate respondsToSelector:@selector(loadSourceForBridge:withBlock:)]) {
    [self.delegate loadSourceForBridge:_parentBridge withBlock:onSourceLoad];
  } else if (self.bundleURL) {
    [RCTJavaScriptLoader loadBundleAtURL:self.bundleURL onComplete:^(NSError *error, NSData *source) {
      if (error && [self.delegate respondsToSelector:@selector(fallbackSourceURLForBridge:)]) {
        NSURL *fallbackURL = [self.delegate fallbackSourceURLForBridge:_parentBridge];
        if (fallbackURL && ![fallbackURL isEqual:self.bundleURL]) {
          RCTLogError(@"Failed to load bundle(%@) with error:(%@)", self.bundleURL, error.localizedDescription);
          self.bundleURL = fallbackURL;
          [RCTJavaScriptLoader loadBundleAtURL:self.bundleURL onComplete:onSourceLoad];
          return;
        }
      }
      onSourceLoad(error, source);
    }];
  } else {
    // Allow testing without a script
    dispatch_async(dispatch_get_main_queue(), ^{
      [self didFinishLoading];
      [[NSNotificationCenter defaultCenter]
       postNotificationName:RCTJavaScriptDidLoadNotification
       object:_parentBridge userInfo:@{@"bridge": self}];
    });
    onSourceLoad(nil, nil);
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

- (NSArray *)configForModuleName:(NSString *)moduleName
{
  RCTModuleData *moduleData = _moduleDataByName[moduleName];
  if (!moduleData) {
    moduleData = _moduleDataByName[[@"RCT" stringByAppendingString:moduleName]];
  }
  if (moduleData) {
    return moduleData.config;
  }
  return (id)kCFNull;
}

- (void)initModulesWithDispatchGroup:(dispatch_group_t)dispatchGroup
{
  RCTPerformanceLoggerStart(RCTPLNativeModuleInit);

  NSArray<id<RCTBridgeModule>> *extraModules = nil;
  if (self.delegate) {
    if ([self.delegate respondsToSelector:@selector(extraModulesForBridge:)]) {
      extraModules = [self.delegate extraModulesForBridge:_parentBridge];
    }
  } else if (self.moduleProvider) {
    extraModules = self.moduleProvider();
  }

  if (RCT_DEBUG && !RCTRunningInTestEnvironment()) {

    // Check for unexported modules
    static Class *classes;
    static unsigned int classCount;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      classes = objc_copyClassList(&classCount);
    });

    NSMutableSet *moduleClasses = [NSMutableSet new];
    [moduleClasses addObjectsFromArray:RCTGetModuleClasses()];
    [moduleClasses addObjectsFromArray:[extraModules valueForKeyPath:@"class"]];

    for (unsigned int i = 0; i < classCount; i++)
    {
      Class cls = classes[i];
      Class superclass = cls;
      while (superclass)
      {
        if (class_conformsToProtocol(superclass, @protocol(RCTBridgeModule)))
        {
          if (![moduleClasses containsObject:cls] &&
              ![cls respondsToSelector:@selector(moduleName)]) {
            RCTLogWarn(@"Class %@ was not exported. Did you forget to use "
                       "RCT_EXPORT_MODULE()?", cls);
          }
          break;
        }
        superclass = class_getSuperclass(superclass);
      }
    }
  }

  NSMutableArray<Class> *moduleClassesByID = [NSMutableArray new];
  NSMutableArray<RCTModuleData *> *moduleDataByID = [NSMutableArray new];
  NSMutableDictionary<NSString *, RCTModuleData *> *moduleDataByName = [NSMutableDictionary new];

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

    // Set executor instance
    if (moduleClass == self.executorClass) {
      _javaScriptExecutor = (id<RCTJavaScriptExecutor>)module;
    }
  }

  // The executor is a bridge module, but we want it to be instantiated before
  // any other module has access to the bridge, in case they need the JS thread.
  // TODO: once we have more fine-grained control of init (t11106126) we can
  // probably just replace this with [self moduleForClass:self.executorClass]
  if (!_javaScriptExecutor) {
    id<RCTJavaScriptExecutor> executorModule = [self.executorClass new];
    RCTModuleData *moduleData = [[RCTModuleData alloc] initWithModuleInstance:executorModule
                                                                       bridge:self];
    moduleDataByName[moduleData.name] = moduleData;
    [moduleClassesByID addObject:self.executorClass];
    [moduleDataByID addObject:moduleData];

    // NOTE: _javaScriptExecutor is a weak reference
    _javaScriptExecutor = executorModule;
  }

  // Set up moduleData for automatically-exported modules
  for (Class moduleClass in RCTGetModuleClasses()) {
    NSString *moduleName = RCTBridgeModuleNameForClass(moduleClass);

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

    // Instantiate moduleData (TODO: can we defer this until config generation?)
    moduleData = [[RCTModuleData alloc] initWithModuleClass:moduleClass
                                                     bridge:self];
    moduleDataByName[moduleName] = moduleData;
    [moduleClassesByID addObject:moduleClass];
    [moduleDataByID addObject:moduleData];
  }

  // Store modules
  _moduleDataByID = [moduleDataByID copy];
  _moduleDataByName = [moduleDataByName copy];
  _moduleClassesByID = [moduleClassesByID copy];

  // Synchronously set up the pre-initialized modules
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

  // From this point on, RCTDidInitializeModuleNotification notifications will
  // be sent the first time a module is accessed.
  _moduleSetupComplete = YES;

  // Set up modules that require main thread init or constants export
  RCTPerformanceLoggerSet(RCTPLNativeModuleMainThread, 0);
  NSUInteger modulesOnMainQueueCount = 0;
  for (RCTModuleData *moduleData in _moduleDataByID) {
    __weak RCTBatchedBridge *weakSelf = self;
    if (moduleData.requiresMainQueueSetup || moduleData.hasConstantsToExport) {
      // Modules that need to be set up on the main thread cannot be initialized
      // lazily when required without doing a dispatch_sync to the main thread,
      // which can result in deadlock. To avoid this, we initialize all of these
      // modules on the main thread in parallel with loading the JS code, so
      // they will already be available before they are ever required.
      dispatch_group_async(dispatchGroup, dispatch_get_main_queue(), ^{
        if (weakSelf.valid) {
          RCTPerformanceLoggerAppendStart(RCTPLNativeModuleMainThread);
          (void)[moduleData instance];
          [moduleData gatherConstants];
          RCTPerformanceLoggerAppendEnd(RCTPLNativeModuleMainThread);
        }
      });
      modulesOnMainQueueCount++;
    }
  }

  RCTPerformanceLoggerEnd(RCTPLNativeModuleInit);
  RCTPerformanceLoggerSet(RCTPLNativeModuleMainThreadUsesCount, modulesOnMainQueueCount);
}

- (void)setUpExecutor
{
  [_javaScriptExecutor setUp];
}

- (void)registerModuleForFrameUpdates:(id<RCTBridgeModule>)module
                       withModuleData:(RCTModuleData *)moduleData
{
  [_displayLink registerModuleForFrameUpdates:module withModuleData:moduleData];
}

- (NSString *)moduleConfig
{
  NSMutableArray<NSArray *> *config = [NSMutableArray new];
  for (RCTModuleData *moduleData in _moduleDataByID) {
    if (self.executorClass == [RCTJSCExecutor class]) {
      [config addObject:@[moduleData.name]];
    } else {
      [config addObject:RCTNullIfNil(moduleData.config)];
    }
  }

  return RCTJSONStringify(@{
    @"remoteModuleConfig": config,
  }, NULL);
}

- (void)injectJSONConfiguration:(NSString *)configJSON
                     onComplete:(void (^)(NSError *))onComplete
{
  if (!_valid) {
    return;
  }

  [_javaScriptExecutor injectJSONText:configJSON
                  asGlobalObjectNamed:@"__fbBatchedBridgeConfig"
                             callback:onComplete];
}

- (void)executeSourceCode:(NSData *)sourceCode
{
  if (!_valid || !_javaScriptExecutor) {
    return;
  }

  RCTSourceCode *sourceCodeModule = [self moduleForClass:[RCTSourceCode class]];
  sourceCodeModule.scriptURL = self.bundleURL;

  [self enqueueApplicationScript:sourceCode url:self.bundleURL onComplete:^(NSError *loadError) {
    if (!_valid) {
      return;
    }

    if (loadError) {
      dispatch_async(dispatch_get_main_queue(), ^{
        [self stopLoadingWithError:loadError];
      });
      return;
    }

    // Register the display link to start sending js calls after everything is setup
    NSRunLoop *targetRunLoop = [_javaScriptExecutor isKindOfClass:[RCTJSCExecutor class]] ? [NSRunLoop currentRunLoop] : [NSRunLoop mainRunLoop];
    [_displayLink addToRunLoop:targetRunLoop];

    // Perform the state update and notification on the main thread, so we can't run into
    // timing issues with RCTRootView
    dispatch_async(dispatch_get_main_queue(), ^{
      [self didFinishLoading];
      [[NSNotificationCenter defaultCenter]
       postNotificationName:RCTJavaScriptDidLoadNotification
       object:_parentBridge userInfo:@{@"bridge": self}];
    });
  }];

#if RCT_DEV

  if ([RCTGetURLQueryParam(self.bundleURL, @"hot") boolValue]) {
    NSString *path = [self.bundleURL.path substringFromIndex:1]; // strip initial slash
    NSString *host = self.bundleURL.host;
    NSNumber *port = self.bundleURL.port;
    [self enqueueJSCall:@"HMRClient.enable" args:@[@"ios", path, host, RCTNullIfNil(port)]];
  }

#endif

}

- (void)didFinishLoading
{
  RCTPerformanceLoggerEnd(RCTPLBridgeStartup);
  _loading = NO;
  [_javaScriptExecutor executeBlockOnJavaScriptQueue:^{
    for (dispatch_block_t call in _pendingCalls) {
      call();
    }
  }];
}

- (void)stopLoadingWithError:(NSError *)error
{
  RCTAssertMainQueue();

  if (!_valid || !_loading) {
    return;
  }

  _loading = NO;
  [_javaScriptExecutor invalidate];

  [[NSNotificationCenter defaultCenter]
   postNotificationName:RCTJavaScriptDidFailToLoadNotification
   object:_parentBridge userInfo:@{@"bridge": self, @"error": error}];

  if ([error userInfo][RCTJSStackTraceKey]) {
    [self.redBox showErrorMessage:[error localizedDescription]
                        withStack:[error userInfo][RCTJSStackTraceKey]];
  }
  RCTFatal(error);
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithBundleURL:(__unused NSURL *)bundleURL
                    moduleProvider:(__unused RCTBridgeModuleProviderBlock)block
                    launchOptions:(__unused NSDictionary *)launchOptions)

/**
 * Prevent super from calling setUp (that'd create another batchedBridge)
 */
- (void)setUp {}
- (void)bindKeys {}

- (void)reload
{
  [_parentBridge reload];
}

- (Class)executorClass
{
  return _parentBridge.executorClass ?: [RCTJSCExecutor class];
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

- (BOOL)isLoading
{
  return _loading;
}

- (BOOL)isValid
{
  return _valid;
}

- (void)dispatchBlock:(dispatch_block_t)block
                queue:(dispatch_queue_t)queue
{
  if (queue == RCTJSThread) {
    [_javaScriptExecutor executeBlockOnJavaScriptQueue:block];
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
  RCTAssert(_javaScriptExecutor != nil, @"Can't complete invalidation without a JS executor");

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
    id<RCTBridgeModule> instance = nil;
    if ([moduleData hasInstance]) {
      instance = moduleData.instance;
    }

    if (instance == _javaScriptExecutor) {
      continue;
    }

    if ([instance respondsToSelector:@selector(invalidate)]) {
      dispatch_group_enter(group);
      [self dispatchBlock:^{
        [(id<RCTInvalidating>)instance invalidate];
        dispatch_group_leave(group);
      } queue:moduleData.methodQueue];
    }
    [moduleData invalidate];
  }

  dispatch_group_notify(group, dispatch_get_main_queue(), ^{
    [_javaScriptExecutor executeBlockOnJavaScriptQueue:^{
      [_displayLink invalidate];
      _displayLink = nil;

      [_javaScriptExecutor invalidate];
      _javaScriptExecutor = nil;

      if (RCTProfileIsProfiling()) {
        RCTProfileUnhookModules(self);
      }

      _moduleDataByName = nil;
      _moduleDataByID = nil;
      _moduleClassesByID = nil;
      _pendingCalls = nil;

      if (_flowIDMap != NULL) {
        CFRelease(_flowIDMap);
      }
    }];
  });
}

- (void)logMessage:(NSString *)message level:(NSString *)level
{
  if (RCT_DEBUG && [_javaScriptExecutor isValid]) {
    [self enqueueJSCall:@"RCTLog.logIfNoNativeHook"
                   args:@[level, message]];
  }
}

#pragma mark - RCTBridge methods

/**
 * Public. Can be invoked from any thread.
 */
- (void)enqueueJSCall:(NSString *)moduleDotMethod args:(NSArray *)args
{
  /**
   * AnyThread
   */

  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"-[RCTBatchedBridge enqueueJSCall:]", nil);

  NSArray<NSString *> *ids = [moduleDotMethod componentsSeparatedByString:@"."];

  NSString *module = ids[0];
  NSString *method = ids[1];

  RCTProfileBeginFlowEvent();

  __weak RCTBatchedBridge *weakSelf = self;
  [_javaScriptExecutor executeBlockOnJavaScriptQueue:^{
    RCTProfileEndFlowEvent();

    RCTBatchedBridge *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.valid) {
      return;
    }

    if (strongSelf.loading) {
      dispatch_block_t pendingCall = ^{
        [weakSelf _actuallyInvokeAndProcessModule:module method:method arguments:args ?: @[]];
      };
      [strongSelf->_pendingCalls addObject:pendingCall];
    } else {
      [strongSelf _actuallyInvokeAndProcessModule:module method:method arguments:args ?: @[]];
    }
  }];

  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"", nil);
}

/**
 * Called by RCTModuleMethod from any thread.
 */
- (void)enqueueCallback:(NSNumber *)cbID args:(NSArray *)args
{
  /**
   * AnyThread
   */

  RCTProfileBeginFlowEvent();

  __weak RCTBatchedBridge *weakSelf = self;
  [_javaScriptExecutor executeBlockOnJavaScriptQueue:^{
    RCTProfileEndFlowEvent();

    RCTBatchedBridge *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.valid) {
      return;
    }

    if (strongSelf.loading) {
      dispatch_block_t pendingCall = ^{
        [weakSelf _actuallyInvokeCallback:cbID arguments:args ?: @[]];
      };
      [strongSelf->_pendingCalls addObject:pendingCall];
    } else {
      [strongSelf _actuallyInvokeCallback:cbID arguments:args];
    }
  }];
}

/**
 * Private hack to support `setTimeout(fn, 0)`
 */
- (void)_immediatelyCallTimer:(NSNumber *)timer
{
  RCTAssertJSThread();

  dispatch_block_t block = ^{
    [self _actuallyInvokeAndProcessModule:@"JSTimersExecution"
                                   method:@"callTimers"
                                arguments:@[@[timer]]];
  };

  if ([_javaScriptExecutor respondsToSelector:@selector(executeAsyncBlockOnJavaScriptQueue:)]) {
    [_javaScriptExecutor executeAsyncBlockOnJavaScriptQueue:block];
  } else {
    [_javaScriptExecutor executeBlockOnJavaScriptQueue:block];
  }
}

- (void)enqueueApplicationScript:(NSData *)script
                             url:(NSURL *)url
                      onComplete:(RCTJavaScriptCompleteBlock)onComplete
{
  RCTAssert(onComplete != nil, @"onComplete block passed in should be non-nil");

  RCTProfileBeginFlowEvent();
  [_javaScriptExecutor executeApplicationScript:script sourceURL:url onComplete:^(NSError *scriptLoadError) {
    RCTProfileEndFlowEvent();
    RCTAssertJSThread();

    if (scriptLoadError) {
      onComplete(scriptLoadError);
      return;
    }

    RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"FetchApplicationScriptCallbacks", nil);
    [_javaScriptExecutor flushedQueue:^(id json, NSError *error)
     {
       RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"js_call,init", @{
         @"json": RCTNullIfNil(json),
         @"error": RCTNullIfNil(error),
       });

       [self handleBuffer:json batchEnded:YES];

       onComplete(error);
     }];
  }];
}

#pragma mark - Payload Generation

- (void)_actuallyInvokeAndProcessModule:(NSString *)module
                                 method:(NSString *)method
                              arguments:(NSArray *)args
{
  RCTAssertJSThread();

  __weak typeof(self) weakSelf = self;
  [_javaScriptExecutor callFunctionOnModule:module
                                     method:method
                                  arguments:args
                                   callback:^(id json, NSError *error) {
                                     [weakSelf _processResponse:json error:error];
                                   }];
}

- (void)_actuallyInvokeCallback:(NSNumber *)cbID
                      arguments:(NSArray *)args
{
  RCTAssertJSThread();

  __weak typeof(self) weakSelf = self;
  [_javaScriptExecutor invokeCallbackID:cbID
                              arguments:args
                               callback:^(id json, NSError *error) {
                                 [weakSelf _processResponse:json error:error];
                               }];
}

- (void)_processResponse:(id)json error:(NSError *)error
{
  if (error) {
    if ([error userInfo][RCTJSStackTraceKey]) {
      [self.redBox showErrorMessage:[error localizedDescription]
                          withStack:[error userInfo][RCTJSStackTraceKey]];
    }
    RCTFatal(error);
  }

  if (!_valid) {
    return;
  }
  [self handleBuffer:json batchEnded:YES];
}

#pragma mark - Payload Processing

- (void)handleBuffer:(id)buffer batchEnded:(BOOL)batchEnded
{
  RCTAssertJSThread();

  if (buffer != nil && buffer != (id)kCFNull) {
    _wasBatchActive = YES;
    [self handleBuffer:buffer];
    [self partialBatchDidFlush];
  }

  if (batchEnded) {
    if (_wasBatchActive) {
      [self batchDidComplete];
    }

    _wasBatchActive = NO;
  }
}

- (void)handleBuffer:(NSArray *)buffer
{
  NSArray *requestsArray = [RCTConvert NSArray:buffer];

  if (RCT_DEBUG && requestsArray.count <= RCTBridgeFieldParams) {
    RCTLogError(@"Buffer should contain at least %tu sub-arrays. Only found %tu",
                RCTBridgeFieldParams + 1, requestsArray.count);
    return;
  }

  NSArray<NSNumber *> *moduleIDs = [RCTConvert NSNumberArray:requestsArray[RCTBridgeFieldRequestModuleIDs]];
  NSArray<NSNumber *> *methodIDs = [RCTConvert NSNumberArray:requestsArray[RCTBridgeFieldMethodIDs]];
  NSArray<NSArray *> *paramsArrays = [RCTConvert NSArrayArray:requestsArray[RCTBridgeFieldParams]];

  int64_t callID = -1;

  if (requestsArray.count > 3) {
    callID = [requestsArray[RCTBridgeFieldCallID] longLongValue];
  }

  if (RCT_DEBUG && (moduleIDs.count != methodIDs.count || moduleIDs.count != paramsArrays.count)) {
    RCTLogError(@"Invalid data message - all must be length: %zd", moduleIDs.count);
    return;
  }

  NSMapTable *buckets = [[NSMapTable alloc] initWithKeyOptions:NSPointerFunctionsStrongMemory
                                                  valueOptions:NSPointerFunctionsStrongMemory
                                                      capacity:_moduleDataByName.count];

  [moduleIDs enumerateObjectsUsingBlock:^(NSNumber *moduleID, NSUInteger i, __unused BOOL *stop) {
    RCTModuleData *moduleData = _moduleDataByID[moduleID.integerValue];
    dispatch_queue_t queue = moduleData.methodQueue;
    NSMutableOrderedSet<NSNumber *> *set = [buckets objectForKey:queue];
    if (!set) {
      set = [NSMutableOrderedSet new];
      [buckets setObject:set forKey:queue];
    }
    [set addObject:@(i)];
  }];

  for (dispatch_queue_t queue in buckets) {
    RCTProfileBeginFlowEvent();

    dispatch_block_t block = ^{
      RCTProfileEndFlowEvent();
      RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"-[RCTBatchedBridge handleBuffer:]", nil);

      NSOrderedSet *calls = [buckets objectForKey:queue];
      @autoreleasepool {
        for (NSNumber *indexObj in calls) {
          NSUInteger index = indexObj.unsignedIntegerValue;
          if (RCT_DEV && callID != -1 && _flowIDMap != NULL && RCTProfileIsProfiling()) {
            [self.flowIDMapLock lock];
            int64_t newFlowID = (int64_t)CFDictionaryGetValue(_flowIDMap, (const void *)(_flowID + index));
            _RCTProfileEndFlowEvent(@(newFlowID));
            CFDictionaryRemoveValue(_flowIDMap, (const void *)(_flowID + index));
            [self.flowIDMapLock unlock];
          }
          [self _handleRequestNumber:index
                            moduleID:[moduleIDs[index] integerValue]
                            methodID:[methodIDs[index] integerValue]
                              params:paramsArrays[index]];
        }
      }

      RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"objc_call,dispatch_async", @{
        @"calls": @(calls.count),
      });
    };

    if (queue == RCTJSThread) {
      [_javaScriptExecutor executeBlockOnJavaScriptQueue:block];
    } else if (queue) {
      dispatch_async(queue, block);
    }
  }

  _flowID = callID;
}

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
  // TODO: batchDidComplete is only used by RCTUIManager - can we eliminate this special case?
  for (RCTModuleData *moduleData in _moduleDataByID) {
    if (moduleData.implementsBatchDidComplete) {
      [self dispatchBlock:^{
        [moduleData.instance batchDidComplete];
      } queue:moduleData.methodQueue];
    }
  }
}

- (BOOL)_handleRequestNumber:(NSUInteger)i
                    moduleID:(NSUInteger)moduleID
                    methodID:(NSUInteger)methodID
                      params:(NSArray *)params
{
  if (!_valid) {
    return NO;
  }

  if (RCT_DEBUG && ![params isKindOfClass:[NSArray class]]) {
    RCTLogError(@"Invalid module/method/params tuple for request #%zd", i);
    return NO;
  }

  RCTModuleData *moduleData = _moduleDataByID[moduleID];
  if (RCT_DEBUG && !moduleData) {
    RCTLogError(@"No module found for id '%zd'", moduleID);
    return NO;
  }

  id<RCTBridgeMethod> method = moduleData.methods[methodID];
  if (RCT_DEBUG && !method) {
    RCTLogError(@"Unknown methodID: %zd for module: %zd (%@)", methodID, moduleID, moduleData.name);
    return NO;
  }

  @try {
    [method invokeWithBridge:self module:moduleData.instance arguments:params];
  }
  @catch (NSException *exception) {
    // Pass on JS exceptions
    if ([exception.name hasPrefix:RCTFatalExceptionName]) {
      @throw exception;
    }

    NSString *message = [NSString stringWithFormat:
                         @"Exception '%@' was thrown while invoking %@ on target %@ with params %@",
                         exception, method.JSMethodName, moduleData.name, params];
    RCTFatal(RCTErrorWithMessage(message));
  }

  return YES;
}

- (void)startProfiling
{
  RCTAssertMainQueue();

  [_javaScriptExecutor executeBlockOnJavaScriptQueue:^{
    RCTProfileInit(self);
  }];
}

- (void)stopProfiling:(void (^)(NSData *))callback
{
  RCTAssertMainQueue();

  [_javaScriptExecutor executeBlockOnJavaScriptQueue:^{
    RCTProfileEnd(self, ^(NSString *log) {
      NSData *logData = [log dataUsingEncoding:NSUTF8StringEncoding];
      callback(logData);
    });
  }];
}

- (BOOL)isBatchActive
{
  return _wasBatchActive;
}

@end
