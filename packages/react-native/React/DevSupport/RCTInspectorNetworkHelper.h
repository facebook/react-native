/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#ifdef __cplusplus

#import <jsinspector-modern/ReactCdp.h>

using RCTInspectorNetworkListener = facebook::react::jsinspector_modern::NetworkRequestListener;

using RCTInspectorNetworkExecutor = facebook::react::jsinspector_modern::ScopedExecutor<RCTInspectorNetworkListener>;

using RCTInspectorLoadNetworkResourceRequest = facebook::react::jsinspector_modern::LoadNetworkResourceRequest;

/**
 * A helper class that wraps around NSURLSession to make network requests.
 */
@interface RCTInspectorNetworkHelper : NSObject
- (instancetype)init;
- (void)loadNetworkResourceWithParams:(const RCTInspectorLoadNetworkResourceRequest &)params
                             executor:(RCTInspectorNetworkExecutor)executor;
@end

#endif
