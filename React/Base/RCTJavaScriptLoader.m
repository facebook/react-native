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

NSString *const RCTJavaScriptLoaderErrorDomain = @"RCTJavaScriptLoaderErrorDomain";

@implementation RCTJavaScriptLoader

RCT_NOT_IMPLEMENTED(- (instancetype)init)

+ (void)loadBundleAtURL:(NSURL *)scriptURL onComplete:(RCTSourceLoadBlock)onComplete
{
  int64_t sourceLength;
  NSError *error;
  NSData *data = [self attemptSynchronousLoadOfBundleAtURL:scriptURL
                                              sourceLength:&sourceLength
                                                     error:&error];
  if (data) {
    onComplete(nil, data, sourceLength);
    return;
  }

  const BOOL isCannotLoadSyncError =
  [error.domain isEqualToString:RCTJavaScriptLoaderErrorDomain]
  && error.code == RCTJavaScriptLoaderErrorCannotBeLoadedSynchronously;

  if (isCannotLoadSyncError) {
    attemptAsynchronousLoadOfBundleAtURL(scriptURL, onComplete);
  } else {
    onComplete(error, nil, 0);
  }
}

+ (NSData *)attemptSynchronousLoadOfBundleAtURL:(NSURL *)scriptURL
                                   sourceLength:(int64_t *)sourceLength
                                          error:(NSError **)error
{
  NSString *unsanitizedScriptURLString = scriptURL.absoluteString;
  // Sanitize the script URL
  scriptURL = sanitizeURL(scriptURL);

  if (!scriptURL) {
    if (error) {
      *error = [NSError errorWithDomain:RCTJavaScriptLoaderErrorDomain
                                   code:RCTJavaScriptLoaderErrorNoScriptURL
                               userInfo:@{NSLocalizedDescriptionKey:
                                            [NSString stringWithFormat:@"No script URL provided. Make sure the packager is "
                                             @"running or you have embedded a JS bundle in your application bundle."
                                             @"unsanitizedScriptURLString:(%@)", unsanitizedScriptURLString]}];
    }
    return nil;
  }

  // Load local script file
  if (!scriptURL.fileURL) {
    if (error) {
      *error = [NSError errorWithDomain:RCTJavaScriptLoaderErrorDomain
                                   code:RCTJavaScriptLoaderErrorCannotBeLoadedSynchronously
                               userInfo:@{NSLocalizedDescriptionKey:
                                            [NSString stringWithFormat:@"Cannot load %@ URLs synchronously",
                                             scriptURL.scheme]}];
    }
    return nil;
  }

  // Load the first 4 bytes to check if the bundle is regular or RAM ("Random Access Modules" bundle).
  // The RAM bundle has a magic number in the 4 first bytes `(0xFB0BD1E5)`.
  // The benefit of RAM bundle over a regular bundle is that we can lazily inject
  // modules into JSC as they're required.
  FILE *bundle = fopen(scriptURL.path.UTF8String, "r");
  if (!bundle) {
    if (error) {
      *error = [NSError errorWithDomain:RCTJavaScriptLoaderErrorDomain
                                   code:RCTJavaScriptLoaderErrorFailedOpeningFile
                               userInfo:@{NSLocalizedDescriptionKey:
                                            [NSString stringWithFormat:@"Error opening bundle %@", scriptURL.path]}];
    }
    return nil;
  }

  uint32_t magicNumber;
  size_t readResult = fread(&magicNumber, sizeof(magicNumber), 1, bundle);
  fclose(bundle);
  if (readResult != 1) {
    if (error) {
      *error = [NSError errorWithDomain:RCTJavaScriptLoaderErrorDomain
                                   code:RCTJavaScriptLoaderErrorFailedReadingFile
                               userInfo:@{NSLocalizedDescriptionKey:
                                            [NSString stringWithFormat:@"Error reading bundle %@", scriptURL.path]}];
    }
    return nil;
  }

  magicNumber = NSSwapLittleIntToHost(magicNumber);
  if (magicNumber != RCTRAMBundleMagicNumber) {
    if (error) {
      *error = [NSError errorWithDomain:RCTJavaScriptLoaderErrorDomain
                                   code:RCTJavaScriptLoaderErrorCannotBeLoadedSynchronously
                               userInfo:@{NSLocalizedDescriptionKey:
                                            @"Cannot load non-RAM bundled files synchronously"}];
    }
    return nil;
  }

  struct stat statInfo;
  if (stat(scriptURL.path.UTF8String, &statInfo) != 0) {
    if (error) {
      *error = [NSError errorWithDomain:RCTJavaScriptLoaderErrorDomain
                                   code:RCTJavaScriptLoaderErrorFailedStatingFile
                               userInfo:@{NSLocalizedDescriptionKey:
                                            [NSString stringWithFormat:@"Error stating bundle %@", scriptURL.path]}];
    }
    return nil;
  }
  if (sourceLength) {
    *sourceLength = statInfo.st_size;
  }
  return [NSData dataWithBytes:&magicNumber length:sizeof(magicNumber)];
}

static void attemptAsynchronousLoadOfBundleAtURL(NSURL *scriptURL, RCTSourceLoadBlock onComplete)
{
  scriptURL = sanitizeURL(scriptURL);

  if (scriptURL.fileURL) {
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
  NSURLSessionDataTask *task =
  [[NSURLSession sharedSession] dataTaskWithURL:scriptURL completionHandler:
   ^(NSData *data, NSURLResponse *response, NSError *error) {

     // Handle general request errors
     if (error) {
       if ([error.domain isEqualToString:NSURLErrorDomain]) {
         error = [NSError errorWithDomain:RCTJavaScriptLoaderErrorDomain
                                     code:RCTJavaScriptLoaderErrorURLLoadFailed
                                 userInfo:
                  @{
                    NSLocalizedDescriptionKey:
                      [@"Could not connect to development server.\n\n"
                       "Ensure the following:\n"
                       "- Node server is running and available on the same network - run 'npm start' from react-native root\n"
                       "- Node server URL is correctly set in AppDelegate\n\n"
                       "URL: " stringByAppendingString:scriptURL.absoluteString],
                    NSLocalizedFailureReasonErrorKey: error.localizedDescription,
                    NSUnderlyingErrorKey: error,
                    }];
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
       error = [NSError errorWithDomain:@"JSServer"
                                   code:((NSHTTPURLResponse *)response).statusCode
                               userInfo:userInfoForRawResponse([[NSString alloc] initWithData:data encoding:encoding])];
       onComplete(error, nil, 0);
       return;
     }
     onComplete(nil, data, data.length);
   }];
  [task resume];
}

static NSURL *sanitizeURL(NSURL *url)
{
  // Why we do this is lost to time. We probably shouldn't; passing a valid URL is the caller's responsibility not ours.
  return [RCTConvert NSURL:url.absoluteString];
}

static NSDictionary *userInfoForRawResponse(NSString *rawText)
{
  NSDictionary *parsedResponse = RCTJSONParse(rawText, nil);
  if (![parsedResponse isKindOfClass:[NSDictionary class]]) {
    return @{NSLocalizedDescriptionKey: rawText};
  }
  NSArray *errors = parsedResponse[@"errors"];
  if (![errors isKindOfClass:[NSArray class]]) {
    return @{NSLocalizedDescriptionKey: rawText};
  }
  NSMutableArray<NSDictionary *> *fakeStack = [NSMutableArray new];
  for (NSDictionary *err in errors) {
    [fakeStack addObject:
     @{
       @"methodName": err[@"description"] ?: @"",
       @"file": err[@"filename"] ?: @"",
       @"lineNumber": err[@"lineNumber"] ?: @0
       }];
  }
  return @{NSLocalizedDescriptionKey: parsedResponse[@"message"] ?: @"No message provided", @"stack": [fakeStack copy]};
}

@end
