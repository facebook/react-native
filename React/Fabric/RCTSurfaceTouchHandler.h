/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTSurfaceTouchHandler : UIGestureRecognizer

- (void)attachToView:(UIView *)view;
- (void)detachFromView:(UIView *)view;

@end

NS_ASSUME_NONNULL_END
