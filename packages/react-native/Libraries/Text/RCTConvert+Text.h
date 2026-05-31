/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTConvert.h>

#import "RCTTextTransform.h"

NS_ASSUME_NONNULL_BEGIN

@interface RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(nullable id)json;
+ (UITextSpellCheckingType)UITextSpellCheckingType:(nullable id)json;
+ (RCTTextTransform)RCTTextTransform:(nullable id)json;
+ (UITextSmartInsertDeleteType)UITextSmartInsertDeleteType:(nullable id)json;
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 180000 /* __IPHONE_18_0 */
+ (UIWritingToolsBehavior)UIWritingToolsBehavior:(nullable id)json API_AVAILABLE(ios(18.0), tvos(18.0));
#endif

@end

NS_ASSUME_NONNULL_END
