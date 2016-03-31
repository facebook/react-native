/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <CocoaAsyncSocket/GCDAsyncSocket.h>

@interface PFPingClient : NSObject <GCDAsyncSocketDelegate>

- (BOOL)connectToLocalServerOnPort:(NSUInteger)port;
- (void)sendPing:(NSData *)ping;

@property (nonatomic, copy, readonly) NSArray *pongs;
@property (nonatomic, readonly) BOOL connected;

@end
