/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTConvert.h>
#import <React/RCTViewManager.h>

#if !TARGET_OS_OSX // TODO(macOS GH#774)
@interface RCTConvert (UIDatePicker)

+ (UIDatePickerMode)UIDatePickerMode:(id)json;
#else // [TODO(macOS GH#774)
@interface RCTConvert (NSDatePicker)
+ (NSDatePickerMode)NSDatePickerMode:(id)json;
+ (NSDatePickerStyle)NSDatePickerStyle:(id)json;
#endif // ]TODO(macOS GH#774)

@end

@interface RCTDatePickerManager : RCTViewManager

@end
