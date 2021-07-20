/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTFabricSurfaceHostingProxyRootView.h"

#import "RCTFabricSurface.h"

@implementation RCTFabricSurfaceHostingProxyRootView

+ (id<RCTSurfaceProtocol>)createSurfaceWithBridge:(RCTBridge *)bridge
                                       moduleName:(NSString *)moduleName
                                initialProperties:(NSDictionary *)initialProperties
{
  return [[RCTFabricSurface alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

@end
