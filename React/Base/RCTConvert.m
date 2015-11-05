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

#import "RCTDefines.h"
#import "RCTUtils.h"

@implementation RCTConvert

RCT_CONVERTER(id, id, self)

RCT_CONVERTER(BOOL, BOOL, boolValue)
RCT_NUMBER_CONVERTER(double, doubleValue)
RCT_NUMBER_CONVERTER(float, floatValue)
RCT_NUMBER_CONVERTER(int, intValue)

RCT_NUMBER_CONVERTER(int64_t, longLongValue);
RCT_NUMBER_CONVERTER(uint64_t, unsignedLongLongValue);

RCT_NUMBER_CONVERTER(NSInteger, integerValue)
RCT_NUMBER_CONVERTER(NSUInteger, unsignedIntegerValue)

/**
 * This macro is used for creating converter functions for directly
 * representable json values that require no conversion.
 */
#if RCT_DEBUG
#define RCT_JSON_CONVERTER(type)           \
+ (type *)type:(id)json                    \
{                                          \
  if ([json isKindOfClass:[type class]]) { \
    return json;                           \
  } else if (json) {                       \
    RCTLogConvertError(json, @#type);      \
  }                                        \
  return nil;                              \
}
#else
#define RCT_JSON_CONVERTER(type)           \
+ (type *)type:(id)json { return json; }
#endif

RCT_JSON_CONVERTER(NSArray)
RCT_JSON_CONVERTER(NSDictionary)
RCT_JSON_CONVERTER(NSString)
RCT_JSON_CONVERTER(NSNumber)

RCT_CUSTOM_CONVERTER(NSSet *, NSSet, [NSSet setWithArray:json])
RCT_CUSTOM_CONVERTER(NSData *, NSData, [json dataUsingEncoding:NSUTF8StringEncoding])

+ (NSIndexSet *)NSIndexSet:(id)json
{
  json = [self NSNumberArray:json];
  NSMutableIndexSet *indexSet = [NSMutableIndexSet new];
  for (NSNumber *number in json) {
    NSInteger index = number.integerValue;
    if (RCT_DEBUG && index < 0) {
      RCTLogError(@"Invalid index value %zd. Indices must be positive.", index);
    }
    [indexSet addIndex:index];
  }
  return indexSet;
}

+ (NSURL *)NSURL:(id)json
{
  NSString *path = [self NSString:json];
  if (!path) {
    return nil;
  }

  @try { // NSURL has a history of crashing with bad input, so let's be safe

    NSURL *URL = [NSURL URLWithString:path];
    if (URL.scheme) { // Was a well-formed absolute URL
      return URL;
    }

    // Check if it has a scheme
    if ([path rangeOfString:@":"].location != NSNotFound) {
      path = [path stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
      URL = [NSURL URLWithString:path];
      if (URL) {
        return URL;
      }
    }

    // Assume that it's a local path
    path = path.stringByRemovingPercentEncoding;
    if ([path hasPrefix:@"~"]) {
      // Path is inside user directory
      path = path.stringByExpandingTildeInPath;
    } else if (!path.absolutePath) {
      // Assume it's a resource path
      path = [[NSBundle mainBundle].resourcePath stringByAppendingPathComponent:path];
    }
    if (!(URL = [NSURL fileURLWithPath:path])) {
      RCTLogConvertError(json, @"a valid URL");
    }
    return URL;
  }
  @catch (__unused NSException *e) {
    RCTLogConvertError(json, @"a valid URL");
    return nil;
  }
}

+ (NSURLRequest *)NSURLRequest:(id)json
{
  NSURL *URL = [self NSURL:json];
  return URL ? [NSURLRequest requestWithURL:URL] : nil;
}

+ (RCTFileURL *)RCTFileURL:(id)json
{
  NSURL *fileURL = [self NSURL:json];
  if (!fileURL.fileURL) {
    RCTLogError(@"URI must be a local file, '%@' isn't.", fileURL);
    return nil;
  }
  if (![[NSFileManager defaultManager] fileExistsAtPath:fileURL.path]) {
    RCTLogError(@"File '%@' could not be found.", fileURL);
    return nil;
  }
  return fileURL;
}

+ (NSDate *)NSDate:(id)json
{
  if ([json isKindOfClass:[NSNumber class]]) {
    return [NSDate dateWithTimeIntervalSince1970:[self NSTimeInterval:json]];
  } else if ([json isKindOfClass:[NSString class]]) {
    static NSDateFormatter *formatter;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      formatter = [NSDateFormatter new];
      formatter.dateFormat = @"yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ";
      formatter.locale = [NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"];
      formatter.timeZone = [NSTimeZone timeZoneWithName:@"UTC"];
    });
    NSDate *date = [formatter dateFromString:json];
    if (!date) {
      RCTLogError(@"JSON String '%@' could not be interpreted as a date. "
                  "Expected format: YYYY-MM-DD'T'HH:mm:ss.sssZ", json);
    }
    return date;
  } else if (json) {
    RCTLogConvertError(json, @"a date");
  }
  return nil;
}

// JS Standard for time is milliseconds
RCT_CUSTOM_CONVERTER(NSTimeInterval, NSTimeInterval, [self double:json] / 1000.0)

// JS standard for time zones is minutes.
RCT_CUSTOM_CONVERTER(NSTimeZone *, NSTimeZone, [NSTimeZone timeZoneForSecondsFromGMT:[self double:json] * 60.0])

NSNumber *RCTConvertEnumValue(const char *typeName, NSDictionary *mapping, NSNumber *defaultValue, id json)
{
  if (!json) {
    return defaultValue;
  }
  if ([json isKindOfClass:[NSNumber class]]) {
    NSArray *allValues = mapping.allValues;
    if ([mapping.allValues containsObject:json] || [json isEqual:defaultValue]) {
      return json;
    }
    RCTLogError(@"Invalid %s '%@'. should be one of: %@", typeName, json, allValues);
    return defaultValue;
  }
  if (RCT_DEBUG && ![json isKindOfClass:[NSString class]]) {
    RCTLogError(@"Expected NSNumber or NSString for %s, received %@: %@",
                typeName, [json classForCoder], json);
  }
  id value = mapping[json];
  if (RCT_DEBUG && !value && [json description].length > 0) {
    RCTLogError(@"Invalid %s '%@'. should be one of: %@", typeName, json, [[mapping allKeys] sortedArrayUsingSelector: @selector(caseInsensitiveCompare:)]);
  }
  return value ?: defaultValue;
}

NSNumber *RCTConvertMultiEnumValue(const char *typeName, NSDictionary *mapping, NSNumber *defaultValue, id json)
{
  if ([json isKindOfClass:[NSArray class]]) {
    if ([json count] == 0) {
      return defaultValue;
    }
    long long result = 0;
    for (id arrayElement in json) {
      NSNumber *value = RCTConvertEnumValue(typeName, mapping, defaultValue, arrayElement);
      result |= value.longLongValue;
    }
    return @(result);
  }
  return RCTConvertEnumValue(typeName, mapping, defaultValue, json);
}

RCT_ENUM_CONVERTER(NSLineBreakMode, (@{
  @"wordWrapping": @(NSLineBreakByWordWrapping),
  @"charWrapping": @(NSLineBreakByCharWrapping),
  @"clipping": @(NSLineBreakByClipping),
  @"truncatingHead": @(NSLineBreakByTruncatingHead),
  @"truncatingTail": @(NSLineBreakByTruncatingTail),
  @"truncatingMiddle": @(NSLineBreakByTruncatingMiddle),
}), NSLineBreakByWordWrapping, integerValue)

RCT_ENUM_CONVERTER(NSTextAlignment, (@{
  @"auto": @(NSTextAlignmentNatural),
  @"left": @(NSTextAlignmentLeft),
  @"center": @(NSTextAlignmentCenter),
  @"right": @(NSTextAlignmentRight),
  @"justify": @(NSTextAlignmentJustified),
}), NSTextAlignmentNatural, integerValue)

RCT_ENUM_CONVERTER(NSUnderlineStyle, (@{
  @"solid": @(NSUnderlineStyleSingle),
  @"double": @(NSUnderlineStyleDouble),
  @"dotted": @(NSUnderlinePatternDot | NSUnderlineStyleSingle),
  @"dashed": @(NSUnderlinePatternDash | NSUnderlineStyleSingle),
}), NSUnderlineStyleSingle, integerValue)

RCT_ENUM_CONVERTER(RCTTextDecorationLineType, (@{
  @"none": @(RCTTextDecorationLineTypeNone),
  @"underline": @(RCTTextDecorationLineTypeUnderline),
  @"line-through": @(RCTTextDecorationLineTypeStrikethrough),
  @"underline line-through": @(RCTTextDecorationLineTypeUnderlineStrikethrough),
}), RCTTextDecorationLineTypeNone, integerValue)

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
  // Added for Android compatibility
  @"numeric": @(UIKeyboardTypeDecimalPad),
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
  // Cross-platform values
  @"cover": @(UIViewContentModeScaleAspectFill),
  @"contain": @(UIViewContentModeScaleAspectFit),
  @"stretch": @(UIViewContentModeScaleToFill),
}), UIViewContentModeScaleAspectFill, integerValue)

RCT_ENUM_CONVERTER(UIBarStyle, (@{
  @"default": @(UIBarStyleDefault),
  @"black": @(UIBarStyleBlack),
}), UIBarStyleDefault, integerValue)

// TODO: normalise the use of w/width so we can do away with the alias values (#6566645)
static void RCTConvertCGStructValue(const char *type, NSArray *fields, NSDictionary *aliases, CGFloat *result, id json)
{
  NSUInteger count = fields.count;
  if ([json isKindOfClass:[NSArray class]]) {
    if (RCT_DEBUG && [json count] != count) {
      RCTLogError(@"Expected array with count %zd, but count is %zd: %@", count, [json count], json);
    } else {
      for (NSUInteger i = 0; i < count; i++) {
        result[i] = [RCTConvert CGFloat:json[i]];
      }
    }
  } else if ([json isKindOfClass:[NSDictionary class]]) {
    if (aliases.count) {
      json = [json mutableCopy];
      for (NSString *alias in aliases) {
        NSString *key = aliases[alias];
        NSNumber *number = json[alias];
        if (number != nil) {
          RCTLogWarn(@"Using deprecated '%@' property for '%s'. Use '%@' instead.", alias, type, key);
          ((NSMutableDictionary *)json)[key] = number;
        }
      }
    }
    for (NSUInteger i = 0; i < count; i++) {
      result[i] = [RCTConvert CGFloat:json[fields[i]]];
    }
  } else if (json) {
    RCTLogConvertError(json, @(type));
  }
}

/**
 * This macro is used for creating converter functions for structs that consist
 * of a number of CGFloat properties, such as CGPoint, CGRect, etc.
 */
#define RCT_CGSTRUCT_CONVERTER(type, values, aliases) \
+ (type)type:(id)json                                 \
{                                                     \
  static NSArray *fields;                             \
  static dispatch_once_t onceToken;                   \
  dispatch_once(&onceToken, ^{                        \
    fields = values;                                  \
  });                                                 \
  type result;                                        \
  RCTConvertCGStructValue(#type, fields, aliases, (CGFloat *)&result, json); \
  return result;                                      \
}

RCT_CUSTOM_CONVERTER(CGFloat, CGFloat, [self double:json])
RCT_CGSTRUCT_CONVERTER(CGPoint, (@[@"x", @"y"]), (@{@"l": @"x", @"t": @"y"}))
RCT_CGSTRUCT_CONVERTER(CGSize, (@[@"width", @"height"]), (@{@"w": @"width", @"h": @"height"}))
RCT_CGSTRUCT_CONVERTER(CGRect, (@[@"x", @"y", @"width", @"height"]), (@{@"l": @"x", @"t": @"y", @"w": @"width", @"h": @"height"}))
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
  if ([json isKindOfClass:[NSArray class]]) {
    NSArray *components = [self NSNumberArray:json];
    CGFloat alpha = components.count > 3 ? [self CGFloat:components[3]] : 1.0;
    return [UIColor colorWithRed:[self CGFloat:components[0]]
                           green:[self CGFloat:components[1]]
                            blue:[self CGFloat:components[2]]
                           alpha:alpha];
  } else {
    NSUInteger argb = [self NSUInteger:json];
    CGFloat a = ((argb >> 24) & 0xFF) / 255.0;
    CGFloat r = ((argb >> 16) & 0xFF) / 255.0;
    CGFloat g = ((argb >> 8) & 0xFF) / 255.0;
    CGFloat b = (argb & 0xFF) / 255.0;
    return [UIColor colorWithRed:r green:g blue:b alpha:a];
  }
}

+ (CGColorRef)CGColor:(id)json
{
  return [self UIColor:json].CGColor;
}

/* This method is only used when loading images synchronously, e.g. for tabbar icons */
+ (UIImage *)UIImage:(id)json
{
  // TODO: we might as well cache the result of these checks (and possibly the
  // image itself) so as to reduce overhead on subsequent checks of the same input

  if (!json) {
    return nil;
  }

  UIImage *image;
  NSString *path;
  CGFloat scale = 0.0;
  BOOL isPackagerAsset = NO;
  if ([json isKindOfClass:[NSString class]]) {
    path = json;
  } else if ([json isKindOfClass:[NSDictionary class]]) {
    if (!(path = [self NSString:json[@"uri"]])) {
      return nil;
    }
    scale = [self CGFloat:json[@"scale"]];
    isPackagerAsset = [self BOOL:json[@"__packager_asset"]];
  } else {
    RCTLogConvertError(json, @"an image");
    return nil;
  }

  NSURL *URL = [self NSURL:path];
  NSString *scheme = URL.scheme.lowercaseString;
  if ([scheme isEqualToString:@"file"]) {
    if (RCTIsXCAssetURL(URL)) {
      // Image may reside inside a .car file, in which case we have no choice
      // but to use +[UIImage imageNamed] - but this method isn't thread safe
      RCTAssertMainThread();
      NSString *assetName = RCTBundlePathForURL(URL);
      image = [UIImage imageNamed:assetName];
    } else {
      // Attempt to load from the file system
      NSString *filePath = URL.path;
      if (filePath.pathExtension.length == 0) {
        filePath = [filePath stringByAppendingPathExtension:@"png"];
      }
      image = [UIImage imageWithContentsOfFile:filePath];
    }
  } else if ([scheme isEqualToString:@"data"]) {
    image = [UIImage imageWithData:[NSData dataWithContentsOfURL:URL]];
  } else if ([scheme isEqualToString:@"http"] && isPackagerAsset) {
    image = [UIImage imageWithData:[NSData dataWithContentsOfURL:URL]];
  } else {
    RCTLogConvertError(json, @"an image. Only local files or data URIs are supported");
  }

  if (scale > 0) {
    image = [UIImage imageWithCGImage:image.CGImage
                                scale:scale
                          orientation:image.imageOrientation];
  }
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

+ (UIFont *)UIFont:(id)json
{
  json = [self NSDictionary:json];
  return [self UIFont:nil
           withFamily:json[@"fontFamily"]
                 size:json[@"fontSize"]
               weight:json[@"fontWeight"]
                style:json[@"fontStyle"]
          scaleMultiplier:1.0f];
}

+ (UIFont *)UIFont:(UIFont *)font withSize:(id)json
{
  return [self UIFont:font withFamily:nil size:json weight:nil style:nil scaleMultiplier:1.0];
}

+ (UIFont *)UIFont:(UIFont *)font withWeight:(id)json
{
  return [self UIFont:font withFamily:nil size:nil weight:json style:nil scaleMultiplier:1.0];
}

+ (UIFont *)UIFont:(UIFont *)font withStyle:(id)json
{
  return [self UIFont:font withFamily:nil size:nil weight:nil style:json scaleMultiplier:1.0];
}

+ (UIFont *)UIFont:(UIFont *)font withFamily:(id)json
{
  return [self UIFont:font withFamily:json size:nil weight:nil style:nil scaleMultiplier:1.0];
}

+ (UIFont *)UIFont:(UIFont *)font withFamily:(id)family
              size:(id)size weight:(id)weight style:(id)style
   scaleMultiplier:(CGFloat)scaleMultiplier
{
  // Defaults
  NSString *const RCTDefaultFontFamily = @"System";
  NSString *const RCTIOS8SystemFontFamily = @"Helvetica Neue";
  const RCTFontWeight RCTDefaultFontWeight = UIFontWeightRegular;
  const CGFloat RCTDefaultFontSize = 14;

  // Initialize properties to defaults
  CGFloat fontSize = RCTDefaultFontSize;
  RCTFontWeight fontWeight = RCTDefaultFontWeight;
  NSString *familyName = RCTDefaultFontFamily;
  BOOL isItalic = NO;
  BOOL isCondensed = NO;

  if (font) {
    familyName = font.familyName ?: RCTDefaultFontFamily;
    fontSize = font.pointSize ?: RCTDefaultFontSize;
    fontWeight = RCTWeightOfFont(font);
    isItalic = RCTFontIsItalic(font);
    isCondensed = RCTFontIsCondensed(font);
  }

  // Get font attributes
  fontSize = [self CGFloat:size] ?: fontSize;
  if (scaleMultiplier > 0.0 && scaleMultiplier != 1.0) {
    fontSize = round(fontSize * scaleMultiplier);
  }
  familyName = [self NSString:family] ?: familyName;
  isItalic = style ? [self RCTFontStyle:style] : isItalic;
  fontWeight = weight ? [self RCTFontWeight:weight] : fontWeight;

  // Handle system font as special case. This ensures that we preserve
  // the specific metrics of the standard system font as closely as possible.
  if ([familyName isEqual:RCTDefaultFontFamily]) {
    if ([UIFont respondsToSelector:@selector(systemFontOfSize:weight:)]) {
      font = [UIFont systemFontOfSize:fontSize weight:fontWeight];
      if (isItalic || isCondensed) {
        UIFontDescriptor *fontDescriptor = [font fontDescriptor];
        UIFontDescriptorSymbolicTraits symbolicTraits = fontDescriptor.symbolicTraits;
        if (isItalic) {
          symbolicTraits |= UIFontDescriptorTraitItalic;
        }
        if (isCondensed) {
          symbolicTraits |= UIFontDescriptorTraitCondensed;
        }
        fontDescriptor = [fontDescriptor fontDescriptorWithSymbolicTraits:symbolicTraits];
        font = [UIFont fontWithDescriptor:fontDescriptor size:fontSize];
      }
      return font;
    } else {
      // systemFontOfSize:weight: isn't available prior to iOS 8.2, so we
      // fall back to finding the correct font manually, by linear search.
      familyName = RCTIOS8SystemFontFamily;
    }
  }

  // Gracefully handle being given a font name rather than font family, for
  // example: "Helvetica Light Oblique" rather than just "Helvetica".
  if ([UIFont fontNamesForFamilyName:familyName].count == 0) {
    font = [UIFont fontWithName:familyName size:fontSize];
    if (font) {
      // It's actually a font name, not a font family name,
      // but we'll do what was meant, not what was said.
      familyName = font.familyName;
      fontWeight = weight ? fontWeight : RCTWeightOfFont(font);
      isItalic = style ? isItalic : RCTFontIsItalic(font);
      isCondensed = RCTFontIsCondensed(font);
    } else {
      // Not a valid font or family
      RCTLogError(@"Unrecognized font family '%@'", familyName);
      if ([UIFont respondsToSelector:@selector(systemFontOfSize:weight:)]) {
        font = [UIFont systemFontOfSize:fontSize weight:fontWeight];
      } else if (fontWeight > UIFontWeightRegular) {
        font = [UIFont boldSystemFontOfSize:fontSize];
      } else {
        font = [UIFont systemFontOfSize:fontSize];
      }
    }
  }

  // Get the closest font that matches the given weight for the fontFamily
  UIFont *bestMatch = font;
  CGFloat closestWeight = INFINITY;
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

  return bestMatch;
}

NSArray *RCTConvertArrayValue(SEL type, id json)
{
  __block BOOL copy = NO;
  __block NSArray *values = json = [RCTConvert NSArray:json];
  [json enumerateObjectsUsingBlock:^(id jsonValue, NSUInteger idx, __unused BOOL *stop) {
    id value = ((id(*)(Class, SEL, id))objc_msgSend)([RCTConvert class], type, jsonValue);
    if (copy) {
      if (value) {
        [(NSMutableArray *)values addObject:value];
      }
    } else if (value != jsonValue) {
      // Converted value is different, so we'll need to copy the array
      values = [[NSMutableArray alloc] initWithCapacity:values.count];
      for (NSUInteger i = 0; i < idx; i++) {
        [(NSMutableArray *)values addObject:json[i]];
      }
      if (value) {
        [(NSMutableArray *)values addObject:value];
      }
      copy = YES;
    }
  }];
  return values;
}

RCT_ARRAY_CONVERTER(NSURL)
RCT_ARRAY_CONVERTER(RCTFileURL)
RCT_ARRAY_CONVERTER(UIColor)

/**
 * This macro is used for creating converter functions for directly
 * representable json array values that require no conversion.
 */
#if RCT_DEBUG
#define RCT_JSON_ARRAY_CONVERTER(type) RCT_ARRAY_CONVERTER(type)
#else
#define RCT_JSON_ARRAY_CONVERTER(type) + (NSArray *)type##Array:(id)json { return json; }
#endif

RCT_JSON_ARRAY_CONVERTER(NSArray)
RCT_JSON_ARRAY_CONVERTER(NSString)
RCT_JSON_ARRAY_CONVERTER(NSStringArray)
RCT_JSON_ARRAY_CONVERTER(NSDictionary)
RCT_JSON_ARRAY_CONVERTER(NSNumber)

// Can't use RCT_ARRAY_CONVERTER due to bridged cast
+ (NSArray *)CGColorArray:(id)json
{
  NSMutableArray *colors = [NSMutableArray new];
  for (id value in [self NSArray:json]) {
    [colors addObject:(__bridge id)[self CGColor:value]];
  }
  return colors;
}

static id RCTConvertPropertyListValue(id json)
{
  if (!json || json == (id)kCFNull) {
    return nil;
  }

  if ([json isKindOfClass:[NSDictionary class]]) {
    __block BOOL copy = NO;
    NSMutableDictionary *values = [[NSMutableDictionary alloc] initWithCapacity:[json count]];
    [json enumerateKeysAndObjectsUsingBlock:^(NSString *key, id jsonValue, __unused BOOL *stop) {
      id value = RCTConvertPropertyListValue(jsonValue);
      if (value) {
        values[key] = value;
      }
      copy |= value != jsonValue;
    }];
    return copy ? values : json;
  }

  if ([json isKindOfClass:[NSArray class]]) {
    __block BOOL copy = NO;
    __block NSArray *values = json;
    [json enumerateObjectsUsingBlock:^(id jsonValue, NSUInteger idx, __unused BOOL *stop) {
      id value = RCTConvertPropertyListValue(jsonValue);
      if (copy) {
        if (value) {
          [(NSMutableArray *)values addObject:value];
        }
      } else if (value != jsonValue) {
        // Converted value is different, so we'll need to copy the array
        values = [[NSMutableArray alloc] initWithCapacity:values.count];
        for (NSUInteger i = 0; i < idx; i++) {
          [(NSMutableArray *)values addObject:json[i]];
        }
        if (value) {
          [(NSMutableArray *)values addObject:value];
        }
        copy = YES;
      }
    }];
    return values;
  }

  // All other JSON types are supported by property lists
  return json;
}

+ (NSPropertyList)NSPropertyList:(id)json
{
  return RCTConvertPropertyListValue(json);
}

RCT_ENUM_CONVERTER(css_backface_visibility_t, (@{
  @"hidden": @NO,
  @"visible": @YES
}), YES, boolValue)

RCT_ENUM_CONVERTER(css_clip_t, (@{
  @"hidden": @YES,
  @"visible": @NO
}), NO, boolValue)

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
  @"keyboard": @(RCTAnimationTypeKeyboard),
}), RCTAnimationTypeEaseInEaseOut, integerValue)

@end
