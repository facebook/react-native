/**
 * Copyright (c) 2015-present, Facebook, Inc.
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

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
#import "RCTDynamicColor.h"
#endif // ]TODO(macOS ISS#2323203)

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
      RCTLogError(@"Invalid index value %lld. Indices must be positive.", (long long)index);
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

RCT_ENUM_CONVERTER(NSURLRequestCachePolicy, (@{
                                               @"default": @(NSURLRequestUseProtocolCachePolicy),
                                               @"reload": @(NSURLRequestReloadIgnoringLocalCacheData),
                                               @"force-cache": @(NSURLRequestReturnCacheDataElseLoad),
                                               @"only-if-cached": @(NSURLRequestReturnCacheDataDontLoad),
                                               }), NSURLRequestUseProtocolCachePolicy, integerValue)


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
    if ([method isEqualToString:@"GET"] && headers == nil && body == nil && cachePolicy == NSURLRequestUseProtocolCachePolicy) {
      return [NSURLRequest requestWithURL:URL];
    }

    if (headers) {
      __block BOOL allHeadersAreStrings = YES;
      [headers enumerateKeysAndObjectsUsingBlock:^(NSString *key, id header, BOOL *stop) {
        if (![header isKindOfClass:[NSString class]]) {
          RCTLogError(@"Values of HTTP headers passed must be  of type string. "
                      "Value of header '%@' is not a string.", key);
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
      RCTLogError(@"JSON String '%@' could not be interpreted as a date. "
                  "Expected format: YYYY-MM-DD'T'HH:mm:ss.sssZ", json);
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
  @"clip": @(NSLineBreakByClipping),
  @"head": @(NSLineBreakByTruncatingHead),
  @"tail": @(NSLineBreakByTruncatingTail),
  @"middle": @(NSLineBreakByTruncatingMiddle),
  @"wordWrapping": @(NSLineBreakByWordWrapping),
}), NSLineBreakByTruncatingTail, integerValue)

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

RCT_ENUM_CONVERTER(RCTBorderStyle, (@{
  @"solid": @(RCTBorderStyleSolid),
  @"dotted": @(RCTBorderStyleDotted),
  @"dashed": @(RCTBorderStyleDashed),
}), RCTBorderStyleSolid, integerValue)

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

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
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

#if !TARGET_OS_TV
RCT_MULTI_ENUM_CONVERTER(UIDataDetectorTypes, (@{
  @"phoneNumber": @(UIDataDetectorTypePhoneNumber),
  @"link": @(UIDataDetectorTypeLink),
  @"address": @(UIDataDetectorTypeAddress),
  @"calendarEvent": @(UIDataDetectorTypeCalendarEvent),
  @"none": @(UIDataDetectorTypeNone),
  @"all": @(UIDataDetectorTypeAll),
}), UIDataDetectorTypePhoneNumber, unsignedLongLongValue)

#if WEBKIT_IOS_10_APIS_AVAILABLE
RCT_MULTI_ENUM_CONVERTER(WKDataDetectorTypes, (@{
 @"phoneNumber": @(WKDataDetectorTypePhoneNumber),
 @"link": @(WKDataDetectorTypeLink),
 @"address": @(WKDataDetectorTypeAddress),
 @"calendarEvent": @(WKDataDetectorTypeCalendarEvent),
 @"trackingNumber": @(WKDataDetectorTypeTrackingNumber),
 @"flightNumber": @(WKDataDetectorTypeFlightNumber),
 @"lookupSuggestion": @(WKDataDetectorTypeLookupSuggestion),
 @"none": @(WKDataDetectorTypeNone),
 @"all": @(WKDataDetectorTypeAll),
 }), WKDataDetectorTypePhoneNumber, unsignedLongLongValue)
 #endif // WEBKIT_IOS_10_APIS_AVAILABLE

 #endif // !TARGET_OS_TV

RCT_ENUM_CONVERTER(UIKeyboardAppearance, (@{
  @"default": @(UIKeyboardAppearanceDefault),
  @"light": @(UIKeyboardAppearanceLight),
  @"dark": @(UIKeyboardAppearanceDark),
}), UIKeyboardAppearanceDefault, integerValue)

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

#if !TARGET_OS_TV
RCT_ENUM_CONVERTER(UIBarStyle, (@{
  @"default": @(UIBarStyleDefault),
  @"black": @(UIBarStyleBlack),
}), UIBarStyleDefault, integerValue)
#endif
#else // [TODO(macOS ISS#2323203)
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
#endif // ]TODO(macOS ISS#2323203)

static void convertCGStruct(const char *type, NSArray *fields, CGFloat *result, id json)
{
  NSUInteger count = fields.count;
  if ([json isKindOfClass:[NSArray class]]) {
    if (RCT_DEBUG && [json count] != count) {
      RCTLogError(@"Expected array with count %llu, but count is %llu: %@", (unsigned long long)count, (unsigned long long)[json count], json);
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
#define RCT_CGSTRUCT_CONVERTER(type, values)                \
+ (type)type:(id)json                                       \
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

RCT_CGSTRUCT_CONVERTER(CGPoint, (@[@"x", @"y"]))
RCT_CGSTRUCT_CONVERTER(CGSize, (@[@"width", @"height"]))
RCT_CGSTRUCT_CONVERTER(CGRect, (@[@"x", @"y", @"width", @"height"]))
RCT_CGSTRUCT_CONVERTER(UIEdgeInsets, (@[@"top", @"left", @"bottom", @"right"]))

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

RCT_CGSTRUCT_CONVERTER(CGAffineTransform, (@[
  @"a", @"b", @"c", @"d", @"tx", @"ty"
]))

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
static NSString *const RCTFallback = @"fallback";
static NSString *const RCTSelector = @"selector";
static NSString *const RCTIndex = @"index";

/** The following dictionary defines the react-native semantic colors for macos.
 *  If the value for a given name is empty then the name itself
 *  is used as the NSColor selector.
 *  If the RCTSelector key is present then that value is used for a selector instead
 *  of the key name.
 *  If the given selector is not available on the running OS version then
 *  the RCTFallback selector is used instead.
 *  If the RCTIndex key is present then object returned from NSColor is an
 *  NSArray and the object at index RCTIndex is to be used.
 */
static NSDictionary<NSString *, NSDictionary *>* RCTSemanticColorsMap()
{
  static NSDictionary<NSString *, NSDictionary *> *colorMap = nil;
  if (colorMap == nil) {
    colorMap = @{
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
      @"alternatingContentBackgroundColorEven": @{ // 10_14: Alias for +controlAlternatingRowBackgroundColors
        RCTSelector: @"alternatingContentBackgroundColors",
        RCTIndex: @0,
        RCTFallback: @"controlAlternatingRowBackgroundColors"
      },
      @"alternatingContentBackgroundColorOdd": @{ // 10_14: Alias for +controlAlternatingRowBackgroundColors
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
#if DEBUG
      // The follow exist for Unit Tests
      @"unitTestFallbackColor": @{
        RCTFallback: @"gridColor"
      },
      @"unitTestFallbackColorEven": @{
        RCTSelector: @"unitTestFallbackColorEven",
        RCTIndex: @0,
        RCTFallback: @"controlAlternatingRowBackgroundColors"
      },
      @"unitTestFallbackColorOdd": @{
        RCTSelector: @"unitTestFallbackColorOdd",
        RCTIndex: @1,
        RCTFallback: @"controlAlternatingRowBackgroundColors"
      },
#endif
    };
  }
  return colorMap;
}

/** Returns an NSColor based on a semantic color name.
 *  Returns nil if the semantic color name is invalid.
 */
static NSColor *RCTColorFromSemanticColorName(NSString *semanticColorName)
{
  NSDictionary<NSString *, NSDictionary *> *colorMap = RCTSemanticColorsMap();
  NSColor *color = nil;
  NSDictionary<NSString *, id> *colorInfo = colorMap[semanticColorName];
  if (colorInfo) {
    NSString *semanticColorSelector = colorInfo[RCTSelector];
    if (semanticColorSelector == nil) {
      semanticColorSelector = semanticColorName;
    }
    SEL selector = NSSelectorFromString(semanticColorSelector);
    if (![NSColor respondsToSelector:selector]) {
      semanticColorSelector = colorInfo[RCTFallback];
      selector = NSSelectorFromString(semanticColorSelector);
    }
    RCTAssert ([NSColor respondsToSelector:selector], @"NSColor does not respond to a semantic color selector.");
    Class klass = [NSColor class];
    IMP imp = [klass methodForSelector:selector];
    id (*getSemanticColorObject)(id, SEL) = (void *)imp;
    id colorObject = getSemanticColorObject(klass, selector);
    if ([colorObject isKindOfClass:[NSColor class]]) {
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

/** Returns a comma seperated list of the valid semantic color names
 */
static NSString *RCTSemanticColorNames()
{
  NSMutableString *names = [[NSMutableString alloc] init];
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
#endif // ]TODO(macOS ISS#2323203)

+ (UIColor *)UIColor:(id)json
{
  if (!json) {
    return nil;
  }
  if ([json isKindOfClass:[NSArray class]]) {
    NSArray *components = [self NSNumberArray:json];
    CGFloat alpha = components.count > 3 ? [self CGFloat:components[3]] : 1.0;
    return [UIColor colorWithRed:[self CGFloat:components[0]]
                           green:[self CGFloat:components[1]]
                            blue:[self CGFloat:components[2]]
                           alpha:alpha];
  } else if ([json isKindOfClass:[NSNumber class]]) {
    NSUInteger argb = [self NSUInteger:json];
    CGFloat a = ((argb >> 24) & 0xFF) / 255.0;
    CGFloat r = ((argb >> 16) & 0xFF) / 255.0;
    CGFloat g = ((argb >> 8) & 0xFF) / 255.0;
    CGFloat b = (argb & 0xFF) / 255.0;
    return [UIColor colorWithRed:r green:g blue:b alpha:a];
#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
  } else if ([json isKindOfClass:[NSDictionary class]]) {
    NSDictionary *dictionary = json;
    id value = nil;
    if ((value = [dictionary objectForKey:@"semantic"])) {
      NSString *semanticName = value;
      NSColor *color = RCTColorFromSemanticColorName(semanticName);
      if (color == nil) {
        RCTLogConvertError(json, [@"an NSColor.  Expected one of the following values: " stringByAppendingString:RCTSemanticColorNames()]);
      }
      return color;
    } else if ((value = [dictionary objectForKey:@"dynamic"])) {
      NSDictionary *appearances = value;
      id light = [appearances objectForKey:@"light"];
      NSColor *lightColor = [RCTConvert UIColor:light];
      id dark = [appearances objectForKey:@"dark"];
      NSColor *darkColor = [RCTConvert UIColor:dark];
      if (lightColor != nil && darkColor != nil) {
        RCTDynamicColor *color = [[RCTDynamicColor alloc] initWithAquaColor:lightColor darkAquaColor:darkColor];
        return color;
      } else {
        RCTLogConvertError(json, @"an NSColor. Expected a mac dynamic appearance aware color.");
        return nil;
      }
    } else {
      RCTLogConvertError(json, @"an NSColor. Expected a mac semantic color or dynamic appearance aware color.");
      return nil;
    }
#endif // [TODO(macOS ISS#2323203)
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
    return (YGValue) { [json floatValue], YGUnitPoint };
  } else if ([json isKindOfClass:[NSString class]]) {
    NSString *s = (NSString *) json;
    if ([s isEqualToString:@"auto"]) {
      return (YGValue) { YGUndefined, YGUnitAuto };
    } else if ([s hasSuffix:@"%"]) {
      return (YGValue) { [[s substringToIndex:s.length] floatValue], YGUnitPercent };
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
RCT_ARRAY_CONVERTER(UIColor)

/**
 * This macro is used for creating converter functions for directly
 * representable json array values that require no conversion.
 */
#if RCT_DEBUG
#define RCT_JSON_ARRAY_CONVERTER_NAMED(type, name) RCT_ARRAY_CONVERTER_NAMED(type, name)
#else
#define RCT_JSON_ARRAY_CONVERTER_NAMED(type, name) + (NSArray *)name##Array:(id)json { return json; }
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

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
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
    NSMutableArray *mutablePastboardTypes = [[NSMutableArray alloc] init];
    for (NSString *type in json) {
      [mutablePastboardTypes addObjectsFromArray:[RCTConvert NSPasteboardType:type]];
      return mutablePastboardTypes.copy;
    }
  }
  return @[];
}
#endif // ]TODO(macOS ISS#2323203)

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

RCT_ENUM_CONVERTER(YGOverflow, (@{
  @"hidden": @(YGOverflowHidden),
  @"visible": @(YGOverflowVisible),
  @"scroll": @(YGOverflowScroll),
}), YGOverflowVisible, intValue)

RCT_ENUM_CONVERTER(YGDisplay, (@{
  @"flex": @(YGDisplayFlex),
  @"none": @(YGDisplayNone),
}), YGDisplayFlex, intValue)

RCT_ENUM_CONVERTER(YGFlexDirection, (@{
  @"row": @(YGFlexDirectionRow),
  @"row-reverse": @(YGFlexDirectionRowReverse),
  @"column": @(YGFlexDirectionColumn),
  @"column-reverse": @(YGFlexDirectionColumnReverse)
}), YGFlexDirectionColumn, intValue)

RCT_ENUM_CONVERTER(YGJustify, (@{
  @"flex-start": @(YGJustifyFlexStart),
  @"flex-end": @(YGJustifyFlexEnd),
  @"center": @(YGJustifyCenter),
  @"space-between": @(YGJustifySpaceBetween),
  @"space-around": @(YGJustifySpaceAround),
  @"space-evenly": @(YGJustifySpaceEvenly)
}), YGJustifyFlexStart, intValue)

RCT_ENUM_CONVERTER(YGAlign, (@{
  @"flex-start": @(YGAlignFlexStart),
  @"flex-end": @(YGAlignFlexEnd),
  @"center": @(YGAlignCenter),
  @"auto": @(YGAlignAuto),
  @"stretch": @(YGAlignStretch),
  @"baseline": @(YGAlignBaseline),
  @"space-between": @(YGAlignSpaceBetween),
  @"space-around": @(YGAlignSpaceAround)
}), YGAlignFlexStart, intValue)

RCT_ENUM_CONVERTER(YGDirection, (@{
  @"inherit": @(YGDirectionInherit),
  @"ltr": @(YGDirectionLTR),
  @"rtl": @(YGDirectionRTL),
}), YGDirectionInherit, intValue)

RCT_ENUM_CONVERTER(YGPositionType, (@{
  @"absolute": @(YGPositionTypeAbsolute),
  @"relative": @(YGPositionTypeRelative)
}), YGPositionTypeRelative, intValue)

RCT_ENUM_CONVERTER(YGWrap, (@{
  @"wrap": @(YGWrapWrap),
  @"nowrap": @(YGWrapNoWrap),
  @"wrap-reverse": @(YGWrapWrapReverse)
}), YGWrapNoWrap, intValue)

RCT_ENUM_CONVERTER(RCTPointerEvents, (@{
  @"none": @(RCTPointerEventsNone),
  @"box-only": @(RCTPointerEventsBoxOnly),
  @"box-none": @(RCTPointerEventsBoxNone),
  @"auto": @(RCTPointerEventsUnspecified)
}), RCTPointerEventsUnspecified, integerValue)

RCT_ENUM_CONVERTER(RCTAnimationType, (@{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  @"spring": @(RCTAnimationTypeSpring),
#endif // TODO(macOS ISS#2323203)
  @"linear": @(RCTAnimationTypeLinear),
  @"easeIn": @(RCTAnimationTypeEaseIn),
  @"easeOut": @(RCTAnimationTypeEaseOut),
  @"easeInEaseOut": @(RCTAnimationTypeEaseInEaseOut),
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  @"keyboard": @(RCTAnimationTypeKeyboard),
#endif // TODO(macOS ISS#2323203)
}), RCTAnimationTypeEaseInEaseOut, integerValue)

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
+ (NSString*)accessibilityRoleFromTrait:(NSString*)trait
{
  // a subset of iOS accessibilityTraits map to macOS accessiblityRoles:
  if ([trait isEqualToString:@"button"]) {
    return NSAccessibilityButtonRole;
  } else if ([trait isEqualToString:@"text"]) {
    return NSAccessibilityStaticTextRole;
  } else if ([trait isEqualToString:@"link"]) {
    return NSAccessibilityLinkRole;
  } else if ([trait isEqualToString:@"image"]) {
    return NSAccessibilityImageRole;
    // a set of RN accessibilityTraits are macOS specific accessiblity roles:
  }	else if ([trait isEqualToString:@"group"]) {
    return NSAccessibilityGroupRole;
  } else if ([trait isEqualToString:@"list"]) {
    return NSAccessibilityListRole;
  }
  return NSAccessibilityUnknownRole;
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
#endif // ]TODO(macOS ISS#2323203)

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
    if (!image) {
      RCTLogConvertError(json, @"an image. File not found.");
    }
  } else if ([scheme isEqualToString:@"data"]) {
    image = UIImageWithData([NSData dataWithContentsOfURL:URL]); // TODO(macOS ISS#2323203)
  } else if ([scheme isEqualToString:@"http"] && imageSource.packagerAsset) {
    image = UIImageWithData([NSData dataWithContentsOfURL:URL]); // TODO(macOS ISS#2323203)
  } else {
    RCTLogConvertError(json, @"an image. Only local files or data URIs are supported.");
    return nil;
  }

  CGImageRef imageRef = UIImageGetCGImageRef(image); // TODO(macOS ISS#2323203)
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  CGFloat scale = imageSource.scale;
  if (!scale && imageSource.size.width) {
    // If no scale provided, set scale to image width / source width
    scale = CGImageGetWidth(imageRef) / imageSource.size.width; // TODO(macOS ISS#2323203)
  }
  if (scale) {
    image = [UIImage imageWithCGImage:imageRef
                                scale:scale
                          orientation:image.imageOrientation];
  }
#else // [TODO(macOS ISS#2323203)
  if (!CGSizeEqualToSize(image.size, imageSource.size)) {
    image = [[NSImage alloc] initWithCGImage:imageRef size:imageSource.size];
  }
#endif // ]TODO(macOS ISS#2323203)

  if (!CGSizeEqualToSize(imageSource.size, CGSizeZero) &&
      !CGSizeEqualToSize(imageSource.size, image.size)) {
    RCTLogError(@"Image source %@ size %@ does not match loaded image size %@.",
                URL.path.lastPathComponent,
                NSStringFromCGSize(imageSource.size),
                NSStringFromCGSize(image.size));
  }

  return image;
}

+ (CGImageRef)CGImage:(id)json
{
  return UIImageGetCGImageRef([self UIImage:json]); // TODO(macOS ISS#2323203)
}

@end
