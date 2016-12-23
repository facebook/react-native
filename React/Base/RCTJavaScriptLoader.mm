/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTJavaScriptLoader.h"

#import <sys/stat.h>

#import <cxxreact/JSBundleType.h>
#import <jschelpers/JavaScriptCore.h>

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTMultipartDataTask.h"
#import "RCTPerformanceLogger.h"
#import "RCTUtils.h"

NSString *const RCTJavaScriptLoaderErrorDomain = @"RCTJavaScriptLoaderErrorDomain";

@implementation RCTLoadingProgress

- (NSString *)description
{
  NSMutableString *desc = [NSMutableString new];
  [desc appendString:_status ?: @"Loading"];

  if (_total > 0) {
    [desc appendFormat:@" %ld%% (%@/%@)", (long)(100 * [_done integerValue] / [_total integerValue]), _done, _total];
  }
  [desc appendString:@"\u2026"];
  return desc;
}

@end

@implementation RCTJavaScriptLoader

RCT_NOT_IMPLEMENTED(- (instancetype)init)

+ (void)loadBundleAtURL:(NSURL *)scriptURL onProgress:(RCTSourceLoadProgressBlock)onProgress onComplete:(RCTSourceLoadBlock)onComplete
{
  int64_t sourceLength;
  NSError *error;
  NSData *data = [self attemptSynchronousLoadOfBundleAtURL:scriptURL
                                          runtimeBCVersion:JSNoBytecodeFileFormatVersion
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
    attemptAsynchronousLoadOfBundleAtURL(scriptURL, onProgress, onComplete);
  } else {
    onComplete(error, nil, 0);
  }
}

+ (NSData *)attemptSynchronousLoadOfBundleAtURL:(NSURL *)scriptURL
                               runtimeBCVersion:(int32_t)runtimeBCVersion
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

  facebook::react::BundleHeader header{};
  size_t readResult = fread(&header, sizeof(header), 1, bundle);
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

  facebook::react::ScriptTag tag = facebook::react::parseTypeFromHeader(header);
  switch (tag) {
  case facebook::react::ScriptTag::RAMBundle:
    break;

  case facebook::react::ScriptTag::String:
    if (error) {
      *error = [NSError errorWithDomain:RCTJavaScriptLoaderErrorDomain
                                   code:RCTJavaScriptLoaderErrorCannotBeLoadedSynchronously
                               userInfo:@{NSLocalizedDescriptionKey:
                                            @"Cannot load text/javascript files synchronously"}];
    }
    return nil;

  case facebook::react::ScriptTag::BCBundle:
    if (header.BCVersion != runtimeBCVersion) {
      if (error) {
        NSString *errDesc =
          [NSString stringWithFormat:@"BC Version Mismatch. Expect: %d, Actual: %d",
                    runtimeBCVersion, header.BCVersion];

        *error = [NSError errorWithDomain:RCTJavaScriptLoaderErrorDomain
                                     code:RCTJavaScriptLoaderErrorBCVersion
                                 userInfo:@{NSLocalizedDescriptionKey: errDesc}];
      }
      return nil;
    }
    break;
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
  return [NSData dataWithBytes:&header length:sizeof(header)];
}

static void attemptAsynchronousLoadOfBundleAtURL(NSURL *scriptURL, RCTSourceLoadProgressBlock onProgress, RCTSourceLoadBlock onComplete)
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


  RCTMultipartDataTask *task = [[RCTMultipartDataTask alloc] initWithURL:scriptURL partHandler:^(NSInteger statusCode, NSDictionary *headers, NSData *data, NSError *error, BOOL done) {
    if (!done) {
      if (onProgress) {
        onProgress(progressEventFromData(data));
      }
      return;
    }

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

    // For multipart responses packager sets X-Http-Status header in case HTTP status code
    // is different from 200 OK
    NSString *statusCodeHeader = [headers valueForKey:@"X-Http-Status"];
    if (statusCodeHeader) {
      statusCode = [statusCodeHeader integerValue];
    }

    if (statusCode != 200) {
      error = [NSError errorWithDomain:@"JSServer"
                                  code:statusCode
                              userInfo:userInfoForRawResponse([[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding])];
      onComplete(error, nil, 0);
      return;
    }
    onComplete(nil, data, data.length);
  }];

  [task startTask];
}

static NSURL *sanitizeURL(NSURL *url)
{
  // Why we do this is lost to time. We probably shouldn't; passing a valid URL is the caller's responsibility not ours.
  return [RCTConvert NSURL:url.absoluteString];
}

static RCTLoadingProgress *progressEventFromData(NSData *rawData)
{
  NSString *text = [[NSString alloc] initWithData:rawData encoding:NSUTF8StringEncoding];
  id info = RCTJSONParse(text, nil);
  if (!info || ![info isKindOfClass:[NSDictionary class]]) {
    return nil;
  }

  RCTLoadingProgress *progress = [RCTLoadingProgress new];
  progress.status = [info valueForKey:@"status"];
  progress.done = [info valueForKey:@"done"];
  progress.total = [info valueForKey:@"total"];
  return progress;
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
