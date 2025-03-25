/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NetworkReporter.h"

#include <glog/logging.h>

#include <stdexcept>

namespace facebook::react::jsinspector_modern {

NetworkReporter& NetworkReporter::getInstance() {
  static NetworkReporter tracer;
  return tracer;
}

bool NetworkReporter::enableDebugging() {
  if (debuggingEnabled_.load(std::memory_order_acquire)) {
    return false;
  }

  debuggingEnabled_.store(true, std::memory_order_release);
  LOG(INFO) << "Network debugging enabled" << std::endl;
  return true;
}

bool NetworkReporter::disableDebugging() {
  if (!debuggingEnabled_.load(std::memory_order_acquire)) {
    return false;
  }

  debuggingEnabled_.store(false, std::memory_order_release);
  LOG(INFO) << "Network debugging disabled" << std::endl;
  return true;
}

void NetworkReporter::reportRequestStart(const std::string& /*requestId*/) {
  if (!debuggingEnabled_.load(std::memory_order_relaxed)) {
    return;
  }

  // TODO(T216933356)
  throw std::runtime_error("Not implemented");
}

void NetworkReporter::reportConnectionTiming(const std::string& /*requestId*/) {
  if (!debuggingEnabled_.load(std::memory_order_relaxed)) {
    return;
  }

  // TODO(T218236597)
  throw std::runtime_error("Not implemented");
}

void NetworkReporter::reportRequestFailed(const std::string& /*requestId*/) {
  if (!debuggingEnabled_.load(std::memory_order_relaxed)) {
    return;
  }

  // TODO(T218236855)
  throw std::runtime_error("Not implemented");
}

void NetworkReporter::reportResponseStart(const std::string& /*requestId*/) {
  if (!debuggingEnabled_.load(std::memory_order_relaxed)) {
    return;
  }

  // TODO(T216933356)
  throw std::runtime_error("Not implemented");
}

void NetworkReporter::reportDataReceived(const std::string& /*requestId*/) {
  if (!debuggingEnabled_.load(std::memory_order_relaxed)) {
    return;
  }

  // TODO(T218236266)
  throw std::runtime_error("Not implemented");
}

void NetworkReporter::reportResponseEnd(const std::string& /*requestId*/) {
  if (!debuggingEnabled_.load(std::memory_order_relaxed)) {
    return;
  }

  // TODO(T216933356)
  throw std::runtime_error("Not implemented");
}

} // namespace facebook::react::jsinspector_modern
