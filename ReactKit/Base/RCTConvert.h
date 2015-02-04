// Copyright 2004-present Facebook. All Rights Reserved.

#import <QuartzCore/QuartzCore.h>
#import <UIKit/UIKit.h>

#import "Layout.h"

@interface RCTConvert : NSObject

+ (BOOL)BOOL:(id)json;
+ (double)double:(id)json;
+ (float)float:(id)json;
+ (int)int:(id)json;

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
+ (UITextAutocapitalizationType)UITextAutocapitalizationType:(id)json;
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

+ (CAKeyframeAnimation *)GIF:(id)json;
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

@end
