/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <JavaScriptCore/JavaScriptCore.h>

#import "RCTJavaScriptExecutor.h"

/**
 * Default name for the JS thread
 */
RCT_EXTERN NSString *const RCTJSCThreadName;

/**
 * This notification fires on the JS thread immediately after a `JSContext`
 * is fully initialized, but before the JS bundle has been loaded. The object
 * of this notification is the `JSContext`. Native modules should listen for
 * notification only if they need to install custom functionality into the
 * context. Note that this notification won't fire when debugging in Chrome.
 */
RCT_EXTERN NSString *const RCTJavaScriptContextCreatedNotification;

/**
 * Uses a JavaScriptCore context as the execution engine.
 */
@interface RCTJSCExecutor : NSObject <RCTJavaScriptExecutor>

/**
 * Returns whether executor uses custom JSC library.
 * This value is used to initialize RCTJSCWrapper.
 * @default is NO.
 */
@property (nonatomic, readonly, assign) BOOL useCustomJSCLibrary;

/**
 * Inits a new executor instance with given flag that's used
 * to initialize RCTJSCWrapper.
 */
- (instancetype)initWithUseCustomJSCLibrary:(BOOL)useCustomJSCLibrary;

/**
 * Create a NSError from a JSError object.
 *
 * If available, the error's userInfo property will contain the JS stacktrace under
 * the RCTJSStackTraceKey key.
 */
- (NSError *)convertJSErrorToNSError:(JSValueRef)jsError context:(JSContextRef)context;

@end
