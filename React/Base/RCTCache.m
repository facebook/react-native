/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTCache.h"

#import <UIKit/UIKit.h>
#import <sys/xattr.h>

static NSString *const RCTCacheSubdirectoryName = @"React";
static NSString *const RCTKeyExtendedAttributeName = @"com.facebook.React.RCTCacheManager.Key";
static NSMapTable *RCTLivingCachesByName;

static NSError *RCTPOSIXError(int errorNumber)
{
  NSDictionary *userInfo = @{
    NSLocalizedDescriptionKey: @(strerror(errorNumber))
  };
  return [NSError errorWithDomain:NSPOSIXErrorDomain code:errorNumber userInfo:userInfo];
}

static NSString *RCTGetExtendedAttribute(NSURL *fileURL, NSString *key, NSError **error)
{
  const char *path = fileURL.fileSystemRepresentation;
  ssize_t length = getxattr(path, key.UTF8String, NULL, 0, 0, 0);
  if (length <= 0) {
    if (error) *error = RCTPOSIXError(errno);
    return nil;
  }

  char *buffer = malloc(length);
  length = getxattr(path, key.UTF8String, buffer, length, 0, 0);
  if (length > 0) {
    return [[NSString alloc] initWithBytesNoCopy:buffer length:length encoding:NSUTF8StringEncoding freeWhenDone:YES];
  }

  free(buffer);
  if (error) *error = RCTPOSIXError(errno);
  return nil;
}

static BOOL RCTSetExtendedAttribute(NSURL *fileURL, NSString *key, NSString *value, NSError **error)
{
  const char *path = fileURL.fileSystemRepresentation;

  int result;
  if (value) {
    const char *valueUTF8String = value.UTF8String;
    result = setxattr(path, key.UTF8String, valueUTF8String, strlen(valueUTF8String), 0, 0);
  } else {
    result = removexattr(path, key.UTF8String, 0);
  }

  if (result) {
    if (error) *error = RCTPOSIXError(errno);
    return NO;
  }

  return YES;
}

#pragma mark - Cache Record -

@interface RCTCacheRecord : NSObject

@property (readonly) NSUUID *UUID;
@property (readonly, weak) dispatch_queue_t queue;
@property (nonatomic, copy) NSData *data;

@end

@implementation RCTCacheRecord

- (instancetype)initWithUUID:(NSUUID *)UUID
{
  if ((self = [super init])) {
    _UUID = [UUID copy];
  }
  return self;
}

- (void)enqueueBlock:(dispatch_block_t)block
{
  dispatch_queue_t queue = _queue;
  if (!queue) {
    NSString *queueName = [NSString stringWithFormat:@"com.facebook.React.RCTCache.%@", _UUID.UUIDString];
    queue = dispatch_queue_create(queueName.UTF8String, DISPATCH_QUEUE_SERIAL);
    _queue = queue;
  }

  dispatch_async(queue, block);
}

@end

#pragma mark - Cache

@implementation RCTCache
{
  NSString *_name;
  NSFileManager *_fileManager;
  NSMutableDictionary *_storage;
  NSURL *_cacheDirectoryURL;
}

+ (void)initialize
{
  if (self == [RCTCache class]) {
    RCTLivingCachesByName = [NSMapTable strongToWeakObjectsMapTable];
  }
}

- (instancetype)init
{
  return [self initWithName:@"default"];
}

- (instancetype)initWithName:(NSString *)name
{
  NSParameterAssert(name.length < NAME_MAX);
  RCTCache *cachedCache = [RCTLivingCachesByName objectForKey:name];
  if (cachedCache) {
    self = cachedCache;
    return self;
  }

  if ((self = [super init])) {
    _name = [name copy];
    _fileManager = [[NSFileManager alloc] init];
    _storage = [NSMutableDictionary dictionary];

    NSURL *cacheDirectoryURL = [[_fileManager URLsForDirectory:NSCachesDirectory inDomains:NSUserDomainMask] lastObject];
    cacheDirectoryURL = [cacheDirectoryURL URLByAppendingPathComponent:RCTCacheSubdirectoryName isDirectory:YES];
    _cacheDirectoryURL = [cacheDirectoryURL URLByAppendingPathComponent:name isDirectory:YES];
    [_fileManager createDirectoryAtURL:_cacheDirectoryURL withIntermediateDirectories:YES attributes:nil error:NULL];

    NSArray *fileURLs = [_fileManager contentsOfDirectoryAtURL:_cacheDirectoryURL includingPropertiesForKeys:nil options:NSDirectoryEnumerationSkipsHiddenFiles error:NULL];
    for (NSURL *fileURL in fileURLs) {
      NSUUID *UUID = [[NSUUID alloc] initWithUUIDString:fileURL.lastPathComponent];
      if (!UUID) continue;

      NSString *key = RCTGetExtendedAttribute(fileURL, RCTKeyExtendedAttributeName, NULL);
      if (!key) {
        [_fileManager removeItemAtURL:fileURL error:NULL];
        continue;
      }

      _storage[key] = [[RCTCacheRecord alloc] initWithUUID:UUID];
    }
  }
  return self;
}

- (BOOL)hasDataForKey:(NSString *)key
{
  return _storage[key] != nil;
}

- (void)fetchDataForKey:(NSString *)key completionHandler:(void (^)(NSData *))completionHandler
{
  NSParameterAssert(key.length > 0);
  NSParameterAssert(completionHandler != nil);
  RCTCacheRecord *record = _storage[key];
  if (!record) {
    completionHandler(nil);
    return;
  }

  [record enqueueBlock:^{
    if (!record.data) {
      record.data = [NSData dataWithContentsOfURL:[_cacheDirectoryURL URLByAppendingPathComponent:record.UUID.UUIDString]];
    }
    completionHandler(record.data);
  }];
}

- (void)setData:(NSData *)data forKey:(NSString *)key
{
  NSParameterAssert(key.length > 0);
  RCTCacheRecord *record = _storage[key];
  if (!record) {
    if (!data) return;

    record = [[RCTCacheRecord alloc] initWithUUID:[NSUUID UUID]];
    _storage[key] = record;
  }

  NSURL *fileURL = [_cacheDirectoryURL URLByAppendingPathComponent:record.UUID.UUIDString];

  UIBackgroundTaskIdentifier identifier = [[UIApplication sharedApplication] beginBackgroundTaskWithExpirationHandler:nil];
  [record enqueueBlock:^{
    if (data) {
      [data writeToURL:fileURL options:NSDataWritingAtomic error:NULL];
      RCTSetExtendedAttribute(fileURL, RCTKeyExtendedAttributeName, key, NULL);
    } else {
      [_fileManager removeItemAtURL:fileURL error:NULL];
    }

    if (identifier != UIBackgroundTaskInvalid) {
      [[UIApplication sharedApplication] endBackgroundTask:identifier];
    }
  }];
}

- (void)removeAllData
{
  UIBackgroundTaskIdentifier identifier = [[UIApplication sharedApplication] beginBackgroundTaskWithExpirationHandler:nil];
  dispatch_group_t group = dispatch_group_create();

  [_storage enumerateKeysAndObjectsUsingBlock:^(NSString *key, RCTCacheRecord *record, BOOL *stop) {
    NSURL *fileURL = [_cacheDirectoryURL URLByAppendingPathComponent:record.UUID.UUIDString];
    dispatch_group_async(group, record.queue, ^{
      [_fileManager removeItemAtURL:fileURL error:NULL];
    });
  }];

  if (identifier != UIBackgroundTaskInvalid) {
    dispatch_group_notify(group, dispatch_get_main_queue(), ^{
      [[UIApplication sharedApplication] endBackgroundTask:identifier];
    });
  }

  [_storage removeAllObjects];
}

@end
