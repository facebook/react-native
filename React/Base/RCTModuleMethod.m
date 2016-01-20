/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTModuleMethod.h"

#import <objc/message.h>

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTBridge+Private.h"
#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTParserUtils.h"
#import "RCTUtils.h"

typedef BOOL (^RCTArgumentBlock)(RCTBridge *, NSUInteger, id);

@implementation RCTMethodArgument

- (instancetype)initWithType:(NSString *)type
                 nullability:(RCTNullability)nullability
                      unused:(BOOL)unused
{
  if ((self = [super init])) {
    _type = [type copy];
    _nullability = nullability;
    _unused = unused;
  }
  return self;
}

@end

@implementation RCTModuleMethod
{
  Class _moduleClass;
  NSInvocation *_invocation;
  NSArray<RCTArgumentBlock> *_argumentBlocks;
  NSString *_methodSignature;
  SEL _selector;
  NSDictionary *_profileArgs;
}

@synthesize JSMethodName = _JSMethodName;
@synthesize functionType = _functionType;

static void RCTLogArgumentError(RCTModuleMethod *method, NSUInteger index,
                                id valueOrType, const char *issue)
{
  RCTLogError(@"Argument %tu (%@) of %@.%@ %s", index, valueOrType,
              RCTBridgeModuleNameForClass(method->_moduleClass),
              method->_JSMethodName, issue);
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

// returns YES if the selector ends in a colon (indicating that there is at
// least one argument, and maybe more selector parts) or NO if it doesn't.
static BOOL RCTParseSelectorPart(const char **input, NSMutableString *selector)
{
  NSString *selectorPart;
  if (RCTParseIdentifier(input, &selectorPart)) {
    [selector appendString:selectorPart];
  }
  RCTSkipWhitespace(input);
  if (RCTReadChar(input, ':')) {
    [selector appendString:@":"];
    RCTSkipWhitespace(input);
    return YES;
  }
  return NO;
}

static BOOL RCTParseUnused(const char **input)
{
  return RCTReadString(input, "__unused") ||
         RCTReadString(input, "__attribute__((unused))");
}

static RCTNullability RCTParseNullability(const char **input)
{
  if (RCTReadString(input, "nullable")) {
    return RCTNullable;
  } else if (RCTReadString(input, "nonnull")) {
    return RCTNonnullable;
  }
  return RCTNullabilityUnspecified;
}

SEL RCTParseMethodSignature(NSString *, NSArray<RCTMethodArgument *> **);
SEL RCTParseMethodSignature(NSString *methodSignature, NSArray<RCTMethodArgument *> **arguments)
{
  const char *input = methodSignature.UTF8String;
  RCTSkipWhitespace(&input);

  NSMutableArray *args;
  NSMutableString *selector = [NSMutableString new];
  while (RCTParseSelectorPart(&input, selector)) {
    if (!args) {
      args = [NSMutableArray new];
    }

    // Parse type
    if (RCTReadChar(&input, '(')) {
      RCTSkipWhitespace(&input);

      BOOL unused = RCTParseUnused(&input);
      RCTSkipWhitespace(&input);

      RCTNullability nullability = RCTParseNullability(&input);
      RCTSkipWhitespace(&input);

      NSString *type = RCTParseType(&input);
      [args addObject:[[RCTMethodArgument alloc] initWithType:type
                                                  nullability:nullability
                                                       unused:unused]];
      RCTSkipWhitespace(&input);
      RCTReadChar(&input, ')');
      RCTSkipWhitespace(&input);
    } else {
      // Type defaults to id if unspecified
      [args addObject:[[RCTMethodArgument alloc] initWithType:@"id"
                                                  nullability:RCTNullable
                                                       unused:NO]];
    }

    // Argument name
    RCTParseIdentifier(&input, NULL);
    RCTSkipWhitespace(&input);
  }

  *arguments = [args copy];
  return NSSelectorFromString(selector);
}

- (instancetype)initWithMethodSignature:(NSString *)methodSignature
                           JSMethodName:(NSString *)JSMethodName
                            moduleClass:(Class)moduleClass
{
  if ((self = [super init])) {

    _moduleClass = moduleClass;
    _methodSignature = [methodSignature copy];
    _JSMethodName = JSMethodName.length > 0 ? JSMethodName : ({
      NSString *methodName = methodSignature;
      NSRange colonRange = [methodName rangeOfString:@":"];
      if (colonRange.location != NSNotFound) {
        methodName = [methodName substringToIndex:colonRange.location];
      }
      methodName = [methodName stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
      RCTAssert(methodName.length, @"%@ is not a valid JS function name, please"
                " supply an alternative using RCT_REMAP_METHOD()", methodSignature);
      methodName;
    });

    if ([_methodSignature rangeOfString:@"RCTPromise"].length) {
      _functionType = RCTFunctionTypePromise;
    } else {
      _functionType = RCTFunctionTypeNormal;
    }
  }

  return self;
}

- (void)processMethodSignature
{
  NSArray<RCTMethodArgument *> *arguments;
  _selector = RCTParseMethodSignature(_methodSignature, &arguments);
  RCTAssert(_selector, @"%@ is not a valid selector", _methodSignature);

  // Create method invocation
  NSMethodSignature *methodSignature = [_moduleClass instanceMethodSignatureForSelector:_selector];
  RCTAssert(methodSignature, @"%@ is not a recognized Objective-C method.", _methodSignature);
  NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:methodSignature];
  invocation.selector = _selector;
  _invocation = invocation;

  // Process arguments
  NSUInteger numberOfArguments = methodSignature.numberOfArguments;
  NSMutableArray<RCTArgumentBlock> *argumentBlocks =
    [[NSMutableArray alloc] initWithCapacity:numberOfArguments - 2];

#define RCT_ARG_BLOCK(_logic) \
[argumentBlocks addObject:^(__unused RCTBridge *bridge, NSUInteger index, id json) { \
  _logic \
  [invocation setArgument:&value atIndex:(index) + 2]; \
  return YES; \
}];

/**
 * Explicitly copy the block and retain it, since NSInvocation doesn't retain them.
 */
#define RCT_BLOCK_ARGUMENT(block...) \
  id value = json ? [block copy] : (id)^(__unused NSArray *_){}; \
  CFBridgingRetain(value)

  __weak RCTModuleMethod *weakSelf = self;
  void (^addBlockArgument)(void) = ^{
    RCT_ARG_BLOCK(

      if (RCT_DEBUG && json && ![json isKindOfClass:[NSNumber class]]) {
        RCTLogArgumentError(weakSelf, index, json, "should be a function");
        return NO;
      }

      RCT_BLOCK_ARGUMENT(^(NSArray *args) {
        [bridge enqueueCallback:json args:args];
      });
    )
  };

  for (NSUInteger i = 2; i < numberOfArguments; i++) {
    const char *objcType = [methodSignature getArgumentTypeAtIndex:i];
    BOOL isNullableType = NO;
    RCTMethodArgument *argument = arguments[i - 2];
    NSString *typeName = argument.type;
    SEL selector = RCTConvertSelectorForType(typeName);
    if ([RCTConvert respondsToSelector:selector]) {
      switch (objcType[0]) {

#define RCT_CASE(_value, _type) \
        case _value: { \
          _type (*convert)(id, SEL, id) = (typeof(convert))objc_msgSend; \
          RCT_ARG_BLOCK( _type value = convert([RCTConvert class], selector, json); ) \
          break; \
        }

        RCT_CASE(_C_CHR, char)
        RCT_CASE(_C_UCHR, unsigned char)
        RCT_CASE(_C_SHT, short)
        RCT_CASE(_C_USHT, unsigned short)
        RCT_CASE(_C_INT, int)
        RCT_CASE(_C_UINT, unsigned int)
        RCT_CASE(_C_LNG, long)
        RCT_CASE(_C_ULNG, unsigned long)
        RCT_CASE(_C_LNG_LNG, long long)
        RCT_CASE(_C_ULNG_LNG, unsigned long long)
        RCT_CASE(_C_FLT, float)
        RCT_CASE(_C_DBL, double)
        RCT_CASE(_C_BOOL, BOOL)

#define RCT_NULLABLE_CASE(_value, _type) \
        case _value: { \
          isNullableType = YES; \
          _type (*convert)(id, SEL, id) = (typeof(convert))objc_msgSend; \
          RCT_ARG_BLOCK( _type value = convert([RCTConvert class], selector, json); ) \
          break; \
        }

        RCT_NULLABLE_CASE(_C_SEL, SEL)
        RCT_NULLABLE_CASE(_C_CHARPTR, const char *)
        RCT_NULLABLE_CASE(_C_PTR, void *)

        case _C_ID: {
          isNullableType = YES;
          id (*convert)(id, SEL, id) = (typeof(convert))objc_msgSend;
          RCT_ARG_BLOCK(
            id value = convert([RCTConvert class], selector, json);
            CFBridgingRetain(value);
          )
          break;
        }

        case _C_STRUCT_B: {

          NSMethodSignature *typeSignature = [RCTConvert methodSignatureForSelector:selector];
          NSInvocation *typeInvocation = [NSInvocation invocationWithMethodSignature:typeSignature];
          typeInvocation.selector = selector;
          typeInvocation.target = [RCTConvert class];

          [argumentBlocks addObject:^(__unused RCTBridge *bridge, NSUInteger index, id json) {
            void *returnValue = malloc(typeSignature.methodReturnLength);
            [typeInvocation setArgument:&json atIndex:2];
            [typeInvocation invoke];
            [typeInvocation getReturnValue:returnValue];
            [invocation setArgument:returnValue atIndex:index + 2];
            free(returnValue);
            return YES;
          }];
          break;
        }

        default: {
          static const char *blockType = @encode(typeof(^{}));
          if (!strcmp(objcType, blockType)) {
            addBlockArgument();
          } else {
            RCTLogError(@"Unsupported argument type '%@' in method %@.",
                        typeName, [self methodName]);
          }
        }
      }
    } else if ([typeName isEqualToString:@"RCTResponseSenderBlock"]) {
      addBlockArgument();
    } else if ([typeName isEqualToString:@"RCTResponseErrorBlock"]) {
      RCT_ARG_BLOCK(

        if (RCT_DEBUG && json && ![json isKindOfClass:[NSNumber class]]) {
          RCTLogArgumentError(weakSelf, index, json, "should be a function");
          return NO;
        }

        RCT_BLOCK_ARGUMENT(^(NSError *error) {
          [bridge enqueueCallback:json args:@[RCTJSErrorFromNSError(error)]];
        });
      )
    } else if ([typeName isEqualToString:@"RCTPromiseResolveBlock"]) {
      RCTAssert(i == numberOfArguments - 2,
                @"The RCTPromiseResolveBlock must be the second to last parameter in -[%@ %@]",
                _moduleClass, _methodSignature);
      RCT_ARG_BLOCK(
        if (RCT_DEBUG && ![json isKindOfClass:[NSNumber class]]) {
          RCTLogArgumentError(weakSelf, index, json, "should be a promise resolver function");
          return NO;
        }

        RCT_BLOCK_ARGUMENT(^(id result) {
          [bridge enqueueCallback:json args:result ? @[result] : @[]];
        });
      )
    } else if ([typeName isEqualToString:@"RCTPromiseRejectBlock"]) {
      RCTAssert(i == numberOfArguments - 1,
                @"The RCTPromiseRejectBlock must be the last parameter in -[%@ %@]",
                _moduleClass, _methodSignature);
      RCT_ARG_BLOCK(
        if (RCT_DEBUG && ![json isKindOfClass:[NSNumber class]]) {
          RCTLogArgumentError(weakSelf, index, json, "should be a promise rejecter function");
          return NO;
        }

        RCT_BLOCK_ARGUMENT(^(NSString *code, NSString *message, NSError *error) {
          NSDictionary *errorJSON = RCTJSErrorFromCodeMessageAndNSError(code, message, error);
          [bridge enqueueCallback:json args:@[errorJSON]];
        });
      )
    } else {

      // Unknown argument type
      RCTLogError(@"Unknown argument type '%@' in method %@. Extend RCTConvert"
                  " to support this type.", typeName, [self methodName]);
    }

    if (RCT_DEBUG) {

      RCTNullability nullability = argument.nullability;
      if (!isNullableType) {
        if (nullability == RCTNullable) {
          RCTLogArgumentError(weakSelf, i - 2, typeName, "is marked as "
                              "nullable, but is not a nullable type.");
        }
        nullability = RCTNonnullable;
      }

      /**
       * Special case - Numbers are not nullable in Android, so we
       * don't support this for now. In future we may allow it.
       */
      if ([typeName isEqualToString:@"NSNumber"]) {
        BOOL unspecified = (nullability == RCTNullabilityUnspecified);
        if (!argument.unused && (nullability == RCTNullable || unspecified)) {
          RCTLogArgumentError(weakSelf, i - 2, typeName,
            [unspecified ? @"has unspecified nullability" : @"is marked as nullable"
             stringByAppendingString: @" but React requires that all NSNumber "
             "arguments are explicitly marked as `nonnull` to ensure "
             "compatibility with Android."].UTF8String);
        }
        nullability = RCTNonnullable;
      }

      if (nullability == RCTNonnullable) {
        RCTArgumentBlock oldBlock = argumentBlocks[i - 2];
        argumentBlocks[i - 2] = ^(RCTBridge *bridge, NSUInteger index, id json) {
          if (json != nil) {
            if (!oldBlock(bridge, index, json)) {
              return NO;
            }
            if (isNullableType) {
              // Check converted value wasn't null either, as method probably
              // won't gracefully handle a nil vallue for a nonull argument
              void *value;
              [invocation getArgument:&value atIndex:index + 2];
              if (value == NULL) {
                return NO;
              }
            }
            return YES;
          }
          RCTLogArgumentError(weakSelf, index, typeName, "must not be null");
          return NO;
        };
      }
    }
  }

  _argumentBlocks = [argumentBlocks copy];
}

- (SEL)selector
{
  if (_selector == NULL) {
    [self processMethodSignature];
  }
  return _selector;
}

- (NSDictionary *)profileArgs
{
  if (_profileArgs) {
    // This sets _selector
    [self processMethodSignature];
    _profileArgs = @{
      @"module": NSStringFromClass(_moduleClass),
      @"selector": NSStringFromSelector(_selector),
    };
  }
  return _profileArgs;
}

- (void)invokeWithBridge:(RCTBridge *)bridge
                  module:(id)module
               arguments:(NSArray *)arguments
{
  if (_argumentBlocks == nil) {
    [self processMethodSignature];
  }

  if (RCT_DEBUG) {

    // Sanity check
    RCTAssert([module class] == _moduleClass, @"Attempted to invoke method \
              %@ on a module of class %@", [self methodName], [module class]);

    // Safety check
    if (arguments.count != _argumentBlocks.count) {
      NSInteger actualCount = arguments.count;
      NSInteger expectedCount = _argumentBlocks.count;

      // Subtract the implicit Promise resolver and rejecter functions for implementations of async functions
      if (_functionType == RCTFunctionTypePromise) {
        actualCount -= 2;
        expectedCount -= 2;
      }

      RCTLogError(@"%@.%@ was called with %zd arguments, but expects %zd",
                  RCTBridgeModuleNameForClass(_moduleClass), _JSMethodName,
                  actualCount, expectedCount);
      return;
    }
  }

  // Set arguments
  NSUInteger index = 0;
  for (id json in arguments) {
    RCTArgumentBlock block = _argumentBlocks[index];
    if (!block(bridge, index, RCTNilIfNull(json))) {
      // Invalid argument, abort
      RCTLogArgumentError(self, index, json,
                          "could not be processed. Aborting method call.");
      return;
    }
    index++;
  }

  // Invoke method
  [_invocation invokeWithTarget:module];

  RCTAssert(
    @encode(RCTArgumentBlock)[0] == _C_ID,
    @"Block type encoding has changed, it won't be released. A check for the block"
     "type encoding (%s) has to be added below.",
    @encode(RCTArgumentBlock)
  );

  index = 2;
  for (NSUInteger length = _invocation.methodSignature.numberOfArguments; index < length; index++) {
    if ([_invocation.methodSignature getArgumentTypeAtIndex:index][0] == _C_ID) {
      __unsafe_unretained id value;
      [_invocation getArgument:&value atIndex:index];

      if (value) {
        CFRelease((__bridge CFTypeRef)value);
      }
    }
  }
}

- (NSString *)methodName
{
  if (_selector == NULL) {
    [self processMethodSignature];
  }
  return [NSString stringWithFormat:@"-[%@ %@]", _moduleClass,
          NSStringFromSelector(_selector)];
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@: %p; exports %@ as %@();>",
          [self class], self, [self methodName], _JSMethodName];
}

@end
