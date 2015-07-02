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
  NSMutableArray *_modules;
  NSDictionary *_modulesByName;
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
    _modules = [[NSMutableArray alloc] init];
    _frameUpdateObservers = [[NSMutableSet alloc] init];
    _scheduledCalls = [[NSMutableArray alloc] init];
    _scheduledCallbacks = [[RCTSparseArray alloc] init];
    _jsDisplayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(_jsThreadUpdate:)];

    if (RCT_DEV) {
      _mainDisplayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(_mainThreadUpdate:)];
      [_mainDisplayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
    }

    /**
     * Initialize and register bridge modules *before* adding the display link
     * so we don't have threading issues
     */
    [self registerModules];

    /**
     * Start the application script
     */
    [self initJS];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-initWithBundleURL:(__unused NSURL *)bundleURL
                    moduleProvider:(__unused RCTBridgeModuleProviderBlock)block
                    launchOptions:(__unused NSDictionary *)launchOptions)

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

- (BOOL)isLoading
{
  return _loading;
}

- (BOOL)isValid
{
  return _valid;
}

- (void)registerModules
{
  RCTAssertMainThread();

  // Register passed-in module instances
  NSMutableDictionary *preregisteredModules = [[NSMutableDictionary alloc] init];
  for (id<RCTBridgeModule> module in self.moduleProvider ? self.moduleProvider() : nil) {
    preregisteredModules[RCTBridgeModuleNameForClass([module class])] = module;
  }

  // Instantiate modules
  _modules = [[NSMutableArray alloc] init];
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
  _modulesByName = [modulesByName copy];

  /**
   * The executor is a bridge module, wait for it to be created and set it before
   * any other module has access to the bridge
   */
  _javaScriptExecutor = _modulesByName[RCTBridgeModuleNameForClass(self.executorClass)];
  RCTLatestExecutor = _javaScriptExecutor;
  RCTSetExecutorID(_javaScriptExecutor);

  [_javaScriptExecutor setUp];

  // Set bridge
  for (id<RCTBridgeModule> module in _modulesByName.allValues) {
    if ([module respondsToSelector:@selector(setBridge:)]) {
      module.bridge = self;
    }

    RCTModuleData *moduleData = [[RCTModuleData alloc] initWithExecutor:_javaScriptExecutor
                                                                  uid:@(_modules.count)
                                                             instance:module];
    [_modules addObject:moduleData];

    if ([module conformsToProtocol:@protocol(RCTFrameUpdateObserver)]) {
      [_frameUpdateObservers addObject:moduleData];
    }
  }

  [[NSNotificationCenter defaultCenter] postNotificationName:RCTDidCreateNativeModules
                                                      object:self];
}

- (void)initJS
{
  RCTAssertMainThread();

  // Inject module data into JS context
  NSMutableDictionary *config = [[NSMutableDictionary alloc] init];
  for (RCTModuleData *moduleData in _modules) {
    config[moduleData.name] = moduleData.config;
  }
  NSString *configJSON = RCTJSONStringify(@{
    @"remoteModuleConfig": config,
  }, NULL);
  dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
  [_javaScriptExecutor injectJSONText:configJSON
                  asGlobalObjectNamed:@"__fbBatchedBridgeConfig" callback:
   ^(__unused id err) {
     dispatch_semaphore_signal(semaphore);
   }];

  dispatch_semaphore_wait(semaphore, DISPATCH_TIME_NOW);

  NSURL *bundleURL = _parentBridge.bundleURL;
  if (_javaScriptExecutor == nil) {

    /**
     * HACK (tadeu): If it failed to connect to the debugger, set loading to NO
     * so we can attempt to reload again.
     */
    _loading = NO;

  } else if (!bundleURL) {

    // Allow testing without a script
    dispatch_async(dispatch_get_main_queue(), ^{
      _loading = NO;
      [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptDidLoadNotification
                                                          object:_parentBridge
                                                        userInfo:@{ @"bridge": self }];
    });
  } else {

    RCTProfileBeginEvent();
    RCTPerformanceLoggerStart(RCTPLScriptDownload);
    RCTJavaScriptLoader *loader = [[RCTJavaScriptLoader alloc] initWithBridge:self];
    [loader loadBundleAtURL:bundleURL onComplete:^(NSError *error, NSString *script) {
      RCTPerformanceLoggerEnd(RCTPLScriptDownload);
      RCTProfileEndEvent(@"JavaScript dowload", @"init,download", @[]);

      _loading = NO;
      if (!self.isValid) {
        return;
      }

      [[RCTRedBox sharedInstance] dismiss];

      RCTSourceCode *sourceCodeModule = self.modules[RCTBridgeModuleNameForClass([RCTSourceCode class])];
      sourceCodeModule.scriptURL = bundleURL;
      sourceCodeModule.scriptText = script;
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

      } else {

        [self enqueueApplicationScript:script url:bundleURL onComplete:^(NSError *loadError) {

          if (!loadError) {

            /**
             * Register the display link to start sending js calls after everything
             * is setup
             */
            NSRunLoop *targetRunLoop = [_javaScriptExecutor isKindOfClass:[RCTContextExecutor class]] ? [NSRunLoop currentRunLoop] : [NSRunLoop mainRunLoop];
            [_jsDisplayLink addToRunLoop:targetRunLoop forMode:NSRunLoopCommonModes];

            [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptDidLoadNotification
                                                                object:_parentBridge
                                                              userInfo:@{ @"bridge": self }];
          } else {
            [[RCTRedBox sharedInstance] showErrorMessage:[loadError localizedDescription]
                                             withDetails:[loadError localizedFailureReason]];
          }
        }];
      }
    }];
  }
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

  void (^mainThreadInvalidate)(void) = ^{
    RCTAssertMainThread();

    [_mainDisplayLink invalidate];
    _mainDisplayLink = nil;

    // Invalidate modules
    dispatch_group_t group = dispatch_group_create();
    for (RCTModuleData *moduleData in _modules) {
      if ([moduleData.instance respondsToSelector:@selector(invalidate)]) {
        [moduleData dispatchBlock:^{
          [(id<RCTInvalidating>)moduleData.instance invalidate];
        } dispatchGroup:group];
      }
      moduleData.queue = nil;
    }
    dispatch_group_notify(group, dispatch_get_main_queue(), ^{
      _modules = nil;
      _modulesByName = nil;
      _frameUpdateObservers = nil;
    });
  };

  if (!_javaScriptExecutor) {

    // No JS thread running
    mainThreadInvalidate();
    return;
  }

  [_javaScriptExecutor executeBlockOnJavaScriptQueue:^{

    /**
     * JS Thread deallocations
     */
    [_javaScriptExecutor invalidate];
    _javaScriptExecutor = nil;

    [_jsDisplayLink invalidate];
    _jsDisplayLink = nil;

    /**
     * Main Thread deallocations
     */
    dispatch_async(dispatch_get_main_queue(), mainThreadInvalidate);

  }];
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
                      arguments:@[ids[0], ids[1], args ?: @[]]
                        context:RCTGetExecutorID(_javaScriptExecutor)];
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
                                arguments:@[@"JSTimersExecution", @"callTimers", @[@[timer]]]
                                  context:RCTGetExecutorID(_javaScriptExecutor)];
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
    NSNumber *context = RCTGetExecutorID(_javaScriptExecutor);
    [_javaScriptExecutor executeJSCall:@"BatchedBridge"
                                method:@"flushedQueue"
                             arguments:@[]
                               context:context
                              callback:^(id json, NSError *error) {
                                RCTProfileEndEvent(@"FetchApplicationScriptCallbacks", @"js_call,init", @{
                                  @"json": RCTNullIfNil(json),
                                  @"error": RCTNullIfNil(error),
                                });

                                [self _handleBuffer:json context:context];

                                onComplete(error);
                              }];
  }];
}

#pragma mark - Payload Generation

/**
 * TODO: Completely remove `context` - no longer needed
 */
- (void)_invokeAndProcessModule:(NSString *)module method:(NSString *)method arguments:(NSArray *)args
{
  [self _invokeAndProcessModule:module
                         method:method
                      arguments:args
                        context:RCTGetExecutorID(_javaScriptExecutor)];
}

/**
 * Called by enqueueJSCall from any thread, or from _immediatelyCallTimer,
 * on the JS thread, but only in non-batched mode.
 */
- (void)_invokeAndProcessModule:(NSString *)module method:(NSString *)method arguments:(NSArray *)args context:(NSNumber *)context
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
      @"context": context ?: @0,
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

- (void)_actuallyInvokeAndProcessModule:(NSString *)module method:(NSString *)method arguments:(NSArray *)args context:(NSNumber *)context
{
  RCTAssertJSThread();

  [[NSNotificationCenter defaultCenter] postNotificationName:RCTEnqueueNotification object:nil userInfo:nil];

  RCTJavaScriptCallback processResponse = ^(id json, __unused NSError *error) {
    if (!self.isValid) {
      return;
    }
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTDequeueNotification object:nil userInfo:nil];
    [self _handleBuffer:json context:context];
  };

  [_javaScriptExecutor executeJSCall:module
                              method:method
                           arguments:args
                             context:context
                            callback:processResponse];
}

#pragma mark - Payload Processing

- (void)_handleBuffer:(id)buffer context:(NSNumber *)context
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

  NSMapTable *buckets = [[NSMapTable alloc] initWithKeyOptions:NSPointerFunctionsStrongMemory valueOptions:NSPointerFunctionsStrongMemory capacity:_modules.count];
  for (NSUInteger i = 0; i < numRequests; i++) {
    RCTModuleData *moduleData = _modules[[moduleIDs[i] integerValue]];
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
                              params:paramsArrays[index]
                             context:context];
        }
      }
 RCTProfileEndEvent(RCTCurrentThreadName(), @"objc_call,dispatch_async", @{ @"calls": @(calls.count) });
    }];
  }

  // TODO: batchDidComplete is only used by RCTUIManager - can we eliminate this special case?
  for (RCTModuleData *moduleData in _modules) {
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
                     context:(NSNumber *)context
{
  if (!self.isValid) {
    return NO;
  }

  if (RCT_DEBUG && ![params isKindOfClass:[NSArray class]]) {
    RCTLogError(@"Invalid module/method/params tuple for request #%zd", i);
    return NO;
  }


  RCTProfileBeginEvent();

  RCTModuleData *moduleData = _modules[moduleID];
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
    [method invokeWithBridge:self module:moduleData.instance arguments:params context:context];
  }
  @catch (NSException *exception) {
    RCTLogError(@"Exception thrown while invoking %@ on target %@ with params %@: %@", method.JSMethodName, moduleData.name, params, exception);
    if (!RCT_DEBUG && [exception.name rangeOfString:@"Unhandled JS Exception"].location != NSNotFound) {
      @throw exception;
    }
  }

  RCTProfileEndEvent(@"Invoke callback", @"objc_call", @{
    @"module": method.moduleClassName,
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
  NSNumber *currentExecutorID = RCTGetExecutorID(_javaScriptExecutor);
  calls = [calls filteredArrayUsingPredicate:
           [NSPredicate predicateWithBlock:
            ^BOOL(NSDictionary *call, __unused NSDictionary *bindings) {
    return [call[@"context"] isEqualToNumber:currentExecutorID];
  }]];

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
                                arguments:@[[calls valueForKey:@"js_args"]]
                                  context:RCTGetExecutorID(_javaScriptExecutor)];
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

  [self.perfStats.uiGraph onTick:displayLink.timestamp];
}

- (void)startProfiling
{
  RCTAssertMainThread();

  if (![_parentBridge.bundleURL.scheme isEqualToString:@"http"]) {
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
    NSURL *bundleURL = _parentBridge.bundleURL;
    NSString *URLString = [NSString stringWithFormat:@"%@://%@:%@/profile", bundleURL.scheme, bundleURL.host, bundleURL.port];
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
