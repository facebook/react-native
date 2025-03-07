/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTCxxInspectorWebSocketAdapter.h"

#if RCT_DEV || RCT_REMOTE_PROFILE

#import <React/RCTInspector.h>
#import <React/RCTInspectorPackagerConnection.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>
#import <SocketRocket/SRWebSocket.h>
#import <jsinspector-modern/InspectorPackagerConnection.h>
#import <memory>

using namespace facebook::react::jsinspector_modern;

static const uint64_t MAX_CONNECTING_TIME_NS = 2 * 1000000000L;

namespace {
NSString *NSStringFromUTF8StringView(std::string_view view)
{
  return [[NSString alloc] initWithBytes:(const char *)view.data() length:view.size() encoding:NSUTF8StringEncoding];
}
} // namespace
@interface RCTCxxInspectorWebSocketAdapter () <SRWebSocketDelegate> {
  std::weak_ptr<IWebSocketDelegate> _delegate;
  SRWebSocket *_webSocket;
}
@end

@implementation RCTCxxInspectorWebSocketAdapter
- (instancetype)initWithURL:(const std::string &)url delegate:(std::weak_ptr<IWebSocketDelegate>)delegate
{
  if ((self = [super init])) {
    _delegate = delegate;
    _webSocket = [[SRWebSocket alloc] initWithURL:[NSURL URLWithString:NSStringFromUTF8StringView(url)]];
    _webSocket.delegate = self;
    [_webSocket open];
    uint64_t startTime = clock_gettime_nsec_np(CLOCK_MONOTONIC_RAW);
    while ([_webSocket readyState] == SR_CONNECTING) {
      if ((clock_gettime_nsec_np(CLOCK_MONOTONIC_RAW) - startTime) > MAX_CONNECTING_TIME_NS) {
        break;
      }
    }
    if ([_webSocket readyState] != SR_OPEN) {
      return nil;
    }
  }
  return self;
}

- (void)send:(std::string_view)message
{
  __weak RCTCxxInspectorWebSocketAdapter *weakSelf = self;
  NSString *messageStr = NSStringFromUTF8StringView(message);
  dispatch_async(dispatch_get_main_queue(), ^{
    RCTCxxInspectorWebSocketAdapter *strongSelf = weakSelf;
    if (strongSelf) {
      [strongSelf->_webSocket sendString:messageStr error:NULL];
    }
  });
}

- (void)close
{
  [_webSocket closeWithCode:1000 reason:@"End of session"];
}

- (void)webSocket:(__unused SRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  // NOTE: We are on the main queue here, per SRWebSocket's defaults.
  if (auto delegate = _delegate.lock()) {
    delegate->didFailWithError([error code], [error description].UTF8String);
  }
}

- (void)webSocket:(__unused SRWebSocket *)webSocket didReceiveMessageWithString:(NSString *)message
{
  // NOTE: We are on the main queue here, per SRWebSocket's defaults.
  if (auto delegate = _delegate.lock()) {
    delegate->didReceiveMessage([message UTF8String]);
  }
}

- (void)webSocket:(__unused SRWebSocket *)webSocket
    didCloseWithCode:(__unused NSInteger)code
              reason:(__unused NSString *)reason
            wasClean:(__unused BOOL)wasClean
{
  // NOTE: We are on the main queue here, per SRWebSocket's defaults.
  if (auto delegate = _delegate.lock()) {
    delegate->didClose();
  }
}

@end

#endif
