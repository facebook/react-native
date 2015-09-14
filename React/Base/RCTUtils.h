/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <tgmath.h>

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

#import "RCTAssert.h"
#import "RCTDefines.h"

// JSON serialization/deserialization
RCT_EXTERN NSString *RCTJSONStringify(id jsonObject, NSError **error);
RCT_EXTERN id RCTJSONParse(NSString *jsonString, NSError **error);
RCT_EXTERN id RCTJSONParseMutable(NSString *jsonString, NSError **error);

// Strip non JSON-safe values from an object graph
RCT_EXTERN id RCTJSONClean(id object);

// Get MD5 hash of a string
RCT_EXTERN NSString *RCTMD5Hash(NSString *string);

// Get screen metrics in a thread-safe way
RCT_EXTERN CGFloat RCTScreenScale(void);
RCT_EXTERN CGSize RCTScreenSize(void);

// Round float coordinates to nearest whole screen pixel (not point)
RCT_EXTERN CGFloat RCTRoundPixelValue(CGFloat value);
RCT_EXTERN CGFloat RCTCeilPixelValue(CGFloat value);
RCT_EXTERN CGFloat RCTFloorPixelValue(CGFloat value);

// Method swizzling
RCT_EXTERN void RCTSwapClassMethods(Class cls, SEL original, SEL replacement);
RCT_EXTERN void RCTSwapInstanceMethods(Class cls, SEL original, SEL replacement);

// Module subclass support
RCT_EXTERN BOOL RCTClassOverridesClassMethod(Class cls, SEL selector);
RCT_EXTERN BOOL RCTClassOverridesInstanceMethod(Class cls, SEL selector);

// Creates a standardized error object
RCT_EXTERN NSDictionary *RCTMakeError(NSString *message, id toStringify, NSDictionary *extraData);
RCT_EXTERN NSDictionary *RCTMakeAndLogError(NSString *message, id toStringify, NSDictionary *extraData);
RCT_EXTERN NSDictionary *RCTJSErrorFromNSError(NSError *error);

// Returns YES if React is running in a test environment
RCT_EXTERN BOOL RCTRunningInTestEnvironment(void);

// Return YES if image has an alpha component
RCT_EXTERN BOOL RCTImageHasAlpha(CGImageRef image);

// Create an NSError in the RCTErrorDomain
RCT_EXTERN NSError *RCTErrorWithMessage(NSString *message);

// Convert nil values to NSNull, and vice-versa
RCT_EXTERN id RCTNilIfNull(id value);
RCT_EXTERN id RCTNullIfNil(id value);

// Convert data to a Base64-encoded data URL
RCT_EXTERN NSURL *RCTDataURL(NSString *mimeType, NSData *data);

// Gzip functionality - compression level in range 0 - 1 (-1 for default)
RCT_EXTERN NSData *RCTGzipData(NSData *data, float level);
