/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTHTTPQueryExecutor.h"

#import "RCTAssert.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTImageLoader.h"
#import "RCTLog.h"
#import "RCTUtils.h"

/**
 * Helper to convert FormData payloads into multipart/formdata requests.
 */
@interface RCTHTTPFormDataHelper : NSObject

- (void)process:(NSArray *)formData callback:(void (^)(NSError *error, NSDictionary *result))callback;

@end

@implementation RCTHTTPFormDataHelper
{
  NSMutableArray *parts;
  NSMutableData *multipartBody;
  RCTResultOrErrorBlock callback;
  NSString *boundary;
}

- (void)process:(NSArray *)formData callback:(void (^)(NSError *error, NSDictionary *result))cb
{
  if (![formData count]) {
    RCTDispatchCallbackOnMainQueue(cb, nil, nil);
    return;
  }
  parts = [formData mutableCopy];
  callback = cb;
  multipartBody = [[NSMutableData alloc] init];
  boundary = [self generateBoundary];

  NSDictionary *currentPart = [parts objectAtIndex: 0];
  [RCTHTTPQueryExecutor processDataForHTTPQuery:currentPart callback:^(NSError *e, NSDictionary *r) {
    [self handleResult:r error:e];
  }];
}

- (NSString *)generateBoundary
{
  NSString *const boundaryChars = @"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_./";
  const NSUInteger boundaryLength = 70;

  NSMutableString *output = [NSMutableString stringWithCapacity:boundaryLength];
  NSUInteger numchars = [boundaryChars length];
  for (NSUInteger i = 0; i < boundaryLength; i++) {
    [output appendFormat:@"%C", [boundaryChars characterAtIndex:arc4random_uniform((u_int32_t)numchars)]];
  }
  return output;
}

- (void)handleResult:(NSDictionary *)result error:(NSError *)error
{
  if (error) {
    RCTDispatchCallbackOnMainQueue(callback, error, nil);
    return;
  }
  NSDictionary *currentPart = parts[0];
  [parts removeObjectAtIndex:0];

  // Start with boundary.
  [multipartBody appendData:[[NSString stringWithFormat:@"--%@\r\n", boundary]
                             dataUsingEncoding:NSUTF8StringEncoding]];

  // Print headers.
  NSMutableDictionary *headers = [(NSDictionary*)currentPart[@"headers"] mutableCopy];
  NSString *partContentType = result[@"contentType"];
  if (partContentType != nil) {
    [headers setObject:partContentType forKey:@"content-type"];
  }
  [headers enumerateKeysAndObjectsUsingBlock:^(NSString *parameterKey, NSString *parameterValue, BOOL *stop) {
    [multipartBody appendData:[[NSString stringWithFormat:@"%@: %@\r\n", parameterKey, parameterValue]
                               dataUsingEncoding:NSUTF8StringEncoding]];
  }];

  // Add the body.
  [multipartBody appendData:[@"\r\n" dataUsingEncoding:NSUTF8StringEncoding]];
  [multipartBody appendData:result[@"body"]];
  [multipartBody appendData:[@"\r\n" dataUsingEncoding:NSUTF8StringEncoding]];

  if ([parts count]) {
    NSDictionary *nextPart = [parts objectAtIndex: 0];
    [RCTHTTPQueryExecutor processDataForHTTPQuery:nextPart callback:^(NSError *e, NSDictionary *r) {
      [self handleResult:r error:e];
    }];
    return;
  }

  // We've processed the last item. Finish and return.
  [multipartBody appendData:[[NSString stringWithFormat:@"--%@--\r\n", boundary]
                             dataUsingEncoding:NSUTF8StringEncoding]];
  NSString *contentType = [NSString stringWithFormat:@"multipart/form-data; boundary=\"%@\"", boundary];
  callback(nil, @{@"body": multipartBody, @"contentType": contentType});
}

@end

@interface RCTHTTPQueryExecutor () <NSURLSessionDataDelegate>

@end

@implementation RCTHTTPQueryExecutor
{
  NSURLSession *_session;
  NSOperationQueue *_callbackQueue;
}

@synthesize bridge = _bridge;
@synthesize sendIncrementalUpdates = _sendIncrementalUpdates;

+ (instancetype)sharedInstance
{
  static RCTHTTPQueryExecutor *_sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    _sharedInstance = [[RCTHTTPQueryExecutor alloc] init];
  });
  return _sharedInstance;
}

- (void)addQuery:(NSDictionary *)query responseSender:(RCTResponseSenderBlock)responseSender
{
  [self makeRequest:query responseSender:responseSender];
}

- (void)makeRequest:(NSDictionary *)query responseSender:(RCTResponseSenderBlock)responseSender
{
  // Build request
  NSURL *URL = [RCTConvert NSURL:query[@"url"]];
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:URL];
  request.HTTPMethod = [RCTConvert NSString:query[@"method"]] ?: @"GET";
  request.allHTTPHeaderFields = [RCTConvert NSDictionary:query[@"headers"]];

  NSDictionary *data = [RCTConvert NSDictionary:query[@"data"]];

  [[self class] processDataForHTTPQuery:data callback:^(NSError *error, NSDictionary *result) {
    if (error != nil) {
      RCTLogError(@"Error processing request body: %@", error);
      // Ideally we'd circle back to JS here and notify an error/abort on the request.
      return;
    }
    request.HTTPBody = result[@"body"];
    NSString *contentType = result[@"contentType"];
    if (contentType != nil) {
      [request setValue:contentType forHTTPHeaderField:@"content-type"];
    }
    [self sendRequest:request responseSender:responseSender];
  }];
}

+ (void)processURIDataForHTTPQuery:(NSString *)uri callback:(void (^)(NSError *error, NSDictionary *result))callback
{
  if ([RCTImageLoader isSystemImageURI:uri]) {
    [RCTImageLoader loadImageWithTag:(NSString *)uri callback:^(NSError *error, UIImage *image) {
      if (error) {
        RCTDispatchCallbackOnMainQueue(callback, error, nil);
        return;
      }
      NSData *imageData = UIImageJPEGRepresentation(image, 1.0);
      RCTDispatchCallbackOnMainQueue(callback, nil, @{@"body": imageData, @"contentType": @"image/jpeg"});
    }];
    return;
  }
  NSString *errorText = [NSString stringWithFormat:@"Cannot resolve URI: %@", uri];
  NSError *error = RCTErrorWithMessage(errorText);
  RCTDispatchCallbackOnMainQueue(callback, error, nil);
}

+ (void)processDataForHTTPQuery:(NSDictionary *)data callback:(void (^)(NSError *error, NSDictionary *result))callback
{
  if (data == nil) {
    RCTDispatchCallbackOnMainQueue(callback, nil, nil);
    return;
  }

  NSData *body = [RCTConvert NSData:data[@"string"]];
  if (body != nil) {
    RCTDispatchCallbackOnMainQueue(callback, nil, @{@"body": body});
    return;
  }
  NSString *uri = [RCTConvert NSString:data[@"uri"]];
  if (uri != nil) {
    [RCTHTTPQueryExecutor processURIDataForHTTPQuery:uri callback:callback];
    return;
  }
  NSDictionaryArray *formData = [RCTConvert NSDictionaryArray:data[@"formData"]];
  if (formData != nil) {
    RCTHTTPFormDataHelper *formDataHelper = [[RCTHTTPFormDataHelper alloc] init];
    [formDataHelper process:formData callback:callback];
    return;
  }
  // Nothing in the data payload, at least nothing we could understand anyway.
  // Ignore and treat it as if it were null.
  RCTDispatchCallbackOnMainQueue(callback, nil, nil);
}

- (void)sendRequest:(NSURLRequest *)request responseSender:(RCTResponseSenderBlock)responseSender
{
  // Create session if one doesn't already exist
  if (!_session) {
    _callbackQueue = [[NSOperationQueue alloc] init];
    NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
    _session = [NSURLSession sessionWithConfiguration:configuration
                                             delegate:self
                                        delegateQueue:_callbackQueue];
  }

  __block NSURLSessionDataTask *task;
  if (_sendIncrementalUpdates) {
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
