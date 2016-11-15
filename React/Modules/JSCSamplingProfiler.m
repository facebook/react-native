/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "JSCSamplingProfiler.h"

#import "RCTBridge.h"
#import "RCTLog.h"

@implementation JSCSamplingProfiler

@synthesize methodQueue = _methodQueue;
@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(JSCSamplingProfiler);

#ifdef RCT_PROFILE
RCT_EXPORT_METHOD(operationComplete:(int)token result:(id)profileData error:(id)error)
{
  if (error) {
    RCTLogError(@"JSC Sampling profiler ended with error: %@", error);
    return;
  }

  // Create a POST request with all of the datas
  NSURL *url = [NSURL URLWithString:@"/jsc-profile" relativeToURL:self.bridge.bundleURL];
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url
                                                         cachePolicy:NSURLRequestReloadIgnoringLocalAndRemoteCacheData
                                                     timeoutInterval:60];
  [request setHTTPMethod:@"POST"];
  [request setHTTPBody:[profileData dataUsingEncoding:NSUTF8StringEncoding]];

  // Send the request
  NSURLConnection *connection = [[NSURLConnection alloc] initWithRequest:request delegate:nil];

  if (connection) {
    RCTLogInfo(@"JSC CPU Profile data sent successfully.");
  } else {
    RCTLogWarn(@"JSC CPU Profile data failed to send.");
  }
}

- (void)operationCompletedWithResults:(NSString *)results
{
  // Send the results to the packager, using the module's queue.
  dispatch_async(self.methodQueue, ^{
    [self operationComplete:0 result:results error:nil];
  });
}

#endif

@end
