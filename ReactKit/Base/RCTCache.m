// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTCache.h"

#import <UIKit/UIKit.h>
#import <sys/xattr.h>

static NSString *const CacheSubdirectoryName = @"ReactKit";
static NSString *const KeyExtendedAttributeName = @"com.facebook.ReactKit.RCTCacheManager.Key";
static dispatch_queue_t Queue;

#pragma mark - Cache Record -

@interface RCTCacheRecord : NSObject

@property (nonatomic, copy) NSUUID *UUID;
@property (nonatomic, copy) NSData *data;

@end

@implementation RCTCacheRecord

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
    Queue = dispatch_queue_create("com.facebook.ReactKit.RCTCache", DISPATCH_QUEUE_SERIAL);
  }
}
- (instancetype)init
{
  return [self initWithName:@"default"];
}

- (instancetype)initWithName:(NSString *)name
{
  NSParameterAssert(name.length < NAME_MAX);
  if ((self = [super init])) {
    _name = [name copy];
    _fileManager = [[NSFileManager alloc] init];
    _storage = [NSMutableDictionary dictionary];

    NSURL *cacheDirectoryURL = [[_fileManager URLsForDirectory:NSCachesDirectory inDomains:NSUserDomainMask] lastObject];
    cacheDirectoryURL = [cacheDirectoryURL URLByAppendingPathComponent:CacheSubdirectoryName isDirectory:YES];
    _cacheDirectoryURL = [cacheDirectoryURL URLByAppendingPathComponent:name isDirectory:YES];
    [_fileManager createDirectoryAtURL:_cacheDirectoryURL withIntermediateDirectories:YES attributes:nil error:NULL];

    NSArray *fileURLs = [_fileManager contentsOfDirectoryAtURL:_cacheDirectoryURL includingPropertiesForKeys:nil options:NSDirectoryEnumerationSkipsHiddenFiles error:NULL];
    for (NSURL *fileURL in fileURLs) {
      NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:fileURL.lastPathComponent];
      if (!uuid) continue;

      NSString *key = [self keyOfItemAtURL:fileURL error:NULL];
      if (!key) {
        [_fileManager removeItemAtURL:fileURL error:NULL];
        continue;
      }

      RCTCacheRecord *record = [[RCTCacheRecord alloc] init];
      record.UUID = uuid;
      _storage[key] = record;
    }
  }
  return self;
}

- (void)runOnQueue:(dispatch_block_t)block
{
  UIBackgroundTaskIdentifier identifier = [[UIApplication sharedApplication] beginBackgroundTaskWithExpirationHandler:nil];
  dispatch_async(Queue, ^{
    if (block) block();
    if (identifier != UIBackgroundTaskInvalid) {
      [[UIApplication sharedApplication] endBackgroundTask:identifier];
    }
  });
}

- (BOOL)hasDataForKey:(NSString *)key
{
  return _storage[key] != nil;
}

- (void)fetchDataForKey:(NSString *)key completionHandler:(void (^)(NSData *))completionHandler
{
  NSParameterAssert(key.length > 0);
  NSParameterAssert(completionHandler != nil);
  [self runOnQueue:^{
    RCTCacheRecord *record = _storage[key];
    if (record && !record.data) {
      record.data = [NSData dataWithContentsOfURL:[_cacheDirectoryURL URLByAppendingPathComponent:record.UUID.UUIDString]];
    }

    dispatch_async(dispatch_get_main_queue(), ^{
      completionHandler(record.data);
    });
  }];
}

- (void)setData:(NSData *)data forKey:(NSString *)key
{
  NSParameterAssert(key.length > 0);
  [self runOnQueue:^{
    RCTCacheRecord *record = _storage[key];
    if (data) {
      if (!record) {
        record = [[RCTCacheRecord alloc] init];
        record.UUID = [NSUUID UUID];
        _storage[key] = record;
      }

      record.data = data;

      NSURL *fileURL = [_cacheDirectoryURL URLByAppendingPathComponent:record.UUID.UUIDString];
      [data writeToURL:fileURL options:NSDataWritingAtomic error:NULL];
    } else if (record) {
      [_storage removeObjectForKey:key];

      NSURL *fileURL = [_cacheDirectoryURL URLByAppendingPathComponent:record.UUID.UUIDString];
      [_fileManager removeItemAtURL:fileURL error:NULL];
    }
  }];
}

- (void)removeAllData
{
  [self runOnQueue:^{
    [_storage removeAllObjects];

    NSDirectoryEnumerator *enumerator = [_fileManager enumeratorAtURL:_cacheDirectoryURL includingPropertiesForKeys:nil options:NSDirectoryEnumerationSkipsHiddenFiles errorHandler:nil];
    for (NSURL *fileURL in enumerator) {
      [_fileManager removeItemAtURL:fileURL error:NULL];
    }
  }];
}

#pragma mark - Extended Attributes

- (NSError *)errorWithPOSIXErrorNumber:(int)errorNumber
{
  NSDictionary *userInfo = @{
    NSLocalizedDescriptionKey: @(strerror(errorNumber))
  };
  return [NSError errorWithDomain:NSPOSIXErrorDomain code:errorNumber userInfo:userInfo];
}

- (BOOL)setAttribute:(NSString *)key value:(NSString *)value ofItemAtURL:(NSURL *)fileURL error:(NSError **)error
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
    if (error) *error = [self errorWithPOSIXErrorNumber:errno];
    return NO;
  }

  return YES;
}

- (NSString *)attribute:(NSString *)key ofItemAtURL:(NSURL *)fileURL error:(NSError **)error
{
  const char *path = fileURL.fileSystemRepresentation;
  const ssize_t length = getxattr(path, key.UTF8String, NULL, 0, 0, 0);
  if (length <= 0) {
    if (error) *error = [self errorWithPOSIXErrorNumber:errno];
    return nil;
  }

  char *buffer = malloc(length);
  ssize_t result = getxattr(path, key.UTF8String, buffer, length, 0, 0);
  if (result == 0) {
    return [[NSString alloc] initWithBytesNoCopy:buffer length:length encoding:NSUTF8StringEncoding freeWhenDone:YES];
  }

  free(buffer);
  if (error) *error = [self errorWithPOSIXErrorNumber:errno];
  return nil;
}

#pragma mark - Extended Attributes - Key

- (NSString *)keyOfItemAtURL:(NSURL *)fileURL error:(NSError **)error
{
  return [self attribute:KeyExtendedAttributeName ofItemAtURL:fileURL error:error];
}

- (BOOL)setKey:(NSString *)key ofItemAtURL:(NSURL *)fileURL error:(NSError **)error
{
  return [self setAttribute:KeyExtendedAttributeName value:key ofItemAtURL:fileURL error:error];
}

@end
