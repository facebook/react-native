/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTBridge.h"

#import <dlfcn.h>
#import <objc/message.h>
#import <objc/runtime.h>

#import <mach-o/dyld.h>
#import <mach-o/getsect.h>

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
 * This function returns the module name for a given class.
 */
static NSString *RCTModuleNameForClass(Class cls)
{
  return [cls respondsToSelector:@selector(moduleName)] ? [cls moduleName] : NSStringFromClass(cls);
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

    RCTEnumerateClasses(^(__unsafe_unretained Class cls) {
      if (RCTClassOverridesClassMethod(cls, @selector(JSMethods))) {
        [uniqueMethods addObjectsFromArray:[cls JSMethods]];
      }
    });

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

    RCTEnumerateClasses(^(__unsafe_unretained Class cls) {
      if ([cls conformsToProtocol:@protocol(RCTBridgeModule)]) {

        // Add module
        [(NSMutableArray *)modules addObject:cls];

        // Add module name
        NSString *moduleName = RCTModuleNameForClass(cls);
        [(NSMutableArray *)RCTModuleNamesByID addObject:moduleName];
      }
    });

    modules = [modules copy];
    RCTModuleNamesByID = [RCTModuleNamesByID copy];
  });

  return modules;
}

@interface RCTBridge ()

- (void)_invokeAndProcessModule:(NSString *)module
                         method:(NSString *)method
                      arguments:(NSArray *)args;

@end

/**
 * This private class is used as a container for exported method info
 */
@interface RCTModuleMethod : NSObject

@property (nonatomic, copy, readonly) NSString *moduleClassName;
@property (nonatomic, copy, readonly) NSString *JSMethodName;

@end

@implementation RCTModuleMethod
{
  BOOL _isClassMethod;
  Class _moduleClass;
  SEL _selector;
  NSMethodSignature *_methodSignature;
  NSArray *_argumentBlocks;
  NSString *_methodName;
}

- (instancetype)initWithMethodName:(NSString *)methodName
                      JSMethodName:(NSString *)JSMethodName
{
  if ((self = [super init])) {

    _methodName = methodName;
    NSArray *parts = [[methodName substringWithRange:NSMakeRange(2, methodName.length - 3)] componentsSeparatedByString:@" "];

    // Parse class and method
    _moduleClassName = parts[0];
    NSRange categoryRange = [_moduleClassName rangeOfString:@"("];
    if (categoryRange.length)
    {
      _moduleClassName = [_moduleClassName substringToIndex:categoryRange.location];
    }

    // Extract class and method details
    _isClassMethod = [methodName characterAtIndex:0] == '+';
    _moduleClass = NSClassFromString(_moduleClassName);
    _selector = NSSelectorFromString(parts[1]);
    _JSMethodName = JSMethodName ?: [NSStringFromSelector(_selector) componentsSeparatedByString:@":"][0];

#if DEBUG

    // Sanity check
    RCTAssert([_moduleClass conformsToProtocol:@protocol(RCTBridgeModule)],
              @"You are attempting to export the method %@, but %@ does not \
              conform to the RCTBridgeModule Protocol", methodName, _moduleClassName);
#endif

    // Get method signature
    _methodSignature = _isClassMethod ?
      [_moduleClass methodSignatureForSelector:_selector] :
      [_moduleClass instanceMethodSignatureForSelector:_selector];

    // Process arguments
    NSUInteger numberOfArguments = _methodSignature.numberOfArguments;
    NSMutableArray *argumentBlocks = [[NSMutableArray alloc] initWithCapacity:numberOfArguments - 2];
    for (NSUInteger i = 2; i < numberOfArguments; i++) {
      const char *argumentType = [_methodSignature getArgumentTypeAtIndex:i];
      switch (argumentType[0]) {

#define RCT_ARG_BLOCK(_logic) \
          [argumentBlocks addObject:^(RCTBridge *bridge, NSInvocation *invocation, NSUInteger index, id json) { \
            _logic \
            [invocation setArgument:&value atIndex:index]; \
          }]; \

#define RCT_CASE(_value, _class, _logic) \
        case _value: {                   \
          RCT_ARG_BLOCK( \
            if (json && ![json isKindOfClass:[_class class]]) { \
              RCTLogError(@"Argument %tu (%@) of %@.%@ should be of type %@", index, \
                json, RCTModuleNameForClass(_moduleClass), _JSMethodName, [_class class]); \
              return; \
            } \
            _logic \
          ) \
          break; \
        }

        RCT_CASE(':', NSString, SEL value = NSSelectorFromString(json); );
        RCT_CASE('*', NSString, const char *value = [json UTF8String]; );

#define RCT_SIMPLE_CASE(_value, _type, _selector) \
        case _value: {                              \
          RCT_ARG_BLOCK( \
            if (json && ![json respondsToSelector:@selector(_selector)]) { \
              RCTLogError(@"Argument %tu (%@) of %@.%@ does not respond to selector: %@", \
                index, json, RCTModuleNameForClass(_moduleClass), _JSMethodName, @#_selector); \
              return; \
            } \
            _type value = [json _selector];                     \
          ) \
          break; \
        }

        RCT_SIMPLE_CASE('c', char, charValue)
        RCT_SIMPLE_CASE('C', unsigned char, unsignedCharValue)
        RCT_SIMPLE_CASE('s', short, shortValue)
        RCT_SIMPLE_CASE('S', unsigned short, unsignedShortValue)
        RCT_SIMPLE_CASE('i', int, intValue)
        RCT_SIMPLE_CASE('I', unsigned int, unsignedIntValue)
        RCT_SIMPLE_CASE('l', long, longValue)
        RCT_SIMPLE_CASE('L', unsigned long, unsignedLongValue)
        RCT_SIMPLE_CASE('q', long long, longLongValue)
        RCT_SIMPLE_CASE('Q', unsigned long long, unsignedLongLongValue)
        RCT_SIMPLE_CASE('f', float, floatValue)
        RCT_SIMPLE_CASE('d', double, doubleValue)
        RCT_SIMPLE_CASE('B', BOOL, boolValue)

        default: {
          static const char *blockType = @encode(typeof(^{}));
          if (!strcmp(argumentType, blockType)) {
            RCT_ARG_BLOCK(
              if (json && ![json isKindOfClass:[NSNumber class]]) {
                RCTLogError(@"Argument %tu (%@) of %@.%@ should be a number", index,
                            json, RCTModuleNameForClass(_moduleClass), _JSMethodName);
                return;
              }
              // Marked as autoreleasing, because NSInvocation doesn't retain arguments
              __autoreleasing id value = (json ? ^(NSArray *args) {
                [bridge _invokeAndProcessModule:@"BatchedBridge"
                                         method:@"invokeCallbackAndReturnFlushedQueue"
                                      arguments:@[json, args]];
              } : ^(NSArray *unused) {});
            )
          } else {
            RCT_ARG_BLOCK( id value = json; )
          }
          break;
        }
      }
    }
    _argumentBlocks = [argumentBlocks copy];
  }
  return self;
}

- (void)invokeWithBridge:(RCTBridge *)bridge
                  module:(id)module
               arguments:(NSArray *)arguments
{

#if DEBUG

  // Sanity check
  RCTAssert([module class] == _moduleClass, @"Attempted to invoke method \
            %@ on a module of class %@", _methodName, [module class]);
#endif

  // Safety check
  if (arguments.count != _argumentBlocks.count) {
    RCTLogError(@"%@.%@ was called with %zd arguments, but expects %zd",
                RCTModuleNameForClass(_moduleClass), _JSMethodName,
                arguments.count, _argumentBlocks.count);
    return;
  }

  // Create invocation (we can't re-use this as it wouldn't be thread-safe)
  NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:_methodSignature];
  [invocation setArgument:&_selector atIndex:1];

  // Set arguments
  NSUInteger index = 0;
  for (id json in arguments) {
    id arg = (json == [NSNull null]) ? nil : json;
    void (^block)(RCTBridge *, NSInvocation *, NSUInteger, id) = _argumentBlocks[index];
    block(bridge, invocation, index + 2, arg);
    index ++;
  }

  // Invoke method
  [invocation invokeWithTarget:_isClassMethod ? [module class] : module];
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@: %p; exports %@ as %@;>", NSStringFromClass(self.class), self, _methodName, _JSMethodName];
}

@end

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

#ifdef __LP64__
    typedef uint64_t RCTExportValue;
    typedef struct section_64 RCTExportSection;
#define RCTGetSectByNameFromHeader getsectbynamefromheader_64
#else
    typedef uint32_t RCTExportValue;
    typedef struct section RCTExportSection;
#define RCTGetSectByNameFromHeader getsectbynamefromheader
#endif

    const RCTExportValue mach_header = (RCTExportValue)info.dli_fbase;
    const RCTExportSection *section = RCTGetSectByNameFromHeader((void *)mach_header, "__DATA", "RCTExport");

    if (section == NULL) {
      return;
    }

    NSArray *classes = RCTBridgeModuleClassesByModuleID();
    NSMutableDictionary *methodsByModuleClassName = [NSMutableDictionary dictionaryWithCapacity:[classes count]];

    for (RCTExportValue addr = section->offset;
         addr < section->offset + section->size;
         addr += sizeof(const char **) * 2) {

      // Get data entry
      const char **entries = (const char **)(mach_header + addr);

      // Create method
      RCTModuleMethod *moduleMethod =
        [[RCTModuleMethod alloc] initWithMethodName:@(entries[0])
                                       JSMethodName:strlen(entries[1]) ? @(entries[1]) : nil];

      // Cache method
      NSArray *methods = methodsByModuleClassName[moduleMethod.moduleClassName];
      methodsByModuleClassName[moduleMethod.moduleClassName] =
        methods ? [methods arrayByAddingObject:moduleMethod] : @[moduleMethod];
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

      remoteModuleConfigByClassName[NSStringFromClass(moduleClass)] = module;
    }];
  });

  // Create config
  NSMutableDictionary *moduleConfig = [[NSMutableDictionary alloc] init];
  [modulesByName enumerateKeysAndObjectsUsingBlock:^(NSString *moduleName, id<RCTBridgeModule> module, BOOL *stop) {

    // Add constants
    NSMutableDictionary *config = remoteModuleConfigByClassName[NSStringFromClass([module class])];
    if ([module respondsToSelector:@selector(constantsToExport)]) {
      NSDictionary *constants = [module constantsToExport];
      if (constants) {
        NSMutableDictionary *mutableConfig = [NSMutableDictionary dictionaryWithDictionary:config];
        mutableConfig[@"constants"] = constants; // There's no real need to copy this
        config = mutableConfig; // Nor this - receiver is unlikely to mutate it
      }
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
  RCTBridgeModuleProviderBlock _moduleProvider;
}

static id<RCTJavaScriptExecutor> _latestJSExecutor;

- (instancetype)initWithBundlePath:(NSString *)bundlepath
                    moduleProvider:(RCTBridgeModuleProviderBlock)block
                     launchOptions:(NSDictionary *)launchOptions
{
  if ((self = [super init])) {
    _eventDispatcher = [[RCTEventDispatcher alloc] initWithBridge:self];
    _shadowQueue = dispatch_queue_create("com.facebook.React.ShadowQueue", DISPATCH_QUEUE_SERIAL);
    _moduleProvider = block;
    _launchOptions = launchOptions;
  }
  return self;
}

- (void)setJavaScriptExecutor:(id<RCTJavaScriptExecutor>)executor
{
  _javaScriptExecutor = executor;
  _latestJSExecutor = _javaScriptExecutor;
  [self setUp];
}

- (void)setUp
{
  // Register passed-in module instances
  NSMutableDictionary *preregisteredModules = [[NSMutableDictionary alloc] init];
  for (id<RCTBridgeModule> module in _moduleProvider ? _moduleProvider() : nil) {
    preregisteredModules[RCTModuleNameForClass([module class])] = module;
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
        RCTAssert([[moduleClass alloc] init] == nil,
                  @"Attempted to register RCTBridgeModule class %@ for the name '%@', \
                  but name was already registered by class %@", moduleClass,
                  moduleName, [modulesByName[moduleName] class]);
      }
    } else {
      // Module name hasn't been used before, so go ahead and instantiate
      id<RCTBridgeModule> module = [[moduleClass alloc] init];
      if (module) {
        _modulesByID[moduleID] = modulesByName[moduleName] = module;
      }
    }
  }];

  // Store modules
  _modulesByName = [modulesByName copy];

  // Set bridge
  for (id<RCTBridgeModule> module in _modulesByName.allValues) {
    if ([module respondsToSelector:@selector(setBridge:)]) {
      module.bridge = self;
    }
  }

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
    RCTLogError(@"JavaScriptExecutor took too long to inject JSON object");
  }
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
  // Release executor
  if (_latestJSExecutor == _javaScriptExecutor) {
    _latestJSExecutor = nil;
  }
  [_javaScriptExecutor invalidate];
  _javaScriptExecutor = nil;

  // Wait for queued methods to finish
  dispatch_sync(self.shadowQueue, ^{
    // Make sure all dispatchers have been executed before continuing
  });

  // Invalidate modules
  for (id target in _modulesByID.allObjects) {
    if ([target respondsToSelector:@selector(invalidate)]) {
      [(id<RCTInvalidating>)target invalidate];
    }
  }

  // Release modules (breaks retain cycle if module has strong bridge reference)
  _modulesByID = nil;
  _modulesByName = nil;
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
                              callback:^(id json, NSError *error) {
                                [self _handleBuffer:json];
                                onComplete(error);
                              }];
  }];
}

#pragma mark - Payload Generation

- (void)_invokeAndProcessModule:(NSString *)module method:(NSString *)method arguments:(NSArray *)args
{
  [[NSNotificationCenter defaultCenter] postNotificationName:@"JS_PERF_ENQUEUE" object:nil userInfo:nil];

  RCTJavaScriptCallback processResponse = ^(id json, NSError *error) {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"JS_PERF_DEQUEUE" object:nil userInfo:nil];
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
  dispatch_async(self.shadowQueue, ^{
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

  // Look up method
  NSArray *methods = RCTExportedMethodsByModuleID()[moduleID];
  if (methodID >= methods.count) {
    RCTLogError(@"Unknown methodID: %zd for module: %zd (%@)", methodID, moduleID, RCTModuleNamesByID[moduleID]);
    return NO;
  }
  RCTModuleMethod *method = methods[methodID];

  __weak RCTBridge *weakSelf = self;
  dispatch_async(self.shadowQueue, ^{
    __strong RCTBridge *strongSelf = weakSelf;

    if (!strongSelf.isValid) {
      // strongSelf has been invalidated since the dispatch_async call and this
      // invocation should not continue.
      return;
    }

    // Look up module
    id module = strongSelf->_modulesByID[moduleID];
    if (!module) {
      RCTLogError(@"No module found for name '%@'", RCTModuleNamesByID[moduleID]);
      return;
    }

    @try {
      [method invokeWithBridge:strongSelf module:module arguments:params];
    }
    @catch (NSException *exception) {
      RCTLogError(@"Exception thrown while invoking %@ on target %@ with params %@: %@", method.JSMethodName, module, params, exception);
    }
  });

  return YES;
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

  // Note: the js executor could get invalidated while we're trying to call this...need to watch out for that.
  [_latestJSExecutor executeJSCall:@"RCTLog"
                            method:@"logIfNoNativeHook"
                         arguments:args
                          callback:^(id json, NSError *error) {}];
}

@end
