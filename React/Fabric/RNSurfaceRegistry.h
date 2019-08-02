/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RNPrimitives.h>

NS_ASSUME_NONNULL_BEGIN

@class RNFabricSurface;

typedef void (^RCTSurfaceEnumeratorBlock)(NSEnumerator<RNFabricSurface *> *enumerator);

/**
 * Registry of Surfaces.
 * Incapsulates storing Surface objects and querying them by root tag.
 * All methods of the registry are thread-safe.
 * The registry stores Surface objects as weak references.
 */
@interface RNSurfaceRegistry : NSObject

- (void)enumerateWithBlock:(RCTSurfaceEnumeratorBlock)block;

/**
 * Adds Surface object into the registry.
 * The registry does not retain Surface references.
 */
- (void)registerSurface:(RNFabricSurface *)surface;

/**
 * Removes Surface object from the registry.
 */
- (void)unregisterSurface:(RNFabricSurface *)surface;

/**
 * Returns stored Surface object by given root tag.
 * If the registry does not have such Surface registered, returns `nil`.
 */
- (nullable RNFabricSurface *)surfaceForRootTag:(ReactTag)rootTag;

@end

NS_ASSUME_NONNULL_END
