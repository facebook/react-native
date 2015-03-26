/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@interface RCTCache : NSObject

- (instancetype)init; // name = @"default"
- (instancetype)initWithName:(NSString *)name;

@property (nonatomic, assign) NSUInteger maximumDiskSize; // in bytes

#pragma mark - Retrieval

- (BOOL)hasDataForKey:(NSString *)key;
- (void)fetchDataForKey:(NSString *)key completionHandler:(void (^)(NSData *data))completionHandler;

#pragma mark - Insertion

- (void)setData:(NSData *)data forKey:(NSString *)key;
- (void)removeAllData;

@end
