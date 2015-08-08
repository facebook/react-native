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
#import "RCTConvert.h"
#import "RCTContextExecutor.h"
#import "RCTFrameUpdate.h"
#import "RCTJavaScriptLoader.h"
#import "RCTLog.h"
#import "RCTModuleData.h"
#import "RCTModuleMap.h"
#import "RCTModuleMethod.h"
#import "RCTPerformanceLogger.h"
#import "RCTPerfStats.h"
#import "RCTProfile.h"
#import "RCTRedBox.h"
#import "RCTSourceCode.h"
#import "RCTSparseArray.h"
#import "RCTUtils.h"

#define RCTAssertJSThread() \
  RCTAssert(![NSStringFromClass([_javaScriptExecutor class]) isEqualToString:@"RCTContextExecutor"] || \
              [[[NSThread currentThread] name] isEqualToString:@"com.facebook.React.JavaScript"], \
            @"This method must be called on JS thread")

NSString *const RCTEnqueueNotification = @"RCTEnqueueNotification";
NSString *const RCTDequeueNotification = @"RCTDequeueNotification";

/**
 * Must be kept in sync with `MessageQueue.js`.
 */
typedef NS_ENUM(NSUInteger, RCTBridgeFields) {
  RCTBridgeFieldRequestModuleIDs = 0,
  RCTBridgeFieldMethodIDs,
  RCTBridgeFieldParamss,
};

RCT_EXTERN NSArray *RCTGetModuleClasses(void);

static id<RCTJavaScriptExecutor> RCTLatestExecutor = nil;
id<RCTJavaScriptExecutor> RCTGetLatestExecutor(void);
id<RCTJavaScriptExecutor> RCTGetLatestExecutor(void)
{
  return RCTLatestExecutor;
}

@interface RCTBatchedBridge : RCTBridge

@property (nonatomic, weak) RCTBridge *parentBridge;

@end

@implementation RCTBatchedBridge
{
  BOOL _loading;
  __weak id<RCTJavaScriptExecutor> _javaScriptExecutor;
  NSMutableArray *_moduleDataByID;
  RCTModuleMap *_modulesByName;
  CADisplayLink *_mainDisplayLink;
  CADisplayLink *_jsDisplayLink;
  NSMutableSet *_frameUpdateObservers;
  NSMutableArray *_scheduledCalls;
  RCTSparseArray *_scheduledCallbacks;
}

@synthesize valid = _valid;

- (instancetype)initWithParentBridge:(RCTBridge *)bridge
{
  RCTAssertMainThread();
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
    _moduleDataByID = [[NSMutableArray alloc] init];
    _frameUpdateObservers = [[NSMutableSet alloc] init];
    _scheduledCalls = [[NSMutableArray alloc] init];
    _scheduledCallbacks = [[RCTSparseArray alloc] init];
    _jsDisplayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(_jsThreadUpdate:)];

    if (RCT_DEV) {
      _mainDisplayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(_mainThreadUpdate:)];
      [_mainDisplayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
    }


    [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptWillStartLoadingNotification
                                                        object:self
                                                      userInfo:@{ @"bridge": self }];

    [self start];
  }
  return self;
}

- (void)start
{
  __weak RCTBatchedBridge *weakSelf = self;

  __block NSString *sourceCode;
  __block NSString *config;

  dispatch_queue_t bridgeQueue = dispatch_queue_create("com.facebook.react.RCTBridgeQueue", DISPATCH_QUEUE_CONCURRENT);
  dispatch_group_t initModulesAndLoadSource = dispatch_group_create();

  dispatch_group_enter(initModulesAndLoadSource);
  [weakSelf loadSource:^(NSError *error, NSString *source) {
    if (error) {
      RCTLogError(@"%@", error);
    } else {
      sourceCode = source;
    }

    dispatch_group_leave(initModulesAndLoadSource);
  }];

  [self initModules];

  dispatch_group_enter(initModulesAndLoadSource);
  dispatch_async(bridgeQueue, ^{
    dispatch_group_t setupJSExecutorAndModuleConfig = dispatch_group_create();
    dispatch_group_async(setupJSExecutorAndModuleConfig, bridgeQueue, ^{
      [weakSelf setupExecutor];
    });

    dispatch_group_async(setupJSExecutorAndModuleConfig, bridgeQueue, ^{
      if (weakSelf.isValid) {
        config = [weakSelf moduleConfig];

        if (RCTProfileIsProfiling()) {
          RCTProfileHookModules(weakSelf);
        }
      }
    });

    dispatch_group_notify(setupJSExecutorAndModuleConfig, bridgeQueue, ^{
      [weakSelf injectJSONConfiguration:config onComplete:^(__unused NSError *error) {}];

      dispatch_group_leave(initModulesAndLoadSource);
    });
  });

  dispatch_group_notify(initModulesAndLoadSource, bridgeQueue, ^{
    if (sourceCode) {
      [weakSelf executeSourceCode:sourceCode];
    }
  });
}

- (void)loadSource:(RCTSourceLoadBlock)_onSourceLoad
{
    RCTPerformanceLoggerStart(RCTPLScriptDownload);
    RCTProfileBeginEvent();

    RCTSourceLoadBlock onSourceLoad = ^(NSError *error, NSString *source) {
      RCTPerformanceLoggerEnd(RCTPLScriptDownload);
      RCTProfileEndEvent(@"JavaScript download", @"init,download", @[]);

      if (error) {
        NSArray *stack = [error userInfo][@"stack"];
        if (stack) {
          [[RCTRedBox sharedInstance] showErrorMessage:[error localizedDescription]
                                             withStack:stack];
        } else {
          [[RCTRedBox sharedInstance] showErrorMessage:[error localizedDescription]
                                           withDetails:[error localizedFailureReason]];
        }

        NSDictionary *userInfo = @{@"bridge": self, @"error": error};
        [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptDidFailToLoadNotification
                                                            object:_parentBridge
                                                          userInfo:userInfo];
      }

      _onSourceLoad(error, source);
    };

    if ([self.delegate respondsToSelector:@selector(loadSourceForBridge:withBlock:)]) {
      [self.delegate loadSourceForBridge:_parentBridge withBlock:onSourceLoad];
    } else if (self.bundleURL) {
      [RCTJavaScriptLoader loadBundleAtURL:self.bundleURL onComplete:onSourceLoad];
    } else {
      // Allow testing without a script
      dispatch_async(dispatch_get_main_queue(), ^{
        _loading = NO;
        [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptDidLoadNotification
                                                            object:_parentBridge
                                                          userInfo:@{ @"bridge": self }];
      });
      onSourceLoad(nil, nil);
    }
}

- (void)initModules
{
  RCTAssertMainThread();

  // Register passed-in module instances
  NSMutableDictionary *preregisteredModules = [[NSMutableDictionary alloc] init];

  NSArray *extraModules = nil;
  if (self.delegate) {
    if ([self.delegate respondsToSelector:@selector(extraModulesForBridge:)]) {
      extraModules = [self.delegate extraModulesForBridge:_parentBridge];
    }
  } else if (self.moduleProvider) {
    extraModules = self.moduleProvider();
  }

  for (id<RCTBridgeModule> module in extraModules) {
    preregisteredModules[RCTBridgeModuleNameForClass([module class])] = module;
  }

  // Instantiate modules
  _moduleDataByID = [[NSMutableArray alloc] init];
  NSMutableDictionary *modulesByName = [preregisteredModules mutableCopy];
  for (Class moduleClass in RCTGetModuleClasses()) {
     NSString *moduleName = RCTBridgeModuleNameForClass(moduleClass);

     // Check if module instance has already been registered for this name
     id<RCTBridgeModule> module = modulesByName[moduleName];

     if (module) {
       // Preregistered instances takes precedence, no questions asked
       if (!preregisteredModules[moduleName]) {
         // It's OK to have a name collision as long as the second instance is nil
         RCTAssert([[moduleClass alloc] init] == nil,
                   @"Attempted to register RCTBridgeModule class %@ for the name "
                   "'%@', but name was already registered by class %@", moduleClass,
                   moduleName, [modulesByName[moduleName] class]);
       }
       if ([module class] != moduleClass) {
         RCTLogInfo(@"RCTBridgeModule of class %@ with name '%@' was encountered "
                    "in the project, but name was already registered by class %@."
                    "That's fine if it's intentional - just letting you know.",
                    moduleClass, moduleName, [modulesByName[moduleName] class]);
       }
     } else {
       // Module name hasn't been used before, so go ahead and instantiate
       module = [[moduleClass alloc] init];
     }
     if (module) {
       modulesByName[moduleName] = module;
     }
  }

  // Store modules
  _modulesByName = [[RCTModuleMap alloc] initWithDictionary:modulesByName];

  /**
   * The executor is a bridge module, wait for it to be created and set it before
   * any other module has access to the bridge
   */
  _javaScriptExecutor = _modulesByName[RCTBridgeModuleNameForClass(self.executorClass)];
  RCTLatestExecutor = _javaScriptExecutor;

  for (id<RCTBridgeModule> module in _modulesByName.allValues) {

    // Bridge must be set before moduleData is set up, as methodQueue
    // initialization requires it (View Managers get their queue by calling
    // self.bridge.uiManager.methodQueue)
    if ([module respondsToSelector:@selector(setBridge:)]) {
      module.bridge = self;
    }

    RCTModuleData *moduleData = [[RCTModuleData alloc] initWithExecutor:_javaScriptExecutor
                                                               moduleID:@(_moduleDataByID.count)
                                                               instance:module];
    [_moduleDataByID addObject:moduleData];
  }

  [[NSNotificationCenter defaultCenter] postNotificationName:RCTDidCreateNativeModules
                                                      object:self];
}


- (void)setupExecutor
{
  [_javaScriptExecutor setUp];

}

- (NSString *)moduleConfig
{
  NSMutableDictionary *config = [[NSMutableDictionary alloc] init];
  for (RCTModuleData *moduleData in _moduleDataByID) {
    config[moduleData.name] = moduleData.config;
    if ([moduleData.instance conformsToProtocol:@protocol(RCTFrameUpdateObserver)]) {
      [_frameUpdateObservers addObject:moduleData];
    }
  }

  return RCTJSONStringify(@{
    @"remoteModuleConfig": config,
  }, NULL);
}

- (void)injectJSONConfiguration:(NSString *)configJSON
                     onComplete:(void (^)(NSError *))onComplete
{
  if (!self.isValid) {
    return;
  }

  [_javaScriptExecutor injectJSONText:configJSON
                  asGlobalObjectNamed:@"__fbBatchedBridgeConfig"
                             callback:^(NSError *error) {
    if (error) {
      [[RCTRedBox sharedInstance] showError:error];
    }
    onComplete(error);
  }];
}

- (void)executeSourceCode:(NSString *)sourceCode
{
  _loading = NO;

  if (!self.isValid || !_javaScriptExecutor) {
    return;
  }

  RCTSourceCode *sourceCodeModule = self.modules[RCTBridgeModuleNameForClass([RCTSourceCode class])];
  sourceCodeModule.scriptURL = self.bundleURL;
  sourceCodeModule.scriptText = sourceCode;

  static BOOL shouldDismiss = NO;
  if (shouldDismiss) {
    [[RCTRedBox sharedInstance] dismiss];
  }
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    shouldDismiss = YES;
  });

  [self enqueueApplicationScript:sourceCode url:self.bundleURL onComplete:^(NSError *loadError) {

    if (loadError) {
      [[RCTRedBox sharedInstance] showError:loadError];
      return;
    }

    /**
     * Register the display link to start sending js calls after everything
     * is setup
     */
    NSRunLoop *targetRunLoop = [_javaScriptExecutor isKindOfClass:[RCTContextExecutor class]] ? [NSRunLoop currentRunLoop] : [NSRunLoop mainRunLoop];
    [_jsDisplayLink addToRunLoop:targetRunLoop forMode:NSRunLoopCommonModes];

    [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptDidLoadNotification
                                                        object:_parentBridge
                                                      userInfo:@{ @"bridge": self }];
  }];
}


RCT_NOT_IMPLEMENTED(-initWithBundleURL:(__unused NSURL *)bundleURL
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
  return _parentBridge.executorClass ?: [RCTContextExecutor class];
}

- (void)setExecutorClass:(Class)executorClass
{
  RCTAssertMainThread();

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

- (NSDictionary *)modules
{
  RCTAssert(!self.isValid || _modulesByName != nil, @"Bridge modules have not yet been initialized. "
            "You may be trying to access a module too early in the startup procedure.");

  return _modulesByName;
}

#pragma mark - RCTInvalidating

- (void)invalidate
{
  if (!self.isValid) {
    return;
  }

  RCTAssertMainThread();

  _valid = NO;
  if (RCTLatestExecutor == _javaScriptExecutor) {
    RCTLatestExecutor = nil;
  }

  [_mainDisplayLink invalidate];
  _mainDisplayLink = nil;

  // Invalidate modules
  dispatch_group_t group = dispatch_group_create();
  for (RCTModuleData *moduleData in _moduleDataByID) {
    if (moduleData.instance == _javaScriptExecutor) {
      continue;
    }

    if ([moduleData.instance respondsToSelector:@selector(invalidate)]) {
      [moduleData dispatchBlock:^{
        [(id<RCTInvalidating>)moduleData.instance invalidate];
      } dispatchGroup:group];
    }
    moduleData.queue = nil;
  }

  dispatch_group_notify(group, dispatch_get_main_queue(), ^{
    [_javaScriptExecutor executeBlockOnJavaScriptQueue:^{
      [_jsDisplayLink invalidate];
      _jsDisplayLink = nil;

      [_javaScriptExecutor invalidate];
      _javaScriptExecutor = nil;

      if (RCTProfileIsProfiling()) {
        RCTProfileUnhookModules(self);
      }
      _moduleDataByID = nil;
      _modulesByName = nil;
      _frameUpdateObservers = nil;

    }];
  });
}

#pragma mark - RCTBridge methods

/**
 * Public. Can be invoked from any thread.
 */
- (void)enqueueJSCall:(NSString *)moduleDotMethod args:(NSArray *)args
{
  NSArray *ids = [moduleDotMethod componentsSeparatedByString:@"."];

  [self _invokeAndProcessModule:@"BatchedBridge"
                         method:@"callFunctionReturnFlushedQueue"
                      arguments:@[ids[0], ids[1], args ?: @[]]];
}

/**
 * Private hack to support `setTimeout(fn, 0)`
 */
- (void)_immediatelyCallTimer:(NSNumber *)timer
{
  RCTAssertJSThread();

  dispatch_block_t block = ^{
    [self _actuallyInvokeAndProcessModule:@"BatchedBridge"
                                   method:@"callFunctionReturnFlushedQueue"
                                arguments:@[@"JSTimersExecution", @"callTimers", @[@[timer]]]];
  };

  if ([_javaScriptExecutor respondsToSelector:@selector(executeAsyncBlockOnJavaScriptQueue:)]) {
    [_javaScriptExecutor executeAsyncBlockOnJavaScriptQueue:block];
  } else {
    [_javaScriptExecutor executeBlockOnJavaScriptQueue:block];
  }
}

- (void)enqueueApplicationScript:(NSString *)script url:(NSURL *)url onComplete:(RCTJavaScriptCompleteBlock)onComplete
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

    RCTProfileBeginEvent();
    [_javaScriptExecutor executeJSCall:@"BatchedBridge"
                                method:@"flushedQueue"
                             arguments:@[]
                              callback:^(id json, NSError *error) {
                                RCTProfileEndEvent(@"FetchApplicationScriptCallbacks", @"js_call,init", @{
                                  @"json": RCTNullIfNil(json),
                                  @"error": RCTNullIfNil(error),
                                });

                                [self _handleBuffer:json];

                                onComplete(error);
                              }];
  }];
}

#pragma mark - Payload Generation

/**
 * Called by enqueueJSCall from any thread, or from _immediatelyCallTimer,
 * on the JS thread, but only in non-batched mode.
 */
- (void)_invokeAndProcessModule:(NSString *)module method:(NSString *)method arguments:(NSArray *)args
{
  /**
   * AnyThread
   */

  RCTProfileBeginFlowEvent();

  __weak RCTBatchedBridge *weakSelf = self;
  [_javaScriptExecutor executeBlockOnJavaScriptQueue:^{
    RCTProfileEndFlowEvent();
    RCTProfileBeginEvent();

    RCTBatchedBridge *strongSelf = weakSelf;
    if (!strongSelf.isValid || !strongSelf->_scheduledCallbacks || !strongSelf->_scheduledCalls) {
      return;
    }


    RCT_IF_DEV(NSNumber *callID = _RCTProfileBeginFlowEvent();)
    id call = @{
      @"js_args": @{
        @"module": module,
        @"method": method,
        @"args": args,
      },
      RCT_IF_DEV(@"call_id": callID,)
    };
    if ([method isEqualToString:@"invokeCallbackAndReturnFlushedQueue"]) {
      strongSelf->_scheduledCallbacks[args[0]] = call;
    } else {
      [strongSelf->_scheduledCalls addObject:call];
    }

    RCTProfileEndEvent(@"enqueue_call", @"objc_call", call);
  }];
}

- (void)_actuallyInvokeAndProcessModule:(NSString *)module method:(NSString *)method arguments:(NSArray *)args
{
  RCTAssertJSThread();

  [[NSNotificationCenter defaultCenter] postNotificationName:RCTEnqueueNotification object:nil userInfo:nil];

  RCTJavaScriptCallback processResponse = ^(id json, NSError *error) {
    if (error) {
      [[RCTRedBox sharedInstance] showError:error];
    }

    if (!self.isValid) {
      return;
    }
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTDequeueNotification object:nil userInfo:nil];
    [self _handleBuffer:json];
  };

  [_javaScriptExecutor executeJSCall:module
                              method:method
                           arguments:args
                            callback:processResponse];
}

#pragma mark - Payload Processing

- (void)_handleBuffer:(id)buffer
{
  RCTAssertJSThread();

  if (buffer == nil || buffer == (id)kCFNull) {
    return;
  }

  NSArray *requestsArray = [RCTConvert NSArray:buffer];

#if RCT_DEBUG

  if (![buffer isKindOfClass:[NSArray class]]) {
    RCTLogError(@"Buffer must be an instance of NSArray, got %@", NSStringFromClass([buffer class]));
    return;
  }

  for (NSUInteger fieldIndex = RCTBridgeFieldRequestModuleIDs; fieldIndex <= RCTBridgeFieldParamss; fieldIndex++) {
    id field = [requestsArray objectAtIndex:fieldIndex];
    if (![field isKindOfClass:[NSArray class]]) {
      RCTLogError(@"Field at index %zd in buffer must be an instance of NSArray, got %@", fieldIndex, NSStringFromClass([field class]));
      return;
    }
  }

#endif

  NSArray *moduleIDs = requestsArray[RCTBridgeFieldRequestModuleIDs];
  NSArray *methodIDs = requestsArray[RCTBridgeFieldMethodIDs];
  NSArray *paramsArrays = requestsArray[RCTBridgeFieldParamss];

  NSUInteger numRequests = [moduleIDs count];

  if (RCT_DEBUG && (numRequests != methodIDs.count || numRequests != paramsArrays.count)) {
    RCTLogError(@"Invalid data message - all must be length: %zd", numRequests);
    return;
  }

  NSMapTable *buckets = [[NSMapTable alloc] initWithKeyOptions:NSPointerFunctionsStrongMemory
                                                  valueOptions:NSPointerFunctionsStrongMemory
                                                      capacity:_moduleDataByID.count];
  for (NSUInteger i = 0; i < numRequests; i++) {
    RCTModuleData *moduleData = _moduleDataByID[[moduleIDs[i] integerValue]];
    if (RCT_DEBUG) {
      // verify that class has been registered
      (void)_modulesByName[moduleData.name];
    }
    NSMutableOrderedSet *set = [buckets objectForKey:moduleData];
    if (!set) {
      set = [[NSMutableOrderedSet alloc] init];
      [buckets setObject:set forKey:moduleData];
    }
    [set addObject:@(i)];
  }

  for (RCTModuleData *moduleData in buckets) {
    RCTProfileBeginFlowEvent();

    [moduleData dispatchBlock:^{
      RCTProfileEndFlowEvent();
      RCTProfileBeginEvent();

      NSOrderedSet *calls = [buckets objectForKey:moduleData];
      @autoreleasepool {
        for (NSNumber *indexObj in calls) {
          NSUInteger index = indexObj.unsignedIntegerValue;
          [self _handleRequestNumber:index
                            moduleID:[moduleIDs[index] integerValue]
                            methodID:[methodIDs[index] integerValue]
                              params:paramsArrays[index]];
        }
      }

      RCTProfileEndEvent(RCTCurrentThreadName(), @"objc_call,dispatch_async", @{ @"calls": @(calls.count) });
    }];
  }

  // TODO: batchDidComplete is only used by RCTUIManager - can we eliminate this special case?
  for (RCTModuleData *moduleData in _moduleDataByID) {
    if ([moduleData.instance respondsToSelector:@selector(batchDidComplete)]) {
      [moduleData dispatchBlock:^{
        [moduleData.instance batchDidComplete];
      }];
    }
  }
}

- (BOOL)_handleRequestNumber:(NSUInteger)i
                    moduleID:(NSUInteger)moduleID
                    methodID:(NSUInteger)methodID
                      params:(NSArray *)params
{
  if (!self.isValid) {
    return NO;
  }

  if (RCT_DEBUG && ![params isKindOfClass:[NSArray class]]) {
    RCTLogError(@"Invalid module/method/params tuple for request #%zd", i);
    return NO;
  }

  RCTProfileBeginEvent();

  RCTModuleData *moduleData = _moduleDataByID[moduleID];
  if (RCT_DEBUG && !moduleData) {
    RCTLogError(@"No module found for id '%zd'", moduleID);
    return NO;
  }

  RCTModuleMethod *method = moduleData.methods[methodID];
  if (RCT_DEBUG && !method) {
    RCTLogError(@"Unknown methodID: %zd for module: %zd (%@)", methodID, moduleID, moduleData.name);
    return NO;
  }

  @try {
    [method invokeWithBridge:self module:moduleData.instance arguments:params];
  }
  @catch (NSException *exception) {
    RCTLogError(@"Exception thrown while invoking %@ on target %@ with params %@: %@", method.JSMethodName, moduleData.name, params, exception);
    if (!RCT_DEBUG && [exception.name rangeOfString:@"Unhandled JS Exception"].location != NSNotFound) {
      @throw exception;
    }
  }

  RCTProfileEndEvent(@"Invoke callback", @"objc_call", @{
    @"module": NSStringFromClass(method.moduleClass),
    @"method": method.JSMethodName,
    @"selector": NSStringFromSelector(method.selector),
    @"args": RCTJSONStringify(RCTNullIfNil(params), NULL),
  });

  return YES;
}

- (void)_jsThreadUpdate:(CADisplayLink *)displayLink
{
  RCTAssertJSThread();
  RCTProfileBeginEvent();

  RCTFrameUpdate *frameUpdate = [[RCTFrameUpdate alloc] initWithDisplayLink:displayLink];
  for (RCTModuleData *moduleData in _frameUpdateObservers) {
    id<RCTFrameUpdateObserver> observer = (id<RCTFrameUpdateObserver>)moduleData.instance;
    if (![observer respondsToSelector:@selector(isPaused)] || ![observer isPaused]) {
      RCT_IF_DEV(NSString *name = [NSString stringWithFormat:@"[%@ didUpdateFrame:%f]", observer, displayLink.timestamp];)
      RCTProfileBeginFlowEvent();

      [moduleData dispatchBlock:^{
        RCTProfileEndFlowEvent();
        RCTProfileBeginEvent();
        [observer didUpdateFrame:frameUpdate];
        RCTProfileEndEvent(name, @"objc_call,fps", nil);
      }];
    }
  }

  NSArray *calls = [_scheduledCallbacks.allObjects arrayByAddingObjectsFromArray:_scheduledCalls];

  RCT_IF_DEV(
    RCTProfileImmediateEvent(@"JS Thread Tick", displayLink.timestamp, @"g");

    for (NSDictionary *call in calls) {
      _RCTProfileEndFlowEvent(call[@"call_id"]);
    }
  )

  if (calls.count > 0) {
    _scheduledCalls = [[NSMutableArray alloc] init];
    _scheduledCallbacks = [[RCTSparseArray alloc] init];
    [self _actuallyInvokeAndProcessModule:@"BatchedBridge"
                                   method:@"processBatch"
                                arguments:@[[calls valueForKey:@"js_args"]]];
  }

  RCTProfileEndEvent(@"DispatchFrameUpdate", @"objc_call", nil);

  dispatch_async(dispatch_get_main_queue(), ^{
    [self.perfStats.jsGraph onTick:displayLink.timestamp];
  });
}

- (void)_mainThreadUpdate:(CADisplayLink *)displayLink
{
  RCTAssertMainThread();

  RCTProfileImmediateEvent(@"VSYNC", displayLink.timestamp, @"g");

  _modulesByName == nil ?: [self.perfStats.uiGraph onTick:displayLink.timestamp];
}

- (void)startProfiling
{
  RCTAssertMainThread();

  if (![self.bundleURL.scheme isEqualToString:@"http"]) {
    RCTLogError(@"To run the profiler you must be running from the dev server");
    return;
  }

  [_javaScriptExecutor executeBlockOnJavaScriptQueue:^{
    RCTProfileInit(self);
  }];
}

- (void)stopProfiling
{
  RCTAssertMainThread();

  [_javaScriptExecutor executeBlockOnJavaScriptQueue:^{
    NSString *log = RCTProfileEnd(self);
    NSString *URLString = [NSString stringWithFormat:@"%@://%@:%@/profile", self.bundleURL.scheme, self.bundleURL.host, self.bundleURL.port];
    NSURL *URL = [NSURL URLWithString:URLString];
    NSMutableURLRequest *URLRequest = [NSMutableURLRequest requestWithURL:URL];
    URLRequest.HTTPMethod = @"POST";
    [URLRequest setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
    NSURLSessionTask *task =
    [[NSURLSession sharedSession] uploadTaskWithRequest:URLRequest
                                               fromData:[log dataUsingEncoding:NSUTF8StringEncoding]
                                      completionHandler:
     ^(__unused NSData *data, __unused NSURLResponse *response, NSError *error) {
       if (error) {
         RCTLogError(@"%@", error.localizedDescription);
       } else {
         dispatch_async(dispatch_get_main_queue(), ^{
           [[[UIAlertView alloc] initWithTitle:@"Profile"
                                       message:@"The profile has been generated, check the dev server log for instructions."
                                      delegate:nil
                             cancelButtonTitle:@"OK"
                             otherButtonTitles:nil] show];
         });
       }
     }];

    [task resume];
  }];
}

@end
