/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

NS_ASSUME_NONNULL_BEGIN

/**
 * Lightweight wrapper class around a UIView with a react tag which registers a
 * constant react tag at initialization time for a stable hash and provides the
 * udnerlying view to a caller if that underlying view's react tag has not
 * changed from the one provided at initialization time (i.e. recycled).
 */
@interface RCTReactTaggedView : NSObject {
  RCTPlatformView *_view; // [macOS]
  NSInteger _tag;
}

+ (RCTReactTaggedView *)wrap:(RCTPlatformView *)view; // [macOS]

- (instancetype)initWithView:(RCTPlatformView *)view; // [macOS]
- (nullable RCTPlatformView *)view; // [macOS]
- (NSInteger)tag;

- (BOOL)isEqual:(id)other;
- (NSUInteger)hash;

@end

NS_ASSUME_NONNULL_END
