/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTInitializing.h>
#import <React/RCTURLRequestHandler.h>

RCT_EXTERN void RCTEnableBlobManagerProcessingQueue(BOOL enabled);

@interface RCTBlobManager : NSObject <RCTBridgeModule, RCTURLRequestHandler, RCTInitializing>

- (NSString *)store:(NSData *)data;

- (void)store:(NSData *)data withId:(NSString *)blobId;

- (NSUInteger)lengthOfBlobWithId:(NSString *)blobId;

- (NSData *)resolve:(NSDictionary<NSString *, id> *)blob;

- (NSData *)resolve:(NSString *)blobId offset:(NSInteger)offset size:(NSInteger)size;

- (NSData *)resolveURL:(NSURL *)url;

- (void)remove:(NSString *)blobId;

- (void)createFromParts:(NSArray<NSDictionary<NSString *, id> *> *)parts withId:(NSString *)blobId;

- (dispatch_queue_t)executionQueue;

@end
