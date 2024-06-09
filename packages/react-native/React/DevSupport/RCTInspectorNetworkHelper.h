/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <jsinspector-modern/ReactCdp.h>

#import <Foundation/Foundation.h>

typedef std::shared_ptr<facebook::react::jsinspector_modern::NetworkRequestListener> RCTInspectorNetworkListener;

/**
 * A helper class that wraps around NSURLSession to make network requests.
 */
@interface RCTInspectorNetworkHelper : NSObject
- (instancetype)init;
- (void)networkRequestWithUrl:(const std::string &)url listener:(RCTInspectorNetworkListener)listener;
@end
