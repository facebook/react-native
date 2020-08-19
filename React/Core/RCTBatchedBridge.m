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
/// @brief 必须与 `MessageQueue.js` 保持同步
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
  /// @brief 所有创建的 RCTModuleData 实例集合，moduleData 的 uid 是以当前 `_moduleDataByID` 数组中元素个数为 uid（即 moduleID）
  NSMutableArray<RCTModuleData *> *_moduleDataByID;
  /// @brief 以 KV 的方式存储 modules，Key 为 moduleName，Value 为 module 实例
  RCTModuleMap *_modulesByName;
  CADisplayLink *_mainDisplayLink; // DEV 用
  CADisplayLink *_jsDisplayLink;
  /// @brief RCTModuleData 实例集合中遵守了 `RCTFrameUpdateObserver` 协议的实例
  NSMutableSet<RCTModuleData *> *_frameUpdateObservers;
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

    /**
     * Initialize and register bridge modules *before* adding the display link
     * so we don't have threading issues
     */
    [self registerModules];

    /**
     * If currently profiling, hook into the current instance
     */
    if (RCTProfileIsProfiling()) {
      RCTProfileHookModules(self);
    }

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

/// @method registerModules
/// @brief 所有 module 的创建及 RCTModuleData 的创建都在这里被完成
- (void)registerModules
{
  RCTAssertMainThread();

  // Register passed-in module instances
  // 注册初始化方法直接传入的 module 模块实例
  NSMutableDictionary *preregisteredModules = [[NSMutableDictionary alloc] init];
  for (id<RCTBridgeModule> module in self.moduleProvider ? self.moduleProvider() : nil) {
    preregisteredModules[RCTBridgeModuleNameForClass([module class])] = module;
  }

  // Instantiate modules
  // 初始化 modules，存储进 modulesByName 集合
  _moduleDataByID = [[NSMutableArray alloc] init];
  NSMutableDictionary *modulesByName = [preregisteredModules mutableCopy];
  for (Class moduleClass in RCTGetModuleClasses()) {
     NSString *moduleName = RCTBridgeModuleNameForClass(moduleClass);

     // Check if module instance has already been registered for this name
     id<RCTBridgeModule> module = modulesByName[moduleName];

     // 获取已有或创建 module
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
    
     // 存储进 modulesByName 集合
     if (module) {
       modulesByName[moduleName] = module;
     }
  }

  // Store modules
  // 创建 _modulesByName 存储 modules
  _modulesByName = [[RCTModuleMap alloc] initWithDictionary:modulesByName];

  /**
   * The executor is a bridge module, wait for it to be created and set it before
   * any other module has access to the bridge
   */
  // `- executorClass` 方法已经被重写，如果 `parentBridge` 没有设置 executorClass，则默认为 [RCTContextExecutor class]
  _javaScriptExecutor = _modulesByName[RCTBridgeModuleNameForClass(self.executorClass)];
  RCTLatestExecutor = _javaScriptExecutor;

  [_javaScriptExecutor setUp];

  // Set bridge
  // 创建 RCTModuleData 并
  for (id<RCTBridgeModule> module in _modulesByName.allValues) {
    if ([module respondsToSelector:@selector(setBridge:)]) {
      module.bridge = self;
    }

    // moduleData 的 uid 是以当前 `_moduleDataByID` 数组中元素个数为 uid（即 moduleID）
    RCTModuleData *moduleData = [[RCTModuleData alloc] initWithExecutor:_javaScriptExecutor
                                                                    uid:@(_moduleDataByID.count)
                                                               instance:module];
    [_moduleDataByID addObject:moduleData];

    if ([module conformsToProtocol:@protocol(RCTFrameUpdateObserver)]) {
      [_frameUpdateObservers addObject:moduleData];
    }
  }

  [[NSNotificationCenter defaultCenter] postNotificationName:RCTDidCreateNativeModules object:self];
}

/// @method initJS
/// @brief 向 JS 侧注入 module data 信息
- (void)initJS
{
  RCTAssertMainThread();

  // Inject module data into JS context
  
  // @NOTE: 这里需要重点关注
  // 向 JS 侧注入 module data 信息
  // 循环 _moduleDataByID 数组，把每一个 module 的 name 写进 `config` 字典，然后写进 Key 为 `remoteModuleConfig`
  // 的字典，并且序列化成 JSON，之后通过 `RCTJavaScriptExecutor` 注入到 JS 中名为 `__fbBatchedBridgeConfig` 的对象
  // 中，这样相当于告知了 JS 侧，OC 这边提供的 module 都有哪些，以及该 module 分别能够提供哪些方法，这些信息都存储在
  // `RCTModuleData` 的 `config` 属性当中
  NSMutableDictionary *config = [[NSMutableDictionary alloc] init];
  for (RCTModuleData *moduleData in _moduleDataByID) {
    // {'module-name': 'module-config'}
    // 其中 `moduleData.config` 的配置中保存着 moduleID、constants 及 methods（能向 JS 提供的所有方法） 等所有信息
    config[moduleData.name] = moduleData.config;
  }
  NSString *configJSON = RCTJSONStringify(@{
    @"remoteModuleConfig": config,
  }, NULL);
  [_javaScriptExecutor injectJSONText:configJSON
                  asGlobalObjectNamed:@"__fbBatchedBridgeConfig"
                             callback:^(NSError *error) {
    if (error) {
      [[RCTRedBox sharedInstance] showError:error];
    }
  }];

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
    // 加载应用 JS 脚本，如 demo 中的 main.jsbundle 文件，以此来真正启动 react-native 程序
    RCTProfileBeginEvent();
    RCTPerformanceLoggerStart(RCTPLScriptDownload);
    RCTJavaScriptLoader *loader = [[RCTJavaScriptLoader alloc] initWithBridge:self];
    [loader loadBundleAtURL:bundleURL onComplete:^(NSError *error, NSString *script) {
      RCTPerformanceLoggerEnd(RCTPLScriptDownload);
      RCTProfileEndEvent(@"JavaScript download", @"init,download", @[]);

      _loading = NO;
      if (!self.isValid) {
        return;
      }

      static BOOL shouldDismiss = NO;
      if (shouldDismiss) {
        [[RCTRedBox sharedInstance] dismiss];
      }
      static dispatch_once_t onceToken;
      dispatch_once(&onceToken, ^{
        shouldDismiss = YES;
      });

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

        // 加载应用程序 JS 脚本完成
        [self enqueueApplicationScript:script url:bundleURL onComplete:^(NSError *loadError) {

          if (loadError) {
            [[RCTRedBox sharedInstance] showError:loadError];
            return;
          }

          /**
           * Register the display link to start sending js calls after everything
           * is setup
           */
          // 启动一个 displayLink
          NSRunLoop *targetRunLoop = [_javaScriptExecutor isKindOfClass:[RCTContextExecutor class]] ? [NSRunLoop currentRunLoop] : [NSRunLoop mainRunLoop];
          [_jsDisplayLink addToRunLoop:targetRunLoop forMode:NSRunLoopCommonModes];

          [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptDidLoadNotification
                                                              object:_parentBridge
                                                            userInfo:@{ @"bridge": self }];
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

  // 这里只是做一个包装，在 JS 侧业务层实际处理的 module 和 method 应该是
  // 数组 ids 中的元素，即 ids[0] 和 ids[1]，分别对应 module 和 method，
  // `BatchedBridge` 在 JS 侧 BatchedBridge.js 文件中，为 `MessageQueue` 类型对象
  // `callFunctionReturnFlushedQueue` 在 JS 侧 MessageQueue.js 文件中，为出入口方法名称
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

  // `buckets`: key - moduleData，value - NSMutableOrderedSet<索引位置 i>
  NSMapTable *buckets = [[NSMapTable alloc] initWithKeyOptions:NSPointerFunctionsStrongMemory
                                                  valueOptions:NSPointerFunctionsStrongMemory
                                                      capacity:_moduleDataByID.count];
  for (NSUInteger i = 0; i < numRequests; i++) {
    RCTModuleData *moduleData = _moduleDataByID[[moduleIDs[i] integerValue]];
    if (RCT_DEBUG) {
      // verify that class has been registered
      (void)_modulesByName[moduleData.name];
    }
    // `set` 中保存的是当前遍历的索引位置 `i`
    NSMutableOrderedSet *set = [buckets objectForKey:moduleData];
    if (!set) {
      set = [[NSMutableOrderedSet alloc] init];
      [buckets setObject:set forKey:moduleData];
    }
    [set addObject:@(i)];
  }

  for (RCTModuleData *moduleData /* moduleData 为 key */ in buckets) {
    RCTProfileBeginFlowEvent();

    [moduleData dispatchBlock:^{
      RCTProfileEndFlowEvent();
      RCTProfileBeginEvent();

      // calls 为 value
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

/// @brief 找到对应的 RCTModuleMethod 实例，并执行相应操作
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

  // 根据 moduleID（即 moduleData 的 uid）获取对应的 moduleData 实例
  RCTModuleData *moduleData = _moduleDataByID[moduleID];
  if (RCT_DEBUG && !moduleData) {
    RCTLogError(@"No module found for id '%zd'", moduleID);
    return NO;
  }

  // 根据 methodID 在相应的 moduleData 实例中找到 method 实例
  RCTModuleMethod *method = moduleData.methods[methodID];
  if (RCT_DEBUG && !method) {
    RCTLogError(@"Unknown methodID: %zd for module: %zd (%@)", methodID, moduleID, moduleData.name);
    return NO;
  }

  @try {
    // 调用该 method
    [method invokeWithBridge:self module:moduleData.instance arguments:params];
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
  
  // 将屏幕刷新消息发送给所有订阅屏幕刷新协议的监听者
  for (RCTModuleData *moduleData in _frameUpdateObservers) {
    id<RCTFrameUpdateObserver> observer = (id<RCTFrameUpdateObserver>)moduleData.instance;
    if (![observer respondsToSelector:@selector(isPaused)] || ![observer isPaused]) {
      RCT_IF_DEV(NSString *name = [NSString stringWithFormat:@"[%@ didUpdateFrame:%f]", observer, displayLink.timestamp];)
      RCTProfileBeginFlowEvent();

      [moduleData dispatchBlock:^{
        RCTProfileEndFlowEvent();
        RCTProfileBeginEvent();
        // 向监听者（module 对象）发送屏幕刷新消息
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
    
    // https://blog.csdn.net/Baby_come_here/article/details/75797669
    // [calls valueForKey:@"js_args"] 会将数组 `calls` 中的元素中 Key 为
    // `js_args` 对应的 Value 取出并重新生成数组，具体值如下:
    // {
    //    @"module": module,
    //    @"method": method,
    //    @"args": args,
    // }
    [self _actuallyInvokeAndProcessModule:@"BatchedBridge"
                                   method:@"processBatch"
                                arguments:@[[calls valueForKey:@"js_args"]]];
  }

  RCTProfileEndEvent(@"DispatchFrameUpdate", @"objc_call", nil);

  dispatch_async(dispatch_get_main_queue(), ^{
    // 刷新 JS 执行线程帧率指示器
    [self.perfStats.jsGraph onTick:displayLink.timestamp];
  });
}

- (void)_mainThreadUpdate:(CADisplayLink *)displayLink
{
  RCTAssertMainThread();

  RCTProfileImmediateEvent(@"VSYNC", displayLink.timestamp, @"g");
  // 刷新主线程帧率指示器
  [self.perfStats.uiGraph onTick:displayLink.timestamp];
}

#pragma mark - Profiling Methods
- (void)startProfiling
{
  // 开始性能分析，完成分析工具的初始化
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
  // 停止性能分析，并上传收集结果
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
