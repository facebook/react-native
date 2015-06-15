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

#import "RCTAssert.h"
#import "RCTContextExecutor.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTJavaScriptLoader.h"
#import "RCTKeyCommands.h"
#import "RCTLog.h"
#import "RCTPerfStats.h"
#import "RCTProfile.h"
#import "RCTRedBox.h"
#import "RCTRootView.h"
#import "RCTSourceCode.h"
#import "RCTSparseArray.h"
#import "RCTUtils.h"

NSString *const RCTReloadNotification = @"RCTReloadNotification";
NSString *const RCTJavaScriptDidLoadNotification = @"RCTJavaScriptDidLoadNotification";
NSString *const RCTJavaScriptDidFailToLoadNotification = @"RCTJavaScriptDidFailToLoadNotification";

dispatch_queue_t const RCTJSThread = nil;

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

typedef NS_ENUM(NSUInteger, RCTJavaScriptFunctionKind) {
  RCTJavaScriptFunctionKindNormal,
  RCTJavaScriptFunctionKindAsync,
};

#ifdef __LP64__
typedef struct mach_header_64 *RCTHeaderValue;
typedef struct section_64 RCTHeaderSection;
#define RCTGetSectByNameFromHeader getsectbynamefromheader_64
#else
typedef struct mach_header *RCTHeaderValue;
typedef struct section RCTHeaderSection;
#define RCTGetSectByNameFromHeader getsectbynamefromheader
#endif

#define RCTAssertJSThread() \
  RCTAssert(![NSStringFromClass([_javaScriptExecutor class]) isEqualToString:@"RCTContextExecutor"] || \
              [[[NSThread currentThread] name] isEqualToString:@"com.facebook.React.JavaScript"], \
            @"This method must be called on JS thread")

NSString *const RCTEnqueueNotification = @"RCTEnqueueNotification";
NSString *const RCTDequeueNotification = @"RCTDequeueNotification";

static NSDictionary *RCTModuleIDsByName;
static NSArray *RCTModuleNamesByID;
static NSArray *RCTModuleClassesByID;
void RCTRegisterModule(Class moduleClass)
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    RCTModuleIDsByName = [[NSMutableDictionary alloc] init];
    RCTModuleNamesByID = [[NSMutableArray alloc] init];
    RCTModuleClassesByID = [[NSMutableArray alloc] init];
  });

  RCTAssert([moduleClass conformsToProtocol:@protocol(RCTBridgeModule)],
            @"%@ does not conform to the RCTBridgeModule protocol",
            NSStringFromClass(moduleClass));

  // Register module
  NSString *moduleName = RCTBridgeModuleNameForClass(moduleClass);
  ((NSMutableDictionary *)RCTModuleIDsByName)[moduleName] = @(RCTModuleNamesByID.count);
  [(NSMutableArray *)RCTModuleNamesByID addObject:moduleName];
  [(NSMutableArray *)RCTModuleClassesByID addObject:moduleClass];

}

/**
 * This function returns the module name for a given class.
 */
NSString *RCTBridgeModuleNameForClass(Class cls)
{
  NSString *name = nil;
  if ([cls respondsToSelector:@selector(moduleName)]) {
    name = [cls valueForKey:@"moduleName"];
  }
  if ([name length] == 0) {
    name = NSStringFromClass(cls);
  }
  if ([name hasPrefix:@"RK"]) {
    name = [name stringByReplacingCharactersInRange:(NSRange){0,@"RK".length} withString:@"RCT"];
  }
  return name;
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

    Dl_info info;
    dladdr(&RCTJSMethods, &info);

    const RCTHeaderValue mach_header = (RCTHeaderValue)info.dli_fbase;
    unsigned long size = 0;
    const uint8_t *sectionData = getsectiondata(mach_header, "__DATA", "RCTImport", &size);
    if (sectionData) {
      for (const uint8_t *addr = sectionData;
           addr < sectionData + size;
           addr += sizeof(const char **)) {

        // Get data entry
        NSString *entry = @(*(const char **)addr);
        [uniqueMethods addObject:entry];
      }
    }

    JSMethods = [uniqueMethods allObjects];
  });

  return JSMethods;
}

// TODO: Can we just replace RCTMakeError with this function instead?
static NSDictionary *RCTJSErrorFromNSError(NSError *error)
{
  NSString *errorMessage;
  NSArray *stackTrace = [NSThread callStackSymbols];
  NSMutableDictionary *errorInfo =
  [NSMutableDictionary dictionaryWithObject:stackTrace forKey:@"nativeStackIOS"];

  if (error) {
    errorMessage = error.localizedDescription ?: @"Unknown error from a native module";
    errorInfo[@"domain"] = error.domain ?: RCTErrorDomain;
    errorInfo[@"code"] = @(error.code);
  } else {
    errorMessage = @"Unknown error from a native module";
    errorInfo[@"domain"] = RCTErrorDomain;
    errorInfo[@"code"] = @-1;
  }

  return RCTMakeError(errorMessage, nil, errorInfo);
}

@class RCTBatchedBridge;

@interface RCTBridge ()

@property (nonatomic, strong) RCTBatchedBridge *batchedBridge;
@property (nonatomic, strong) RCTBridgeModuleProviderBlock moduleProvider;

- (void)_invokeAndProcessModule:(NSString *)module
                         method:(NSString *)method
                      arguments:(NSArray *)args
                        context:(NSNumber *)context;

@end

@interface RCTBatchedBridge : RCTBridge <RCTInvalidating>

@property (nonatomic, weak) RCTBridge *parentBridge;

- (instancetype)initWithParentBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (void)_actuallyInvokeAndProcessModule:(NSString *)module
                                 method:(NSString *)method
                              arguments:(NSArray *)args
                                context:(NSNumber *)context;

@end

/**
 * This private class is used as a container for exported method info
 */
@interface RCTModuleMethod : NSObject

@property (nonatomic, copy, readonly) NSString *moduleClassName;
@property (nonatomic, copy, readonly) NSString *JSMethodName;
@property (nonatomic, assign, readonly) SEL selector;
@property (nonatomic, assign, readonly) RCTJavaScriptFunctionKind functionKind;

@end

@implementation RCTModuleMethod
{
  Class _moduleClass;
  SEL _selector;
  NSMethodSignature *_methodSignature;
  NSArray *_argumentBlocks;
  dispatch_block_t _methodQueue;
}

- (instancetype)initWithObjCMethodName:(NSString *)objCMethodName
                          JSMethodName:(NSString *)JSMethodName
                           moduleClass:(Class)moduleClass
{
  if ((self = [super init])) {
    static NSRegularExpression *typeRegex;
    static NSRegularExpression *selectorRegex;
    if (!typeRegex) {
      NSString *unusedPattern = @"(?:(?:__unused|__attribute__\\(\\(unused\\)\\)))";
      NSString *constPattern = @"(?:const)";
      NSString *constUnusedPattern = [NSString stringWithFormat:@"(?:(?:%@|%@)\\s*)", unusedPattern, constPattern];
      NSString *pattern = [NSString stringWithFormat:@"\\(%1$@?(\\w+?)(?:\\s*\\*)?%1$@?\\)", constUnusedPattern];
      typeRegex = [[NSRegularExpression alloc] initWithPattern:pattern options:0 error:NULL];

      selectorRegex = [[NSRegularExpression alloc] initWithPattern:@"(?<=:).*?(?=[a-zA-Z_]+:|$)" options:0 error:NULL];
    }

    NSMutableArray *argumentNames = [NSMutableArray array];
    [typeRegex enumerateMatchesInString:objCMethodName options:0 range:NSMakeRange(0, objCMethodName.length) usingBlock:^(NSTextCheckingResult *result, __unused NSMatchingFlags flags, __unused BOOL *stop) {
      NSString *argumentName = [objCMethodName substringWithRange:[result rangeAtIndex:1]];
      [argumentNames addObject:argumentName];
    }];

    // Remove the parameters' type and name
    objCMethodName = [selectorRegex stringByReplacingMatchesInString:objCMethodName
                                                             options:0
                                                               range:NSMakeRange(0, objCMethodName.length)
                                                        withTemplate:@""];
    // Remove any spaces since `selector : (Type)name` is a valid syntax
    objCMethodName = [objCMethodName stringByReplacingOccurrencesOfString:@" " withString:@""];

    _moduleClass = moduleClass;
    _moduleClassName = NSStringFromClass(_moduleClass);
    _selector = NSSelectorFromString(objCMethodName);
    _JSMethodName = JSMethodName.length > 0 ? JSMethodName : ({
      NSString *methodName = NSStringFromSelector(_selector);
      NSRange colonRange = [methodName rangeOfString:@":"];
      if (colonRange.length) {
        methodName = [methodName substringToIndex:colonRange.location];
      }
      methodName;
    });


    // Get method signature
    _methodSignature = [_moduleClass instanceMethodSignatureForSelector:_selector];

    // Process arguments
    NSUInteger numberOfArguments = _methodSignature.numberOfArguments;
    NSMutableArray *argumentBlocks = [[NSMutableArray alloc] initWithCapacity:numberOfArguments - 2];

#define RCT_ARG_BLOCK(_logic) \
  [argumentBlocks addObject:^(__unused RCTBridge *bridge, __unused NSNumber *context, NSInvocation *invocation, NSUInteger index, id json) { \
    _logic \
    [invocation setArgument:&value atIndex:index]; \
  }]; \

    void (^addBlockArgument)(void) = ^{
      RCT_ARG_BLOCK(

        if (RCT_DEBUG && json && ![json isKindOfClass:[NSNumber class]]) {
          RCTLogError(@"Argument %tu (%@) of %@.%@ should be a number", index,
                      json, RCTBridgeModuleNameForClass(_moduleClass), _JSMethodName);
          return;
        }

        // Marked as autoreleasing, because NSInvocation doesn't retain arguments
        __autoreleasing id value = (json ? ^(NSArray *args) {
          [bridge _invokeAndProcessModule:@"BatchedBridge"
                                   method:@"invokeCallbackAndReturnFlushedQueue"
                                arguments:@[json, args]
                                  context:context];
        } : ^(__unused NSArray *unused) {});
      )
    };

    void (^defaultCase)(const char *) = ^(const char *argumentType) {
      static const char *blockType = @encode(typeof(^{}));
      if (!strcmp(argumentType, blockType)) {
        addBlockArgument();
      } else {
        RCT_ARG_BLOCK( id value = json; )
      }
    };

    for (NSUInteger i = 2; i < numberOfArguments; i++) {
      const char *argumentType = [_methodSignature getArgumentTypeAtIndex:i];

      NSString *argumentName = argumentNames[i - 2];
      SEL selector = NSSelectorFromString([argumentName stringByAppendingString:@":"]);
      if ([RCTConvert respondsToSelector:selector]) {
        switch (argumentType[0]) {

#define RCT_CONVERT_CASE(_value, _type) \
case _value: { \
  _type (*convert)(id, SEL, id) = (typeof(convert))objc_msgSend; \
  RCT_ARG_BLOCK( _type value = convert([RCTConvert class], selector, json); ) \
  break; \
}

            RCT_CONVERT_CASE(':', SEL)
            RCT_CONVERT_CASE('*', const char *)
            RCT_CONVERT_CASE('c', char)
            RCT_CONVERT_CASE('C', unsigned char)
            RCT_CONVERT_CASE('s', short)
            RCT_CONVERT_CASE('S', unsigned short)
            RCT_CONVERT_CASE('i', int)
            RCT_CONVERT_CASE('I', unsigned int)
            RCT_CONVERT_CASE('l', long)
            RCT_CONVERT_CASE('L', unsigned long)
            RCT_CONVERT_CASE('q', long long)
            RCT_CONVERT_CASE('Q', unsigned long long)
            RCT_CONVERT_CASE('f', float)
            RCT_CONVERT_CASE('d', double)
            RCT_CONVERT_CASE('B', BOOL)
            RCT_CONVERT_CASE('@', id)
            RCT_CONVERT_CASE('^', void *)

            case '{': {
              [argumentBlocks addObject:^(__unused RCTBridge *bridge, __unused NSNumber *context, NSInvocation *invocation, NSUInteger index, id json) {
                NSMethodSignature *methodSignature = [RCTConvert methodSignatureForSelector:selector];
                void *returnValue = malloc(methodSignature.methodReturnLength);
                NSInvocation *_invocation = [NSInvocation invocationWithMethodSignature:methodSignature];
                [_invocation setTarget:[RCTConvert class]];
                [_invocation setSelector:selector];
                [_invocation setArgument:&json atIndex:2];
                [_invocation invoke];
                [_invocation getReturnValue:returnValue];

                [invocation setArgument:returnValue atIndex:index];

                  free(returnValue);
                }];
                break;
              }

            default:
              defaultCase(argumentType);
          }
        } else if ([argumentName isEqualToString:@"RCTResponseSenderBlock"]) {
          addBlockArgument();
        } else if ([argumentName isEqualToString:@"RCTPromiseResolveBlock"]) {
          RCTAssert(i == numberOfArguments - 2,
                    @"The RCTPromiseResolveBlock must be the second to last parameter in -[%@ %@]",
                    _moduleClassName, objCMethodName);
          RCT_ARG_BLOCK(
            if (RCT_DEBUG && ![json isKindOfClass:[NSNumber class]]) {
              RCTLogError(@"Argument %tu (%@) of %@.%@ must be a promise resolver ID", index,
                          json, RCTBridgeModuleNameForClass(_moduleClass), _JSMethodName);
              return;
            }

            // Marked as autoreleasing, because NSInvocation doesn't retain arguments
            __autoreleasing RCTPromiseResolveBlock value = (^(id result) {
              NSArray *arguments = result ? @[result] : @[];
              [bridge _invokeAndProcessModule:@"BatchedBridge"
                                       method:@"invokeCallbackAndReturnFlushedQueue"
                                    arguments:@[json, arguments]
                                      context:context];
            });
          )
          _functionKind = RCTJavaScriptFunctionKindAsync;
        } else if ([argumentName isEqualToString:@"RCTPromiseRejectBlock"]) {
          RCTAssert(i == numberOfArguments - 1,
                    @"The RCTPromiseRejectBlock must be the last parameter in -[%@ %@]",
                    _moduleClassName, objCMethodName);
          RCT_ARG_BLOCK(
            if (RCT_DEBUG && ![json isKindOfClass:[NSNumber class]]) {
              RCTLogError(@"Argument %tu (%@) of %@.%@ must be a promise rejecter ID", index,
                          json, RCTBridgeModuleNameForClass(_moduleClass), _JSMethodName);
              return;
            }

            // Marked as autoreleasing, because NSInvocation doesn't retain arguments
            __autoreleasing RCTPromiseRejectBlock value = (^(NSError *error) {
              NSDictionary *errorJSON = RCTJSErrorFromNSError(error);
              [bridge _invokeAndProcessModule:@"BatchedBridge"
                                       method:@"invokeCallbackAndReturnFlushedQueue"
                                    arguments:@[json, @[errorJSON]]
                                      context:context];
            });
          )
          _functionKind = RCTJavaScriptFunctionKindAsync;
        } else {

          // Unknown argument type
          RCTLogError(@"Unknown argument type '%@' in method %@. Extend RCTConvert"
              " to support this type.", argumentName, [self methodName]);
        }
    }

    _argumentBlocks = [argumentBlocks copy];
  }

  return self;
}

- (void)invokeWithBridge:(RCTBridge *)bridge
                  module:(id)module
               arguments:(NSArray *)arguments
                 context:(NSNumber *)context
{
  if (RCT_DEBUG) {

    // Sanity check
    RCTAssert([module class] == _moduleClass, @"Attempted to invoke method \
              %@ on a module of class %@", [self methodName], [module class]);

    // Safety check
    if (arguments.count != _argumentBlocks.count) {
      NSInteger actualCount = arguments.count;
      NSInteger expectedCount = _argumentBlocks.count;

      // Subtract the implicit Promise resolver and rejecter functions for implementations of async functions
      if (_functionKind == RCTJavaScriptFunctionKindAsync) {
        actualCount -= 2;
        expectedCount -= 2;
      }

      RCTLogError(@"%@.%@ was called with %zd arguments, but expects %zd",
                  RCTBridgeModuleNameForClass(_moduleClass), _JSMethodName,
                  actualCount, expectedCount);
      return;
    }
  }

  // Create invocation (we can't re-use this as it wouldn't be thread-safe)
  NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:_methodSignature];
  [invocation setArgument:&_selector atIndex:1];
  [invocation retainArguments];

  // Set arguments
  NSUInteger index = 0;
  for (id json in arguments) {
    id arg = RCTNilIfNull(json);
    void (^block)(RCTBridge *, NSNumber *, NSInvocation *, NSUInteger, id) = _argumentBlocks[index];
    block(bridge, context, invocation, index + 2, arg);
    index++;
  }

  // Invoke method
  [invocation invokeWithTarget:module];
}

- (NSString *)methodName
{
  return [NSString stringWithFormat:@"-[%@ %@]", _moduleClass,
          NSStringFromSelector(_selector)];
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@: %p; exports %@ as %@();>",
          [self class], self, [self methodName], _JSMethodName];
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
    methodsByModuleID = [[RCTSparseArray alloc] initWithCapacity:[RCTModuleClassesByID count]];

    [RCTModuleClassesByID enumerateObjectsUsingBlock:
     ^(Class moduleClass, NSUInteger moduleID, __unused BOOL *stop) {

      methodsByModuleID[moduleID] = [[NSMutableArray alloc] init];

      unsigned int methodCount;
      Method *methods = class_copyMethodList(object_getClass(moduleClass), &methodCount);

      for (unsigned int i = 0; i < methodCount; i++) {
        Method method = methods[i];
        SEL selector = method_getName(method);
        if ([NSStringFromSelector(selector) hasPrefix:@"__rct_export__"]) {
          IMP imp = method_getImplementation(method);
          NSArray *entries = ((NSArray *(*)(id, SEL))imp)(moduleClass, selector);
          RCTModuleMethod *moduleMethod =
            [[RCTModuleMethod alloc] initWithObjCMethodName:entries[1]
                                               JSMethodName:entries[0]
                                               moduleClass:moduleClass];

          [methodsByModuleID[moduleID] addObject:moduleMethod];
        }
      }

      free(methods);

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
 *       "type": "remoteAsync"
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
    [RCTModuleClassesByID enumerateObjectsUsingBlock:
     ^(Class moduleClass, NSUInteger moduleID, __unused BOOL *stop) {

      NSArray *methods = RCTExportedMethodsByModuleID()[moduleID];
      NSMutableDictionary *methodsByName = [NSMutableDictionary dictionaryWithCapacity:methods.count];
      [methods enumerateObjectsUsingBlock:
       ^(RCTModuleMethod *method, NSUInteger methodID, __unused BOOL *_stop) {
        methodsByName[method.JSMethodName] = @{
          @"methodID": @(methodID),
          @"type": method.functionKind == RCTJavaScriptFunctionKindAsync ? @"remoteAsync" : @"remote",
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
  [modulesByName enumerateKeysAndObjectsUsingBlock:
   ^(NSString *moduleName, id<RCTBridgeModule> module, __unused BOOL *stop) {

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
static NSMutableArray *RCTLocalModuleNames;
static NSMutableArray *RCTLocalMethodNames;
static NSDictionary *RCTLocalModulesConfig()
{
  static NSMutableDictionary *localModules;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{

    RCTLocalModuleIDs = [[NSMutableDictionary alloc] init];
    RCTLocalMethodIDs = [[NSMutableDictionary alloc] init];
    RCTLocalModuleNames = [[NSMutableArray alloc] init];
    RCTLocalMethodNames = [[NSMutableArray alloc] init];

    localModules = [[NSMutableDictionary alloc] init];
    for (NSString *moduleDotMethod in RCTJSMethods()) {

      NSArray *parts = [moduleDotMethod componentsSeparatedByString:@"."];
      RCTAssert(parts.count == 2, @"'%@' is not a valid JS method definition - expected 'Module.method' format.", moduleDotMethod);

      // Add module if it doesn't already exist
      NSString *moduleName = parts[0];
      NSDictionary *module = localModules[moduleName];
      if (!module) {
        module = @{
          @"moduleID": @(localModules.count),
          @"methods": [[NSMutableDictionary alloc] init]
        };
        localModules[moduleName] = module;
      [RCTLocalModuleNames addObject:moduleName];
      }

      // Add method if it doesn't already exist
      NSString *methodName = parts[1];
      NSMutableDictionary *methods = module[@"methods"];
      if (!methods[methodName]) {
        methods[methodName] = @{
          @"methodID": @(methods.count),
          @"type": @"local"
        };
        [RCTLocalMethodNames addObject:methodName];
      }

      // Add module and method lookup
      RCTLocalModuleIDs[moduleDotMethod] = module[@"moduleID"];
      RCTLocalMethodIDs[moduleDotMethod] = methods[methodName][@"methodID"];
    }
  });

  return localModules;
}

@interface RCTFrameUpdate (Private)

- (instancetype)initWithDisplayLink:(CADisplayLink *)displayLink;

@end

@implementation RCTFrameUpdate

- (instancetype)initWithDisplayLink:(CADisplayLink *)displayLink
{
  if ((self = [super init])) {
    _timestamp = displayLink.timestamp;
    _deltaTime = displayLink.duration;
  }
  return self;
}

@end

@implementation RCTBridge

static id<RCTJavaScriptExecutor> _latestJSExecutor;

#if RCT_DEBUG

+ (void)initialize
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{

    static unsigned int classCount;
    Class *classes = objc_copyClassList(&classCount);

    for (unsigned int i = 0; i < classCount; i++)
    {
      Class cls = classes[i];
      Class superclass = cls;
      while (superclass)
      {
        if (class_conformsToProtocol(superclass, @protocol(RCTBridgeModule)))
        {
          if (![RCTModuleClassesByID containsObject:cls]) {
            RCTLogError(@"Class %@ was not exported. Did you forget to use RCT_EXPORT_MODULE()?", NSStringFromClass(cls));
          }
          break;
        }
        superclass = class_getSuperclass(superclass);
      }
    }

    free(classes);

  });
}

#endif

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                   moduleProvider:(RCTBridgeModuleProviderBlock)block
                    launchOptions:(NSDictionary *)launchOptions
{
  RCTAssertMainThread();

  if ((self = [super init])) {

    /**
     * Pre register modules
     */
    RCTLocalModulesConfig();

    _bundleURL = bundleURL;
    _moduleProvider = block;
    _launchOptions = [launchOptions copy];
    [self bindKeys];
    [self setUp];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-init)

- (void)dealloc
{
  /**
   * This runs only on the main thread, but crashes the subclass
   * RCTAssertMainThread();
   */
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [self invalidate];
}

- (void)bindKeys
{
  RCTAssertMainThread();

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(reload)
                                               name:RCTReloadNotification
                                             object:nil];

#if TARGET_IPHONE_SIMULATOR

  __weak RCTBridge *weakSelf = self;
  RCTKeyCommands *commands = [RCTKeyCommands sharedInstance];

  // reload in current mode
  [commands registerKeyCommandWithInput:@"r"
                          modifierFlags:UIKeyModifierCommand
                                 action:^(__unused UIKeyCommand *command) {
                                   [weakSelf reload];
                                 }];

#endif

}

- (RCTEventDispatcher *)eventDispatcher
{
  return self.modules[RCTBridgeModuleNameForClass([RCTEventDispatcher class])];
}

- (void)reload
{
  /**
   * AnyThread
   */
  dispatch_async(dispatch_get_main_queue(), ^{
    [self invalidate];
    [self setUp];
  });
}

- (void)setUp
{
  RCTAssertMainThread();

  _batchedBridge = [[RCTBatchedBridge alloc] initWithParentBridge:self];
}

- (BOOL)isLoading
{
  return _batchedBridge.loading;
}

- (BOOL)isValid
{
  return _batchedBridge.isValid;
}

- (void)invalidate
{
  RCTAssertMainThread();

  [_batchedBridge invalidate];
  _batchedBridge = nil;
}

+ (void)logMessage:(NSString *)message level:(NSString *)level
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (!_latestJSExecutor.isValid) {
      return;
    }

    [_latestJSExecutor executeJSCall:@"RCTLog"
                              method:@"logIfNoNativeHook"
                           arguments:@[level, message]
                             context:RCTGetExecutorID(_latestJSExecutor)
                            callback:^(__unused id json, __unused NSError *error) {}];
  });
}

- (NSDictionary *)modules
{
  return _batchedBridge.modules;
}

#define RCT_INNER_BRIDGE_ONLY(...) \
- (void)__VA_ARGS__ \
{ \
  RCTLogMustFix(@"Called method \"%@\" on top level bridge. This method should \
              only be called from bridge instance in a bridge module", @(__func__)); \
}

- (void)enqueueJSCall:(NSString *)moduleDotMethod args:(NSArray *)args
{
  [self.batchedBridge enqueueJSCall:moduleDotMethod args:args];
}

RCT_INNER_BRIDGE_ONLY(_invokeAndProcessModule:(__unused NSString *)module
                      method:(__unused NSString *)method
                      arguments:(__unused NSArray *)args
                      context:(__unused NSNumber *)context)

@end

@implementation RCTBatchedBridge
{
  BOOL _loading;
  __weak id<RCTJavaScriptExecutor> _javaScriptExecutor;
  RCTSparseArray *_modulesByID;
  RCTSparseArray *_queuesByID;
  dispatch_queue_t _methodQueue;
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
    _frameUpdateObservers = [[NSMutableSet alloc] init];
    _scheduledCalls = [[NSMutableArray alloc] init];
    _scheduledCallbacks = [[RCTSparseArray alloc] init];
    _queuesByID = [[RCTSparseArray alloc] init];
    _jsDisplayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(_jsThreadUpdate:)];

    if (RCT_DEV) {
      _mainDisplayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(_mainThreadUpdate:)];
      [_mainDisplayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
    }

    /**
     * Initialize and register bridge modules *before* adding the display link
     * so we don't have threading issues
     */
    _methodQueue = dispatch_queue_create("com.facebook.React.BridgeMethodQueue", DISPATCH_QUEUE_SERIAL);
    [self registerModules];

    /**
     * Start the application script
     */
    [self initJS];
  }
  return self;
}

- (instancetype)initWithBundleURL:(__unused NSURL *)bundleURL
                   moduleProvider:(__unused RCTBridgeModuleProviderBlock)block
                    launchOptions:(__unused NSDictionary *)launchOptions
{
  return [self initWithParentBridge:nil];
}

/**
 * Override to ensure that we won't create another nested bridge
 */
- (void)setUp {}

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
  _modulesByID = [[RCTSparseArray alloc] init];
  NSMutableDictionary *modulesByName = [preregisteredModules mutableCopy];
  [RCTModuleClassesByID enumerateObjectsUsingBlock:
   ^(Class moduleClass, NSUInteger moduleID, __unused BOOL *stop) {
    NSString *moduleName = RCTModuleNamesByID[moduleID];
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
      // Store module instance
      _modulesByID[moduleID] = modulesByName[moduleName] = module;
    }
  }];

  // Store modules
  _modulesByName = [modulesByName copy];

  /**
   * The executor is a bridge module, wait for it to be created and set it before
   * any other module has access to the bridge
   */
  _javaScriptExecutor = _modulesByName[RCTBridgeModuleNameForClass(self.executorClass)];
  _latestJSExecutor = _javaScriptExecutor;
  RCTSetExecutorID(_javaScriptExecutor);

  [_javaScriptExecutor setUp];

  // Set bridge
  for (id<RCTBridgeModule> module in _modulesByName.allValues) {
    if ([module respondsToSelector:@selector(setBridge:)]) {
      module.bridge = self;
    }
  }

  // Get method queues
  [_modulesByID enumerateObjectsUsingBlock:
   ^(id<RCTBridgeModule> module, NSNumber *moduleID, __unused BOOL *stop) {
    if ([module respondsToSelector:@selector(methodQueue)]) {
      dispatch_queue_t queue = [module methodQueue];
      if (queue) {
        _queuesByID[moduleID] = queue;
      } else {
        _queuesByID[moduleID] = (id)kCFNull;
      }
    }

    if ([module conformsToProtocol:@protocol(RCTFrameUpdateObserver)]) {
      [_frameUpdateObservers addObject:module];
   }
  }];
}

- (void)initJS
{
  RCTAssertMainThread();

  // Inject module data into JS context
  NSString *configJSON = RCTJSONStringify(@{
    @"remoteModuleConfig": RCTRemoteModulesConfig(_modulesByName),
    @"localModulesConfig": RCTLocalModulesConfig()
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

    RCTJavaScriptLoader *loader = [[RCTJavaScriptLoader alloc] initWithBridge:self];
    [loader loadBundleAtURL:bundleURL onComplete:^(NSError *error, NSString *script) {

      _loading = NO;
      if (!self.isValid) {
        return;
      }

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
  if (!self.isValid) {
    return nil;
  }

  RCTAssert(_modulesByName != nil, @"Bridge modules have not yet been initialized. "
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
  if (_latestJSExecutor == _javaScriptExecutor) {
    _latestJSExecutor = nil;
  }

  void (^mainThreadInvalidate)(void) = ^{
    RCTAssertMainThread();

    [_mainDisplayLink invalidate];
    _mainDisplayLink = nil;

    // Invalidate modules
    for (id target in _modulesByID.allObjects) {
      if ([target respondsToSelector:@selector(invalidate)]) {
        [self dispatchBlock:^{
          [(id<RCTInvalidating>)target invalidate];
        } forModule:target];
      }
    }

    // Release modules (breaks retain cycle if module has strong bridge reference)
    _frameUpdateObservers = nil;
    _modulesByID = nil;
    _queuesByID = nil;
    _modulesByName = nil;
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

/**
 * - TODO (#5906496): When we build a `MessageQueue.m`, handling all the requests could
 * cause both a queue of "responses". We would flush them here. However, we
 * currently just expect each objc block to handle its own response sending
 * using a `RCTResponseSenderBlock`.
 */

#pragma mark - RCTBridge methods

/**
 * Public. Can be invoked from any thread.
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
                      arguments:@[moduleID ?: @0, methodID ?: @0, args ?: @[]]
                        context:RCTGetExecutorID(_javaScriptExecutor)];
}

/**
 * Private hack to support `setTimeout(fn, 0)`
 */
- (void)_immediatelyCallTimer:(NSNumber *)timer
{
  RCTAssertJSThread();

  NSString *moduleDotMethod = @"RCTJSTimers.callTimers";
  NSNumber *moduleID = RCTLocalModuleIDs[moduleDotMethod];
  RCTAssert(moduleID != nil, @"Module '%@' not registered.",
            [[moduleDotMethod componentsSeparatedByString:@"."] firstObject]);

  NSNumber *methodID = RCTLocalMethodIDs[moduleDotMethod];
  RCTAssert(methodID != nil, @"Method '%@' not registered.", moduleDotMethod);

  dispatch_block_t block = ^{
    [self _actuallyInvokeAndProcessModule:@"BatchedBridge"
                                   method:@"callFunctionReturnFlushedQueue"
                                arguments:@[moduleID, methodID, @[@[timer]]]
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

  RCTProfileBeginEvent();

  [_javaScriptExecutor executeApplicationScript:script sourceURL:url onComplete:^(NSError *scriptLoadError) {
    RCTAssertJSThread();

    RCTProfileEndEvent(@"ApplicationScript", @"js_call,init", scriptLoadError);
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

- (void)dispatchBlock:(dispatch_block_t)block forModule:(id<RCTBridgeModule>)module
{
  [self dispatchBlock:block forModuleID:RCTModuleIDsByName[RCTBridgeModuleNameForClass([module class])]];
}

- (void)dispatchBlock:(dispatch_block_t)block forModuleID:(NSNumber *)moduleID
{
  RCTAssertJSThread();

  id queue = nil;
  if (moduleID) {
    queue = _queuesByID[moduleID];
  }

  if (queue == (id)kCFNull) {
    [_javaScriptExecutor executeBlockOnJavaScriptQueue:block];
  } else {
    dispatch_async(queue ?: _methodQueue, block);
  }
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

#endif

  NSArray *moduleIDs = requestsArray[RCTBridgeFieldRequestModuleIDs];
  NSArray *methodIDs = requestsArray[RCTBridgeFieldMethodIDs];
  NSArray *paramsArrays = requestsArray[RCTBridgeFieldParamss];

  NSUInteger numRequests = [moduleIDs count];

  if (RCT_DEBUG && (numRequests != methodIDs.count || numRequests != paramsArrays.count)) {
    RCTLogError(@"Invalid data message - all must be length: %zd", numRequests);
    return;
  }

  NSMapTable *buckets = [[NSMapTable alloc] initWithKeyOptions:NSPointerFunctionsStrongMemory valueOptions:NSPointerFunctionsStrongMemory capacity:_queuesByID.count];
  for (NSUInteger i = 0; i < numRequests; i++) {
    id queue = RCTNullIfNil(_queuesByID[moduleIDs[i]]);
    NSMutableOrderedSet *set = [buckets objectForKey:queue];
    if (!set) {
      set = [[NSMutableOrderedSet alloc] init];
      [buckets setObject:set forKey:queue];
    }
    [set addObject:@(i)];
  }

  for (id queue in buckets) {
    RCTProfileBeginFlowEvent();
    dispatch_block_t block = ^{
      RCTProfileEndFlowEvent();
      RCTProfileBeginEvent();

      NSOrderedSet *calls = [buckets objectForKey:queue];
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
    };

    if (queue == (id)kCFNull) {
      [_javaScriptExecutor executeBlockOnJavaScriptQueue:block];
    } else {
      dispatch_async(queue, block);
    }
  }

  // TODO: batchDidComplete is only used by RCTUIManager - can we eliminate this special case?
  [_modulesByID enumerateObjectsUsingBlock:
   ^(id<RCTBridgeModule> module, NSNumber *moduleID, __unused BOOL *stop) {
    if ([module respondsToSelector:@selector(batchDidComplete)]) {
      [self dispatchBlock:^{
        [module batchDidComplete];
      } forModuleID:moduleID];
    }
  }];
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

  // Look up method
  NSArray *methods = RCTExportedMethodsByModuleID()[moduleID];

  if (RCT_DEBUG && methodID >= methods.count) {
    RCTLogError(@"Unknown methodID: %zd for module: %zd (%@)", methodID, moduleID, RCTModuleNamesByID[moduleID]);
    return NO;
  }

  RCTProfileBeginEvent();

  RCTModuleMethod *method = methods[methodID];

  // Look up module
  id module = self->_modulesByID[moduleID];
  if (RCT_DEBUG && !module) {
    RCTLogError(@"No module found for name '%@'", RCTModuleNamesByID[moduleID]);
    return NO;
  }

  @try {
    [method invokeWithBridge:self module:module arguments:params context:context];
  }
  @catch (NSException *exception) {
    RCTLogError(@"Exception thrown while invoking %@ on target %@ with params %@: %@", method.JSMethodName, module, params, exception);
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
  for (id<RCTFrameUpdateObserver> observer in _frameUpdateObservers) {
    if (![observer respondsToSelector:@selector(isPaused)] || ![observer isPaused]) {
      RCT_IF_DEV(NSString *name = [NSString stringWithFormat:@"[%@ didUpdateFrame:%f]", observer, displayLink.timestamp];)
      RCTProfileBeginFlowEvent();
      [self dispatchBlock:^{
        RCTProfileEndFlowEvent();
        RCTProfileBeginEvent();
        [observer didUpdateFrame:frameUpdate];
        RCTProfileEndEvent(name, @"objc_call,fps", nil);
      } forModule:(id<RCTBridgeModule>)observer];
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
    [self.perfStats.jsGraph tick:displayLink.timestamp];
  });
}

- (void)_mainThreadUpdate:(CADisplayLink *)displayLink
{
  RCTAssertMainThread();

  RCTProfileImmediateEvent(@"VSYNC", displayLink.timestamp, @"g");

  [self.perfStats.uiGraph tick:displayLink.timestamp];
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
       }
     }];

    [task resume];
  }];
}

@end
