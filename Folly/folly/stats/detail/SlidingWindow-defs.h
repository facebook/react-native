/*
 * Copyright 2018-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <folly/stats/detail/SlidingWindow.h>

#include <algorithm>

namespace folly {
namespace detail {

template <typename BucketT>
SlidingWindow<BucketT>::SlidingWindow(
    Function<BucketT(void)> fn,
    size_t numBuckets)
    : fn_(std::move(fn)), curHead_(0) {
  buckets_.reserve(numBuckets);
  for (size_t i = 0; i < numBuckets; ++i) {
    buckets_.push_back(fn_());
  }
  std::reverse(buckets_.begin(), buckets_.end());
}

template <typename BucketT>
SlidingWindow<BucketT>::SlidingWindow(SlidingWindow<BucketT>&& rhs)
    : fn_(std::move(rhs.fn_)),
      buckets_(std::move(rhs.buckets_)),
      curHead_(rhs.curHead_) {}

template <typename BucketT>
std::vector<BucketT> SlidingWindow<BucketT>::get() const {
  std::vector<BucketT> buckets;
  buckets.reserve(buckets_.size());
  buckets.insert(buckets.end(), buckets_.begin() + curHead_, buckets_.end());
  buckets.insert(buckets.end(), buckets_.begin(), buckets_.begin() + curHead_);
  return buckets;
}

template <typename BucketT>
BucketT SlidingWindow<BucketT>::front() const {
  return buckets_[curHead_];
}

template <typename BucketT>
void SlidingWindow<BucketT>::set(size_t idx, BucketT bucket) {
  if (idx < buckets_.size()) {
    idx = (curHead_ + idx) % buckets_.size();
    buckets_[idx] = std::move(bucket);
  }
}

template <typename BucketT>
void SlidingWindow<BucketT>::slide(size_t nBuckets) {
  nBuckets = std::min(nBuckets, buckets_.size());
  for (size_t i = 0; i < nBuckets; ++i) {
    if (curHead_ == 0) {
      curHead_ = buckets_.size() - 1;
    } else {
      curHead_--;
    }
    buckets_[curHead_] = fn_();
  }
}

} // namespace detail
} // namespace folly
