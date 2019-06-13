/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/container/EvictingCacheMap.h>

#include <react/attributedstring/AttributedString.h>
#include <react/attributedstring/ParagraphAttributes.h>
#include <react/core/LayoutConstraints.h>

namespace facebook {
namespace react {
using ParagraphMeasurementCacheKey =
    std::tuple<AttributedString, ParagraphAttributes, LayoutConstraints>;
using ParagraphMeasurementCacheValue = Size;

class ParagraphMeasurementCache {
 public:
  ParagraphMeasurementCache() : cache_{256} {}

  bool exists(const ParagraphMeasurementCacheKey &key) const {
    std::lock_guard<std::mutex> lock(mutex_);
    return cache_.exists(key);
  }

  ParagraphMeasurementCacheValue get(
      const ParagraphMeasurementCacheKey &key) const {
    std::lock_guard<std::mutex> lock(mutex_);
    return cache_.get(key);
  }

  void set(
      const ParagraphMeasurementCacheKey &key,
      const ParagraphMeasurementCacheValue &value) const {
    std::lock_guard<std::mutex> lock(mutex_);
    cache_.set(key, value);
  }

 private:
  mutable folly::EvictingCacheMap<
      ParagraphMeasurementCacheKey,
      ParagraphMeasurementCacheValue>
      cache_;
  mutable std::mutex mutex_;
};

} // namespace react
} // namespace facebook
