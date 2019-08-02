/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNFabricSurfaceHostingProxyRootView.h"

#import "RNFabricSurface.h"

@implementation RNFabricSurfaceHostingProxyRootView

+ (RCTSurface *)createSurfaceWithBridge:(RCTBridge *)bridge
                             moduleName:(NSString *)moduleName
                      initialProperties:(NSDictionary *)initialProperties
{
  return (RCTSurface *)[[RNFabricSurface alloc] initWithBridge:bridge
                                                    moduleName:moduleName
                                             initialProperties:initialProperties];
}

@end
