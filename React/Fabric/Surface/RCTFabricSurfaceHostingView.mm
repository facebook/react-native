/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTFabricSurfaceHostingView.h"

#import <React/RCTSurface.h>
#import "RCTFabricSurface.h"

@implementation RCTFabricSurfaceHostingView

- (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
               sizeMeasureMode:(RCTSurfaceSizeMeasureMode)sizeMeasureMode
{
  RCTSurface *surface = (RCTSurface *)[[RCTFabricSurface alloc] initWithBridge:bridge
                                                                    moduleName:moduleName
                                                             initialProperties:initialProperties];
  [surface start];
  return [self initWithSurface:surface sizeMeasureMode:sizeMeasureMode];
}

@end
