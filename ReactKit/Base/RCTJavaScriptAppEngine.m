// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTJavaScriptAppEngine.h"

#import "RCTBridge.h"
#import "RCTInvalidating.h"
#import "RCTLog.h"
#import "RCTRedBox.h"
#import "RCTUtils.h"

#define JS_SERVER_NOT_AVAILABLE @"Could not connect to development server. Ensure node server is running - run 'npm start' from ReactKit root"

#define CACHE_DIR @"RCTJSBundleCache"

#pragma mark - Application Engine

/**
 * TODO:
 * - Add window resize rotation events matching the DOM API.
 * - Device pixel ration hooks.
 * - Source maps.
 */
@implementation RCTJavaScriptAppEngine
{
  NSDictionary *_loadedResource;
  __weak RCTBridge *_bridge;
}

- (instancetype)init
{
  RCT_NOT_DESIGNATED_INITIALIZER();
}

/**
 * `CADisplayLink` code copied from Ejecta but we've placed the JavaScriptCore
 * engine in its own dedicated thread.
 *
 * TODO: Try adding to the `RCTJavaScriptExecutor`'s thread runloop. Removes one
 * additional GCD dispatch per frame and likely makes it so that other UIThread
 * operations don't delay the dispatch (so we can begin working in JS much
 * faster.) Event handling must still be sent via a GCD dispatch, of course.
 *
 * We must add the display link to two runloops in order to get setTimeouts to
 * fire during scrolling. (`NSDefaultRunLoopMode` and `UITrackingRunLoopMode`)
 * TODO: We can invent a `requestAnimationFrame` and
 * `requestAvailableAnimationFrame` to control if callbacks can be fired during
 * an animation.
 * http://stackoverflow.com/questions/12622800/why-does-uiscrollview-pause-my-cadisplaylink
 *
 */
- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  RCTAssertMainThread();
  
  if ((self = [super init])) {
    _bridge = bridge;
  }
  return self;
}

#pragma mark - Module and script loading

+ (void)resetCacheForBundleAtURL:(NSURL *)moduleURL
{
  NSString *rootPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject];
  NSString *fileDir = [rootPath stringByAppendingPathComponent:CACHE_DIR];
  NSString *filePath = [fileDir stringByAppendingPathComponent:RCTMD5Hash(moduleURL.absoluteString)];
  [[NSFileManager defaultManager] removeItemAtPath:filePath error:NULL];
}

/**
 * TODO: All loading of script via network or disk should be done in a separate
 * thread, not the JS thread, and not the main UI thread (launch blocker).
 */
- (void)loadBundleAtURL:(NSURL *)moduleURL useCache:(BOOL)useCache onComplete:(RCTJavaScriptCompleteBlock)onComplete
{
  NSString *cachedFilePath;
  if (useCache) {
    NSString *rootPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject];
    NSString *fileDir = [rootPath stringByAppendingPathComponent:CACHE_DIR];
    cachedFilePath = [fileDir stringByAppendingPathComponent:RCTMD5Hash(moduleURL.absoluteString)];
    if ([[NSFileManager defaultManager] fileExistsAtPath:cachedFilePath]) {
      NSError *error;
      NSString *rawText = [NSString stringWithContentsOfFile:cachedFilePath encoding:NSUTF8StringEncoding error:&error];
      if (rawText.length == 0 || error != nil) {
        if (onComplete) onComplete(error);
      } else {
        [self _enqueueLoadBundleResource:rawText url:moduleURL onComplete:onComplete];
      }
      return;
    }
  }

  NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithURL:moduleURL completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
    if (error != nil) {
      if ([[error domain] isEqualToString:NSURLErrorDomain]) {
        NSDictionary *userInfo = @{
                                   NSLocalizedDescriptionKey: JS_SERVER_NOT_AVAILABLE,
                                   NSLocalizedFailureReasonErrorKey: [error localizedDescription],
                                   NSUnderlyingErrorKey: error,
                                   };
        error = [NSError errorWithDomain:@"JSServer"
                                    code:error.code
                                userInfo:userInfo];
      }
      if (onComplete) onComplete(error);
      return;
    }


    NSStringEncoding encoding = NSUTF8StringEncoding;
    if (response.textEncodingName != nil) {
      CFStringEncoding cfEncoding = CFStringConvertIANACharSetNameToEncoding((CFStringRef)response.textEncodingName);
      if (cfEncoding != kCFStringEncodingInvalidId) {
        encoding = CFStringConvertEncodingToNSStringEncoding(cfEncoding);
      }
    }

    NSString *rawText = [[NSString alloc] initWithData:data encoding:encoding];

    if ([response isKindOfClass:[NSHTTPURLResponse class]] && [(NSHTTPURLResponse *)response statusCode] != 200) {
      NSDictionary *userInfo;
      NSDictionary *errorDetails = RCTJSONParse(rawText, nil);
      if ([errorDetails isKindOfClass:[NSDictionary class]]) {
        userInfo = @{
                     NSLocalizedDescriptionKey: errorDetails[@"message"] ?: @"No message provided",
                     @"stack": @[@{
                                   @"methodName": errorDetails[@"description"] ?: @"",
                                   @"file": errorDetails[@"filename"] ?: @"",
                                   @"lineNumber": errorDetails[@"lineNumber"] ?: @0
                                   }]
                     };
      } else {
        userInfo = @{NSLocalizedDescriptionKey: rawText};
      }
      NSError *serverError = [NSError errorWithDomain:@"JSServer"
                                                 code:[(NSHTTPURLResponse *)response statusCode]
                                             userInfo:userInfo];
      if (onComplete) onComplete(serverError);
      return;
    }

    if (useCache) {
      [[NSFileManager defaultManager] createDirectoryAtPath:cachedFilePath.stringByDeletingLastPathComponent withIntermediateDirectories:YES attributes:nil error:NULL];
      [rawText writeToFile:cachedFilePath atomically:YES encoding:encoding error:NULL];
    }

    [self _enqueueLoadBundleResource:rawText url:moduleURL onComplete:onComplete];
  }];
  [task resume];
}

- (void)_enqueueLoadBundleResource:(NSString *)rawText url:(NSURL *)url onComplete:(RCTJavaScriptCompleteBlock)onComplete
{
  [_bridge enqueueApplicationScript:rawText url:url onComplete:onComplete];
}

@end
