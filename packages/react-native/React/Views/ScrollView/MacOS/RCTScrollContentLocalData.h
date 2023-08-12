/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// [macOS]

#if TARGET_OS_OSX 
#import <AppKit/AppKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTScrollContentLocalData : NSObject

@property (nonatomic, assign) CGFloat horizontalScrollerHeight;
@property (nonatomic, assign) CGFloat verticalScrollerWidth;

- (instancetype)initWithVerticalScrollerWidth:(CGFloat)verticalScrollerWidth
                     horizontalScrollerHeight:(CGFloat)horizontalScrollerHeight;

@end

NS_ASSUME_NONNULL_END

#endif // [macOS]
