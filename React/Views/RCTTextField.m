/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTextField.h"

#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTUtils.h"
#import "UIView+React.h"
#import "RCTView.h"

static const RCTBorderSide RCTBorderSideCount = 4;


@implementation RCTTextField
{
  RCTEventDispatcher *_eventDispatcher;
  NSMutableArray *_reactSubviews;
  BOOL _jsRequestingFirstResponder;
    
 CAShapeLayer *_borderLayers[RCTBorderSideCount];
 CGFloat _borderWidths[RCTBorderSideCount];

    
}

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  if ((self = [super initWithFrame:CGRectZero])) {

    _eventDispatcher = eventDispatcher;
    [self addTarget:self action:@selector(_textFieldDidChange) forControlEvents:UIControlEventEditingChanged];
    [self addTarget:self action:@selector(_textFieldBeginEditing) forControlEvents:UIControlEventEditingDidBegin];
    [self addTarget:self action:@selector(_textFieldEndEditing) forControlEvents:UIControlEventEditingDidEnd];
    [self addTarget:self action:@selector(_textFieldSubmitEditing) forControlEvents:UIControlEventEditingDidEndOnExit];
    _reactSubviews = [[NSMutableArray alloc] init];
    self.returnKeyType = UIReturnKeyDone;
  }
  return self;
}

- (NSArray *)reactSubviews
{
  // TODO: do we support subviews of textfield in React?
  // In any case, we should have a better approach than manually
  // maintaining array in each view subclass like this
  return _reactSubviews;
}

- (void)removeReactSubview:(UIView *)subview
{
  // TODO: this is a bit broken - if the TextField inserts any of
  // its own views below or between React's, the indices won't match
  [_reactSubviews removeObject:subview];
  [subview removeFromSuperview];
}

- (void)insertReactSubview:(UIView *)view atIndex:(NSInteger)atIndex
{
  // TODO: this is a bit broken - if the TextField inserts any of
  // its own views below or between React's, the indices won't match
  [_reactSubviews insertObject:view atIndex:atIndex];
  [super insertSubview:view atIndex:atIndex];
}

- (CGRect)caretRectForPosition:(UITextPosition *)position
{
  if (_caretHidden) {
    return CGRectZero;
  }
  return [super caretRectForPosition:position];
}

- (CGRect)textRectForBounds:(CGRect)bounds
{
  CGRect rect = [super textRectForBounds:bounds];
  return UIEdgeInsetsInsetRect(rect, _paddingEdgeInsets);
}

- (CGRect) placeholderRectForBounds:(CGRect)bounds {
    CGRect rect = [super textRectForBounds:bounds];
    return UIEdgeInsetsInsetRect(rect, _paddingEdgeInsets);
}


- (CGRect)editingRectForBounds:(CGRect)bounds
{
  return [self textRectForBounds:bounds];
}

- (void)setAutoCorrect:(BOOL)autoCorrect
{
  self.autocorrectionType = (autoCorrect ? UITextAutocorrectionTypeYes : UITextAutocorrectionTypeNo);
}

- (BOOL)autoCorrect
{
  return self.autocorrectionType == UITextAutocorrectionTypeYes;
}

#define RCT_TEXT_EVENT_HANDLER(delegateMethod, eventName) \
- (void)delegateMethod                                    \
{                                                         \
  [_eventDispatcher sendTextEventWithType:eventName       \
                                 reactTag:self.reactTag   \
                                     text:self.text];     \
}

RCT_TEXT_EVENT_HANDLER(_textFieldDidChange, RCTTextEventTypeChange)
RCT_TEXT_EVENT_HANDLER(_textFieldBeginEditing, RCTTextEventTypeFocus)
RCT_TEXT_EVENT_HANDLER(_textFieldEndEditing, RCTTextEventTypeEnd)
RCT_TEXT_EVENT_HANDLER(_textFieldSubmitEditing, RCTTextEventTypeSubmit)

// TODO: we should support shouldChangeTextInRect (see UITextFieldDelegate)

- (BOOL)becomeFirstResponder
{
  _jsRequestingFirstResponder = YES; // TODO: is this still needed?
  BOOL result = [super becomeFirstResponder];
  _jsRequestingFirstResponder = NO;

    // TODO: for the future highlighting
    self.borderTopColor = self.highlightedColor;
    self.borderBottomColor = self.highlightedColor;
    self.borderLeftColor = self.highlightedColor;
    self.borderRightColor = self.highlightedColor;
    
  return result;
}

- (BOOL)resignFirstResponder
{
  BOOL result = [super resignFirstResponder];
  if (result)
  {
    [_eventDispatcher sendTextEventWithType:RCTTextEventTypeBlur
                                   reactTag:self.reactTag
                                       text:self.text];
  }
    
    // TODO: for the future highlighting
    self.borderTopColor = self.borderColor;
    self.borderBottomColor = self.borderColor;
    self.borderLeftColor = self.borderColor;
    self.borderRightColor = self.borderColor;

  return result;
}

- (BOOL)canBecomeFirstResponder
{
  return _jsRequestingFirstResponder;
}

#pragma mark - Copied from RCTView

- (void)layoutSubviews
{
    // TODO (#5906496): this a nasty performance drain, but necessary
    // to prevent gaps appearing when the loading spinner disappears.
    // We might be able to fix this another way by triggering a call
    // to updateClippedSubviews manually after loading
    
    [super layoutSubviews];
    
    for (RCTBorderSide side = 0; side < RCTBorderSideCount; side++) {
        if (_borderLayers[side]) [self updatePathForShapeLayerForSide:side];
    }
}

- (void)layoutSublayersOfLayer:(CALayer *)layer
{
    [super layoutSublayersOfLayer:layer];
    
    const CGRect bounds = layer.bounds;
    for (RCTBorderSide side = 0; side < RCTBorderSideCount; side++) {
        _borderLayers[side].frame = bounds;
    }
}

- (BOOL)getTrapezoidPoints:(CGPoint[4])outPoints forSide:(RCTBorderSide)side
{
    const CGRect bounds = self.layer.bounds;
    const CGFloat minX = CGRectGetMinX(bounds);
    const CGFloat maxX = CGRectGetMaxX(bounds);
    const CGFloat minY = CGRectGetMinY(bounds);
    const CGFloat maxY = CGRectGetMaxY(bounds);
    
#define BW(SIDE) [self borderWidthForSide:RCTBorderSide##SIDE]
    
    switch (side) {
        case RCTBorderSideRight:
            outPoints[0] = CGPointMake(maxX - BW(Right), maxY - BW(Bottom));
            outPoints[1] = CGPointMake(maxX - BW(Right), minY + BW(Top));
            outPoints[2] = CGPointMake(maxX, minY);
            outPoints[3] = CGPointMake(maxX, maxY);
            break;
        case RCTBorderSideBottom:
            outPoints[0] = CGPointMake(minX + BW(Left), maxY - BW(Bottom));
            outPoints[1] = CGPointMake(maxX - BW(Right), maxY - BW(Bottom));
            outPoints[2] = CGPointMake(maxX, maxY);
            outPoints[3] = CGPointMake(minX, maxY);
            break;
        case RCTBorderSideLeft:
            outPoints[0] = CGPointMake(minX + BW(Left), minY + BW(Top));
            outPoints[1] = CGPointMake(minX + BW(Left), maxY - BW(Bottom));
            outPoints[2] = CGPointMake(minX, maxY);
            outPoints[3] = CGPointMake(minX, minY);
            break;
        case RCTBorderSideTop:
            outPoints[0] = CGPointMake(maxX - BW(Right), minY + BW(Top));
            outPoints[1] = CGPointMake(minX + BW(Left), minY + BW(Top));
            outPoints[2] = CGPointMake(minX, minY);
            outPoints[3] = CGPointMake(maxX, minY);
            break;
    }
    
    return YES;
}

- (CAShapeLayer *)createShapeLayerIfNotExistsForSide:(RCTBorderSide)side
{
    CAShapeLayer *borderLayer = _borderLayers[side];
    if (!borderLayer) {
        borderLayer = [CAShapeLayer layer];
        borderLayer.fillColor = self.layer.borderColor;
        [self.layer addSublayer:borderLayer];
        _borderLayers[side] = borderLayer;
    }
    return borderLayer;
}

- (void)updatePathForShapeLayerForSide:(RCTBorderSide)side
{
    CAShapeLayer *borderLayer = [self createShapeLayerIfNotExistsForSide:side];
    
    CGPoint trapezoidPoints[4];
    [self getTrapezoidPoints:trapezoidPoints forSide:side];
    
    CGMutablePathRef path = CGPathCreateMutable();
    CGPathAddLines(path, NULL, trapezoidPoints, 4);
    CGPathCloseSubpath(path);
    borderLayer.path = path;
    CGPathRelease(path);
}

- (void)updateBorderLayers
{
    BOOL widthsAndColorsSame = YES;
    CGFloat width = _borderWidths[0];
    CGColorRef color = _borderLayers[0].fillColor;
    for (RCTBorderSide side = 1; side < RCTBorderSideCount; side++) {
        CAShapeLayer *layer = _borderLayers[side];
        if (_borderWidths[side] != width || (layer && !CGColorEqualToColor(layer.fillColor, color))) {
            widthsAndColorsSame = NO;
            break;
        }
    }
    if (widthsAndColorsSame) {
        
        // Set main layer border
        if (width) {
            _borderWidth = self.layer.borderWidth = width;
        }
        if (color) {
            self.layer.borderColor = color;
        }
        
        // Remove border layers
        for (RCTBorderSide side = 0; side < RCTBorderSideCount; side++) {
            [_borderLayers[side] removeFromSuperlayer];
            _borderLayers[side] = nil;
        }
        
    } else {
        
        // Clear main layer border
        self.layer.borderWidth = 0;
        
        // Set up border layers
        for (RCTBorderSide side = 0; side < RCTBorderSideCount; side++) {
            [self updatePathForShapeLayerForSide:side];
        }
    }
}

- (CGFloat)borderWidthForSide:(RCTBorderSide)side
{
    return _borderWidths[side] ?: _borderWidth;
}

- (void)setBorderWidth:(CGFloat)width forSide:(RCTBorderSide)side
{
    _borderWidths[side] = width;
    [self updateBorderLayers];
}

#define BORDER_WIDTH(SIDE) \
- (CGFloat)border##SIDE##Width { return [self borderWidthForSide:RCTBorderSide##SIDE]; } \
- (void)setBorder##SIDE##Width:(CGFloat)width { [self setBorderWidth:width forSide:RCTBorderSide##SIDE]; }

BORDER_WIDTH(Top)
BORDER_WIDTH(Right)
BORDER_WIDTH(Bottom)
BORDER_WIDTH(Left)

- (CGColorRef)borderColorForSide:(RCTBorderSide)side
{
    return _borderLayers[side].fillColor ?: self.layer.borderColor;
}

- (void)setBorderColor:(CGColorRef)color forSide:(RCTBorderSide)side
{
    [self createShapeLayerIfNotExistsForSide:side].fillColor = color;
    [self updateBorderLayers];
}

#define BORDER_COLOR(SIDE) \
- (CGColorRef)border##SIDE##Color { return [self borderColorForSide:RCTBorderSide##SIDE]; } \
- (void)setBorder##SIDE##Color:(CGColorRef)color { [self setBorderColor:color forSide:RCTBorderSide##SIDE]; }

BORDER_COLOR(Top)
BORDER_COLOR(Right)
BORDER_COLOR(Bottom)
BORDER_COLOR(Left)

- (void)setBorderWidth:(CGFloat)borderWidth
{
    _borderWidth = borderWidth;
    for (RCTBorderSide side = 0; side < RCTBorderSideCount; side++) {
        _borderWidths[side] = borderWidth;
    }
    [self updateBorderLayers];
}

- (void)setBorderColor:(CGColorRef)borderColor
{
    self.layer.borderColor = borderColor;
    for (RCTBorderSide side = 0; side < RCTBorderSideCount; side++) {
        _borderLayers[side].fillColor = borderColor;
    }
    [self updateBorderLayers];
}

- (CGColorRef)borderColor
{
    return self.layer.borderColor;
}




@end
