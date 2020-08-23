/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfaceHostingComponent.h"
#import "RCTSurfaceHostingComponent+Internal.h"

#import <UIKit/UIKit.h>

#import <ComponentKit/CKComponentSubclass.h>
#import <React/RCTSurface.h>
#import <React/RCTSurfaceView.h>

#import "RCTSurfaceHostingComponentController.h"
#import "RCTSurfaceHostingComponentState.h"

@implementation RCTSurfaceHostingComponent

+ (Class<CKComponentControllerProtocol>)controllerClass
{
  return [RCTSurfaceHostingComponentController class];
}

+ (id)initialState
{
  return [RCTSurfaceHostingComponentState new];
}

+ (instancetype)newWithSurface:(RCTSurface *)surface options:(RCTSurfaceHostingComponentOptions)options
{
  CKComponentScope scope(self, surface);

  RCTSurfaceHostingComponentState *const state = scope.state();

  RCTSurfaceHostingComponentState *const newState =
    [RCTSurfaceHostingComponentState newWithStage:surface.stage
                                     intrinsicSize:surface.intrinsicSize];

  if (![state isEqual:newState]) {
    CKComponentScope::replaceState(scope, newState);
  }

  RCTSurfaceHostingComponent *const component =
    [super newWithView:{[UIView class]} size:{}];

  if (component) {
    component->_state = scope.state();
    component->_surface = surface;
    component->_options = options;
  }

  return component;
}

- (CKComponentLayout)computeLayoutThatFits:(CKSizeRange)constrainedSize
{
  // Optimistically communicating layout constraints to the `_surface`,
  // just to provide layout constraints to React Native as early as possible.
  // React Native *may* use this info later during applying the own state and
  // related laying out in parallel with ComponentKit execution.
  // This call will not interfere (or introduce any negative side effects) with
  // following invocation of `sizeThatFitsMinimumSize:maximumSize:`.
  // A weak point: We assume here that this particular layout will be
  // mounted eventually, which is technically not guaranteed by ComponentKit.
  // Therefore we also assume that the last layout calculated in a sequence
  // will be mounted anyways, which is probably true for all *real* use cases.
  // We plan to tackle this problem during the next big step in improving
  // interop compatibilities of React Native which will enable us granularly
  // control React Native mounting blocks and, as a result, implement
  // truly synchronous mounting stage between React Native and ComponentKit.
  [_surface setMinimumSize:constrainedSize.min
               maximumSize:constrainedSize.max];

  // Just in case of the very first building pass, we give React Native a chance
  // to prepare its internals for coming synchronous measuring.
  [_surface synchronouslyWaitForStage:RCTSurfaceStageSurfaceDidInitialLayout
                              timeout:_options.synchronousLayoutingTimeout];

  CGSize fittingSize = CGSizeZero;
  if (_surface.stage & RCTSurfaceStageSurfaceDidInitialLayout) {
    fittingSize = [_surface sizeThatFitsMinimumSize:constrainedSize.min
                                        maximumSize:constrainedSize.max];
  }
  else {
    fittingSize = _options.activityIndicatorSize;
  }

  fittingSize = constrainedSize.clamp(fittingSize);
  return {self, fittingSize};
}

- (CKComponentBoundsAnimation)boundsAnimationFromPreviousComponent:(RCTSurfaceHostingComponent *)previousComponent
{
  if (_options.boundsAnimations && (previousComponent->_state.stage != _state.stage)) {
    return {
      .mode = CKComponentBoundsAnimationModeDefault,
      .duration = 0.25,
      .options = UIViewAnimationOptionCurveEaseInOut,
    };
  }

  return {};
}

@end
