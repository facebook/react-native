/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTConvert.h"

#import <objc/message.h>

#import <CoreText/CoreText.h>

#import "RCTDefines.h"
#import "RCTImageSource.h"
#import "RCTParserUtils.h"
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
#define RCT_JSON_CONVERTER(type)             \
  +(type *)type : (id)json                   \
  {                                          \
    if ([json isKindOfClass:[type class]]) { \
      return json;                           \
    } else if (json) {                       \
      RCTLogConvertError(json, @ #type);     \
    }                                        \
    return nil;                              \
  }
#else
#define RCT_JSON_CONVERTER(type) \
  +(type *)type : (id)json       \
  {                              \
    return json;                 \
  }
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
      RCTLogError(@"Invalid index value %lld. Indices must be positive.", (long long)index);
    }
    [indexSet addIndex:index];
  }
  return indexSet;
}

+ (NSURL *)NSURL:(id)json
{
  NSString *path = [self NSString:RCTNilIfNull(json)];
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
      NSMutableCharacterSet *urlAllowedCharacterSet = [NSMutableCharacterSet new];
      [urlAllowedCharacterSet formUnionWithCharacterSet:[NSCharacterSet URLUserAllowedCharacterSet]];
      [urlAllowedCharacterSet formUnionWithCharacterSet:[NSCharacterSet URLPasswordAllowedCharacterSet]];
      [urlAllowedCharacterSet formUnionWithCharacterSet:[NSCharacterSet URLHostAllowedCharacterSet]];
      [urlAllowedCharacterSet formUnionWithCharacterSet:[NSCharacterSet URLPathAllowedCharacterSet]];
      [urlAllowedCharacterSet formUnionWithCharacterSet:[NSCharacterSet URLQueryAllowedCharacterSet]];
      [urlAllowedCharacterSet formUnionWithCharacterSet:[NSCharacterSet URLFragmentAllowedCharacterSet]];
      path = [path stringByAddingPercentEncodingWithAllowedCharacters:urlAllowedCharacterSet];
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
  } @catch (__unused NSException *e) {
    RCTLogConvertError(json, @"a valid URL");
    return nil;
  }
}

RCT_ENUM_CONVERTER(
    NSURLRequestCachePolicy,
    (@{
      @"default" : @(NSURLRequestUseProtocolCachePolicy),
      @"reload" : @(NSURLRequestReloadIgnoringLocalCacheData),
      @"force-cache" : @(NSURLRequestReturnCacheDataElseLoad),
      @"only-if-cached" : @(NSURLRequestReturnCacheDataDontLoad),
    }),
    NSURLRequestUseProtocolCachePolicy,
    integerValue)

+ (NSURLRequest *)NSURLRequest:(id)json
{
  if ([json isKindOfClass:[NSString class]]) {
    NSURL *URL = [self NSURL:json];
    return URL ? [NSURLRequest requestWithURL:URL] : nil;
  }
  if ([json isKindOfClass:[NSDictionary class]]) {
    NSString *URLString = json[@"uri"] ?: json[@"url"];

    NSURL *URL;
    NSString *bundleName = json[@"bundle"];
    if (bundleName) {
      URLString = [NSString stringWithFormat:@"%@.bundle/%@", bundleName, URLString];
    }

    URL = [self NSURL:URLString];
    if (!URL) {
      return nil;
    }

    NSData *body = [self NSData:json[@"body"]];
    NSString *method = [self NSString:json[@"method"]].uppercaseString ?: @"GET";
    NSURLRequestCachePolicy cachePolicy = [self NSURLRequestCachePolicy:json[@"cache"]];
    NSDictionary *headers = [self NSDictionary:json[@"headers"]];
    if ([method isEqualToString:@"GET"] && headers == nil && body == nil &&
        cachePolicy == NSURLRequestUseProtocolCachePolicy) {
      return [NSURLRequest requestWithURL:URL];
    }

    if (headers) {
      __block BOOL allHeadersAreStrings = YES;
      [headers enumerateKeysAndObjectsUsingBlock:^(NSString *key, id header, BOOL *stop) {
        if (![header isKindOfClass:[NSString class]]) {
          RCTLogError(
              @"Values of HTTP headers passed must be  of type string. "
               "Value of header '%@' is not a string.",
              key);
          allHeadersAreStrings = NO;
          *stop = YES;
        }
      }];
      if (!allHeadersAreStrings) {
        // Set headers to nil here to avoid crashing later.
        headers = nil;
      }
    }

    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:URL];
    request.HTTPBody = body;
    request.HTTPMethod = method;
    request.cachePolicy = cachePolicy;
    request.allHTTPHeaderFields = headers;
    return [request copy];
  }
  if (json) {
    RCTLogConvertError(json, @"a valid URLRequest");
  }
  return nil;
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
      RCTLogError(
          @"JSON String '%@' could not be interpreted as a date. "
           "Expected format: YYYY-MM-DD'T'HH:mm:ss.sssZ",
          json);
    }
    return date;
  } else if (json) {
    RCTLogConvertError(json, @"a date");
  }
  return nil;
}

+ (NSLocale *)NSLocale:(id)json
{
  if ([json isKindOfClass:[NSString class]]) {
    NSLocale *locale = [[NSLocale alloc] initWithLocaleIdentifier:json];
    if (!locale) {
      RCTLogError(@"JSON String '%@' could not be interpreted as a valid locale. ", json);
    }
    return locale;
  } else if (json) {
    RCTLogConvertError(json, @"a locale");
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
    if ([allValues containsObject:json] || [json isEqual:defaultValue]) {
      return json;
    }
    RCTLogError(@"Invalid %s '%@'. should be one of: %@", typeName, json, allValues);
    return defaultValue;
  }
  if (RCT_DEBUG && ![json isKindOfClass:[NSString class]]) {
    RCTLogError(@"Expected NSNumber or NSString for %s, received %@: %@", typeName, [json classForCoder], json);
  }
  id value = mapping[json];
  if (RCT_DEBUG && !value && [json description].length > 0) {
    RCTLogError(
        @"Invalid %s '%@'. should be one of: %@",
        typeName,
        json,
        [[mapping allKeys] sortedArrayUsingSelector:@selector(caseInsensitiveCompare:)]);
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

RCT_ENUM_CONVERTER(
    NSLineBreakMode,
    (@{
      @"clip" : @(NSLineBreakByClipping),
      @"head" : @(NSLineBreakByTruncatingHead),
      @"tail" : @(NSLineBreakByTruncatingTail),
      @"middle" : @(NSLineBreakByTruncatingMiddle),
      @"wordWrapping" : @(NSLineBreakByWordWrapping),
    }),
    NSLineBreakByTruncatingTail,
    integerValue)

RCT_ENUM_CONVERTER(
    NSTextAlignment,
    (@{
      @"auto" : @(NSTextAlignmentNatural),
      @"left" : @(NSTextAlignmentLeft),
      @"center" : @(NSTextAlignmentCenter),
      @"right" : @(NSTextAlignmentRight),
      @"justify" : @(NSTextAlignmentJustified),
    }),
    NSTextAlignmentNatural,
    integerValue)

RCT_ENUM_CONVERTER(
    NSUnderlineStyle,
    (@{
      @"solid" : @(NSUnderlineStyleSingle),
      @"double" : @(NSUnderlineStyleDouble),
      @"dotted" : @(NSUnderlinePatternDot | NSUnderlineStyleSingle),
      @"dashed" : @(NSUnderlinePatternDash | NSUnderlineStyleSingle),
    }),
    NSUnderlineStyleSingle,
    integerValue)

RCT_ENUM_CONVERTER(
    RCTBorderStyle,
    (@{
      @"solid" : @(RCTBorderStyleSolid),
      @"dotted" : @(RCTBorderStyleDotted),
      @"dashed" : @(RCTBorderStyleDashed),
    }),
    RCTBorderStyleSolid,
    integerValue)

RCT_ENUM_CONVERTER(
    RCTTextDecorationLineType,
    (@{
      @"none" : @(RCTTextDecorationLineTypeNone),
      @"underline" : @(RCTTextDecorationLineTypeUnderline),
      @"line-through" : @(RCTTextDecorationLineTypeStrikethrough),
      @"underline line-through" : @(RCTTextDecorationLineTypeUnderlineStrikethrough),
    }),
    RCTTextDecorationLineTypeNone,
    integerValue)

// [TODO(OSS Candidate ISS#2710739)
RCT_ENUM_CONVERTER(
    RCTFontSmoothing,
    (@{
      @"auto": @(RCTFontSmoothingAuto),
      @"none": @(RCTFontSmoothingNone),
      @"antialiased": @(RCTFontSmoothingAntialiased),
      @"subpixel-antialiased": @(RCTFontSmoothingSubpixelAntialiased),
    }),
    RCTFontSmoothingAuto,
    integerValue)
// ]TODO(OSS Candidate ISS#2710739)

RCT_ENUM_CONVERTER(
    NSWritingDirection,
    (@{
      @"auto" : @(NSWritingDirectionNatural),
      @"ltr" : @(NSWritingDirectionLeftToRight),
      @"rtl" : @(NSWritingDirectionRightToLeft),
    }),
    NSWritingDirectionNatural,
    integerValue)

#if !TARGET_OS_OSX // TODO(macOS GH#774)
RCT_ENUM_CONVERTER(
    UITextAutocapitalizationType,
    (@{
      @"none" : @(UITextAutocapitalizationTypeNone),
      @"words" : @(UITextAutocapitalizationTypeWords),
      @"sentences" : @(UITextAutocapitalizationTypeSentences),
      @"characters" : @(UITextAutocapitalizationTypeAllCharacters)
    }),
    UITextAutocapitalizationTypeSentences,
    integerValue)

RCT_ENUM_CONVERTER(
    UITextFieldViewMode,
    (@{
      @"never" : @(UITextFieldViewModeNever),
      @"while-editing" : @(UITextFieldViewModeWhileEditing),
      @"unless-editing" : @(UITextFieldViewModeUnlessEditing),
      @"always" : @(UITextFieldViewModeAlways),
    }),
    UITextFieldViewModeNever,
    integerValue)

+ (UIKeyboardType)UIKeyboardType:(id)json RCT_DYNAMIC
{
  static NSDictionary<NSString *, NSNumber *> *mapping;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSMutableDictionary<NSString *, NSNumber *> *temporaryMapping = [NSMutableDictionary dictionaryWithDictionary:@{
      @"default" : @(UIKeyboardTypeDefault),
      @"ascii-capable" : @(UIKeyboardTypeASCIICapable),
      @"numbers-and-punctuation" : @(UIKeyboardTypeNumbersAndPunctuation),
      @"url" : @(UIKeyboardTypeURL),
      @"number-pad" : @(UIKeyboardTypeNumberPad),
      @"phone-pad" : @(UIKeyboardTypePhonePad),
      @"name-phone-pad" : @(UIKeyboardTypeNamePhonePad),
      @"email-address" : @(UIKeyboardTypeEmailAddress),
      @"decimal-pad" : @(UIKeyboardTypeDecimalPad),
      @"twitter" : @(UIKeyboardTypeTwitter),
      @"web-search" : @(UIKeyboardTypeWebSearch),
      // Added for Android compatibility
      @"numeric" : @(UIKeyboardTypeDecimalPad),
    }];
    temporaryMapping[@"ascii-capable-number-pad"] = @(UIKeyboardTypeASCIICapableNumberPad);
    mapping = temporaryMapping;
  });

  UIKeyboardType type = RCTConvertEnumValue("UIKeyboardType", mapping, @(UIKeyboardTypeDefault), json).integerValue;
  return type;
}

RCT_MULTI_ENUM_CONVERTER(
    UIDataDetectorTypes,
    (@{
      @"phoneNumber" : @(UIDataDetectorTypePhoneNumber),
      @"link" : @(UIDataDetectorTypeLink),
      @"address" : @(UIDataDetectorTypeAddress),
      @"calendarEvent" : @(UIDataDetectorTypeCalendarEvent),
      @"none" : @(UIDataDetectorTypeNone),
      @"all" : @(UIDataDetectorTypeAll),
    }),
    UIDataDetectorTypePhoneNumber,
    unsignedLongLongValue)

RCT_MULTI_ENUM_CONVERTER(
    WKDataDetectorTypes,
    (@{
      @"phoneNumber" : @(WKDataDetectorTypePhoneNumber),
      @"link" : @(WKDataDetectorTypeLink),
      @"address" : @(WKDataDetectorTypeAddress),
      @"calendarEvent" : @(WKDataDetectorTypeCalendarEvent),
      @"trackingNumber" : @(WKDataDetectorTypeTrackingNumber),
      @"flightNumber" : @(WKDataDetectorTypeFlightNumber),
      @"lookupSuggestion" : @(WKDataDetectorTypeLookupSuggestion),
      @"none" : @(WKDataDetectorTypeNone),
      @"all" : @(WKDataDetectorTypeAll),
    }),
    WKDataDetectorTypePhoneNumber,
    unsignedLongLongValue)

RCT_ENUM_CONVERTER(
    UIKeyboardAppearance,
    (@{
      @"default" : @(UIKeyboardAppearanceDefault),
      @"light" : @(UIKeyboardAppearanceLight),
      @"dark" : @(UIKeyboardAppearanceDark),
    }),
    UIKeyboardAppearanceDefault,
    integerValue)

RCT_ENUM_CONVERTER(
    UIReturnKeyType,
    (@{
      @"default" : @(UIReturnKeyDefault),
      @"go" : @(UIReturnKeyGo),
      @"google" : @(UIReturnKeyGoogle),
      @"join" : @(UIReturnKeyJoin),
      @"next" : @(UIReturnKeyNext),
      @"route" : @(UIReturnKeyRoute),
      @"search" : @(UIReturnKeySearch),
      @"send" : @(UIReturnKeySend),
      @"yahoo" : @(UIReturnKeyYahoo),
      @"done" : @(UIReturnKeyDone),
      @"emergency-call" : @(UIReturnKeyEmergencyCall),
    }),
    UIReturnKeyDefault,
    integerValue)

RCT_ENUM_CONVERTER(
    UIViewContentMode,
    (@{
      @"scale-to-fill" : @(UIViewContentModeScaleToFill),
      @"scale-aspect-fit" : @(UIViewContentModeScaleAspectFit),
      @"scale-aspect-fill" : @(UIViewContentModeScaleAspectFill),
      @"redraw" : @(UIViewContentModeRedraw),
      @"center" : @(UIViewContentModeCenter),
      @"top" : @(UIViewContentModeTop),
      @"bottom" : @(UIViewContentModeBottom),
      @"left" : @(UIViewContentModeLeft),
      @"right" : @(UIViewContentModeRight),
      @"top-left" : @(UIViewContentModeTopLeft),
      @"top-right" : @(UIViewContentModeTopRight),
      @"bottom-left" : @(UIViewContentModeBottomLeft),
      @"bottom-right" : @(UIViewContentModeBottomRight),
      // Cross-platform values
      @"cover" : @(UIViewContentModeScaleAspectFill),
      @"contain" : @(UIViewContentModeScaleAspectFit),
      @"stretch" : @(UIViewContentModeScaleToFill),
    }),
    UIViewContentModeScaleAspectFill,
    integerValue)

RCT_ENUM_CONVERTER(
    UIBarStyle,
    (@{
      @"default" : @(UIBarStyleDefault),
      @"black" : @(UIBarStyleBlack),
      @"blackOpaque" : @(UIBarStyleBlackOpaque),
      @"blackTranslucent" : @(UIBarStyleBlackTranslucent),
    }),
    UIBarStyleDefault,
    integerValue)
#else // [TODO(macOS GH#774)
RCT_MULTI_ENUM_CONVERTER(NSTextCheckingTypes, (@{
  @"ortography": @(NSTextCheckingTypeOrthography),
  @"spelling": @(NSTextCheckingTypeSpelling),
  @"grammar": @(NSTextCheckingTypeGrammar),
  @"calendarEvent": @(NSTextCheckingTypeDate),
  @"address": @(NSTextCheckingTypeAddress),
  @"link": @(NSTextCheckingTypeLink),
  @"quote": @(NSTextCheckingTypeQuote),
  @"dash": @(NSTextCheckingTypeDash),
  @"replacement": @(NSTextCheckingTypeReplacement),
  @"correction": @(NSTextCheckingTypeCorrection),
  @"regularExpression": @(NSTextCheckingTypeRegularExpression),
  @"phoneNumber": @(NSTextCheckingTypePhoneNumber),
  @"transitInformation": @(NSTextCheckingTypeTransitInformation),
}), NSTextCheckingTypeOrthography, unsignedLongLongValue)
#endif // ]TODO(macOS GH#774)

static void convertCGStruct(const char *type, NSArray *fields, CGFloat *result, id json)
{
  NSUInteger count = fields.count;
  if ([json isKindOfClass:[NSArray class]]) {
    if (RCT_DEBUG && [json count] != count) {
      RCTLogError(
          @"Expected array with count %llu, but count is %llu: %@",
          (unsigned long long)count,
          (unsigned long long)[json count],
          json);
    } else {
      for (NSUInteger i = 0; i < count; i++) {
        result[i] = [RCTConvert CGFloat:RCTNilIfNull(json[i])];
      }
    }
  } else if ([json isKindOfClass:[NSDictionary class]]) {
    for (NSUInteger i = 0; i < count; i++) {
      result[i] = [RCTConvert CGFloat:RCTNilIfNull(json[fields[i]])];
    }
  } else if (json) {
    RCTLogConvertError(json, @(type));
  }
}

/**
 * This macro is used for creating converter functions for structs that consist
 * of a number of CGFloat properties, such as CGPoint, CGRect, etc.
 */
#define RCT_CGSTRUCT_CONVERTER(type, values)                  \
  +(type)type : (id)json                                      \
  {                                                           \
    static NSArray *fields;                                   \
    static dispatch_once_t onceToken;                         \
    dispatch_once(&onceToken, ^{                              \
      fields = values;                                        \
    });                                                       \
    type result;                                              \
    convertCGStruct(#type, fields, (CGFloat *)&result, json); \
    return result;                                            \
  }

RCT_CUSTOM_CONVERTER(CGFloat, CGFloat, [self double:json])

RCT_CGSTRUCT_CONVERTER(CGPoint, (@[ @"x", @"y" ]))
RCT_CGSTRUCT_CONVERTER(CGSize, (@[ @"width", @"height" ]))
RCT_CGSTRUCT_CONVERTER(CGRect, (@[ @"x", @"y", @"width", @"height" ]))

+ (UIEdgeInsets)UIEdgeInsets:(id)json
{
  static NSArray *fields;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    fields = @[ @"top", @"left", @"bottom", @"right" ];
  });

  if ([json isKindOfClass:[NSNumber class]]) {
    CGFloat value = [json doubleValue];
    return UIEdgeInsetsMake(value, value, value, value);
  } else {
    UIEdgeInsets result;
    convertCGStruct("UIEdgeInsets", fields, (CGFloat *)&result, json);
    return result;
  }
}

RCT_ENUM_CONVERTER(
    CGLineJoin,
    (@{
      @"miter" : @(kCGLineJoinMiter),
      @"round" : @(kCGLineJoinRound),
      @"bevel" : @(kCGLineJoinBevel),
    }),
    kCGLineJoinMiter,
    intValue)

RCT_ENUM_CONVERTER(
    CGLineCap,
    (@{
      @"butt" : @(kCGLineCapButt),
      @"round" : @(kCGLineCapRound),
      @"square" : @(kCGLineCapSquare),
    }),
    kCGLineCapButt,
    intValue)

RCT_CGSTRUCT_CONVERTER(CGAffineTransform, (@[ @"a", @"b", @"c", @"d", @"tx", @"ty" ]))

static NSString *const RCTFallback = @"fallback";
static NSString *const RCTFallbackARGB = @"fallback-argb";
static NSString *const RCTSelector = @"selector";
static NSString *const RCTIndex = @"index";

/** The following dictionary defines the react-native semantic colors for ios.
 *  If the value for a given name is empty then the name itself
 *  is used as the UIColor selector.
 *  If the RCTSelector key is present then that value is used for a selector instead
 *  of the key name.
 *  If the given selector is not available on the running OS version then
 *  the RCTFallback selector is used instead.
 *  If the RCTIndex key is present then object returned from UIColor is an
 *  NSArray and the object at index RCTIndex is to be used.
 */
static NSDictionary<NSString *, NSDictionary *> *RCTSemanticColorsMap()
{
  static NSDictionary<NSString *, NSDictionary *> *colorMap = nil;
  if (colorMap == nil) {
    NSMutableDictionary<NSString *, NSDictionary *> *map = [@{
#if TARGET_OS_OSX // [TODO(macOS GH#774)
      // https://developer.apple.com/documentation/appkit/nscolor/ui_element_colors
      // Label Colors
      @"labelColor": @{}, // 10_10
      @"secondaryLabelColor": @{}, // 10_10
      @"tertiaryLabelColor": @{}, // 10_10
      @"quaternaryLabelColor": @{}, // 10_10
      // Text Colors
      @"textColor": @{},
      @"placeholderTextColor": @{}, // 10_10
      @"selectedTextColor": @{},
      @"textBackgroundColor": @{},
      @"selectedTextBackgroundColor": @{},
      @"keyboardFocusIndicatorColor": @{},
      @"unemphasizedSelectedTextColor": @{ // 10_14
        RCTFallback: @"selectedTextColor"
      },
      @"unemphasizedSelectedTextBackgroundColor": @{ // 10_14
        RCTFallback: @"textBackgroundColor"
      },
      // Content Colors
      @"linkColor": @{}, // 10_10
      @"separatorColor": @{ // 10_14: Replacement for +controlHighlightColor, +controlLightHighlightColor, +controlShadowColor, +controlDarkShadowColor
        RCTFallback: @"gridColor"
      },
      @"selectedContentBackgroundColor": @{ // 10_14: Alias for +alternateSelectedControlColor
        RCTFallback: @"alternateSelectedControlColor"
      },
      @"unemphasizedSelectedContentBackgroundColor": @{ // 10_14: Alias for +secondarySelectedControlColor
        RCTFallback: @"secondarySelectedControlColor"
      },
      // Menu Colors
      @"selectedMenuItemTextColor": @{},
      // Table Colors
      @"gridColor": @{},
      @"headerTextColor": @{},
      @"alternatingEvenContentBackgroundColor": @{ // 10_14: Alias for +controlAlternatingRowBackgroundColors
        RCTSelector: @"alternatingContentBackgroundColors",
        RCTIndex: @0,
        RCTFallback: @"controlAlternatingRowBackgroundColors"
      },
      @"alternatingOddContentBackgroundColor": @{ // 10_14: Alias for +controlAlternatingRowBackgroundColors
        RCTSelector: @"alternatingContentBackgroundColors",
        RCTIndex: @1,
        RCTFallback: @"controlAlternatingRowBackgroundColors"
      },
      // Control Colors
      @"controlAccentColor": @{ // 10_14
        RCTFallback: @"controlColor"
      },
      @"controlColor": @{},
      @"controlBackgroundColor": @{},
      @"controlTextColor": @{},
      @"disabledControlTextColor": @{},
      @"selectedControlColor": @{},
      @"selectedControlTextColor": @{},
      @"alternateSelectedControlTextColor": @{},
      @"scrubberTexturedBackgroundColor": @{}, // 10_12_2
      // Window Colors
      @"windowBackgroundColor": @{},
      @"windowFrameTextColor": @{},
      @"underPageBackgroundColor": @{}, // 10_8
      // Highlights and Shadows
      @"findHighlightColor": @{ // 10_13
        RCTFallback: @"highlightColor"
      },
      @"highlightColor": @{},
      @"shadowColor": @{},
      // https://developer.apple.com/documentation/appkit/nscolor/standard_colors
      // Standard Colors
      @"systemBlueColor": @{},   // 10_10
      @"systemBrownColor": @{},  // 10_10
      @"systemGrayColor": @{},   // 10_10
      @"systemGreenColor": @{},  // 10_10
      @"systemOrangeColor": @{}, // 10_10
      @"systemPinkColor": @{},   // 10_10
      @"systemPurpleColor": @{}, // 10_10
      @"systemRedColor": @{},    // 10_10
      @"systemYellowColor": @{}, // 10_10
      // Transparent Color
      @"clearColor" : @{},
#else // ]TODO(macOS GH#774)
      // https://developer.apple.com/documentation/uikit/uicolor/ui_element_colors
      // Label Colors
      @"labelColor" : @{
        // iOS 13.0
        RCTFallbackARGB :
            @(0xFF000000) // fallback for iOS<=12: RGBA returned by this semantic color in light mode on iOS 13
      },
      @"secondaryLabelColor" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0x993c3c43)
      },
      @"tertiaryLabelColor" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0x4c3c3c43)
      },
      @"quaternaryLabelColor" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0x2d3c3c43)
      },
      // Fill Colors
      @"systemFillColor" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0x33787880)
      },
      @"secondarySystemFillColor" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0x28787880)
      },
      @"tertiarySystemFillColor" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0x1e767680)
      },
      @"quaternarySystemFillColor" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0x14747480)
      },
      // Text Colors
      @"placeholderTextColor" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0x4c3c3c43)
      },
      // Standard Content Background Colors
      @"systemBackgroundColor" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0xFFffffff)
      },
      @"secondarySystemBackgroundColor" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0xFFf2f2f7)
      },
      @"tertiarySystemBackgroundColor" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0xFFffffff)
      },
      // Grouped Content Background Colors
      @"systemGroupedBackgroundColor" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0xFFf2f2f7)
      },
      @"secondarySystemGroupedBackgroundColor" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0xFFffffff)
      },
      @"tertiarySystemGroupedBackgroundColor" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0xFFf2f2f7)
      },
      // Separator Colors
      @"separatorColor" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0x493c3c43)
      },
      @"opaqueSeparatorColor" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0xFFc6c6c8)
      },
      // Link Color
      @"linkColor" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0xFF007aff)
      },
      // Nonadaptable Colors
      @"darkTextColor" : @{},
      @"lightTextColor" : @{},
      // https://developer.apple.com/documentation/uikit/uicolor/standard_colors
      // Adaptable Colors
      @"systemBlueColor" : @{},
      @"systemBrownColor" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0xFFa2845e)
      },
      @"systemGreenColor" : @{},
      @"systemIndigoColor" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0xFF5856d6)
      },
      @"systemOrangeColor" : @{},
      @"systemPinkColor" : @{},
      @"systemPurpleColor" : @{},
      @"systemRedColor" : @{},
      @"systemTealColor" : @{},
      @"systemYellowColor" : @{},
      // Adaptable Gray Colors
      @"systemGrayColor" : @{},
      @"systemGray2Color" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0xFFaeaeb2)
      },
      @"systemGray3Color" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0xFFc7c7cc)
      },
      @"systemGray4Color" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0xFFd1d1d6)
      },
      @"systemGray5Color" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0xFFe5e5ea)
      },
      @"systemGray6Color" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0xFFf2f2f7)
      },
      // Transparent Color
      @"clearColor" : @{
        // iOS 13.0
        RCTFallbackARGB : @(0x00000000)
      },
#endif // TODO(macOS GH#774)
    } mutableCopy];
    // The color names are the Objective-C UIColor selector names,
    // but Swift selector names are valid as well, so make aliases.
    static NSString *const RCTColorSuffix = @"Color";
    NSMutableDictionary<NSString *, NSDictionary *> *aliases = [NSMutableDictionary new];
    for (NSString *objcSelector in map) {
      RCTAssert(
          [objcSelector hasSuffix:RCTColorSuffix], @"A selector in the color map did not end with the suffix Color.");
      NSMutableDictionary *entry = [map[objcSelector] mutableCopy];
      if ([entry objectForKey:RCTSelector] == nil) {
        entry[RCTSelector] = objcSelector;
      }
      NSString *swiftSelector = [objcSelector substringToIndex:[objcSelector length] - [RCTColorSuffix length]];
      aliases[swiftSelector] = entry;
    }
    [map addEntriesFromDictionary:aliases];
#if DEBUG
    [map addEntriesFromDictionary:@{
      // The follow exist for Unit Tests
      @"unitTestFallbackColor" : @{RCTFallback : @"gridColor"},
      @"unitTestFallbackColorIOS" : @{RCTFallback : @"blueColor"},
      @"unitTestFallbackColorEven" : @{
        RCTSelector : @"unitTestFallbackColorEven",
        RCTIndex : @0,
        RCTFallback : @"controlAlternatingRowBackgroundColors"
      },
      @"unitTestFallbackColorOdd" : @{
        RCTSelector : @"unitTestFallbackColorOdd",
        RCTIndex : @1,
        RCTFallback : @"controlAlternatingRowBackgroundColors"
      },
    }];
#endif
    colorMap = [map copy];
  }

  return colorMap;
}

// [TODO(macOS GH#774)
/** Returns a UIColor based on a semantic color name.
 *  Returns nil if the semantic color name is invalid.
 */
static RCTUIColor *RCTColorFromSemanticColorName(NSString *semanticColorName)
{
  NSDictionary<NSString *, NSDictionary *> *colorMap = RCTSemanticColorsMap();
  RCTUIColor *color = nil;
  NSDictionary<NSString *, id> *colorInfo = colorMap[semanticColorName];
  if (colorInfo) {
    NSString *semanticColorSelector = colorInfo[RCTSelector];
    if (semanticColorSelector == nil) {
      semanticColorSelector = semanticColorName;
    }
    SEL selector = NSSelectorFromString(semanticColorSelector);
    if (![RCTUIColor respondsToSelector:selector]) {
      NSNumber *fallbackRGB = colorInfo[RCTFallbackARGB];
      if (fallbackRGB != nil) {
        RCTAssert([fallbackRGB isKindOfClass:[NSNumber class]], @"fallback ARGB is not a number");
        return [RCTConvert UIColor:fallbackRGB];
      }
      semanticColorSelector = colorInfo[RCTFallback];
      selector = NSSelectorFromString(semanticColorSelector);
    }
    RCTAssert ([RCTUIColor respondsToSelector:selector], @"RCTUIColor does not respond to a semantic color selector.");
    Class klass = [RCTUIColor class];
    IMP imp = [klass methodForSelector:selector];
    id (*getSemanticColorObject)(id, SEL) = (void *)imp;
    id colorObject = getSemanticColorObject(klass, selector);
    if ([colorObject isKindOfClass:[RCTUIColor class]]) {
      color = colorObject;
    } else if ([colorObject isKindOfClass:[NSArray class]]) {
      NSArray *colors = colorObject;
      NSNumber *index = colorInfo[RCTIndex];
      RCTAssert(index, @"index should not be null");
      color = colors[[index unsignedIntegerValue]];
    } else {
      RCTAssert(false, @"selector return an unknown object type");
    }
  }
  return color;
}
// ]TODO(macOS GH#774)

/** Returns an alphabetically sorted comma separated list of the valid semantic color names
 */
static NSString *RCTSemanticColorNames()
{
  NSMutableString *names = [NSMutableString new];
  NSDictionary<NSString *, NSDictionary *> *colorMap = RCTSemanticColorsMap();
  NSArray *allKeys = [[[colorMap allKeys] mutableCopy] sortedArrayUsingSelector:@selector(localizedCaseInsensitiveCompare:)];

  for(id key in allKeys) {
    if ([names length]) {
      [names appendString:@", "];
    }
    [names appendString:key];
  }
  return names;
}

// [TODO(macOS GH#774)
+ (RCTUIColor *)NSColor:(id)json
{
  return [RCTConvert UIColor:json];
}
// ]TODO(macOS GH#774)

// [TODO(macOS GH#750)
#if TARGET_OS_OSX
static NSColor *RCTColorWithSystemEffect(NSColor* color, NSString *systemEffectString) {
    NSColor *colorWithEffect = color;
    if (systemEffectString != nil) {
        if ([systemEffectString isEqualToString:@"none"]) {
            colorWithEffect = [color colorWithSystemEffect:NSColorSystemEffectNone];
        } else if ([systemEffectString isEqualToString:@"pressed"]) {
            colorWithEffect = [color colorWithSystemEffect:NSColorSystemEffectPressed];
        } else if ([systemEffectString isEqualToString:@"deepPressed"]) {
            colorWithEffect = [color colorWithSystemEffect:NSColorSystemEffectDeepPressed];
        } else if ([systemEffectString isEqualToString:@"disabled"]) {
            colorWithEffect = [color colorWithSystemEffect:NSColorSystemEffectDisabled];
        } else if ([systemEffectString isEqualToString:@"rollover"]) {
            colorWithEffect = [color colorWithSystemEffect:NSColorSystemEffectRollover];
        }
    }
    return colorWithEffect;
}
#endif //TARGET_OS_OSX
// ]TODO(macOS GH#750)

+ (RCTUIColor *)UIColor:(id)json // TODO(macOS GH#750)
{
  if (!json) {
    return nil;
  }
  if ([json isKindOfClass:[NSArray class]]) {
    NSArray *components = [self NSNumberArray:json];
    CGFloat alpha = components.count > 3 ? [self CGFloat:components[3]] : 1.0;
    return [RCTUIColor colorWithRed:[self CGFloat:components[0]] // TODO(macOS GH#750)
                              green:[self CGFloat:components[1]]
                               blue:[self CGFloat:components[2]]
                              alpha:alpha];
  } else if ([json isKindOfClass:[NSNumber class]]) {
    NSUInteger argb = [self NSUInteger:json];
    CGFloat a = ((argb >> 24) & 0xFF) / 255.0;
    CGFloat r = ((argb >> 16) & 0xFF) / 255.0;
    CGFloat g = ((argb >> 8) & 0xFF) / 255.0;
    CGFloat b = (argb & 0xFF) / 255.0;
    return [RCTUIColor colorWithRed:r green:g blue:b alpha:a]; // TODO(macOS GH#750)

  } else if ([json isKindOfClass:[NSDictionary class]]) {
    NSDictionary *dictionary = json;
    id value = nil;
    if ((value = [dictionary objectForKey:@"semantic"])) {
      if ([value isKindOfClass:[NSString class]]) {
        NSString *semanticName = value;
        RCTUIColor *color = [RCTUIColor colorNamed:semanticName]; // TODO(macOS GH#750)
        if (color != nil) {
          return color;
        }
        color = RCTColorFromSemanticColorName(semanticName);
        if (color == nil) {
          RCTLogConvertError(
              json,
              [@"a UIColor.  Expected one of the following values: " stringByAppendingString:RCTSemanticColorNames()]);
        }
        return color;
      } else if ([value isKindOfClass:[NSArray class]]) {
        for (id name in value) {
          RCTUIColor *color = [RCTUIColor colorNamed:name]; // TODO(macOS GH#750)
          if (color != nil) {
            return color;
          }
          color = RCTColorFromSemanticColorName(name);
          if (color != nil) {
            return color;
          }
        }
        RCTLogConvertError(
            json,
            [@"a UIColor.  None of the names in the array were one of the following values: "
                stringByAppendingString:RCTSemanticColorNames()]);
        return nil;
      }
      RCTLogConvertError(
          json, @"a UIColor.  Expected either a single name or an array of names but got something else.");
      return nil;
    } else if ((value = [dictionary objectForKey:@"dynamic"])) {
      NSDictionary *appearances = value;
      id light = [appearances objectForKey:@"light"];
      RCTUIColor *lightColor = [RCTConvert UIColor:light];
      id dark = [appearances objectForKey:@"dark"];
      RCTUIColor *darkColor = [RCTConvert UIColor:dark]; // TODO(macOS GH#750)
      id highContrastLight = [appearances objectForKey:@"highContrastLight"];
      RCTUIColor *highContrastLightColor = [RCTConvert UIColor:highContrastLight]; // TODO(macOS GH#750)
      id highContrastDark = [appearances objectForKey:@"highContrastDark"];
      RCTUIColor *highContrastDarkColor = [RCTConvert UIColor:highContrastDark]; // TODO(macOS GH#750)
      if (lightColor != nil && darkColor != nil) {
#if TARGET_OS_OSX
        NSColor *color = [NSColor colorWithName:nil dynamicProvider:^NSColor * _Nonnull(NSAppearance * _Nonnull appearance) {
          NSMutableArray<NSAppearanceName> *appearances = [NSMutableArray arrayWithArray:@[NSAppearanceNameAqua,NSAppearanceNameDarkAqua]];
          if (highContrastLightColor != nil) {
            [appearances addObject:NSAppearanceNameAccessibilityHighContrastAqua];
          }
          if (highContrastDarkColor != nil) {
            [appearances addObject:NSAppearanceNameAccessibilityHighContrastDarkAqua];
          }
          NSAppearanceName bestMatchingAppearance = [appearance bestMatchFromAppearancesWithNames:appearances];
          if (bestMatchingAppearance == NSAppearanceNameAqua) {
            return lightColor;
          } else if (bestMatchingAppearance == NSAppearanceNameDarkAqua) {
            return darkColor;
          } else if (bestMatchingAppearance == NSAppearanceNameAccessibilityHighContrastAqua) {
            return highContrastLightColor;
          } else if (bestMatchingAppearance == NSAppearanceNameAccessibilityHighContrastDarkAqua) {
            return highContrastDarkColor;
          } else {
            RCTLogConvertError(json, @"an NSColorColor. Could not resolve current appearance. Defaulting to light.");
            return lightColor;
          }
        }];
        return color;
#else
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
        if (@available(iOS 13.0, *)) {
          UIColor *color = [UIColor colorWithDynamicProvider:^UIColor *_Nonnull(
                                        UITraitCollection *_Nonnull collection) {
            if (collection.userInterfaceStyle == UIUserInterfaceStyleDark) {
              if (collection.accessibilityContrast == UIAccessibilityContrastHigh && highContrastDarkColor != nil) {
                return highContrastDarkColor;
              } else {
                return darkColor;
              }
            } else {
              if (collection.accessibilityContrast == UIAccessibilityContrastHigh && highContrastLightColor != nil) {
                return highContrastLightColor;
              } else {
                return lightColor;
              }
            }
          }];
          return color;
        } else {
#endif
          return lightColor;
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
        }
#endif
#endif
// [TODO(macOS GH#774)
      } else {
        RCTLogConvertError(json, @"a UIColor. Expected a dynamic appearance aware color.");
        return nil;
      }
// [TODO(macOS GH#750)
#if TARGET_OS_OSX
    } else if((value = [dictionary objectForKey:@"colorWithSystemEffect"])) {
        NSDictionary *colorWithSystemEffect = value;
        id base = [colorWithSystemEffect objectForKey:@"baseColor"];
        NSColor *baseColor = [RCTConvert UIColor:base];
        NSString * systemEffectString = [colorWithSystemEffect objectForKey:@"systemEffect"];
        if (baseColor != nil && systemEffectString != nil) {
            return RCTColorWithSystemEffect(baseColor, systemEffectString);
        } else {
            RCTLogConvertError(
                json, @"a UIColor.  Expected a color with a system effect string, but got something else");
            return nil;
        }
#endif //TARGET_OS_OSX
// ]TODO(macOS GH#750)
    } else {
      RCTLogConvertError(json, @"a UIColor. Expected a semantic color, dynamic appearance aware color, or color with system effect"); //TODO(macOS GH#750)
      return nil;
    }
// ]TODO(macOS GH#774)
  } else {
    RCTLogConvertError(json, @"a UIColor. Did you forget to call processColor() on the JS side?");
    return nil;
  }
}

+ (CGColorRef)CGColor:(id)json
{
  return [self UIColor:json].CGColor;
}

+ (YGValue)YGValue:(id)json
{
  if (!json) {
    return YGValueUndefined;
  } else if ([json isKindOfClass:[NSNumber class]]) {
    return (YGValue){[json floatValue], YGUnitPoint};
  } else if ([json isKindOfClass:[NSString class]]) {
    NSString *s = (NSString *)json;
    if ([s isEqualToString:@"auto"]) {
      return (YGValue){YGUndefined, YGUnitAuto};
    } else if ([s hasSuffix:@"%"]) {
      return (YGValue){[[s substringToIndex:s.length] floatValue], YGUnitPercent};
    } else {
      RCTLogConvertError(json, @"a YGValue. Did you forget the % or pt suffix?");
    }
  } else {
    RCTLogConvertError(json, @"a YGValue.");
  }
  return YGValueUndefined;
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
RCT_ARRAY_CONVERTER(RCTUIColor) // TODO(OSS Candidate ISS#2710739)

/**
 * This macro is used for creating converter functions for directly
 * representable json array values that require no conversion.
 */
#if RCT_DEBUG
#define RCT_JSON_ARRAY_CONVERTER_NAMED(type, name) RCT_ARRAY_CONVERTER_NAMED(type, name)
#else
#define RCT_JSON_ARRAY_CONVERTER_NAMED(type, name) \
  +(NSArray *)name##Array : (id)json               \
  {                                                \
    return json;                                   \
  }
#endif
#define RCT_JSON_ARRAY_CONVERTER(type) RCT_JSON_ARRAY_CONVERTER_NAMED(type, type)

RCT_JSON_ARRAY_CONVERTER(NSArray)
RCT_JSON_ARRAY_CONVERTER(NSString)
RCT_JSON_ARRAY_CONVERTER_NAMED(NSArray<NSString *>, NSStringArray)
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

#if TARGET_OS_OSX // [TODO(macOS GH#774)
+ (NSArray<NSPasteboardType> *)NSPasteboardType:(id)json
{
  NSString *type = [self NSString:json];
  if (!type) {
    return @[];
  }
  
  if ([type isEqualToString:@"fileUrl"]) {
    return @[NSFilenamesPboardType];
  }
  
  return @[];
}

+ (NSArray<NSPasteboardType> *)NSPasteboardTypeArray:(id)json
{
  if ([json isKindOfClass:[NSString class]]) {
    return [RCTConvert NSPasteboardType:json];
  } else if ([json isKindOfClass:[NSArray class]]) {
    NSMutableArray *mutablePastboardTypes = [NSMutableArray new];
    for (NSString *type in json) {
      [mutablePastboardTypes addObjectsFromArray:[RCTConvert NSPasteboardType:type]];
      return mutablePastboardTypes.copy;
    }
  }
  return @[];
}
#endif // ]TODO(macOS GH#774)

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

RCT_ENUM_CONVERTER(css_backface_visibility_t, (@{@"hidden" : @NO, @"visible" : @YES}), YES, boolValue)

RCT_ENUM_CONVERTER(
    YGOverflow,
    (@{
      @"hidden" : @(YGOverflowHidden),
      @"visible" : @(YGOverflowVisible),
      @"scroll" : @(YGOverflowScroll),
    }),
    YGOverflowVisible,
    intValue)

RCT_ENUM_CONVERTER(
    YGDisplay,
    (@{
      @"flex" : @(YGDisplayFlex),
      @"none" : @(YGDisplayNone),
    }),
    YGDisplayFlex,
    intValue)

RCT_ENUM_CONVERTER(
    YGFlexDirection,
    (@{
      @"row" : @(YGFlexDirectionRow),
      @"row-reverse" : @(YGFlexDirectionRowReverse),
      @"column" : @(YGFlexDirectionColumn),
      @"column-reverse" : @(YGFlexDirectionColumnReverse)
    }),
    YGFlexDirectionColumn,
    intValue)

RCT_ENUM_CONVERTER(
    YGJustify,
    (@{
      @"flex-start" : @(YGJustifyFlexStart),
      @"flex-end" : @(YGJustifyFlexEnd),
      @"center" : @(YGJustifyCenter),
      @"space-between" : @(YGJustifySpaceBetween),
      @"space-around" : @(YGJustifySpaceAround),
      @"space-evenly" : @(YGJustifySpaceEvenly)
    }),
    YGJustifyFlexStart,
    intValue)

RCT_ENUM_CONVERTER(
    YGAlign,
    (@{
      @"flex-start" : @(YGAlignFlexStart),
      @"flex-end" : @(YGAlignFlexEnd),
      @"center" : @(YGAlignCenter),
      @"auto" : @(YGAlignAuto),
      @"stretch" : @(YGAlignStretch),
      @"baseline" : @(YGAlignBaseline),
      @"space-between" : @(YGAlignSpaceBetween),
      @"space-around" : @(YGAlignSpaceAround)
    }),
    YGAlignFlexStart,
    intValue)

RCT_ENUM_CONVERTER(
    YGDirection,
    (@{
      @"inherit" : @(YGDirectionInherit),
      @"ltr" : @(YGDirectionLTR),
      @"rtl" : @(YGDirectionRTL),
    }),
    YGDirectionInherit,
    intValue)

RCT_ENUM_CONVERTER(
    YGPositionType,
    (@{
      @"static" : @(YGPositionTypeStatic),
      @"absolute" : @(YGPositionTypeAbsolute),
      @"relative" : @(YGPositionTypeRelative)
    }),
    YGPositionTypeRelative,
    intValue)

RCT_ENUM_CONVERTER(
    YGWrap,
    (@{@"wrap" : @(YGWrapWrap), @"nowrap" : @(YGWrapNoWrap), @"wrap-reverse" : @(YGWrapWrapReverse)}),
    YGWrapNoWrap,
    intValue)

RCT_ENUM_CONVERTER(
    RCTPointerEvents,
    (@{
      @"none" : @(RCTPointerEventsNone),
      @"box-only" : @(RCTPointerEventsBoxOnly),
      @"box-none" : @(RCTPointerEventsBoxNone),
      @"auto" : @(RCTPointerEventsUnspecified)
    }),
    RCTPointerEventsUnspecified,
    integerValue)

RCT_ENUM_CONVERTER(
    RCTAnimationType,
    (@{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
      @"spring" : @(RCTAnimationTypeSpring),
#endif // TODO(macOS GH#774)
      @"linear" : @(RCTAnimationTypeLinear),
      @"easeIn" : @(RCTAnimationTypeEaseIn),
      @"easeOut" : @(RCTAnimationTypeEaseOut),
      @"easeInEaseOut" : @(RCTAnimationTypeEaseInEaseOut),
#if !TARGET_OS_OSX // TODO(macOS GH#774)
      @"keyboard" : @(RCTAnimationTypeKeyboard),
#endif // TODO(macOS GH#774)
    }),
    RCTAnimationTypeEaseInEaseOut,
    integerValue)

#if TARGET_OS_OSX // [TODO(macOS GH#774)
+ (NSString*)accessibilityRoleFromTrait:(NSString*)trait
{
  static NSDictionary<NSString *, NSString *> *traitOrRoleToAccessibilityRole;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    traitOrRoleToAccessibilityRole = @{
      // from https://reactnative.dev/docs/accessibility#accessibilityrole
      @"adjustable": NSAccessibilitySliderRole,
      @"alert": NSAccessibilityStaticTextRole, // no exact match on macOS
      @"button": NSAccessibilityButtonRole, // also a legacy iOS accessibilityTraits
      @"checkbox": NSAccessibilityCheckBoxRole,
      @"combobox": NSAccessibilityComboBoxRole,
      @"header": NSAccessibilityStaticTextRole, // no exact match on macOS
      @"image": NSAccessibilityImageRole, // also a legacy iOS accessibilityTraits
      @"imagebutton": NSAccessibilityButtonRole, // no exact match on macOS
      @"keyboardkey": NSAccessibilityButtonRole, // no exact match on macOS
      @"link": NSAccessibilityLinkRole, // also a legacy iOS accessibilityTraits
      @"menu": NSAccessibilityMenuRole,
      @"menubar": NSAccessibilityMenuBarRole,
      @"menuitem": NSAccessibilityMenuItemRole,
      @"none": NSAccessibilityUnknownRole,
      @"progressbar": NSAccessibilityProgressIndicatorRole,
      @"radio": NSAccessibilityRadioButtonRole,
      @"radiogroup": NSAccessibilityRadioGroupRole,
      @"scrollbar": NSAccessibilityScrollBarRole,
      @"search": NSAccessibilityTextFieldRole, // no exact match on macOS
      @"spinbutton": NSAccessibilityIncrementorRole,
      @"summary": NSAccessibilityStaticTextRole, // no exact match on macOS
      @"switch": NSAccessibilityCheckBoxRole, // no exact match on macOS
      @"tab": NSAccessibilityButtonRole, // no exact match on macOS
      @"tablist": NSAccessibilityTabGroupRole,
      @"text": NSAccessibilityStaticTextRole, // also a legacy iOS accessibilityTraits
      @"timer": NSAccessibilityStaticTextRole, // no exact match on macOS
      @"toolbar": NSAccessibilityToolbarRole,
      // Roles/traits that are macOS specific and are used by some of the core components (Lists):
      @"disclosure": NSAccessibilityDisclosureTriangleRole,
      @"group": NSAccessibilityGroupRole,
      @"list": NSAccessibilityListRole,
      @"popupbutton": NSAccessibilityPopUpButtonRole,
      @"menubutton": NSAccessibilityMenuButtonRole,
      @"table": NSAccessibilityTableRole,
    };
  });

  NSString *role = [traitOrRoleToAccessibilityRole valueForKey:trait];
  if (role == nil) {
    role = NSAccessibilityUnknownRole;
  }
  return role;
}

+ (NSString *)accessibilityRoleFromTraits:(id)json
{
  if ([json isKindOfClass:[NSString class]]) {
    return [RCTConvert accessibilityRoleFromTrait:json];
  } else if ([json isKindOfClass:[NSArray class]]) {
    for (NSString *trait in json) {
      NSString *accessibilityRole = [RCTConvert accessibilityRoleFromTrait:trait];
      if (![accessibilityRole isEqualToString:NSAccessibilityUnknownRole]) {
        return accessibilityRole;
      }
    }
  }
  return NSAccessibilityUnknownRole;
}
#endif // ]TODO(macOS GH#774)

@end

@interface RCTImageSource (Packager)

@property (nonatomic, assign) BOOL packagerAsset;

@end

@implementation RCTConvert (Deprecated)

/* This method is only used when loading images synchronously, e.g. for tabbar icons */
+ (UIImage *)UIImage:(id)json
{
  if (!json) {
    return nil;
  }

  RCTImageSource *imageSource = [self RCTImageSource:json];
  if (!imageSource) {
    return nil;
  }

  __block UIImage *image;
  if (!RCTIsMainQueue()) {
    // It seems that none of the UIImage loading methods can be guaranteed
    // thread safe, so we'll pick the lesser of two evils here and block rather
    // than run the risk of crashing
    RCTLogWarn(@"Calling [RCTConvert UIImage:] on a background thread is not recommended");
    RCTUnsafeExecuteOnMainQueueSync(^{
      image = [self UIImage:json];
    });
    return image;
  }

  NSURL *URL = imageSource.request.URL;
  NSString *scheme = URL.scheme.lowercaseString;
  if ([scheme isEqualToString:@"file"]) {
    image = RCTImageFromLocalAssetURL(URL);
    // There is a case where this may fail when the image is at the bundle location.
    // RCTImageFromLocalAssetURL only checks for the image in the same location as the jsbundle
    // Hence, if the bundle is CodePush-ed, it will not be able to find the image.
    // This check is added here instead of being inside RCTImageFromLocalAssetURL, since
    // we don't want breaking changes to RCTImageFromLocalAssetURL, which is called in a lot of places
    // This is a deprecated method, and hence has the least impact on existing code. Basically,
    // instead of crashing the app, it tries one more location for the image.
    if (!image) {
      image = RCTImageFromLocalBundleAssetURL(URL);
    }
    if (!image) {
      RCTLogConvertError(json, @"an image. File not found.");
    }
  } else if ([scheme isEqualToString:@"data"]) {
    image = UIImageWithData([NSData dataWithContentsOfURL:URL]); // TODO(macOS GH#774)
  } else if ([scheme isEqualToString:@"http"] && imageSource.packagerAsset) {
    image = UIImageWithData([NSData dataWithContentsOfURL:URL]); // TODO(macOS GH#774)
  } else {
    RCTLogConvertError(json, @"an image. Only local files or data URIs are supported.");
    return nil;
  }

  CGImageRef imageRef = UIImageGetCGImageRef(image); // TODO(macOS GH#774)
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  CGFloat scale = imageSource.scale;
  if (!scale && imageSource.size.width) {
    // If no scale provided, set scale to image width / source width
    scale = CGImageGetWidth(imageRef) / imageSource.size.width; // TODO(macOS GH#774)
  }
  if (scale) {
    image = [UIImage imageWithCGImage:imageRef scale:scale orientation:image.imageOrientation];
  }
#else // [TODO(macOS GH#774)
  if (!CGSizeEqualToSize(image.size, imageSource.size)) {
    image = [[NSImage alloc] initWithCGImage:imageRef size:imageSource.size];
  }
#endif // ]TODO(macOS GH#774)

  if (!CGSizeEqualToSize(imageSource.size, CGSizeZero) && !CGSizeEqualToSize(imageSource.size, image.size)) {
    RCTLogError(
        @"Image source %@ size %@ does not match loaded image size %@.",
        URL.path.lastPathComponent,
        NSStringFromCGSize(imageSource.size),
        NSStringFromCGSize(image.size));
  }

  return image;
}

+ (CGImageRef)CGImage:(id)json
{
  return UIImageGetCGImageRef([self UIImage:json]); // TODO(macOS GH#774)
}

@end
