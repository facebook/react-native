/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTSourceCode.h"

#import "RCTDefines.h"
#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTUtils.h"

@implementation RCTSourceCode

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

#if !RCT_DEV
- (void)setScriptText:(NSString *)scriptText {}
#endif

NSString *const RCTErrorUnavailable = @"E_SOURCE_CODE_UNAVAILABLE";

RCT_EXPORT_METHOD(getScriptText:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  if (RCT_DEV && self.scriptData && self.scriptURL) {
    NSString *scriptText = [[NSString alloc] initWithData:self.scriptData encoding:NSUTF8StringEncoding];

    resolve(@{@"text": scriptText, @"url": self.scriptURL.absoluteString});
  } else {
    reject(RCTErrorUnavailable, nil, RCTErrorWithMessage(@"Source code is not available"));
  }
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  NSString *URL = self.bridge.bundleURL.absoluteString ?: @"";
  return @{@"scriptURL": URL};
}

@end
