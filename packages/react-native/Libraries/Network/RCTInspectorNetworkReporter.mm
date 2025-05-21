/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInspectorNetworkReporter.h"

#import <jsinspector-modern/network/NetworkReporter.h>

using namespace facebook::react::jsinspector_modern;

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
namespace {

Headers convertNSDictionaryToHeaders(const NSDictionary<NSString *, NSString *> *headers)
{
  Headers responseHeaders;
  for (NSString *key in headers) {
    responseHeaders[[key UTF8String]] = [headers[key] UTF8String];
  }
  return responseHeaders;
}

std::string convertRequestBodyToStringTruncated(NSURLRequest *request)
{
  const NSUInteger maxBodySize = 1024 * 1024; // 1MB
  auto bodyLength = request.HTTPBody.length;
  auto bytesToRead = std::min(bodyLength, maxBodySize);

  auto body = std::string((const char *)request.HTTPBody.bytes, bytesToRead);

  if (bytesToRead < bodyLength) {
    body +=
        "\n... [truncated, showing " + std::to_string(bytesToRead) + " of " + std::to_string(bodyLength) + " bytes]";
  }

  return body;
}

} // namespace
#endif

@implementation RCTInspectorNetworkReporter {
}

+ (void)reportRequestStart:(NSNumber *)requestId
                   request:(NSURLRequest *)request
         encodedDataLength:(int)encodedDataLength
{
  RequestInfo requestInfo;
  requestInfo.url = [request.URL absoluteString].UTF8String;
  requestInfo.httpMethod = [request.HTTPMethod UTF8String];
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: Process additional request info for CDP reporting
  requestInfo.headers = convertNSDictionaryToHeaders(request.allHTTPHeaderFields);
  requestInfo.httpBody = convertRequestBodyToStringTruncated(request);
#endif

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

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: Process additional request info for CDP reporting
  responseInfo.headers = convertNSDictionaryToHeaders(headers);
#endif

  NetworkReporter::getInstance().reportResponseStart(
      requestId.stringValue.UTF8String, responseInfo, response.expectedContentLength);
}

+ (void)reportResponseEnd:(NSNumber *)requestId encodedDataLength:(int)encodedDataLength
{
  NetworkReporter::getInstance().reportResponseEnd(requestId.stringValue.UTF8String, encodedDataLength);
}

@end
