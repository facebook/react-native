/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTConvert.h>

#import "RCTTextTransform.h"

NS_ASSUME_NONNULL_BEGIN

#if TARGET_OS_OSX // [macOS
typedef enum UITextAutocorrectionType : NSInteger {
    UITextAutocorrectionTypeDefault,
    UITextAutocorrectionTypeNo,
    UITextAutocorrectionTypeYes,
} UITextAutocorrectionType;

typedef enum UITextSpellCheckingType : NSInteger {
    UITextSpellCheckingTypeDefault,
    UITextSpellCheckingTypeNo,
    UITextSpellCheckingTypeYes,
} UITextSpellCheckingType;
#endif // macOS]

@interface RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(nullable id)json;
+ (UITextSpellCheckingType)UITextSpellCheckingType:(nullable id)json;
+ (RCTTextTransform)RCTTextTransform:(nullable id)json;

@end

NS_ASSUME_NONNULL_END
