/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAsyncLocalStorage.h"

#import <Foundation/Foundation.h>

#import <CommonCrypto/CommonCryptor.h>
#import <CommonCrypto/CommonDigest.h>
#import <FBReactNativeSpec/FBReactNativeSpec.h>

#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

#import "CoreModulesPlugins.h"

static NSString *const RCTStorageDirectory = @"RCTAsyncLocalStorage_V1";
static NSString *const RCTManifestFileName = @"manifest.json";
static const NSUInteger RCTInlineValueThreshold = 1024;

#pragma mark - Static helper functions

static NSDictionary *RCTErrorForKey(NSString *key)
{
  if (![key isKindOfClass:[NSString class]]) {
    return RCTMakeAndLogError(@"Invalid key - must be a string.  Key: ", key, @{@"key" : key});
  } else if (key.length < 1) {
    return RCTMakeAndLogError(@"Invalid key - must be at least one character.  Key: ", key, @{@"key" : key});
  } else {
    return nil;
  }
}

static void RCTAppendError(NSDictionary *error, NSMutableArray<NSDictionary *> **errors)
{
  if (error && errors) {
    if (!*errors) {
      *errors = [NSMutableArray new];
    }
    [*errors addObject:error];
  }
}

static NSString *RCTReadFile(NSString *filePath, NSString *key, NSDictionary **errorOut)
{
  if ([[NSFileManager defaultManager] fileExistsAtPath:filePath]) {
    NSError *error;
    NSStringEncoding encoding;
    NSString *entryString = [NSString stringWithContentsOfFile:filePath usedEncoding:&encoding error:&error];
    NSDictionary *extraData = @{@"key" : RCTNullIfNil(key)};

    if (error) {
      if (errorOut)
        *errorOut = RCTMakeError(@"Failed to read storage file.", error, extraData);
      return nil;
    }

    if (encoding != NSUTF8StringEncoding) {
      if (errorOut)
        *errorOut = RCTMakeError(@"Incorrect encoding of storage file: ", @(encoding), extraData);
      return nil;
    }
    return entryString;
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
static BOOL RCTMergeRecursive(NSMutableDictionary *destination, NSDictionary *source)
{
  BOOL modified = NO;
  for (NSString *key in source) {
    id sourceValue = source[key];
    id destinationValue = destination[key];
    if ([sourceValue isKindOfClass:[NSDictionary class]]) {
      if ([destinationValue isKindOfClass:[NSDictionary class]]) {
        if ([destinationValue classForCoder] != [NSMutableDictionary class]) {
          destinationValue = [destinationValue mutableCopy];
        }
        if (RCTMergeRecursive(destinationValue, sourceValue)) {
          destination[key] = destinationValue;
          modified = YES;
        }
      } else {
        destination[key] = [sourceValue copy];
        modified = YES;
      }
    } else if (![source isEqual:destinationValue]) {
      destination[key] = [sourceValue copy];
      modified = YES;
    }
  }
  return modified;
}

static dispatch_queue_t RCTGetMethodQueue()
{
  // We want all instances to share the same queue since they will be reading/writing the same files.
  static dispatch_queue_t queue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    queue = dispatch_queue_create("com.facebook.react.AsyncLocalStorageQueue", DISPATCH_QUEUE_SERIAL);
  });
  return queue;
}

static NSCache *RCTGetCache()
{
  // We want all instances to share the same cache since they will be reading/writing the same files.
  static NSCache *cache;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    cache = [NSCache new];
    cache.totalCostLimit = 2 * 1024 * 1024; // 2MB

    // Clear cache in the event of a memory warning
    [[NSNotificationCenter defaultCenter] addObserverForName:UIApplicationDidReceiveMemoryWarningNotification
                                                      object:nil
                                                       queue:nil
                                                  usingBlock:^(__unused NSNotification *note) {
                                                    [cache removeAllObjects];
                                                  }];
  });
  return cache;
}

static BOOL RCTHasCreatedStorageDirectory = NO;
static NSDictionary *RCTDeleteStorageDirectory()
{
  NSError *error;
  [[NSFileManager defaultManager] removeItemAtPath:RCTGetStorageDirectory() error:&error];
  RCTHasCreatedStorageDirectory = NO;
  return error ? RCTMakeError(@"Failed to delete storage directory.", error, nil) : nil;
}

#pragma mark - RCTAsyncLocalStorage

@interface RCTAsyncLocalStorage () <NativeAsyncLocalStorageSpec>
@end

@implementation RCTAsyncLocalStorage {
  BOOL _haveSetup;
  // The manifest is a dictionary of all keys with small values inlined.  Null values indicate values that are stored
  // in separate files (as opposed to nil values which don't exist).  The manifest is read off disk at startup, and
  // written to disk after all mutations.
  NSMutableDictionary<NSString *, NSString *> *_manifest;
}

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return RCTGetMethodQueue();
}

- (void)clearAllData
{
  dispatch_async(RCTGetMethodQueue(), ^{
    [self->_manifest removeAllObjects];
    [RCTGetCache() removeAllObjects];
    RCTDeleteStorageDirectory();
  });
}

+ (void)clearAllData
{
  dispatch_async(RCTGetMethodQueue(), ^{
    [RCTGetCache() removeAllObjects];
    RCTDeleteStorageDirectory();
  });
}

- (void)invalidate
{
  if (_clearOnInvalidate) {
    [RCTGetCache() removeAllObjects];
    RCTDeleteStorageDirectory();
  }
  _clearOnInvalidate = NO;
  [_manifest removeAllObjects];
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

- (NSDictionary *)_ensureSetup
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
    NSString *serialized = RCTReadFile(RCTGetManifestFilePath(), RCTManifestFileName, &errorOut);
    _manifest = serialized ? RCTJSONParseMutable(serialized, &error) : [NSMutableDictionary new];
    if (error) {
      RCTLogWarn(@"Failed to parse manifest - creating new one.\n\n%@", error);
      _manifest = [NSMutableDictionary new];
    }
    _haveSetup = YES;
  }
  return nil;
}

- (NSDictionary *)_writeManifest:(NSMutableArray<NSDictionary *> **)errors
{
  NSError *error;
  NSString *serialized = RCTJSONStringify(_manifest, &error);
  [serialized writeToFile:RCTGetManifestFilePath() atomically:YES encoding:NSUTF8StringEncoding error:&error];
  NSDictionary *errorOut;
  if (error) {
    errorOut = RCTMakeError(@"Failed to write manifest file.", error, nil);
    RCTAppendError(errorOut, errors);
  }
  return errorOut;
}

- (NSDictionary *)_appendItemForKey:(NSString *)key toArray:(NSMutableArray<NSArray<NSString *> *> *)result
{
  NSDictionary *errorOut = RCTErrorForKey(key);
  if (errorOut) {
    return errorOut;
  }
  NSString *value = [self _getValueForKey:key errorOut:&errorOut];
  [result addObject:@[ key, RCTNullIfNil(value) ]]; // Insert null if missing or failure.
  return errorOut;
}

- (NSString *)_getValueForKey:(NSString *)key errorOut:(NSDictionary **)errorOut
{
  NSString *value = _manifest[key]; // nil means missing, null means there may be a data file, else: NSString
  if (value == (id)kCFNull) {
    value = [RCTGetCache() objectForKey:key];
    if (!value) {
      NSString *filePath = [self _filePathForKey:key];
      value = RCTReadFile(filePath, key, errorOut);
      if (value) {
        [RCTGetCache() setObject:value forKey:key cost:value.length];
      } else {
        // file does not exist after all, so remove from manifest (no need to save
        // manifest immediately though, as cost of checking again next time is negligible)
        [_manifest removeObjectForKey:key];
      }
    }
  }
  return value;
}

- (NSDictionary *)_writeEntry:(NSArray<NSString *> *)entry changedManifest:(BOOL *)changedManifest
{
  if (entry.count != 2) {
    return RCTMakeAndLogError(@"Entries must be arrays of the form [key: string, value: string], got: ", entry, nil);
  }
  NSString *key = entry[0];
  NSDictionary *errorOut = RCTErrorForKey(key);
  if (errorOut) {
    return errorOut;
  }
  if (![entry[1] isKindOfClass:[NSString class]]) {
    return RCTMakeAndLogError(@"Invalid value for entry - must be a string. Got entry: ", entry, nil);
  }
  NSString *value = entry[1];

  NSString *filePath = [self _filePathForKey:key];
  NSError *error;
  if (value.length <= RCTInlineValueThreshold) {
    if (_manifest[key] == (id)kCFNull) {
      // If the value already existed but wasn't inlined, remove the old file.
      [[NSFileManager defaultManager] removeItemAtPath:filePath error:nil];
      [RCTGetCache() removeObjectForKey:key];
    }
    *changedManifest = YES;
    _manifest[key] = value;
    return nil;
  }
  [value writeToFile:filePath atomically:YES encoding:NSUTF8StringEncoding error:&error];
  [RCTGetCache() setObject:value forKey:key cost:value.length];
  if (error) {
    errorOut = RCTMakeError(@"Failed to write value.", error, @{@"key" : key});
  } else if (_manifest[key] != (id)kCFNull) {
    *changedManifest = YES;
    _manifest[key] = (id)kCFNull;
  }
  return errorOut;
}

#pragma mark - Exported JS Functions

RCT_EXPORT_METHOD(multiGet : (NSArray<NSString *> *)keys callback : (RCTResponseSenderBlock)callback)
{
  NSDictionary *errorOut = [self _ensureSetup];
  if (errorOut) {
    callback(@[ @[ errorOut ], (id)kCFNull ]);
    return;
  }
  NSMutableArray<NSDictionary *> *errors;
  NSMutableArray<NSArray<NSString *> *> *result = [[NSMutableArray alloc] initWithCapacity:keys.count];
  for (NSString *key in keys) {
    id keyError;
    id value = [self _getValueForKey:key errorOut:&keyError];
    [result addObject:@[ key, RCTNullIfNil(value) ]];
    RCTAppendError(keyError, &errors);
  }
  callback(@[ RCTNullIfNil(errors), result ]);
}

RCT_EXPORT_METHOD(multiSet : (NSArray<NSArray<NSString *> *> *)kvPairs callback : (RCTResponseSenderBlock)callback)
{
  NSDictionary *errorOut = [self _ensureSetup];
  if (errorOut) {
    callback(@[ @[ errorOut ] ]);
    return;
  }
  BOOL changedManifest = NO;
  NSMutableArray<NSDictionary *> *errors;
  for (NSArray<NSString *> *entry in kvPairs) {
    NSDictionary *keyError = [self _writeEntry:entry changedManifest:&changedManifest];
    RCTAppendError(keyError, &errors);
  }
  if (changedManifest) {
    [self _writeManifest:&errors];
  }
  callback(@[ RCTNullIfNil(errors) ]);
}

RCT_EXPORT_METHOD(multiMerge : (NSArray<NSArray<NSString *> *> *)kvPairs callback : (RCTResponseSenderBlock)callback)
{
  NSDictionary *errorOut = [self _ensureSetup];
  if (errorOut) {
    callback(@[ @[ errorOut ] ]);
    return;
  }
  BOOL changedManifest = NO;
  NSMutableArray<NSDictionary *> *errors;
  for (__strong NSArray<NSString *> *entry in kvPairs) {
    NSDictionary *keyError;
    NSString *value = [self _getValueForKey:entry[0] errorOut:&keyError];
    if (!keyError) {
      if (value) {
        NSError *jsonError;
        NSMutableDictionary *mergedVal = RCTJSONParseMutable(value, &jsonError);
        if (RCTMergeRecursive(mergedVal, RCTJSONParse(entry[1], &jsonError))) {
          entry = @[ entry[0], RCTNullIfNil(RCTJSONStringify(mergedVal, NULL)) ];
        }
        if (jsonError) {
          keyError = RCTJSErrorFromNSError(jsonError);
        }
      }
      if (!keyError) {
        keyError = [self _writeEntry:entry changedManifest:&changedManifest];
      }
    }
    RCTAppendError(keyError, &errors);
  }
  if (changedManifest) {
    [self _writeManifest:&errors];
  }
  callback(@[ RCTNullIfNil(errors) ]);
}

RCT_EXPORT_METHOD(multiRemove : (NSArray<NSString *> *)keys callback : (RCTResponseSenderBlock)callback)
{
  NSDictionary *errorOut = [self _ensureSetup];
  if (errorOut) {
    callback(@[ @[ errorOut ] ]);
    return;
  }
  NSMutableArray<NSDictionary *> *errors;
  BOOL changedManifest = NO;
  for (NSString *key in keys) {
    NSDictionary *keyError = RCTErrorForKey(key);
    if (!keyError) {
      if (_manifest[key] == (id)kCFNull) {
        NSString *filePath = [self _filePathForKey:key];
        [[NSFileManager defaultManager] removeItemAtPath:filePath error:nil];
        [RCTGetCache() removeObjectForKey:key];
      }
      if (_manifest[key]) {
        changedManifest = YES;
        [_manifest removeObjectForKey:key];
      }
    }
    RCTAppendError(keyError, &errors);
  }
  if (changedManifest) {
    [self _writeManifest:&errors];
  }
  callback(@[ RCTNullIfNil(errors) ]);
}

RCT_EXPORT_METHOD(clear : (RCTResponseSenderBlock)callback)
{
  [_manifest removeAllObjects];
  [RCTGetCache() removeAllObjects];
  NSDictionary *error = RCTDeleteStorageDirectory();
  callback(@[ RCTNullIfNil(error) ]);
}

RCT_EXPORT_METHOD(getAllKeys : (RCTResponseSenderBlock)callback)
{
  NSDictionary *errorOut = [self _ensureSetup];
  if (errorOut) {
    callback(@[ errorOut, (id)kCFNull ]);
  } else {
    callback(@[ (id)kCFNull, _manifest.allKeys ]);
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeAsyncLocalStorageSpecJSI>(params);
}

@end

Class RCTAsyncLocalStorageCls(void)
{
  return RCTAsyncLocalStorage.class;
}
