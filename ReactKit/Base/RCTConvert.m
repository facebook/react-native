// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTConvert.h"

#import <objc/message.h>

#import <ImageIO/ImageIO.h>
#import <MobileCoreServices/MobileCoreServices.h>

#import "RCTLog.h"

CGFloat const RCTDefaultFontSize = 14;
NSString *const RCTDefaultFontName = @"HelveticaNeue";
NSString *const RCTDefaultFontWeight = @"normal";
NSString *const RCTBoldFontWeight = @"bold";

#define RCT_CONVERTER_CUSTOM(type, name, code) \
+ (type)name:(id)json                          \
{                                              \
  @try {                                       \
    return code;                               \
  }                                            \
  @catch (__unused NSException *e) {           \
    RCTLogError(@"JSON value '%@' of type '%@' cannot be converted to '%s'", \
    json, [json class], #type); \
    json = nil; \
    return code; \
  } \
}

#define RCT_CONVERTER(type, name, getter) \
RCT_CONVERTER_CUSTOM(type, name, [json getter])

#define RCT_ENUM_CONVERTER(type, values, default, getter) \
+ (type)type:(id)json                                     \
{                                                         \
  static NSDictionary *mapping;                           \
  static dispatch_once_t onceToken;                       \
  dispatch_once(&onceToken, ^{                            \
    mapping = values;                                     \
  });                                                     \
  if (!json) {                                            \
    return default;                                       \
  }                                                       \
  if ([json isKindOfClass:[NSNumber class]]) {            \
    if ([[mapping allValues] containsObject:json] || [json getter] == default) { \
      return [json getter];                               \
    }                                                     \
    RCTLogError(@"Invalid %s '%@'. should be one of: %@", #type, json, [mapping allValues]); \
    return default;                                       \
  }                                                       \
  if (![json isKindOfClass:[NSString class]]) {           \
    RCTLogError(@"Expected NSNumber or NSString for %s, received %@: %@", #type, [json class], json); \
  }                                                       \
  id value = mapping[json];                               \
  if(!value && [json description].length > 0) {           \
    RCTLogError(@"Invalid %s '%@'. should be one of: %@", #type, json, [mapping allKeys]); \
  }                                                       \
  return value ? [value getter] : default;                \
}

#define RCT_STRUCT_CONVERTER(type, values)               \
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
          ((CGFloat *)&result)[i] = [json[i] doubleValue]; \
        }                                                \
      }                                                  \
    } else if ([json isKindOfClass:[NSDictionary class]]) { \
      for (NSUInteger i = 0; i < count; i++) {           \
        ((CGFloat *)&result)[i] = [json[fields[i]] doubleValue]; \
      }                                                  \
    } else if (json) {                                   \
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

@implementation RCTConvert

RCT_CONVERTER(BOOL, BOOL, boolValue)
RCT_CONVERTER(double, double, doubleValue)
RCT_CONVERTER(float, float, floatValue)
RCT_CONVERTER(int, int, intValue)

RCT_CONVERTER(NSString *, NSString, description)
RCT_CONVERTER_CUSTOM(NSNumber *, NSNumber, @([json doubleValue]))
RCT_CONVERTER(NSInteger, NSInteger, integerValue)
RCT_CONVERTER_CUSTOM(NSUInteger, NSUInteger, [json unsignedIntegerValue])

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
    return [NSURL URLWithString:path relativeToURL:[[NSBundle mainBundle] resourceURL]];
  }
  return nil;
}

+ (NSURLRequest *)NSURLRequest:(id)json
{
  return [NSURLRequest requestWithURL:[self NSURL:json]];
}

// JS Standard for time is milliseconds
RCT_CONVERTER_CUSTOM(NSDate *, NSDate, [NSDate dateWithTimeIntervalSince1970:[json doubleValue] / 1000.0])
RCT_CONVERTER_CUSTOM(NSTimeInterval, NSTimeInterval, [json doubleValue] / 1000.0)

// JS standard for time zones is minutes.
RCT_CONVERTER_CUSTOM(NSTimeZone *, NSTimeZone, [NSTimeZone timeZoneForSecondsFromGMT:[json doubleValue] * 60.0])

/**
 * NOTE: We don't deliberately don't support NSTextAlignmentJustified in the
 * X-platform RCTText implementation because it isn't available on Android.
 * We may wish to support this for iOS-specific controls such as UILabel.
 */
RCT_ENUM_CONVERTER(NSTextAlignment, (@{
  @"auto": @(NSTextAlignmentNatural),
  @"left": @(NSTextAlignmentLeft),
  @"center": @(NSTextAlignmentCenter),
  @"right": @(NSTextAlignmentRight),
  /* @"justify": @(NSTextAlignmentJustify), */
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
  @"all": @(UITextAutocapitalizationTypeAllCharacters)
}), UITextAutocapitalizationTypeSentences, integerValue)

RCT_ENUM_CONVERTER(UIKeyboardType, (@{
  @"numeric": @(UIKeyboardTypeDecimalPad),
  @"default": @(UIKeyboardTypeDefault),
}), UIKeyboardTypeDefault, integerValue)

RCT_CONVERTER(CGFloat, CGFloat, doubleValue)
RCT_STRUCT_CONVERTER(CGPoint, (@[@"x", @"y"]))
RCT_STRUCT_CONVERTER(CGSize, (@[@"w", @"h"]))
RCT_STRUCT_CONVERTER(CGRect, (@[@"x", @"y", @"w", @"h"]))
RCT_STRUCT_CONVERTER(UIEdgeInsets, (@[@"top", @"left", @"bottom", @"right"]))

RCT_STRUCT_CONVERTER(CATransform3D, (@[
  @"m11", @"m12", @"m13", @"m14",
  @"m21", @"m22", @"m23", @"m24",
  @"m31", @"m32", @"m33", @"m34",
  @"m41", @"m42", @"m43", @"m44"
]))

RCT_STRUCT_CONVERTER(CGAffineTransform, (@[@"a", @"b", @"c", @"d", @"tx", @"ty"]))

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
      color = [UIColor colorWithRed:[json[0] doubleValue]
                              green:[json[1] doubleValue]
                               blue:[json[2] doubleValue]
                              alpha:[json count] > 3 ? [json[3] doubleValue] : 1];
    }

  } else if ([json isKindOfClass:[NSDictionary class]]) {

    // Color dictionary
    color = [UIColor colorWithRed:[json[@"r"] doubleValue]
                            green:[json[@"g"] doubleValue]
                             blue:[json[@"b"] doubleValue]
                            alpha:[json[@"a"] ?: @1 doubleValue]];

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

+ (CAKeyframeAnimation *)GIF:(id)json
{
  CGImageSourceRef imageSource = NULL;
  if ([json isKindOfClass:[NSString class]]) {
    NSString *path = json;
    if (path.length == 0) {
      return nil;
    }

    NSURL *fileURL = [path isAbsolutePath] ? [NSURL fileURLWithPath:path] : [[NSBundle mainBundle] URLForResource:path withExtension:nil];
    imageSource = CGImageSourceCreateWithURL((CFURLRef)fileURL, NULL);
  } else if ([json isKindOfClass:[NSData class]]) {
    NSData *data = json;
    if (data.length == 0) {
      return nil;
    }

    imageSource = CGImageSourceCreateWithData((CFDataRef)data, NULL);
  } else {
      RCTLogMustFix(@"Expected NSString or NSData for GIF, received %@: %@", [json class], json);
      return nil;
  }

  if (!UTTypeConformsTo(CGImageSourceGetType(imageSource), kUTTypeGIF)) {
    CFRelease(imageSource);
    return nil;
  }

  NSDictionary *properties = (__bridge_transfer NSDictionary *)CGImageSourceCopyProperties(imageSource, NULL);
  NSUInteger loopCount = [properties[(id)kCGImagePropertyGIFDictionary][(id)kCGImagePropertyGIFLoopCount] unsignedIntegerValue];

  size_t imageCount = CGImageSourceGetCount(imageSource);
  NSTimeInterval duration = 0;
  NSMutableArray *delays = [NSMutableArray arrayWithCapacity:imageCount];
  NSMutableArray *images = [NSMutableArray arrayWithCapacity:imageCount];
  for (size_t i = 0; i < imageCount; i++) {
    CGImageRef image = CGImageSourceCreateImageAtIndex(imageSource, i, NULL);
    NSDictionary *frameProperties = (__bridge_transfer NSDictionary *)CGImageSourceCopyPropertiesAtIndex(imageSource, i, NULL);
    NSDictionary *frameGIFProperties = frameProperties[(id)kCGImagePropertyGIFDictionary];

    const NSTimeInterval kDelayTimeIntervalDefault = 0.1;
    NSNumber *delayTime = frameGIFProperties[(id)kCGImagePropertyGIFUnclampedDelayTime] ?: frameGIFProperties[(id)kCGImagePropertyGIFDelayTime];
    if (delayTime == nil) {
      if (i == 0) {
        delayTime = @(kDelayTimeIntervalDefault);
      } else {
        delayTime = delays[i - 1];
      }
    }

    const NSTimeInterval kDelayTimeIntervalMinimum = 0.02;
    if (delayTime.floatValue < (float)kDelayTimeIntervalMinimum - FLT_EPSILON) {
      delayTime = @(kDelayTimeIntervalDefault);
    }

    duration += delayTime.doubleValue;
    delays[i] = delayTime;
    images[i] = (__bridge_transfer id)image;
  }

  CFRelease(imageSource);

  NSMutableArray *keyTimes = [NSMutableArray arrayWithCapacity:delays.count];
  NSTimeInterval runningDuration = 0;
  for (NSNumber *delayNumber in delays) {
    [keyTimes addObject:@(runningDuration / duration)];
    runningDuration += delayNumber.doubleValue;
  }

  [keyTimes addObject:@1.0];

  CAKeyframeAnimation *animation = [CAKeyframeAnimation animationWithKeyPath:@"contents"];
  animation.calculationMode = kCAAnimationDiscrete;
  animation.repeatCount = loopCount == 0 ? HUGE_VALF : loopCount;
  animation.keyTimes = keyTimes;
  animation.values = images;
  animation.duration = duration;
  return animation;
}

+ (UIImage *)UIImage:(id)json
{
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
  if (!image) {
    RCTLogWarn(@"No image was found at path %@", json);
  }
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
  // Create descriptor
  UIFontDescriptor *fontDescriptor = font.fontDescriptor ?: [UIFontDescriptor fontDescriptorWithName:RCTDefaultFontName size:RCTDefaultFontSize];

  // Get font size
  CGFloat fontSize = [self CGFloat:size];
  if (fontSize && !isnan(fontSize)) {
    fontDescriptor = [fontDescriptor fontDescriptorWithSize:fontSize];
  }

  // Get font family
  NSString *familyName = [RCTConvert NSString:family];
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
      }
    } else {
      // Set font family
      fontDescriptor = [fontDescriptor fontDescriptorWithFamily:familyName];
    }
  }

  // Get font weight
  NSString *fontWeight = [RCTConvert NSString:weight];
  if (fontWeight) {

    static NSSet *values;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      values = [NSSet setWithObjects:@"bold", @"normal", nil];
    });

    if (fontWeight && ![values containsObject:fontWeight]) {
      RCTLogError(@"Unrecognized font weight '%@', must be one of %@", fontWeight, values);
    }

    UIFontDescriptorSymbolicTraits symbolicTraits = fontDescriptor.symbolicTraits;
    if ([fontWeight isEqualToString:RCTBoldFontWeight]) {
      symbolicTraits |= UIFontDescriptorTraitBold;
    } else {
      symbolicTraits &= ~UIFontDescriptorTraitBold;
    }
    fontDescriptor = [fontDescriptor fontDescriptorWithSymbolicTraits:symbolicTraits];
  }

  // TODO: font style

  // Create font
  return [UIFont fontWithDescriptor:fontDescriptor size:fontDescriptor.pointSize];
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
  @"boxonly": @(RCTPointerEventsBoxOnly),
  @"boxnone": @(RCTPointerEventsBoxNone)
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
  // TODO (#5906496): handle more cases
  if ([key rangeOfString:@"color" options:NSCaseInsensitiveSearch].location != NSNotFound) {
    if ([target isKindOfClass:[CALayer class]]) {
      return @(@encode(CGColorRef));
    } else {
      return @"@\"UIColor\"";
    }
  }

  return nil;
}

static NSDictionary *RCTConvertValue(id value, NSString *encoding)
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
      return NO;
    }

    // Get type of first method argument
    Method method = class_getInstanceMethod([target class], setter);
    char *typeEncoding = method_copyArgumentType(method, 2);
    if (typeEncoding) {
      encoding = @(typeEncoding);
      free(typeEncoding);
    }
  }

  if (encoding.length == 0 || [encoding isEqualToString:@(@encode(id))]) {
    // Not enough info about the type encoding to be useful, so
    // try to guess the type from the value and property name
    encoding = RCTGuessTypeEncoding(target, key, value, encoding);
  }

  // Special case for numeric encodings, which may be enums
  if ([value isKindOfClass:[NSString class]] &&
      [@"iIsSlLqQ" rangeOfString:[encoding substringToIndex:1]].length) {

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
        @"ointerEvents": ^(id val) {
          return [RCTConvert RCTPointerEvents:val];
        },
      };
    });
    for (NSString *subkey in converters) {
      if ([key hasSuffix:subkey]) {
        NSInteger (^converter)(NSString *) = converters[subkey];
        value = @(converter(value));
        break;
      }
    }
  }

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
    if (block)
    {
      block(target, [value integerValue]);
      return YES;
    }
  }

  // Set converted value
  [target setValue:RCTConvertValue(value, encoding) forKey:key];
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
