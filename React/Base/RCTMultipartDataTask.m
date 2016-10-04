/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTMultipartDataTask.h"

@interface RCTMultipartDataTask () <NSURLSessionDataDelegate, NSURLSessionDataDelegate>

@end

@implementation RCTMultipartDataTask {
  NSURLSessionDataTask *_dataTask;
  RCTMultipartDataTaskCallback _partHandler;
  NSInteger _statusCode;
  NSDictionary *_headers;
  NSString *_boundary;
  NSMutableData *_data;
}

- (instancetype)initWithURL:(NSURL *)url partHandler:(RCTMultipartDataTaskCallback)partHandler
{
  if (self = [super init]) {
    NSURLSession *session = [NSURLSession sessionWithConfiguration:[NSURLSessionConfiguration defaultSessionConfiguration]
                                                          delegate:self delegateQueue:nil];
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
    [request addValue:@"multipart/mixed" forHTTPHeaderField:@"Accept"];
    _dataTask = [session dataTaskWithRequest:request];
    _partHandler = [partHandler copy];
  }
  return self;
}

- (void)resume
{
  [_dataTask resume];
}

- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask didReceiveResponse:(NSURLResponse *)response completionHandler:(void (^)(NSURLSessionResponseDisposition disposition))completionHandler
{
  if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
    _headers = [httpResponse allHeaderFields];
    _statusCode = [httpResponse statusCode];

    NSString *contentType = @"";
    for (NSString *key in [_headers keyEnumerator]) {
      if ([[key lowercaseString] isEqualToString:@"content-type"]) {
        contentType = [_headers valueForKey:key];
        break;
      }
    }

    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"multipart/mixed;.*boundary=\"([^\"]+)\"" options:0 error:nil];
    NSTextCheckingResult *match = [regex firstMatchInString:contentType options:0 range:NSMakeRange(0, contentType.length)];
    if (match) {
      _boundary = [contentType substringWithRange:[match rangeAtIndex:1]];
      completionHandler(NSURLSessionResponseBecomeStream);
      return;
    }
  }

  // In case the server doesn't support multipart/mixed responses, fallback to normal download
  _data = [[NSMutableData alloc] initWithCapacity:1024 * 1024];
  completionHandler(NSURLSessionResponseAllow);
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
  _partHandler(_statusCode, _headers, _data, error, YES);
}

- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask didReceiveData:(NSData *)data
{
  [_data appendData:data];
}

- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask didBecomeStreamTask:(NSURLSessionStreamTask *)streamTask
{
  [streamTask captureStreams];
}

- (void)URLSession:(NSURLSession *)session streamTask:(NSURLSessionStreamTask *)streamTask didBecomeInputStream:(NSInputStream *)inputStream outputStream:(NSOutputStream *)outputStream
{
  RCTMultipartStreamReader *reader = [[RCTMultipartStreamReader alloc] initWithInputStream:inputStream boundary:_boundary];
  RCTMultipartDataTaskCallback partHandler = _partHandler;
  NSInteger statusCode = _statusCode;

  BOOL completed = [reader readAllParts:^(NSDictionary *headers, NSData *content, BOOL done) {
    partHandler(statusCode, headers, content, nil, done);
  }];
  if (!completed) {
    partHandler(statusCode, nil, nil, [NSError errorWithDomain:NSURLErrorDomain code:NSURLErrorCancelled userInfo:nil], YES);
  }
}


@end
