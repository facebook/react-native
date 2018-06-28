/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTPrimitives.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTFabricSurface;

/**
 * Registry of Surfaces.
 * Incapsulates storing Surface objects and quering them by root tag.
 * All methods of the registry are thread-safe.
 * The registry stores Surface objects as weak refereces.
 */
@interface RCTSurfaceRegistry : NSObject

/**
 * Adds Surface object into the registry.
 * The registry does not retain Surface references.
 */
- (void)registerSurface:(RCTFabricSurface *)surface;

/**
 * Removes Surface object from the registry.
 */
- (void)unregisterSurface:(RCTFabricSurface *)surface;

/**
 * Returns stored Surface object by given root tag.
 * If the registry does not have such Surface registred, returns `nil`.
 */
- (nullable RCTFabricSurface *)surfaceForRootTag:(ReactTag)rootTag;

@end

NS_ASSUME_NONNULL_END
