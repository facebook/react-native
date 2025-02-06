/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#ifdef __cplusplus

#import <jsinspector-modern/ReactCdp.h>

typedef facebook::react::jsinspector_modern::NetworkRequestListener RCTInspectorNetworkListener;

typedef facebook::react::jsinspector_modern::ScopedExecutor<RCTInspectorNetworkListener> RCTInspectorNetworkExecutor;

typedef facebook::react::jsinspector_modern::LoadNetworkResourceRequest RCTInspectorLoadNetworkResourceRequest;

/**
 * A helper class that wraps around NSURLSession to make network requests.
 */
@interface RCTInspectorNetworkHelper : NSObject
- (instancetype)init;
- (void)loadNetworkResourceWithParams:(const RCTInspectorLoadNetworkResourceRequest &)params
                             executor:(RCTInspectorNetworkExecutor)executor;
@end

#endif
