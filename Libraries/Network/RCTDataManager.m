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
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTUtils.h"

@interface RCTDataManager () <NSURLSessionDataDelegate>

@end

@implementation RCTDataManager
{
  NSURLSession *_session;
  NSOperationQueue *_callbackQueue;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

/**
 * Executes a network request.
 * The responseSender block won't be called on same thread as called.
 */
RCT_EXPORT_METHOD(queryData:(NSString *)queryType
                  withQuery:(NSDictionary *)query
                  sendIncrementalUpdates:(BOOL)incrementalUpdates
                  responseSender:(RCTResponseSenderBlock)responseSender)
{
  if ([queryType isEqualToString:@"http"]) {

    // Build request
    NSURL *URL = [RCTConvert NSURL:query[@"url"]];
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:URL];
    request.HTTPMethod = [RCTConvert NSString:query[@"method"]] ?: @"GET";
    request.allHTTPHeaderFields = [RCTConvert NSDictionary:query[@"headers"]];
    request.HTTPBody = [RCTConvert NSData:query[@"data"]];

    // Create session if one doesn't already exist
    if (!_session) {
      _callbackQueue = [[NSOperationQueue alloc] init];
      NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
      _session = [NSURLSession sessionWithConfiguration:configuration
                                               delegate:self
                                          delegateQueue:_callbackQueue];
    }

    __block NSURLSessionDataTask *task;
    if (incrementalUpdates) {
      task = [_session dataTaskWithRequest:request];
    } else {
      task = [_session dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        RCTSendResponseEvent(_bridge, task);
        if (!error) {
          RCTSendDataEvent(_bridge, task, data);
        }
        RCTSendCompletionEvent(_bridge, task, error);
      }];
    }

    // Build data task
    responseSender(@[@(task.taskIdentifier)]);
    [task resume];

  } else {

    RCTLogError(@"unsupported query type %@", queryType);
  }
}

#pragma mark - URLSession delegate

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)task
didReceiveResponse:(NSURLResponse *)response
 completionHandler:(void (^)(NSURLSessionResponseDisposition))completionHandler
{
  RCTSendResponseEvent(_bridge, task);
  completionHandler(NSURLSessionResponseAllow);
}

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)task
    didReceiveData:(NSData *)data
{
  RCTSendDataEvent(_bridge, task, data);
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
  RCTSendCompletionEvent(_bridge, task, error);
}

#pragma mark - Build responses

static void RCTSendResponseEvent(RCTBridge *bridge, NSURLSessionTask *task)
{
  NSURLResponse *response = task.response;
  NSHTTPURLResponse *httpResponse = nil;
  if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
    // Might be a local file request
    httpResponse = (NSHTTPURLResponse *)response;
  }

  NSArray *responseJSON = @[@(task.taskIdentifier),
                            @(httpResponse.statusCode ?: 200),
                            httpResponse.allHeaderFields ?: @{},
                            ];

  [bridge.eventDispatcher sendDeviceEventWithName:@"didReceiveNetworkResponse"
                                             body:responseJSON];
}

static void RCTSendDataEvent(RCTBridge *bridge, NSURLSessionDataTask *task, NSData *data)
{
  // Get text encoding
  NSURLResponse *response = task.response;
  NSStringEncoding encoding = NSUTF8StringEncoding;
  if (response.textEncodingName) {
    CFStringEncoding cfEncoding = CFStringConvertIANACharSetNameToEncoding((CFStringRef)response.textEncodingName);
    encoding = CFStringConvertEncodingToNSStringEncoding(cfEncoding);
  }

  NSString *responseText = [[NSString alloc] initWithData:data encoding:encoding];
  if (!responseText && data.length) {
    RCTLogError(@"Received data was invalid.");
    return;
  }

  NSArray *responseJSON = @[@(task.taskIdentifier), responseText ?: @""];
  [bridge.eventDispatcher sendDeviceEventWithName:@"didReceiveNetworkData"
                                             body:responseJSON];
}

static void RCTSendCompletionEvent(RCTBridge *bridge, NSURLSessionTask *task, NSError *error)
{
  NSArray *responseJSON = @[@(task.taskIdentifier),
                            error.localizedDescription ?: [NSNull null],
                            ];

  [bridge.eventDispatcher sendDeviceEventWithName:@"didCompleteNetworkResponse"
                                             body:responseJSON];
}

@end
