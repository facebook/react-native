//
//  NSURLResponse+FixFlipperKit.m
//  RNTester
//
//  Created by Maddie Schipper on 4/21/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

/**
 FlipperKit assumes that all NSURLResponse's are an instance of NSURLHTTPResponse. This patches that so base64 Image Pasting example doesn't crash the app.
 */

@interface NSURLResponse (FixFipperKit)

- (NSDictionary *)allHeaderFields;

- (NSInteger)statusCode;

@end

@implementation NSURLResponse (FixFipperKit)

- (NSDictionary *)allHeaderFields {
  return @{};
}

- (NSInteger)statusCode {
  return 200;
}

@end
