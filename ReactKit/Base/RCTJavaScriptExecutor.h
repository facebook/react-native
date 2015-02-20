// Copyright 2004-present Facebook. All Rights Reserved.

#import <JavaScriptCore/JavaScriptCore.h>

#import "RCTInvalidating.h"

typedef void (^RCTJavaScriptCompleteBlock)(NSError *error);
typedef void (^RCTJavaScriptCallback)(id objcValue, NSError *error);

/**
 * Abstracts away a JavaScript execution context - we may be running code in a
 * web view (for debugging purposes), or may be running code in a `JSContext`.
 */
@protocol RCTJavaScriptExecutor <RCTInvalidating>

/**
 * Executes given method with arguments on JS thread and calls the given callback
 * with JSValue and JSContext as a result of the JS module call.
 */
- (void)executeJSCall:(NSString *)name
               method:(NSString *)method
            arguments:(NSArray *)arguments
             callback:(RCTJavaScriptCallback)onComplete;

/**
 * Runs an application script, and notifies of the script load being complete via `onComplete`.
 */
- (void)executeApplicationScript:(NSString *)script
                       sourceURL:(NSURL *)url
                      onComplete:(RCTJavaScriptCompleteBlock)onComplete;

- (void)injectJSONText:(NSString *)script
   asGlobalObjectNamed:(NSString *)objectName
              callback:(RCTJavaScriptCompleteBlock)onComplete;
@end
