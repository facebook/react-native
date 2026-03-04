/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDevSupportHttpHeaders.h"

@implementation RCTDevSupportHttpHeaders {
  NSMutableDictionary<NSString *, NSString *> *_headers;
  NSMutableDictionary<NSString *, NSMutableDictionary<NSString *, NSString *> *> *_hostHeaders;
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
    _hostHeaders = [NSMutableDictionary new];
    _queue = dispatch_queue_create("com.facebook.react.RCTDevSupportHttpHeaders", DISPATCH_QUEUE_SERIAL);
  }
  return self;
}

- (void)addRequestHeader:(NSString *)name value:(NSString *)value
{
  dispatch_sync(_queue, ^{
    self->_headers[name] = value;
  });
}

- (void)addRequestHeader:(NSString *)name value:(NSString *)value forHost:(NSString *)host
{
  dispatch_sync(_queue, ^{
    NSMutableDictionary<NSString *, NSString *> *headersForHost = self->_hostHeaders[host];
    if (headersForHost == nil) {
      headersForHost = [NSMutableDictionary new];
      self->_hostHeaders[host] = headersForHost;
    }
    headersForHost[name] = value;
  });
}

- (void)removeRequestHeader:(NSString *)name
{
  dispatch_sync(_queue, ^{
    [self->_headers removeObjectForKey:name];
  });
}

- (void)removeRequestHeader:(NSString *)name forHost:(NSString *)host
{
  dispatch_sync(_queue, ^{
    NSMutableDictionary<NSString *, NSString *> *headersForHost = self->_hostHeaders[host];
    if (headersForHost != nil) {
      [headersForHost removeObjectForKey:name];
      if (headersForHost.count == 0) {
        [self->_hostHeaders removeObjectForKey:host];
      }
    }
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
  __block NSDictionary<NSString *, NSString *> *globalHeaders;
  __block NSDictionary<NSString *, NSString *> *hostSpecificHeaders;

  NSString *requestHost = request.URL.host;

  dispatch_sync(_queue, ^{
    globalHeaders = [self->_headers copy];
    if (requestHost != nil && self->_hostHeaders[requestHost] != nil) {
      hostSpecificHeaders = [self->_hostHeaders[requestHost] copy];
    }
  });

  [globalHeaders enumerateKeysAndObjectsUsingBlock:^(NSString *headerName, NSString *headerValue, BOOL *stop) {
    [request setValue:headerValue forHTTPHeaderField:headerName];
  }];

  [hostSpecificHeaders enumerateKeysAndObjectsUsingBlock:^(NSString *headerName, NSString *headerValue, BOOL *stop) {
    [request setValue:headerValue forHTTPHeaderField:headerName];
  }];
}

@end
