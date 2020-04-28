/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTConvert+Text.h>

@implementation RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(id)json
{
  return
    json == nil ? UITextAutocorrectionTypeDefault :
    [RCTConvert BOOL:json] ? UITextAutocorrectionTypeYes :
    UITextAutocorrectionTypeNo;
}

+ (UITextSpellCheckingType)UITextSpellCheckingType:(id)json
{
  return
    json == nil ? UITextSpellCheckingTypeDefault :
    [RCTConvert BOOL:json] ? UITextSpellCheckingTypeYes :
    UITextSpellCheckingTypeNo;
}

RCT_ENUM_CONVERTER(RCTTextTransform, (@{
  @"none": @(RCTTextTransformNone),
  @"capitalize": @(RCTTextTransformCapitalize),
  @"uppercase": @(RCTTextTransformUppercase),
  @"lowercase": @(RCTTextTransformLowercase),
}), RCTTextTransformUndefined, integerValue)

@end
