/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeHeapInfoCollector.h"
#include <fmt/format.h>
#include <glog/logging.h>
#include <jsi/instrumentation.h>
#include <stdexcept>

namespace facebook::react {

RuntimeHeapInfoCollector::RuntimeHeapInfoCollector(
    std::chrono::milliseconds intervalMs)
    : intervalMs_(intervalMs) {
  if (intervalMs_ <= std::chrono::milliseconds::zero()) {
    throw std::runtime_error(fmt::format(
        "Invalid interval, must be > 0ms, got {} ms", intervalMs_.count()));
  }

  lastCollectionTime_ = std::chrono::steady_clock::now();
}

std::unique_ptr<RuntimeHeapInfoCollector> RuntimeHeapInfoCollector::create(
    std::chrono::milliseconds intervalMs) {
  if (intervalMs <= std::chrono::milliseconds::zero()) {
    LOG(INFO) << "RuntimeHeapInfoCollector is disabled";
    return nullptr;
  }

  return std::make_unique<RuntimeHeapInfoCollector>(intervalMs);
}

void RuntimeHeapInfoCollector::collectHeapInfo(jsi::Runtime& runtime) {
  auto now = std::chrono::steady_clock::now();
  if (now - lastCollectionTime_ < intervalMs_) {
    return;
  }

  lastCollectionTime_ = now;
  auto heap = runtime.instrumentation().getHeapInfo(false);
  heapInfo_ = {
      .allocatedBytes = heap["hermes_allocatedBytes"],
      .heapSize = heap["hermes_heapSize"],
      .numCollections = heap["hermes_numCollections"],
  };
}

} // namespace facebook::react
