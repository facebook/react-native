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
#import "RCTPerformanceLogger.h"

#include <sys/stat.h>

uint32_t const RCTRAMBundleMagicNumber = 0xFB0BD1E5;

@implementation RCTJavaScriptLoader

RCT_NOT_IMPLEMENTED(- (instancetype)init)

+ (void)loadBundleAtURL:(NSURL *)scriptURL onComplete:(RCTSourceLoadBlock)onComplete
{
  NSString *unsanitizedScriptURLString = scriptURL.absoluteString;
  // Sanitize the script URL
  scriptURL = [RCTConvert NSURL:unsanitizedScriptURLString];

  if (!scriptURL) {
    NSString *errorDescription = [NSString stringWithFormat:@"No script URL provided."
                                  @"unsanitizedScriptURLString:(%@)", unsanitizedScriptURLString];
    NSError *error = [NSError errorWithDomain:@"JavaScriptLoader" code:1 userInfo:@{
      NSLocalizedDescriptionKey: errorDescription
    }];
    onComplete(error, nil, 0);
    return;
  }

  // Load local script file
  if (scriptURL.fileURL) {
    // Load the first 4 bytes to check if the bundle is regular or RAM ("Random Access Modules" bundle).
    // The RAM bundle has a magic number in the 4 first bytes `(0xFB0BD1E5)`.
    // The benefit of RAM bundle over a regular bundle is that we can lazily inject
    // modules into JSC as they're required.
    FILE *bundle = fopen(scriptURL.path.UTF8String, "r");
    if (!bundle) {
      onComplete(RCTErrorWithMessage([NSString stringWithFormat:@"Error opening bundle %@", scriptURL.path]), nil, 0);
      return;
    }

    uint32_t magicNumber;
    size_t readResult = fread(&magicNumber, sizeof(magicNumber), 1, bundle);
    fclose(bundle);
    if (readResult != 1) {
      onComplete(RCTErrorWithMessage(@"Error reading bundle"), nil, 0);
      return;
    }

    magicNumber = NSSwapLittleIntToHost(magicNumber);

    if (magicNumber == RCTRAMBundleMagicNumber) {
      NSData *source = [NSData dataWithBytes:&magicNumber length:sizeof(magicNumber)];
      NSError *error = nil;
      int64_t sourceLength = 0;

      struct stat statInfo;
      if (stat(scriptURL.path.UTF8String, &statInfo) != 0) {
        error = RCTErrorWithMessage(@"Error reading bundle");
      } else {
        sourceLength = statInfo.st_size;
      }
      onComplete(error, source, sourceLength);
    }

    // Reading in a large bundle can be slow. Dispatch to the background queue to do it.
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
      NSError *error = nil;
      NSData *source = [NSData dataWithContentsOfFile:scriptURL.path
                                              options:NSDataReadingMappedIfSafe
                                                error:&error];
      onComplete(error, source, source.length);
    });
    return;
  }

  // Load remote script file
  NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithURL:scriptURL completionHandler:
                                ^(NSData *data, NSURLResponse *response, NSError *error) {

    // Handle general request errors
    if (error) {
      if ([error.domain isEqualToString:NSURLErrorDomain]) {
        NSString *desc = [@"Could not connect to development server.\n\nEnsure the following:\n- Node server is running and available on the same network - run 'npm start' from react-native root\n- Node server URL is correctly set in AppDelegate\n\nURL: " stringByAppendingString:scriptURL.absoluteString];
        NSDictionary *userInfo = @{
          NSLocalizedDescriptionKey: desc,
          NSLocalizedFailureReasonErrorKey: error.localizedDescription,
          NSUnderlyingErrorKey: error,
        };
        error = [NSError errorWithDomain:@"JSServer"
                                    code:error.code
                                userInfo:userInfo];
      }
      onComplete(error, nil, 0);
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
    // Handle HTTP errors
    if ([response isKindOfClass:[NSHTTPURLResponse class]] && ((NSHTTPURLResponse *)response).statusCode != 200) {
      NSString *rawText = [[NSString alloc] initWithData:data encoding:encoding];
      NSDictionary *userInfo;
      NSDictionary *errorDetails = RCTJSONParse(rawText, nil);
      if ([errorDetails isKindOfClass:[NSDictionary class]] &&
          [errorDetails[@"errors"] isKindOfClass:[NSArray class]]) {
        NSMutableArray<NSDictionary *> *fakeStack = [NSMutableArray new];
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
                                  code:((NSHTTPURLResponse *)response).statusCode
                              userInfo:userInfo];

      onComplete(error, nil, 0);
      return;
    }
    onComplete(nil, data, data.length);
  }];

  [task resume];
}

@end
