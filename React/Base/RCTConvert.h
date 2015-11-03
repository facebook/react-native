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

#import "Layout.h"
#import "RCTAnimationType.h"
#import "RCTTextDecorationLineType.h"
#import "RCTDefines.h"
#import "RCTLog.h"
#import "RCTPointerEvents.h"

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
+ (UIReturnKeyType)UIReturnKeyType:(id)json;

+ (UIViewContentMode)UIViewContentMode:(id)json;
+ (UIBarStyle)UIBarStyle:(id)json;

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

+ (UIImage *)UIImage:(id)json;
+ (CGImageRef)CGImage:(id)json CF_RETURNS_NOT_RETAINED;

+ (UIFont *)UIFont:(id)json;
+ (UIFont *)UIFont:(UIFont *)font withSize:(id)json;
+ (UIFont *)UIFont:(UIFont *)font withWeight:(id)json;
+ (UIFont *)UIFont:(UIFont *)font withStyle:(id)json;
+ (UIFont *)UIFont:(UIFont *)font withFamily:(id)json;
+ (UIFont *)UIFont:(UIFont *)font withFamily:(id)family
              size:(id)size weight:(id)weight style:(id)style
   scaleMultiplier:(CGFloat)scaleMultiplier;

typedef NSArray NSArrayArray;
+ (NSArray<NSArray *> *)NSArrayArray:(id)json;

typedef NSArray NSStringArray;
+ (NSArray<NSString *> *)NSStringArray:(id)json;

typedef NSArray NSStringArrayArray;
+ (NSArray<NSArray<NSString *> *> *)NSStringArrayArray:(id)json;

typedef NSArray NSDictionaryArray;
+ (NSArray<NSDictionary *> *)NSDictionaryArray:(id)json;

typedef NSArray NSURLArray;
+ (NSArray<NSURL *> *)NSURLArray:(id)json;

typedef NSArray RCTFileURLArray;
+ (NSArray<NSURL *> *)RCTFileURLArray:(id)json;

typedef NSArray NSNumberArray;
+ (NSArray<NSNumber *> *)NSNumberArray:(id)json;

typedef NSArray UIColorArray;
+ (NSArray<UIColor *> *)UIColorArray:(id)json;

typedef NSArray CGColorArray;
+ (CGColorArray *)CGColorArray:(id)json;

/**
 * Convert a JSON object to a Plist-safe equivalent by stripping null values.
 */
typedef id NSPropertyList;
+ (NSPropertyList)NSPropertyList:(id)json;

typedef BOOL css_clip_t, css_backface_visibility_t;
+ (css_clip_t)css_clip_t:(id)json;
+ (css_backface_visibility_t)css_backface_visibility_t:(id)json;
+ (css_flex_direction_t)css_flex_direction_t:(id)json;
+ (css_justify_t)css_justify_t:(id)json;
+ (css_align_t)css_align_t:(id)json;
+ (css_position_type_t)css_position_type_t:(id)json;
+ (css_wrap_type_t)css_wrap_type_t:(id)json;

+ (RCTPointerEvents)RCTPointerEvents:(id)json;
+ (RCTAnimationType)RCTAnimationType:(id)json;
+ (RCTTextDecorationLineType)RCTTextDecorationLineType:(id)json;

@end

/**
 * Underlying implementations of RCT_XXX_CONVERTER macros. Ignore these.
 */
RCT_EXTERN NSNumber *RCTConvertEnumValue(const char *, NSDictionary *, NSNumber *, id);
RCT_EXTERN NSNumber *RCTConvertMultiEnumValue(const char *, NSDictionary *, NSNumber *, id);
RCT_EXTERN NSArray *RCTConvertArrayValue(SEL, id);

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
+ (NSArray<type *> *)type##Array:(id)json                      \
{                                                      \
  return RCTConvertArrayValue(@selector(type:), json); \
}
