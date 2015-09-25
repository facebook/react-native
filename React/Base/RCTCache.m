/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

// Adapted from https://github.com/nicklockwood/OSCache

#import "RCTCache.h"

#import "RCTAssert.h"

#import <TargetConditionals.h>
#if TARGET_OS_IPHONE
#import <UIKit/UIKit.h>
#endif

@interface RCTCacheEntry : NSObject

@property (nonatomic, strong) NSObject *object;
@property (nonatomic, assign) NSUInteger cost;
@property (nonatomic, assign) NSInteger sequenceNumber;

@end

@implementation RCTCacheEntry

@end

@interface RCTCache_Private : NSObject

@property (nonatomic, unsafe_unretained) id<RCTCacheDelegate> delegate;
@property (nonatomic, assign) NSUInteger countLimit;
@property (nonatomic, assign) NSUInteger totalCostLimit;
@property (nonatomic, copy) NSString *name;

@property (nonatomic, strong) NSMutableDictionary *cache;
@property (nonatomic, assign) NSUInteger totalCost;
@property (nonatomic, assign) NSInteger sequenceNumber;

@end

@implementation RCTCache_Private
{
  BOOL _delegateRespondsToWillEvictObject;
  BOOL _delegateRespondsToShouldEvictObject;
  BOOL _currentlyCleaning;
  NSMutableArray *_entryPool;
  NSLock *_lock;
}

- (instancetype)init
{
  if ((self = [super init]))
  {
    //create storage
    _cache = [NSMutableDictionary new];
    _entryPool = [NSMutableArray new];
    _lock = [NSLock new];
    _totalCost = 0;

#if TARGET_OS_IPHONE

    //clean up in the event of a memory warning
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(cleanUpAllObjects) name:UIApplicationDidReceiveMemoryWarningNotification object:nil];

#endif

  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)setDelegate:(id<RCTCacheDelegate>)delegate
{
  _delegate = delegate;
  _delegateRespondsToShouldEvictObject = [delegate respondsToSelector:@selector(cache:shouldEvictObject:)];
  _delegateRespondsToWillEvictObject = [delegate respondsToSelector:@selector(cache:willEvictObject:)];
}

- (void)setCountLimit:(NSUInteger)countLimit
{
  [_lock lock];
  _countLimit = countLimit;
  [_lock unlock];
  [self cleanUp:NO];
}

- (void)setTotalCostLimit:(NSUInteger)totalCostLimit
{
  [_lock lock];
  _totalCostLimit = totalCostLimit;
  [_lock unlock];
  [self cleanUp:NO];
}

- (NSUInteger)count
{
  return _cache.count;
}

- (void)cleanUp:(BOOL)keepEntries
{
  [_lock lock];
  NSUInteger maxCount = _countLimit ?: INT_MAX;
  NSUInteger maxCost = _totalCostLimit ?: INT_MAX;
  NSUInteger totalCount = _cache.count;
  NSMutableArray *keys = [_cache.allKeys mutableCopy];
  while (totalCount > maxCount || _totalCost > maxCost)
  {
    NSInteger lowestSequenceNumber = INT_MAX;
    RCTCacheEntry *lowestEntry = nil;
    id lowestKey = nil;

    //remove oldest items until within limit
    for (id key in keys)
    {
      RCTCacheEntry *entry = _cache[key];
      if (entry.sequenceNumber < lowestSequenceNumber)
      {
        lowestSequenceNumber = entry.sequenceNumber;
        lowestEntry = entry;
        lowestKey = key;
      }
    }

    if (lowestKey)
    {
      [keys removeObject:lowestKey];
      if (!_delegateRespondsToShouldEvictObject ||
          [_delegate cache:(RCTCache *)self shouldEvictObject:lowestEntry.object])
      {
        if (_delegateRespondsToWillEvictObject)
        {
          _currentlyCleaning = YES;
          [self.delegate cache:(RCTCache *)self willEvictObject:lowestEntry.object];
          _currentlyCleaning = NO;
        }
        [_cache removeObjectForKey:lowestKey];
        _totalCost -= lowestEntry.cost;
        totalCount --;
        if (keepEntries)
        {
          [_entryPool addObject:lowestEntry];
          lowestEntry.object = nil;
        }
      }
    }
  }
  [_lock unlock];
}

- (void)cleanUpAllObjects
{
  [_lock lock];
  if (_delegateRespondsToShouldEvictObject || _delegateRespondsToWillEvictObject)
  {
    NSArray *keys = _cache.allKeys;
    if (_delegateRespondsToShouldEvictObject)
    {
      //sort, oldest first (in case we want to use that information in our eviction test)
      keys = [keys sortedArrayUsingComparator:^NSComparisonResult(id key1, id key2) {
        RCTCacheEntry *entry1 = self->_cache[key1];
        RCTCacheEntry *entry2 = self->_cache[key2];
        return (NSComparisonResult)MIN(1, MAX(-1, entry1.sequenceNumber - entry2.sequenceNumber));
      }];
    }

    //remove all items individually
    for (id key in keys)
    {
      RCTCacheEntry *entry = _cache[key];
      if (!_delegateRespondsToShouldEvictObject || [_delegate cache:(RCTCache *)self shouldEvictObject:entry.object])
      {
        if (_delegateRespondsToWillEvictObject)
        {
          _currentlyCleaning = YES;
          [_delegate cache:(RCTCache *)self willEvictObject:entry.object];
          _currentlyCleaning = NO;
        }
        [_cache removeObjectForKey:key];
        _totalCost -= entry.cost;
      }
    }
  }
  else
  {
    _totalCost = 0;
    [_cache removeAllObjects];
    _sequenceNumber = 0;
  }
  [_lock unlock];
}

- (void)resequence
{
  //sort, oldest first
  NSArray *entries = [_cache.allValues sortedArrayUsingComparator:^NSComparisonResult(RCTCacheEntry *entry1, RCTCacheEntry *entry2) {
    return (NSComparisonResult)MIN(1, MAX(-1, entry1.sequenceNumber - entry2.sequenceNumber));
  }];

  //renumber items
  NSInteger index = 0;
  for (RCTCacheEntry *entry in entries)
  {
    entry.sequenceNumber = index++;
  }
}

- (id)objectForKey:(id)key
{
  [_lock lock];
  RCTCacheEntry *entry = _cache[key];
  entry.sequenceNumber = _sequenceNumber++;
  if (_sequenceNumber < 0)
  {
    [self resequence];
  }
  id object = entry.object;
  [_lock unlock];
  return object;
}

- (id)objectForKeyedSubscript:(id<NSCopying>)key
{
  return [self objectForKey:key];
}

- (void)setObject:(id)obj forKey:(id)key
{
  [self setObject:obj forKey:key cost:0];
}

- (void)setObject:(id)obj forKeyedSubscript:(id<NSCopying>)key
{
  [self setObject:obj forKey:key cost:0];
}

- (void)setObject:(id)obj forKey:(id)key cost:(NSUInteger)g
{
  if (!obj)
  {
    [self removeObjectForKey:key];
    return;
  }
  RCTAssert(!_currentlyCleaning, @"It is not possible to modify cache from within the implementation of this delegate method.");
  [_lock lock];
  _totalCost -= [_cache[key] cost];
  _totalCost += g;
  RCTCacheEntry *entry = _cache[key];
  if (!entry) {
    entry = [RCTCacheEntry new];
    _cache[key] = entry;
  }
  entry.object = obj;
  entry.cost = g;
  entry.sequenceNumber = _sequenceNumber++;
  if (_sequenceNumber < 0)
  {
    [self resequence];
  }
  [_lock unlock];
  [self cleanUp:YES];
}

- (void)removeObjectForKey:(id)key
{
  RCTAssert(!_currentlyCleaning, @"It is not possible to modify cache from within the implementation of this delegate method.");
  [_lock lock];
  RCTCacheEntry *entry = _cache[key];
  if (entry) {
    _totalCost -= entry.cost;
    entry.object = nil;
    [_entryPool addObject:entry];
    [_cache removeObjectForKey:key];
  }
  [_lock unlock];
}

- (void)removeAllObjects
{
  RCTAssert(!_currentlyCleaning, @"It is not possible to modify cache from within the implementation of this delegate method.");
  [_lock lock];
  _totalCost = 0;
  _sequenceNumber = 0;
  for (RCTCacheEntry *entry in _cache.allValues)
  {
    entry.object = nil;
    [_entryPool addObject:entry];
  }
  [_cache removeAllObjects];
  [_lock unlock];
}

- (NSUInteger)countByEnumeratingWithState:(NSFastEnumerationState *)state
                                  objects:(id __unsafe_unretained [])buffer
                                    count:(NSUInteger)len
{
  [_lock lock];
  NSUInteger count = [_cache countByEnumeratingWithState:state objects:buffer count:len];
  [_lock unlock];
  return count;
}

- (void)enumerateKeysAndObjectsUsingBlock:(void (^)(id key, id obj, BOOL *stop))block
{
  [_lock lock];
  [_cache enumerateKeysAndObjectsUsingBlock:block];
  [_lock unlock];
}

//handle unimplemented methods

- (BOOL)isKindOfClass:(Class)aClass
{
  //pretend that we're an RCTCache if anyone asks
  if (aClass == [RCTCache class] || aClass == [NSCache class])
  {
    return YES;
  }
  return [super isKindOfClass:aClass];
}

- (NSMethodSignature *)methodSignatureForSelector:(SEL)selector
{
  //protect against calls to unimplemented NSCache methods
  NSMethodSignature *signature = [super methodSignatureForSelector:selector];
  if (!signature)
  {
    signature = [NSCache instanceMethodSignatureForSelector:selector];
  }
  return signature;
}

- (void)forwardInvocation:(NSInvocation *)invocation
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wnonnull"

  [invocation invokeWithTarget:nil];

#pragma clang diagnostic pop
}

@end

@implementation RCTCache

+ (id)alloc
{
  return (RCTCache *)[RCTCache_Private alloc];
}

- (id)objectForKeyedSubscript:(__unused id<NSCopying>)key { return nil; }
- (void)setObject:(__unused id)obj forKeyedSubscript:(__unused id<NSCopying>)key {}
- (void)enumerateKeysAndObjectsUsingBlock:(__unused void (^)(id, id, BOOL *))block { }
- (NSUInteger)countByEnumeratingWithState:(__unused NSFastEnumerationState *)state
                                  objects:(__unused __unsafe_unretained id [])buffer
                                    count:(__unused NSUInteger)len { return 0; }

@end
