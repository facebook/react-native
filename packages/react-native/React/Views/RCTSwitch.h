/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

#import <React/RCTComponent.h>

__attribute__((deprecated("This API will be removed along with the legacy architecture.")))
@interface RCTSwitch : UISwitch

@property (nonatomic, assign) BOOL wasOn;
@property (nonatomic, copy) RCTBubblingEventBlock onChange;

@end

#endif // RCT_REMOVE_LEGACY_ARCH
