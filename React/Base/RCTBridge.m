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

#import "RCTContextExecutor.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTJavaScriptLoader.h"
#import "RCTKeyCommands.h"
#import "RCTLog.h"
#import "RCTProfile.h"
#import "RCTRedBox.h"
#import "RCTRootView.h"
#import "RCTSparseArray.h"
#import "RCTUtils.h"

NSString *const RCTReloadNotification = @"RCTReloadNotification";
NSString *const RCTJavaScriptDidLoadNotification = @"RCTJavaScriptDidLoadNotification";

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
 * Temporarily allow to turn on and off the call batching in case someone wants
 * to profile both
 */
#define BATCHED_BRIDGE 1

#ifdef __LP64__
typedef uint64_t RCTHeaderValue;
typedef struct section_64 RCTHeaderSection;
#define RCTGetSectByNameFromHeader getsectbynamefromheader_64
#else
typedef uint32_t RCTHeaderValue;
typedef struct section RCTHeaderSection;
#define RCTGetSectByNameFromHeader getsectbynamefromheader
#endif

NSString *const RCTEnqueueNotification = @"RCTEnqueueNotification";
NSString *const RCTDequeueNotification = @"RCTDequeueNotification";

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
    const RCTHeaderSection *section = RCTGetSectByNameFromHeader((void *)mach_header, "__DATA", "RCTImport");

    if (section) {
      for (RCTHeaderValue addr = section->offset;
           addr < section->offset + section->size;
           addr += sizeof(const char **)) {

        // Get data entry
        NSString *entry = @(*(const char **)(mach_header + addr));
        [uniqueMethods addObject:entry];
      }
    }

    JSMethods = [uniqueMethods allObjects];
  });

  return JSMethods;
}

/**
 * This function scans all exported modules available at runtime and returns an
 * array. As a backup, it also scans all classes that implement the
 * RTCBridgeModule protocol to ensure they've been exported. This scanning
 * functionality is disabled in release mode to improve startup performance.
 */
static NSArray *RCTModuleNamesByID;
static NSArray *RCTModuleClassesByID;
static NSArray *RCTBridgeModuleClassesByModuleID(void)
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{

    RCTModuleNamesByID = [NSMutableArray array];
    RCTModuleClassesByID = [NSMutableArray array];

    Dl_info info;
    dladdr(&RCTBridgeModuleClassesByModuleID, &info);

    const RCTHeaderValue mach_header = (RCTHeaderValue)info.dli_fbase;
    const RCTHeaderSection *section = RCTGetSectByNameFromHeader((void *)mach_header, "__DATA", "RCTExportModule");

    if (section) {
      for (RCTHeaderValue addr = section->offset;
           addr < section->offset + section->size;
           addr += sizeof(const char **)) {

        // Get data entry
        NSString *entry = @(*(const char **)(mach_header + addr));
        NSArray *parts = [[entry substringWithRange:(NSRange){2, entry.length - 3}]
                          componentsSeparatedByString:@" "];

        // Parse class name
        NSString *moduleClassName = parts[0];
        NSRange categoryRange = [moduleClassName rangeOfString:@"("];
        if (categoryRange.length) {
          moduleClassName = [moduleClassName substringToIndex:categoryRange.location];
        }

        // Get class
        Class cls = NSClassFromString(moduleClassName);
        RCTAssert([cls conformsToProtocol:@protocol(RCTBridgeModule)],
                  @"%@ does not conform to the RCTBridgeModule protocol",
                  NSStringFromClass(cls));

        // Register module
        [(NSMutableArray *)RCTModuleNamesByID addObject:RCTBridgeModuleNameForClass(cls)];
        [(NSMutableArray *)RCTModuleClassesByID addObject:cls];
      }
    }

    if (RCT_DEBUG) {

      // We may be able to get rid of this check in future, once people
      // get used to the new registration system. That would potentially
      // allow you to create modules that are not automatically registered

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
    }

  });

  return RCTModuleClassesByID;
}

@interface RCTBridge ()

- (void)_invokeAndProcessModule:(NSString *)module
                         method:(NSString *)method
                      arguments:(NSArray *)args
                        context:(NSNumber *)context;

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

@end

@implementation RCTModuleMethod
{
  BOOL _isClassMethod;
  Class _moduleClass;
  SEL _selector;
  NSMethodSignature *_methodSignature;
  NSArray *_argumentBlocks;
  NSString *_methodName;
  dispatch_block_t _methodQueue;
}

static Class _globalExecutorClass;

static NSString *RCTStringUpToFirstArgument(NSString *methodName)
{
  NSRange colonRange = [methodName rangeOfString:@":"];
  if (colonRange.length) {
    methodName = [methodName substringToIndex:colonRange.location];
  }
  return methodName;
}

- (instancetype)initWithReactMethodName:(NSString *)reactMethodName
                         objCMethodName:(NSString *)objCMethodName
                           JSMethodName:(NSString *)JSMethodName
{
  if ((self = [super init])) {
    _methodName = reactMethodName;
    NSArray *parts = [[reactMethodName substringWithRange:(NSRange){2, reactMethodName.length - 3}] componentsSeparatedByString:@" "];

    // Parse class and method
    _moduleClassName = parts[0];
    NSRange categoryRange = [_moduleClassName rangeOfString:@"("];
    if (categoryRange.length) {
      _moduleClassName = [_moduleClassName substringToIndex:categoryRange.location];
    }

    NSArray *argumentNames = nil;
    if ([parts[1] hasPrefix:@"__rct_export__"]) {
      // New format
      NSString *selectorString = [parts[1] substringFromIndex:14];
      _selector = NSSelectorFromString(selectorString);
      _JSMethodName = JSMethodName ?: RCTStringUpToFirstArgument(selectorString);

      static NSRegularExpression *regExp;
      if (!regExp) {
        NSString *unusedPattern = @"(?:(?:__unused|__attribute__\\(\\(unused\\)\\)))";
        NSString *constPattern = @"(?:const)";
        NSString *constUnusedPattern = [NSString stringWithFormat:@"(?:(?:%@|%@)\\s*)", unusedPattern, constPattern];
        NSString *pattern = [NSString stringWithFormat:@"\\(%1$@?(\\w+?)(?:\\s*\\*)?%1$@?\\)", constUnusedPattern];
        regExp = [[NSRegularExpression alloc] initWithPattern:pattern options:0 error:NULL];
      }

      argumentNames = [NSMutableArray array];
      [regExp enumerateMatchesInString:objCMethodName options:0 range:NSMakeRange(0, objCMethodName.length) usingBlock:^(NSTextCheckingResult *result, NSMatchingFlags flags, BOOL *stop) {
        NSString *argumentName = [objCMethodName substringWithRange:[result rangeAtIndex:1]];
        [(NSMutableArray *)argumentNames addObject:argumentName];
      }];
    } else {
      // Old format
      NSString *selectorString = parts[1];
      _selector = NSSelectorFromString(selectorString);
      _JSMethodName = JSMethodName ?: RCTStringUpToFirstArgument(selectorString);
    }

    // Extract class and method details
    _isClassMethod = [reactMethodName characterAtIndex:0] == '+';
    _moduleClass = NSClassFromString(_moduleClassName);

    if (RCT_DEBUG) {

      // Sanity check
      RCTAssert([_moduleClass conformsToProtocol:@protocol(RCTBridgeModule)],
                @"You are attempting to export the method %@, but %@ does not \
                conform to the RCTBridgeModule Protocol", objCMethodName, _moduleClassName);
    }

    // Get method signature
    _methodSignature = _isClassMethod ?
    [_moduleClass methodSignatureForSelector:_selector] :
    [_moduleClass instanceMethodSignatureForSelector:_selector];

    // Process arguments
    NSUInteger numberOfArguments = _methodSignature.numberOfArguments;
    NSMutableArray *argumentBlocks = [[NSMutableArray alloc] initWithCapacity:numberOfArguments - 2];

#define RCT_ARG_BLOCK(_logic) \
  [argumentBlocks addObject:^(RCTBridge *bridge, NSNumber *context, NSInvocation *invocation, NSUInteger index, id json) { \
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
        } : ^(NSArray *unused) {});
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

      BOOL useFallback = YES;
      if (argumentNames) {
        NSString *argumentName = argumentNames[i - 2];
        SEL selector = NSSelectorFromString([argumentName stringByAppendingString:@":"]);
        if ([RCTConvert respondsToSelector:selector]) {
          useFallback = NO;
          switch (argumentType[0]) {

#define RCT_CONVERT_CASE(_value, _type) \
  case _value: { \
    _type (*convert)(id, SEL, id) = (typeof(convert))[RCTConvert methodForSelector:selector]; \
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
            case '{':
              RCTAssert(NO, @"Argument %zd of %C[%@ %@] is defined as %@, however RCT_EXPORT_METHOD() "
                        "does not currently support struct-type arguments.", i - 2,
                        [reactMethodName characterAtIndex:0], _moduleClassName,
                        objCMethodName, argumentName);
              break;
            default:
              defaultCase(argumentType);
          }
        } else if ([argumentName isEqualToString:@"RCTResponseSenderBlock"]) {
          addBlockArgument();
          useFallback = NO;
        }
      }

      if (useFallback) {
        switch (argumentType[0]) {

#define RCT_CASE(_value, _class, _logic) \
  case _value: {                   \
    RCT_ARG_BLOCK( \
      if (RCT_DEBUG && json && ![json isKindOfClass:[_class class]]) { \
        RCTLogError(@"Argument %tu (%@) of %@.%@ should be of type %@", index, \
          json, RCTBridgeModuleNameForClass(_moduleClass), _JSMethodName, [_class class]); \
        return; \
      } \
      _logic \
    ) \
    break; \
  }

            RCT_CASE(':', NSString, SEL value = NSSelectorFromString(json); )
            RCT_CASE('*', NSString, const char *value = [json UTF8String]; )

#define RCT_SIMPLE_CASE(_value, _type, _selector) \
  case _value: {                              \
    RCT_ARG_BLOCK( \
      if (RCT_DEBUG && json && ![json respondsToSelector:@selector(_selector)]) { \
        RCTLogError(@"Argument %tu (%@) of %@.%@ does not respond to selector: %@", \
          index, json, RCTBridgeModuleNameForClass(_moduleClass), _JSMethodName, @#_selector); \
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

          default:
            defaultCase(argumentType);
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
                 context:(NSNumber *)context
{
  if (RCT_DEBUG) {

    // Sanity check
    RCTAssert([module class] == _moduleClass, @"Attempted to invoke method \
              %@ on a module of class %@", _methodName, [module class]);

    // Safety check
    if (arguments.count != _argumentBlocks.count) {
      RCTLogError(@"%@.%@ was called with %zd arguments, but expects %zd",
                  RCTBridgeModuleNameForClass(_moduleClass), _JSMethodName,
                  arguments.count, _argumentBlocks.count);
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
    id arg = (json == [NSNull null]) ? nil : json;
    void (^block)(RCTBridge *, NSNumber *, NSInvocation *, NSUInteger, id) = _argumentBlocks[index];
    block(bridge, context, invocation, index + 2, arg);
    index++;
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

    const RCTHeaderValue mach_header = (RCTHeaderValue)info.dli_fbase;
    const RCTHeaderSection *section = RCTGetSectByNameFromHeader((void *)mach_header, "__DATA", "RCTExport");

    if (section == NULL) {
      return;
    }

    NSArray *classes = RCTBridgeModuleClassesByModuleID();
    NSMutableDictionary *methodsByModuleClassName = [NSMutableDictionary dictionaryWithCapacity:[classes count]];

    for (RCTHeaderValue addr = section->offset;
         addr < section->offset + section->size;
         addr += sizeof(const char **) * 3) {

      // Get data entry
      const char **entries = (const char **)(mach_header + addr);

      // Create method
      RCTModuleMethod *moduleMethod;
      if (entries[2] == NULL) {

        // Legacy support for RCT_EXPORT()
        moduleMethod = [[RCTModuleMethod alloc] initWithReactMethodName:@(entries[0])
                                                         objCMethodName:@(entries[0])
                                                           JSMethodName:strlen(entries[1]) ? @(entries[1]) : nil];
      } else {
        moduleMethod = [[RCTModuleMethod alloc] initWithReactMethodName:@(entries[0])
                                                         objCMethodName:strlen(entries[1]) ? @(entries[1]) : nil
                                                           JSMethodName:strlen(entries[2]) ? @(entries[2]) : nil];
      }

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

@interface RCTDisplayLink : NSObject <RCTInvalidating>

- (instancetype)initWithBridge:(RCTBridge *)bridge selector:(SEL)selector NS_DESIGNATED_INITIALIZER;

@end

@interface RCTBridge (RCTDisplayLink)

- (void)_update:(CADisplayLink *)displayLink;

@end

@implementation RCTDisplayLink
{
  __weak RCTBridge *_bridge;
  CADisplayLink *_displayLink;
  SEL _selector;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge selector:(SEL)selector
{
  if ((self = [super init])) {
    _bridge = bridge;
    _selector = selector;
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(_update:)];
    [_displayLink addToRunLoop:[NSRunLoop currentRunLoop] forMode:NSRunLoopCommonModes];
  }
  return self;
}

- (BOOL)isValid
{
  return _displayLink != nil;
}

- (void)invalidate
{
  if (self.isValid) {
    [_displayLink invalidate];
    _displayLink = nil;
  }
}

- (void)_update:(CADisplayLink *)displayLink
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
  [_bridge performSelector:_selector withObject:displayLink];
#pragma clang diagnostic pop
}

@end

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
{
  RCTSparseArray *_modulesByID;
  RCTSparseArray *_queuesByID;
  dispatch_queue_t _methodQueue;
  NSDictionary *_modulesByName;
  id<RCTJavaScriptExecutor> _javaScriptExecutor;
  Class _executorClass;
  NSURL *_bundleURL;
  RCTBridgeModuleProviderBlock _moduleProvider;
  RCTDisplayLink *_displayLink;
  RCTDisplayLink *_vsyncDisplayLink;
  NSMutableSet *_frameUpdateObservers;
  NSMutableArray *_scheduledCalls;
  RCTSparseArray *_scheduledCallbacks;
  BOOL _loading;
}

static id<RCTJavaScriptExecutor> _latestJSExecutor;

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                   moduleProvider:(RCTBridgeModuleProviderBlock)block
                    launchOptions:(NSDictionary *)launchOptions
{
  if ((self = [super init])) {
    _bundleURL = bundleURL;
    _moduleProvider = block;
    _launchOptions = [launchOptions copy];
    [self setUp];
    [self bindKeys];
  }
  return self;
}

- (void)setUp
{
  Class executorClass = _executorClass ?: _globalExecutorClass ?: [RCTContextExecutor class];
  _javaScriptExecutor = RCTCreateExecutor(executorClass);
  _latestJSExecutor = _javaScriptExecutor;
  _eventDispatcher = [[RCTEventDispatcher alloc] initWithBridge:self];
  _methodQueue = dispatch_queue_create("com.facebook.React.BridgeMethodQueue", DISPATCH_QUEUE_SERIAL);
  _frameUpdateObservers = [[NSMutableSet alloc] init];
  _scheduledCalls = [[NSMutableArray alloc] init];
  _scheduledCallbacks = [[RCTSparseArray alloc] init];

  [_javaScriptExecutor executeBlockOnJavaScriptQueue:^{
    _displayLink = [[RCTDisplayLink alloc] initWithBridge:self selector:@selector(_jsThreadUpdate:)];
  }];
  _vsyncDisplayLink = [[RCTDisplayLink alloc] initWithBridge:self selector:@selector(_mainThreadUpdate:)];

  // Register passed-in module instances
  NSMutableDictionary *preregisteredModules = [[NSMutableDictionary alloc] init];
  for (id<RCTBridgeModule> module in _moduleProvider ? _moduleProvider() : nil) {
    preregisteredModules[RCTBridgeModuleNameForClass([module class])] = module;
  }

  // Instantiate modules
  _modulesByID = [[RCTSparseArray alloc] init];
  NSMutableDictionary *modulesByName = [preregisteredModules mutableCopy];
  [RCTBridgeModuleClassesByModuleID() enumerateObjectsUsingBlock:^(Class moduleClass, NSUInteger moduleID, BOOL *stop) {
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

  // Set bridge
  for (id<RCTBridgeModule> module in _modulesByName.allValues) {
    if ([module respondsToSelector:@selector(setBridge:)]) {
      module.bridge = self;
    }
  }

  // Get method queues
  _queuesByID = [[RCTSparseArray alloc] init];
  [_modulesByID enumerateObjectsUsingBlock:^(id<RCTBridgeModule> module, NSNumber *moduleID, BOOL *stop) {
    if ([module respondsToSelector:@selector(methodQueue)]) {
      dispatch_queue_t queue = [module methodQueue];
      if (queue) {
        _queuesByID[moduleID] = queue;
      }
    }
  }];

  // Inject module data into JS context
  NSString *configJSON = RCTJSONStringify(@{
    @"remoteModuleConfig": RCTRemoteModulesConfig(_modulesByName),
    @"localModulesConfig": RCTLocalModulesConfig()
  }, NULL);
  dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
  [_javaScriptExecutor injectJSONText:configJSON
                  asGlobalObjectNamed:@"__fbBatchedBridgeConfig" callback:^(id err) {
                    dispatch_semaphore_signal(semaphore);
                  }];

  _loading = YES;
  if (_javaScriptExecutor == nil) {

    /**
     * HACK (tadeu): If it failed to connect to the debugger, set loading to NO
     * so we can attempt to reload again.
     */
    _loading = NO;

  } else if (_bundleURL) { // Allow testing without a script

    RCTJavaScriptLoader *loader = [[RCTJavaScriptLoader alloc] initWithBridge:self];
    [loader loadBundleAtURL:_bundleURL onComplete:^(NSError *error) {
      _loading = NO;
      if (error != nil) {

#if RCT_DEBUG // Red box is only available in debug mode

        NSArray *stack = [[error userInfo] objectForKey:@"stack"];
        if (stack) {
          [[RCTRedBox sharedInstance] showErrorMessage:[error localizedDescription]
                                             withStack:stack];
        } else {
          [[RCTRedBox sharedInstance] showErrorMessage:[error localizedDescription]
                                           withDetails:[error localizedFailureReason]];
        }

#endif

      } else {

        [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptDidLoadNotification
                                                            object:self];
      }
      [[NSNotificationCenter defaultCenter] addObserver:self
                                               selector:@selector(reload)
                                                   name:RCTReloadNotification
                                                 object:nil];
    }];
  }
}

- (void)bindKeys
{

#if TARGET_IPHONE_SIMULATOR

  __weak RCTBridge *weakSelf = self;
  RCTKeyCommands *commands = [RCTKeyCommands sharedInstance];

  // Workaround around the first cmd+R not working: http://openradar.appspot.com/19613391
  // You can register just the cmd key and do nothing. This will trigger the bug and cmd+R
  // will work like a charm!
  [commands registerKeyCommandWithInput:@""
                          modifierFlags:UIKeyModifierCommand
                                 action:NULL];
  // reload in current mode
  [commands registerKeyCommandWithInput:@"r"
                          modifierFlags:UIKeyModifierCommand
                                 action:^(UIKeyCommand *command) {
                                   [weakSelf reload];
                                 }];
  // reset to normal mode
  [commands registerKeyCommandWithInput:@"n"
                          modifierFlags:UIKeyModifierCommand
                                 action:^(UIKeyCommand *command) {
                                   __strong RCTBridge *strongSelf = weakSelf;
                                   strongSelf.executorClass = Nil;
                                   [strongSelf reload];
                                 }];

#if RCT_DEV // Debug executors are only available in dev mode

  // reload in debug mode
  [commands registerKeyCommandWithInput:@"d"
                          modifierFlags:UIKeyModifierCommand
                                 action:^(UIKeyCommand *command) {
                                   __strong RCTBridge *strongSelf = weakSelf;
                                   strongSelf.executorClass = NSClassFromString(@"RCTWebSocketExecutor");
                                   if (!strongSelf.executorClass) {
                                     strongSelf.executorClass = NSClassFromString(@"RCTWebViewExecutor");
                                   }
                                   if (!strongSelf.executorClass) {
                                     RCTLogError(@"WebSocket debugger is not available. "
                                                 "Did you forget to include RCTWebSocketExecutor?");
                                   }
                                   [strongSelf reload];
                                 }];
#endif
#endif

}

- (NSDictionary *)modules
{
  RCTAssert(_modulesByName != nil, @"Bridge modules have not yet been initialized. "
            "You may be trying to access a module too early in the startup procedure.");

  return _modulesByName;
}

- (void)dealloc
{
  [self invalidate];
}

#pragma mark - RCTInvalidating

- (BOOL)isValid
{
  return _javaScriptExecutor != nil;
}

- (void)invalidate
{
  if (!self.isValid && _modulesByID == nil) {
    return;
  }

  if (![NSThread isMainThread]) {
    [self performSelectorOnMainThread:@selector(invalidate) withObject:nil waitUntilDone:YES];
    return;
  }

  [[NSNotificationCenter defaultCenter] removeObserver:self];

  // Release executor
  if (_latestJSExecutor == _javaScriptExecutor) {
    _latestJSExecutor = nil;
  }
  [_javaScriptExecutor invalidate];
  _javaScriptExecutor = nil;

  [_displayLink invalidate];
  [_vsyncDisplayLink invalidate];
  _frameUpdateObservers = nil;

  // Invalidate modules
  for (id target in _modulesByID.allObjects) {
    if ([target respondsToSelector:@selector(invalidate)]) {
      [(id<RCTInvalidating>)target invalidate];
    }
  }

  // Release modules (breaks retain cycle if module has strong bridge reference)
  _modulesByID = nil;
  _queuesByID = nil;
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

  if (!_loading) {
    [self _invokeAndProcessModule:@"BatchedBridge"
                           method:@"callFunctionReturnFlushedQueue"
                        arguments:@[moduleID, methodID, args ?: @[]]
                          context:RCTGetExecutorID(_javaScriptExecutor)];
  }
}

/**
 * Private hack to support `setTimeout(fn, 0)`
 */
- (void)_immediatelyCallTimer:(NSNumber *)timer
{
  NSString *moduleDotMethod = @"RCTJSTimers.callTimers";
  NSNumber *moduleID = RCTLocalModuleIDs[moduleDotMethod];
  RCTAssert(moduleID != nil, @"Module '%@' not registered.",
            [[moduleDotMethod componentsSeparatedByString:@"."] firstObject]);

  NSNumber *methodID = RCTLocalMethodIDs[moduleDotMethod];
  RCTAssert(methodID != nil, @"Method '%@' not registered.", moduleDotMethod);

  if (!_loading) {
#if BATCHED_BRIDGE
    [self _actuallyInvokeAndProcessModule:@"BatchedBridge"
                                   method:@"callFunctionReturnFlushedQueue"
                                arguments:@[moduleID, methodID, @[@[timer]]]
                                  context:RCTGetExecutorID(_javaScriptExecutor)];

#else

    [self _invokeAndProcessModule:@"BatchedBridge"
                           method:@"callFunctionReturnFlushedQueue"
                        arguments:@[moduleID, methodID, @[@[timer]]]
                          context:RCTGetExecutorID(_javaScriptExecutor)];
#endif
  }
}

- (void)enqueueApplicationScript:(NSString *)script url:(NSURL *)url onComplete:(RCTJavaScriptCompleteBlock)onComplete
{
  RCTAssert(onComplete != nil, @"onComplete block passed in should be non-nil");
  RCTProfileBeginEvent();
  [_javaScriptExecutor executeApplicationScript:script sourceURL:url onComplete:^(NSError *scriptLoadError) {
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
                                  @"json": json ?: [NSNull null],
                                  @"error": error ?: [NSNull null],
                                });

                                [self _handleBuffer:json context:context];

                                onComplete(error);
                              }];
  }];
}

#pragma mark - Payload Generation

- (void)_invokeAndProcessModule:(NSString *)module method:(NSString *)method arguments:(NSArray *)args context:(NSNumber *)context
{
#if BATCHED_BRIDGE
  RCTProfileBeginEvent();

  if ([module isEqualToString:@"RCTEventEmitter"]) {
    for (NSDictionary *call in _scheduledCalls) {
      if ([call[@"module"] isEqualToString:module] && [call[@"method"] isEqualToString:method] && [call[@"args"][0] isEqualToString:args[0]]) {
        [_scheduledCalls removeObject:call];
      }
    }
  }

  id call = @{
    @"module": module,
    @"method": method,
    @"args": args,
    @"context": context ?: @0,
  };

  if ([method isEqualToString:@"invokeCallbackAndReturnFlushedQueue"]) {
    _scheduledCallbacks[args[0]] = call;
  } else {
    [_scheduledCalls addObject:call];
  }

  RCTProfileEndEvent(@"enqueue_call", @"objc_call", call);
}

- (void)_actuallyInvokeAndProcessModule:(NSString *)module method:(NSString *)method arguments:(NSArray *)args context:(NSNumber *)context
{
#endif
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTEnqueueNotification object:nil userInfo:nil];

  RCTJavaScriptCallback processResponse = ^(id json, NSError *error) {
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

  // TODO: if we sort the requests by module, we could dispatch once per
  // module instead of per request, which would reduce the call overhead.
  for (NSUInteger i = 0; i < numRequests; i++) {
    @autoreleasepool {
      [self _handleRequestNumber:i
                        moduleID:[moduleIDs[i] integerValue]
                        methodID:[methodIDs[i] integerValue]
                          params:paramsArrays[i]
                         context:context];
    }
  }

  // TODO: batchDidComplete is only used by RCTUIManager - can we eliminate this special case?
  [_modulesByID enumerateObjectsUsingBlock:^(id<RCTBridgeModule> module, NSNumber *moduleID, BOOL *stop) {
    if ([module respondsToSelector:@selector(batchDidComplete)]) {
      dispatch_queue_t queue = _queuesByID[moduleID];
      dispatch_async(queue ?: _methodQueue, ^{
        [module batchDidComplete];
      });
    }
  }];
}

- (BOOL)_handleRequestNumber:(NSUInteger)i
                    moduleID:(NSUInteger)moduleID
                    methodID:(NSUInteger)methodID
                      params:(NSArray *)params
                     context:(NSNumber *)context
{

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

  RCTModuleMethod *method = methods[methodID];

  // Look up module
  id module = self->_modulesByID[moduleID];
  if (RCT_DEBUG && !module) {
    RCTLogError(@"No module found for name '%@'", RCTModuleNamesByID[moduleID]);
    return NO;
  }

  __weak RCTBridge *weakSelf = self;
  dispatch_queue_t queue = _queuesByID[moduleID];
  dispatch_async(queue ?: _methodQueue, ^{
    RCTProfileBeginEvent();
    __strong RCTBridge *strongSelf = weakSelf;

    if (!strongSelf.isValid) {
      // strongSelf has been invalidated since the dispatch_async call and this
      // invocation should not continue.
      return;
    }

    if (!RCT_DEBUG) {
      [method invokeWithBridge:strongSelf module:module arguments:params context:context];
    } else {
      @try {
        [method invokeWithBridge:strongSelf module:module arguments:params context:context];
      }
      @catch (NSException *exception) {
        RCTLogError(@"Exception thrown while invoking %@ on target %@ with params %@: %@", method.JSMethodName, module, params, exception);
        if ([exception.name rangeOfString:@"Unhandled JS Exception"].location != NSNotFound) {
          @throw;
        }
      }
    }

    RCTProfileEndEvent(@"Invoke callback", @"objc_call", @{
      @"module": method.moduleClassName,
      @"method": method.JSMethodName,
      @"selector": NSStringFromSelector(method.selector),
    });
  });

  return YES;
}

- (void)_jsThreadUpdate:(CADisplayLink *)displayLink
{
  RCTProfileImmediateEvent(@"JS Thread Tick", displayLink.timestamp, @"g");
  RCTProfileBeginEvent();

  RCTFrameUpdate *frameUpdate = [[RCTFrameUpdate alloc] initWithDisplayLink:displayLink];
  for (id<RCTFrameUpdateObserver> observer in _frameUpdateObservers) {
    if (![observer respondsToSelector:@selector(isPaused)] || ![observer isPaused]) {
      [observer didUpdateFrame:frameUpdate];
    }
  }

#if BATCHED_BRIDGE

  NSArray *calls = [_scheduledCallbacks.allObjects arrayByAddingObjectsFromArray:_scheduledCalls];
  NSNumber *currentExecutorID = RCTGetExecutorID(_javaScriptExecutor);
  calls = [calls filteredArrayUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(NSDictionary *call, NSDictionary *bindings) {
    return [call[@"context"] isEqualToNumber:currentExecutorID];
  }]];
  if (calls.count > 0) {
    _scheduledCalls = [[NSMutableArray alloc] init];
    _scheduledCallbacks = [[RCTSparseArray alloc] init];
    [self _actuallyInvokeAndProcessModule:@"BatchedBridge"
                                   method:@"processBatch"
                                arguments:@[calls]
                                  context:RCTGetExecutorID(_javaScriptExecutor)];
  }

#endif

  RCTProfileEndEvent(@"DispatchFrameUpdate", @"objc_call", nil);
}

- (void)_mainThreadUpdate:(CADisplayLink *)displayLink
{
  RCTProfileImmediateEvent(@"VSYNC", displayLink.timestamp, @"g");
}

- (void)addFrameUpdateObserver:(id<RCTFrameUpdateObserver>)observer
{
  [_frameUpdateObservers addObject:observer];
}

- (void)removeFrameUpdateObserver:(id<RCTFrameUpdateObserver>)observer
{
  [_frameUpdateObservers removeObject:observer];
}

- (void)reload
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (!_loading) {
      // If the bridge has not loaded yet, the context will be already invalid at
      // the time the javascript gets executed.
      // It will crash the javascript, and even the next `load` won't render.
      [self invalidate];
      [self setUp];
    }
  });
}

+ (void)logMessage:(NSString *)message level:(NSString *)level
{
  if (![_latestJSExecutor isValid]) {
    return;
  }

  // Note: the js executor could get invalidated while we're trying to call
  // this...need to watch out for that.
  [_latestJSExecutor executeJSCall:@"RCTLog"
                            method:@"logIfNoNativeHook"
                         arguments:@[level, message]
                           context:RCTGetExecutorID(_latestJSExecutor)
                          callback:^(id json, NSError *error) {}];
}

- (void)startProfiling
{
  if (![_bundleURL.scheme isEqualToString:@"http"]) {
    RCTLogError(@"To run the profiler you must be running from the dev server");
    return;
  }
  RCTProfileInit();
}

- (void)stopProfiling
{
  NSString *log = RCTProfileEnd();
  NSString *URLString = [NSString stringWithFormat:@"%@://%@:%@/profile", _bundleURL.scheme, _bundleURL.host, _bundleURL.port];
  NSURL *URL = [NSURL URLWithString:URLString];
  NSMutableURLRequest *URLRequest = [NSMutableURLRequest requestWithURL:URL];
  URLRequest.HTTPMethod = @"POST";
  [URLRequest setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
  NSURLSessionTask *task = [[NSURLSession sharedSession] uploadTaskWithRequest:URLRequest
                                                                      fromData:[log dataUsingEncoding:NSUTF8StringEncoding]
                                                             completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
                                                               if (error) {
                                                                 RCTLogError(@"%@", error.localizedDescription);
                                                               }
                                                             }];
  [task resume];
}

@end
