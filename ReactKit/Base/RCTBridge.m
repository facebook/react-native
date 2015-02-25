// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTBridge.h"

#import <dlfcn.h>
#import <mach-o/getsect.h>
#import <mach-o/dyld.h>
#import <objc/message.h>
#import <objc/runtime.h>

#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTSparseArray.h"
#import "RCTUtils.h"

/**
 * Must be kept in sync with `MessageQueue.js`.
 */
typedef NS_ENUM(NSUInteger, RCTBridgeFields) {
  RCTBridgeFieldRequestModuleIDs = 0,
  RCTBridgeFieldMethodIDs,
  RCTBridgeFieldParamss,
  RCTBridgeFieldResponseCBIDs,
  RCTBridgeFieldResponseReturnValues,
  RCTBridgeFieldFlushDateMillis
};

/**
 * This private class is used as a container for exported method info
 */
@interface RCTModuleMethod : NSObject

@property (readonly, nonatomic, assign) SEL selector;
@property (readonly, nonatomic, copy) NSString *JSMethodName;
@property (readonly, nonatomic, assign) NSUInteger arity;
@property (readonly, nonatomic, copy) NSIndexSet *blockArgumentIndexes;

@end

@implementation RCTModuleMethod

- (instancetype)initWithSelector:(SEL)selector
                    JSMethodName:(NSString *)JSMethodName
                           arity:(NSUInteger)arity
            blockArgumentIndexes:(NSIndexSet *)blockArgumentIndexes
{
  if ((self = [super init])) {
    _selector = selector;
    _JSMethodName = [JSMethodName copy];
    _arity = arity;
    _blockArgumentIndexes = [blockArgumentIndexes copy];
  }
  return self;
}

- (NSString *)description
{
  NSString *blocks = @"no block args";
  if (self.blockArgumentIndexes.count > 0) {
    NSMutableString *indexString = [NSMutableString string];
    [self.blockArgumentIndexes enumerateIndexesUsingBlock:^(NSUInteger idx, BOOL *stop) {
      [indexString appendFormat:@", %tu", idx];
    }];
    blocks = [NSString stringWithFormat:@"block args at %@", [indexString substringFromIndex:2]];
  }
  
  return [NSString stringWithFormat:@"<%@: %p; exports -%@ as %@; %@>", NSStringFromClass(self.class), self, NSStringFromSelector(self.selector), self.JSMethodName, blocks];
}

@end

#ifdef __LP64__
typedef uint64_t RCTExportValue;
typedef struct section_64 RCTExportSection;
#define RCTGetSectByNameFromHeader getsectbynamefromheader_64
#else
typedef uint32_t RCTExportValue;
typedef struct section RCTExportSection;
#define RCTGetSectByNameFromHeader getsectbynamefromheader
#endif

/**
 * This function returns the module name for a given class.
 */
static NSString *RCTModuleNameForClass(Class cls)
{
  return [cls respondsToSelector:@selector(moduleName)] ? [cls moduleName] : NSStringFromClass(cls);
}

/**
 * This function instantiates a new module instance.
 */
static id<RCTBridgeModule> RCTCreateModuleInstance(Class cls, RCTBridge *bridge)
{
  if ([cls instancesRespondToSelector:@selector(initWithBridge:)]) {
    return [[cls alloc] initWithBridge:bridge];
  } else {
    return [[cls alloc] init];
  }
}

/**
 * This function scans all classes available at runtime and returns an array
 * of all JSMethods registered.
 */
static NSArray *RCTJSMethods(void)
{
  static NSArray *JSMethods;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSMutableSet *uniqueMethods = [NSMutableSet set];

    unsigned int classCount;
    Class *classes = objc_copyClassList(&classCount);
    for (unsigned int i = 0; i < classCount; i++) {

      Class cls = classes[i];

      if (!class_getSuperclass(cls)) {
        // Class has no superclass - it's probably something weird
        continue;
      }

      if (RCTClassOverridesClassMethod(cls, @selector(JSMethods))) {
        [uniqueMethods addObjectsFromArray:[cls JSMethods]];
      }
    }
    free(classes);

    JSMethods = [uniqueMethods allObjects];
  });

  return JSMethods;
}

/**
 * This function scans all classes available at runtime and returns an array
 * of all classes that implement the RTCBridgeModule protocol.
 */
static NSArray *RCTModuleNamesByID;
static NSArray *RCTBridgeModuleClassesByModuleID(void)
{
  static NSArray *modules;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    modules = [NSMutableArray array];
    RCTModuleNamesByID = [NSMutableArray array];

    unsigned int classCount;
    Class *classes = objc_copyClassList(&classCount);
    for (unsigned int i = 0; i < classCount; i++) {

      Class cls = classes[i];

      if (!class_getSuperclass(cls)) {
        // Class has no superclass - it's probably something weird
        continue;
      }

      if (![cls conformsToProtocol:@protocol(RCTBridgeModule)]) {
        // Not an RCTBridgeModule
        continue;
      }

      // Add module
      [(NSMutableArray *)modules addObject:cls];

      // Add module name
      NSString *moduleName = RCTModuleNameForClass(cls);
      [(NSMutableArray *)RCTModuleNamesByID addObject:moduleName];
    }
    free(classes);

    modules = [modules copy];
    RCTModuleNamesByID = [RCTModuleNamesByID copy];
  });
  
  return modules;
}

/**
 * This function parses the exported methods inside RCTBridgeModules and
 * generates an array of arrays of RCTModuleMethod objects, keyed
 * by module index.
 */
static RCTSparseArray *RCTExportedMethodsByModuleID(void)
{
  static RCTSparseArray *methodsByModuleID;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{

    Dl_info info;
    dladdr(&RCTExportedMethodsByModuleID, &info);

    const RCTExportValue mach_header = (RCTExportValue)info.dli_fbase;
    const RCTExportSection *section = RCTGetSectByNameFromHeader((void *)mach_header, "__DATA", "RCTExport");

    if (section == NULL) {
      return;
    }

    NSArray *classes = RCTBridgeModuleClassesByModuleID();
    NSMutableDictionary *methodsByModuleClassName = [NSMutableDictionary dictionaryWithCapacity:[classes count]];
    NSCharacterSet *plusMinusCharacterSet = [NSCharacterSet characterSetWithCharactersInString:@"+-"];

    for (RCTExportValue addr = section->offset;
         addr < section->offset + section->size;
         addr += sizeof(id) * 2) {

      const char **entry = (const char **)(mach_header + addr);
      NSScanner *scanner = [NSScanner scannerWithString:@(entry[0])];

      NSString *plusMinus;
      if (![scanner scanCharactersFromSet:plusMinusCharacterSet intoString:&plusMinus]) continue;
      if (![scanner scanString:@"[" intoString:NULL]) continue;

      NSString *className;
      if (![scanner scanUpToString:@" " intoString:&className]) continue;
      [scanner scanString:@" " intoString:NULL];

      NSString *selectorName;
      if (![scanner scanUpToString:@"]" intoString:&selectorName]) continue;

      Class moduleClass = NSClassFromString(className);
      if (moduleClass == Nil) continue;

      SEL selector = NSSelectorFromString(selectorName);
      Method method = ([plusMinus characterAtIndex:0] == '+' ? class_getClassMethod : class_getInstanceMethod)(moduleClass, selector);
      if (method == nil) continue;

      unsigned int argumentCount = method_getNumberOfArguments(method);
      NSMutableIndexSet *blockArgumentIndexes = [NSMutableIndexSet indexSet];
      static const char *blockType = @encode(typeof(^{}));
      for (unsigned int i = 2; i < argumentCount; i++) {
        char *type = method_copyArgumentType(method, i);
        if (!strcmp(type, blockType)) {
          [blockArgumentIndexes addIndex:i - 2];
        }
        free(type);
      }

      NSString *JSMethodName = strlen(entry[1]) ? @(entry[1]) : [NSStringFromSelector(selector) componentsSeparatedByString:@":"][0];
      RCTModuleMethod *moduleMethod =
      [[RCTModuleMethod alloc] initWithSelector:selector
                                   JSMethodName:JSMethodName
                                          arity:method_getNumberOfArguments(method) - 2
                           blockArgumentIndexes:blockArgumentIndexes];

      NSArray *methods = methodsByModuleClassName[className];
      methodsByModuleClassName[className] = methods ? [methods arrayByAddingObject:moduleMethod] : @[moduleMethod];
    }

    methodsByModuleID = [[RCTSparseArray alloc] initWithCapacity:[classes count]];
    [classes enumerateObjectsUsingBlock:^(Class moduleClass, NSUInteger moduleID, BOOL *stop) {
      methodsByModuleID[moduleID] = methodsByModuleClassName[NSStringFromClass(moduleClass)];
    }];
  });
  
  return methodsByModuleID;
}

/**
 * This constructs the remote modules configuration data structure,
 * which represents the native modules and methods that will be called
 * by JS. A numeric ID is assigned to each module and method, which will
 * be used to communicate via the bridge. The structure of each
 * module is as follows:
 *
 * "ModuleName1": {
 *   "moduleID": 0,
 *   "methods": {
 *     "methodName1": {
 *       "methodID": 0,
 *       "type": "remote"
 *     },
 *     "methodName2": {
 *       "methodID": 1,
 *       "type": "remote"
 *     },
 *     etc...
 *   },
 *   "constants": {
 *     ...
 *   }
 * },
 * etc...
 */
static NSDictionary *RCTRemoteModulesConfig(NSDictionary *modulesByName)
{
  static NSMutableDictionary *remoteModuleConfigByClassName;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{

    remoteModuleConfigByClassName = [[NSMutableDictionary alloc] init];
    [RCTBridgeModuleClassesByModuleID() enumerateObjectsUsingBlock:^(Class moduleClass, NSUInteger moduleID, BOOL *stop) {

      NSArray *methods = RCTExportedMethodsByModuleID()[moduleID];
      NSMutableDictionary *methodsByName = [NSMutableDictionary dictionaryWithCapacity:methods.count];
      [methods enumerateObjectsUsingBlock:^(RCTModuleMethod *method, NSUInteger methodID, BOOL *_stop) {
        methodsByName[method.JSMethodName] = @{
          @"methodID": @(methodID),
          @"type": @"remote",
        };
      }];
      
      NSDictionary *module = @{
        @"moduleID": @(moduleID),
        @"methods": methodsByName
      };

      // Add static constants
      if (RCTClassOverridesClassMethod(moduleClass, @selector(constantsToExport))) {
        NSMutableDictionary *mutableModule = [module mutableCopy];
        mutableModule[@"constants"] = [moduleClass constantsToExport] ?: @{};
        module = [mutableModule copy];
      }

      remoteModuleConfigByClassName[NSStringFromClass(moduleClass)] = module;
    }];
  });

  // Create config
  NSMutableDictionary *moduleConfig = [[NSMutableDictionary alloc] init];
  [modulesByName enumerateKeysAndObjectsUsingBlock:^(NSString *moduleName, id<RCTBridgeModule> module, BOOL *stop) {

    // Add "psuedo-constants"
    NSMutableDictionary *config = remoteModuleConfigByClassName[NSStringFromClass([module class])];
    if (RCTClassOverridesInstanceMethod([module class], @selector(constantsToExport))) {
      NSMutableDictionary *mutableConfig = [NSMutableDictionary dictionaryWithDictionary:config];
      NSMutableDictionary *mutableConstants = [NSMutableDictionary dictionaryWithDictionary:config[@"constants"]];
      [mutableConstants addEntriesFromDictionary:[module constantsToExport]];
      mutableConfig[@"constants"] = mutableConstants; // There's no real need to copy this
      config = mutableConfig; // Nor this - receiver is unlikely to mutate it
    }

    moduleConfig[moduleName] = config;
  }];

  return moduleConfig;
}

/**
 * As above, but for local modules/methods, which represent JS classes
 * and methods that will be called by the native code via the bridge.
 * Structure is essentially the same as for remote modules:
 *
 * "ModuleName1": {
 *   "moduleID": 0,
 *   "methods": {
 *     "methodName1": {
 *       "methodID": 0,
 *       "type": "local"
 *     },
 *     "methodName2": {
 *       "methodID": 1,
 *       "type": "local"
 *     },
 *     etc...
 *   }
 * },
 * etc...
 */
static NSMutableDictionary *RCTLocalModuleIDs;
static NSMutableDictionary *RCTLocalMethodIDs;
static NSDictionary *RCTLocalModulesConfig()
{
  static NSMutableDictionary *localModules;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{

    RCTLocalModuleIDs = [[NSMutableDictionary alloc] init];
    RCTLocalMethodIDs = [[NSMutableDictionary alloc] init];

    localModules = [[NSMutableDictionary alloc] init];
    for (NSString *moduleDotMethod in RCTJSMethods()) {

      NSArray *parts = [moduleDotMethod componentsSeparatedByString:@"."];
      RCTCAssert(parts.count == 2, @"'%@' is not a valid JS method definition - expected 'Module.method' format.", moduleDotMethod);

      // Add module if it doesn't already exist
      NSString *moduleName = parts[0];
      NSDictionary *module = localModules[moduleName];
      if (!module) {
        module = @{
          @"moduleID": @(localModules.count),
          @"methods": [[NSMutableDictionary alloc] init]
        };
        localModules[moduleName] = module;
      }

      // Add method if it doesn't already exist
      NSString *methodName = parts[1];
      NSMutableDictionary *methods = module[@"methods"];
      if (!methods[methodName]) {
        methods[methodName] = @{
          @"methodID": @(methods.count),
          @"type": @"local"
        };
      }

      // Add module and method lookup
      RCTLocalModuleIDs[moduleDotMethod] = module[@"moduleID"];
      RCTLocalMethodIDs[moduleDotMethod] = methods[methodName][@"methodID"];
    }
  });

  return localModules;
}

@implementation RCTBridge
{
  RCTSparseArray *_modulesByID;
  NSDictionary *_modulesByName;
  id<RCTJavaScriptExecutor> _javaScriptExecutor;
}

static id<RCTJavaScriptExecutor> _latestJSExecutor;

- (instancetype)initWithJavaScriptExecutor:(id<RCTJavaScriptExecutor>)javaScriptExecutor
                            moduleProvider:(RCTBridgeModuleProviderBlock)block
{
  if ((self = [super init])) {
    _javaScriptExecutor = javaScriptExecutor;
    _latestJSExecutor = _javaScriptExecutor;
    _eventDispatcher = [[RCTEventDispatcher alloc] initWithBridge:self];
    _shadowQueue = dispatch_queue_create("com.facebook.ReactKit.ShadowQueue", DISPATCH_QUEUE_SERIAL);

    // Register passed-in module instances
    NSMutableDictionary *preregisteredModules = [[NSMutableDictionary alloc] init];
    if (block) {
      for (id<RCTBridgeModule> module in block(self)) {
        preregisteredModules[RCTModuleNameForClass([module class])] = module;
      }
    }

    // Instantiate modules
    _modulesByID = [[RCTSparseArray alloc] init];
    NSMutableDictionary *modulesByName = [preregisteredModules mutableCopy];
    [RCTBridgeModuleClassesByModuleID() enumerateObjectsUsingBlock:^(Class moduleClass, NSUInteger moduleID, BOOL *stop) {
      NSString *moduleName = RCTModuleNamesByID[moduleID];
      // Check if module instance has already been registered for this name
      if ((_modulesByID[moduleID] = modulesByName[moduleName])) {
        // Preregistered instances takes precedence, no questions asked
        if (!preregisteredModules[moduleName]) {
          // It's OK to have a name collision as long as the second instance is nil
          RCTAssert(RCTCreateModuleInstance(moduleClass, self) == nil,
                    @"Attempted to register RCTBridgeModule class %@ for the name '%@', \
                    but name was already registered by class %@", moduleClass,
                    moduleName, [modulesByName[moduleName] class]);
        }
      } else {
        // Module name hasn't been used before, so go ahead and instantiate
        id<RCTBridgeModule> module = RCTCreateModuleInstance(moduleClass, self);
        if (module) {
          _modulesByID[moduleID] = modulesByName[moduleName] = module;
        }
      }
    }];

    // Store modules
    _modulesByName = [modulesByName copy];

    // Inject module data into JS context
    NSString *configJSON = RCTJSONStringify(@{
      @"remoteModuleConfig": RCTRemoteModulesConfig(_modulesByName),
      @"localModulesConfig": RCTLocalModulesConfig()
    }, NULL);
    dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
    [_javaScriptExecutor injectJSONText:configJSON asGlobalObjectNamed:@"__fbBatchedBridgeConfig" callback:^(id err) {
      dispatch_semaphore_signal(semaphore);
    }];
    
    if (dispatch_semaphore_wait(semaphore, dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC)) != 0) {
      RCTLogMustFix(@"JavaScriptExecutor took too long to inject JSON object");
    }
  }
  
  return self;
}

- (NSDictionary *)modules
{
  RCTAssert(_modulesByName != nil, @"Bridge modules have not yet been initialized. \
            You may be trying to access a module too early in the startup procedure.");

  return _modulesByName;
}

- (void)dealloc
{
  RCTAssert(!self.valid, @"must call -invalidate before -dealloc");
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
  [_javaScriptExecutor invalidate];
  _javaScriptExecutor = nil;
  
  dispatch_sync(_shadowQueue, ^{
    // Make sure all dispatchers have been executed before continuing
    // TODO: is this still needed?
  });
  
  for (id target in _modulesByID.allObjects) {
    if ([target respondsToSelector:@selector(invalidate)]) {
      [(id<RCTInvalidating>)target invalidate];
    }
  }
  [_modulesByID removeAllObjects];
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
- (void)enqueueJSCall:(NSString *)moduleDotMethod args:(NSArray *)args
{
  NSNumber *moduleID = RCTLocalModuleIDs[moduleDotMethod];
  RCTAssert(moduleID != nil, @"Module '%@' not registered.",
            [[moduleDotMethod componentsSeparatedByString:@"."] firstObject]);
  
  NSNumber *methodID = RCTLocalMethodIDs[moduleDotMethod];
  RCTAssert(methodID != nil, @"Method '%@' not registered.", moduleDotMethod);
  
  [self _invokeAndProcessModule:@"BatchedBridge"
                         method:@"callFunctionReturnFlushedQueue"
                      arguments:@[moduleID, methodID, args ?: @[]]];
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
    RCTLogError(@"Buffer must be an instance of NSArray, got %@", NSStringFromClass([buffer class]));
    return;
  }
  
  NSArray *requestsArray = (NSArray *)buffer;
  NSUInteger bufferRowCount = [requestsArray count];
  NSUInteger expectedFieldsCount = RCTBridgeFieldResponseReturnValues + 1;
  if (bufferRowCount != expectedFieldsCount) {
    RCTLogError(@"Must pass all fields to buffer - expected %zd, saw %zd", expectedFieldsCount, bufferRowCount);
    return;
  }
  
  for (NSUInteger fieldIndex = RCTBridgeFieldRequestModuleIDs; fieldIndex <= RCTBridgeFieldParamss; fieldIndex++) {
    id field = [requestsArray objectAtIndex:fieldIndex];
    if (![field isKindOfClass:[NSArray class]]) {
      RCTLogError(@"Field at index %zd in buffer must be an instance of NSArray, got %@", fieldIndex, NSStringFromClass([field class]));
      return;
    }
  }
  
  NSArray *moduleIDs = requestsArray[RCTBridgeFieldRequestModuleIDs];
  NSArray *methodIDs = requestsArray[RCTBridgeFieldMethodIDs];
  NSArray *paramsArrays = requestsArray[RCTBridgeFieldParamss];
  
  NSUInteger numRequests = [moduleIDs count];
  BOOL allSame = numRequests == [methodIDs count] && numRequests == [paramsArrays count];
  if (!allSame) {
    RCTLogError(@"Invalid data message - all must be length: %zd", numRequests);
    return;
  }
  
  for (NSUInteger i = 0; i < numRequests; i++) {
    @autoreleasepool {
      [self _handleRequestNumber:i
                        moduleID:[moduleIDs[i] integerValue]
                        methodID:[methodIDs[i] integerValue]
                          params:paramsArrays[i]];
    }
  }
  
  // TODO: only used by RCTUIManager - can we eliminate this special case?
  dispatch_async(_shadowQueue, ^{
    for (id module in _modulesByID.allObjects) {
      if ([module respondsToSelector:@selector(batchDidComplete)]) {
        [module batchDidComplete];
      }
    }
  });
}

- (BOOL)_handleRequestNumber:(NSUInteger)i
                    moduleID:(NSUInteger)moduleID
                    methodID:(NSUInteger)methodID
                      params:(NSArray *)params
{
  if (![params isKindOfClass:[NSArray class]]) {
    RCTLogError(@"Invalid module/method/params tuple for request #%zd", i);
    return NO;
  }

  NSArray *methods = RCTExportedMethodsByModuleID()[moduleID];
  if (methodID >= methods.count) {
    RCTLogError(@"Unknown methodID: %zd for module: %zd (%@)", methodID, moduleID, RCTModuleNamesByID[moduleID]);
    return NO;
  }
  
  RCTModuleMethod *method = methods[methodID];
  NSUInteger methodArity = method.arity;
  if (params.count != methodArity) {
    RCTLogError(@"Expected %tu arguments but got %tu invoking %@.%@",
                methodArity,
                params.count,
                RCTModuleNamesByID[moduleID],
                method.JSMethodName);
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
    
    // TODO: we should just store module instances by index, since that's how we look them up anyway
    id target = strongSelf->_modulesByID[moduleID];
    RCTAssert(target != nil, @"No module found for name '%@'", RCTModuleNamesByID[moduleID]);
    
    SEL selector = method.selector;
    NSMethodSignature *methodSignature = [target methodSignatureForSelector:selector];
    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:methodSignature];
    [invocation setArgument:&target atIndex:0];
    [invocation setArgument:&selector atIndex:1];
    
    // Retain used blocks until after invocation completes.
    NS_VALID_UNTIL_END_OF_SCOPE NSMutableArray *blocks = [NSMutableArray array];
    
    [params enumerateObjectsUsingBlock:^(id param, NSUInteger idx, BOOL *stop) {
      if ([param isEqual:[NSNull null]]) {
        param = nil;
      } else if ([method.blockArgumentIndexes containsIndex:idx]) {
        id block = [strongSelf createResponseSenderBlock:[param integerValue]];
        [blocks addObject:block];
        param = block;
      }
      
      NSUInteger argIdx = idx + 2;
      
      // TODO: can we do this lookup in advance and cache the logic instead of
      // recalculating it every time for every parameter?
      BOOL shouldSet = YES;
      const char *argumentType = [methodSignature getArgumentTypeAtIndex:argIdx];
      switch (argumentType[0]) {
        case ':':
          if ([param isKindOfClass:[NSString class]]) {
            SEL sel = NSSelectorFromString(param);
            [invocation setArgument:&sel atIndex:argIdx];
            shouldSet = NO;
          }
          break;
          
        case '*':
          if ([param isKindOfClass:[NSString class]]) {
            const char *string = [param UTF8String];
            [invocation setArgument:&string atIndex:argIdx];
            shouldSet = NO;
          }
          break;
          
          // TODO: it seems like an error if the param doesn't respond
          // so we should probably surface that error rather than failing silently
#define CASE(_value, _type, _selector)                           \
        case _value:                                             \
          if ([param respondsToSelector:@selector(_selector)]) { \
            _type value = [param _selector];                     \
            [invocation setArgument:&value atIndex:argIdx];      \
            shouldSet = NO;                                      \
          }                                                      \
          break;
          
          CASE('c', char, charValue)
          CASE('C', unsigned char, unsignedCharValue)
          CASE('s', short, shortValue)
          CASE('S', unsigned short, unsignedShortValue)
          CASE('i', int, intValue)
          CASE('I', unsigned int, unsignedIntValue)
          CASE('l', long, longValue)
          CASE('L', unsigned long, unsignedLongValue)
          CASE('q', long long, longLongValue)
          CASE('Q', unsigned long long, unsignedLongLongValue)
          CASE('f', float, floatValue)
          CASE('d', double, doubleValue)
          CASE('B', BOOL, boolValue)
          
        default:
          break;
      }
      
      if (shouldSet) {
        [invocation setArgument:&param atIndex:argIdx];
      }
    }];
    
    @try {
      [invocation invoke];
    }
    @catch (NSException *exception) {
      RCTLogError(@"Exception thrown while invoking %@ on target %@ with params %@: %@", method.JSMethodName, target, params, exception);
    }
  });
  
  return YES;
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

- (void)registerRootView:(RCTRootView *)rootView
{
  // TODO: only used by RCTUIManager - can we eliminate this special case?
  for (id module in _modulesByID.allObjects) {
    if ([module respondsToSelector:@selector(registerRootView:)]) {
      [module registerRootView:rootView];
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
    RCTLogError(@"ERROR: No valid JS executor to log %@.", objects);
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
