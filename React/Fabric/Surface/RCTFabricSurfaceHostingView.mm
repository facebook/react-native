/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTFabricSurfaceHostingView.h"

#import "RCTFabricSurface.h"

@implementation RCTFabricSurfaceHostingView

- (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  RCTFabricSurface *surface = [[RCTFabricSurface alloc] initWithBridge:bridge
                                                            moduleName:moduleName
                                                     initialProperties:initialProperties];
  return [self initWithSurface:surface];
}

@end

