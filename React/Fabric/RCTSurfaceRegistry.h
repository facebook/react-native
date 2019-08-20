/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTPrimitives.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTFabricSurface;

typedef void (^RCTSurfaceEnumeratorBlock)(NSEnumerator<RCTFabricSurface *> *enumerator);

/**
 * Registry of Surfaces.
 * Incapsulates storing Surface objects and querying them by root tag.
 * All methods of the registry are thread-safe.
 * The registry stores Surface objects as weak references.
 */
@interface RCTSurfaceRegistry : NSObject

- (void)enumerateWithBlock:(RCTSurfaceEnumeratorBlock)block;

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
 * If the registry does not have such Surface registered, returns `nil`.
 */
- (nullable RCTFabricSurface *)surfaceForRootTag:(ReactTag)rootTag;

@end

NS_ASSUME_NONNULL_END
