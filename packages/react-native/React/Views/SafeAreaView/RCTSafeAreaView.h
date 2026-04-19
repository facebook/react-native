/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

#import <React/RCTView.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTBridge;

__attribute__((deprecated("This API will be removed along with the legacy architecture.")))
@interface RCTSafeAreaView : RCTView

- (instancetype)initWithBridge:(RCTBridge *)bridge;

@end

NS_ASSUME_NONNULL_END

#endif // RCT_REMOVE_LEGACY_ARCH
