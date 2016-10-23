/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTView.h"

@class RCTWKWebView;

@protocol RCTWKWebViewDelegate <NSObject>

- (BOOL)webView:(RCTWKWebView *)webView
    shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
                 withCallback:(RCTDirectEventBlock)callback;

@end

@interface RCTWKWebView : RCTView

@property(nonatomic, weak) id<RCTWKWebViewDelegate> delegate;

@property(nonatomic, copy) NSDictionary *source;
@property(nonatomic, assign) UIEdgeInsets contentInset;
@property(nonatomic, assign) BOOL automaticallyAdjustContentInsets;
@property(nonatomic, copy) NSString *injectedJavaScript;

- (void)goForward;
- (void)goBack;
- (void)reload;
- (void)stopLoading;

@end
