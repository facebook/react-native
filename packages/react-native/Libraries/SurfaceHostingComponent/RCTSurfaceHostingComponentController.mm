/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfaceHostingComponentController.h"

#import <ComponentKit/CKComponentSubclass.h>
#import <React/RCTAssert.h>
#import <React/RCTSurface.h>
#import <React/RCTSurfaceDelegate.h>
#import <React/RCTSurfaceView.h>

#import "RCTSurfaceHostingComponent+Internal.h"
#import "RCTSurfaceHostingComponent.h"
#import "RCTSurfaceHostingComponentState.h"

@interface RCTSurfaceHostingComponentController() <RCTSurfaceDelegate>
@end

@implementation RCTSurfaceHostingComponentController {
  RCTSurface *_surface;
}

- (instancetype)initWithComponent:(RCTSurfaceHostingComponent *)component
{
  if (self = [super initWithComponent:component]) {
    [self updateSurfaceWithComponent:component];
  }

  return self;
}

#pragma mark - Lifecycle

- (void)didMount
{
  [super didMount];
  [self mountSurfaceView];
}

- (void)didRemount
{
  [super didRemount];
  [self mountSurfaceView];
}

- (void)didUpdateComponent
{
  [super didUpdateComponent];
  [self updateSurfaceWithComponent:(RCTSurfaceHostingComponent *)self.component];
}

- (void)didUnmount
{
  [super didUnmount];
  [self unmountSurfaceView];
}

#pragma mark - Helpers

- (void)updateSurfaceWithComponent:(RCTSurfaceHostingComponent *)component
{
  // Updating `surface`
  RCTSurface *const surface = component.surface;
  if (surface != _surface) {
    if (_surface.delegate == self) {
      _surface.delegate = nil;
    }

    _surface = surface;
    _surface.delegate = self;
  }
}

- (void)setIntrinsicSize:(CGSize)intrinsicSize
{
  [self.component updateState:^(RCTSurfaceHostingComponentState *state) {
    return [RCTSurfaceHostingComponentState newWithStage:state.stage
                                           intrinsicSize:intrinsicSize];
  } mode:[self suitableStateUpdateMode]];
}

- (void)setStage:(RCTSurfaceStage)stage
{
  [self.component updateState:^(RCTSurfaceHostingComponentState *state) {
    return [RCTSurfaceHostingComponentState newWithStage:stage
                                           intrinsicSize:state.intrinsicSize];
  } mode:[self suitableStateUpdateMode]];
}

- (CKUpdateMode)suitableStateUpdateMode
{
  return ((RCTSurfaceHostingComponent *)self.component).options.synchronousStateUpdates && RCTIsMainQueue() ? CKUpdateModeSynchronous : CKUpdateModeAsynchronous;
}

- (void)mountSurfaceView
{
  UIView *const surfaceView = _surface.view;

  const CKComponentViewContext &context = [[self component] viewContext];

  UIView *const superview = context.view;
  superview.clipsToBounds = YES;

  RCTAssert([superview.subviews count] <= 1, @"Should never have more than a single stateful subview.");

  UIView *const existingSurfaceView = [superview.subviews lastObject];
  if (existingSurfaceView != surfaceView) {
    [existingSurfaceView removeFromSuperview];
    surfaceView.frame = superview.bounds;
    surfaceView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [superview addSubview:surfaceView];
  }
}

- (void)unmountSurfaceView
{
  const CKComponentViewContext &context = [[self component] viewContext];

  UIView *const superview = context.view;
  RCTAssert([superview.subviews count] <= 1, @"Should never have more than a single stateful subview.");
  UIView *const existingSurfaceView = [superview.subviews lastObject];
  [existingSurfaceView removeFromSuperview];
}

#pragma mark - RCTSurfaceDelegate

- (void)surface:(RCTSurface *)surface didChangeIntrinsicSize:(CGSize)intrinsicSize
{
  [self setIntrinsicSize:intrinsicSize];
}

- (void)surface:(RCTSurface *)surface didChangeStage:(RCTSurfaceStage)stage
{
  [self setStage:stage];
}

@end
