/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <mutex>

namespace facebook::react::jsinspector_modern {

/**
 * [Experimental] An interface for reporting network events to the modern
 * debugger server and Web Performance APIs.
 */
class NetworkReporter {
 public:
  static NetworkReporter& getInstance();

  /**
   * Enable network tracking over CDP. Once enabled, network events will be
   * sent to the debugger client. Returns `false` if already enabled.
   *
   * Corresponds to @cdp `Network.enable`.
   */
  bool enableDebugging();

  /**
   * Disable network tracking over CDP, preventing network events from being
   * sent to the debugger client. Returns `false` if not initially enabled.
   *
   * Corresponds to @cdp `Network.disable`.
   */
  bool disableDebugging();

 private:
  NetworkReporter() = default;
  NetworkReporter(const NetworkReporter&) = delete;
  NetworkReporter& operator=(const NetworkReporter&) = delete;
  ~NetworkReporter() = default;

  bool enabled_{false};
  std::mutex mutex_;
};

} // namespace facebook::react::jsinspector_modern
