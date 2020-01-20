/*
 * Copyright (c) Facebook, Inc. and its affiliates.
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

#if RCT_DEBUG
  RCTLogError(@"%@ received command %@, which is not a supported command.", @"TextInput", commandName);
#endif
}

NS_ASSUME_NONNULL_END
