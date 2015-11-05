/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTDefines.h"

#if RCT_DEV // Debug executors are only supported in dev mode

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
  NSRegularExpression *_commentsRegex;
  NSRegularExpression *_scriptTagsRegex;
}

RCT_EXPORT_MODULE()

@synthesize valid = _valid;

- (instancetype)initWithWebView:(UIWebView *)webView
{
  if ((self = [super init])) {
    _webView = webView;
  }
  return self;
}

- (instancetype)init
{
  return [self initWithWebView:nil];
}

- (void)setUp
{
  if (!_webView) {
    [self executeBlockOnJavaScriptQueue:^{
      _webView = [UIWebView new];
      _webView.delegate = self;
    }];
  }

  _objectsToInject = [NSMutableDictionary new];
  _commentsRegex = [NSRegularExpression regularExpressionWithPattern:@"(^ *?\\/\\/.*?$|\\/\\*\\*[\\s\\S]*?\\*\\/)" options:NSRegularExpressionAnchorsMatchLines error:NULL];
  _scriptTagsRegex = [NSRegularExpression regularExpressionWithPattern:@"<(\\/?script[^>]*?)>" options:0 error:NULL];
}

- (void)invalidate
{
  _valid = NO;
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
    if (!self.isValid) {
      return;
    }

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
- (void)executeApplicationScript:(NSData *)script
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
  NSString *scriptString = [[NSString alloc] initWithData:script encoding:NSUTF8StringEncoding];
  __weak RCTWebViewExecutor *weakSelf = self;
  _onApplicationScriptLoaded = ^(NSError *error){
    RCTWebViewExecutor *strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }
    strongSelf->_valid = error == nil;
    onComplete(error);
  };

  if (_objectsToInject.count > 0) {
    NSMutableString *scriptWithInjections = [[NSMutableString alloc] initWithString:@"/* BEGIN NATIVELY INJECTED OBJECTS */\n"];
    [_objectsToInject enumerateKeysAndObjectsUsingBlock:
     ^(NSString *objectName, NSString *blockScript, __unused BOOL *stop) {
      [scriptWithInjections appendString:objectName];
      [scriptWithInjections appendString:@" = ("];
      [scriptWithInjections appendString:blockScript];
      [scriptWithInjections appendString:@");\n"];
    }];
    [_objectsToInject removeAllObjects];
    [scriptWithInjections appendString:@"/* END NATIVELY INJECTED OBJECTS */\n"];
    [scriptWithInjections appendString:scriptString];
    scriptString = scriptWithInjections;
  }

  scriptString = [_commentsRegex stringByReplacingMatchesInString:scriptString
                                                          options:0
                                                            range:NSMakeRange(0, script.length)
                                                     withTemplate:@""];
  scriptString = [_scriptTagsRegex stringByReplacingMatchesInString:scriptString
                                                            options:0
                                                              range:NSMakeRange(0, script.length)
                                                       withTemplate:@"\\\\<$1\\\\>"];

  NSString *runScript =
    [NSString
      stringWithFormat:@"<html><head></head><body><script type='text/javascript'>%@</script></body></html>",
      scriptString
    ];
  [_webView loadHTMLString:runScript baseURL:url];
}

- (void)executeBlockOnJavaScriptQueue:(dispatch_block_t)block
{

  if ([NSThread isMainThread]) {
    block();
  } else {
    dispatch_async(dispatch_get_main_queue(), block);
  }
}

- (void)executeAsyncBlockOnJavaScriptQueue:(dispatch_block_t)block
{
  dispatch_async(dispatch_get_main_queue(), block);
}

/**
 * `UIWebViewDelegate` methods. Handle application script load.
 */
- (void)webViewDidFinishLoad:(__unused UIWebView *)webView
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
  if (RCT_DEBUG) {
    RCTAssert(!_objectsToInject[objectName],
              @"already injected object named %@", _objectsToInject[objectName]);
  }
  _objectsToInject[objectName] = script;
  onComplete(nil);
}

@end

#endif
