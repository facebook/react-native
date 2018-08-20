/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTWKWebView.h"
#import <React/RCTConvert.h>
#import "RCTAutoInsetsProtocol.h"

static NSString *const MessageHanderName = @"ReactNative";

@interface RCTWKWebView () <WKUIDelegate, WKNavigationDelegate, WKScriptMessageHandler, UIScrollViewDelegate, RCTAutoInsetsProtocol>
@property (nonatomic, copy) RCTDirectEventBlock onLoadingStart;
@property (nonatomic, copy) RCTDirectEventBlock onLoadingFinish;
@property (nonatomic, copy) RCTDirectEventBlock onLoadingError;
@property (nonatomic, copy) RCTDirectEventBlock onShouldStartLoadWithRequest;
@property (nonatomic, copy) RCTDirectEventBlock onMessage;
@property (nonatomic, copy) WKWebView *webView;
@end

@implementation RCTWKWebView
{
  UIColor * _savedBackgroundColor;
}

- (void)dealloc
{

}

/**
 * See https://developer.apple.com/library/content/documentation/Cocoa/Conceptual/DisplayWebContent/Tasks/WebKitAvail.html.
 */
+ (BOOL)dynamicallyLoadWebKitIfAvailable
{
  static BOOL _webkitAvailable=NO;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    NSBundle *webKitBundle = [NSBundle bundleWithPath:@"/System/Library/Frameworks/WebKit.framework"];
    if (webKitBundle) {
      _webkitAvailable = [webKitBundle load];
    }
  });

  return _webkitAvailable;
}


- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    super.backgroundColor = [UIColor clearColor];
    _bounces = YES;
    _scrollEnabled = YES;
    _automaticallyAdjustContentInsets = YES;
    _contentInset = UIEdgeInsetsZero;
  }
  return self;
}

- (void)didMoveToWindow
{
  if (self.window != nil) {
    if (![[self class] dynamicallyLoadWebKitIfAvailable]) {
      return;
    };

    WKWebViewConfiguration *wkWebViewConfig = [WKWebViewConfiguration new];
    wkWebViewConfig.userContentController = [WKUserContentController new];
    [wkWebViewConfig.userContentController addScriptMessageHandler: self name: MessageHanderName];
    wkWebViewConfig.allowsInlineMediaPlayback = _allowsInlineMediaPlayback;
#if WEBKIT_IOS_10_APIS_AVAILABLE
    wkWebViewConfig.mediaTypesRequiringUserActionForPlayback = _mediaPlaybackRequiresUserAction
      ? WKAudiovisualMediaTypeAll
      : WKAudiovisualMediaTypeNone;
   wkWebViewConfig.dataDetectorTypes = _dataDetectorTypes;
#endif

    _webView = [[WKWebView alloc] initWithFrame:self.bounds configuration: wkWebViewConfig];
    _webView.scrollView.delegate = self;
    _webView.UIDelegate = self;
    _webView.navigationDelegate = self;
    _webView.scrollView.scrollEnabled = _scrollEnabled;
    _webView.scrollView.bounces = _bounces;

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
    if ([_webView.scrollView respondsToSelector:@selector(setContentInsetAdjustmentBehavior:)]) {
      _webView.scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
    }
#endif

    [self addSubview:_webView];

    [self visitSource];
  }
}

- (void)setBackgroundColor:(UIColor *)backgroundColor
{
  _savedBackgroundColor = backgroundColor;
  if (_webView == nil) {
    return;
  }

  CGFloat alpha = CGColorGetAlpha(backgroundColor.CGColor);
  self.opaque = _webView.opaque = (alpha == 1.0);
  _webView.scrollView.backgroundColor = backgroundColor;
  _webView.backgroundColor = backgroundColor;
}

/**
 * This method is called whenever JavaScript running within the web view calls:
 *   - window.webkit.messageHandlers.[MessageHanderName].postMessage
 */
- (void)userContentController:(WKUserContentController *)userContentController
       didReceiveScriptMessage:(WKScriptMessage *)message
{
  if (_onMessage != nil) {
    NSMutableDictionary<NSString *, id> *event = [self baseEvent];
    [event addEntriesFromDictionary: @{@"data": message.body}];
    _onMessage(event);
  }
}

- (void)setSource:(NSDictionary *)source
{
  if (![_source isEqualToDictionary:source]) {
    _source = [source copy];

    if (_webView != nil) {
      [self visitSource];
    }
  }
}

- (void)setContentInset:(UIEdgeInsets)contentInset
{
  _contentInset = contentInset;
  [RCTView autoAdjustInsetsForView:self
                    withScrollView:_webView.scrollView
                      updateOffset:NO];
}

- (void)refreshContentInset
{
  [RCTView autoAdjustInsetsForView:self
                    withScrollView:_webView.scrollView
                      updateOffset:YES];
}

- (void)visitSource
{
  // Check for a static html source first
  NSString *html = [RCTConvert NSString:_source[@"html"]];
  if (html) {
    NSURL *baseURL = [RCTConvert NSURL:_source[@"baseUrl"]];
    if (!baseURL) {
      baseURL = [NSURL URLWithString:@"about:blank"];
    }
    [_webView loadHTMLString:html baseURL:baseURL];
    return;
  }

  NSURLRequest *request = [RCTConvert NSURLRequest:_source];
  // Because of the way React works, as pages redirect, we actually end up
  // passing the redirect urls back here, so we ignore them if trying to load
  // the same url. We'll expose a call to 'reload' to allow a user to load
  // the existing page.
  if ([request.URL isEqual:_webView.URL]) {
    return;
  }
  if (!request.URL) {
    // Clear the webview
    [_webView loadHTMLString:@"" baseURL:nil];
    return;
  }
  [_webView loadRequest:request];
}


- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView
{
  scrollView.decelerationRate = _decelerationRate;
}

- (void)setScrollEnabled:(BOOL)scrollEnabled
{
  _scrollEnabled = scrollEnabled;
  _webView.scrollView.scrollEnabled = scrollEnabled;
}

- (void)postMessage:(NSString *)message
{
  NSDictionary *eventInitDict = @{@"data": message};
  NSString *source = [NSString
    stringWithFormat:@"document.dispatchEvent(new MessageEvent('message', %@));",
    RCTJSONStringify(eventInitDict, NULL)
  ];
  [self evaluateJS: source thenCall: nil];
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  // Ensure webview takes the position and dimensions of RCTWKWebView
  _webView.frame = self.bounds;
}

- (NSMutableDictionary<NSString *, id> *)baseEvent
{
  NSDictionary *event = @{
    @"url": _webView.URL.absoluteString ?: @"",
    @"title": _webView.title,
    @"loading" : @(_webView.loading),
    @"canGoBack": @(_webView.canGoBack),
    @"canGoForward" : @(_webView.canGoForward)
  };
  return [[NSMutableDictionary alloc] initWithDictionary: event];
}

#pragma mark - WKNavigationDelegate methods

/**
 * Decides whether to allow or cancel a navigation.
 * @see https://fburl.com/42r9fxob
 */
- (void)                  webView:(WKWebView *)webView
  decidePolicyForNavigationAction:(WKNavigationAction *)navigationAction
                  decisionHandler:(void (^)(WKNavigationActionPolicy))decisionHandler
{
  static NSDictionary<NSNumber *, NSString *> *navigationTypes;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    navigationTypes = @{
      @(WKNavigationTypeLinkActivated): @"click",
      @(WKNavigationTypeFormSubmitted): @"formsubmit",
      @(WKNavigationTypeBackForward): @"backforward",
      @(WKNavigationTypeReload): @"reload",
      @(WKNavigationTypeFormResubmitted): @"formresubmit",
      @(WKNavigationTypeOther): @"other",
    };
  });

  WKNavigationType navigationType = navigationAction.navigationType;
  NSURLRequest *request = navigationAction.request;

  if (_onShouldStartLoadWithRequest) {
    NSMutableDictionary<NSString *, id> *event = [self baseEvent];
    [event addEntriesFromDictionary: @{
      @"url": (request.URL).absoluteString,
      @"navigationType": navigationTypes[@(navigationType)]
    }];
    if (![self.delegate webView:self
      shouldStartLoadForRequest:event
                   withCallback:_onShouldStartLoadWithRequest]) {
      decisionHandler(WKNavigationResponsePolicyCancel);
      return;
    }
  }

  if (_onLoadingStart) {
    // We have this check to filter out iframe requests and whatnot
    BOOL isTopFrame = [request.URL isEqual:request.mainDocumentURL];
    if (isTopFrame) {
      NSMutableDictionary<NSString *, id> *event = [self baseEvent];
      [event addEntriesFromDictionary: @{
        @"url": (request.URL).absoluteString,
        @"navigationType": navigationTypes[@(navigationType)]
      }];
      _onLoadingStart(event);
    }
  }

  // Allow all navigation by default
  decisionHandler(WKNavigationResponsePolicyAllow);
}

/**
 * Called when an error occurs while the web view is loading content.
 * @see https://fburl.com/km6vqenw
 */
- (void)               webView:(WKWebView *)webView
  didFailProvisionalNavigation:(WKNavigation *)navigation
                     withError:(NSError *)error
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
      @"didFailProvisionalNavigation": @YES,
      @"domain": error.domain,
      @"code": @(error.code),
      @"description": error.localizedDescription,
    }];
    _onLoadingError(event);
  }

  [self setBackgroundColor: _savedBackgroundColor];
}

- (void)evaluateJS:(NSString *)js
          thenCall: (void (^)(NSString*)) callback
{
  [self.webView evaluateJavaScript: js completionHandler: ^(id result, NSError *error) {
    if (error == nil && callback != nil) {
      callback([NSString stringWithFormat:@"%@", result]);
    }
  }];
}


/**
 * Called when the navigation is complete.
 * @see https://fburl.com/rtys6jlb
 */
- (void)      webView:(WKWebView *)webView
  didFinishNavigation:(WKNavigation *)navigation
{
  if (_messagingEnabled) {
    #if RCT_DEV

    // Implementation inspired by Lodash.isNative.
    NSString *isPostMessageNative = @"String(String(window.postMessage) === String(Object.hasOwnProperty).replace('hasOwnProperty', 'postMessage'))";
    [self evaluateJS: isPostMessageNative thenCall: ^(NSString *result) {
      if (! [result isEqualToString:@"true"]) {
        RCTLogError(@"Setting onMessage on a WebView overrides existing values of window.postMessage, but a previous value was defined");
      }
    }];
    #endif

    NSString *source = [NSString stringWithFormat:
      @"(function() {"
        "window.originalPostMessage = window.postMessage;"

        "window.postMessage = function(data) {"
          "window.webkit.messageHandlers.%@.postMessage(String(data));"
        "};"
      "})();",
      MessageHanderName
    ];
    [self evaluateJS: source thenCall: nil];
  }

  if (_injectedJavaScript) {
    [self evaluateJS: _injectedJavaScript thenCall: ^(NSString *jsEvaluationValue) {
      NSMutableDictionary *event = [self baseEvent];
      event[@"jsEvaluationValue"] = jsEvaluationValue;
      if (self.onLoadingFinish) {
        self.onLoadingFinish(event);
      }
    }];
  } else if (_onLoadingFinish) {
    _onLoadingFinish([self baseEvent]);
  }

  [self setBackgroundColor: _savedBackgroundColor];
}

- (void)injectJavaScript:(NSString *)script
{
  [self evaluateJS: script thenCall: nil];
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
  /**
   * When the initial load fails due to network connectivity issues,
   * [_webView reload] doesn't reload the webpage. Therefore, we must
   * manually call [_webView loadRequest:request].
   */
  NSURLRequest *request = [RCTConvert NSURLRequest:self.source];
  if (request.URL && !_webView.URL.absoluteString.length) {
    [_webView loadRequest:request];
  }
  else {
    [_webView reload];
  }
}

- (void)stopLoading
{
  [_webView stopLoading];
}

- (void)setBounces:(BOOL)bounces
{
  _bounces = bounces;
  _webView.scrollView.bounces = bounces;
}
@end
