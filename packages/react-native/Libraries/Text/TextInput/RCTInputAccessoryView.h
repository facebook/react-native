/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#ifndef RCT_FIT_RM_OLD_COMPONENT

@class RCTBridge;
@class RCTInputAccessoryViewContent;

__attribute__((deprecated("This API will be removed along with the legacy architecture.")))
@interface RCTInputAccessoryView : UIView

- (instancetype)initWithBridge:(RCTBridge *)bridge;

@end

#endif // RCT_FIT_RM_OLD_COMPONENT
