/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTView.h>
#import <React/RCTDefines.h>
#import <WebKit/WebKit.h>

@class RCTWKWebView;

@protocol RCTWKWebViewDelegate <NSObject>

- (BOOL)webView:(RCTWKWebView *)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
   withCallback:(RCTDirectEventBlock)callback;

@end

@interface RCTWKWebView : RCTView

@property (nonatomic, weak) id<RCTWKWebViewDelegate> delegate;
@property (nonatomic, copy) NSDictionary *source;
@property (nonatomic, assign) BOOL messagingEnabled;
@property (nonatomic, copy) NSString *injectedJavaScript;
@property (nonatomic, assign) BOOL scrollEnabled;
@property (nonatomic, assign) CGFloat decelerationRate;
@property (nonatomic, assign) BOOL allowsInlineMediaPlayback;
@property (nonatomic, assign) BOOL bounces;
@property (nonatomic, assign) BOOL mediaPlaybackRequiresUserAction;
#if WEBKIT_IOS_10_APIS_AVAILABLE
@property (nonatomic, assign) WKDataDetectorTypes dataDetectorTypes;
#endif
@property (nonatomic, assign) UIEdgeInsets contentInset;
@property (nonatomic, assign) BOOL automaticallyAdjustContentInsets;

+ (void)setClientAuthenticationCredential:(nullable NSURLCredential*)credential;
- (void)postMessage:(NSString *)message;
- (void)injectJavaScript:(NSString *)script;
- (void)goForward;
- (void)goBack;
- (void)reload;
- (void)stopLoading;

@end
