/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

@protocol RCTAnimatedImage <NSObject>
@property (nonatomic, assign, readonly) NSUInteger animatedImageFrameCount;
@property (nonatomic, assign, readonly) NSUInteger animatedImageLoopCount;

- (nullable UIImage *)animatedImageFrameAtIndex:(NSUInteger)index;
- (NSTimeInterval)animatedImageDurationAtIndex:(NSUInteger)index;

@end

@interface RCTAnimatedImage : UIImage <RCTAnimatedImage>
// [macOS
// This is a known initializer for UIImage, but needs to be exposed publicly for macOS since
// this is not a known initializer for NSImage
- (nullable instancetype)initWithData:(NSData *)data scale:(CGFloat)scale;
// macOS]
@end
