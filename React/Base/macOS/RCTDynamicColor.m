/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO(macOS GH#774)

#import "RCTDynamicColor.h"

#define RCT_FORWARD_PROPERTY( PROP, TYPE ) \
- (TYPE)PROP { return [[self effectiveColor] PROP]; }

static NSString *const RCTAquaColor = @"aquaColor";
static NSString *const RCTDarkAquaColor = @"darkAquaColor";

@implementation RCTDynamicColor
{
  NSColor *_aquaColor;
  NSColor *_darkAquaColor;
}

- (instancetype)initWithAquaColor:(NSColor *)aquaColor
                    darkAquaColor:(NSColor *)darkAquaColor
{
  self = [super init];
  if (self) {
    _aquaColor = [aquaColor copy];
    _darkAquaColor = [darkAquaColor copy];
  }
  return self;
}

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (instancetype)initWithCoder:(NSCoder *)coder
{
  self = [super initWithCoder:coder];
  if (self) {
    _aquaColor = [coder decodeObjectOfClass:[NSColor class] forKey:RCTAquaColor];
    _darkAquaColor = [coder decodeObjectOfClass:[NSColor class] forKey:RCTDarkAquaColor];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)aCoder
{
  [super encodeWithCoder:aCoder];
  [aCoder encodeObject:_aquaColor forKey:RCTAquaColor];
  if (_darkAquaColor) {
    [aCoder encodeObject:_darkAquaColor forKey:RCTDarkAquaColor];
  }
}

- (NSColor *)effectiveColor
{
  NSColor *effectiveColor = _aquaColor;
  NSAppearance *appearance = [NSAppearance currentAppearance] ?: [NSApp effectiveAppearance];

  NSAppearanceName appearanceName = [appearance bestMatchFromAppearancesWithNames:@[NSAppearanceNameAqua, NSAppearanceNameDarkAqua]];

  if (_darkAquaColor != nil && [appearanceName isEqualToString:NSAppearanceNameDarkAqua]) {
    effectiveColor = _darkAquaColor;
  }
  return effectiveColor;
}

RCT_FORWARD_PROPERTY(colorSpace, NSColorSpace *)
- (NSColor *)colorUsingColorSpace:(NSColorSpace *)space
{
  return [[self effectiveColor] colorUsingColorSpace:space];
}

RCT_FORWARD_PROPERTY(colorSpaceName, NSColorSpaceName)
- (NSColor *)colorUsingColorSpaceName:(NSColorSpaceName)name
{
  return [[self effectiveColor] colorUsingColorSpaceName:name];
}

RCT_FORWARD_PROPERTY(numberOfComponents, NSInteger)
- (void)getComponents:(CGFloat *)components
{
  return [[self effectiveColor] getComponents:components];
}

#pragma mark - RGB colorspace

RCT_FORWARD_PROPERTY(redComponent, CGFloat)
RCT_FORWARD_PROPERTY(greenComponent, CGFloat)
RCT_FORWARD_PROPERTY(blueComponent, CGFloat)

- (void)getRed:(nullable CGFloat *)red green:(nullable CGFloat *)green blue:(nullable CGFloat *)blue alpha:(nullable CGFloat *)alpha
{
  return [[self effectiveColor] getRed:red green:green blue:blue alpha:alpha];
}

#pragma mark - HSB colorspace

RCT_FORWARD_PROPERTY(hueComponent, CGFloat)
RCT_FORWARD_PROPERTY(saturationComponent, CGFloat)
RCT_FORWARD_PROPERTY(brightnessComponent, CGFloat)

- (void)getHue:(nullable CGFloat *)hue saturation:(nullable CGFloat *)saturation brightness:(nullable CGFloat *)brightness alpha:(nullable CGFloat *)alpha
{
  return [[self effectiveColor] getHue:hue saturation:saturation brightness:brightness alpha:alpha];
}

#pragma mark - Gray colorspace

RCT_FORWARD_PROPERTY(whiteComponent, CGFloat)

- (void)getWhite:(CGFloat *)white alpha:(CGFloat *)alpha
{
  return [[self effectiveColor] getWhite:white alpha:alpha];
}

#pragma mark - CMYK colorspace

RCT_FORWARD_PROPERTY(cyanComponent, CGFloat)
RCT_FORWARD_PROPERTY(magentaComponent, CGFloat)
RCT_FORWARD_PROPERTY(yellowComponent, CGFloat)
RCT_FORWARD_PROPERTY(blackComponent, CGFloat)

- (void)getCyan:(nullable CGFloat *)cyan magenta:(nullable CGFloat *)magenta yellow:(nullable CGFloat *)yellow black:(nullable CGFloat *)black alpha:(nullable CGFloat *)alpha
{
  return [[self effectiveColor] getCyan:cyan magenta:magenta yellow:yellow black:black alpha:alpha];
}

#pragma mark - Others

RCT_FORWARD_PROPERTY(alphaComponent, CGFloat)
RCT_FORWARD_PROPERTY(CGColor, CGColorRef)
RCT_FORWARD_PROPERTY(catalogNameComponent, NSColorListName)
RCT_FORWARD_PROPERTY(colorNameComponent, NSColorName)
RCT_FORWARD_PROPERTY(localizedCatalogNameComponent, NSColorListName)
RCT_FORWARD_PROPERTY(localizedColorNameComponent, NSString *)

- (void)setStroke
{
  [[self effectiveColor] setStroke];
}

- (void)setFill
{
  [[self effectiveColor] setFill];
}

- (void)set
{
  [[self effectiveColor] set];
}

- (nullable NSColor *)highlightWithLevel:(CGFloat)val
{
  return [[self effectiveColor] highlightWithLevel:val];
}

- (NSColor *)shadowWithLevel:(CGFloat)val
{
  return [[self effectiveColor] shadowWithLevel:val];
}

- (NSColor *)colorWithAlphaComponent:(CGFloat)alpha
{
  return [[self effectiveColor] colorWithAlphaComponent:alpha];
}

- (nullable NSColor *)blendedColorWithFraction:(CGFloat)fraction ofColor:(NSColor *)color
{
  return [[self effectiveColor] blendedColorWithFraction:fraction ofColor:color];
}

- (NSColor *)colorWithSystemEffect:(NSColorSystemEffect)systemEffect NS_AVAILABLE_MAC(10_14)
{
    NSColor *aquaColorWithSystemEffect = [_aquaColor colorWithSystemEffect:systemEffect];
    NSColor *darkAquaColorWithSystemEffect = [_darkAquaColor colorWithSystemEffect:systemEffect];
    return [[RCTDynamicColor alloc] initWithAquaColor:aquaColorWithSystemEffect darkAquaColor:darkAquaColorWithSystemEffect];
}

- (NSUInteger)hash
{
  const NSUInteger prime = 31;
  NSUInteger result = 1;
  result = prime * result + [_aquaColor hash];
  result = prime * result + [_darkAquaColor hash];
  return result;
}

- (BOOL)isEqual:(id)other {
  if (other == self) {
    return YES;
  }

  return other != nil && [other isKindOfClass:[self class]] && [self isEqualToDynamicColor:other];
}

- (BOOL)isEqualToDynamicColor:(RCTDynamicColor *)other {
  if (self == other) {
    return YES;
  }

  if ([_aquaColor isNotEqualTo:other->_aquaColor]) {
    return NO;
  }

  if ([_darkAquaColor isNotEqualTo:other->_darkAquaColor]) {
    return NO;
  }

  return YES;
}

@end
