/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTShadowView.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

NS_ASSUME_NONNULL_BEGIN

__attribute__((deprecated("This API will be removed along with the legacy architecture.")))
@interface RCTSafeAreaShadowView : RCTShadowView

@end

NS_ASSUME_NONNULL_END

#endif // RCT_REMOVE_LEGACY_ARCH
