/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTConvert.h"

#import <objc/message.h>

#import "RCTLog.h"

@implementation RCTConvert

RCT_CONVERTER(BOOL, BOOL, boolValue)
RCT_NUMBER_CONVERTER(double, doubleValue)
RCT_NUMBER_CONVERTER(float, floatValue)
RCT_NUMBER_CONVERTER(int, intValue)

RCT_NUMBER_CONVERTER(int64_t, longLongValue);
RCT_NUMBER_CONVERTER(uint64_t, unsignedLongLongValue);

RCT_NUMBER_CONVERTER(NSInteger, integerValue)
RCT_NUMBER_CONVERTER(NSUInteger, unsignedIntegerValue)

RCT_CONVERTER_CUSTOM(NSArray *, NSArray, [NSArray arrayWithArray:json])
RCT_CONVERTER_CUSTOM(NSDictionary *, NSDictionary, [NSDictionary dictionaryWithDictionary:json])
RCT_CONVERTER(NSString *, NSString, description)

+ (NSNumber *)NSNumber:(id)json
{
  if ([json isKindOfClass:[NSNumber class]]) {
    return json;
  } else if ([json isKindOfClass:[NSString class]]) {
    NSNumberFormatter *formatter = [[NSNumberFormatter alloc] init];
    NSNumber *number = [formatter numberFromString:json];
    if (!number) {
      RCTLogError(@"JSON String '%@' could not be interpreted as a number", json);
    }
    return number;
  } else if (json && json != [NSNull null]) {
    RCTLogError(@"JSON value '%@' of class %@ could not be interpreted as a number", json, [json class]);
  }
  return nil;
}

+ (NSURL *)NSURL:(id)json
{
  if (![json isKindOfClass:[NSString class]]) {
    RCTLogError(@"Expected NSString for NSURL, received %@: %@", [json class], json);
    return nil;
  }

  NSString *path = json;
  if ([path isAbsolutePath])
  {
    return [NSURL fileURLWithPath:path];
  }
  else if ([path length])
  {
    NSURL *URL = [NSURL URLWithString:path relativeToURL:[[NSBundle mainBundle] resourceURL]];
    if ([URL isFileURL] && ![[NSFileManager defaultManager] fileExistsAtPath:[URL path]]) {
      RCTLogWarn(@"The file '%@' does not exist", URL);
      return nil;
    }
    return URL;
  }
  return nil;
}

+ (NSURLRequest *)NSURLRequest:(id)json
{
  return [NSURLRequest requestWithURL:[self NSURL:json]];
}

// JS Standard for time is milliseconds
RCT_CONVERTER_CUSTOM(NSDate *, NSDate, [NSDate dateWithTimeIntervalSince1970:[self double:json] / 1000.0])
RCT_CONVERTER_CUSTOM(NSTimeInterval, NSTimeInterval, [self double:json] / 1000.0)

// JS standard for time zones is minutes.
RCT_CONVERTER_CUSTOM(NSTimeZone *, NSTimeZone, [NSTimeZone timeZoneForSecondsFromGMT:[self double:json] * 60.0])

RCT_ENUM_CONVERTER(NSTextAlignment, (@{
  @"auto": @(NSTextAlignmentNatural),
  @"left": @(NSTextAlignmentLeft),
  @"center": @(NSTextAlignmentCenter),
  @"right": @(NSTextAlignmentRight),
  @"justify": @(NSTextAlignmentJustified),
}), NSTextAlignmentNatural, integerValue)

RCT_ENUM_CONVERTER(NSWritingDirection, (@{
  @"auto": @(NSWritingDirectionNatural),
  @"ltr": @(NSWritingDirectionLeftToRight),
  @"rtl": @(NSWritingDirectionRightToLeft),
}), NSWritingDirectionNatural, integerValue)

RCT_ENUM_CONVERTER(UITextAutocapitalizationType, (@{
  @"none": @(UITextAutocapitalizationTypeNone),
  @"words": @(UITextAutocapitalizationTypeWords),
  @"sentences": @(UITextAutocapitalizationTypeSentences),
  @"characters": @(UITextAutocapitalizationTypeAllCharacters)
}), UITextAutocapitalizationTypeSentences, integerValue)

RCT_ENUM_CONVERTER(UIKeyboardType, (@{
  @"numeric": @(UIKeyboardTypeDecimalPad),
  @"default": @(UIKeyboardTypeDefault),
}), UIKeyboardTypeDefault, integerValue)

// TODO: normalise the use of w/width so we can do away with the alias values (#6566645)
RCT_CONVERTER_CUSTOM(CGFloat, CGFloat, [self double:json])
RCT_CGSTRUCT_CONVERTER(CGPoint, (@[@"x", @"y"]), nil)
RCT_CGSTRUCT_CONVERTER(CGSize, (@[@"width", @"height"]), (@{@"w": @"width", @"h": @"height"}))
RCT_CGSTRUCT_CONVERTER(CGRect, (@[@"x", @"y", @"width", @"height"]), (@{@"w": @"width", @"h": @"height"}))
RCT_CGSTRUCT_CONVERTER(UIEdgeInsets, (@[@"top", @"left", @"bottom", @"right"]), nil)

RCT_ENUM_CONVERTER(CGLineJoin, (@{
  @"miter": @(kCGLineJoinMiter),
  @"round": @(kCGLineJoinRound),
  @"bevel": @(kCGLineJoinBevel),
}), kCGLineJoinMiter, intValue)

RCT_ENUM_CONVERTER(CGLineCap, (@{
  @"butt": @(kCGLineCapButt),
  @"round": @(kCGLineCapRound),
  @"square": @(kCGLineCapSquare),
}), kCGLineCapButt, intValue)

RCT_CGSTRUCT_CONVERTER(CATransform3D, (@[
  @"m11", @"m12", @"m13", @"m14",
  @"m21", @"m22", @"m23", @"m24",
  @"m31", @"m32", @"m33", @"m34",
  @"m41", @"m42", @"m43", @"m44"
]), nil)

RCT_CGSTRUCT_CONVERTER(CGAffineTransform, (@[@"a", @"b", @"c", @"d", @"tx", @"ty"]), nil)

+ (UIColor *)UIColor:(id)json
{
  // Check color cache
  static NSMutableDictionary *colorCache = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    colorCache = [[NSMutableDictionary alloc] init];
  });
  UIColor *color = colorCache[json];
  if (color) {
    return color;
  }

  if ([json isKindOfClass:[NSString class]]) {

    // Check named colors
    static NSDictionary *namedColors = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      namedColors = @{

        // CSS colors
        @"aliceblue": @"#f0f8ff",
        @"antiquewhite": @"#faebd7",
        @"aqua": @"#00ffff",
        @"aquamarine": @"#7fffd4",
        @"azure": @"#f0ffff",
        @"beige": @"#f5f5dc",
        @"bisque": @"#ffe4c4",
        @"black": @"#000000",
        @"blanchedalmond": @"#ffebcd",
        @"blue": @"#0000ff",
        @"blueviolet": @"#8a2be2",
        @"brown": @"#a52a2a",
        @"burlywood": @"#deb887",
        @"cadetblue": @"#5f9ea0",
        @"chartreuse": @"#7fff00",
        @"chocolate": @"#d2691e",
        @"coral": @"#ff7f50",
        @"cornflowerblue": @"#6495ed",
        @"cornsilk": @"#fff8dc",
        @"crimson": @"#dc143c",
        @"cyan": @"#00ffff",
        @"darkblue": @"#00008b",
        @"darkcyan": @"#008b8b",
        @"darkgoldenrod": @"#b8860b",
        @"darkgray": @"#a9a9a9",
        @"darkgrey": @"#a9a9a9",
        @"darkgreen": @"#006400",
        @"darkkhaki": @"#bdb76b",
        @"darkmagenta": @"#8b008b",
        @"darkolivegreen": @"#556b2f",
        @"darkorange": @"#ff8c00",
        @"darkorchid": @"#9932cc",
        @"darkred": @"#8b0000",
        @"darksalmon": @"#e9967a",
        @"darkseagreen": @"#8fbc8f",
        @"darkslateblue": @"#483d8b",
        @"darkslategray": @"#2f4f4f",
        @"darkslategrey": @"#2f4f4f",
        @"darkturquoise": @"#00ced1",
        @"darkviolet": @"#9400d3",
        @"deeppink": @"#ff1493",
        @"deepskyblue": @"#00bfff",
        @"dimgray": @"#696969",
        @"dimgrey": @"#696969",
        @"dodgerblue": @"#1e90ff",
        @"firebrick": @"#b22222",
        @"floralwhite": @"#fffaf0",
        @"forestgreen": @"#228b22",
        @"fuchsia": @"#ff00ff",
        @"gainsboro": @"#dcdcdc",
        @"ghostwhite": @"#f8f8ff",
        @"gold": @"#ffd700",
        @"goldenrod": @"#daa520",
        @"gray": @"#808080",
        @"grey": @"#808080",
        @"green": @"#008000",
        @"greenyellow": @"#adff2f",
        @"honeydew": @"#f0fff0",
        @"hotpink": @"#ff69b4",
        @"indianred": @"#cd5c5c",
        @"indigo": @"#4b0082",
        @"ivory": @"#fffff0",
        @"khaki": @"#f0e68c",
        @"lavender": @"#e6e6fa",
        @"lavenderblush": @"#fff0f5",
        @"lawngreen": @"#7cfc00",
        @"lemonchiffon": @"#fffacd",
        @"lightblue": @"#add8e6",
        @"lightcoral": @"#f08080",
        @"lightcyan": @"#e0ffff",
        @"lightgoldenrodyellow": @"#fafad2",
        @"lightgray": @"#d3d3d3",
        @"lightgrey": @"#d3d3d3",
        @"lightgreen": @"#90ee90",
        @"lightpink": @"#ffb6c1",
        @"lightsalmon": @"#ffa07a",
        @"lightseagreen": @"#20b2aa",
        @"lightskyblue": @"#87cefa",
        @"lightslategray": @"#778899",
        @"lightslategrey": @"#778899",
        @"lightsteelblue": @"#b0c4de",
        @"lightyellow": @"#ffffe0",
        @"lime": @"#00ff00",
        @"limegreen": @"#32cd32",
        @"linen": @"#faf0e6",
        @"magenta": @"#ff00ff",
        @"maroon": @"#800000",
        @"mediumaquamarine": @"#66cdaa",
        @"mediumblue": @"#0000cd",
        @"mediumorchid": @"#ba55d3",
        @"mediumpurple": @"#9370db",
        @"mediumseagreen": @"#3cb371",
        @"mediumslateblue": @"#7b68ee",
        @"mediumspringgreen": @"#00fa9a",
        @"mediumturquoise": @"#48d1cc",
        @"mediumvioletred": @"#c71585",
        @"midnightblue": @"#191970",
        @"mintcream": @"#f5fffa",
        @"mistyrose": @"#ffe4e1",
        @"moccasin": @"#ffe4b5",
        @"navajowhite": @"#ffdead",
        @"navy": @"#000080",
        @"oldlace": @"#fdf5e6",
        @"olive": @"#808000",
        @"olivedrab": @"#6b8e23",
        @"orange": @"#ffa500",
        @"orangered": @"#ff4500",
        @"orchid": @"#da70d6",
        @"palegoldenrod": @"#eee8aa",
        @"palegreen": @"#98fb98",
        @"paleturquoise": @"#afeeee",
        @"palevioletred": @"#db7093",
        @"papayawhip": @"#ffefd5",
        @"peachpuff": @"#ffdab9",
        @"peru": @"#cd853f",
        @"pink": @"#ffc0cb",
        @"plum": @"#dda0dd",
        @"powderblue": @"#b0e0e6",
        @"purple": @"#800080",
        @"rebeccapurple": @"#663399",
        @"red": @"#ff0000",
        @"rosybrown": @"#bc8f8f",
        @"royalblue": @"#4169e1",
        @"saddlebrown": @"#8b4513",
        @"salmon": @"#fa8072",
        @"sandybrown": @"#f4a460",
        @"seagreen": @"#2e8b57",
        @"seashell": @"#fff5ee",
        @"sienna": @"#a0522d",
        @"silver": @"#c0c0c0",
        @"skyblue": @"#87ceeb",
        @"slateblue": @"#6a5acd",
        @"slategray": @"#708090",
        @"slategrey": @"#708090",
        @"snow": @"#fffafa",
        @"springgreen": @"#00ff7f",
        @"steelblue": @"#4682b4",
        @"tan": @"#d2b48c",
        @"teal": @"#008080",
        @"thistle": @"#d8bfd8",
        @"tomato": @"#ff6347",
        @"turquoise": @"#40e0d0",
        @"violet": @"#ee82ee",
        @"wheat": @"#f5deb3",
        @"white": @"#ffffff",
        @"whitesmoke": @"#f5f5f5",
        @"yellow": @"#ffff00",
        @"yellowgreen": @"#9acd32",

        // Nonstandard color extensions
        @"transparent": @"rgba(0,0,0,0)",
      };
    });
    NSString *colorString = namedColors[json];
    if (!colorString) {
      colorString = json;
    }

    // Parse color
    NSUInteger red = -1;
    NSUInteger green = -1;
    NSUInteger blue = -1;
    CGFloat alpha = 1.0;
    if ([colorString hasPrefix:@"#"]) {
      sscanf([colorString UTF8String], "#%02tX%02tX%02tX", &red, &green, &blue);
    } else if ([colorString hasPrefix:@"rgba("]) {
      double tmpAlpha;
      sscanf([colorString UTF8String], "rgba(%zd,%zd,%zd,%lf)", &red, &green, &blue, &tmpAlpha);
      alpha = tmpAlpha > 0.99 ? 1.0 : tmpAlpha;
    } else if ([colorString hasPrefix:@"rgb("]) {
      sscanf([colorString UTF8String], "rgb(%zd,%zd,%zd)", &red, &green, &blue);
    } else {
      RCTLogError(@"Unrecognized color format '%@', must be one of #hex|rgba|rgb", colorString);
    }
    if (red == -1 || green == -1 || blue == -1 || alpha > 1.0 || alpha < 0.0) {
      RCTLogError(@"Invalid color string '%@'", colorString);
    } else {
      color = [UIColor colorWithRed:red / 255.0 green:green / 255.0 blue:blue / 255.0 alpha:alpha];
    }

  } else if ([json isKindOfClass:[NSArray class]]) {

    if ([json count] < 3 || [json count] > 4) {

      RCTLogError(@"Expected array with count 3 or 4, but count is %zd: %@", [json count], json);

    } else {

      // Color array
      color = [UIColor colorWithRed:[self double:json[0]]
                              green:[self double:json[1]]
                               blue:[self double:json[2]]
                              alpha:[json count] > 3 ? [self double:json[3]] : 1];
    }

  } else if ([json isKindOfClass:[NSDictionary class]]) {

    // Color dictionary
    color = [UIColor colorWithRed:[self double:json[@"r"]]
                            green:[self double:json[@"g"]]
                             blue:[self double:json[@"b"]]
                            alpha:[self double:json[@"a"] ?: @1]];

  } else if (json && ![json isKindOfClass:[NSNull class]]) {

    RCTLogError(@"Expected NSArray, NSDictionary or NSString for UIColor, received %@: %@", [json class], json);
  }

  // Default color
  if (!color) {
    color = [UIColor whiteColor];
  }

  // Cache and return
  if (json) {
    colorCache[json] = color;
  }
  return color;
}

+ (CGColorRef)CGColor:(id)json
{
  return [self UIColor:json].CGColor;
}

+ (UIImage *)UIImage:(id)json
{
  // TODO: we might as well cache the result of these checks (and possibly the
  // image itself) so as to reduce overhead on subsequent checks of the same input

  if (![json isKindOfClass:[NSString class]]) {
    RCTLogError(@"Expected NSString for UIImage, received %@: %@", [json class], json);
    return nil;
  }

  if ([json length] == 0) {
    return nil;
  }

  UIImage *image = nil;
  NSString *path = json;
  if ([path isAbsolutePath]) {
    image = [UIImage imageWithContentsOfFile:path];
  } else {
    image = [UIImage imageNamed:path];
    if (!image) {
      image = [UIImage imageWithContentsOfFile:[[NSBundle mainBundle] pathForResource:path ofType:nil]];
    }
  }
  // NOTE: we don't warn about nil images because there are legitimate
  // case where we find out if a string is an image by using this method
  return image;
}

+ (CGImageRef)CGImage:(id)json
{
  return [self UIImage:json].CGImage;
}

+ (UIFont *)UIFont:(UIFont *)font withSize:(id)json
{
  return [self UIFont:font withFamily:nil size:json weight:nil];
}

+ (UIFont *)UIFont:(UIFont *)font withWeight:(id)json
{
  return [self UIFont:font withFamily:nil size:nil weight:json];
}

+ (UIFont *)UIFont:(UIFont *)font withFamily:(id)json
{
  return [self UIFont:font withFamily:json size:nil weight:nil];
}

+ (UIFont *)UIFont:(UIFont *)font withFamily:(id)family size:(id)size weight:(id)weight
{
  CGFloat const RCTDefaultFontSize = 14;
  NSString *const RCTDefaultFontName = @"HelveticaNeue";
  NSString *const RCTDefaultFontWeight = @"normal";
  NSString *const RCTBoldFontWeight = @"bold";

  // Create descriptor
  UIFontDescriptor *fontDescriptor = font.fontDescriptor ?: [UIFontDescriptor fontDescriptorWithName:RCTDefaultFontName size:RCTDefaultFontSize];

  // Get font size
  CGFloat fontSize = [self CGFloat:size];
  if (fontSize && !isnan(fontSize)) {
    fontDescriptor = [fontDescriptor fontDescriptorWithSize:fontSize];
  }

  // Get font family
  NSString *familyName = [self NSString:family];
  if (familyName) {
    if ([UIFont fontNamesForFamilyName:familyName].count == 0) {
      font = [UIFont fontWithName:familyName size:fontDescriptor.pointSize];
      if (font) {
        // It's actually a font name, not a font family name,
        // but we'll do what was meant, not what was said.
        familyName = font.familyName;
        fontDescriptor = font.fontDescriptor;
      } else {
        // Not a valid font or family
        RCTLogError(@"Unrecognized font family '%@'", familyName);
        familyName = [UIFont fontWithDescriptor:fontDescriptor size:0].familyName;
      }
    } else {
      // Set font family
      fontDescriptor = [fontDescriptor fontDescriptorWithFamily:familyName];
    }
  } else {
    familyName = [UIFont fontWithDescriptor:fontDescriptor size:0].familyName;
  }

  // Get font weight
  NSString *fontWeight = [self NSString:weight];
  if (fontWeight) {

    static NSSet *values;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      values = [NSSet setWithObjects:RCTDefaultFontWeight, RCTBoldFontWeight, nil];
    });

    if (fontWeight && ![values containsObject:fontWeight]) {
      RCTLogError(@"Unrecognized font weight '%@', must be one of %@", fontWeight, values);
      fontWeight = RCTDefaultFontWeight;
    }

    // this is hacky. we are appending the string -Medium because most fonts we currently use
    // just need to have -Medium appended to get the bold we want. we're going to revamp this
    // to make it easier to know which options are available in JS. t4996115
    if ([fontWeight isEqualToString:RCTBoldFontWeight]) {
      font = nil;
      for (NSString *fontName in [UIFont fontNamesForFamilyName:familyName]) {
        if ([fontName hasSuffix:@"-Medium"]) {
          font = [UIFont fontWithName:fontName size:fontDescriptor.pointSize];
          break;
        }
        if ([fontName hasSuffix:@"-Bold"]) {
          font = [UIFont fontWithName:fontName size:fontDescriptor.pointSize];
          // But keep searching in case there's a medium option
        }
      }
      if (font) {
        fontDescriptor = font.fontDescriptor;
      }
    }
  }

  // TODO: font style

  // Create font
  return [UIFont fontWithDescriptor:fontDescriptor size:0];
}

RCT_ARRAY_CONVERTER(NSString)
RCT_ARRAY_CONVERTER(NSURL)
RCT_ARRAY_CONVERTER(NSNumber)
RCT_ARRAY_CONVERTER(UIColor)

// Can't use RCT_ARRAY_CONVERTER due to bridged cast
+ (NSArray *)CGColorArray:(id)json
{
  NSMutableArray *colors = [[NSMutableArray alloc] init];
  for (id value in [self NSArray:json]) {
    [colors addObject:(__bridge id)[self CGColor:value]];
  }
  return colors;
}

typedef BOOL css_overflow;

RCT_ENUM_CONVERTER(css_overflow, (@{
  @"hidden": @NO,
  @"visible": @YES
}), YES, boolValue)

RCT_ENUM_CONVERTER(css_flex_direction_t, (@{
  @"row": @(CSS_FLEX_DIRECTION_ROW),
  @"column": @(CSS_FLEX_DIRECTION_COLUMN)
}), CSS_FLEX_DIRECTION_COLUMN, intValue)

RCT_ENUM_CONVERTER(css_justify_t, (@{
  @"flex-start": @(CSS_JUSTIFY_FLEX_START),
  @"flex-end": @(CSS_JUSTIFY_FLEX_END),
  @"center": @(CSS_JUSTIFY_CENTER),
  @"space-between": @(CSS_JUSTIFY_SPACE_BETWEEN),
  @"space-around": @(CSS_JUSTIFY_SPACE_AROUND)
}), CSS_JUSTIFY_FLEX_START, intValue)

RCT_ENUM_CONVERTER(css_align_t, (@{
  @"flex-start": @(CSS_ALIGN_FLEX_START),
  @"flex-end": @(CSS_ALIGN_FLEX_END),
  @"center": @(CSS_ALIGN_CENTER),
  @"auto": @(CSS_ALIGN_AUTO),
  @"stretch": @(CSS_ALIGN_STRETCH)
}), CSS_ALIGN_FLEX_START, intValue)

RCT_ENUM_CONVERTER(css_position_type_t, (@{
  @"absolute": @(CSS_POSITION_ABSOLUTE),
  @"relative": @(CSS_POSITION_RELATIVE)
}), CSS_POSITION_RELATIVE, intValue)

RCT_ENUM_CONVERTER(css_wrap_type_t, (@{
  @"wrap": @(CSS_WRAP),
  @"nowrap": @(CSS_NOWRAP)
}), CSS_NOWRAP, intValue)

RCT_ENUM_CONVERTER(RCTPointerEvents, (@{
  @"none": @(RCTPointerEventsNone),
  @"box-only": @(RCTPointerEventsBoxOnly),
  @"box-none": @(RCTPointerEventsBoxNone),
  @"auto": @(RCTPointerEventsUnspecified)
}), RCTPointerEventsUnspecified, integerValue)

RCT_ENUM_CONVERTER(RCTAnimationType, (@{
  @"spring": @(RCTAnimationTypeSpring),
  @"linear": @(RCTAnimationTypeLinear),
  @"easeIn": @(RCTAnimationTypeEaseIn),
  @"easeOut": @(RCTAnimationTypeEaseOut),
  @"easeInEaseOut": @(RCTAnimationTypeEaseInEaseOut),
}), RCTAnimationTypeEaseInEaseOut, integerValue)

@end

static NSString *RCTGuessTypeEncoding(id target, NSString *key, id value, NSString *encoding)
{
  /**
   * NOTE: the property names below may seem weird, but it's
   * because they are tested as case-sensitive suffixes, so
   * "ffset" will match any of the following
   *
   * - offset
   * - contentOffset
   */

  // TODO (#5906496): handle more cases
  if ([key hasSuffix:@"olor"]) {
    if ([target isKindOfClass:[CALayer class]]) {
      return @(@encode(CGColorRef));
    } else {
      return @"@\"UIColor\"";
    }
  } else if ([key hasSuffix:@"Inset"] || [key hasSuffix:@"Insets"]) {
    return @(@encode(UIEdgeInsets));
  } else if ([key hasSuffix:@"rame"] || [key hasSuffix:@"ounds"]) {
    return @(@encode(CGRect));
  } else if ([key hasSuffix:@"ffset"] || [key hasSuffix:@"osition"]) {
    return @(@encode(CGPoint));
  } else if ([key hasSuffix:@"ize"]) {
    return @(@encode(CGSize));
  }
  return nil;
}

static id RCTConvertValueWithEncoding(id value, NSString *encoding)
{
  static NSDictionary *converters = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{

    id (^numberConvert)(id) = ^(id val){
      return [RCTConvert NSNumber:val];
    };

    id (^boolConvert)(id) = ^(id val){
      return @([RCTConvert BOOL:val]);
    };

    // TODO (#5906496): add the rest of RCTConvert here
    converters =
    @{
      @(@encode(char)): boolConvert,
      @(@encode(int)): numberConvert,
      @(@encode(short)): numberConvert,
      @(@encode(long)): numberConvert,
      @(@encode(long long)): numberConvert,
      @(@encode(unsigned char)): numberConvert,
      @(@encode(unsigned int)): numberConvert,
      @(@encode(unsigned short)): numberConvert,
      @(@encode(unsigned long)): numberConvert,
      @(@encode(unsigned long long)): numberConvert,
      @(@encode(float)): numberConvert,
      @(@encode(double)): numberConvert,
      @(@encode(bool)): boolConvert,
      @(@encode(UIEdgeInsets)): ^(id val) {
        return [NSValue valueWithUIEdgeInsets:[RCTConvert UIEdgeInsets:val]];
      },
      @(@encode(CGPoint)): ^(id val) {
        return [NSValue valueWithCGPoint:[RCTConvert CGPoint:val]];
      },
      @(@encode(CGSize)): ^(id val) {
        return [NSValue valueWithCGSize:[RCTConvert CGSize:val]];
      },
      @(@encode(CGRect)): ^(id val) {
        return [NSValue valueWithCGRect:[RCTConvert CGRect:val]];
      },
      @(@encode(CGColorRef)): ^(id val) {
        return (id)[RCTConvert CGColor:val];
      },
      @(@encode(CGAffineTransform)): ^(id val) {
        return [NSValue valueWithCGAffineTransform:[RCTConvert CGAffineTransform:val]];
      },
      @(@encode(CATransform3D)): ^(id val) {
        return [NSValue valueWithCATransform3D:[RCTConvert CATransform3D:val]];
      },
      @"@\"NSString\"": ^(id val) {
        return [RCTConvert NSString:val];
      },
      @"@\"NSURL\"": ^(id val) {
        return [RCTConvert NSURL:val];
      },
      @"@\"UIColor\"": ^(id val) {
        return [RCTConvert UIColor:val];
      },
      @"@\"UIImage\"": ^(id val) {
        return [RCTConvert UIImage:val];
      },
      @"@\"NSDate\"": ^(id val) {
        return [RCTConvert NSDate:val];
      },
      @"@\"NSTimeZone\"": ^(id val) {
        return [RCTConvert NSTimeZone:val];
      },
    };
  });

  // Handle null values
  if (value == [NSNull null] && ![encoding isEqualToString:@"@\"NSNull\""]) {
    return nil;
  }

  // Convert value
  id (^converter)(id) = converters[encoding];
  return converter ? converter(value) : value;
}

static NSString *RCTPropertyEncoding(id target, NSString *key, id value)
{
  // Check target class for property definition
  NSString *encoding = nil;
  objc_property_t property = class_getProperty([target class], [key UTF8String]);
  if (property) {

    // Get type info
    char *typeEncoding = property_copyAttributeValue(property, "T");
    encoding = @(typeEncoding);
    free(typeEncoding);

  } else {

    // Check if setter exists
    SEL setter = NSSelectorFromString([NSString stringWithFormat:@"set%@%@:",
                                       [[key substringToIndex:1] uppercaseString],
                                       [key substringFromIndex:1]]);

    if (![target respondsToSelector:setter]) {
      return nil;
    }

    // Get type of first method argument
    Method method = class_getInstanceMethod([target class], setter);
    char *typeEncoding = method_copyArgumentType(method, 2);
    if (typeEncoding) {
      encoding = @(typeEncoding);
      free(typeEncoding);
    }

    if (encoding.length == 0 || [encoding isEqualToString:@(@encode(id))]) {
      // Not enough info about the type encoding to be useful, so
      // try to guess the type from the value and property name
      encoding = RCTGuessTypeEncoding(target, key, value, encoding);
    }

  }

  // id encoding means unknown, as opposed to nil which means no setter exists.
  return encoding ?: @(@encode(id));
}

static id RCTConvertValueWithExplicitEncoding(id target, NSString *key, id json, NSString *encoding)
{
  // Special case for numeric encodings, which may be enums
  if ([json isKindOfClass:[NSString class]] &&
      ([encoding isEqualToString:@(@encode(id))] ||
       [@"iIsSlLqQ" rangeOfString:[encoding substringToIndex:1]].length)) {

    /**
     * NOTE: the property names below may seem weird, but it's
     * because they are tested as case-sensitive suffixes, so
     * "apitalizationType" will match any of the following
     *
     * - capitalizationType
     * - autocapitalizationType
     * - autoCapitalizationType
     * - titleCapitalizationType
     * - etc.
     */
    static NSDictionary *converters = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      converters =
      @{
        @"apitalizationType": ^(id val) {
          return [RCTConvert UITextAutocapitalizationType:val];
        },
        @"eyboardType": ^(id val) {
          return [RCTConvert UIKeyboardType:val];
        },
        @"extAlignment": ^(id val) {
          return [RCTConvert NSTextAlignment:val];
        },
        @"ritingDirection": ^(id val) {
          return [RCTConvert NSWritingDirection:val];
        },
        @"Cap": ^(id val) {
          return [RCTConvert CGLineCap:val];
        },
        @"Join": ^(id val) {
          return [RCTConvert CGLineJoin:val];
        },
        @"ointerEvents": ^(id val) {
          return [RCTConvert RCTPointerEvents:val];
        },
      };
    });
    for (NSString *subkey in converters) {
      if ([key hasSuffix:subkey]) {
        NSInteger (^converter)(NSString *) = converters[subkey];
        json = @(converter(json));
        break;
      }
    }
  }

  return RCTConvertValueWithEncoding(json, encoding);
}

id RCTConvertValue(id target, NSString *key, id json)
{
  NSString *encoding = RCTPropertyEncoding(target, key, json);
  return RCTConvertValueWithExplicitEncoding(target, key, json, encoding);
}

BOOL RCTSetProperty(id target, NSString *keypath, id value)
{
  // Split keypath
  NSArray *parts = [keypath componentsSeparatedByString:@"."];
  NSString *key = [parts lastObject];
  for (NSUInteger i = 0; i < parts.count - 1; i++) {
    target = [target valueForKey:parts[i]];
    if (!target) {
      return NO;
    }
  }

  // Get encoding
  NSString *encoding = RCTPropertyEncoding(target, key, value);
  if (!encoding) {
    return NO;
  }

  // Convert value
  value = RCTConvertValueWithExplicitEncoding(target, keypath, value, encoding);

  // Another nasty special case
  if ([target isKindOfClass:[UITextField class]]) {
    static NSDictionary *specialCases = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      specialCases = @{
        @"autocapitalizationType": ^(UITextField *f, NSInteger v){ f.autocapitalizationType = v; },
        @"autocorrectionType": ^(UITextField *f, NSInteger v){ f.autocorrectionType = v; },
        @"spellCheckingType": ^(UITextField *f, NSInteger v){ f.spellCheckingType = v; },
        @"keyboardType": ^(UITextField *f, NSInteger v){ f.keyboardType = v; },
        @"keyboardAppearance": ^(UITextField *f, NSInteger v){ f.keyboardAppearance = v; },
        @"returnKeyType": ^(UITextField *f, NSInteger v){ f.returnKeyType = v; },
        @"enablesReturnKeyAutomatically": ^(UITextField *f, NSInteger v){ f.enablesReturnKeyAutomatically = !!v; },
        @"secureTextEntry": ^(UITextField *f, NSInteger v){ f.secureTextEntry = !!v; }};
    });

    void (^block)(UITextField *f, NSInteger v) = specialCases[key];
    if (block) {
      block(target, [value integerValue]);
      return YES;
    }
  }

  // Set converted value
  [target setValue:value forKey:key];

  return YES;
}

BOOL RCTCopyProperty(id target, id source, NSString *keypath)
{
  // Split keypath
  NSArray *parts = [keypath componentsSeparatedByString:@"."];
  NSString *key = [parts lastObject];
  for (NSUInteger i = 0; i < parts.count - 1; i++) {
    source = [source valueForKey:parts[i]];
    target = [target valueForKey:parts[i]];
    if (!source || !target) {
      return NO;
    }
  }

  // Check class for property definition
  if (!class_getProperty([source class], [key UTF8String])) {
    // Check if setter exists
    SEL setter = NSSelectorFromString([NSString stringWithFormat:@"set%@%@:",
                                       [[key substringToIndex:1] uppercaseString],
                                       [key substringFromIndex:1]]);

    if (![source respondsToSelector:setter]
        || ![target respondsToSelector:setter]) {
      return NO;
    }
  }

  [target setValue:[source valueForKey:key] forKey:key];
  return YES;
}
