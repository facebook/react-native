/*
 * Copyright (c) Facebook, Inc. and its affiliates.
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

#import "RCTSurfaceBackedComponentState.h"

@implementation RCTSurfaceBackedComponent

+ (id)initialState
{
  return [RCTSurfaceBackedComponentState new];
}

+ (instancetype)newWithBridge:(RCTBridge *)bridge
                   moduleName:(NSString *)moduleName
                   properties:(NSDictionary *)properties
                      options:(RCTSurfaceHostingComponentOptions)options
{
  CKComponentScope scope(self, moduleName);

  RCTSurfaceBackedComponentState *state = scope.state();

  if (state.surface == nil || ![state.surface.moduleName isEqualToString:moduleName]) {
    RCTSurface *surface =
      [[RCTSurface alloc] initWithBridge:bridge
                              moduleName:moduleName
                       initialProperties:properties];

    [surface start];

    state = [RCTSurfaceBackedComponentState newWithSurface:surface];

    CKComponentScope::replaceState(scope, state);
  }
  else {
    if (![state.surface.properties isEqualToDictionary:properties]) {
      state.surface.properties = properties;
    }
  }

  RCTSurfaceHostingComponent *surfaceHostingComponent =
    [RCTSurfaceHostingComponent newWithSurface:state.surface
                                       options:options];

  CKComponent *component;
  if (options.activityIndicatorComponentFactory == nil || RCTSurfaceStageIsRunning(state.surface.stage)) {
    component = surfaceHostingComponent;
  } else {
    component = CK::OverlayLayoutComponentBuilder()
    .component(surfaceHostingComponent)
    .overlay(options.activityIndicatorComponentFactory())
    .build();
  }

  return [super newWithComponent:component];
}

@end
