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

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTUtils.h"

@interface RCTBridge (RCTModuleMethod)

- (void)_invokeAndProcessModule:(NSString *)module
                         method:(NSString *)method
                      arguments:(NSArray *)args;

@end

@implementation RCTModuleMethod
{
  Class _moduleClass;
  SEL _selector;
  NSMethodSignature *_methodSignature;
  NSArray *_argumentBlocks;
}

RCT_NOT_IMPLEMENTED(-init)

- (instancetype)initWithObjCMethodName:(NSString *)objCMethodName
                          JSMethodName:(NSString *)JSMethodName
                           moduleClass:(Class)moduleClass
{
  if ((self = [super init])) {
    static NSRegularExpression *typeRegex;
    static NSRegularExpression *selectorRegex;
    if (!typeRegex) {
      NSString *unusedPattern = @"(?:__unused|__attribute__\\(\\(unused\\)\\))";
      NSString *constPattern = @"(?:const)";
      NSString *nullabilityPattern = @"(?:__nullable|__nonnull|nullable|nonnull)";
      NSString *annotationPattern = [NSString stringWithFormat:@"(?:(?:%@|%@|%@)\\s*)",
                                     unusedPattern, constPattern, nullabilityPattern];
      NSString *pattern = [NSString stringWithFormat:@"\\(%1$@?(\\w+?)(?:\\s*\\*)?%1$@?\\)", annotationPattern];
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
                                arguments:@[json, args]];
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
        } else if ([argumentName isEqualToString:@"RCTResponseErrorBlock"]) {
          RCT_ARG_BLOCK(

            if (RCT_DEBUG && json && ![json isKindOfClass:[NSNumber class]]) {
              RCTLogError(@"Argument %tu (%@) of %@.%@ should be a number", index,
                          json, RCTBridgeModuleNameForClass(_moduleClass), _JSMethodName);
              return;
            }

            // Marked as autoreleasing, because NSInvocation doesn't retain arguments
            __autoreleasing id value = (json ? ^(NSError *error) {
              [bridge _invokeAndProcessModule:@"BatchedBridge"
                                       method:@"invokeCallbackAndReturnFlushedQueue"
                                    arguments:@[json, @[RCTJSErrorFromNSError(error)]]];
            } : ^(__unused NSError *error) {});
          )
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
                                    arguments:@[json, arguments]];
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
                                    arguments:@[json, @[errorJSON]]];
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
