/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTConvert.h>
#import <React/RCTViewManager.h>

#if !TARGET_OS_OSX // [macOS]
@interface RCTConvert (UIDatePicker)

+ (UIDatePickerMode)UIDatePickerMode:(id)json;
#else // [macOS
@interface RCTConvert (NSDatePicker)
+ (NSDatePickerMode)NSDatePickerMode:(id)json;
+ (NSDatePickerStyle)NSDatePickerStyle:(id)json;
#endif // macOS]

@end

@interface RCTDatePickerManager : RCTViewManager

@end
