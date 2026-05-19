/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDefines.h>

#if RCT_DEV || RCT_REMOTE_PROFILE

#import <jsinspector-modern/InspectorPackagerConnection.h>
#import <memory>
#import <string>

@interface RCTCxxInspectorWebSocketAdapter : NSObject
- (instancetype)initWithURL:(const std::string &)url
                   delegate:(std::weak_ptr<facebook::react::jsinspector_modern::IWebSocketDelegate>)delegate;
- (void)send:(std::string_view)message;
- (void)close;
@end

#endif
