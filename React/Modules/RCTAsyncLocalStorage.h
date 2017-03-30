/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridgeModule.h>
#import <React/RCTInvalidating.h>

/**
 * A simple, asynchronous, persistent, key-value storage system designed as a
 * backend to the AsyncStorage JS module, which is modeled after LocalStorage.
 *
 * Current implementation stores small values in serialized dictionary and
 * larger values in separate files. Since we use a serial file queue
 * `RKFileQueue`, reading/writing from multiple threads should be perceived as
 * being atomic, unless someone bypasses the `RCTAsyncLocalStorage` API.
 *
 * Keys and values must always be strings or an error is returned.
 */
@interface RCTAsyncLocalStorage : NSObject <RCTBridgeModule,RCTInvalidating>

@property (nonatomic, assign) BOOL clearOnInvalidate;

@property (nonatomic, readonly, getter=isValid) BOOL valid;

// NOTE(nikki): Added to allow scoped per Expo app
- (instancetype)initWithStorageDirectory:(NSString *)storageDirectory;

// Clear the RCTAsyncLocalStorage data from native code
- (void)clearAllData;

// Grab data from the cache. ResponseBlock result array will have an error at position 0, and an array of arrays at position 1.
- (void)multiGet:(NSArray<NSString *> *)keys callback:(RCTResponseSenderBlock)callback;

// Add multiple key value pairs to the cache.
- (void)multiSet:(NSArray<NSArray<NSString *> *> *)kvPairs callback:(RCTResponseSenderBlock)callback;


@end
