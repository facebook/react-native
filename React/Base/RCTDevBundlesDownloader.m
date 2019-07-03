/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDevBundlesDownloader.h"

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTMultipartDataTask.h"
#import "RCTPerformanceLogger.h"
#import "RCTUtils.h"
#import "RCTBundleURLProvider.h"

NSString *const RCTDevBundleDownloaderErrorDomain = @"RCTDevBundleDownloaderErrorDomain";


@interface RCTDevBundleSource()
{
@public
  NSURL *_url;
  NSData *_data;
  NSUInteger _length;
  NSInteger _filesChangedCount;
}

@end

@implementation RCTDevBundleSource

static RCTDevBundleSource *RCTSourceCreate(NSURL *url, NSData *data, int64_t length, NSString *bundleName) NS_RETURNS_RETAINED
{
  RCTDevBundleSource *source = [RCTDevBundleSource new];
  source->_url = url;
  source->_data = data;
  source->_length = length;
  source->_filesChangedCount = RCTDevSourceFilesChangedCountNotBuiltByBundler;
  source->_bundleName = bundleName;
  return source;
}

@end

@implementation RCTDevBundleLoadingProgress

- (NSString *)description
{
  NSMutableString *desc = [NSMutableString new];
  [desc appendString:_status ?: @"Loading"];
  
  if ([_total integerValue] > 0) {
    [desc appendFormat:@" %ld%% (%@/%@)", (long)(100 * [_done integerValue] / [_total integerValue]), _done, _total];
  }
  [desc appendString:@"\u2026"];
  return desc;
}

@end

@implementation RCTDevBundlesDownloader

RCT_NOT_IMPLEMENTED(- (instancetype)init)
+ (void)loadBundleAtURL:(NSURL *)scriptURL onProgress:(RCTDevBundlesProgressBlock)onProgress onComplete:(RCTDevBundlesLoadBlock)onComplete
{
  // FETCH INITIAL BUNDLE
  attemptAsynchronousLoadOfBundleAtURL(scriptURL, ^(RCTDevBundleLoadingProgress *progressData) {
    // Display progres from initial bundle only
    onProgress(progressData);
  }, ^(NSError *error, RCTDevBundleSource *initialBundle, NSArray<NSString *> *additionalBundles) {
    if(error) {
      onComplete(error, nil);
    } else {
      NSMutableDictionary *bundlesContainer = [[NSMutableDictionary alloc] init];
      [bundlesContainer setValue:initialBundle forKey:initialBundle.url.absoluteString];
      if(additionalBundles) {
        downloadAdditionalBundles(additionalBundles, bundlesContainer, onComplete);
      } else {
        onComplete(error, bundlesContainer);
      }
    }
  });
}

static void parseHeaders(NSDictionary *headers, RCTDevBundleSource *source) {
  source->_filesChangedCount = [headers[@"X-Metro-Files-Changed-Count"] integerValue];
}

static void attemptAsynchronousLoadOfBundleAtURL(NSURL *scriptURL, RCTDevBundleProgressBlock onProgress, RCTDevBundleLoadBlock onComplete)
{
  scriptURL = sanitizeURL(scriptURL);
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
        error = [NSError errorWithDomain:RCTDevBundleDownloaderErrorDomain
                                    code:RCTDevBundleDownloaderErrorURLLoadFailed
                                userInfo:
                 @{
                   NSLocalizedDescriptionKey:
                     [@"Could not connect to development server.\n\n"
                      "Ensure the following:\n"
                      "- Node server is running and available on the same network - run 'npm start' from react-native root\n"
                      "- Node server URL is correctly set in AppDelegate\n"
                      "- WiFi is enabled and connected to the same network as the Node Server\n\n"
                      "URL: " stringByAppendingString:scriptURL.absoluteString],
                   NSLocalizedFailureReasonErrorKey: error.localizedDescription,
                   NSUnderlyingErrorKey: error,
                   }];
      }
      onComplete(error, nil, nil);
      return;
    }
    
    // For multipart responses packager sets X-Http-Status header in case HTTP status code
    // is different from 200 OK
    NSString *statusCodeHeader = headers[@"X-Http-Status"];
    if (statusCodeHeader) {
      statusCode = [statusCodeHeader integerValue];
    }
    
    if (statusCode != 200) {
      error = [NSError errorWithDomain:@"JSServer"
                                  code:statusCode
                              userInfo:userInfoForRawResponse([[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding])];
      onComplete(error, nil, nil);
      return;
    }
    
    // Validate that the packager actually returned javascript.
    NSString *contentType = headers[@"Content-Type"];
    NSString *mimeType = [[contentType componentsSeparatedByString:@";"] firstObject];
    if (![mimeType isEqualToString:@"application/javascript"] &&
        ![mimeType isEqualToString:@"text/javascript"]) {
      NSString *description = [NSString stringWithFormat:@"Expected MIME-Type to be 'application/javascript' or 'text/javascript', but got '%@'.", mimeType];
      error = [NSError errorWithDomain:@"JSServer"
                                  code:NSURLErrorCannotParseResponse
                              userInfo:@{
                                         NSLocalizedDescriptionKey: description,
                                         @"headers": headers,
                                         @"data": data
                                         }];
      onComplete(error, nil, nil);
      return;
    }
    
    RCTDevBundleSource *source = RCTSourceCreate(scriptURL, data, data.length, getBundleNameFromURL(scriptURL));
    parseHeaders(headers, source);
    
    // Check if there are additional bundles to fetch
    NSString *additionalBundlesHeader = headers[@"X-multi-bundle"];
    NSArray *additionalBundles;
    if(additionalBundlesHeader) {
      additionalBundles = [additionalBundlesHeader componentsSeparatedByString:@","];
    }
    
    onComplete(nil, source, additionalBundles);
  } progressHandler:^(NSDictionary *headers, NSNumber *loaded, NSNumber *total) {
    // Only care about download progress events for the javascript bundle part.
    if (onProgress && [headers[@"Content-Type"] isEqualToString:@"application/javascript"]) {
      onProgress(progressEventFromDownloadProgress(loaded, total));
    }
  }];
  
  [task startTask];
}

static void downloadAdditionalBundles(NSArray<NSString *> *bundles, NSMutableDictionary *bundlesContainer, RCTDevBundlesLoadBlock onComplete) {
  dispatch_group_t downloadAdditionalBundles = dispatch_group_create();
  __block NSError *err;
  for(NSString * bundleName in bundles) {
    dispatch_group_enter(downloadAdditionalBundles);
    NSURL *bundleURL = getBundleURLFromName(bundleName);
    attemptAsynchronousLoadOfBundleAtURL(bundleURL, nil, ^(NSError *error, RCTDevBundleSource *bundleSource, NSArray<NSString *> *additionalBundles) {
      if(error) {
        err = error;
      }
      [bundlesContainer setValue:bundleSource forKey:bundleURL.absoluteString];
      dispatch_group_leave(downloadAdditionalBundles);
    });
  }
  
  dispatch_group_notify(downloadAdditionalBundles, dispatch_get_global_queue(QOS_CLASS_USER_INTERACTIVE, 0), ^{
    onComplete(err, bundlesContainer);
  });
}

static NSURL *getBundleURLFromName(NSString *bundleName) {
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:bundleName fallbackResource:nil];
}

static NSString *getBundleNameFromURL(NSURL *url) {
  NSString *bundleFilename = url.pathComponents[1];
  NSString *bundleName = [bundleFilename
                          substringToIndex:[bundleFilename rangeOfString:@"."].location];
  return bundleName;
}

static NSURL *sanitizeURL(NSURL *url)
{
  // Why we do this is lost to time. We probably shouldn't; passing a valid URL is the caller's responsibility not ours.
  return [RCTConvert NSURL:url.absoluteString];
}

static RCTDevBundleLoadingProgress *progressEventFromData(NSData *rawData)
{
  NSString *text = [[NSString alloc] initWithData:rawData encoding:NSUTF8StringEncoding];
  id info = RCTJSONParse(text, nil);
  if (!info || ![info isKindOfClass:[NSDictionary class]]) {
    return nil;
  }

  RCTDevBundleLoadingProgress *progress = [RCTDevBundleLoadingProgress new];
  progress.status = info[@"status"];
  progress.done = info[@"done"];
  progress.total = info[@"total"];
  return progress;
}


static RCTDevBundleLoadingProgress *progressEventFromDownloadProgress(NSNumber *total, NSNumber *done)
{
  RCTDevBundleLoadingProgress *progress = [RCTDevBundleLoadingProgress new];
  progress.status = @"Downloading JavaScript bundle";
  // Progress values are in bytes transform them to kilobytes for smaller numbers.
  progress.done = done != nil ? @([done integerValue] / 1024) : nil;
  progress.total = total != nil ? @([total integerValue] / 1024) : nil;
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
    [fakeStack addObject: @{
                            @"methodName": err[@"description"] ?: @"",
                            @"file": err[@"filename"] ?: @"",
                            @"lineNumber": err[@"lineNumber"] ?: @0
                            }];
  }
  return @{NSLocalizedDescriptionKey: parsedResponse[@"message"] ?: @"No message provided", @"stack": [fakeStack copy]};
}

@end
