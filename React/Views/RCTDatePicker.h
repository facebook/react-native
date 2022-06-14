/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS GH#774)

#if !TARGET_OS_OSX // TODO(macOS GH#774)
@interface RCTDatePicker : UIDatePicker
#else // [TODO(macOS GH#774)
@interface RCTDatePicker : NSDatePicker
#endif // ]TODO(macOS GH#774)

@end
