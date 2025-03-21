/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#ifdef __cplusplus

#import <jsinspector-modern/network/NetworkReporter.h>

namespace facebook::react {

/**
 * [Experimental] An interface for reporting network events to the modern
 * debugger server and Web Performance APIs.
 *
 * This is a helper class wrapping
 * `facebook::react::jsinspector_modern::NetworkReporter`.
 */
class RCTInspectorNetworkReporter {
 public:
  static void reportRequestStart(NSNumber *requestId, NSURLRequest *request, int encodedDataLength);
  static void reportResponseStart(
      NSNumber *requestId,
      NSURLResponse *response,
      uint16_t statusCode,
      NSDictionary<NSString *, NSString *> *headers);
  static void reportResponseEnd(NSNumber *requestId, int encodedDataLength);

 private:
  RCTInspectorNetworkReporter();
  RCTInspectorNetworkReporter(const RCTInspectorNetworkReporter &) = delete;
  RCTInspectorNetworkReporter &operator=(const RCTInspectorNetworkReporter &) = delete;
  ~RCTInspectorNetworkReporter() = default;
};

} // namespace facebook::react

#endif
