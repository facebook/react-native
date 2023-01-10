/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]
#import "RCTLogBoxView.h"

@interface RCTLogBox : NSObject

#if RCT_DEV_MENU

- (void)setRCTLogBoxView:(RCTLogBoxView *)view;

#endif

@end
