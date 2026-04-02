/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MergedValueDispatcher.h"
#include <react/renderer/core/DynamicPropsUtilities.h>

namespace facebook::react {

MergedValueDispatcher::MergedValueDispatcher(
    DispatchFunction dispatchFunction,
    MergedValueFunction mergedValueFunction)
    : dispatchFunction_(std::move(dispatchFunction)),
      mergedValueFunction_(std::move(mergedValueFunction)) {}

void MergedValueDispatcher::dispatch(
    const std::unordered_map<Tag, folly::dynamic>& value) {
  {
    std::lock_guard<std::mutex> lock(mutex_);
    for (auto& [viewTag, props] : value) {
      accumulatedValues_[viewTag] = mergeDynamicProps(
          accumulatedValues_[viewTag], props, NullValueStrategy::Override);
    }

    if (hasPendingDispatch_) {
      return;
    }

    hasPendingDispatch_ = true;
  }

  dispatchFunction_([this]() {
    auto accumulatedValuesCopy = std::unordered_map<Tag, folly::dynamic>{};
    {
      std::lock_guard<std::mutex> lock(mutex_);
      std::swap(accumulatedValues_, accumulatedValuesCopy);
      hasPendingDispatch_ = false;
    }
    mergedValueFunction_(std::move(accumulatedValuesCopy));
  });
}

} // namespace facebook::react
