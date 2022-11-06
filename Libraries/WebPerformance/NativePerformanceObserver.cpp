/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativePerformanceObserver.h"

namespace facebook::react {

void NativePerformanceObserver::startReporting(
    jsi::Runtime &rt,
    std::string entryType) {}

void NativePerformanceObserver::stopReporting(
    jsi::Runtime &rt,
    std::string entryType) {}

std::vector<RawPerformanceEntry> NativePerformanceObserver::getPendingEntries(
    jsi::Runtime &rt) {
  return std::vector<RawPerformanceEntry>{};
}

std::function<void()> NativePerformanceObserver::setOnPerformanceEntryCallback(
    jsi::Runtime &rt,
    std::optional<AsyncCallback<>> callback) {
  callback_ = callback;
  // Invoke function
  // if (callback) {
  //   callback.value()();
  // }
  // return cleanup function
  return [weakThis = weak_from_this()]() {
    if (auto strongThis = weakThis.lock()) {
      strongThis->callback_ = std::nullopt;
    }
  };
}

} // namespace facebook::react
