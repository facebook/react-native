/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfaceBackedComponent.h"

#import <UIKit/UIKit.h>

#import <ComponentKit/CKComponentSubclass.h>
#import <ComponentKit/CKOverlayLayoutComponent.h>
#import <RCTSurfaceHostingComponent/RCTSurfaceHostingComponent.h>
#import <React/RCTSurface.h>
#import <React/RCTFabricSurface.h>

#import "RCTSurfaceBackedComponentState.h"

@implementation RCTSurfaceBackedComponent

+ (id)initialState
{
  return [RCTSurfaceBackedComponentState new];
}

+ (instancetype)newWithBridge:(RCTBridge *)bridge
             surfacePresenter:(RCTSurfacePresenter *)surfacePresenter
                   moduleName:(NSString *)moduleName
                   properties:(NSDictionary *)properties
                      options:(RCTSurfaceHostingComponentOptions)options
{
  CKComponentScope scope(self, moduleName);

  RCTSurfaceBackedComponentState *state = scope.state();

  // JavaScript entrypoints expects "fabric" key for Fabric surfaces
  NSMutableDictionary *adjustedProperties = [[NSMutableDictionary alloc] initWithDictionary:properties];
  adjustedProperties[@"fabric"] = surfacePresenter ? @YES : nil;

  if (state.surface == nil || ![state.surface.moduleName isEqualToString:moduleName]) {
    id<RCTSurfaceProtocol> surface;
    if (surfacePresenter) {
      surface = [[RCTFabricSurface alloc] initWithSurfacePresenter:surfacePresenter
                                              moduleName:moduleName
                                              initialProperties:adjustedProperties];
    } else {
      surface = [[RCTSurface alloc] initWithBridge:bridge
                                moduleName:moduleName
                         initialProperties:adjustedProperties];
    }
    [surface start];

    state = [RCTSurfaceBackedComponentState newWithSurface:surface];

    CKComponentScope::replaceState(scope, state);
  }
  else {
    if (![state.surface.properties isEqualToDictionary:adjustedProperties]) {
      state.surface.properties = adjustedProperties;
    }
  }

  RCTSurfaceHostingComponent *surfaceHostingComponent =
    [RCTSurfaceHostingComponent newWithSurface:state.surface
                                       options:options];

  CKComponent *component;
  if (options.activityIndicatorComponentFactory == nil || RCTSurfaceStageIsRunning(state.surface.stage)) {
    component = surfaceHostingComponent;
  } else {
    component = [[CKOverlayLayoutComponent alloc] initWithComponent:surfaceHostingComponent
                                                            overlay:options.activityIndicatorComponentFactory()];
  }

  return [super newWithComponent:component];
}

@end
