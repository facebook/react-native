/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTInspectorPackagerConnection.h>

#if RCT_DEV || RCT_REMOTE_PROFILE

#import <React/RCTDefines.h>
#import <React/RCTInspector.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>
#import <SocketRocket/SRWebSocket.h>
#import <jsinspector-modern/InspectorPackagerConnection.h>

#import <chrono>
#import <memory>

#import "RCTCxxInspectorPackagerConnection.h"
#import "RCTCxxInspectorPackagerConnectionDelegate.h"
#import "RCTCxxInspectorWebSocketAdapter.h"
#import "RCTInspectorUtils.h"

using namespace facebook::react::jsinspector_modern;
@interface RCTCxxInspectorPackagerConnection () {
  std::unique_ptr<InspectorPackagerConnection> _cxxImpl;
}
@end

@implementation RCTCxxInspectorPackagerConnection

RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (instancetype)initWithURL:(NSURL *)url
{
  if (self = [super init]) {
    auto metadata = [RCTInspectorUtils getHostMetadata];
    _cxxImpl = std::make_unique<InspectorPackagerConnection>(
        [url absoluteString].UTF8String,
        metadata.deviceName.UTF8String,
        [[NSBundle mainBundle] bundleIdentifier].UTF8String,
        std::make_unique<RCTCxxInspectorPackagerConnectionDelegate>());
  }
  return self;
}

- (void)sendEventToAllConnections:(NSString *)event
{
  _cxxImpl->sendEventToAllConnections(event.UTF8String);
}

- (bool)isConnected
{
  return _cxxImpl->isConnected();
}

- (void)connect
{
  _cxxImpl->connect();
}

- (void)closeQuietly
{
  _cxxImpl->closeQuietly();
}

@end

#endif
