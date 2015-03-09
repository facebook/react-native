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

+ (NSArray *)NSArray:(id)json;
+ (NSDictionary *)NSDictionary:(id)json;
+ (NSString *)NSString:(id)json;
+ (NSNumber *)NSNumber:(id)json;
+ (NSInteger)NSInteger:(id)json;
+ (NSUInteger)NSUInteger:(id)json;

+ (NSURL *)NSURL:(id)json;
+ (NSURLRequest *)NSURLRequest:(id)json;

+ (NSDate *)NSDate:(id)json;
+ (NSTimeZone *)NSTimeZone:(id)json;
+ (NSTimeInterval)NSTimeInterval:(id)json;

+ (NSTextAlignment)NSTextAlignment:(id)json;
+ (NSWritingDirection)NSWritingDirection:(id)json;
+ (UIKeyboardType)UIKeyboardType:(id)json;

+ (CGFloat)CGFloat:(id)json;
+ (CGPoint)CGPoint:(id)json;
+ (CGSize)CGSize:(id)json;
+ (CGRect)CGRect:(id)json;
+ (UIEdgeInsets)UIEdgeInsets:(id)json;

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

#ifdef __cplusplus
}
#endif
