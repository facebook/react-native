// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTWebViewExecutor.h"

#import <objc/runtime.h>

#import "RCTLog.h"
#import "RCTUtils.h"

static void RCTReportError(RCTJavaScriptCallback callback, NSString *fmt, ...)
{
  va_list args;
  va_start(args, fmt);

  NSString *description = [[NSString alloc] initWithFormat:fmt arguments:args];
  RCTLogError(@"%@", description);

  NSError *error = [NSError errorWithDomain:NSStringFromClass([RCTWebViewExecutor class])
                                       code:3
                                   userInfo:@{NSLocalizedDescriptionKey:description}];
  callback(nil, error);

  va_end(args);
}

@implementation RCTWebViewExecutor
{
  NSMutableDictionary *_objectsToInject;
}

- (instancetype)initWithWebView:(UIWebView *)webView
{
  if (!webView) {
    @throw [NSException exceptionWithName:NSInvalidArgumentException reason:@"Can't init with a nil webview" userInfo:nil];
  }
  if ((self = [super init])) {
    _objectsToInject = [[NSMutableDictionary alloc] init];
    _webView = webView;
    _webView.delegate = self;
  }
  return self;
}

- (BOOL)isValid
{
  return _webView != nil;
}

- (void)invalidate
{
  _webView.delegate = nil;
  _webView = nil;
}

- (UIWebView *)invalidateAndReclaimWebView
{
  UIWebView *webView = _webView;
  [self invalidate];
  return webView;
}

- (void)executeJSCall:(NSString *)name
               method:(NSString *)method
            arguments:(NSArray *)arguments
             callback:(RCTJavaScriptCallback)onComplete
{
  RCTAssert(onComplete != nil, @"");
  [self executeBlockOnJavaScriptQueue:^{
    NSError *error;
    NSString *argsString = RCTJSONStringify(arguments, &error);
    if (!argsString) {
      RCTReportError(onComplete, @"Cannot convert argument to string: %@", error);
      return;
    }
    NSString *execString = [NSString stringWithFormat:@"JSON.stringify(require('%@').%@.apply(null, %@));", name, method, argsString];

    NSString *ret = [_webView stringByEvaluatingJavaScriptFromString:execString];
    if (ret.length == 0) {
      RCTReportError(onComplete, @"Empty return string: JavaScript error running script: %@", execString);
      return;
    }

    id objcValue = RCTJSONParse(ret, &error);
    if (!objcValue) {
      RCTReportError(onComplete, @"Cannot parse json response: %@", error);
      return;
    }
    onComplete(objcValue, nil);
  }];
}

/**
 * We cannot use the standard eval JS method. Source will not show up in the
 * debugger. So we have to use this (essentially) async API - and register
 * ourselves as the webview delegate to be notified when load is complete.
 */
- (void)executeApplicationScript:(NSString *)script
                       sourceURL:(NSURL *)url
                      onComplete:(RCTJavaScriptCompleteBlock)onComplete
{
  RCTAssertMainThread();
  RCTAssert(onComplete != nil, @"");
  _onApplicationScriptLoaded = onComplete;

  if (_objectsToInject.count > 0) {
    NSMutableString *scriptWithInjections = [[NSMutableString alloc] initWithString:@"/* BEGIN NATIVELY INJECTED OBJECTS */\n"];
    [_objectsToInject enumerateKeysAndObjectsUsingBlock:^(NSString *objectName, NSString *blockScript, BOOL *stop) {
      [scriptWithInjections appendString:objectName];
      [scriptWithInjections appendString:@" = ("];
      [scriptWithInjections appendString:blockScript];
      [scriptWithInjections appendString:@");\n"];
    }];
    [_objectsToInject removeAllObjects];
    [scriptWithInjections appendString:@"/* END NATIVELY INJECTED OBJECTS */\n"];
    [scriptWithInjections appendString:script];
    script = scriptWithInjections;
  }

  NSString *runScript =
    [NSString
      stringWithFormat:@"<html><head></head><body><script type='text/javascript'>%@</script></body></html>",
      script
    ];
  [_webView loadHTMLString:runScript baseURL:url];
}

/**
 * In order to avoid `UIWebView` thread locks, all JS executions should be
 * performed outside of the event loop that notifies the `UIWebViewDelegate`
 * that the page has loaded. This is only an issue with the remote debug mode of
 * `UIWebView`. For a production `UIWebView` deployment, this delay is
 * unnecessary and possibly harmful (or helpful?)
 *
 * The delay might not be needed as soon as the following change lands into
 * iOS7. (Review the patch linked here and search for "crash"
 * https://bugs.webkit.org/show_bug.cgi?id=125746).
 */
- (void)executeBlockOnJavaScriptQueue:(dispatch_block_t)block
{
  if (![NSThread isMainThread]) {
    [self performSelectorOnMainThread:@selector(executeBlockOnJavaScriptQueue:)
                                  withObject:block
                               waitUntilDone:YES];
  } else {
    [self performSelector:@selector(_onMainThreadExecuteBlockAfterDelay:)
               withObject:block afterDelay:0.001  // This can't be zero!
                  inModes:@[NSDefaultRunLoopMode, UITrackingRunLoopMode]];
  }
}

/**
 * This timing delay is needed to avoid crashes in WebKit when setting a
 * breakpoint or `debugger` statement and debugging via the remote Safari
 * inspector.
 */
- (void)_onMainThreadExecuteBlockAfterDelay:(dispatch_block_t)block
{
  RCTAssertMainThread();
  block();
}

/**
 * `UIWebViewDelegate` methods. Handle application script load.
 */
- (void)webViewDidFinishLoad:(UIWebView *)webView
{
  RCTAssertMainThread();
  if (_onApplicationScriptLoaded) {
    _onApplicationScriptLoaded(nil); // TODO(frantic): how to fetch error from UIWebView?
  }
  _onApplicationScriptLoaded = nil;
}

- (void)injectJSONText:(NSString *)script
   asGlobalObjectNamed:(NSString *)objectName
              callback:(RCTJavaScriptCompleteBlock)onComplete
{
  RCTAssert(!_objectsToInject[objectName], @"already injected object named %@", _objectsToInject[objectName]);
  _objectsToInject[objectName] = script;
  onComplete(nil);
}
@end
