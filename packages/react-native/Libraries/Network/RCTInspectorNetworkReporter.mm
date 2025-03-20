/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInspectorNetworkReporter.h"

namespace {

using namespace facebook::react::jsinspector_modern;

Headers convertNSDictionaryToHeaders(const NSDictionary<NSString *, NSString *> *headers)
{
  Headers responseHeaders;
  for (NSString *key in headers) {
    responseHeaders[[key UTF8String]] = [headers[key] UTF8String];
  }
  return responseHeaders;
}

} // namespace

@implementation RCTInspectorNetworkReporter {
  NetworkReporter *_reporter;
}

+ (instancetype)sharedReporter
{
  static RCTInspectorNetworkReporter *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[self alloc] initInternal];
  });
  return sharedInstance;
}

- (instancetype)initInternal
{
  if (self = [super init]) {
    _reporter = &NetworkReporter::getInstance();
  }
  return self;
}

- (void)reportRequestStart:(NSNumber *)requestId
                   request:(NSURLRequest *)request
         encodedDataLength:(int)encodedDataLength
{
  RequestInfo requestInfo;
  requestInfo.url = [request.URL absoluteString].UTF8String;
  requestInfo.httpMethod = [request.HTTPMethod UTF8String];
  requestInfo.headers = convertNSDictionaryToHeaders(request.allHTTPHeaderFields);
  requestInfo.httpBody = std::string((const char *)request.HTTPBody.bytes, request.HTTPBody.length);

  _reporter->reportRequestStart(requestId.stringValue.UTF8String, requestInfo, encodedDataLength, std::nullopt);
}

- (void)reportResponseStart:(NSNumber *)requestId response:(NSURLResponse *)response
{
  NSDictionary<NSString *, NSString *> *headers;
  NSInteger status;

  if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
    headers = httpResponse.allHeaderFields ?: @{};
    status = httpResponse.statusCode;
  } else {
    // Local file request
    headers = response.MIMEType ? @{@"Content-Type" : response.MIMEType} : @{};
    status = 200;
  }
  id responseURL = response.URL ? response.URL.absoluteString : [NSNull null];

  ResponseInfo responseInfo;
  responseInfo.url = [responseURL UTF8String];
  responseInfo.statusCode = status;
  responseInfo.headers = convertNSDictionaryToHeaders(headers);

  _reporter->reportResponseStart(requestId.stringValue.UTF8String, responseInfo, response.expectedContentLength);
}

- (void)reportResponseEnd:(NSNumber *)requestId encodedDataLength:(int)encodedDataLength
{
  _reporter->reportResponseEnd(requestId.stringValue.UTF8String, encodedDataLength);
}

@end
