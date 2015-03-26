/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTWebView.h"

#import <UIKit/UIKit.h>

#import "RCTAutoInsetsProtocol.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTUtils.h"
#import "RCTView.h"
#import "UIView+React.h"

@interface RCTWebView () <UIWebViewDelegate, RCTAutoInsetsProtocol>

@end

@implementation RCTWebView
{
  RCTEventDispatcher *_eventDispatcher;
  UIWebView *_webView;
}

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  if ((self = [super initWithFrame:CGRectZero])) {
    _automaticallyAdjustContentInsets = YES;
    _contentInset = UIEdgeInsetsZero;
    _eventDispatcher = eventDispatcher;
    _webView = [[UIWebView alloc] initWithFrame:self.bounds];
    _webView.delegate = self;
    [self addSubview:_webView];
  }
  return self;
}

- (void)goForward
{
  [_webView goForward];
}

- (void)goBack
{
  [_webView goBack];
}

- (void)reload
{
  [_webView reload];
}

- (void)setURL:(NSURL *)URL
{
  // Because of the way React works, as pages redirect, we actually end up
  // passing the redirect urls back here, so we ignore them if trying to load
  // the same url. We'll expose a call to 'reload' to allow a user to load
  // the existing page.
  if ([URL isEqual:_webView.request.URL]) {
    return;
  }
  if (!URL) {
    // Clear the webview
    [_webView loadHTMLString:nil baseURL:nil];
    return;
  }
  [_webView loadRequest:[NSURLRequest requestWithURL:URL]];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _webView.frame = self.bounds;
  [RCTView autoAdjustInsetsForView:self
                    withScrollView:_webView.scrollView
                      updateOffset:YES];
}

- (void)setContentInset:(UIEdgeInsets)contentInset
{
  _contentInset = contentInset;
  [RCTView autoAdjustInsetsForView:self
                    withScrollView:_webView.scrollView
                      updateOffset:NO];
}

- (NSMutableDictionary *)baseEvent
{
  NSURL *url = _webView.request.URL;
  NSString *title = [_webView stringByEvaluatingJavaScriptFromString:@"document.title"];
  NSMutableDictionary *event = [[NSMutableDictionary alloc] initWithDictionary: @{
    @"target": self.reactTag,
    @"url": url ? [url absoluteString] : @"",
    @"loading" : @(_webView.loading),
    @"title": title,
    @"canGoBack": @([_webView canGoBack]),
    @"canGoForward" : @([_webView canGoForward]),
  }];

  return event;
}

#pragma mark - UIWebViewDelegate methods

static NSString *const RCTJSAJAXScheme = @"react-ajax";

- (BOOL)webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request
 navigationType:(UIWebViewNavigationType)navigationType
{
  // We have this check to filter out iframe requests and whatnot
  BOOL isTopFrame = [request.URL isEqual:request.mainDocumentURL];
  if (isTopFrame) {
    NSMutableDictionary *event = [self baseEvent];
    [event addEntriesFromDictionary: @{
      @"url": [request.URL absoluteString],
      @"navigationType": @(navigationType)
    }];
    [_eventDispatcher sendInputEventWithName:@"topLoadingStart" body:event];
  }

  // AJAX handler
  return ![request.URL.scheme isEqualToString:RCTJSAJAXScheme];
}

- (void)webView:(UIWebView *)webView didFailLoadWithError:(NSError *)error
{
  if ([error.domain isEqualToString:NSURLErrorDomain] && error.code == NSURLErrorCancelled) {
    // NSURLErrorCancelled is reported when a page has a redirect OR if you load
    // a new URL in the WebView before the previous one came back. We can just
    // ignore these since they aren't real errors.
    // http://stackoverflow.com/questions/1024748/how-do-i-fix-nsurlerrordomain-error-999-in-iphone-3-0-os
    return;
  }

  NSMutableDictionary *event = [self baseEvent];
  [event addEntriesFromDictionary: @{
    @"domain": error.domain,
    @"code": @(error.code),
    @"description": [error localizedDescription],
  }];
  [_eventDispatcher sendInputEventWithName:@"topLoadingError" body:event];
}

- (void)webViewDidFinishLoad:(UIWebView *)webView
{
  if (_shouldInjectAJAXHandler) {

    // From http://stackoverflow.com/questions/5353278/uiwebviewdelegate-not-monitoring-xmlhttprequest

    [webView stringByEvaluatingJavaScriptFromString:[NSString stringWithFormat:@"\
      var s_ajaxListener = new Object();                       \n\
      s_ajaxListener.tempOpen = XMLHttpRequest.prototype.open; \n\
      s_ajaxListener.tempSend = XMLHttpRequest.prototype.send; \n\
      s_ajaxListener.callback = function() {                   \n\
        window.location.href = '%@://' + this.url;             \n\
      }                                                        \n\
      XMLHttpRequest.prototype.open = function(a,b) {          \n\
        s_ajaxListener.tempOpen.apply(this, arguments);        \n\
        s_ajaxListener.method = a;                             \n\
        s_ajaxListener.url = b;                                \n\
        if (a.toLowerCase() === 'get') {                       \n\
          s_ajaxListener.data = (b.split('?'))[1];             \n\
        }                                                      \n\
      }                                                        \n\
      XMLHttpRequest.prototype.send = function(a,b) {          \n\
        s_ajaxListener.tempSend.apply(this, arguments);        \n\
        if (s_ajaxListener.method.toLowerCase() === 'post') {  \n\
          s_ajaxListener.data = a;                             \n\
        }                                                      \n\
        s_ajaxListener.callback();                             \n\
      }                                                        \n\
    ", RCTJSAJAXScheme]];
  }

  // we only need the final 'finishLoad' call so only fire the event when we're actually done loading.
  if (!webView.loading && ![webView.request.URL.absoluteString isEqualToString:@"about:blank"]) {
    [_eventDispatcher sendInputEventWithName:@"topLoadingFinish" body:[self baseEvent]];
  }
}

@end
