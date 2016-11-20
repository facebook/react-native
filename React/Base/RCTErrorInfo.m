/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTErrorInfo.h"

#import "RCTJSStackFrame.h"

@implementation RCTErrorInfo

- (instancetype)initWithErrorMessage:(NSString *)errorMessage
                               stack:(NSArray<RCTJSStackFrame *> *)stack {
  self = [super init];
  if (self) {
    _errorMessage = [errorMessage copy];
    _stack = [stack copy];
  }
  return self;
}

@end
