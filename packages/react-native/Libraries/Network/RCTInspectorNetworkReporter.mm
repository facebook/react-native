/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInspectorNetworkReporter.h"

#import "RCTNetworkConversions.h"

#import <React/RCTLog.h>
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

#ifdef REACT_NATIVE_DEBUGGER_ENABLED

// Dictionary to buffer incremental response bodies (CDP debugging active only)
static const NSMutableDictionary<NSNumber *, NSMutableString *> *responseBuffers = nil;

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

+ (void)reportConnectionTiming:(NSNumber *)requestId request:(NSURLRequest *)request
{
  Headers headersMap;

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: Process additional request info for CDP reporting
  headersMap = convertNSDictionaryToHeaders(request.allHTTPHeaderFields);
#endif

  NetworkReporter::getInstance().reportConnectionTiming(requestId.stringValue.UTF8String, headersMap);
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

+ (void)reportDataReceived:(NSNumber *)requestId data:(NSData *)data
{
  NetworkReporter::getInstance().reportDataReceived(requestId.stringValue.UTF8String, (int)data.length, std::nullopt);
}

+ (void)reportResponseEnd:(NSNumber *)requestId encodedDataLength:(int)encodedDataLength
{
  NetworkReporter::getInstance().reportResponseEnd(requestId.stringValue.UTF8String, encodedDataLength);

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: Check for buffered response body and flush to NetworkReporter
  if (responseBuffers != nullptr) {
    NSMutableString *buffer = responseBuffers[requestId];
    if (buffer != nullptr) {
      if (buffer.length > 0) {
        NetworkReporter::getInstance().storeResponseBody(
            requestId.stringValue.UTF8String, RCTStringViewFromNSString(buffer), false);
      }
      [responseBuffers removeObjectForKey:requestId];
    }
  }
#endif
}

+ (void)reportRequestFailed:(NSNumber *)requestId cancelled:(bool)cancelled
{
  NetworkReporter::getInstance().reportRequestFailed(requestId.stringValue.UTF8String, cancelled);

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: Clear buffer for request
  if (responseBuffers != nullptr) {
    [responseBuffers removeObjectForKey:requestId];
  }
#endif
}

+ (void)maybeStoreResponseBody:(NSNumber *)requestId data:(id)data base64Encoded:(bool)base64Encoded
{
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: Process response body and report to NetworkReporter
  auto &networkReporter = NetworkReporter::getInstance();
  if (!networkReporter.isDebuggingEnabled()) {
    return;
  }

  if ([data isKindOfClass:[NSData class]] && [(NSData *)data length] > 0) {
    @try {
      NSString *encodedString = [(NSData *)data base64EncodedStringWithOptions:0];
      if (encodedString != nullptr) {
        networkReporter.storeResponseBody(
            requestId.stringValue.UTF8String, RCTStringViewFromNSString(encodedString), base64Encoded);
      } else {
        RCTLogWarn(@"Failed to encode response data for request %@", requestId);
      }
    } @catch (NSException *exception) {
      RCTLogWarn(@"Exception while encoding response data: %@", exception.reason);
    }
  } else if ([data isKindOfClass:[NSString class]] && [(NSString *)data length] > 0) {
    networkReporter.storeResponseBody(
        requestId.stringValue.UTF8String, RCTStringViewFromNSString((NSString *)data), base64Encoded);
  }
#endif
}

+ (void)maybeStoreResponseBodyIncremental:(NSNumber *)requestId data:(NSString *)data
{
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: Buffer incremental response body contents
  auto &networkReporter = NetworkReporter::getInstance();
  if (!networkReporter.isDebuggingEnabled()) {
    return;
  }

  if (responseBuffers == nullptr) {
    responseBuffers = [NSMutableDictionary dictionary];
  }

  // Get or create buffer for this requestId
  NSMutableString *buffer = responseBuffers[requestId];
  if (buffer == nullptr) {
    buffer = [NSMutableString string];
    responseBuffers[requestId] = buffer;
  }

  [buffer appendString:data];
#endif
}

@end
