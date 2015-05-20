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
#import "RCTImageLoader.h"

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

    if (query[@"data"] != [NSNull null]) {
      NSDictionary *data = [RCTConvert NSDictionary:query[@"data"]];
      NSData *body = [RCTConvert NSData:data[@"string"]];
      if (body != nil) {
        request.HTTPBody = body;
        [RCTDataManager sendRequest:request responseSender:responseSender];
        return;
      }
      NSString *uri = [RCTConvert NSString:data[@"uri"]];
      if (uri != nil) {
        if ([RCTImageLoader isSystemImageURI:uri]) {
          [RCTImageLoader loadImageWithTag:(NSString *)uri callback:^(NSError *error, UIImage *image) {
            if (error) {
              RCTLogError(@"Error loading image URI: %@", error);
              // We should really circle back to JS here and notify an error/abort on the request.
              return;
            }
            NSData *imageData = UIImageJPEGRepresentation(image, 1.0);
            request.HTTPBody = imageData;
            [RCTDataManager sendRequest:request responseSender:responseSender];
          }];
        } else {
          RCTLogError(@"Cannot resolve URI: %@", uri);
        }
        return;
      }
    }

    // There was no data payload, or we couldn't understand it.
    [RCTDataManager sendRequest:request responseSender:responseSender];
  } else {
    RCTLogError(@"unsupported query type %@", queryType);
  }
}

+ (void)sendRequest:(NSURLRequest *)request responseSender:(RCTResponseSenderBlock)responseSender {
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
          @"responseText": [connectionError localizedDescription] ?: [NSNull null]
        };
      }

      // Send response (won't be sent on same thread as caller)
      responseSender(@[RCTJSONStringify(responseJSON, NULL)]);

    }];

    [task resume];
}

@end
