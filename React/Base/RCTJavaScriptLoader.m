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
  if ((self = [super init])) {
    _bridge = bridge;
  }
  return self;
}

- (void)loadBundleAtURL:(NSURL *)scriptURL onComplete:(void (^)(NSError *))onComplete
{
  NSURL *originalURL = scriptURL;
  if (!scriptURL.scheme || [scriptURL isFileURL]) {
    scriptURL = [RCTConvert NSURL:scriptURL.path];
  }

  if (scriptURL == nil) {
    NSError *error = [NSError errorWithDomain:@"JavaScriptLoader" code:1 userInfo:@{
      NSLocalizedDescriptionKey: originalURL ? [NSString stringWithFormat:@"Script URL '%@' could not be found.", originalURL] : @"No script URL provided."
    }];
    onComplete(error);
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
      onComplete(error);
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

      onComplete(error);
      return;
    }
    RCTSourceCode *sourceCodeModule = _bridge.modules[RCTBridgeModuleNameForClass([RCTSourceCode class])];
    sourceCodeModule.scriptURL = scriptURL;
    sourceCodeModule.scriptText = rawText;

    [_bridge enqueueApplicationScript:rawText url:scriptURL onComplete:^(NSError *scriptError) {
      dispatch_async(dispatch_get_main_queue(), ^{
        onComplete(scriptError);
      });
    }];
  }];

  [task resume];
}

@end
