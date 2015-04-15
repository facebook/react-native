/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTDataManager.h"

#import "RCTAssert.h"
#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTUtils.h"

@implementation RCTDataManager

RCT_EXPORT_MODULE()

/**
 * Executes a network request.
 * The responseSender block won't be called on same thread as called.
 */
RCT_EXPORT_METHOD(queryData:(NSString *)queryType
                  withQuery:(NSDictionary *)query
                  queryHash:(__unused NSString *)queryHash
                  responseSender:(RCTResponseSenderBlock)responseSender)
{
  if ([queryType isEqualToString:@"http"]) {

    // Build request
    NSURL *URL = [RCTConvert NSURL:query[@"url"]];
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:URL];
    request.HTTPMethod = [RCTConvert NSString:query[@"method"]] ?: @"GET";
    request.allHTTPHeaderFields = [RCTConvert NSDictionary:query[@"headers"]];
    request.HTTPBody = [RCTConvert NSData:query[@"data"]];

    // Build data task
    NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *connectionError) {

      // Build response
      NSDictionary *responseJSON;
      if (connectionError == nil) {
        NSStringEncoding encoding = NSUTF8StringEncoding;
        if (response.textEncodingName) {
          CFStringEncoding cfEncoding = CFStringConvertIANACharSetNameToEncoding((CFStringRef)response.textEncodingName);
          encoding = CFStringConvertEncodingToNSStringEncoding(cfEncoding);
        }
        NSHTTPURLResponse *httpResponse = nil;
        if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
          // Might be a local file request
          httpResponse = (NSHTTPURLResponse *)response;
        }
        responseJSON = @{
          @"status": @([httpResponse statusCode] ?: 200),
          @"responseHeaders": [httpResponse allHeaderFields] ?: @{},
          @"responseText": [[NSString alloc] initWithData:data encoding:encoding] ?: @""
        };
      } else {
        responseJSON = @{
          @"status": @0,
          @"responseHeaders": @{},
          @"responseText": [connectionError localizedDescription]
        };
      }

      // Send response (won't be sent on same thread as caller)
      responseSender(@[RCTJSONStringify(responseJSON, NULL)]);

    }];

    [task resume];

  } else {

    RCTLogError(@"unsupported query type %@", queryType);
  }
}

@end
