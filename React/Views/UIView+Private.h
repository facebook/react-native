/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTUIKit.h" // TODO(macOS ISS#2323203)

@interface RCTPlatformView (Private) // TODO(macOS ISS#2323203)

// remove clipped subviews implementation
- (void)react_remountAllSubviews;
- (void)react_updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(RCTPlatformView *)clipView; // TODO(macOS ISS#2323203)
- (RCTPlatformView *)react_findClipView; // TODO(macOS ISS#2323203)

@end
