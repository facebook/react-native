/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO(macOS ISS#2323203)

#import "RCTWebView.h"

#import <WebKit/WebKit.h>

#import "RCTAutoInsetsProtocol.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTUtils.h"
#import "RCTView.h"
#import "UIView+React.h"

NSString *const RCTJSNavigationScheme = @"react-js-navigation";
NSString *const RCTJSPostMessageHost = @"postMessage";

@interface RCTWebView () <WebFrameLoadDelegate, WebResourceLoadDelegate, RCTAutoInsetsProtocol>

@property (nonatomic, copy) RCTDirectEventBlock onLoadingStart;
@property (nonatomic, copy) RCTDirectEventBlock onLoadingFinish;
@property (nonatomic, copy) RCTDirectEventBlock onLoadingError;
@property (nonatomic, copy) RCTDirectEventBlock onShouldStartLoadWithRequest;
@property (nonatomic, copy) RCTDirectEventBlock onMessage;

@end

@implementation RCTWebView
{
  WebView *_webView;
  NSString *_injectedJavaScript;
  NSString *_pageTitle;
}

- (void)dealloc
{
  _webView.frameLoadDelegate = nil;
  _webView.resourceLoadDelegate = nil;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    CALayer *viewLayer = [CALayer layer];
    [viewLayer setBackgroundColor:[[NSColor clearColor] CGColor]]; //RGB plus Alpha Channel
    [self setWantsLayer:YES]; // view's backing store is using a Core Animation Layer
    [self setLayer:viewLayer];
    _automaticallyAdjustContentInsets = YES;
    _webView = [[WebView alloc] initWithFrame:self.bounds];
    [WebView registerURLSchemeAsLocal:RCTJSNavigationScheme];
    [_webView setFrameLoadDelegate:self];
    [_webView setResourceLoadDelegate:self];
    [self addSubview:_webView];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

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
  [_webView reload:self];
}

- (void)reactSetFrame:(CGRect)frame
{
  [super reactSetFrame:frame];
  [_webView setFrame:frame];
}

- (void)stopLoading
{
  [_webView.webFrame stopLoading];
}

- (void)postMessage:(NSString *)message
{
  NSDictionary *eventInitDict = @{
                                  @"data": message,
                                  };
  NSString *source = [NSString
                      stringWithFormat:@"document.dispatchEvent(new MessageEvent('message', %@));",
                      RCTJSONStringify(eventInitDict, NULL)
                      ];
  [_webView stringByEvaluatingJavaScriptFromString:source];
}

- (void)injectJavaScript:(NSString *)script
{
  [_webView stringByEvaluatingJavaScriptFromString:script];
}

- (void)setSource:(NSDictionary *)source
{
  if (![_source isEqualToDictionary:source]) {
    _source = [source copy];

    // Check for a static html source first
    NSString *html = [RCTConvert NSString:source[@"html"]];
    if (html) {
      NSURL *baseURL = [RCTConvert NSURL:source[@"baseUrl"]];
      if (!baseURL) {
        baseURL = [NSURL URLWithString:@"about:blank"];
      }
      [_webView.mainFrame loadHTMLString:html baseURL:baseURL];
      return;
    }

    NSURLRequest *request = [RCTConvert NSURLRequest:source];
    // Because of the way React works, as pages redirect, we actually end up
    // passing the redirect urls back here, so we ignore them if trying to load
    // the same url. We'll expose a call to 'reload' to allow a user to load
    // the existing page.
    if ([request.URL isEqual:_webView.mainFrameURL]) {
      return;
    }
    if (!request.URL) {
      // Clear the webview
      [_webView.mainFrame loadHTMLString:@"" baseURL:nil];
      return;
    }
    [_webView.mainFrame loadRequest:request];
  }
}

- (void)layout
{
  [super layout];
  _webView.frame = self.bounds;
}


- (void)refreshContentInset
{
  // leaving here to avoid warning about missing method in RCTAutoInsetsProtocol
}

- (void)setBackgroundColor:(NSColor *)backgroundColor
{
  CGFloat alpha = CGColorGetAlpha(backgroundColor.CGColor);
  [self.layer setOpaque:(alpha == 1.0)];
  [[_webView layer] setBackgroundColor:[backgroundColor CGColor]];
}

- (NSColor *)backgroundColor
{
  CGColorRef backgroundColor = _webView.layer.backgroundColor;
  if (backgroundColor) {
    return [NSColor colorWithCGColor:backgroundColor];
  }
  return nil;
}

- (NSMutableDictionary<NSString *, id> *)baseEvent
{
  NSMutableDictionary<NSString *, id> *event = [[NSMutableDictionary alloc] initWithDictionary:@{
                                                                                                 @"url": _webView.mainFrameURL ?: @"",
                                                                                                 @"loading" : @(_webView.loading),
                                                                                                 @"title": _pageTitle ?: @"",
                                                                                                 @"canGoBack": @(_webView.canGoBack),
                                                                                                 @"canGoForward" : @(_webView.canGoForward),
                                                                                                 }];

  return event;
}


#pragma mark - WebFrameLoadDelegate methods

- (void)webView:(WebView *)sender
didCommitLoadForFrame:(WebFrame *)frame
{
  if (_onLoadingStart && frame == [sender mainFrame]) {
    NSString *url = [[[[frame dataSource] request] URL] absoluteString];
    NSMutableDictionary<NSString *, id> *event = [self baseEvent];
    [event addEntriesFromDictionary: @{ @"url": url }];

    // at this point of time the web view is done resolving http->https redirects
    // and has the final uri that is going to be loaded
    // lets set it to _source to avoid unnecessary reloads when someone sets state
    // in onNavigationStateChange callback (like the RNTester WebViewExample does).
    NSMutableDictionary *s = [[NSMutableDictionary alloc] init];
    [s addEntriesFromDictionary: _source];
    [s setObject:url forKey:@"uri" ];
    _source = s;

    _onLoadingStart(event);
  }
}

- (void)webView:(WebView *)sender didReceiveTitle:(NSString *)title forFrame:(WebFrame *)frame
{
  // Report feedback only for the main frame.
  if (frame == [sender mainFrame]){
    _pageTitle = title;
  }
}

- (void)webView:(WebView *)sender
didFinishLoadForFrame:(WebFrame *)frame {

  // continue only for top level frame
  if (frame != [sender mainFrame]) {
    return;
  }

  if (_messagingEnabled) {
#if RCT_DEV
    // See isNative in lodash
    NSString *testPostMessageNative = @"String(window.postMessage) === String(Object.hasOwnProperty).replace('hasOwnProperty', 'postMessage')";
    BOOL postMessageIsNative = [
                                [_webView stringByEvaluatingJavaScriptFromString:testPostMessageNative]
                                isEqualToString:@"true"
                                ];
    if (!postMessageIsNative) {
      RCTLogError(@"Setting onMessage on a WebView overrides existing values of window.postMessage, but a previous value was defined");
    }
#endif
    NSString *source = [NSString stringWithFormat:
                        @"window.originalPostMessage = window.postMessage;"
                        "window.postMessage = function(data) {"
                        "window.location = '%@://%@?' + encodeURIComponent(String(data));"
                        "};", RCTJSNavigationScheme, RCTJSPostMessageHost
                        ];
    [_webView stringByEvaluatingJavaScriptFromString:source];
  }


  if (_injectedJavaScript != nil) {
    NSString *jsEvaluationValue = [frame.webView stringByEvaluatingJavaScriptFromString:_injectedJavaScript];

    NSMutableDictionary<NSString *, id> *event = [self baseEvent];
    event[@"jsEvaluationValue"] = jsEvaluationValue;

    _onLoadingFinish(event);
  }
  // we only need the final 'finishLoad' call so only fire the event when we're actually done loading.
  else if (_onLoadingFinish && ![frame.webView.mainFrameURL isEqualToString:@"about:blank"]) {
    _onLoadingFinish([self baseEvent]);
  }

}

- (void)webView:(__unused WebView *)sender
didFailLoadWithError:(NSError *)error
       forFrame:(__unused WebFrame *)frame
{
  if (_onLoadingError) {
    if ([error.domain isEqualToString:NSURLErrorDomain] && error.code == NSURLErrorCancelled) {
      // NSURLErrorCancelled is reported when a page has a redirect OR if you load
      // a new URL in the WebView before the previous one came back. We can just
      // ignore these since they aren't real errors.
      // http://stackoverflow.com/questions/1024748/how-do-i-fix-nsurlerrordomain-error-999-in-iphone-3-0-os
      return;
    }

    NSMutableDictionary<NSString *, id> *event = [self baseEvent];
    [event addEntriesFromDictionary:@{
                                      @"domain": error.domain,
                                      @"code": @(error.code),
                                      @"description": error.localizedDescription,
                                      }];
    _onLoadingError(event);
  }
}

- (void)webView:(WebView *)sender
willPerformClientRedirectToURL:(NSURL *)URL
          delay:(NSTimeInterval)seconds
       fireDate:(NSDate *)date
       forFrame:(WebFrame *)frame {

  BOOL isJSNavigation = [URL.scheme isEqualToString:RCTJSNavigationScheme];
  if (isJSNavigation && [URL.host isEqualToString:RCTJSPostMessageHost]) {
    NSString *data = URL.query;
    data = [data stringByReplacingOccurrencesOfString:@"+" withString:@" "];
    data = [data stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];

    NSMutableDictionary<NSString *, id> *event = [self baseEvent];
    [event addEntriesFromDictionary: @{
                                       @"data": data,
                                       }];
    _onMessage(event);
  }

}

#pragma mark - WebResourceLoadDelegate methods
- (NSURLRequest *)webView:(WebView *)sender
                 resource:(id)identifier
          willSendRequest:(NSURLRequest *)request
         redirectResponse:(NSURLResponse *)redirectResponse
           fromDataSource:(WebDataSource *)dataSource
{
  BOOL isJSNavigation = [request.URL.scheme isEqualToString:RCTJSNavigationScheme];

  // let the caller decide if they want to continue with the request
  // skip this for the JS Navigation handler
  if (!isJSNavigation && _onShouldStartLoadWithRequest) {

    NSMutableDictionary<NSString *, id> *event = [self baseEvent];
    [event addEntriesFromDictionary: @{ @"url": (request.URL).absoluteString }];
    if (![self.delegate webView:self
      shouldStartLoadForRequest:event
                   withCallback:_onShouldStartLoadWithRequest]) {

      return nil;
    }
  }

  if (isJSNavigation && [request.URL.host isEqualToString:RCTJSPostMessageHost]) {
    NSString *data = request.URL.query;
    data = [data stringByReplacingOccurrencesOfString:@"+" withString:@" "];
    data = [data stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];

    NSMutableDictionary<NSString *, id> *event = [self baseEvent];
    [event addEntriesFromDictionary: @{
                                       @"data": data,
                                       }];
    _onMessage(event);
  }

  // JS Navigation handler
  return request;
}

@end
