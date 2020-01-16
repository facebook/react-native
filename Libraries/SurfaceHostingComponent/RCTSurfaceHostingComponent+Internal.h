/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <RCTSurfaceHostingComponent/RCTSurfaceHostingComponent.h>
#import <RCTSurfaceHostingComponent/RCTSurfaceHostingComponentOptions.h>

@class RCTSurface;
@class RCTSurfaceHostingComponentState;

@interface RCTSurfaceHostingComponent ()

@property (nonatomic, strong, readonly) RCTSurface *surface;
@property (nonatomic, retain, readonly) RCTSurfaceHostingComponentState *state;
@property (nonatomic, assign, readonly) RCTSurfaceHostingComponentOptions options;

@end
