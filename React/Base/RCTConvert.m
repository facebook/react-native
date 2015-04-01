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

@implementation RCTConvert

RCT_CONVERTER(BOOL, BOOL, boolValue)
RCT_NUMBER_CONVERTER(double, doubleValue)
RCT_NUMBER_CONVERTER(float, floatValue)
RCT_NUMBER_CONVERTER(int, intValue)

RCT_NUMBER_CONVERTER(int64_t, longLongValue);
RCT_NUMBER_CONVERTER(uint64_t, unsignedLongLongValue);

RCT_NUMBER_CONVERTER(NSInteger, integerValue)
RCT_NUMBER_CONVERTER(NSUInteger, unsignedIntegerValue)

RCT_CUSTOM_CONVERTER(NSArray *, NSArray, [NSArray arrayWithArray:json])
RCT_CUSTOM_CONVERTER(NSDictionary *, NSDictionary, [NSDictionary dictionaryWithDictionary:json])
RCT_CONVERTER(NSString *, NSString, description)

+ (NSNumber *)NSNumber:(id)json
{
  if ([json isKindOfClass:[NSNumber class]]) {
    return json;
  } else if ([json isKindOfClass:[NSString class]]) {
    static NSNumberFormatter *formatter;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      formatter = [[NSNumberFormatter alloc] init];
      formatter.locale = [NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"];
    });
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

+ (NSDate *)NSDate:(id)json
{
  if ([json isKindOfClass:[NSNumber class]]) {
    return [NSDate dateWithTimeIntervalSince1970:[self NSTimeInterval:json]];
  } else if ([json isKindOfClass:[NSString class]]) {
    static NSDateFormatter *formatter;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      formatter = [[NSDateFormatter alloc] init];
      formatter.dateFormat = @"yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ";
      formatter.locale = [NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"];
      formatter.timeZone = [NSTimeZone timeZoneWithName:@"UTC"];
    });
    NSDate *date = [formatter dateFromString:json];
    if (!date) {
      RCTLogError(@"JSON String '%@' could not be interpreted as a date. Expected format: YYYY-MM-DD'T'HH:mm:ss.sssZ", json);
    }
    return date;
  } else if (json && json != [NSNull null]) {
    RCTLogError(@"JSON value '%@' of class %@ could not be interpreted as a date", json, [json class]);
  }
  return nil;
}

// JS Standard for time is milliseconds
RCT_CUSTOM_CONVERTER(NSTimeInterval, NSTimeInterval, [self double:json] / 1000.0)

// JS standard for time zones is minutes.
RCT_CUSTOM_CONVERTER(NSTimeZone *, NSTimeZone, [NSTimeZone timeZoneForSecondsFromGMT:[self double:json] * 60.0])

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

RCT_ENUM_CONVERTER(UITextFieldViewMode, (@{
  @"never": @(UITextFieldViewModeNever),
  @"while-editing": @(UITextFieldViewModeWhileEditing),
  @"unless-editing": @(UITextFieldViewModeUnlessEditing),
  @"always": @(UITextFieldViewModeAlways),
}), UITextFieldViewModeNever, integerValue)

RCT_ENUM_CONVERTER(UIScrollViewKeyboardDismissMode, (@{
  @"none": @(UIScrollViewKeyboardDismissModeNone),
  @"on-drag": @(UIScrollViewKeyboardDismissModeOnDrag),
  @"interactive": @(UIScrollViewKeyboardDismissModeInteractive),
}), UIScrollViewKeyboardDismissModeNone, integerValue)

RCT_ENUM_CONVERTER(UIKeyboardType, (@{
  @"default": @(UIKeyboardTypeDefault),
  @"ascii-capable": @(UIKeyboardTypeASCIICapable),
  @"numbers-and-punctuation": @(UIKeyboardTypeNumbersAndPunctuation),
  @"url": @(UIKeyboardTypeURL),
  @"number-pad": @(UIKeyboardTypeNumberPad),
  @"phone-pad": @(UIKeyboardTypePhonePad),
  @"name-phone-pad": @(UIKeyboardTypeNamePhonePad),
  @"email-address": @(UIKeyboardTypeEmailAddress),
  @"decimal-pad": @(UIKeyboardTypeDecimalPad),
  @"twitter": @(UIKeyboardTypeTwitter),
  @"web-search": @(UIKeyboardTypeWebSearch),
}), UIKeyboardTypeDefault, integerValue)

RCT_ENUM_CONVERTER(UIReturnKeyType, (@{
  @"default": @(UIReturnKeyDefault),
  @"go": @(UIReturnKeyGo),
  @"google": @(UIReturnKeyGoogle),
  @"join": @(UIReturnKeyJoin),
  @"next": @(UIReturnKeyNext),
  @"route": @(UIReturnKeyRoute),
  @"search": @(UIReturnKeySearch),
  @"send": @(UIReturnKeySend),
  @"yahoo": @(UIReturnKeyYahoo),
  @"done": @(UIReturnKeyDone),
  @"emergency-call": @(UIReturnKeyEmergencyCall),
}), UIReturnKeyDefault, integerValue)

RCT_ENUM_CONVERTER(UIViewContentMode, (@{
  @"scale-to-fill": @(UIViewContentModeScaleToFill),
  @"scale-aspect-fit": @(UIViewContentModeScaleAspectFit),
  @"scale-aspect-fill": @(UIViewContentModeScaleAspectFill),
  @"redraw": @(UIViewContentModeRedraw),
  @"center": @(UIViewContentModeCenter),
  @"top": @(UIViewContentModeTop),
  @"bottom": @(UIViewContentModeBottom),
  @"left": @(UIViewContentModeLeft),
  @"right": @(UIViewContentModeRight),
  @"top-left": @(UIViewContentModeTopLeft),
  @"top-right": @(UIViewContentModeTopRight),
  @"bottom-left": @(UIViewContentModeBottomLeft),
  @"bottom-right": @(UIViewContentModeBottomRight),
}), UIViewContentModeScaleToFill, integerValue)

RCT_ENUM_CONVERTER(UIBarStyle, (@{
  @"default": @(UIBarStyleDefault),
  @"black": @(UIBarStyleBlack),
}), UIBarStyleDefault, integerValue)

// TODO: normalise the use of w/width so we can do away with the alias values (#6566645)
/**
 * This macro is used for creating converter functions for structs that consist
 * of a number of CGFloat properties, such as CGPoint, CGRect, etc.
 */
#define RCT_CGSTRUCT_CONVERTER(type, values, _aliases)   \
+ (type)type:(id)json                                    \
{                                                        \
  @try {                                                 \
    static NSArray *fields;                              \
    static NSUInteger count;                             \
    static dispatch_once_t onceToken;                    \
    dispatch_once(&onceToken, ^{                         \
      fields = values;                                   \
      count = [fields count];                            \
    });                                                  \
    type result;                                         \
    if ([json isKindOfClass:[NSArray class]]) {          \
      if ([json count] != count) {                       \
        RCTLogError(@"Expected array with count %zd, but count is %zd: %@", count, [json count], json); \
      } else {                                           \
        for (NSUInteger i = 0; i < count; i++) {         \
          ((CGFloat *)&result)[i] = [self CGFloat:json[i]]; \
        }                                                \
      }                                                  \
    } else if ([json isKindOfClass:[NSDictionary class]]) { \
      NSDictionary *aliases = _aliases;                  \
      if (aliases.count) {                               \
        json = [json mutableCopy];                       \
        for (NSString *alias in aliases) {               \
          NSString *key = aliases[alias];                \
          NSNumber *number = json[key];                  \
          if (number) {                                  \
            ((NSMutableDictionary *)json)[key] = number; \
          }                                              \
        }                                                \
      }                                                  \
      for (NSUInteger i = 0; i < count; i++) {           \
        ((CGFloat *)&result)[i] = [self CGFloat:json[fields[i]]]; \
      }                                                  \
    } else if (json && json != [NSNull null]) {          \
      RCTLogError(@"Expected NSArray or NSDictionary for %s, received %@: %@", #type, [json class], json); \
    }                                                    \
    return result;                                       \
  }                                                      \
  @catch (__unused NSException *e) {                     \
    RCTLogError(@"JSON value '%@' cannot be converted to '%s'", json, #type); \
    type result; \
    return result; \
  } \
}

RCT_CUSTOM_CONVERTER(CGFloat, CGFloat, [self double:json])
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

RCT_CGSTRUCT_CONVERTER(CGAffineTransform, (@[
  @"a", @"b", @"c", @"d", @"tx", @"ty"
]), nil)

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
      if (colorString.length == 4) { // 3 digit hex
        sscanf([colorString UTF8String], "#%01tX%01tX%01tX", &red, &green, &blue);
        // expand to 6 digit hex
        red = red | (red << 4);
        green = green | (green << 4);
        blue = blue | (blue << 4);
      } else if (colorString.length == 7) { // normal 6 digit hex
        sscanf([colorString UTF8String], "#%02tX%02tX%02tX", &red, &green, &blue);
      } else {
        RCTLogError(@"Invalid hex color %@. Hex colors should be 3 or 6 digits long", colorString);
      }
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

    RCTLogError(@"Expected NSArray, NSDictionary or NSString for UIColor, \
                received %@: %@", [json class], json);
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
  if ([path hasPrefix:@"data:"]) {
    NSURL *url = [NSURL URLWithString:path];
    NSData *imageData = [NSData dataWithContentsOfURL:url];
    image = [UIImage imageWithData:imageData];
  } else if ([path isAbsolutePath]) {
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

#if !defined(__IPHONE_8_2) || __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_2

// These constants are defined in iPhone SDK 8.2, but the app cannot run on
// iOS < 8.2 unless we redefine them here. If you target iOS 8.2 or above
// as a base target, the standard constants will be used instead.

#define UIFontWeightUltraLight -0.8
#define UIFontWeightThin -0.6
#define UIFontWeightLight -0.4
#define UIFontWeightRegular 0
#define UIFontWeightMedium 0.23
#define UIFontWeightSemibold 0.3
#define UIFontWeightBold 0.4
#define UIFontWeightHeavy 0.56
#define UIFontWeightBlack 0.62

#endif

typedef CGFloat RCTFontWeight;
RCT_ENUM_CONVERTER(RCTFontWeight, (@{
  @"normal": @(UIFontWeightRegular),
  @"bold": @(UIFontWeightBold),
  @"100": @(UIFontWeightUltraLight),
  @"200": @(UIFontWeightThin),
  @"300": @(UIFontWeightLight),
  @"400": @(UIFontWeightRegular),
  @"500": @(UIFontWeightMedium),
  @"600": @(UIFontWeightSemibold),
  @"700": @(UIFontWeightBold),
  @"800": @(UIFontWeightHeavy),
  @"900": @(UIFontWeightBlack),
}), UIFontWeightRegular, doubleValue)

typedef BOOL RCTFontStyle;
RCT_ENUM_CONVERTER(RCTFontStyle, (@{
  @"normal": @NO,
  @"italic": @YES,
  @"oblique": @YES,
}), NO, boolValue)

static RCTFontWeight RCTWeightOfFont(UIFont *font)
{
  NSDictionary *traits = [font.fontDescriptor objectForKey:UIFontDescriptorTraitsAttribute];
  return [traits[UIFontWeightTrait] doubleValue];
}

static BOOL RCTFontIsItalic(UIFont *font)
{
  NSDictionary *traits = [font.fontDescriptor objectForKey:UIFontDescriptorTraitsAttribute];
  UIFontDescriptorSymbolicTraits symbolicTraits = [traits[UIFontSymbolicTrait] unsignedIntValue];
  return (symbolicTraits & UIFontDescriptorTraitItalic) != 0;
}

static BOOL RCTFontIsCondensed(UIFont *font)
{
  NSDictionary *traits = [font.fontDescriptor objectForKey:UIFontDescriptorTraitsAttribute];
  UIFontDescriptorSymbolicTraits symbolicTraits = [traits[UIFontSymbolicTrait] unsignedIntValue];
  return (symbolicTraits & UIFontDescriptorTraitCondensed) != 0;
}

+ (UIFont *)UIFont:(UIFont *)font withSize:(id)json
{
  return [self UIFont:font withFamily:nil size:json weight:nil style:nil];
}

+ (UIFont *)UIFont:(UIFont *)font withWeight:(id)json
{
  return [self UIFont:font withFamily:nil size:nil weight:json style:nil];
}

+ (UIFont *)UIFont:(UIFont *)font withStyle:(id)json
{
  return [self UIFont:font withFamily:nil size:nil weight:nil style:json];
}

+ (UIFont *)UIFont:(UIFont *)font withFamily:(id)json
{
  return [self UIFont:font withFamily:json size:nil weight:nil style:nil];
}

+ (UIFont *)UIFont:(UIFont *)font withFamily:(id)family
              size:(id)size weight:(id)weight style:(id)style
{
  // Defaults
  NSString *const RCTDefaultFontFamily = @"Helvetica Neue";
  const RCTFontWeight RCTDefaultFontWeight = UIFontWeightRegular;
  const CGFloat RCTDefaultFontSize = 14;

  // Get existing properties
  BOOL isItalic = NO;
  BOOL isCondensed = NO;
  RCTFontWeight fontWeight = RCTDefaultFontWeight;
  if (font) {
    family = font.familyName;
    fontWeight = RCTWeightOfFont(font);
    isItalic = RCTFontIsItalic(font);
    isCondensed = RCTFontIsCondensed(font);
  }

  // Get font weight
  if (weight) {
    fontWeight = [self RCTFontWeight:weight];
  }

  // Get font style
  if (style) {
    isItalic = [self RCTFontStyle:style];
  }

  // Get font size
  CGFloat fontSize = [self CGFloat:size] ?: RCTDefaultFontSize;

  // Get font family
  NSString *familyName = [self NSString:family] ?: RCTDefaultFontFamily;
  if ([UIFont fontNamesForFamilyName:familyName].count == 0) {
    font = [UIFont fontWithName:familyName size:fontSize];
    if (font) {
      // It's actually a font name, not a font family name,
      // but we'll do what was meant, not what was said.
      familyName = font.familyName;
      NSDictionary *traits = [font.fontDescriptor objectForKey:UIFontDescriptorTraitsAttribute];
      fontWeight = [traits[UIFontWeightTrait] doubleValue];
    } else {
      // Not a valid font or family
      RCTLogError(@"Unrecognized font family '%@'", familyName);
      familyName = RCTDefaultFontFamily;
    }
  }

  // Get closest match
  UIFont *bestMatch = font;
  CGFloat closestWeight = font ? RCTWeightOfFont(font) : INFINITY;
  for (NSString *name in [UIFont fontNamesForFamilyName:familyName]) {
    UIFont *match = [UIFont fontWithName:name size:fontSize];
    if (isItalic == RCTFontIsItalic(match) &&
        isCondensed == RCTFontIsCondensed(match)) {
      CGFloat testWeight = RCTWeightOfFont(match);
      if (ABS(testWeight - fontWeight) < ABS(closestWeight - fontWeight)) {
        bestMatch = match;
        closestWeight = testWeight;
      }
    }
  }

  // Safety net
  if (!bestMatch) {
    RCTLogError(@"Could not find font with family: '%@', size: %@, \
                weight: %@, style: %@", family, size, weight, style);
    bestMatch = [UIFont fontWithName:[[UIFont fontNamesForFamilyName:familyName] firstObject]
                                size:fontSize];
  }

  return bestMatch;
}

RCT_ARRAY_CONVERTER(NSString)
RCT_ARRAY_CONVERTER(NSDictionary)
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

BOOL RCTSetProperty(id target, NSString *keyPath, SEL type, id json)
{
  // Split keypath
  NSArray *parts = [keyPath componentsSeparatedByString:@"."];
  NSString *key = [parts lastObject];
  for (NSUInteger i = 0; i < parts.count - 1; i++) {
    target = [target valueForKey:parts[i]];
    if (!target) {
      return NO;
    }
  }

  // Get property setter
  SEL setter = NSSelectorFromString([NSString stringWithFormat:@"set%@%@:",
                                     [[key substringToIndex:1] uppercaseString],
                                     [key substringFromIndex:1]]);

  // Fail early
  if (![target respondsToSelector:setter]) {
    return NO;
  }

  @try {
    // Get converted value
    NSMethodSignature *signature = [RCTConvert methodSignatureForSelector:type];
    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:signature];
    [invocation setArgument:&type atIndex:1];
    [invocation setArgument:&json atIndex:2];
    [invocation invokeWithTarget:[RCTConvert class]];
    NSUInteger length = [signature methodReturnLength];
    void *value = malloc(length);
    [invocation getReturnValue:value];

    // Set converted value
    signature = [target methodSignatureForSelector:setter];
    invocation = [NSInvocation invocationWithMethodSignature:signature];
    [invocation setArgument:&setter atIndex:1];
    [invocation setArgument:value atIndex:2];
    [invocation invokeWithTarget:target];
    free(value);

    return YES;
  }
  @catch (NSException *exception) {
    RCTLogError(@"Exception thrown while attempting to set property '%@' of \
                '%@' with value '%@': %@", key, [target class], json, exception);
    return NO;
  }
}

BOOL RCTCopyProperty(id target, id source, NSString *keyPath)
{
  // Split keypath
  NSArray *parts = [keyPath componentsSeparatedByString:@"."];
  NSString *key = [parts lastObject];
  for (NSUInteger i = 0; i < parts.count - 1; i++) {
    source = [source valueForKey:parts[i]];
    target = [target valueForKey:parts[i]];
    if (!source || !target) {
      return NO;
    }
  }

  // Get property getter
  SEL getter = NSSelectorFromString(key);

  // Get property setter
  SEL setter = NSSelectorFromString([NSString stringWithFormat:@"set%@%@:",
                                     [[key substringToIndex:1] uppercaseString],
                                     [key substringFromIndex:1]]);

  // Fail early
  if (![source respondsToSelector:getter] || ![target respondsToSelector:setter]) {
    return NO;
  }

  // Get value
  NSMethodSignature *signature = [source methodSignatureForSelector:getter];
  NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:signature];
  [invocation setArgument:&getter atIndex:1];
  [invocation invokeWithTarget:source];
  NSUInteger length = [signature methodReturnLength];
  void *value = malloc(length);
  [invocation getReturnValue:value];

  // Set value
  signature = [target methodSignatureForSelector:setter];
  invocation = [NSInvocation invocationWithMethodSignature:signature];
  [invocation setArgument:&setter atIndex:1];
  [invocation setArgument:value atIndex:2];
  [invocation invokeWithTarget:target];
  free(value);

  return YES;
}
