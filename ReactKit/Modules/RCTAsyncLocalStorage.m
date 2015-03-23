/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTAsyncLocalStorage.h"

#import <Foundation/Foundation.h>

#import <CommonCrypto/CommonCryptor.h>
#import <CommonCrypto/CommonDigest.h>

#import "RCTLog.h"
#import "RCTUtils.h"

static NSString *const kStorageDir = @"RCTAsyncLocalStorage_V1";
static NSString *const kManifestFilename = @"manifest.json";
static const NSUInteger kInlineValueThreshold = 100;

#pragma mark - Static helper functions

static id RCTErrorForKey(NSString *key)
{
  if (![key isKindOfClass:[NSString class]]) {
    return RCTMakeAndLogError(@"Invalid key - must be a string.  Key: ", key, @{@"key": key});
  } else if (key.length < 1) {
    return RCTMakeAndLogError(@"Invalid key - must be at least one character.  Key: ", key, @{@"key": key});
  } else {
    return nil;
  }
}

static void RCTAppendError(id error, NSMutableArray **errors)
{
  if (error && errors) {
    if (!*errors) {
      *errors = [NSMutableArray new];
    }
    [*errors addObject:error];
  }
}

static id RCTReadFile(NSString *filePath, NSString *key, NSDictionary **errorOut)
{
  if ([[NSFileManager defaultManager] fileExistsAtPath:filePath]) {
    NSError *error;
    NSStringEncoding encoding;
    NSString *entryString = [NSString stringWithContentsOfFile:filePath usedEncoding:&encoding error:&error];
    if (error) {
      *errorOut = RCTMakeError(@"Failed to read storage file.", error, @{@"key": key});
    } else if (encoding != NSUTF8StringEncoding) {
      *errorOut = RCTMakeError(@"Incorrect encoding of storage file: ", @(encoding), @{@"key": key});
    } else {
      return entryString;
    }
  }
  return nil;
}

static dispatch_queue_t RCTFileQueue(void)
{
  static dispatch_queue_t fileQueue = NULL;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // All JS is single threaded, so a serial queue is our only option.
    fileQueue = dispatch_queue_create("com.facebook.rkFile", DISPATCH_QUEUE_SERIAL);
    dispatch_set_target_queue(fileQueue,
                              dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0));
  });

  return fileQueue;
}

#pragma mark - RCTAsyncLocalStorage

@implementation RCTAsyncLocalStorage
{
  BOOL _haveSetup;
  // The manifest is a dictionary of all keys with small values inlined.  Null values indicate values that are stored
  // in separate files (as opposed to nil values which don't exist).  The manifest is read off disk at startup, and
  // written to disk after all mutations.
  NSMutableDictionary *_manifest;
  NSString *_manifestPath;
  NSString *_storageDirectory;
}

- (NSString *)_filePathForKey:(NSString *)key
{
  NSString *safeFileName = RCTMD5Hash(key);
  return [_storageDirectory stringByAppendingPathComponent:safeFileName];
}

- (id)_ensureSetup
{
  if (_haveSetup) {
    return nil;
  }
  NSString *documentDirectory =
  [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject];
  NSURL *homeURL = [NSURL fileURLWithPath:documentDirectory isDirectory:YES];
  _storageDirectory = [[homeURL URLByAppendingPathComponent:kStorageDir isDirectory:YES] path];
  NSError *error;
  [[NSFileManager defaultManager] createDirectoryAtPath:_storageDirectory
                            withIntermediateDirectories:YES
                                             attributes:nil
                                                  error:&error];
  if (error) {
    return RCTMakeError(@"Failed to create storage directory.", error, nil);
  }
  _manifestPath = [_storageDirectory stringByAppendingPathComponent:kManifestFilename];
  NSDictionary *errorOut;
  NSString *serialized = RCTReadFile(_manifestPath, nil, &errorOut);
  _manifest = serialized ? [RCTJSONParse(serialized, &error) mutableCopy] : [NSMutableDictionary new];
  if (error) {
    RCTLogWarn(@"Failed to parse manifest - creating new one.\n\n%@", error);
    _manifest = [NSMutableDictionary new];
  }
  _haveSetup = YES;
  return nil;
}

- (id)_writeManifest:(NSMutableArray **)errors
{
  NSError *error;
  NSString *serialized = RCTJSONStringify(_manifest, &error);
  [serialized writeToFile:_manifestPath atomically:YES encoding:NSUTF8StringEncoding error:&error];
  id errorOut;
  if (error) {
    errorOut = RCTMakeError(@"Failed to write manifest file.", error, nil);
    RCTAppendError(errorOut, errors);
  }
  return errorOut;
}

- (id)_appendItemForKey:(NSString *)key toArray:(NSMutableArray *)result
{
  id errorOut = RCTErrorForKey(key);
  if (errorOut) {
    return errorOut;
  }
  id value = _manifest[key]; // nil means missing, null means there is a data file, anything else is an inline value.
  if (value == [NSNull null]) {
    NSString *filePath = [self _filePathForKey:key];
    value = RCTReadFile(filePath, key, &errorOut);
  }
  [result addObject:@[key, value ?: [NSNull null]]]; // Insert null if missing or failure.
  return errorOut;
}

- (id)_writeEntry:(NSArray *)entry
{
  if (![entry isKindOfClass:[NSArray class]] || entry.count != 2) {
    return RCTMakeAndLogError(@"Entries must be arrays of the form [key: string, value: string], got: ", entry, nil);
  }
  if (![entry[1] isKindOfClass:[NSString class]]) {
    return RCTMakeAndLogError(@"Values must be strings, got: ", entry[1], entry[0]);
  }
  NSString *key = entry[0];
  id errorOut = RCTErrorForKey(key);
  if (errorOut) {
    return errorOut;
  }
  NSString *value = entry[1];
  NSString *filePath = [self _filePathForKey:key];
  NSError *error;
  if (value.length <= kInlineValueThreshold) {
    if (_manifest[key] && _manifest[key] != [NSNull null]) {
      // If the value already existed but wasn't inlined, remove the old file.
      [[NSFileManager defaultManager] removeItemAtPath:filePath error:nil];
    }
    _manifest[key] = value;
    return nil;
  }
  [value writeToFile:filePath atomically:YES encoding:NSUTF8StringEncoding error:&error];
  if (error) {
    errorOut = RCTMakeError(@"Failed to write value.", error, @{@"key": key});
  } else {
    _manifest[key] = [NSNull null]; // Mark existence of file with null, any other value is inline data.
  }
  return errorOut;
}

#pragma mark - Exported JS Functions

- (void)multiGet:(NSArray *)keys callback:(RCTResponseSenderBlock)callback
{
  RCT_EXPORT();

  if (!callback) {
    RCTLogError(@"Called getItem without a callback.");
    return;
  }

  dispatch_async(RCTFileQueue(), ^{
    id errorOut = [self _ensureSetup];
    if (errorOut) {
      callback(@[@[errorOut], [NSNull null]]);
      return;
    }
    NSMutableArray *errors;
    NSMutableArray *result = [[NSMutableArray alloc] initWithCapacity:keys.count];
    for (NSString *key in keys) {
      id keyError = [self _appendItemForKey:key toArray:result];
      RCTAppendError(keyError, &errors);
    }
    [self _writeManifest:&errors];
    callback(@[errors ?: [NSNull null], result]);
  });
}

- (void)multiSet:(NSArray *)kvPairs callback:(RCTResponseSenderBlock)callback
{
  RCT_EXPORT();

  dispatch_async(RCTFileQueue(), ^{
    id errorOut = [self _ensureSetup];
    if (errorOut) {
      callback(@[@[errorOut]]);
      return;
    }
    NSMutableArray *errors;
    for (NSArray *entry in kvPairs) {
      id keyError = [self _writeEntry:entry];
      RCTAppendError(keyError, &errors);
    }
    [self _writeManifest:&errors];
    if (callback) {
      callback(@[errors ?: [NSNull null]]);
    }
  });
}

- (void)multiRemove:(NSArray *)keys callback:(RCTResponseSenderBlock)callback
{
  RCT_EXPORT();

  dispatch_async(RCTFileQueue(), ^{
    id errorOut = [self _ensureSetup];
    if (errorOut) {
      callback(@[@[errorOut]]);
      return;
    }
    NSMutableArray *errors;
    for (NSString *key in keys) {
      id keyError = RCTErrorForKey(key);
      if (!keyError) {
        NSString *filePath = [self _filePathForKey:key];
        [[NSFileManager defaultManager] removeItemAtPath:filePath error:nil];
        [_manifest removeObjectForKey:key];
      }
      RCTAppendError(keyError, &errors);
    }
    [self _writeManifest:&errors];
    if (callback) {
      callback(@[errors ?: [NSNull null]]);
    }
  });
}

- (void)clear:(RCTResponseSenderBlock)callback
{
  RCT_EXPORT();

  dispatch_async(RCTFileQueue(), ^{
    id errorOut = [self _ensureSetup];
    if (!errorOut) {
      NSError *error;
      for (NSString *key in _manifest) {
        NSString *filePath = [self _filePathForKey:key];
        [[NSFileManager defaultManager] removeItemAtPath:filePath error:&error];
      }
      [_manifest removeAllObjects];
      errorOut = [self _writeManifest:nil];
    }
    if (callback) {
      callback(@[errorOut ?: [NSNull null]]);
    }
  });
}

- (void)getAllKeys:(RCTResponseSenderBlock)callback
{
  RCT_EXPORT();

  dispatch_async(RCTFileQueue(), ^{
    id errorOut = [self _ensureSetup];
    if (errorOut) {
      callback(@[errorOut, [NSNull null]]);
    } else {
      callback(@[[NSNull null], [_manifest allKeys]]);
    }
  });
}

@end
