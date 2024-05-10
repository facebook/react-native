/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTCxxInspectorPackagerConnectionDelegate.h"

#if RCT_DEV || RCT_REMOTE_PROFILE

#import <dispatch/dispatch.h>

namespace facebook::react::jsinspector_modern {
RCTCxxInspectorPackagerConnectionDelegate::WebSocket::WebSocket(RCTCxxInspectorWebSocketAdapter *adapter)
    : _adapter(adapter)
{
}

void RCTCxxInspectorPackagerConnectionDelegate::WebSocket::send(std::string_view message)
{
  [_adapter send:message];
}

RCTCxxInspectorPackagerConnectionDelegate::WebSocket::~WebSocket()
{
  [_adapter close];
}

std::unique_ptr<IWebSocket> RCTCxxInspectorPackagerConnectionDelegate::connectWebSocket(
    const std::string &url,
    std::weak_ptr<IWebSocketDelegate> delegate)
{
  auto *adapter = [[RCTCxxInspectorWebSocketAdapter alloc] initWithURL:url delegate:delegate];
  return std::make_unique<WebSocket>(adapter);
}

void RCTCxxInspectorPackagerConnectionDelegate::scheduleCallback(
    std::function<void(void)> callback,
    std::chrono::milliseconds delayMs)
{
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, delayMs.count() * NSEC_PER_MSEC), dispatch_get_main_queue(), ^{
    callback();
  });
}
} // namespace facebook::react::jsinspector_modern

#endif
