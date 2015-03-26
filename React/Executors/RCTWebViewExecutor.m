/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

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

@interface RCTWebViewExecutor () <UIWebViewDelegate>

@end

@implementation RCTWebViewExecutor
{
  UIWebView *_webView;
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

- (id)init
{
  return [self initWithWebView:[[UIWebView alloc] init]];
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
  if (![NSThread isMainThread]) {
    dispatch_sync(dispatch_get_main_queue(), ^{
      [self executeApplicationScript:script sourceURL:url onComplete:onComplete];
    });
    return;
  }

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
  dispatch_time_t when = dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_MSEC);

  dispatch_after(when, dispatch_get_main_queue(), ^{
    RCTAssertMainThread();
    block();
  });
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
  RCTAssert(!_objectsToInject[objectName],
            @"already injected object named %@", _objectsToInject[objectName]);
  _objectsToInject[objectName] = script;
  onComplete(nil);
}
@end
