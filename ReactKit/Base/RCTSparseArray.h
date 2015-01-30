// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>

@interface RCTSparseArray : NSObject <NSCopying>

- (instancetype)init;
- (instancetype)initWithCapacity:(NSUInteger)capacity;
- (instancetype)initWithSparseArray:(RCTSparseArray *)sparseArray;

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
@property (readonly, nonatomic, copy) NSArray *allIndexes;
@property (readonly, nonatomic, copy) NSArray *allObjects;

- (void)enumerateObjectsUsingBlock:(void (^)(id obj, NSNumber *idx, BOOL *stop))block;
- (void)enumerateObjectsWithOptions:(NSEnumerationOptions)opts usingBlock:(void (^)(id obj, NSNumber *idx, BOOL *stop))block;

@end
