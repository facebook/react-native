/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTConvert.h>
#import <React/RCTViewManager.h>

#ifndef RCT_FIT_RM_OLD_COMPONENT

@interface RCTConvert (UIScrollView)

+ (UIScrollViewKeyboardDismissMode)UIScrollViewKeyboardDismissMode:(id)json;

@end

@interface RCTScrollViewManager : RCTViewManager

@end

#endif // RCT_FIT_RM_OLD_COMPONENT
