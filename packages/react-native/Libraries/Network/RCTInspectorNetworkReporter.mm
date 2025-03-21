/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInspectorNetworkReporter.h"

using namespace facebook::react::jsinspector_modern;

// TODO: Stub class in production

namespace facebook::react {

namespace {

Headers convertNSDictionaryToHeaders(const NSDictionary<NSString *, NSString *> *headers)
{
  Headers responseHeaders;
  for (NSString *key in headers) {
    responseHeaders[[key UTF8String]] = [headers[key] UTF8String];
  }
  return responseHeaders;
}

} // namespace

/* static */ void
RCTInspectorNetworkReporter::reportRequestStart(NSNumber *requestId, NSURLRequest *request, int encodedDataLength)
{
  RequestInfo requestInfo;
  requestInfo.url = [request.URL absoluteString].UTF8String;
  requestInfo.httpMethod = [request.HTTPMethod UTF8String];
  requestInfo.headers = convertNSDictionaryToHeaders(request.allHTTPHeaderFields);
  // TODO: This is too heavy for the non-CDP case
  requestInfo.httpBody = std::string((const char *)request.HTTPBody.bytes, request.HTTPBody.length);

  NetworkReporter::getInstance().reportRequestStart(
      requestId.stringValue.UTF8String, requestInfo, encodedDataLength, std::nullopt);
}

/* static */ void RCTInspectorNetworkReporter::reportResponseStart(
    NSNumber *requestId,
    NSURLResponse *response,
    uint16_t statusCode,
    NSDictionary<NSString *, NSString *> *headers)
{
  ResponseInfo responseInfo;
  responseInfo.url = response.URL.absoluteString.UTF8String;
  responseInfo.statusCode = statusCode;
  responseInfo.headers = convertNSDictionaryToHeaders(headers);

  NetworkReporter::getInstance().reportResponseStart(
      requestId.stringValue.UTF8String, responseInfo, response.expectedContentLength);
}

/* static */ void RCTInspectorNetworkReporter::reportResponseEnd(NSNumber *requestId, int encodedDataLength)
{
  NetworkReporter::getInstance().reportResponseEnd(requestId.stringValue.UTF8String, encodedDataLength);
}

} // namespace facebook::react
