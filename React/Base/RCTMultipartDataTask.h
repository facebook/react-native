/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTMultipartStreamReader.h>

typedef void (^RCTMultipartDataTaskCallback)(
    NSInteger statusCode,
    NSDictionary *headers,
    NSData *content,
    NSError *error,
    BOOL done);

@interface RCTMultipartDataTask : NSObject

- (instancetype)initWithURL:(NSURL *)url
                partHandler:(RCTMultipartDataTaskCallback)partHandler
            progressHandler:(RCTMultipartProgressCallback)progressHandler;

- (void)startTask;

@end
