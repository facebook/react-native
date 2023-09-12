/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTConvert.h>
#import <React/RCTViewManager.h>

#if !TARGET_OS_VISION

@interface RCTConvert (UIScrollView)

+ (UIScrollViewKeyboardDismissMode)UIScrollViewKeyboardDismissMode:(id)json;

@end

#endif

@interface RCTScrollViewManager : RCTViewManager

@end


