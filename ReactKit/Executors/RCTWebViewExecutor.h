// Copyright 2004-present Facebook. All Rights Reserved.

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
@interface RCTWebViewExecutor : NSObject<RCTJavaScriptExecutor, UIWebViewDelegate>

@property (nonatomic, readwrite, strong) UIWebView *webView;

// Only one callback stored - will only be invoked for the latest issued
// application script request.
@property (nonatomic, readwrite, copy) RCTJavaScriptCompleteBlock onApplicationScriptLoaded;

- (instancetype)initWithWebView:(UIWebView *)webView;

/**
 * Invoke this to reclaim the web view for reuse. This is necessary in order to
 * allow debuggers to remain open, when creating a new `RCTWebViewExecutor`.
 * This guards against the web view being invalidated, and makes sure the
 * `delegate` is cleared first.
 */
- (UIWebView *)invalidateAndReclaimWebView;

@end
