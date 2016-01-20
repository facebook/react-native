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
#import <UIKit/UIKit.h>

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

// Execute the specified block on the main thread. Unlike dispatch_sync/async
// this will not context-switch if we're already running on the main thread.
RCT_EXTERN void RCTExecuteOnMainThread(dispatch_block_t block, BOOL sync);

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
RCT_EXTERN NSDictionary<NSString *, id> *RCTMakeError(NSString *message, id toStringify, NSDictionary<NSString *, id> *extraData);
RCT_EXTERN NSDictionary<NSString *, id> *RCTMakeAndLogError(NSString *message, id toStringify, NSDictionary<NSString *, id> *extraData);
RCT_EXTERN NSDictionary<NSString *, id> *RCTJSErrorFromNSError(NSError *error);
RCT_EXTERN NSDictionary<NSString *, id> *RCTJSErrorFromCodeMessageAndNSError(NSString *code, NSString *message, NSError *error);

// The default error code that will be sent in the .code value of the Error object to js
RCT_EXTERN NSString *const RCTErrorUnspecified;

// Returns YES if React is running in a test environment
RCT_EXTERN BOOL RCTRunningInTestEnvironment(void);

// Returns YES if React is running in an iOS App Extension
RCT_EXTERN BOOL RCTRunningInAppExtension(void);

// Returns the shared UIApplication instance, or nil if running in an App Extension
RCT_EXTERN UIApplication *RCTSharedApplication(void);

// Returns the current main window, useful if you need to access the root view
// or view controller, e.g. to present a modal view controller or alert.
RCT_EXTERN UIWindow *RCTKeyWindow(void);

// Return a UIAlertView initialized with the given values
// or nil if running in an app extension
RCT_EXTERN UIAlertView *RCTAlertView(NSString *title,
                                     NSString *message,
                                     id delegate,
                                     NSString *cancelButtonTitle,
                                     NSArray<NSString *> *otherButtonTitles);

// Return YES if image has an alpha component
RCT_EXTERN BOOL RCTImageHasAlpha(CGImageRef image);

// Create an NSError in the RCTErrorDomain
RCT_EXTERN NSError *RCTErrorWithMessage(NSString *message);

// Convert nil values to NSNull, and vice-versa
RCT_EXTERN id RCTNilIfNull(id value);
RCT_EXTERN id RCTNullIfNil(id value);

// Convert NaN or infinite values to zero, as these aren't JSON-safe
RCT_EXTERN double RCTZeroIfNaN(double value);

// Convert data to a Base64-encoded data URL
RCT_EXTERN NSURL *RCTDataURL(NSString *mimeType, NSData *data);

// Gzip functionality - compression level in range 0 - 1 (-1 for default)
RCT_EXTERN NSData *RCTGzipData(NSData *data, float level);

// Returns the relative path within the main bundle for an absolute URL
// (or nil, if the URL does not specify a path within the main bundle)
RCT_EXTERN NSString *RCTBundlePathForURL(NSURL *URL);

// Determines if a given image URL actually refers to an XCAsset
RCT_EXTERN BOOL RCTIsXCAssetURL(NSURL *imageURL);

// Converts a CGColor to a hex string
RCT_EXTERN NSString *RCTColorToHexString(CGColorRef color);

// Get standard localized string (if it exists)
RCT_EXTERN NSString *RCTUIKitLocalizedString(NSString *string);

// URL manipulation
RCT_EXTERN NSString *RCTGetURLQueryParam(NSURL *URL, NSString *param);
RCT_EXTERN NSURL *RCTURLByReplacingQueryParam(NSURL *URL, NSString *param, NSString *value);
