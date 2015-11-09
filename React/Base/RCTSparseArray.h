/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@interface RCTSparseArray : NSObject <NSCopying>

- (instancetype)initWithCapacity:(NSUInteger)capacity NS_DESIGNATED_INITIALIZER;
- (instancetype)initWithSparseArray:(RCTSparseArray *)sparseArray NS_DESIGNATED_INITIALIZER;

+ (instancetype)sparseArray;
+ (instancetype)sparseArrayWithCapacity:(NSUInteger)capacity;
+ (instancetype)sparseArrayWithSparseArray:(RCTSparseArray *)sparseArray;

// Use nil object to remove at idx.
- (void)setObject:(id)obj atIndexedSubscript:(NSUInteger)idx;
- (id)objectAtIndexedSubscript:(NSUInteger)idx;

// Use nil obj to remove at key.
- (void)setObject:(id)obj forKeyedSubscript:(NSNumber *)key;
- (id)objectForKeyedSubscript:(NSNumber *)key;

@property (readonly, nonatomic) NSUInteger count;
@property (readonly, nonatomic, copy) NSArray<NSNumber *> *allIndexes;
@property (readonly, nonatomic, copy) NSArray *allObjects;

- (void)enumerateObjectsUsingBlock:(void (^)(id obj, NSNumber *idx, BOOL *stop))block;
- (void)enumerateObjectsWithOptions:(NSEnumerationOptions)opts usingBlock:(void (^)(id obj, NSNumber *idx, BOOL *stop))block;

- (void)removeAllObjects;

@end
