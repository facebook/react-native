/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTViewManager.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

@class RCTWrapperView;

NS_ASSUME_NONNULL_BEGIN

__attribute__((deprecated("This API will be removed along with the legacy architecture.")))
@interface RCTWrapperViewManager : RCTViewManager

- (RCTWrapperView *)view NS_REQUIRES_SUPER;

@end

NS_ASSUME_NONNULL_END

#endif // RCT_REMOVE_LEGACY_ARCH
