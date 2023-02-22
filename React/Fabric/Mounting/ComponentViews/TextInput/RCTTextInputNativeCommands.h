/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <React/RCTDefines.h>
#import <React/RCTLog.h>

NS_ASSUME_NONNULL_BEGIN

@protocol RCTTextInputViewProtocol <NSObject>
- (void)focus;
- (void)blur;
- (void)setTextAndSelection:(NSInteger)eventCount
                      value:(NSString *__nullable)value
                      start:(NSInteger)start
                        end:(NSInteger)end;
@end

RCT_EXTERN inline void
RCTTextInputHandleCommand(id<RCTTextInputViewProtocol> componentView, NSString const *commandName, NSArray const *args)
{
  if ([commandName isEqualToString:@"focus"]) {
#if RCT_DEBUG
    if ([args count] != 0) {
      RCTLogError(
          @"%@ command %@ received %d arguments, expected %d.", @"TextInput", commandName, (int)[args count], 0);
      return;
    }
#endif

    [componentView focus];
    return;
  }

  if ([commandName isEqualToString:@"blur"]) {
#if RCT_DEBUG
    if ([args count] != 0) {
      RCTLogError(
          @"%@ command %@ received %d arguments, expected %d.", @"TextInput", commandName, (int)[args count], 0);
      return;
    }
#endif

    [componentView blur];
    return;
  }

  if ([commandName isEqualToString:@"setTextAndSelection"]) {
#if RCT_DEBUG
    if ([args count] != 4) {
      RCTLogError(
          @"%@ command %@ received %d arguments, expected %d.", @"TextInput", commandName, (int)[args count], 4);
      return;
    }
#endif

    NSObject *arg0 = args[0];
#if RCT_DEBUG
    if (!RCTValidateTypeOfViewCommandArgument(arg0, [NSNumber class], @"number", @"TextInput", commandName, @"1st")) {
      return;
    }
#endif
    NSInteger eventCount = [(NSNumber *)arg0 intValue];

    NSObject *arg1 = args[1];
#if RCT_DEBUG
    if (![arg1 isKindOfClass:[NSNull class]] &&
        !RCTValidateTypeOfViewCommandArgument(arg1, [NSString class], @"string", @"TextInput", commandName, @"2nd")) {
      return;
    }
#endif

    NSString *value = [arg1 isKindOfClass:[NSNull class]] ? nil : (NSString *)arg1;

    NSObject *arg2 = args[2];
#if RCT_DEBUG
    if (!RCTValidateTypeOfViewCommandArgument(arg2, [NSNumber class], @"number", @"TextInput", commandName, @"3rd")) {
      return;
    }
#endif
    NSInteger start = [(NSNumber *)arg2 intValue];

    NSObject *arg3 = args[3];
#if RCT_DEBUG
    if (!RCTValidateTypeOfViewCommandArgument(arg3, [NSNumber class], @"number", @"TextInput", commandName, @"4th")) {
      return;
    }
#endif
    NSInteger end = [(NSNumber *)arg3 intValue];

    [componentView setTextAndSelection:eventCount value:value start:start end:end];
    return;
  }

#if RCT_DEBUG
  RCTLogError(@"%@ received command %@, which is not a supported command.", @"TextInput", commandName);
#endif
}

NS_ASSUME_NONNULL_END
