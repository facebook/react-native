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
#import "RCTNetworkTask.h"
#import "RCTURLRequestHandler.h"
#import "RCTEventDispatcher.h"
#import "RCTHTTPRequestHandler.h"
#import "RCTLog.h"
#import "RCTUtils.h"

typedef RCTURLRequestCancellationBlock (^RCTHTTPQueryResult)(NSError *error, NSDictionary<NSString *, id> *result);

@interface RCTNetworking ()

- (RCTURLRequestCancellationBlock)processDataForHTTPQuery:(NSDictionary<NSString *, id> *)data
                                                 callback:(RCTHTTPQueryResult)callback;
@end

/**
 * Helper to convert FormData payloads into multipart/formdata requests.
 */
@interface RCTHTTPFormDataHelper : NSObject

@property (nonatomic, weak) RCTNetworking *networker;

@end

@implementation RCTHTTPFormDataHelper
{
  NSMutableArray<NSDictionary<NSString *, id> *> *_parts;
  NSMutableData *_multipartBody;
  RCTHTTPQueryResult _callback;
  NSString *_boundary;
}

static NSString *RCTGenerateFormBoundary()
{
  const size_t boundaryLength = 70;
  const char *boundaryChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_./";

  char *bytes = malloc(boundaryLength);
  size_t charCount = strlen(boundaryChars);
  for (int i = 0; i < boundaryLength; i++) {
    bytes[i] = boundaryChars[arc4random_uniform((u_int32_t)charCount)];
  }
  return [[NSString alloc] initWithBytesNoCopy:bytes length:boundaryLength encoding:NSUTF8StringEncoding freeWhenDone:YES];
}

- (RCTURLRequestCancellationBlock)process:(NSArray<NSDictionary *> *)formData
                                 callback:(RCTHTTPQueryResult)callback
{
  RCTAssertThread(_networker.methodQueue, @"process: must be called on method queue");

  if (formData.count == 0) {
    return callback(nil, nil);
  }

  _parts = [formData mutableCopy];
  _callback = callback;
  _multipartBody = [NSMutableData new];
  _boundary = RCTGenerateFormBoundary();

  return [_networker processDataForHTTPQuery:_parts[0] callback:^(NSError *error, NSDictionary<NSString *, id> *result) {
    return [self handleResult:result error:error];
  }];
}

- (RCTURLRequestCancellationBlock)handleResult:(NSDictionary<NSString *, id> *)result
                                         error:(NSError *)error
{
  RCTAssertThread(_networker.methodQueue, @"handleResult: must be called on method queue");

  if (error) {
    return _callback(error, nil);
  }

  // Start with boundary.
  [_multipartBody appendData:[[NSString stringWithFormat:@"--%@\r\n", _boundary]
                              dataUsingEncoding:NSUTF8StringEncoding]];

  // Print headers.
  NSMutableDictionary<NSString *, NSString *> *headers = [_parts[0][@"headers"] mutableCopy];
  NSString *partContentType = result[@"contentType"];
  if (partContentType != nil) {
    headers[@"content-type"] = partContentType;
  }
  [headers enumerateKeysAndObjectsUsingBlock:^(NSString *parameterKey, NSString *parameterValue, BOOL *stop) {
    [_multipartBody appendData:[[NSString stringWithFormat:@"%@: %@\r\n", parameterKey, parameterValue]
                                dataUsingEncoding:NSUTF8StringEncoding]];
  }];

  // Add the body.
  [_multipartBody appendData:[@"\r\n" dataUsingEncoding:NSUTF8StringEncoding]];
  [_multipartBody appendData:result[@"body"]];
  [_multipartBody appendData:[@"\r\n" dataUsingEncoding:NSUTF8StringEncoding]];

  [_parts removeObjectAtIndex:0];
  if (_parts.count) {
    return [_networker processDataForHTTPQuery:_parts[0] callback:^(NSError *err, NSDictionary<NSString *, id> *res) {
      return [self handleResult:res error:err];
    }];
  }

  // We've processed the last item. Finish and return.
  [_multipartBody appendData:[[NSString stringWithFormat:@"--%@--\r\n", _boundary]
                              dataUsingEncoding:NSUTF8StringEncoding]];
  NSString *contentType = [NSString stringWithFormat:@"multipart/form-data; boundary=\"%@\"", _boundary];
  return _callback(nil, @{@"body": _multipartBody, @"contentType": contentType});
}

@end

/**
 * Bridge module that provides the JS interface to the network stack.
 */
@implementation RCTNetworking
{
  NSMutableDictionary<NSNumber *, RCTNetworkTask *> *_tasksByRequestID;
  NSArray<id<RCTURLRequestHandler>> *_handlers;
}

@synthesize bridge = _bridge;
@synthesize methodQueue = _methodQueue;

RCT_EXPORT_MODULE()

- (id<RCTURLRequestHandler>)handlerForRequest:(NSURLRequest *)request
{
  if (!request.URL) {
    return nil;
  }

  if (!_handlers) {
    // Get handlers, sorted in reverse priority order (highest priority first)
    _handlers = [[_bridge modulesConformingToProtocol:@protocol(RCTURLRequestHandler)] sortedArrayUsingComparator:^NSComparisonResult(id<RCTURLRequestHandler> a, id<RCTURLRequestHandler> b) {
      float priorityA = [a respondsToSelector:@selector(handlerPriority)] ? [a handlerPriority] : 0;
      float priorityB = [b respondsToSelector:@selector(handlerPriority)] ? [b handlerPriority] : 0;
      if (priorityA > priorityB) {
        return NSOrderedAscending;
      } else if (priorityA < priorityB) {
        return NSOrderedDescending;
      } else {
        return NSOrderedSame;
      }
    }];
  }

  if (RCT_DEBUG) {
    // Check for handler conflicts
    float previousPriority = 0;
    id<RCTURLRequestHandler> previousHandler = nil;
    for (id<RCTURLRequestHandler> handler in _handlers) {
      float priority = [handler respondsToSelector:@selector(handlerPriority)] ? [handler handlerPriority] : 0;
      if (previousHandler && priority < previousPriority) {
        return previousHandler;
      }
      if ([handler canHandleRequest:request]) {
        if (previousHandler) {
          if (priority == previousPriority) {
            RCTLogError(@"The RCTURLRequestHandlers %@ and %@ both reported that"
                        " they can handle the request %@, and have equal priority"
                        " (%g). This could result in non-deterministic behavior.",
                        handler, previousHandler, request, priority);
          }
        } else {
          previousHandler = handler;
          previousPriority = priority;
        }
      }
    }
    return previousHandler;
  }

  // Normal code path
  for (id<RCTURLRequestHandler> handler in _handlers) {
    if ([handler canHandleRequest:request]) {
      return handler;
    }
  }
  return nil;
}

- (RCTURLRequestCancellationBlock)buildRequest:(NSDictionary<NSString *, id> *)query
                                 completionBlock:(void (^)(NSURLRequest *request))block
{
  RCTAssertThread(_methodQueue, @"buildRequest: must be called on method queue");

  NSURL *URL = [RCTConvert NSURL:query[@"url"]]; // this is marked as nullable in JS, but should not be null
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:URL];
  request.HTTPMethod = [RCTConvert NSString:RCTNilIfNull(query[@"method"])].uppercaseString ?: @"GET";
  request.allHTTPHeaderFields = [RCTConvert NSDictionary:query[@"headers"]];
  request.timeoutInterval = [RCTConvert NSTimeInterval:query[@"timeout"]];
  NSDictionary<NSString *, id> *data = [RCTConvert NSDictionary:RCTNilIfNull(query[@"data"])];
  return [self processDataForHTTPQuery:data callback:^(NSError *error, NSDictionary<NSString *, id> *result) {
    if (error) {
      RCTLogError(@"Error processing request body: %@", error);
      // Ideally we'd circle back to JS here and notify an error/abort on the request.
      return (RCTURLRequestCancellationBlock)nil;
    }
    request.HTTPBody = result[@"body"];
    NSString *contentType = result[@"contentType"];
    if (contentType) {
      [request setValue:contentType forHTTPHeaderField:@"Content-Type"];
    }

    // Gzip the request body
    if ([request.allHTTPHeaderFields[@"Content-Encoding"] isEqualToString:@"gzip"]) {
      request.HTTPBody = RCTGzipData(request.HTTPBody, -1 /* default */);
      [request setValue:(@(request.HTTPBody.length)).description forHTTPHeaderField:@"Content-Length"];
    }

    dispatch_async(_methodQueue, ^{
      block(request);
    });

    return (RCTURLRequestCancellationBlock)nil;
  }];
}

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  return [self handlerForRequest:request] != nil;
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
- (RCTURLRequestCancellationBlock)processDataForHTTPQuery:(nullable NSDictionary<NSString *, id> *)query callback:
(RCTURLRequestCancellationBlock (^)(NSError *error, NSDictionary<NSString *, id> *result))callback
{
  RCTAssertThread(_methodQueue, @"processDataForHTTPQuery: must be called on method queue");

  if (!query) {
    return callback(nil, nil);
  }
  NSData *body = [RCTConvert NSData:query[@"string"]];
  if (body) {
    return callback(nil, @{@"body": body});
  }
  NSURLRequest *request = [RCTConvert NSURLRequest:query[@"uri"]];
  if (request) {

    __block RCTURLRequestCancellationBlock cancellationBlock = nil;
    RCTNetworkTask *task = [self networkTaskWithRequest:request completionBlock:^(NSURLResponse *response, NSData *data, NSError *error) {
      dispatch_async(_methodQueue, ^{
        cancellationBlock = callback(error, data ? @{@"body": data, @"contentType": RCTNullIfNil(response.MIMEType)} : nil);
      });
    }];

    [task start];

    __weak RCTNetworkTask *weakTask = task;
    return ^{
      [weakTask cancel];
      if (cancellationBlock) {
        cancellationBlock();
      }
    };
  }
  NSArray<NSDictionary *> *formData = [RCTConvert NSDictionaryArray:query[@"formData"]];
  if (formData) {
    RCTHTTPFormDataHelper *formDataHelper = [RCTHTTPFormDataHelper new];
    formDataHelper.networker = self;
    return [formDataHelper process:formData callback:callback];
  }
  // Nothing in the data payload, at least nothing we could understand anyway.
  // Ignore and treat it as if it were null.
  return callback(nil, nil);
}

- (void)sendData:(NSData *)data forTask:(RCTNetworkTask *)task
{
  RCTAssertThread(_methodQueue, @"sendData: must be called on method queue");

  if (data.length == 0) {
    return;
  }

  // Get text encoding
  NSURLResponse *response = task.response;
  NSStringEncoding encoding = NSUTF8StringEncoding;
  if (response.textEncodingName) {
    CFStringEncoding cfEncoding = CFStringConvertIANACharSetNameToEncoding((CFStringRef)response.textEncodingName);
    encoding = CFStringConvertEncodingToNSStringEncoding(cfEncoding);
  }

  // Attempt to decode text
  NSString *responseText = [[NSString alloc] initWithData:data encoding:encoding];
  if (!responseText && data.length) {

    // We don't have an encoding, or the encoding is incorrect, so now we
    // try to guess (unfortunately, this feature is available in iOS 8+ only)
    if ([NSString respondsToSelector:@selector(stringEncodingForData:
                                               encodingOptions:
                                               convertedString:
                                               usedLossyConversion:)]) {
      [NSString stringEncodingForData:data
                      encodingOptions:nil
                      convertedString:&responseText
                  usedLossyConversion:NULL];
    }

    // If we still can't decode it, bail out
    if (!responseText) {
      RCTLogWarn(@"Received data was not a string, or was not a recognised encoding.");
      return;
    }
  }

  NSArray<id> *responseJSON = @[task.requestID, responseText ?: @""];
  [_bridge.eventDispatcher sendDeviceEventWithName:@"didReceiveNetworkData"
                                              body:responseJSON];
}

- (void)sendRequest:(NSURLRequest *)request
 incrementalUpdates:(BOOL)incrementalUpdates
     responseSender:(RCTResponseSenderBlock)responseSender
{
  RCTAssertThread(_methodQueue, @"sendRequest: must be called on method queue");

  __block RCTNetworkTask *task;

  RCTURLRequestProgressBlock uploadProgressBlock = ^(int64_t progress, int64_t total) {
    dispatch_async(_methodQueue, ^{
      NSArray *responseJSON = @[task.requestID, @((double)progress), @((double)total)];
      [_bridge.eventDispatcher sendDeviceEventWithName:@"didSendNetworkData" body:responseJSON];
    });
  };

  void (^responseBlock)(NSURLResponse *) = ^(NSURLResponse *response) {
    dispatch_async(_methodQueue, ^{
      NSDictionary<NSString *, NSString *> *headers;
      NSInteger status;
      if ([response isKindOfClass:[NSHTTPURLResponse class]]) { // Might be a local file request
        NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
        headers = httpResponse.allHeaderFields ?: @{};
        status = httpResponse.statusCode;
      } else {
        headers = response.MIMEType ? @{@"Content-Type": response.MIMEType} : @{};
        status = 200;
      }
      id responseURL = response.URL ? response.URL.absoluteString : [NSNull null];
      NSArray<id> *responseJSON = @[task.requestID, @(status), headers, responseURL];
      [_bridge.eventDispatcher sendDeviceEventWithName:@"didReceiveNetworkResponse"
                                                  body:responseJSON];
    });
  };

  void (^incrementalDataBlock)(NSData *) = incrementalUpdates ? ^(NSData *data) {
    dispatch_async(_methodQueue, ^{
      [self sendData:data forTask:task];
    });
  } : nil;

  RCTURLRequestCompletionBlock completionBlock =
  ^(NSURLResponse *response, NSData *data, NSError *error) {
    dispatch_async(_methodQueue, ^{
      if (!incrementalUpdates) {
        [self sendData:data forTask:task];
      }
      NSArray *responseJSON = @[task.requestID,
                                RCTNullIfNil(error.localizedDescription),
                                ];

      [_bridge.eventDispatcher sendDeviceEventWithName:@"didCompleteNetworkResponse"
                                                  body:responseJSON];

      [_tasksByRequestID removeObjectForKey:task.requestID];
    });
  };

  task = [self networkTaskWithRequest:request completionBlock:completionBlock];
  task.incrementalDataBlock = incrementalDataBlock;
  task.responseBlock = responseBlock;
  task.uploadProgressBlock = uploadProgressBlock;

  if (task.requestID) {
    if (!_tasksByRequestID) {
      _tasksByRequestID = [NSMutableDictionary new];
    }
    _tasksByRequestID[task.requestID] = task;
    responseSender(@[task.requestID]);
  }

  [task start];
}

#pragma mark - Public API

- (RCTNetworkTask *)networkTaskWithRequest:(NSURLRequest *)request
                             completionBlock:(RCTURLRequestCompletionBlock)completionBlock
{
  id<RCTURLRequestHandler> handler = [self handlerForRequest:request];
  if (!handler) {
    RCTLogError(@"No suitable URL request handler found for %@", request.URL);
    return nil;
  }

  return [[RCTNetworkTask alloc] initWithRequest:request
                                          handler:handler
                                  completionBlock:completionBlock];
}

#pragma mark - JS API

RCT_EXPORT_METHOD(sendRequest:(NSDictionary *)query
                  responseSender:(RCTResponseSenderBlock)responseSender)
{
  // TODO: buildRequest returns a cancellation block, but there's currently
  // no way to invoke it, if, for example the request is cancelled while
  // loading a large file to build the request body
  [self buildRequest:query completionBlock:^(NSURLRequest *request) {

    BOOL incrementalUpdates = [RCTConvert BOOL:query[@"incrementalUpdates"]];
    [self sendRequest:request
   incrementalUpdates:incrementalUpdates
       responseSender:responseSender];
  }];
}

RCT_EXPORT_METHOD(cancelRequest:(nonnull NSNumber *)requestID)
{
  [_tasksByRequestID[requestID] cancel];
  [_tasksByRequestID removeObjectForKey:requestID];
}

@end

@implementation RCTBridge (RCTNetworking)

- (RCTNetworking *)networking
{
  return [self moduleForClass:[RCTNetworking class]];
}

@end
