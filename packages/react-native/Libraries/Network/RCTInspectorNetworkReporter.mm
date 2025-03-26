/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInspectorNetworkReporter.h"

#import <jsinspector-modern/network/NetworkReporter.h>

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
}

+ (void)reportRequestStart:(NSNumber *)requestId
                   request:(NSURLRequest *)request
         encodedDataLength:(int)encodedDataLength
{
  RequestInfo requestInfo;
  requestInfo.url = [request.URL absoluteString].UTF8String;
  requestInfo.httpMethod = [request.HTTPMethod UTF8String];
  requestInfo.headers = convertNSDictionaryToHeaders(request.allHTTPHeaderFields);
  requestInfo.httpBody = std::string((const char *)request.HTTPBody.bytes, request.HTTPBody.length);

  NetworkReporter::getInstance().reportRequestStart(
      requestId.stringValue.UTF8String, requestInfo, encodedDataLength, std::nullopt);
}

+ (void)reportResponseStart:(NSNumber *)requestId
                   response:(NSURLResponse *)response
                 statusCode:(int)statusCode
                    headers:(NSDictionary<NSString *, NSString *> *)headers
{
  ResponseInfo responseInfo;
  responseInfo.url = response.URL.absoluteString.UTF8String;
  responseInfo.statusCode = statusCode;
  responseInfo.headers = convertNSDictionaryToHeaders(headers);

  NetworkReporter::getInstance().reportResponseStart(
      requestId.stringValue.UTF8String, responseInfo, response.expectedContentLength);
}

+ (void)reportResponseEnd:(NSNumber *)requestId encodedDataLength:(int)encodedDataLength
{
  NetworkReporter::getInstance().reportResponseEnd(requestId.stringValue.UTF8String, encodedDataLength);
}

@end
