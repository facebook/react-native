/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTSourceCode.h"

#import "RCTAssert.h"
#import "RCTUtils.h"

@implementation RCTSourceCode

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(getScriptText:(RCTResponseSenderBlock)successCallback
                  failureCallback:(RCTResponseSenderBlock)failureCallback)
{
  if (self.scriptText && self.scriptURL) {
    successCallback(@[@{@"text": self.scriptText, @"url":[self.scriptURL absoluteString]}]);
  } else {
    failureCallback(@[RCTMakeError(@"Source code is not available", nil, nil)]);
  }

}

@end
