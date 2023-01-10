/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

#import <React/RCTComponent.h>

NS_ASSUME_NONNULL_BEGIN

#if TARGET_OS_OSX // [macOS
@protocol RCTSliderDelegate;
#endif // macOS]

#if !TARGET_OS_OSX // [macOS]
@interface RCTSlider : UISlider
#else // [macOS
@interface RCTSlider : NSSlider
#endif // macOS]

#if TARGET_OS_OSX // [macOS
@property (nonatomic, weak) id<RCTSliderDelegate> delegate;
@property (nonatomic, readonly) BOOL pressed;
@property (nonatomic, assign) float value;
@property (nonatomic, assign) float minimumValue;
@property (nonatomic, assign) float maximumValue;
@property (nonatomic, strong) NSColor *minimumTrackTintColor;
@property (nonatomic, strong) NSColor *maximumTrackTintColor;
- (void)setValue:(float)value animated:(BOOL)animated;
#endif // macOS]

@property (nonatomic, copy) RCTBubblingEventBlock onValueChange;
@property (nonatomic, copy) RCTDirectEventBlock onSlidingComplete;

@property (nonatomic, assign) float step;
@property (nonatomic, assign) float lastValue;

@property (nonatomic, strong) UIImage *trackImage;
@property (nonatomic, strong) UIImage *minimumTrackImage;
@property (nonatomic, strong) UIImage *maximumTrackImage;

@property (nonatomic, strong) UIImage *thumbImage;

@end

#if TARGET_OS_OSX // [macOS
@protocol RCTSliderDelegate <NSObject>
@optional
- (void)slider:(RCTSlider *)slider didPress:(BOOL)press;
@end
#endif // macOS]

NS_ASSUME_NONNULL_END
