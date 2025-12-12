/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTViewManager.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

__attribute__((deprecated("This API will be removed along with the legacy architecture.")))
@interface RCTConvert(UIActivityIndicatorView)

+ (UIActivityIndicatorViewStyle)UIActivityIndicatorViewStyle:(id)json;

@end

@interface RCTActivityIndicatorViewManager : RCTViewManager

@end

#endif // RCT_REMOVE_LEGACY_ARCH
