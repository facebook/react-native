/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS GH#774)

#import <React/RCTComponent.h>

#if TARGET_OS_OSX // [TODO(macOS GH#774)
@protocol RCTSliderDelegate;
#endif

#if !TARGET_OS_OSX // ]TODO(macOS GH#774)
@interface RCTSlider : UISlider
#else // [TODO(macOS GH#774)
@interface RCTSlider : NSSlider
#endif

#if TARGET_OS_OSX
@property (nonatomic, weak) id<RCTSliderDelegate> delegate;
@property (nonatomic, readonly) BOOL pressed;
@property (nonatomic, assign) float value;
@property (nonatomic, assign) float minimumValue;
@property (nonatomic, assign) float maximumValue;
@property (nonatomic, strong) NSColor *minimumTrackTintColor;
@property (nonatomic, strong) NSColor *maximumTrackTintColor;
- (void)setValue:(float)value animated:(BOOL)animated;
#endif // ]TODO(macOS GH#774)

@property (nonatomic, copy) RCTBubblingEventBlock onValueChange;
@property (nonatomic, copy) RCTDirectEventBlock onSlidingComplete;

@property (nonatomic, assign) float step;
@property (nonatomic, assign) float lastValue;

@property (nonatomic, strong) UIImage *trackImage;
@property (nonatomic, strong) UIImage *minimumTrackImage;
@property (nonatomic, strong) UIImage *maximumTrackImage;

@property (nonatomic, strong) UIImage *thumbImage;

@end

#if TARGET_OS_OSX // [TODO(macOS GH#774)
@protocol RCTSliderDelegate <NSObject>
@optional
- (void)slider:(RCTSlider *)slider didPress:(BOOL)press;
@end
#endif // ]TODO(macOS GH#774)
