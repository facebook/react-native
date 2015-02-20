// Copyright 2004-present Facebook. All Rights Reserved.

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
