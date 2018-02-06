/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTWebView.h"

#import <WebKit/WebKit.h>

#import "RCTAutoInsetsProtocol.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTUtils.h"
#import "RCTView.h"
#import "UIView+React.h"

NSString *const RCTJSScriptMessageName = @"react-message";
NSString *const RCTJSNavigationScheme = @"react-js-navigation";
static NSString *const kPostMessageHost = @"postMessage";
static NSString *const kCookieHeaderName = @"Cookie"; // https://www.ietf.org/rfc/rfc2109.txt

/**
 * A simple weak wrapper to provide a passthrough scriptDelegate. The issue is that the WKUserContentController
 * retains a strong reference to it's delegate, which causes a retain cycle between this viewController and the
 * WKUserContentController.
 * For reference: https://stackoverflow.com/a/26383032
 */
@interface RCTWeakScriptMessageDelegate : NSObject<WKScriptMessageHandler>
@property (nonatomic, weak) id<WKScriptMessageHandler> scriptDelegate;
- (instancetype)initWithDelegate:(id<WKScriptMessageHandler>)scriptDelegate;
@end

@implementation RCTWeakScriptMessageDelegate
- (instancetype)initWithDelegate:(id<WKScriptMessageHandler>)scriptDelegate {
  self = [super init];
  if (self) {
    _scriptDelegate = scriptDelegate;
  }
  return self;
}

- (void)userContentController:(WKUserContentController *)userContentController didReceiveScriptMessage:(WKScriptMessage *)message {
  [self.scriptDelegate userContentController:userContentController didReceiveScriptMessage:message];
}
@end


@interface RCTWebView () <WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler, WKHTTPCookieStoreObserver, UIScrollViewDelegate, RCTAutoInsetsProtocol>

@property (nonatomic, copy) RCTDirectEventBlock onLoadingStart;
@property (nonatomic, copy) RCTDirectEventBlock onLoadingFinish;
@property (nonatomic, copy) RCTDirectEventBlock onLoadingError;
@property (nonatomic, copy) RCTDirectEventBlock onShouldStartLoadWithRequest;
@property (nonatomic, copy) RCTDirectEventBlock onMessage;
@property (nonatomic, copy) RCTDirectEventBlock onScroll;

@end

@implementation RCTWebView
{
  WKWebView *_webView;
  NSString *_injectedJavaScript;
}

- (void)dealloc
{
  _webView.navigationDelegate = nil;

  if ([_webView.configuration.websiteDataStore respondsToSelector:@selector(httpCookieStore)]) {
    [_webView.configuration.websiteDataStore.httpCookieStore removeObserver:self];
  }
}

- (WKWebView *)buildWebViewWithDataDetectorTypes:(WKDataDetectorTypes)dataDetectorTypes
                       allowsInlineMediaPlayback:(BOOL)allowsInlineMediaPlayback
                 mediaPlaybackRequiresUserAction:(BOOL)mediaPlaybackRequiresUserAction
{
  WKWebViewConfiguration* config = [[WKWebViewConfiguration alloc] init];
  WKUserContentController* userContentController = [[WKUserContentController alloc] init];
  [userContentController addScriptMessageHandler:[[RCTWeakScriptMessageDelegate alloc] initWithDelegate:self] name:RCTJSScriptMessageName];

  if (_scalesPageToFit) {
    [userContentController addUserScript:[RCTWebView scalesPageToFitUserScript]];
  }

  if (_messagingEnabled) {
    [userContentController addUserScript:[RCTWebView messageUserScript]];
  }

  if (_injectedJavaScript != nil) {
    WKUserScript *messageUserScript = [[WKUserScript alloc] initWithSource:_injectedJavaScript injectionTime:WKUserScriptInjectionTimeAtDocumentEnd forMainFrameOnly:YES];
    [userContentController addUserScript:messageUserScript];
  }

  config.userContentController = userContentController;

  if ([_webView.configuration.websiteDataStore respondsToSelector:@selector(httpCookieStore)]) {
    [_webView.configuration.websiteDataStore.httpCookieStore removeObserver:self];
  }

  if ([config.websiteDataStore respondsToSelector:@selector(httpCookieStore)]) {
    [config.websiteDataStore.httpCookieStore addObserver:self];
  }

  config.allowsInlineMediaPlayback = allowsInlineMediaPlayback;
  config.mediaPlaybackRequiresUserAction = mediaPlaybackRequiresUserAction;
  config.dataDetectorTypes = dataDetectorTypes;
  WKWebView *webView = [[WKWebView alloc] initWithFrame:self.bounds
                                          configuration:config];
  webView.navigationDelegate = self;
  webView.UIDelegate = self;
  if ([webView.scrollView respondsToSelector:@selector(setContentInsetAdjustmentBehavior:)]) {
    webView.scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
  }
  return webView;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    super.backgroundColor = [UIColor clearColor];
    _automaticallyAdjustContentInsets = YES;
    _contentInset = UIEdgeInsetsZero;
    _webView = [self buildWebViewWithDataDetectorTypes:WKDataDetectorTypeNone
                             allowsInlineMediaPlayback:NO
                       mediaPlaybackRequiresUserAction:YES];
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

- (void)postMessage:(NSString *)message
{
  NSDictionary *eventInitDict = @{
                                  @"data": message,
                                  };
  NSString *source = [NSString
                      stringWithFormat:@"document.dispatchEvent(new MessageEvent('message', %@));",
                      RCTJSONStringify(eventInitDict, NULL)
                      ];
  [self injectJavaScript:source];
}

- (void)injectJavaScript:(NSString *)script
{
  [_webView evaluateJavaScript:script completionHandler:^(__unused id result, NSError *error) {
    if (error) {
      RCTLogError(@"Failed to evaluate JavaScript: \"%@\" with error: %@", script, error);
    }
  }];
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
      if (@available(macOS 10.13, iOS 11.0, *)) {
        [self syncCookiesForURL:baseURL completionHandler:^{
          [_webView loadHTMLString:html baseURL:baseURL];
        }];
      } else {
        [_webView loadHTMLString:html baseURL:baseURL];
      }
      return;
    }

    NSURLRequest *request = [RCTConvert NSURLRequest:source];
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

    if (@available(macOS 10.13, iOS 11.0, *)) {
      [self syncCookiesForURL:request.URL completionHandler:^{
        [_webView loadRequest:request];
      }];
    } else {
      NSURLRequest *requestWithCookies = [self attachCookiesToRequest:request];
      [_webView loadRequest:requestWithCookies];
    }
  }
}

/**
 * Copies the cookies from NSHTTPCookiesStorage.sharedHTTPCookieStorage to WKHTTPCookieStore for the URL.
 *
 * iOS 11 and later.
 */
- (void)syncCookiesForURL:(NSURL*)url completionHandler:(void (^)())completionHandler NS_AVAILABLE_IOS(11_0)
{
  dispatch_group_t serviceGroup = dispatch_group_create();

  NSArray<NSHTTPCookie *> *cookies = [NSHTTPCookieStorage.sharedHTTPCookieStorage cookiesForURL:url];
  for (NSHTTPCookie *cookie in cookies) {
    dispatch_group_enter(serviceGroup);
    [_webView.configuration.websiteDataStore.httpCookieStore setCookie:cookie completionHandler:^{
      dispatch_group_leave(serviceGroup);
    }];
  }

  dispatch_group_notify(serviceGroup, dispatch_get_main_queue(), ^{
    completionHandler();
  });
}

- (NSURLRequest*)attachCookiesToRequest:(NSURLRequest*)request
{
  if (!request.URL) {
    return request;
  }

  NSMutableURLRequest* result = [request mutableCopy];
  NSArray* cookies = [[NSHTTPCookieStorage sharedHTTPCookieStorage] cookiesForURL:request.URL];
  NSDictionary* cookiesHeaders = [NSHTTPCookie requestHeaderFieldsWithCookies:cookies];
  [result setValue:cookiesHeaders[kCookieHeaderName] forHTTPHeaderField:kCookieHeaderName];

  return result;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _webView.frame = self.bounds;
}

- (void)setContentInset:(UIEdgeInsets)contentInset
{
  _contentInset = contentInset;
  [RCTView autoAdjustInsetsForView:self
                    withScrollView:_webView.scrollView
                      updateOffset:NO];
}

- (void)setScalesPageToFit:(BOOL)scalesPageToFit
{
  if (_scalesPageToFit != scalesPageToFit) {
    _scalesPageToFit = scalesPageToFit;
    WKWebView *webView = [self buildWebViewWithDataDetectorTypes:self.dataDetectorTypes
                                       allowsInlineMediaPlayback:self.allowsInlineMediaPlayback
                                 mediaPlaybackRequiresUserAction:self.mediaPlaybackRequiresUserAction];
    [self updateWebView:webView];
  }
}

- (void)setInjectedJavaScript:(NSString *)injectedJavaScript
{
  if (![_injectedJavaScript isEqualToString:injectedJavaScript]) {
    _injectedJavaScript = injectedJavaScript;
    WKWebView *webView = [self buildWebViewWithDataDetectorTypes:self.dataDetectorTypes
                                       allowsInlineMediaPlayback:self.allowsInlineMediaPlayback
                                 mediaPlaybackRequiresUserAction:self.mediaPlaybackRequiresUserAction];
    [self updateWebView:webView];
  }
}

- (void)setMessagingEnabled:(BOOL)messagingEnabled
{
  if (_messagingEnabled != messagingEnabled) {
    _messagingEnabled = messagingEnabled;
    WKWebView *webView = [self buildWebViewWithDataDetectorTypes:self.dataDetectorTypes
                                       allowsInlineMediaPlayback:self.allowsInlineMediaPlayback
                                 mediaPlaybackRequiresUserAction:self.mediaPlaybackRequiresUserAction];
    [self updateWebView:webView];
  }
}

- (void)setBackgroundColor:(UIColor *)backgroundColor
{
  CGFloat alpha = CGColorGetAlpha(backgroundColor.CGColor);
  self.opaque = _webView.opaque = (alpha == 1.0);
  _webView.backgroundColor = backgroundColor;
}

- (UIColor *)backgroundColor
{
  return _webView.backgroundColor;
}

- (void)setAllowsInlineMediaPlayback:(BOOL)allowsInlineMediaPlayback
{
  if (self.allowsInlineMediaPlayback != allowsInlineMediaPlayback) {
    WKWebView *webView = [self buildWebViewWithDataDetectorTypes:self.dataDetectorTypes
                                       allowsInlineMediaPlayback:allowsInlineMediaPlayback
                                 mediaPlaybackRequiresUserAction:self.mediaPlaybackRequiresUserAction];
    [self updateWebView:webView];
  }
}

- (BOOL)allowsInlineMediaPlayback
{
  return _webView.configuration.allowsInlineMediaPlayback;
}

- (void)setMediaPlaybackRequiresUserAction:(BOOL)mediaPlaybackRequiresUserAction
{
  if (self.mediaPlaybackRequiresUserAction != mediaPlaybackRequiresUserAction) {
    WKWebView *webView = [self buildWebViewWithDataDetectorTypes:self.dataDetectorTypes
                                       allowsInlineMediaPlayback:self.allowsInlineMediaPlayback
                                 mediaPlaybackRequiresUserAction:mediaPlaybackRequiresUserAction];
    [self updateWebView:webView];
  }
}

- (BOOL)mediaPlaybackRequiresUserAction
{
  return _webView.configuration.mediaPlaybackRequiresUserAction;
}

- (void)setDataDetectorTypes:(WKDataDetectorTypes)dataDetectorTypes
{
  if (self.dataDetectorTypes != dataDetectorTypes) {
    WKWebView *webView = [self buildWebViewWithDataDetectorTypes:dataDetectorTypes
                                       allowsInlineMediaPlayback:self.allowsInlineMediaPlayback
                                 mediaPlaybackRequiresUserAction:self.mediaPlaybackRequiresUserAction];
    [self updateWebView:webView];
  }
}

- (WKDataDetectorTypes)dataDetectorTypes
{
  return _webView.configuration.dataDetectorTypes;
}

- (void)refreshContentInset
{
  [RCTView autoAdjustInsetsForView:self
                    withScrollView:_webView.scrollView
                      updateOffset:YES];
}

- (NSMutableDictionary<NSString *, id> *)baseEvent
{
  NSMutableDictionary<NSString *, id> *event = [[NSMutableDictionary alloc] initWithDictionary:@{
                                                                                                 @"url": _webView.URL.absoluteString ?: @"",
                                                                                                 @"loading": @(_webView.loading),
                                                                                                 @"title": _webView.title,
                                                                                                 @"canGoBack": @(_webView.canGoBack),
                                                                                                 @"canGoForward": @(_webView.canGoForward),
                                                                                                 }];

  return event;
}

- (void)updateWebView:(WKWebView *)webView
{
  if (webView != nil) {
    [_webView removeFromSuperview];
    _webView.navigationDelegate = nil;
    _webView.UIDelegate = nil;
    _webView.scrollView.delegate = self;
    _webView = webView;
    [self addSubview:_webView];
    [self reload];
  }
}

  #pragma mark - UIScrollViewDelegate methods

  - (void)scrollViewDidScroll:(UIScrollView *)scrollView
  {
    NSDictionary *event = @{
      @"contentOffset": @{
        @"x": @(scrollView.contentOffset.x),
        @"y": @(scrollView.contentOffset.y)
      },
      @"contentInset": @{
        @"top": @(scrollView.contentInset.top),
        @"left": @(scrollView.contentInset.left),
        @"bottom": @(scrollView.contentInset.bottom),
        @"right": @(scrollView.contentInset.right)
      },
      @"contentSize": @{
        @"width": @(scrollView.contentSize.width),
        @"height": @(scrollView.contentSize.height)
      },
      @"layoutMeasurement": @{
        @"width": @(scrollView.frame.size.width),
        @"height": @(scrollView.frame.size.height)
      },
      @"zoomScale": @(scrollView.zoomScale ?: 1),
    };

    _onScroll(event);
  }

#pragma mark - WKNavigationDelegate methods

- (void)webView:(__unused WKWebView *)webView decidePolicyForNavigationAction:(WKNavigationAction *)navigationAction decisionHandler:(void (^)(WKNavigationActionPolicy))decisionHandler {
  BOOL isJSNavigation = [navigationAction.request.URL.scheme isEqualToString:RCTJSNavigationScheme];

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

  // skip this for the JS Navigation handler
  if (!isJSNavigation && _onShouldStartLoadWithRequest) {
    NSMutableDictionary<NSString *, id> *event = [self baseEvent];
    [event addEntriesFromDictionary: @{
                                       @"url": navigationAction.request.URL.absoluteString ?: @"",
                                       @"navigationType": navigationTypes[@(navigationAction.navigationType)]
                                       }];
    if (![self.delegate webView:self
      shouldStartLoadForRequest:event
                   withCallback:_onShouldStartLoadWithRequest]) {
      decisionHandler(WKNavigationActionPolicyCancel);
      return;
    }
  }

  if (_onLoadingStart) {
    // We have this check to filter out iframe requests and whatnot
    BOOL isTopFrame = [navigationAction.request.URL isEqual:navigationAction.request.mainDocumentURL];
    if (isTopFrame) {
      NSMutableDictionary<NSString *, id> *event = [self baseEvent];
      [event addEntriesFromDictionary: @{
                                         @"url": navigationAction.request.URL.absoluteString ?: @"",
                                         @"navigationType": navigationTypes[@(navigationAction.navigationType)]
                                         }];
      _onLoadingStart(event);
    }
  }

  if (isJSNavigation && [navigationAction.request.URL.host isEqualToString:kPostMessageHost]) {
    NSString *data = navigationAction.request.URL.query;
    data = [data stringByReplacingOccurrencesOfString:@"+" withString:@" "];
    data = [data stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];

    NSMutableDictionary<NSString *, id> *event = [self baseEvent];
    [event addEntriesFromDictionary: @{
                                       @"data": data,
                                       }];

    NSString *source = @"document.dispatchEvent(new MessageEvent('message:received'));";
    [_webView evaluateJavaScript:source completionHandler:^(__unused id result, NSError *error) {
      if (error) {
        RCTLogError(@"Failed to evaluate JavaScript: \"%@\" with error: %@", source, error);
      }
      _onMessage(event);
    }];
  }

  // JS Navigation handler
  decisionHandler(isJSNavigation ? WKNavigationActionPolicyCancel : WKNavigationActionPolicyAllow);
}

- (void)webView:(__unused WKWebView *)webView didFailNavigation:(__unused WKNavigation *)navigation withError:(NSError *)error {
  if (_onLoadingError) {
    if ([error.domain isEqualToString:NSURLErrorDomain] && error.code == NSURLErrorCancelled) {
      // NSURLErrorCancelled is reported when a page has a redirect OR if you load
      // a new URL in the WebView before the previous one came back. We can just
      // ignore these since they aren't real errors.
      // http://stackoverflow.com/questions/1024748/how-do-i-fix-nsurlerrordomain-error-999-in-iphone-3-0-os
      return;
    }

    if ([error.domain isEqualToString:@"WebKitErrorDomain"] && error.code == 102) {
      // Error code 102 "Frame load interrupted" is raised by the UIWebView if
      // its delegate returns FALSE from webView:shouldStartLoadWithRequest:navigationType
      // when the URL is from an http redirect. This is a common pattern when
      // implementing OAuth with a WebView.
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

- (void)webView:(__unused WKWebView *)webView didFinishNavigation:(__unused WKNavigation *)navigation
{
#if RCT_DEV
  if (_messagingEnabled) {
    // See isNative in lodash
    NSString *testPostMessageNative = @"String(window.postMessage) === String(Object.hasOwnProperty).replace('hasOwnProperty', 'postMessage')";
    [_webView evaluateJavaScript:testPostMessageNative completionHandler:^(id result, NSError *error) {
      if (error) {
        RCTLogError(@"Failed to evaluate JavaScript: \"%@\" with error: %@", testPostMessageNative, error);
      } else {
        NSString *resultString = [NSString stringWithFormat:@"%@", result];
        if (![resultString isEqualToString:@"true"]) {
          RCTLogError(@"Setting onMessage on a WebView overrides existing values of window.postMessage, but a previous value was defined");
        }
      }
    }];
  }
#endif

  // we only need the final 'finishLoad' call so only fire the event when we're actually done loading.
  if (_onLoadingFinish && !webView.loading && ![webView.URL.absoluteString isEqualToString:@"about:blank"]) {
    _onLoadingFinish([self baseEvent]);
  }
}

#pragma mark - WKUIDelegate

- (WKWebView *)webView:(WKWebView *)webView
createWebViewWithConfiguration:(__unused WKWebViewConfiguration *)configuration
   forNavigationAction:(WKNavigationAction *)navigationAction
        windowFeatures:(__unused WKWindowFeatures *)windowFeatures
{
  // Override the action if opening a new webView, signaled by the navigationAction having a nil
  // or non-mainFrame targetFrame.
  if (!navigationAction.targetFrame.isMainFrame) {
    [webView loadRequest:navigationAction.request];
  }

  return nil;
}

- (void)webView:(__unused WKWebView *)webView runJavaScriptAlertPanelWithMessage:(NSString *)message initiatedByFrame:(__unused WKFrameInfo *)frame completionHandler:(void (^)(void))completionHandler
{
  UIAlertController *alertController = [UIAlertController alertControllerWithTitle:nil message:message preferredStyle:UIAlertControllerStyleAlert];
  [alertController addAction:[UIAlertAction actionWithTitle:NSLocalizedString(@"OK", nil) style:UIAlertActionStyleDefault handler:^(__unused UIAlertAction *action) {
    completionHandler();
  }]];
  UIViewController *presentedController = RCTPresentedViewController();
  [presentedController presentViewController:alertController animated:YES completion:nil];
}

- (void)webView:(__unused WKWebView *)webView runJavaScriptConfirmPanelWithMessage:(NSString *)message initiatedByFrame:(__unused WKFrameInfo *)frame completionHandler:(void (^)(BOOL))completionHandler
{
  UIAlertController *alertController = [UIAlertController alertControllerWithTitle:@"" message:message preferredStyle:UIAlertControllerStyleAlert];
  [alertController addAction:[UIAlertAction actionWithTitle:NSLocalizedString(@"Cancel", nil) style:UIAlertActionStyleDefault handler:^(__unused UIAlertAction *action) {
    completionHandler(NO);
  }]];
  [alertController addAction:[UIAlertAction actionWithTitle:NSLocalizedString(@"OK", nil) style:UIAlertActionStyleDefault handler:^(__unused UIAlertAction *action) {
    completionHandler(YES);
  }]];
  UIViewController *presentedController = RCTPresentedViewController();
  [presentedController presentViewController:alertController animated:YES completion:nil];
}

- (void)webView:(__unused WKWebView *)webView runJavaScriptTextInputPanelWithPrompt:(NSString *)prompt defaultText:(NSString *)defaultText initiatedByFrame:(__unused WKFrameInfo *)frame completionHandler:(void (^)(NSString * _Nullable))completionHandler
{
  UIAlertController *alertController = [UIAlertController alertControllerWithTitle:@"" message:prompt preferredStyle:UIAlertControllerStyleAlert];
  [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
    textField.text = defaultText;
  }];
  [alertController addAction:[UIAlertAction actionWithTitle:NSLocalizedString(@"Cancel", nil) style:UIAlertActionStyleCancel handler:^(__unused UIAlertAction *action) {
    completionHandler(nil);
  }]];
  [alertController addAction:[UIAlertAction actionWithTitle:NSLocalizedString(@"OK", nil) style:UIAlertActionStyleDefault handler:^(__unused UIAlertAction *action) {
    NSString *input = ((UITextField *)alertController.textFields.firstObject).text;
    completionHandler(input);
  }]];
  UIViewController *presentedController = RCTPresentedViewController();
  [presentedController presentViewController:alertController animated:YES completion:nil];
}

#pragma mark - WKScriptMessageHandler

- (void)userContentController:(nonnull __unused WKUserContentController *)userContentController didReceiveScriptMessage:(nonnull WKScriptMessage *)message
{
  if(_onMessage) {
    NSMutableDictionary<NSString *, id> *event = [self baseEvent];
    [event addEntriesFromDictionary:@{
                                      @"name" : message.name,
                                      @"body" : message.body
                                      }];
    _onMessage(event);
  }
}

#pragma mark - WKHTTPCookieStoreObserver

- (void)cookiesDidChangeInCookieStore:(WKHTTPCookieStore *)cookieStore NS_AVAILABLE_IOS(11_0)
{
  [cookieStore getAllCookies:^(NSArray<NSHTTPCookie *> *cookies) {
    for (NSHTTPCookie *cookie in cookies) {
      [[NSHTTPCookieStorage sharedHTTPCookieStorage] setCookie:cookie];
    }
  }];
}

#pragma mark - static WKUserScripts

+ (WKUserScript *) scalesPageToFitUserScript
{
  static WKUserScript *script;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *source = @"var meta = document.createElement('meta'); meta.setAttribute('name', 'viewport'); meta.setAttribute('content', 'width=device-width'); document.getElementsByTagName('head')[0].appendChild(meta);";
    script = [[WKUserScript alloc] initWithSource:source injectionTime:WKUserScriptInjectionTimeAtDocumentEnd forMainFrameOnly:YES];
  });
  return script;
}

+ (WKUserScript *) messageUserScript
{
  static WKUserScript *script;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *source = [NSString stringWithFormat:
                        @"(function() {"
                        "window.originalPostMessage = window.postMessage;"

                        "var messageQueue = [];"
                        "var messagePending = false;"

                        "function processQueue() {"
                        "if (!messageQueue.length || messagePending) return;"
                        "messagePending = true;"
                        "window.location = '%@://%@?' + encodeURIComponent(messageQueue.shift());"
                        "}"

                        "window.postMessage = function(data) {"
                        "messageQueue.push(String(data));"
                        "processQueue();"
                        "};"

                        "document.addEventListener('message:received', function(e) {"
                        "messagePending = false;"
                        "processQueue();"
                        "});"
                        "})();", RCTJSNavigationScheme, kPostMessageHost
                        ];
    script = [[WKUserScript alloc] initWithSource:source injectionTime:WKUserScriptInjectionTimeAtDocumentEnd forMainFrameOnly:YES];
  });
  return script;
}

@end

