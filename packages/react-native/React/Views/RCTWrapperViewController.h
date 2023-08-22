/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

@class RCTWrapperViewController;

@interface RCTWrapperViewController : UIViewController

- (instancetype)initWithContentView:(RCTUIView *)contentView NS_DESIGNATED_INITIALIZER; // [macOS]

@end
