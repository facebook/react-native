/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

@interface RCTPlatformView (Private) // [macOS]

// remove clipped subviews implementation
- (void)react_remountAllSubviews;
- (void)react_updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(RCTPlatformView *)clipView; // [macOS]
- (RCTPlatformView *)react_findClipView; // [macOS]

@end
