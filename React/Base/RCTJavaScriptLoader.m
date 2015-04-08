// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTJavaScriptLoader.h"

#import "RCTBridge.h"
#import "RCTInvalidating.h"
#import "RCTLog.h"
#import "RCTRedBox.h"
#import "RCTSourceCode.h"
#import "RCTUtils.h"

#define NO_REMOTE_MODULE @"Could not fetch module bundle %@. Ensure node server is running.\n\nIf it timed out, try reloading."
#define NO_LOCAL_BUNDLE @"Could not load local bundle %@. Ensure file exists."

#define CACHE_DIR @"RCTJSBundleCache"

#pragma mark - Application Engine

/**
 * TODO:
 * - Add window resize rotation events matching the DOM API.
 * - Device pixel ration hooks.
 * - Source maps.
 */
@implementation RCTJavaScriptLoader
{
  RCTBridge *_bridge;
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
  if (self = [super init]) {
    _bridge = bridge;
  }
  return self;
}

- (void)loadBundleAtURL:(NSURL *)scriptURL onComplete:(void (^)(NSError *))onComplete
{
  if (scriptURL == nil) {
    NSError *error = [NSError errorWithDomain:@"JavaScriptLoader"
                                         code:1
                                     userInfo:@{NSLocalizedDescriptionKey: @"No script URL provided"}];
    onComplete(error);
    return;
  } else if ([scriptURL isFileURL]) {
    NSString *bundlePath = [[NSBundle bundleForClass:[self class]] resourcePath];
    NSString *localPath = [scriptURL.absoluteString substringFromIndex:@"file://".length];

    if (![localPath hasPrefix:bundlePath]) {
      NSString *absolutePath = [NSString stringWithFormat:@"%@/%@", bundlePath, localPath];
      scriptURL = [NSURL fileURLWithPath:absolutePath];
    }
  }

  NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithURL:scriptURL completionHandler:
                                ^(NSData *data, NSURLResponse *response, NSError *error) {

                                  // Handle general request errors
                                  if (error) {
                                    if ([[error domain] isEqualToString:NSURLErrorDomain]) {
                                      NSDictionary *userInfo = @{
                                                                 NSLocalizedDescriptionKey: @"Could not connect to development server. Ensure node server is running - run 'npm start' from ReactKit root",
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

                                  [_bridge enqueueApplicationScript:rawText url:scriptURL onComplete:^(NSError *_error) {
                                    dispatch_async(dispatch_get_main_queue(), ^{
                                      onComplete(_error);
                                    });
                                  }];
                                }];

  [task resume];
}

@end
