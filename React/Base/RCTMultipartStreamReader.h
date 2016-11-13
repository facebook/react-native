/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

typedef void (^RCTMultipartCallback)(NSDictionary *headers, NSData *content, BOOL done);


// RCTMultipartStreamReader can be used to parse responses with Content-Type: multipart/mixed
// See https://www.w3.org/Protocols/rfc1341/7_2_Multipart.html
@interface RCTMultipartStreamReader : NSObject

- (instancetype)initWithInputStream:(NSInputStream *)stream boundary:(NSString *)boundary;
- (BOOL)readAllParts:(RCTMultipartCallback)callback;

@end
