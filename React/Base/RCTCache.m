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

+ (instancetype)entryWithObject:(id)object cost:(NSUInteger)cost sequenceNumber:(NSInteger)sequenceNumber
{
  RCTCacheEntry *entry = [[self alloc] init];
  entry.object = object;
  entry.cost = cost;
  entry.sequenceNumber = sequenceNumber;
  return entry;
}

@end

@interface RCTCache_Private : NSObject

@property (nonatomic, unsafe_unretained) id<RCTCacheDelegate> delegate;
@property (nonatomic, assign) NSUInteger countLimit;
@property (nonatomic, assign) NSUInteger totalCostLimit;
@property (nonatomic, copy) NSString *name;

@property (nonatomic, assign) NSUInteger totalCost;
@property (nonatomic, strong) NSMutableDictionary *cache;
@property (nonatomic, assign) BOOL delegateRespondsToWillEvictObject;
@property (nonatomic, assign) BOOL delegateRespondsToShouldEvictObject;
@property (nonatomic, assign) BOOL currentlyCleaning;
@property (nonatomic, assign) NSInteger sequenceNumber;
@property (nonatomic, strong) NSLock *lock;

@end

@implementation RCTCache_Private

- (instancetype)init
{
  if ((self = [super init]))
  {
    //create storage
    _cache = [[NSMutableDictionary alloc] init];
    _lock = [[NSLock alloc] init];
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
  [self cleanUp];
}

- (void)setTotalCostLimit:(NSUInteger)totalCostLimit
{
  [_lock lock];
  _totalCostLimit = totalCostLimit;
  [_lock unlock];
  [self cleanUp];
}

- (NSUInteger)count
{
  return [_cache count];
}

- (void)cleanUp
{
  [_lock lock];
  NSUInteger maxCount = [self countLimit] ?: INT_MAX;
  NSUInteger maxCost = [self totalCostLimit] ?: INT_MAX;
  NSUInteger totalCount = [_cache count];
  if (totalCount > maxCount || _totalCost > maxCost)
  {
    //sort, oldest first
    NSArray *keys = [[_cache allKeys] sortedArrayUsingComparator:^NSComparisonResult(id key1, id key2) {
      RCTCacheEntry *entry1 = self.cache[key1];
      RCTCacheEntry *entry2 = self.cache[key2];
      return (NSComparisonResult)MIN(1, MAX(-1, entry1.sequenceNumber - entry2.sequenceNumber));
    }];

    //remove oldest items until within limit
    for (id key in keys)
    {
      if (totalCount <= maxCount && _totalCost <= maxCost)
      {
        break;
      }
      RCTCacheEntry *entry = _cache[key];
      if (!_delegateRespondsToShouldEvictObject || [self.delegate cache:(RCTCache *)self shouldEvictObject:entry])
      {
        if (_delegateRespondsToWillEvictObject)
        {
          _currentlyCleaning = YES;
          [self.delegate cache:(RCTCache *)self willEvictObject:entry];
          _currentlyCleaning = NO;
        }
        [_cache removeObjectForKey:key];
        _totalCost -= entry.cost;
        totalCount --;
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
    NSArray *keys = [_cache allKeys];
    if (_delegateRespondsToShouldEvictObject)
    {
      //sort, oldest first (in case we want to use that information in our eviction test)
      keys = [keys sortedArrayUsingComparator:^NSComparisonResult(id key1, id key2) {
        RCTCacheEntry *entry1 = self.cache[key1];
        RCTCacheEntry *entry2 = self.cache[key2];
        return (NSComparisonResult)MIN(1, MAX(-1, entry1.sequenceNumber - entry2.sequenceNumber));
      }];
    }

    //remove all items individually
    for (id key in keys)
    {
      RCTCacheEntry *entry = _cache[key];
      if (!_delegateRespondsToShouldEvictObject || [self.delegate cache:(RCTCache *)self shouldEvictObject:entry])
      {
        if (_delegateRespondsToWillEvictObject)
        {
          _currentlyCleaning = YES;
          [self.delegate cache:(RCTCache *)self willEvictObject:entry];
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
  NSArray *entries = [[_cache allValues] sortedArrayUsingComparator:^NSComparisonResult(RCTCacheEntry *entry1, RCTCacheEntry *entry2) {
    return (NSComparisonResult)MIN(1, MAX(-1, entry1.sequenceNumber - entry2.sequenceNumber));
  }];

  //renumber items
  NSInteger index = 0;
  for (RCTCacheEntry *entry in entries)
  {
    entry.sequenceNumber = index++;
  }
}

- (id)objectForKey:(id<NSCopying>)key
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

- (void)setObject:(id)obj forKey:(id<NSCopying>)key
{
  [self setObject:obj forKey:key cost:0];
}

- (void)setObject:(id)obj forKeyedSubscript:(id<NSCopying>)key
{
  [self setObject:obj forKey:key cost:0];
}

- (void)setObject:(id)obj forKey:(id<NSCopying>)key cost:(NSUInteger)g
{
  RCTAssert(!_currentlyCleaning, @"It is not possible to modify cache from within the implementation of this delegate method.");
  [_lock lock];
  _totalCost -= [_cache[key] cost];
  _totalCost += g;
  _cache[key] = [RCTCacheEntry entryWithObject:obj cost:g sequenceNumber:_sequenceNumber++];
  if (_sequenceNumber < 0)
  {
    [self resequence];
  }
  [_lock unlock];
  [self cleanUp];
}

- (void)removeObjectForKey:(id<NSCopying>)key
{
  RCTAssert(!_currentlyCleaning, @"It is not possible to modify cache from within the implementation of this delegate method.");
  [_lock lock];
  _totalCost -= [_cache[key] cost];
  [_cache removeObjectForKey:key];
  [_lock unlock];
}

- (void)removeAllObjects
{
  RCTAssert(!_currentlyCleaning, @"It is not possible to modify cache from within the implementation of this delegate method.");
  [_lock lock];
  _totalCost = 0;
  _sequenceNumber = 0;
  [_cache removeAllObjects];
  [_lock unlock];
}

//handle unimplemented methods

- (BOOL)isKindOfClass:(Class)cls
{
  //pretend that we're an RCTCache if anyone asks
  if (cls == [RCTCache class] || cls == [NSCache class])
  {
    return YES;
  }
  return [super isKindOfClass:cls];
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

@dynamic count;
@dynamic totalCost;

+ (instancetype)alloc
{
  return (RCTCache *)[RCTCache_Private alloc];
}

- (id)objectForKeyedSubscript:(__unused NSNumber *)key
{
  return nil;
}

- (void)setObject:(__unused id)obj forKeyedSubscript:(__unused id<NSCopying>)key {}

@end
