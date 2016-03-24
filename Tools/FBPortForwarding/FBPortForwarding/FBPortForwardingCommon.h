/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#define FBPFTrace(...) /*NSLog(__VA_ARGS__)*/
#define FBPFLog(...) NSLog(__VA_ARGS__)

enum {
  FBPortForwardingFrameTypeOpenPipe = 201,
  FBPortForwardingFrameTypeWriteToPipe = 202,
  FBPortForwardingFrameTypeClosePipe = 203,
};

static dispatch_data_t NSDataToGCDData(NSData *data) {
  __block NSData *retainedData = data;
  return dispatch_data_create(data.bytes, data.length, nil, ^{
    retainedData = nil;
  });
}
