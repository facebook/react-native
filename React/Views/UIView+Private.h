/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS GH#774)

@interface RCTPlatformView (Private) // TODO(macOS GH#774)

// remove clipped subviews implementation
- (void)react_remountAllSubviews;
- (void)react_updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(RCTPlatformView *)clipView; // TODO(macOS GH#774)
- (RCTPlatformView *)react_findClipView; // TODO(macOS GH#774)

@end
