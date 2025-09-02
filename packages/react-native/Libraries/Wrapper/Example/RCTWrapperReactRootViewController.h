/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#ifndef RCT_FIT_RM_OLD_COMPONENT

@class RCTBridge;

NS_ASSUME_NONNULL_BEGIN

__attribute__((deprecated("This API will be removed along with the legacy architecture.")))
@interface RCTWrapperReactRootViewController : UIViewController

- (instancetype)initWithBridge:(RCTBridge *)bridge;

@end

NS_ASSUME_NONNULL_END

#endif // RCT_FIT_RM_OLD_COMPONENT
