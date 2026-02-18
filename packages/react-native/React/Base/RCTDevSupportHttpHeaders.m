/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDevSupportHttpHeaders.h"

@implementation RCTDevSupportHttpHeaders {
  NSMutableDictionary<NSString *, NSString *> *_headers;
  dispatch_queue_t _queue;
}

+ (instancetype)sharedInstance
{
  static RCTDevSupportHttpHeaders *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[RCTDevSupportHttpHeaders alloc] init];
  });
  return sharedInstance;
}

- (instancetype)init
{
  if (self = [super init]) {
    _headers = [NSMutableDictionary new];
    _queue = dispatch_queue_create("com.facebook.react.RCTDevSupportHttpHeaders", DISPATCH_QUEUE_CONCURRENT);
  }
  return self;
}

- (void)addRequestHeader:(NSString *)name value:(NSString *)value
{
  dispatch_barrier_async(_queue, ^{
    self->_headers[name] = value;
  });
}

- (void)removeRequestHeader:(NSString *)name
{
  dispatch_barrier_async(_queue, ^{
    [self->_headers removeObjectForKey:name];
  });
}

- (NSDictionary<NSString *, NSString *> *)allHeaders
{
  __block NSDictionary<NSString *, NSString *> *snapshot;
  dispatch_sync(_queue, ^{
    snapshot = [self->_headers copy];
  });
  return snapshot;
}

- (void)applyHeadersToRequest:(NSMutableURLRequest *)request
{
  NSDictionary<NSString *, NSString *> *headers = [self allHeaders];
  for (NSString *name in headers) {
    [request setValue:headers[name] forHTTPHeaderField:name];
  }
}

@end
