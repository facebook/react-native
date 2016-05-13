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

NS_ASSUME_NONNULL_BEGIN

// JSON serialization/deserialization
RCT_EXTERN NSString *__nullable RCTJSONStringify(id __nullable jsonObject, NSError **error);
RCT_EXTERN id __nullable RCTJSONParse(NSString *__nullable jsonString, NSError **error);
RCT_EXTERN id __nullable RCTJSONParseMutable(NSString *__nullable jsonString, NSError **error);

// Sanitize a JSON object by stripping invalid types and/or NaN values
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

// Convert a size in points to pixels, rounded up to the nearest integral size
RCT_EXTERN CGSize RCTSizeInPixels(CGSize pointSize, CGFloat scale);

// Method swizzling
RCT_EXTERN void RCTSwapClassMethods(Class cls, SEL original, SEL replacement);
RCT_EXTERN void RCTSwapInstanceMethods(Class cls, SEL original, SEL replacement);

// Module subclass support
RCT_EXTERN BOOL RCTClassOverridesClassMethod(Class cls, SEL selector);
RCT_EXTERN BOOL RCTClassOverridesInstanceMethod(Class cls, SEL selector);

// Creates a standardized error object to return in callbacks
RCT_EXTERN NSDictionary<NSString *, id> *RCTMakeError(NSString *message, id __nullable toStringify, NSDictionary<NSString *, id> *__nullable extraData);
RCT_EXTERN NSDictionary<NSString *, id> *RCTMakeAndLogError(NSString *message, id __nullable toStringify, NSDictionary<NSString *, id> *__nullable extraData);
RCT_EXTERN NSDictionary<NSString *, id> *RCTJSErrorFromNSError(NSError *error);
RCT_EXTERN NSDictionary<NSString *, id> *RCTJSErrorFromCodeMessageAndNSError(NSString *code, NSString *message, NSError *__nullable error);

// The default error code to use as the `code` property for callback error objects
RCT_EXTERN NSString *const RCTErrorUnspecified;

// Returns YES if React is running in a test environment
RCT_EXTERN BOOL RCTRunningInTestEnvironment(void);

// Returns YES if React is running in an iOS App Extension
RCT_EXTERN BOOL RCTRunningInAppExtension(void);

// Returns the shared UIApplication instance, or nil if running in an App Extension
RCT_EXTERN UIApplication *__nullable RCTSharedApplication(void);

// Returns the current main window, useful if you need to access the root view
// or view controller
RCT_EXTERN UIWindow *__nullable RCTKeyWindow(void);

// Returns the presented view controller, useful if you need
// e.g. to present a modal view controller or alert over it
RCT_EXTERN UIViewController *__nullable RCTPresentedViewController(void);

// Does this device support force touch (aka 3D Touch)?
RCT_EXTERN BOOL RCTForceTouchAvailable(void);

// Return a UIAlertView initialized with the given values
// or nil if running in an app extension
RCT_EXTERN UIAlertView *__nullable RCTAlertView(NSString *title,
                                                NSString *__nullable message,
                                                id __nullable delegate,
                                                NSString *__nullable cancelButtonTitle,
                                                NSArray<NSString *> *__nullable otherButtonTitles);

// Create an NSError in the RCTErrorDomain
RCT_EXTERN NSError *RCTErrorWithMessage(NSString *message);

// Convert nil values to NSNull, and vice-versa
RCT_EXTERN id __nullable RCTNilIfNull(id __nullable value);
RCT_EXTERN id RCTNullIfNil(id __nullable value);

// Convert NaN or infinite values to zero, as these aren't JSON-safe
RCT_EXTERN double RCTZeroIfNaN(double value);

// Convert data to a Base64-encoded data URL
RCT_EXTERN NSURL *RCTDataURL(NSString *mimeType, NSData *data);

// Gzip functionality - compression level in range 0 - 1 (-1 for default)
RCT_EXTERN NSData *__nullable RCTGzipData(NSData *__nullable data, float level);

// Returns the relative path within the main bundle for an absolute URL
// (or nil, if the URL does not specify a path within the main bundle)
RCT_EXTERN NSString *__nullable RCTBundlePathForURL(NSURL *__nullable URL);

// Determines if a given image URL actually refers to an XCAsset
RCT_EXTERN BOOL RCTIsXCAssetURL(NSURL *__nullable imageURL);

// Creates a new, unique temporary file path with the specified extension
RCT_EXTERN NSString *__nullable RCTTempFilePath(NSString *__nullable extension, NSError **error);

// Converts a CGColor to a hex string
RCT_EXTERN NSString *RCTColorToHexString(CGColorRef color);

// Get standard localized string (if it exists)
RCT_EXTERN NSString *RCTUIKitLocalizedString(NSString *string);

// URL manipulation
RCT_EXTERN NSString *__nullable RCTGetURLQueryParam(NSURL *__nullable URL, NSString *param);
RCT_EXTERN NSURL *__nullable RCTURLByReplacingQueryParam(NSURL *__nullable URL, NSString *param, NSString *__nullable value);

NS_ASSUME_NONNULL_END
