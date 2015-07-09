/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

typedef void (^RCTDataCompletionBlock)(NSURLResponse *response, NSData *data, NSError *error);
typedef void (^RCTDataProgressBlock)(int64_t written, int64_t total);

@interface RCTDownloadTaskWrapper : NSObject <NSURLSessionDownloadDelegate>

@property (copy, nonatomic) RCTDataCompletionBlock completionBlock;
@property (copy, nonatomic) RCTDataProgressBlock progressBlock;

- (instancetype)initWithSessionConfiguration:(NSURLSessionConfiguration *)configuration delegateQueue:(NSOperationQueue *)delegateQueue;

- (NSURLSessionDownloadTask *)downloadData:(NSURL *)url progressBlock:(RCTDataProgressBlock)progressBlock completionBlock:(RCTDataCompletionBlock)completionBlock;

@property (nonatomic, assign) id<NSURLSessionDownloadDelegate> delegate;

@end
