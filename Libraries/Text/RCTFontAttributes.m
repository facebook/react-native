/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTFontAttributes.h"

#import <React/RCTAccessibilityManager.h>
#import <React/RCTAssert.h>
#import <React/RCTFont.h>
#import <React/RCTLog.h>

@interface RCTFontAttributes ()
{
  RCTAccessibilityManager *_accessibilityManager;
}

@property (nonatomic, strong) UIFont *font;

@end

@implementation RCTFontAttributes

- (instancetype)initWithAccessibilityManager:(RCTAccessibilityManager *)accessibilityManager
{
  RCTAssertParam(accessibilityManager);

  if (self = [super init]) {
    _accessibilityManager = accessibilityManager;
    _fontSizeMultiplier = _accessibilityManager.multiplier;

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(contentSizeMultiplierDidChange)
                                                 name:RCTAccessibilityManagerDidUpdateMultiplierNotification
                                               object:_accessibilityManager];

    [self updateFont];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)contentSizeMultiplierDidChange
{
  self.fontSizeMultiplier = _accessibilityManager.multiplier;
}

- (void)setAllowFontScaling:(BOOL)allowFontScaling
{
  _allowFontScaling = allowFontScaling;
  [self updateFont];
}

- (void)setFontFamily:(NSString *)fontFamily
{
  _fontFamily = fontFamily;
  [self updateFont];
}

- (void)setFontSize:(NSNumber *)fontSize
{
  _fontSize = fontSize;
  [self updateFont];
}

- (void)setFontSizeMultiplier:(CGFloat)fontSizeMultiplier
{
   _fontSizeMultiplier = fontSizeMultiplier;

  if (_fontSizeMultiplier == 0) {
    RCTLogError(@"fontSizeMultiplier value must be > zero.");
    _fontSizeMultiplier = 1.0;
  }

  [self updateFont];
}

- (void)setFontStyle:(NSString *)fontStyle
{
  _fontStyle = fontStyle;
  [self updateFont];
}

- (void)setFontWeight:(NSString *)fontWeight
{
  _fontWeight = fontWeight;
  [self updateFont];
}

- (void)updateFont
{
  CGFloat scaleMultiplier = self.allowFontScaling ? self.fontSizeMultiplier : 1.0;
  self.font = [RCTFont updateFont:nil
                       withFamily:self.fontFamily
                             size:self.fontSize
                           weight:self.fontWeight
                           style:self.fontStyle
                         variant:nil
                 scaleMultiplier:scaleMultiplier];

  [self.delegate fontAttributesDidChangeWithFont:self.font];
}

@end
