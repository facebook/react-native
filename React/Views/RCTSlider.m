/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSlider.h"

#if TARGET_OS_OSX // [TODO(macOS GH#774)
#import <Quartz/Quartz.h>

@protocol RCTSliderCellDelegate <NSObject>
@optional
- (void)sliderCell:(NSSliderCell *)sliderCell didPress:(BOOL)press;
@end

@interface RCTSliderCell : NSSliderCell

@property (nonatomic, assign) BOOL pressed;

@property (nonatomic, weak) id<RCTSliderCellDelegate> delegate;
@property (nonatomic, strong) NSImage *knobImage;
@property (nonatomic, strong) NSImage *minimumValueImage;
@property (nonatomic, strong) NSImage *maximumValueImage;
@property (nonatomic, strong) NSColor *minimumTrackTintColor;
@property (nonatomic, strong) NSColor *maximumTrackTintColor;

@property (nonatomic, assign) NSRect currentKnobRect;

@end

@implementation RCTSliderCell

- (void)setPressed:(BOOL)pressed
{
  if (pressed == _pressed) {
    return;
  }
  _pressed = pressed;
  
  id<RCTSliderCellDelegate> delegate = self.delegate;
  if ([delegate respondsToSelector:@selector(sliderCell:didPress:)]) {
    [delegate sliderCell:self didPress:_pressed];
  }
}

- (BOOL)startTrackingAt:(NSPoint)startPoint inView:(NSView *)controlView
{
  self.pressed = YES;
  BOOL val = [super startTrackingAt:startPoint inView:controlView];
  [self drawInteriorWithFrame:controlView.bounds inView:controlView];
  return val;
}

- (void)stopTracking:(NSPoint)lastPoint at:(NSPoint)stopPoint inView:(NSView *)controlView mouseIsUp:(BOOL)flag
{
  self.pressed = NO;
  [super stopTracking:lastPoint at:stopPoint inView:controlView mouseIsUp:flag];
}

- (void)drawKnob:(NSRect)knobRect
{
  if (!_knobImage) {
    [super drawKnob:knobRect];
    return;
  }

  CGFloat dx = (knobRect.size.width - _knobImage.size.width) / 2.0;
  CGFloat dy = (knobRect.size.height - _knobImage.size.height) / 2.0;
  _currentKnobRect = CGRectInset(knobRect, dx, dy);

  [_knobImage drawInRect:NSIntegralRect(_currentKnobRect)];
}

- (void)drawBarInside:(NSRect)cellFrame flipped:(BOOL)flipped
{
  if (![self usesCustomTrackImage]) {
    [super drawBarInside:cellFrame flipped:flipped];
    return;
  }
  
  NSRect trackRect = cellFrame;
  trackRect.size.height = CGRectGetHeight(cellFrame);
  trackRect = NSOffsetRect(trackRect, trunc(NSMidX(cellFrame) - NSMidX(trackRect)), trunc(NSMidY(cellFrame) - NSMidY(trackRect)));
  
  CGFloat value = self.doubleValue / (self.maxValue - self.minValue);
  NSRect beforeKnobRect, afterKnobRect;
  NSDivideRect(trackRect, &beforeKnobRect, &afterKnobRect, value * NSWidth(cellFrame), NSMinXEdge);
  
  [_minimumValueImage drawInRect:NSIntegralRect(beforeKnobRect)];
  [_maximumValueImage drawInRect:NSIntegralRect(afterKnobRect)];
  
  if (_minimumTrackTintColor) {
    [_minimumTrackTintColor set];
    NSRectFill(beforeKnobRect);
  }

  if (_maximumTrackTintColor) {
    [_maximumTrackTintColor set];
    NSRectFill(afterKnobRect);
  }
}

- (BOOL)usesCustomTrackImage
{
  return _minimumValueImage || _maximumValueImage || _minimumTrackTintColor || _maximumTrackTintColor;
}

@end

#endif


#if TARGET_OS_OSX
@interface RCTSlider () <RCTSliderCellDelegate>
@end
#endif // ]TODO(macOS GH#774)

@implementation RCTSlider {
  float _unclippedValue;
}

#if TARGET_OS_OSX // [TODO(macOS GH#774)

- (instancetype)initWithFrame:(NSRect)frameRect
{
  if (self = [super initWithFrame:frameRect]) {
    self.cell.controlSize = NSControlSizeRegular;
    ((RCTSliderCell*)self.cell).delegate = self;
  }
  return self;
}

+ (Class)cellClass
{
  return RCTSliderCell.class;
}

- (float)value
{
  return self.floatValue;
}

- (void)setValue:(float)value animated:(__unused BOOL)animated
{
  self.animator.floatValue = value;
}

- (void)setMinimumTrackTintColor:(NSColor *)minimumTrackTintColor
{
  ((RCTSliderCell*)self.cell).minimumTrackTintColor = minimumTrackTintColor;
}

- (NSColor*)minimumTrackTintColor
{
  return ((RCTSliderCell*)self.cell).minimumTrackTintColor;
}

- (void)setMaximumTrackTintColor:(NSColor *)maximumTrackTintColor
{
  ((RCTSliderCell*)self.cell).maximumTrackTintColor = maximumTrackTintColor;
}

- (NSColor*)maximumTrackTintColor
{
  return ((RCTSliderCell*)self.cell).maximumTrackTintColor;
}

- (void)setNeedsDisplayInRect:(__unused NSRect)invalidRect
{
  [super setNeedsDisplayInRect:self.bounds];
}

- (void)sliderCell:(__unused NSSliderCell *)sliderCell didPress:(BOOL)press
{
  id<RCTSliderDelegate> delegate = self.delegate;
  if ([delegate respondsToSelector:@selector(slider:didPress:)]) {
    [delegate slider:self didPress:press];
  }
}

/* This method is part of the NSAnimatablePropertyContainer which is adopted by NSView (and hence all its
 * subclasses.  It is used to retrieve the default animation that should be performed to animate a given
 * property. If no default animation is provided, the property is not considered implicitly animatable.
 *
 * By default NSSlider does not provide an implicit animation for its "floatValue" property.  So, we will
 * provide one here thus making the "floatValue" animatable.
 */
+ (id)defaultAnimationForKey:(NSString *)key
{
	if ([key isEqualToString:@"floatValue"]) {
		// By default, use simple linear interpolation.
		return [CABasicAnimation animation];
	}
	/* You may wish to add handlers here for the other many properties that can affect a slider's value
	 * such as intValue, doubleValue, ... */
	else {
		// Defer to super's implementation for any keys we don't specifically handle.
		return [super defaultAnimationForKey:key];
	}
}

#endif // ]TODO(macOS GH#774)

- (void)setValue:(float)value
{
  _unclippedValue = value;
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  super.value = value;
#else // [TODO(macOS GH#774)
  self.floatValue = value;
#endif // ]TODO(macOS GH#774)
}

- (void)setMinimumValue:(float)minimumValue
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  super.minimumValue = minimumValue;
  super.value = _unclippedValue;
#else // [TODO(macOS GH#774)
  _minimumValue = minimumValue;
  self.minValue = minimumValue;
  self.floatValue = _unclippedValue;
#endif // ]TODO(macOS GH#774)
}

- (void)setMaximumValue:(float)maximumValue
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  super.maximumValue = maximumValue;
  super.value = _unclippedValue;
#else // [TODO(macOS GH#774)
  _maximumValue = maximumValue;
  self.maxValue = maximumValue;
  self.floatValue = _unclippedValue;
#endif // ]TODO(macOS GH#774)
}

- (void)setTrackImage:(UIImage *)trackImage
{
  if (trackImage != _trackImage) {
    _trackImage = trackImage;
    CGFloat width = trackImage.size.width / 2;
#if !TARGET_OS_OSX // TODO(macOS GH#774)
    UIImage *minimumTrackImage = [trackImage resizableImageWithCapInsets:(UIEdgeInsets){0, width, 0, width}
                                                            resizingMode:UIImageResizingModeStretch];
    UIImage *maximumTrackImage = [trackImage resizableImageWithCapInsets:(UIEdgeInsets){0, width, 0, width}
                                                            resizingMode:UIImageResizingModeStretch];
    [self setMinimumTrackImage:minimumTrackImage forState:UIControlStateNormal];
    [self setMaximumTrackImage:maximumTrackImage forState:UIControlStateNormal];
#else // [TODO(macOS GH#774)
    trackImage.capInsets = NSEdgeInsetsMake(0, width-0.5, 0, width-0.5);
    trackImage.resizingMode = NSImageResizingModeStretch;
    ((RCTSliderCell*)self.cell).minimumValueImage = trackImage;
    ((RCTSliderCell*)self.cell).maximumValueImage = trackImage;
#endif // ]TODO(macOS GH#774)
  }
}

- (void)setMinimumTrackImage:(UIImage *)minimumTrackImage
{
  _trackImage = nil;
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  minimumTrackImage =
      [minimumTrackImage resizableImageWithCapInsets:(UIEdgeInsets){0, minimumTrackImage.size.width, 0, 0}
                                        resizingMode:UIImageResizingModeStretch];
  [self setMinimumTrackImage:minimumTrackImage forState:UIControlStateNormal];
#else // [TODO(macOS GH#774)
  minimumTrackImage.capInsets = NSEdgeInsetsMake(0, minimumTrackImage.size.width-0.5, 0, 0);
  minimumTrackImage.resizingMode = NSImageResizingModeStretch;
  ((RCTSliderCell*)self.cell).minimumValueImage = minimumTrackImage;
#endif // ]TODO(macOS GH#774)
}

- (UIImage *)minimumTrackImage
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  return [self thumbImageForState:UIControlStateNormal];
#else // [TODO(macOS GH#774)
  return ((RCTSliderCell*)self.cell).minimumValueImage;
#endif // ]TODO(macOS GH#774)
}

- (void)setMaximumTrackImage:(UIImage *)maximumTrackImage
{
  _trackImage = nil;
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  maximumTrackImage =
      [maximumTrackImage resizableImageWithCapInsets:(UIEdgeInsets){0, 0, 0, maximumTrackImage.size.width}
                                        resizingMode:UIImageResizingModeStretch];
  [self setMaximumTrackImage:maximumTrackImage forState:UIControlStateNormal];
#else // [TODO(macOS GH#774)
  maximumTrackImage.capInsets = NSEdgeInsetsMake(0, 0, 0, maximumTrackImage.size.width-0.5);
  maximumTrackImage.resizingMode = NSImageResizingModeStretch;
  ((RCTSliderCell*)self.cell).maximumValueImage = maximumTrackImage;
#endif // ]TODO(macOS GH#774)
}

- (UIImage *)maximumTrackImage
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  return [self thumbImageForState:UIControlStateNormal];
#else // [TODO(macOS GH#774)
  return ((RCTSliderCell*)self.cell).maximumValueImage;
#endif // ]TODO(macOS GH#774)
}

- (void)setThumbImage:(UIImage *)thumbImage
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  [self setThumbImage:thumbImage forState:UIControlStateNormal];
#else // [TODO(macOS GH#774)
  ((RCTSliderCell*)self.cell).knobImage = thumbImage;
#endif // ]TODO(macOS GH#774)
}

- (UIImage *)thumbImage
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  return [self thumbImageForState:UIControlStateNormal];
#else  // [TODO(macOS GH#774)
  return ((RCTSliderCell*)self.cell).knobImage;
#endif // ]TODO(macOS GH#774)
}

#if !TARGET_OS_OSX // TODO(macOS GH#774) - accessibility on macOS is on the NSCell rather than the NSControl
- (void)accessibilityIncrement
{
  [super accessibilityIncrement];
  if (_onSlidingComplete) {
    _onSlidingComplete(@{
      @"value" : @(self.value),
    });
  }
}

- (void)accessibilityDecrement
{
  [super accessibilityDecrement];
  if (_onSlidingComplete) {
    _onSlidingComplete(@{
      @"value" : @(self.value),
    });
  }
}
#endif // TODO(macOS GH#774)

@end
