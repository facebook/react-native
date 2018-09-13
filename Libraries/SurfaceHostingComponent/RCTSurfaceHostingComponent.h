/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ComponentKit/CKComponent.h>
#import <RCTSurfaceHostingComponent/RCTSurfaceHostingComponentOptions.h>

@class RCTSurface;

/**
 * ComponentKit component represents given Surface instance.
 */
@interface RCTSurfaceHostingComponent : CKComponent

+ (instancetype)newWithSurface:(RCTSurface *)surface options:(RCTSurfaceHostingComponentOptions)options;

@end
