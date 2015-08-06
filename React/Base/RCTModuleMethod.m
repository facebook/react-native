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
#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTUtils.h"

typedef void (^RCTArgumentBlock)(RCTBridge *, NSUInteger, id);

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

@interface RCTBridge (RCTModuleMethod)

- (void)_invokeAndProcessModule:(NSString *)module
                         method:(NSString *)method
                      arguments:(NSArray *)args;

@end

@implementation RCTModuleMethod
{
  Class _moduleClass;
  SEL _selector;
  NSInvocation *_invocation;
  NSArray *_argumentBlocks;
}

static void RCTLogArgumentError(RCTModuleMethod *method, NSUInteger index,
                                id valueOrType, const char *issue)
{
  RCTLogError(@"Argument %tu (%@) of %@.%@ %s", index, valueOrType,
              RCTBridgeModuleNameForClass(method->_moduleClass),
              method->_JSMethodName, issue);
}

RCT_NOT_IMPLEMENTED(-init)

void RCTParseObjCMethodName(NSString **, NSArray **);
void RCTParseObjCMethodName(NSString **objCMethodName, NSArray **arguments)
{
  static NSRegularExpression *typeNameRegex;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *unusedPattern = @"(?:__unused|__attribute__\\(\\(unused\\)\\))";
    NSString *constPattern = @"(?:const)";
    NSString *nullablePattern = @"(?:__nullable|nullable|__attribute__\\(\\(nullable\\)\\))";
    NSString *nonnullPattern = @"(?:__nonnull|nonnull|__attribute__\\(\\(nonnull\\)\\))";
    NSString *annotationPattern = [NSString stringWithFormat:@"(?:(?:(%@)|%@|(%@)|(%@))\\s*)",
                                   unusedPattern, constPattern, nullablePattern, nonnullPattern];
    NSString *pattern = [NSString stringWithFormat:@"(?<=:)(\\s*\\(%1$@?(\\w+?)(?:\\s*\\*)?%1$@?\\))?\\s*\\w+",
                         annotationPattern];
    typeNameRegex = [[NSRegularExpression alloc] initWithPattern:pattern options:0 error:NULL];
  });

  // Extract argument types
  NSString *methodName = *objCMethodName;
  NSRange methodRange = {0, methodName.length};
  NSMutableArray *args = [NSMutableArray array];
  [typeNameRegex enumerateMatchesInString:methodName options:0 range:methodRange usingBlock:^(NSTextCheckingResult *result, __unused NSMatchingFlags flags, __unused BOOL *stop) {
    NSRange typeRange = [result rangeAtIndex:5];
    NSString *type = typeRange.length ? [methodName substringWithRange:typeRange] : @"id";
    BOOL unused = ([result rangeAtIndex:2].length > 0);
    RCTNullability nullability = [result rangeAtIndex:3].length ? RCTNullable :
      [result rangeAtIndex:4].length ? RCTNonnullable : RCTNullabilityUnspecified;
    [args addObject:[[RCTMethodArgument alloc] initWithType:type
                                                nullability:nullability
                                                     unused:unused]];
  }];
  *arguments = [args copy];

  // Remove the parameter types and names
  methodName = [typeNameRegex stringByReplacingMatchesInString:methodName options:0
                                                         range:methodRange
                                                  withTemplate:@""];

  // Remove whitespace
  methodName = [methodName stringByReplacingOccurrencesOfString:@"\n" withString:@""];
  methodName = [methodName stringByReplacingOccurrencesOfString:@" " withString:@""];

  // Strip trailing semicolon
  if ([methodName hasSuffix:@";"]) {
    methodName = [methodName substringToIndex:methodName.length - 1];
  }

  *objCMethodName = methodName;
}

- (instancetype)initWithObjCMethodName:(NSString *)objCMethodName
                          JSMethodName:(NSString *)JSMethodName
                           moduleClass:(Class)moduleClass
{
  if ((self = [super init])) {

    NSArray *arguments;
    RCTParseObjCMethodName(&objCMethodName, &arguments);

    _moduleClass = moduleClass;
    _selector = NSSelectorFromString(objCMethodName);
    RCTAssert(_selector, @"%@ is not a valid selector", objCMethodName);

    _JSMethodName = JSMethodName.length > 0 ? JSMethodName : ({
      NSString *methodName = objCMethodName;
      NSRange colonRange = [methodName rangeOfString:@":"];
      if (colonRange.location != NSNotFound) {
        methodName = [methodName substringToIndex:colonRange.location];
      }
      RCTAssert(methodName.length, @"%@ is not a valid JS function name, please"
                " supply an alternative using RCT_REMAP_METHOD()", objCMethodName);
      methodName;
    });

    // Create method invocation
    NSMethodSignature *methodSignature = [_moduleClass instanceMethodSignatureForSelector:_selector];
    RCTAssert(methodSignature, @"%@ is not a recognized Objective-C method.", objCMethodName);
    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:methodSignature];
    [invocation setSelector:_selector];
    [invocation retainArguments];
    _invocation = invocation;

    // Process arguments
    NSUInteger numberOfArguments = methodSignature.numberOfArguments;
    NSMutableArray *argumentBlocks = [[NSMutableArray alloc] initWithCapacity:numberOfArguments - 2];

#define RCT_ARG_BLOCK(_logic) \
  [argumentBlocks addObject:^(__unused RCTBridge *bridge, NSUInteger index, id json) { \
    _logic \
    [invocation setArgument:&value atIndex:(index) + 2]; \
  }];

    __weak RCTModuleMethod *weakSelf = self;
    void (^addBlockArgument)(void) = ^{
      RCT_ARG_BLOCK(

        if (RCT_DEBUG && json && ![json isKindOfClass:[NSNumber class]]) {
          RCTLogArgumentError(weakSelf, index, json, "should be a function");
          return;
        }

        // Marked as autoreleasing, because NSInvocation doesn't retain arguments
        __autoreleasing id value = (json ? ^(NSArray *args) {
          [bridge _invokeAndProcessModule:@"BatchedBridge"
                                   method:@"invokeCallbackAndReturnFlushedQueue"
                                arguments:@[json, args]];
        } : ^(__unused NSArray *unused) {});
      )
    };

    for (NSUInteger i = 2; i < numberOfArguments; i++) {
      const char *objcType = [methodSignature getArgumentTypeAtIndex:i];
      BOOL isNullableType = NO;
      RCTMethodArgument *argument = arguments[i - 2];
      NSString *typeName = argument.type;
      SEL selector = NSSelectorFromString([typeName stringByAppendingString:@":"]);
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
          RCT_NULLABLE_CASE(_C_ID, id)

          case _C_STRUCT_B: {

            NSMethodSignature *typeSignature = [RCTConvert methodSignatureForSelector:selector];
            NSInvocation *typeInvocation = [NSInvocation invocationWithMethodSignature:typeSignature];
            [typeInvocation setSelector:selector];
            [typeInvocation setTarget:[RCTConvert class]];

            [argumentBlocks addObject:
             ^(__unused RCTBridge *bridge, NSUInteger index, id json) {

              void *returnValue = malloc(typeSignature.methodReturnLength);
              [typeInvocation setArgument:&json atIndex:2];
              [typeInvocation invoke];
              [typeInvocation getReturnValue:returnValue];

              [invocation setArgument:returnValue atIndex:index + 2];

              free(returnValue);
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
            return;
          }

          // Marked as autoreleasing, because NSInvocation doesn't retain arguments
          __autoreleasing id value = (json ? ^(NSError *error) {
            [bridge _invokeAndProcessModule:@"BatchedBridge"
                                     method:@"invokeCallbackAndReturnFlushedQueue"
                                  arguments:@[json, @[RCTJSErrorFromNSError(error)]]];
          } : ^(__unused NSError *error) {});
        )
      } else if ([typeName isEqualToString:@"RCTPromiseResolveBlock"]) {
        RCTAssert(i == numberOfArguments - 2,
                  @"The RCTPromiseResolveBlock must be the second to last parameter in -[%@ %@]",
                  _moduleClass, objCMethodName);
        RCT_ARG_BLOCK(
          if (RCT_DEBUG && ![json isKindOfClass:[NSNumber class]]) {
            RCTLogArgumentError(weakSelf, index, json, "should be a promise resolver function");
            return;
          }

          // Marked as autoreleasing, because NSInvocation doesn't retain arguments
          __autoreleasing RCTPromiseResolveBlock value = (^(id result) {
            [bridge _invokeAndProcessModule:@"BatchedBridge"
                                     method:@"invokeCallbackAndReturnFlushedQueue"
                                  arguments:@[json, result ? @[result] : @[]]];
          });
        )
        _functionKind = RCTJavaScriptFunctionKindAsync;
      } else if ([typeName isEqualToString:@"RCTPromiseRejectBlock"]) {
        RCTAssert(i == numberOfArguments - 1,
                  @"The RCTPromiseRejectBlock must be the last parameter in -[%@ %@]",
                  _moduleClass, objCMethodName);
        RCT_ARG_BLOCK(
          if (RCT_DEBUG && ![json isKindOfClass:[NSNumber class]]) {
            RCTLogArgumentError(weakSelf, index, json, "should be a promise rejecter function");
            return;
          }

          // Marked as autoreleasing, because NSInvocation doesn't retain arguments
          __autoreleasing RCTPromiseRejectBlock value = (^(NSError *error) {
            NSDictionary *errorJSON = RCTJSErrorFromNSError(error);
            [bridge _invokeAndProcessModule:@"BatchedBridge"
                                     method:@"invokeCallbackAndReturnFlushedQueue"
                                  arguments:@[json, @[errorJSON]]];
          });
        )
        _functionKind = RCTJavaScriptFunctionKindAsync;
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
            if (json == nil || json == (id)kCFNull) {
              RCTLogArgumentError(weakSelf, index, typeName, "must not be null");
              id null = nil;
              [invocation setArgument:&null atIndex:index + 2];
            } else {
              oldBlock(bridge, index, json);
            }
          };
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

  // Set arguments
  NSUInteger index = 0;
  for (id json in arguments) {
    id arg = RCTNilIfNull(json);
    RCTArgumentBlock block = _argumentBlocks[index];
    block(bridge, index, arg);
    index++;
  }

  // Invoke method
  [_invocation invokeWithTarget:module];
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
