/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTConvert.h>
#import <React/RCTViewManager.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

__attribute__((deprecated("This API will be removed along with the legacy architecture.")))
@interface RCTConvert(UIScrollView)

+ (UIScrollViewKeyboardDismissMode)UIScrollViewKeyboardDismissMode:(id)json;

@end

__attribute__((deprecated("This API will be removed along with the legacy architecture.")))
@interface RCTScrollViewManager : RCTViewManager

@end

#endif // RCT_REMOVE_LEGACY_ARCH
