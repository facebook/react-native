// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTBridge.h"

#import <objc/message.h>

#import "RCTModuleMethod.h"
#import "RCTInvalidating.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTModuleIDs.h"
#import "RCTTiming.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"

NSString *RCTModuleName(Class moduleClass)
{
  if ([moduleClass respondsToSelector:@selector(moduleName)]) {
    
    return [moduleClass moduleName];
    
  } else {
  
    // Default implementation, works in most cases
    NSString *className = NSStringFromClass(moduleClass);
    
    // TODO: be more consistent with naming so that this check isn't needed
    if ([moduleClass conformsToProtocol:@protocol(RCTNativeViewModule)]) {
      if ([className hasPrefix:@"RCTUI"]) {
        className = [className substringFromIndex:@"RCT".length];
      }
      if ([className hasSuffix:@"Manager"]) {
        className = [className substringToIndex:className.length - @"Manager".length];
      }
    }
    return className;
  }
}

NSDictionary *RCTNativeModuleClasses(void)
{
  static NSMutableDictionary *modules;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    modules = [NSMutableDictionary dictionary];

    unsigned int classCount;
    Class *classes = objc_copyClassList(&classCount);
    for (unsigned int i = 0; i < classCount; i++) {
      
      Class cls = classes[i];
      
      if (!class_getSuperclass(cls)) {
        // Class has no superclass - it's probably something weird
        continue;
      }
      
      if (![cls conformsToProtocol:@protocol(RCTNativeModule)]) {
        // Not an RCTNativeModule
        continue;
      }
      
      // Get module name
      NSString *moduleName = RCTModuleName(cls);

      // Check module name is unique
      id existingClass = modules[moduleName];
      RCTCAssert(existingClass == Nil, @"Attempted to register RCTNativeModule class %@ for the name '%@', but name was already registered by class %@", cls, moduleName, existingClass);
      modules[moduleName] = cls;
    }
    
    free(classes);
  });
  
  return modules;
}

@implementation RCTBridge
{
  NSMutableDictionary *_moduleInstances;
  NSDictionary *_javaScriptModulesConfig;
  dispatch_queue_t _shadowQueue;
  RCTTiming *_timing;
  id<RCTJavaScriptExecutor> _javaScriptExecutor;
}

static id<RCTJavaScriptExecutor> _latestJSExecutor;

- (instancetype)initWithJavaScriptExecutor:(id<RCTJavaScriptExecutor>)javaScriptExecutor
                               shadowQueue:(dispatch_queue_t)shadowQueue
                   javaScriptModulesConfig:(NSDictionary *)javaScriptModulesConfig
{
  if ((self = [super init])) {
    _javaScriptExecutor = javaScriptExecutor;
    _latestJSExecutor = _javaScriptExecutor;
    _shadowQueue = shadowQueue;
    _eventDispatcher = [[RCTEventDispatcher alloc] initWithBridge:self];
    
    _moduleInstances = [[NSMutableDictionary alloc] init];
    
    // TODO (#5906496): Remove special case
    _timing = [[RCTTiming alloc] initWithBridge:self];
    _javaScriptModulesConfig = javaScriptModulesConfig;
    _moduleInstances[RCTModuleName([RCTTiming class])] = _timing;
    
    // TODO (#5906496): Remove special case
    NSMutableDictionary *viewManagers = [[NSMutableDictionary alloc] init];
    [RCTNativeModuleClasses() enumerateKeysAndObjectsUsingBlock:^(NSString *moduleName, Class moduleClass, BOOL *stop) {
      if ([moduleClass conformsToProtocol:@protocol(RCTNativeViewModule)]) {
        viewManagers[moduleName] = [[moduleClass alloc] init];
      }
    }];
    _uiManager = [[RCTUIManager alloc] initWithShadowQueue:_shadowQueue viewManagers:viewManagers];
    _uiManager.eventDispatcher = _eventDispatcher;
    _moduleInstances[RCTModuleName([RCTUIManager class])] = _uiManager;
    [_moduleInstances addEntriesFromDictionary:viewManagers];
    
    // Register remaining modules
    [RCTNativeModuleClasses() enumerateKeysAndObjectsUsingBlock:^(NSString *moduleName, Class moduleClass, BOOL *stop) {
      if (_moduleInstances[moduleName] == nil) {
        _moduleInstances[moduleName] = [[moduleClass alloc] init];
      }
    }];
    
    [self doneRegisteringModules];
  }

  return self;
}

- (void)dealloc
{
  RCTAssert(!self.valid, @"must call -invalidate before -dealloc; TODO: why not call it here then?");
}

#pragma mark - RCTInvalidating

- (BOOL)isValid
{
  return _javaScriptExecutor != nil;
}

- (void)invalidate
{
  if (_latestJSExecutor == _javaScriptExecutor) {
    _latestJSExecutor = nil;
  }
  _javaScriptExecutor = nil;

  dispatch_sync(_shadowQueue, ^{
    // Make sure all dispatchers have been executed before
    // freeing up memory from _asyncHookMapByModuleID
  });

  for (id target in _moduleInstances.objectEnumerator) {
    if ([target respondsToSelector:@selector(invalidate)]) {
      [(id<RCTInvalidating>)target invalidate];
    }
  }
  [_moduleInstances removeAllObjects];

  _timing = nil;
}

/**
 * - TODO (#5906496): When we build a `MessageQueue.m`, handling all the requests could
 * cause both a queue of "responses". We would flush them here. However, we
 * currently just expect each objc block to handle its own response sending
 * using a `RCTResponseSenderBlock`.
 */

#pragma mark - RCTBridge methods

/**
 * Like JS::call, for objective-c.
 */
- (void)enqueueJSCall:(NSUInteger)moduleID methodID:(NSUInteger)methodID args:(NSArray *)args
{
  RCTAssertMainThread();
  [self _invokeRemoteJSModule:moduleID methodID:methodID args:args];
}

- (void)enqueueApplicationScript:(NSString *)script url:(NSURL *)url onComplete:(RCTJavaScriptCompleteBlock)onComplete
{
  RCTAssert(onComplete != nil, @"onComplete block passed in should be non-nil");
  [_javaScriptExecutor executeApplicationScript:script sourceURL:url onComplete:^(NSError *scriptLoadError) {
    if (scriptLoadError) {
      onComplete(scriptLoadError);
      return;
    }

    [_javaScriptExecutor executeJSCall:@"BatchedBridge"
                                method:@"flushedQueue"
                             arguments:@[]
                              callback:^(id objcValue, NSError *error) {
                                [self _handleBuffer:objcValue];
                                onComplete(error);
                              }];
  }];
}

- (void)enqueueUpdateTimers
{
  [_timing enqueueUpdateTimers];
}

#pragma mark - Payload Generation

- (void)_invokeAndProcessModule:(NSString *)module method:(NSString *)method arguments:(NSArray *)args
{
  NSTimeInterval startJS = RCTTGetAbsoluteTime();

  RCTJavaScriptCallback processResponse = ^(id objcValue, NSError *error) {
    NSTimeInterval startNative = RCTTGetAbsoluteTime();
    [self _handleBuffer:objcValue];

    NSTimeInterval end = RCTTGetAbsoluteTime();
    NSTimeInterval timeJS = startNative - startJS;
    NSTimeInterval timeNative = end - startNative;

    // TODO: surface this performance information somewhere
    [[NSNotificationCenter defaultCenter] postNotificationName:@"PERF" object:nil userInfo:@{@"JS": @(timeJS * 1000000), @"Native": @(timeNative * 1000000)}];
  };

  [_javaScriptExecutor executeJSCall:module
                              method:method
                           arguments:args
                            callback:processResponse];
}

- (void)_invokeRemoteJSModule:(NSUInteger)moduleID methodID:(NSUInteger)methodID args:(NSArray *)args
{
  [self _invokeAndProcessModule:@"BatchedBridge"
                         method:@"callFunctionReturnFlushedQueue"
                      arguments:@[@(moduleID), @(methodID), args]];
}

/**
 * TODO (#5906496): Have responses piggy backed on a round trip with ObjC->JS requests.
 */
- (void)_sendResponseToJavaScriptCallbackID:(NSInteger)cbID args:(NSArray *)args
{
  [self _invokeAndProcessModule:@"BatchedBridge"
                         method:@"invokeCallbackAndReturnFlushedQueue"
                      arguments:@[@(cbID), args]];
}

#pragma mark - Payload Processing

- (void)_handleBuffer:(id)buffer
{
  if (buffer == nil || buffer == (id)kCFNull) {
    return;
  }

  if (![buffer isKindOfClass:[NSArray class]]) {
    RCTLogMustFix(@"Buffer must be an instance of NSArray, got %@", NSStringFromClass([buffer class]));
    return;
  }

  NSArray *requestsArray = (NSArray *)buffer;
  NSUInteger bufferRowCount = [requestsArray count];
  NSUInteger expectedFieldsCount = RCTBridgeFieldResponseReturnValues + 1;
  if (bufferRowCount != expectedFieldsCount) {
    RCTLogMustFix(@"Must pass all fields to buffer - expected %zd, saw %zd", expectedFieldsCount, bufferRowCount);
    return;
  }

  for (NSUInteger fieldIndex = RCTBridgeFieldRequestModuleIDs; fieldIndex <= RCTBridgeFieldParamss; fieldIndex++) {
    id field = [requestsArray objectAtIndex:fieldIndex];
    if (![field isKindOfClass:[NSArray class]]) {
      RCTLogMustFix(@"Field at index %zd in buffer must be an instance of NSArray, got %@", fieldIndex, NSStringFromClass([field class]));
      return;
    }
  }

  NSArray *moduleIDs = [requestsArray objectAtIndex:RCTBridgeFieldRequestModuleIDs];
  NSArray *methodIDs = [requestsArray objectAtIndex:RCTBridgeFieldMethodIDs];
  NSArray *paramss = [requestsArray objectAtIndex:RCTBridgeFieldParamss];

  NSUInteger numRequests = [moduleIDs count];
  BOOL allSame = numRequests == [methodIDs count] && numRequests == [paramss count];
  if (!allSame) {
    RCTLogMustFix(@"Invalid data message - all must be length: %zd", numRequests);
    return;
  }

  for (NSUInteger i = 0; i < numRequests; i++) {
    @autoreleasepool {
      [self _handleRequestNumber:i
                        moduleID:[moduleIDs objectAtIndex:i]
                        methodID:[methodIDs objectAtIndex:i]
                          params:[paramss objectAtIndex:i]];
    }
  }

  // Update modules
  for (id target in _moduleInstances.objectEnumerator) {
    if ([target respondsToSelector:@selector(batchDidComplete)]) {
      dispatch_async(_shadowQueue, ^{
        [target batchDidComplete];
      });
    }
  }
}

- (void)_handleRequestNumber:(NSUInteger)i moduleID:(id)moduleID methodID:(id)methodID params:(id)params
{
  if (![moduleID isKindOfClass:[NSNumber class]] || ![methodID isKindOfClass:[NSNumber class]] || ![params isKindOfClass:[NSArray class]]) {
    RCTLogMustFix(@"Invalid module/method/params tuple for request #%zd", i);
    return;
  }
  [self _dispatchUsingAsyncHookMapWithModuleID:[moduleID integerValue]
                                      methodID:[methodID integerValue]
                                        params:params];
}

/**
 * Returns a callback that reports values back to the JS thread.
 * TODO (#5906496): These responses should go into their own queue `MessageQueue.m` that
 * mirrors the JS queue and protocol. For now, we speak the "language" of the JS
 * queue by packing it into an array that matches the wire protocol.
 */
- (RCTResponseSenderBlock)createResponseSenderBlock:(NSInteger)cbID
{
  if (!cbID) {
    return nil;
  }

  return ^(NSArray *args) {
    [self _sendResponseToJavaScriptCallbackID:cbID args:args];
  };
}

+ (NSInvocation *)invocationForAdditionalArguments:(NSUInteger)argCount
{
  static NSMutableDictionary *invocations;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    invocations = [NSMutableDictionary dictionary];
  });

  id key = @(argCount);
  NSInvocation *invocation = invocations[key];
  if (invocation == nil) {
    NSString *objCTypes = [@"v@:" stringByPaddingToLength:3 + argCount withString:@"@" startingAtIndex:0];
    NSMethodSignature *methodSignature = [NSMethodSignature signatureWithObjCTypes:objCTypes.UTF8String];
    invocation = [NSInvocation invocationWithMethodSignature:methodSignature];
    invocations[key] = invocation;
  }

  return invocation;
}

- (BOOL)_dispatchUsingAsyncHookMapWithModuleID:(NSInteger)moduleID
                                      methodID:(NSInteger)methodID
                                        params:(NSArray *)params
{
  if (moduleID < 0 || moduleID >= RCTExportedMethodsByModule().count) {
    return NO;
  }

  NSString *moduleName = RCTExportedModuleNameAtSortedIndex(moduleID);
  NSArray *methods = RCTExportedMethodsByModule()[moduleName];
  if (methodID < 0 || methodID >= methods.count) {
    return NO;
  }

  RCTModuleMethod *method = methods[methodID];
  NSUInteger methodArity = method.arity;
  if (params.count != methodArity) {
    RCTLogMustFix(
      @"Expected %tu arguments but got %tu invoking %@.%@",
      methodArity,
      params.count,
      moduleName,
      method.JSMethodName
    );
    return NO;
  }

  __weak RCTBridge *weakSelf = self;
  dispatch_async(_shadowQueue, ^{
    __strong RCTBridge *strongSelf = weakSelf;

    if (!strongSelf.isValid) {
      // strongSelf has been invalidated since the dispatch_async call and this
      // invocation should not continue.
      return;
    }

    NSInvocation *invocation = [RCTBridge invocationForAdditionalArguments:methodArity];
    
    // TODO: we should just store module instances by index, since that's how we look them up anyway
    id target = strongSelf->_moduleInstances[moduleName];
    RCTAssert(target != nil, @"No module found for name '%@'", moduleName);
    
    [invocation setArgument:&target atIndex:0];

    SEL selector = method.selector;
    [invocation setArgument:&selector atIndex:1];

    // Retain used blocks until after invocation completes.
    NSMutableArray *blocks = [NSMutableArray array];

    [params enumerateObjectsUsingBlock:^(id param, NSUInteger idx, BOOL *stop) {
      if ([param isEqual:[NSNull null]]) {
        param = nil;
      } else if ([method.blockArgumentIndexes containsIndex:idx]) {
        id block = [strongSelf createResponseSenderBlock:[param integerValue]];
        [blocks addObject:block];
        param = block;
      }

      [invocation setArgument:&param atIndex:idx + 2];
    }];

    @try {
      [invocation invoke];
    }
    @catch (NSException *exception) {
      RCTLogMustFix(@"Exception thrown while invoking %@ on target %@ with params %@: %@", method.JSMethodName, target, params, exception);
    }
    @finally {
      // Force `blocks` to remain alive until here.
      blocks = nil;
    }
  });

  return YES;
}

- (void)doneRegisteringModules
{
  RCTAssertMainThread();
  RCTAssert(_javaScriptModulesConfig != nil, @"JS module config not loaded in APP");

  NSMutableDictionary *objectsToInject = [NSMutableDictionary dictionary];

  // Dictionary of { moduleName0: { moduleID: 0, methods: { methodName0: { methodID: 0, type: remote }, methodName1: { ... }, ... }, ... }
  NSUInteger moduleCount = RCTExportedMethodsByModule().count;
  NSMutableDictionary *moduleConfigs = [NSMutableDictionary dictionaryWithCapacity:RCTExportedMethodsByModule().count];
  for (NSUInteger i = 0; i < moduleCount; i++) {
    NSString *moduleName = RCTExportedModuleNameAtSortedIndex(i);
    NSArray *rawMethods = RCTExportedMethodsByModule()[moduleName];
    NSMutableDictionary *methods = [NSMutableDictionary dictionaryWithCapacity:rawMethods.count];
    [rawMethods enumerateObjectsUsingBlock:^(RCTModuleMethod *method, NSUInteger methodID, BOOL *stop) {
      methods[method.JSMethodName] = @{
        @"methodID": @(methodID),
        @"type": @"remote",
      };
    }];

    NSMutableDictionary *moduleConfig = [NSMutableDictionary dictionary];
    moduleConfig[@"moduleID"] = @(i);
    moduleConfig[@"methods"] = methods;

    id target = [_moduleInstances objectForKey:moduleName];
    if ([target respondsToSelector:@selector(constantsToExport)] && ![target conformsToProtocol:@protocol(RCTNativeViewModule)]) {
      // TODO: find a more elegant way to handle RCTNativeViewModule constants as a special case
      moduleConfig[@"constants"] = [target constantsToExport];
    }
    moduleConfigs[moduleName] = moduleConfig;
  }
  NSDictionary *batchedBridgeConfig = @{
    @"remoteModuleConfig": moduleConfigs,
    @"localModulesConfig": _javaScriptModulesConfig
  };

  NSString *configJSON = RCTJSONStringify(batchedBridgeConfig, NULL);
  objectsToInject[@"__fbBatchedBridgeConfig"] = configJSON;

  dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
  [objectsToInject enumerateKeysAndObjectsUsingBlock:^(NSString *objectName, NSString *script, BOOL *stop) {
    [_javaScriptExecutor injectJSONText:script asGlobalObjectNamed:objectName callback:^(id err) {
      dispatch_semaphore_signal(semaphore);
    }];
  }];

  for (NSUInteger i = 0, count = objectsToInject.count; i < count; i++) {
    if (dispatch_semaphore_wait(semaphore, dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC)) != 0) {
      RCTLogMustFix(@"JavaScriptExecutor take too long to inject JSON object");
    }
  }
}

+ (BOOL)hasValidJSExecutor
{
  return (_latestJSExecutor != nil && [_latestJSExecutor isValid]);
}

+ (void)log:(NSArray *)objects level:(NSString *)level
{
  if (!_latestJSExecutor || ![_latestJSExecutor isValid]) {
    RCTLogError(@"%@", RCTLogFormatString(@"ERROR: No valid JS executor to log %@.", objects));
    return;
  }
  NSMutableArray *args = [NSMutableArray arrayWithObject:level];

  // TODO (#5906496): Find out and document why we skip the first object
  for (id ob in [objects subarrayWithRange:(NSRange){1, [objects count] - 1}]) {
    if ([NSJSONSerialization isValidJSONObject:@[ob]]) {
      [args addObject:ob];
    } else {
      [args addObject:[ob description]];
    }
  }
  // Note the js executor could get invalidated while we're trying to call this...need to watch out for that.
  [_latestJSExecutor executeJSCall:@"RCTLog"
                            method:@"logIfNoNativeHook"
                         arguments:args
                          callback:^(id objcValue, NSError *error) {}];
}

@end
