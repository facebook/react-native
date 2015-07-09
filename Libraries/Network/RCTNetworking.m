/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTNetworking.h"

#import "RCTAssert.h"
#import "RCTConvert.h"
#import "RCTURLRequestHandler.h"
#import "RCTEventDispatcher.h"
#import "RCTHTTPRequestHandler.h"
#import "RCTLog.h"
#import "RCTUtils.h"

typedef void (^RCTHTTPQueryResult)(NSError *error, NSDictionary *result);

@interface RCTNetworking ()<RCTURLRequestDelegate>

- (void)processDataForHTTPQuery:(NSDictionary *)data callback:(void (^)(NSError *error, NSDictionary *result))callback;

@end

/**
 * Helper to convert FormData payloads into multipart/formdata requests.
 */
@interface RCTHTTPFormDataHelper : NSObject

@property (nonatomic, weak) RCTNetworking *dataManager;

@end

@implementation RCTHTTPFormDataHelper
{
  NSMutableArray *parts;
  NSMutableData *multipartBody;
  RCTHTTPQueryResult _callback;
  NSString *boundary;
}

- (void)process:(NSArray *)formData callback:(void (^)(NSError *error, NSDictionary *result))callback
{
  if (![formData count]) {
    callback(nil, nil);
    return;
  }
  parts = [formData mutableCopy];
  _callback = callback;
  multipartBody = [[NSMutableData alloc] init];
  boundary = [self generateBoundary];

  NSDictionary *currentPart = [parts objectAtIndex: 0];
  [_dataManager processDataForHTTPQuery:currentPart callback:^(NSError *e, NSDictionary *r) {
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
    _callback(error, nil);
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
    [_dataManager processDataForHTTPQuery:nextPart callback:^(NSError *e, NSDictionary *r) {
      [self handleResult:r error:e];
    }];
    return;
  }

  // We've processed the last item. Finish and return.
  [multipartBody appendData:[[NSString stringWithFormat:@"--%@--\r\n", boundary]
                             dataUsingEncoding:NSUTF8StringEncoding]];
  NSString *contentType = [NSString stringWithFormat:@"multipart/form-data; boundary=\"%@\"", boundary];
  _callback(nil, @{@"body": multipartBody, @"contentType": contentType});
}

@end

/**
 * Helper to package in-flight requests together with their response data.
 */
@interface RCTActiveURLRequest : NSObject

@property (nonatomic, strong) NSNumber *requestID;
@property (nonatomic, strong) NSURLRequest *request;
@property (nonatomic, strong) id<RCTURLRequestHandler> handler;
@property (nonatomic, assign) BOOL incrementalUpdates;
@property (nonatomic, strong) NSURLResponse *response;
@property (nonatomic, strong) NSMutableData *data;

@end

@implementation RCTActiveURLRequest

- (instancetype)init
{
  if ((self = [super init])) {
    _data = [[NSMutableData alloc] init];
  }
  return self;
}

@end

/**
 * Helper to load request body data using a handler.
 */
@interface RCTDataLoader : NSObject <RCTURLRequestDelegate>

@end

typedef void (^RCTDataLoaderCallback)(NSData *data, NSString *MIMEType, NSError *error);

@implementation RCTDataLoader
{
  RCTDataLoaderCallback _callback;
  RCTActiveURLRequest *_request;
  id _requestToken;
}

- (instancetype)initWithRequest:(NSURLRequest *)request
                        handler:(id<RCTURLRequestHandler>)handler
                       callback:(RCTDataLoaderCallback)callback
{
   RCTAssertParam(request);
   RCTAssertParam(handler);
   RCTAssertParam(callback);

  if ((self = [super init])) {
    _callback = callback;
    _request = [[RCTActiveURLRequest alloc] init];
    _request.request = request;
    _request.handler = handler;
    _request.incrementalUpdates = NO;
    _requestToken = [handler sendRequest:request withDelegate:self];
  }
  return self;
}

- (instancetype)init
{
  return [self initWithRequest:nil handler:nil callback:nil];
}

- (void)URLRequest:(id)requestToken didReceiveResponse:(NSURLResponse *)response
{
  RCTAssert([requestToken isEqual:_requestToken], @"Shouldn't ever happen");
  _request.response = response;
}

- (void)URLRequest:(id)requestToken didReceiveData:(NSData *)data
{
  RCTAssert([requestToken isEqual:_requestToken], @"Shouldn't ever happen");
  [_request.data appendData:data];
}

- (void)URLRequest:(id)requestToken didCompleteWithError:(NSError *)error
{
  RCTAssert(_callback != nil, @"The callback property must be set");
  _callback(_request.data, _request.response.MIMEType, error);
}

@end

/**
 * Bridge module that provides the JS interface to the network stack.
 */
@implementation RCTNetworking
{
  NSInteger _currentRequestID;
  NSMapTable *_activeRequests;
}

@synthesize bridge = _bridge;
@synthesize methodQueue = _methodQueue;

RCT_EXPORT_MODULE()

- (instancetype)init
{
  if ((self = [super init])) {
    _currentRequestID = 0;
    _activeRequests = [[NSMapTable alloc] initWithKeyOptions:NSPointerFunctionsStrongMemory
                                                valueOptions:NSPointerFunctionsStrongMemory
                                                    capacity:0];
  }
  return self;
}

- (void)buildRequest:(NSDictionary *)query
      responseSender:(RCTResponseSenderBlock)responseSender
{
  NSURL *URL = [RCTConvert NSURL:query[@"url"]];
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:URL];
  request.HTTPMethod = [[RCTConvert NSString:query[@"method"]] uppercaseString] ?: @"GET";
  request.allHTTPHeaderFields = [RCTConvert NSDictionary:query[@"headers"]];

  BOOL incrementalUpdates = [RCTConvert BOOL:query[@"incrementalUpdates"]];

  NSDictionary *data = [RCTConvert NSDictionary:query[@"data"]];
  [self processDataForHTTPQuery:data callback:^(NSError *error, NSDictionary *result) {
    if (error) {
      RCTLogError(@"Error processing request body: %@", error);
      // Ideally we'd circle back to JS here and notify an error/abort on the request.
      return;
    }
    request.HTTPBody = result[@"body"];
    NSString *contentType = result[@"contentType"];
    if (contentType) {
      [request setValue:contentType forHTTPHeaderField:@"content-type"];
    }
    [self sendRequest:request
   incrementalUpdates:incrementalUpdates
       responseSender:responseSender];
  }];
}

- (id<RCTURLRequestHandler>)handlerForRequest:(NSURLRequest *)request
{
  NSMutableArray *handlers = [NSMutableArray array];
  for (id<RCTBridgeModule> module in _bridge.modules.allValues) {
    if ([module conformsToProtocol:@protocol(RCTURLRequestHandler)]) {
      if ([(id<RCTURLRequestHandler>)module canHandleRequest:request]) {
        [handlers addObject:module];
      }
    }
  }
  [handlers sortUsingComparator:^NSComparisonResult(id<RCTURLRequestHandler> a, id<RCTURLRequestHandler> b) {
    float priorityA = [a respondsToSelector:@selector(handlerPriority)] ? [a handlerPriority] : 0;
    float priorityB = [b respondsToSelector:@selector(handlerPriority)] ? [b handlerPriority] : 0;
    if (priorityA < priorityB) {
      return NSOrderedAscending;
    } else if (priorityA > priorityB) {
      return NSOrderedDescending;
    } else {
      RCTLogError(@"The RCTURLRequestHandlers %@ and %@ both reported that"
                  " they can handle the request %@, and have equal priority"
                  " (%g). This could result in non-deterministic behavior.",
                  a, b, request, priorityA);

      return NSOrderedSame;
    }
  }];
  id<RCTURLRequestHandler> handler = [handlers lastObject];
  if (!handler) {
    RCTLogError(@"No suitable request handler found for %@", request.URL);
  }
  return handler;
}

/**
 * Process the 'data' part of an HTTP query.
 *
 * 'data' can be a JSON value of the following forms:
 *
 * - {"string": "..."}: a simple JS string that will be UTF-8 encoded and sent as the body
 *
 * - {"uri": "some-uri://..."}: reference to a system resource, e.g. an image in the asset library
 *
 * - {"formData": [...]}: list of data payloads that will be combined into a multipart/form-data request
 *
 * If successful, the callback be called with a result dictionary containing the following (optional) keys:
 *
 * - @"body" (NSData): the body of the request
 *
 * - @"contentType" (NSString): the content type header of the request
 *
 */
- (void)processDataForHTTPQuery:(NSDictionary *)query callback:(void (^)(NSError *error, NSDictionary *result))callback
{
  if (!query) {
    callback(nil, nil);
    return;
  }
  NSData *body = [RCTConvert NSData:query[@"string"]];
  if (body) {
    callback(nil, @{@"body": body});
    return;
  }
  NSURLRequest *request = [RCTConvert NSURLRequest:query[@"uri"]];
  if (request) {
    id<RCTURLRequestHandler> handler = [self handlerForRequest:request];
    if (!handler) {
      return;
    }
    (void)[[RCTDataLoader alloc] initWithRequest:request handler:handler callback:^(NSData *data, NSString *MIMEType, NSError *error) {
      if (data) {
        callback(nil, @{@"body": data, @"contentType": MIMEType});
      } else {
        callback(error, nil);
      }
    }];
    return;
  }
  NSDictionaryArray *formData = [RCTConvert NSDictionaryArray:query[@"formData"]];
  if (formData != nil) {
    RCTHTTPFormDataHelper *formDataHelper = [[RCTHTTPFormDataHelper alloc] init];
    formDataHelper.dataManager = self;
    [formDataHelper process:formData callback:callback];
    return;
  }
  // Nothing in the data payload, at least nothing we could understand anyway.
  // Ignore and treat it as if it were null.
  callback(nil, nil);
}

- (void)sendRequest:(NSURLRequest *)request
 incrementalUpdates:(BOOL)incrementalUpdates
     responseSender:(RCTResponseSenderBlock)responseSender
{
  id<RCTURLRequestHandler> handler = [self handlerForRequest:request];
  id token = [handler sendRequest:request withDelegate:self];
  if (token) {
    RCTActiveURLRequest *activeRequest = [[RCTActiveURLRequest alloc] init];
    activeRequest.requestID = @(++_currentRequestID);
    activeRequest.request = request;
    activeRequest.handler = handler;
    activeRequest.incrementalUpdates = incrementalUpdates;
    [_activeRequests setObject:activeRequest forKey:token];
    responseSender(@[activeRequest.requestID]);
  }
}

- (void)sendData:(NSData *)data forRequestToken:(id)requestToken
{
  if (data.length == 0) {
    return;
  }

  RCTActiveURLRequest *request = [_activeRequests objectForKey:requestToken];

  // Get text encoding
  NSURLResponse *response = request.response;
  NSStringEncoding encoding = NSUTF8StringEncoding;
  if (response.textEncodingName) {
    CFStringEncoding cfEncoding = CFStringConvertIANACharSetNameToEncoding((CFStringRef)response.textEncodingName);
    encoding = CFStringConvertEncodingToNSStringEncoding(cfEncoding);
  }

  NSString *responseText = [[NSString alloc] initWithData:data encoding:encoding];
  if (!responseText && data.length) {
    RCTLogWarn(@"Received data was invalid.");
    return;
  }

  NSArray *responseJSON = @[request.requestID, responseText ?: @""];
  [_bridge.eventDispatcher sendDeviceEventWithName:@"didReceiveNetworkData"
                                              body:responseJSON];
}

#pragma mark - RCTURLRequestDelegate

- (void)URLRequest:(id)requestToken didReceiveResponse:(NSURLResponse *)response
{
  dispatch_async(_methodQueue, ^{
    RCTActiveURLRequest *request = [_activeRequests objectForKey:requestToken];
    RCTAssert(request != nil, @"Unrecognized request token: %@", requestToken);

    request.response = response;

    NSHTTPURLResponse *httpResponse = nil;
    if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
      // Might be a local file request
      httpResponse = (NSHTTPURLResponse *)response;
    }

    NSArray *responseJSON = @[request.requestID,
                              @(httpResponse.statusCode ?: 200),
                              httpResponse.allHeaderFields ?: @{},
                              ];

    [_bridge.eventDispatcher sendDeviceEventWithName:@"didReceiveNetworkResponse"
                                                body:responseJSON];
  });
}

- (void)URLRequest:(id)requestToken didReceiveData:(NSData *)data
{
  dispatch_async(_methodQueue, ^{
    RCTActiveURLRequest *request = [_activeRequests objectForKey:requestToken];
    RCTAssert(request != nil, @"Unrecognized request token: %@", requestToken);

    if (request.incrementalUpdates) {
      [self sendData:data forRequestToken:requestToken];
    } else {
      [request.data appendData:data];
    }
  });
}

- (void)URLRequest:(id)requestToken didCompleteWithError:(NSError *)error
{
  dispatch_async(_methodQueue, ^{
    RCTActiveURLRequest *request = [_activeRequests objectForKey:requestToken];
    RCTAssert(request != nil, @"Unrecognized request token: %@", requestToken);

    if (!request.incrementalUpdates) {
      [self sendData:request.data forRequestToken:requestToken];
    }

    NSArray *responseJSON = @[
      request.requestID,
      RCTNullIfNil(error.localizedDescription),
    ];

    [_bridge.eventDispatcher sendDeviceEventWithName:@"didCompleteNetworkResponse"
                                                body:responseJSON];

    [_activeRequests removeObjectForKey:requestToken];
  });
}

#pragma mark - JS API

RCT_EXPORT_METHOD(sendRequest:(NSDictionary *)query
                  responseSender:(RCTResponseSenderBlock)responseSender)
{
  [self buildRequest:query responseSender:responseSender];
}

RCT_EXPORT_METHOD(cancelRequest:(NSNumber *)requestID)
{
  id requestToken = nil;
  RCTActiveURLRequest *activeRequest = nil;
  for (id token in _activeRequests) {
    RCTActiveURLRequest *request = [_activeRequests objectForKey:token];
    if ([request.requestID isEqualToNumber:requestID]) {
      activeRequest = request;
      requestToken = token;
      break;
    }
  }

  id<RCTURLRequestHandler> handler = activeRequest.handler;
  if ([handler respondsToSelector:@selector(cancelRequest:)]) {
    [activeRequest.handler cancelRequest:requestToken];
  }
}

@end
