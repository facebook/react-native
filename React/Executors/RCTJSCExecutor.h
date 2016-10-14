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

typedef void (^RCTJavaScriptValueCallback)(JSValue *result, NSError *error);

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
 * A key to a reference to a JSContext class, held in the the current thread's
 *  dictionary. The reference would point to the JSContext class in the JS VM
 *  used in React (or ComponenetScript). It is recommended not to access it
 *  through the thread's dictionary, but rather to use the `FBJSCurrentContext()`
 *  accessor, which will return the current JSContext in the currently used VM.
 */
RCT_EXTERN NSString *const RCTFBJSContextClassKey;

/**
 * A key to a reference to a JSValue class, held in the the current thread's
 *  dictionary. The reference would point to the JSValue class in the JS VM
 *  used in React (or ComponenetScript). It is recommended not to access it
 *  through the thread's dictionary, but rather to use the `FBJSValue()` accessor.
 */
RCT_EXTERN NSString *const RCTFBJSValueClassKey;

/**
 * @experimental
 * May be used to pre-create the JSContext to make RCTJSCExecutor creation less costly.
 * Avoid using this; it's experimental and is not likely to be supported long-term.
 */
@interface RCTJSContextProvider : NSObject

- (instancetype)initWithUseCustomJSCLibrary:(BOOL)useCustomJSCLibrary;

/**
 * Marks whether the provider uses the custom implementation of JSC and not the system one.
 */
@property (nonatomic, readonly, assign) BOOL useCustomJSCLibrary;

@end

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
 * Specify a name for the JSContext used, which will be visible in debugging tools
 * @default is "RCTJSContext"
 */
@property (nonatomic, copy) NSString *contextName;

/**
 * Inits a new executor instance with given flag that's used
 * to initialize RCTJSCWrapper.
 */
- (instancetype)initWithUseCustomJSCLibrary:(BOOL)useCustomJSCLibrary;

/**
 * @experimental
 * Pass a RCTJSContextProvider object to use an NSThread/JSContext pair that have already been created.
 * The returned executor has already executed the supplied application script synchronously.
 * The underlying JSContext will be returned in the JSContext pointer if it is non-NULL and there was no error.
 * If an error occurs, this method will return nil and specify the error in the error pointer if it is non-NULL.
 */
+ (instancetype)initializedExecutorWithContextProvider:(RCTJSContextProvider *)JSContextProvider
                                     applicationScript:(NSData *)applicationScript
                                             sourceURL:(NSURL *)sourceURL
                                             JSContext:(JSContext **)JSContext
                                                 error:(NSError **)error;

/**
 * Invokes the given module/method directly. The completion block will be called with the
 * JSValue returned by the JS context.
 *
 * Currently this does not flush the JS-to-native message queue.
 */
- (void)callFunctionOnModule:(NSString *)module
                      method:(NSString *)method
                   arguments:(NSArray *)args
             jsValueCallback:(RCTJavaScriptValueCallback)onComplete;

@end
