/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

/**
 * RCTCache is a simple LRU cache implementation, based on the API of NSCache,
 * but with known, deterministic behavior. The cache will always remove items
 * outside of the specified cost/count limits, and will be automatically
 * cleared in the event of a memory warning.
 */
@interface RCTCache : NSCache <NSFastEnumeration>

/**
 * The total number of objects currently resident in the cache.
 */
@property (nonatomic, readonly) NSUInteger count;

/**
 * The total cost of the objects currently resident in the cache.
 */
@property (nonatomic, readonly) NSUInteger totalCost;

/**
 * Subscripting support
 */
- (id)objectForKeyedSubscript:(id<NSCopying>)key;
- (void)setObject:(id)obj forKeyedSubscript:(id<NSCopying>)key;

/**
 * Enumerate cached objects
 */
- (void)enumerateKeysAndObjectsUsingBlock:(void (^)(id key, id obj, BOOL *stop))block;

@end

@protocol RCTCacheDelegate <NSCacheDelegate>
@optional

/**
 * Should the specified object be evicted from the cache?
 */
- (BOOL)cache:(RCTCache *)cache shouldEvictObject:(id)entry;

/**
 * The specified object is about to be evicted from the cache.
 */
- (void)cache:(RCTCache *)cache willEvictObject:(id)entry;

@end
