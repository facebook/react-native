/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTViewManager.h>

@class RCTWrapperView;

NS_ASSUME_NONNULL_BEGIN

@interface RCTWrapperViewManager : RCTViewManager

- (RCTWrapperView *)view NS_REQUIRES_SUPER;

@end

NS_ASSUME_NONNULL_END
