/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTSwiftUIContainerViewWrapper : NSObject

- (UIView *)contentView;
- (void)updateBlurRadius:(NSNumber *)radius;
- (void)updateGrayScale:(NSNumber *)amount;
- (void)updateContentView:(UIView *)view;
- (UIView *)hostingView;
- (void)resetStyles;

@end

NS_ASSUME_NONNULL_END 
