/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTJavaScriptLoader.h"

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTSourceCode.h"
#import "RCTUtils.h"

@implementation RCTJavaScriptLoader
{
  __weak RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  RCTAssert(bridge, @"bridge parameter is required");

  if ((self = [super init])) {
    _bridge = bridge;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-init)

- (void)loadBundleAtURL:(NSURL *)scriptURL onComplete:(void (^)(NSError *, NSString *))onComplete
{
  // Sanitize the script URL
  scriptURL = [RCTConvert NSURL:scriptURL.absoluteString];

  if (!scriptURL ||
      ([scriptURL isFileURL] && ![[NSFileManager defaultManager] fileExistsAtPath:scriptURL.path])) {
    NSError *error = [NSError errorWithDomain:@"JavaScriptLoader" code:1 userInfo:@{
      NSLocalizedDescriptionKey: scriptURL ? [NSString stringWithFormat:@"Script at '%@' could not be found.", scriptURL] : @"No script URL provided"
    }];
    onComplete(error, nil);
    return;
  }

  NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithURL:scriptURL completionHandler:
                                ^(NSData *data, NSURLResponse *response, NSError *error) {

    // Handle general request errors
    if (error) {
      if ([[error domain] isEqualToString:NSURLErrorDomain]) {
        NSString *desc = [@"Could not connect to development server. Ensure node server is running and available on the same network - run 'npm start' from react-native root\n\nURL: " stringByAppendingString:[scriptURL absoluteString]];
        NSDictionary *userInfo = @{
          NSLocalizedDescriptionKey: desc,
          NSLocalizedFailureReasonErrorKey: [error localizedDescription],
          NSUnderlyingErrorKey: error,
        };
        error = [NSError errorWithDomain:@"JSServer"
                                    code:error.code
                                userInfo:userInfo];
      }
      onComplete(error, nil);
      return;
    }

    // Parse response as text
    NSStringEncoding encoding = NSUTF8StringEncoding;
    if (response.textEncodingName != nil) {
      CFStringEncoding cfEncoding = CFStringConvertIANACharSetNameToEncoding((CFStringRef)response.textEncodingName);
      if (cfEncoding != kCFStringEncodingInvalidId) {
        encoding = CFStringConvertEncodingToNSStringEncoding(cfEncoding);
      }
    }
    NSString *rawText = [[NSString alloc] initWithData:data encoding:encoding];

    // Handle HTTP errors
    if ([response isKindOfClass:[NSHTTPURLResponse class]] && [(NSHTTPURLResponse *)response statusCode] != 200) {
      NSDictionary *userInfo;
      NSDictionary *errorDetails = RCTJSONParse(rawText, nil);
      if ([errorDetails isKindOfClass:[NSDictionary class]] &&
          [errorDetails[@"errors"] isKindOfClass:[NSArray class]]) {
        NSMutableArray *fakeStack = [[NSMutableArray alloc] init];
        for (NSDictionary *err in errorDetails[@"errors"]) {
          [fakeStack addObject: @{
            @"methodName": err[@"description"] ?: @"",
            @"file": err[@"filename"] ?: @"",
            @"lineNumber": err[@"lineNumber"] ?: @0
          }];
        }
        userInfo = @{
          NSLocalizedDescriptionKey: errorDetails[@"message"] ?: @"No message provided",
          @"stack": fakeStack,
        };
      } else {
        userInfo = @{NSLocalizedDescriptionKey: rawText};
      }
      error = [NSError errorWithDomain:@"JSServer"
                                  code:[(NSHTTPURLResponse *)response statusCode]
                              userInfo:userInfo];

      onComplete(error, nil);
      return;
    }
    onComplete(nil, rawText);
  }];

  [task resume];
}

@end
