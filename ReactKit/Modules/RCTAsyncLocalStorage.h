// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTBridgeModule.h"

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
@interface RCTAsyncLocalStorage : NSObject <RCTBridgeModule>

- (void)multiGet:(NSArray *)keys callback:(RCTResponseSenderBlock)callback;
- (void)multiSet:(NSArray *)kvPairs callback:(RCTResponseSenderBlock)callback;
- (void)multiRemove:(NSArray *)keys callback:(RCTResponseSenderBlock)callback;
- (void)clear:(RCTResponseSenderBlock)callback;
- (void)getAllKeys:(RCTResponseSenderBlock)callback;

@end
