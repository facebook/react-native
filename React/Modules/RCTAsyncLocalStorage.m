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

static NSString *const RCTStorageDirectory = @"RCTAsyncLocalStorage_V1";
static NSString *const RCTManifestFileName = @"manifest.json";
static const NSUInteger RCTInlineValueThreshold = 100;

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

static NSString *RCTGetStorageDirectory()
{
  static NSString *storageDirectory = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    storageDirectory = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject;
    storageDirectory = [storageDirectory stringByAppendingPathComponent:RCTStorageDirectory];
  });
  return storageDirectory;
}

static NSString *RCTGetManifestFilePath()
{
  static NSString *manifestFilePath = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    manifestFilePath = [RCTGetStorageDirectory() stringByAppendingPathComponent:RCTManifestFileName];
  });
  return manifestFilePath;
}

// Only merges objects - all other types are just clobbered (including arrays)
static void RCTMergeRecursive(NSMutableDictionary *destination, NSDictionary *source)
{
  for (NSString *key in source) {
    id sourceValue = source[key];
    if ([sourceValue isKindOfClass:[NSDictionary class]]) {
      id destinationValue = destination[key];
      NSMutableDictionary *nestedDestination;
      if ([destinationValue classForCoder] == [NSMutableDictionary class]) {
        nestedDestination = destinationValue;
      } else {
        if ([destinationValue isKindOfClass:[NSDictionary class]]) {
          // Ideally we wouldn't eagerly copy here...
          nestedDestination = [destinationValue mutableCopy];
        } else {
          destination[key] = [sourceValue copy];
        }
      }
      if (nestedDestination) {
        RCTMergeRecursive(nestedDestination, sourceValue);
        destination[key] = nestedDestination;
      }
    } else {
      destination[key] = sourceValue;
    }
  }
}

static dispatch_queue_t RCTGetMethodQueue()
{
  // We want all instances to share the same queue since they will be reading/writing the same files.
  static dispatch_queue_t queue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    queue = dispatch_queue_create("com.facebook.React.AsyncLocalStorageQueue", DISPATCH_QUEUE_SERIAL);
  });
  return queue;
}

static BOOL RCTHasCreatedStorageDirectory = NO;
static NSError *RCTDeleteStorageDirectory()
{
  NSError *error;
  [[NSFileManager defaultManager] removeItemAtPath:RCTGetStorageDirectory() error:&error];
  RCTHasCreatedStorageDirectory = NO;
  return error;
}

#pragma mark - RCTAsyncLocalStorage

@implementation RCTAsyncLocalStorage
{
  BOOL _haveSetup;
  // The manifest is a dictionary of all keys with small values inlined.  Null values indicate values that are stored
  // in separate files (as opposed to nil values which don't exist).  The manifest is read off disk at startup, and
  // written to disk after all mutations.
  NSMutableDictionary *_manifest;
}

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return RCTGetMethodQueue();
}

+ (void)clearAllData
{
  dispatch_async(RCTGetMethodQueue(), ^{
    RCTDeleteStorageDirectory();
  });
}

- (void)invalidate
{
  if (_clearOnInvalidate) {
    RCTDeleteStorageDirectory();
  }
  _clearOnInvalidate = NO;
  _manifest = [NSMutableDictionary new];
  _haveSetup = NO;
}

- (BOOL)isValid
{
  return _haveSetup;
}

- (void)dealloc
{
  [self invalidate];
}

- (NSString *)_filePathForKey:(NSString *)key
{
  NSString *safeFileName = RCTMD5Hash(key);
  return [RCTGetStorageDirectory() stringByAppendingPathComponent:safeFileName];
}

- (id)_ensureSetup
{
  RCTAssertThread(RCTGetMethodQueue(), @"Must be executed on storage thread");

  NSError *error = nil;
  if (!RCTHasCreatedStorageDirectory) {
    [[NSFileManager defaultManager] createDirectoryAtPath:RCTGetStorageDirectory()
                              withIntermediateDirectories:YES
                                               attributes:nil
                                                    error:&error];
    if (error) {
      return RCTMakeError(@"Failed to create storage directory.", error, nil);
    }
    RCTHasCreatedStorageDirectory = YES;
  }
  if (!_haveSetup) {
    NSDictionary *errorOut;
    NSString *serialized = RCTReadFile(RCTGetManifestFilePath(), nil, &errorOut);
    _manifest = serialized ? [RCTJSONParse(serialized, &error) mutableCopy] : [NSMutableDictionary new];
    if (error) {
      RCTLogWarn(@"Failed to parse manifest - creating new one.\n\n%@", error);
      _manifest = [NSMutableDictionary new];
    }
    _haveSetup = YES;
  }
  return nil;
}

- (id)_writeManifest:(NSMutableArray **)errors
{
  NSError *error;
  NSString *serialized = RCTJSONStringify(_manifest, &error);
  [serialized writeToFile:RCTGetManifestFilePath() atomically:YES encoding:NSUTF8StringEncoding error:&error];
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
  id value = [self _getValueForKey:key errorOut:&errorOut];
  [result addObject:@[key, RCTNullIfNil(value)]]; // Insert null if missing or failure.
  return errorOut;
}

- (NSString *)_getValueForKey:(NSString *)key errorOut:(NSDictionary **)errorOut
{
  id value = _manifest[key]; // nil means missing, null means there is a data file, anything else is an inline value.
  if (value == (id)kCFNull) {
    NSString *filePath = [self _filePathForKey:key];
    value = RCTReadFile(filePath, key, errorOut);
  }
  return value;
}

- (id)_writeEntry:(NSArray *)entry
{
  if (![entry isKindOfClass:[NSArray class]] || entry.count != 2) {
    return RCTMakeAndLogError(@"Entries must be arrays of the form [key: string, value: string], got: ", entry, nil);
  }
  if (![entry[1] isKindOfClass:[NSString class]]) {
    return RCTMakeAndLogError(@"Values must be strings, got: ", entry[1], @{@"key": entry[0]});
  }
  NSString *key = entry[0];
  id errorOut = RCTErrorForKey(key);
  if (errorOut) {
    return errorOut;
  }
  NSString *value = entry[1];
  NSString *filePath = [self _filePathForKey:key];
  NSError *error;
  if (value.length <= RCTInlineValueThreshold) {
    if (_manifest[key] && _manifest[key] != (id)kCFNull) {
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
    _manifest[key] = (id)kCFNull; // Mark existence of file with null, any other value is inline data.
  }
  return errorOut;
}

#pragma mark - Exported JS Functions

RCT_EXPORT_METHOD(multiGet:(NSArray *)keys
                  callback:(RCTResponseSenderBlock)callback)
{
  if (!callback) {
    RCTLogError(@"Called getItem without a callback.");
    return;
  }

  id errorOut = [self _ensureSetup];
  if (errorOut) {
    callback(@[@[errorOut], (id)kCFNull]);
    return;
  }
  NSMutableArray *errors;
  NSMutableArray *result = [[NSMutableArray alloc] initWithCapacity:keys.count];
  for (NSString *key in keys) {
    id keyError = [self _appendItemForKey:key toArray:result];
    RCTAppendError(keyError, &errors);
  }
  callback(@[RCTNullIfNil(errors), result]);
}

RCT_EXPORT_METHOD(multiSet:(NSArray *)kvPairs
                  callback:(RCTResponseSenderBlock)callback)
{
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
    callback(@[RCTNullIfNil(errors)]);
  }
}

RCT_EXPORT_METHOD(multiMerge:(NSArray *)kvPairs
                  callback:(RCTResponseSenderBlock)callback)
{
  id errorOut = [self _ensureSetup];
  if (errorOut) {
    callback(@[@[errorOut]]);
    return;
  }
  NSMutableArray *errors;
  for (__strong NSArray *entry in kvPairs) {
    id keyError;
    NSString *value = [self _getValueForKey:entry[0] errorOut:&keyError];
    if (keyError) {
      RCTAppendError(keyError, &errors);
    } else {
      if (value) {
        NSMutableDictionary *mergedVal = [RCTJSONParseMutable(value, &keyError) mutableCopy];
        RCTMergeRecursive(mergedVal, RCTJSONParse(entry[1], &keyError));
        entry = @[entry[0], RCTJSONStringify(mergedVal, &keyError)];
      }
      if (!keyError) {
        keyError = [self _writeEntry:entry];
      }
      RCTAppendError(keyError, &errors);
    }
  }
  [self _writeManifest:&errors];
  if (callback) {
    callback(@[RCTNullIfNil(errors)]);
  }
}

RCT_EXPORT_METHOD(multiRemove:(NSArray *)keys
                  callback:(RCTResponseSenderBlock)callback)
{
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
    callback(@[RCTNullIfNil(errors)]);
  }
}

RCT_EXPORT_METHOD(clear:(RCTResponseSenderBlock)callback)
{
  _manifest = [NSMutableDictionary new];
  NSError *error = RCTDeleteStorageDirectory();
  if (callback) {
    callback(@[RCTNullIfNil(error)]);
  }
}

RCT_EXPORT_METHOD(getAllKeys:(RCTResponseSenderBlock)callback)
{
  id errorOut = [self _ensureSetup];
  if (errorOut) {
    callback(@[errorOut, (id)kCFNull]);
  } else {
    callback(@[(id)kCFNull, _manifest.allKeys]);
  }
}

@end
