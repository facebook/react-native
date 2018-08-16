#import "RCTWKWebView.h"

#import <WebKit/WebKit.h>

#import <React/RCTConvert.h>

#import "RCTAutoInsetsProtocol.h"

@interface RCTWKWebView () <WKUIDelegate, WKNavigationDelegate>
@property (nonatomic, copy) RCTDirectEventBlock onLoadingStart;
@property (nonatomic, copy) RCTDirectEventBlock onLoadingFinish;
@property (nonatomic, copy) RCTDirectEventBlock onLoadingError;
@property (nonatomic, copy) WKWebView *webView;
@end

@implementation RCTWKWebView
{
}

- (void)dealloc
{

}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    super.backgroundColor = [UIColor clearColor];
    _webView = [[WKWebView alloc] initWithFrame:self.bounds];
    _webView.UIDelegate = self;
    _webView.navigationDelegate = self;
    [self addSubview:_webView];
  }
  return self;
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
      [_webView loadHTMLString:html baseURL:baseURL];
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
    [_webView loadRequest:request];
  }
}

- (void)layoutSubviews
{
  [super layoutSubviews];
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
}

- (void)evaluateJS:(NSString *)js
          thenCall: (void (^)(NSString*)) callback
{
  [self.webView evaluateJavaScript: js completionHandler: ^(id result, NSError *error) {
    if (error == nil) {
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
}

@end
