/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTDefines.h"

#if RCT_DEV // Debug executors are only supported in dev mode

#import <UIKit/UIKit.h>

#import "RCTJavaScriptExecutor.h"

/**
 * Uses an embedded web view merely for the purpose of being able to reuse the
 * existing webkit debugging tools. Fulfills the role of a very constrained
 * `JSContext`, which we call `RCTJavaScriptExecutor`.
 *
 * TODO: To ensure production-identical execution, scrub the window
 * environment. And ensure main thread operations are actually added to a queue
 * instead of being executed immediately if already on the main thread.
 */
@interface RCTWebViewExecutor : NSObject<RCTJavaScriptExecutor>

// Only one callback stored - will only be invoked for the latest issued
// application script request.
@property (nonatomic, copy) RCTJavaScriptCompleteBlock onApplicationScriptLoaded;

/**
 * Instantiate with a specific webview instance
 */
- (instancetype)initWithWebView:(UIWebView *)webView NS_DESIGNATED_INITIALIZER;

/**
 * Invoke this to reclaim the web view for reuse. This is necessary in order to
 * allow debuggers to remain open, when creating a new `RCTWebViewExecutor`.
 * This guards against the web view being invalidated, and makes sure the
 * `delegate` is cleared first.
 */
- (UIWebView *)invalidateAndReclaimWebView;

@end

#endif
