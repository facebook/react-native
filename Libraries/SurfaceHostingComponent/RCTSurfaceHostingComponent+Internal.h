/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
