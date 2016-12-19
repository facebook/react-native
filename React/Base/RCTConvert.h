/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <QuartzCore/QuartzCore.h>
#import <UIKit/UIKit.h>

#import <yoga/Yoga.h>
#import <React/RCTAnimationType.h>
#import <React/RCTBorderStyle.h>
#import <React/RCTDefines.h>
#import <React/RCTLog.h>
#import <React/RCTPointerEvents.h>
#import <React/RCTTextDecorationLineType.h>

/**
 * This class provides a collection of conversion functions for mapping
 * JSON objects to native types and classes. These are useful when writing
 * custom RCTViewManager setter methods.
 */
@interface RCTConvert : NSObject

+ (id)id:(id)json;

+ (BOOL)BOOL:(id)json;
+ (double)double:(id)json;
+ (float)float:(id)json;
+ (int)int:(id)json;

+ (int64_t)int64_t:(id)json;
+ (uint64_t)uint64_t:(id)json;

+ (NSInteger)NSInteger:(id)json;
+ (NSUInteger)NSUInteger:(id)json;

+ (NSArray *)NSArray:(id)json;
+ (NSDictionary *)NSDictionary:(id)json;
+ (NSString *)NSString:(id)json;
+ (NSNumber *)NSNumber:(id)json;

+ (NSSet *)NSSet:(id)json;
+ (NSData *)NSData:(id)json;
+ (NSIndexSet *)NSIndexSet:(id)json;

+ (NSURL *)NSURL:(id)json;
+ (NSURLRequest *)NSURLRequest:(id)json;

typedef NSURL RCTFileURL;
+ (RCTFileURL *)RCTFileURL:(id)json;

+ (NSDate *)NSDate:(id)json;
+ (NSTimeZone *)NSTimeZone:(id)json;
+ (NSTimeInterval)NSTimeInterval:(id)json;

+ (NSLineBreakMode)NSLineBreakMode:(id)json;
+ (NSTextAlignment)NSTextAlignment:(id)json;
+ (NSUnderlineStyle)NSUnderlineStyle:(id)json;
+ (NSWritingDirection)NSWritingDirection:(id)json;
+ (UITextAutocapitalizationType)UITextAutocapitalizationType:(id)json;
+ (UITextFieldViewMode)UITextFieldViewMode:(id)json;
+ (UIKeyboardType)UIKeyboardType:(id)json;
+ (UIKeyboardAppearance)UIKeyboardAppearance:(id)json;
+ (UIReturnKeyType)UIReturnKeyType:(id)json;
#if !TARGET_OS_TV
+ (UIDataDetectorTypes)UIDataDetectorTypes:(id)json;
#endif

+ (UIViewContentMode)UIViewContentMode:(id)json;
#if !TARGET_OS_TV
+ (UIBarStyle)UIBarStyle:(id)json;
#endif

+ (CGFloat)CGFloat:(id)json;
+ (CGPoint)CGPoint:(id)json;
+ (CGSize)CGSize:(id)json;
+ (CGRect)CGRect:(id)json;
+ (UIEdgeInsets)UIEdgeInsets:(id)json;

+ (CGLineCap)CGLineCap:(id)json;
+ (CGLineJoin)CGLineJoin:(id)json;

+ (CATransform3D)CATransform3D:(id)json;
+ (CGAffineTransform)CGAffineTransform:(id)json;

+ (UIColor *)UIColor:(id)json;
+ (CGColorRef)CGColor:(id)json CF_RETURNS_NOT_RETAINED;

+ (NSArray<NSArray *> *)NSArrayArray:(id)json;
+ (NSArray<NSString *> *)NSStringArray:(id)json;
+ (NSArray<NSArray<NSString *> *> *)NSStringArrayArray:(id)json;
+ (NSArray<NSDictionary *> *)NSDictionaryArray:(id)json;
+ (NSArray<NSURL *> *)NSURLArray:(id)json;
+ (NSArray<RCTFileURL *> *)RCTFileURLArray:(id)json;
+ (NSArray<NSNumber *> *)NSNumberArray:(id)json;
+ (NSArray<UIColor *> *)UIColorArray:(id)json;

typedef NSArray CGColorArray;
+ (CGColorArray *)CGColorArray:(id)json;

/**
 * Convert a JSON object to a Plist-safe equivalent by stripping null values.
 */
typedef id NSPropertyList;
+ (NSPropertyList)NSPropertyList:(id)json;

typedef BOOL css_backface_visibility_t;
+ (YGOverflow)YGOverflow:(id)json;
+ (css_backface_visibility_t)css_backface_visibility_t:(id)json;
+ (YGFlexDirection)YGFlexDirection:(id)json;
+ (YGJustify)YGJustify:(id)json;
+ (YGAlign)YGAlign:(id)json;
+ (YGPositionType)YGPositionType:(id)json;
+ (YGWrap)YGWrap:(id)json;

+ (RCTPointerEvents)RCTPointerEvents:(id)json;
+ (RCTAnimationType)RCTAnimationType:(id)json;
+ (RCTBorderStyle)RCTBorderStyle:(id)json;
+ (RCTTextDecorationLineType)RCTTextDecorationLineType:(id)json;

@end

@interface RCTConvert (Deprecated)

/**
 * Use lightweight generics syntax instead, e.g. NSArray<NSString *>
 */
typedef NSArray NSArrayArray __deprecated_msg("Use NSArray<NSArray *>");
typedef NSArray NSStringArray __deprecated_msg("Use NSArray<NSString *>");
typedef NSArray NSStringArrayArray __deprecated_msg("Use NSArray<NSArray<NSString *> *>");
typedef NSArray NSDictionaryArray __deprecated_msg("Use NSArray<NSDictionary *>");
typedef NSArray NSURLArray __deprecated_msg("Use NSArray<NSURL *>");
typedef NSArray RCTFileURLArray __deprecated_msg("Use NSArray<RCTFileURL *>");
typedef NSArray NSNumberArray __deprecated_msg("Use NSArray<NSNumber *>");
typedef NSArray UIColorArray __deprecated_msg("Use NSArray<UIColor *>");

/**
 * Synchronous image loading is generally a bad idea for performance reasons.
 * If you need to pass image references, try to use `RCTImageSource` and then
 * `RCTImageLoader` instead of converting directly to a UIImage.
 */
+ (UIImage *)UIImage:(id)json;
+ (CGImageRef)CGImage:(id)json CF_RETURNS_NOT_RETAINED;

@end

/**
 * Underlying implementations of RCT_XXX_CONVERTER macros. Ignore these.
 */
RCT_EXTERN NSNumber *RCTConvertEnumValue(const char *, NSDictionary *, NSNumber *, id);
RCT_EXTERN NSNumber *RCTConvertMultiEnumValue(const char *, NSDictionary *, NSNumber *, id);
RCT_EXTERN NSArray *RCTConvertArrayValue(SEL, id);

/**
 * Get the converter function for the specified type
 */
RCT_EXTERN SEL RCTConvertSelectorForType(NSString *type);

/**
 * This macro is used for logging conversion errors. This is just used to
 * avoid repeating the same boilerplate for every error message.
 */
#define RCTLogConvertError(json, typeName) \
RCTLogError(@"JSON value '%@' of type %@ cannot be converted to %@", \
json, [json classForCoder], typeName)

/**
 * This macro is used for creating simple converter functions that just call
 * the specified getter method on the json value.
 */
#define RCT_CONVERTER(type, name, getter) \
RCT_CUSTOM_CONVERTER(type, name, [json getter])

/**
 * This macro is used for creating converter functions with arbitrary logic.
 */
#define RCT_CUSTOM_CONVERTER(type, name, code) \
+ (type)name:(id)json                          \
{                                              \
  if (!RCT_DEBUG) {                            \
    return code;                               \
  } else {                                     \
    @try {                                     \
      return code;                             \
    }                                          \
    @catch (__unused NSException *e) {         \
      RCTLogConvertError(json, @#type);        \
      json = nil;                              \
      return code;                             \
    }                                          \
  }                                            \
}

/**
 * This macro is similar to RCT_CONVERTER, but specifically geared towards
 * numeric types. It will handle string input correctly, and provides more
 * detailed error reporting if an invalid value is passed in.
 */
#define RCT_NUMBER_CONVERTER(type, getter) \
RCT_CUSTOM_CONVERTER(type, type, [RCT_DEBUG ? [self NSNumber:json] : json getter])

/**
 * This macro is used for creating converters for enum types.
 */
#define RCT_ENUM_CONVERTER(type, values, default, getter) \
+ (type)type:(id)json                                     \
{                                                         \
  static NSDictionary *mapping;                           \
  static dispatch_once_t onceToken;                       \
  dispatch_once(&onceToken, ^{                            \
    mapping = values;                                     \
  });                                                     \
  return [RCTConvertEnumValue(#type, mapping, @(default), json) getter]; \
}

/**
 * This macro is used for creating converters for enum types for
 * multiple enum values combined with | operator
 */
#define RCT_MULTI_ENUM_CONVERTER(type, values, default, getter) \
+ (type)type:(id)json                                     \
{                                                         \
  static NSDictionary *mapping;                           \
  static dispatch_once_t onceToken;                       \
  dispatch_once(&onceToken, ^{                            \
    mapping = values;                                     \
  });                                                     \
  return [RCTConvertMultiEnumValue(#type, mapping, @(default), json) getter]; \
}

/**
 * This macro is used for creating converter functions for typed arrays.
 */
#define RCT_ARRAY_CONVERTER(type)                      \
+ (NSArray<type *> *)type##Array:(id)json              \
{                                                      \
  return RCTConvertArrayValue(@selector(type:), json); \
}
