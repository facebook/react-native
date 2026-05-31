/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTConvert+Text.h>

@implementation RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(id)json
{
  return json == nil           ? UITextAutocorrectionTypeDefault
      : [RCTConvert BOOL:json] ? UITextAutocorrectionTypeYes
                               : UITextAutocorrectionTypeNo;
}

+ (UITextSpellCheckingType)UITextSpellCheckingType:(id)json
{
  return json == nil           ? UITextSpellCheckingTypeDefault
      : [RCTConvert BOOL:json] ? UITextSpellCheckingTypeYes
                               : UITextSpellCheckingTypeNo;
}

RCT_ENUM_CONVERTER(
    RCTTextTransform,
    (@{
      @"none" : @(RCTTextTransformNone),
      @"capitalize" : @(RCTTextTransformCapitalize),
      @"uppercase" : @(RCTTextTransformUppercase),
      @"lowercase" : @(RCTTextTransformLowercase),
    }),
    RCTTextTransformUndefined,
    integerValue)

+ (UITextSmartInsertDeleteType)UITextSmartInsertDeleteType:(id)json
{
  return json == nil           ? UITextSmartInsertDeleteTypeDefault
      : [RCTConvert BOOL:json] ? UITextSmartInsertDeleteTypeYes
                               : UITextSmartInsertDeleteTypeNo;
}

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 180000 /* __IPHONE_18_0 */
+ (UIWritingToolsBehavior)UIWritingToolsBehavior:(id)json
{
  if (json == nil) {
    return UIWritingToolsBehaviorDefault;
  }
  NSString *value = [RCTConvert NSString:json];
  if ([value isEqualToString:@"none"]) {
    return UIWritingToolsBehaviorNone;
  }
  if ([value isEqualToString:@"limited"]) {
    return UIWritingToolsBehaviorLimited;
  }
  if ([value isEqualToString:@"complete"]) {
    return UIWritingToolsBehaviorComplete;
  }
  return UIWritingToolsBehaviorDefault;
}
#endif

@end
