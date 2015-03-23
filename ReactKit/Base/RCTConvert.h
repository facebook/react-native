// Copyright 2004-present Facebook. All Rights Reserved.

#import <QuartzCore/QuartzCore.h>
#import <UIKit/UIKit.h>

#import "../Layout/Layout.h"
#import "../Views/RCTAnimationType.h"
#import "../Views/RCTPointerEvents.h"

/**
 * This class provides a collection of conversion functions for mapping
 * JSON objects to native types and classes. These are useful when writing
 * custom RCTViewManager setter methods.
 */
@interface RCTConvert : NSObject

+ (BOOL)BOOL:(id)json;
+ (double)double:(id)json;
+ (float)float:(id)json;
+ (int)int:(id)json;

+ (NSInteger)NSInteger:(id)json;
+ (NSUInteger)NSUInteger:(id)json;

+ (NSArray *)NSArray:(id)json;
+ (NSDictionary *)NSDictionary:(id)json;
+ (NSString *)NSString:(id)json;
+ (NSNumber *)NSNumber:(id)json;

+ (NSURL *)NSURL:(id)json;
+ (NSURLRequest *)NSURLRequest:(id)json;

+ (NSDate *)NSDate:(id)json;
+ (NSTimeZone *)NSTimeZone:(id)json;
+ (NSTimeInterval)NSTimeInterval:(id)json;

+ (NSTextAlignment)NSTextAlignment:(id)json;
+ (NSWritingDirection)NSWritingDirection:(id)json;
+ (UITextAutocapitalizationType)UITextAutocapitalizationType:(id)json;
+ (UIKeyboardType)UIKeyboardType:(id)json;

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
+ (CGColorRef)CGColor:(id)json;

+ (UIImage *)UIImage:(id)json;
+ (CGImageRef)CGImage:(id)json;

+ (UIFont *)UIFont:(UIFont *)font withSize:(id)json;
+ (UIFont *)UIFont:(UIFont *)font withWeight:(id)json;
+ (UIFont *)UIFont:(UIFont *)font withFamily:(id)json;
+ (UIFont *)UIFont:(UIFont *)font withFamily:(id)json size:(id)json weight:(id)json;

+ (NSArray *)NSStringArray:(id)json;
+ (NSArray *)NSNumberArray:(id)json;
+ (NSArray *)UIColorArray:(id)json;
+ (NSArray *)CGColorArray:(id)json;

+ (BOOL)css_overflow:(id)json;
+ (css_flex_direction_t)css_flex_direction_t:(id)json;
+ (css_justify_t)css_justify_t:(id)json;
+ (css_align_t)css_align_t:(id)json;
+ (css_position_type_t)css_position_type_t:(id)json;
+ (css_wrap_type_t)css_wrap_type_t:(id)json;

+ (RCTPointerEvents)RCTPointerEvents:(id)json;
+ (RCTAnimationType)RCTAnimationType:(id)json;

@end

#ifdef __cplusplus
extern "C" {
#endif

/**
 * This function will attempt to set a property using a json value by first
 * inferring the correct type from all available information, and then
 * applying an appropriate conversion method. If the property does not
 * exist, or the type cannot be inferred, the function will return NO.
 */
BOOL RCTSetProperty(id target, NSString *keypath, id json);

/**
 * This function attempts to copy a property from the source object to the
 * destination object using KVC. If the property does not exist, or cannot
 * be set, it will do nothing and return NO.
 */
BOOL RCTCopyProperty(id target, id source, NSString *keypath);

/**
 * This function attempts to convert a JSON value to an object that can be used
 * in KVC with the specific target and key path.
 */
id RCTConvertValue(id target, NSString *keypath, id json);

#ifdef __cplusplus
}
#endif

/**
 * This macro is used for creating converter functions with arbitrary logic.
 */
#define RCT_CONVERTER_CUSTOM(type, name, code) \
+ (type)name:(id)json                          \
{                                              \
  if (json == [NSNull null]) {                 \
    json = nil;                                \
  }                                            \
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

/**
 * This macro is used for creating simple converter functions that just call
 * the specified getter method on the json value.
 */
#define RCT_CONVERTER(type, name, getter) \
RCT_CONVERTER_CUSTOM(type, name, [json getter])

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
  if (!json || json == [NSNull null]) {                   \
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

/**
 * This macro is used for creating converter functions for structs that consist
 * of a number of CGFloat properties, such as CGPoint, CGRect, etc.
 */
#define RCT_CGSTRUCT_CONVERTER(type, values)             \
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

/**
 * This macro is used for creating converter functions for typed arrays.
 */
#define RCT_ARRAY_CONVERTER(type)                         \
+ (NSArray *)type##Array:(id)json                         \
{                                                         \
  NSMutableArray *values = [[NSMutableArray alloc] init]; \
  for (id jsonValue in [self NSArray:json]) {             \
    id value = [self type:jsonValue];                     \
    if (value) {                                          \
      [values addObject:value];                           \
    }                                                     \
  }                                                       \
  return values;                                          \
}
