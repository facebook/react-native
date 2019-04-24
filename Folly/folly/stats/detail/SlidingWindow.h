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

#include <cstddef>
#include <vector>

#include <folly/Function.h>

namespace folly {
namespace detail {

/*
 * This class represents a sliding window that can be used to track stats over
 * time. Buckets are dropped and new ones are added with the slide() method.
 * New buckets are created with the constructor function given at construction.
 */
template <typename BucketT>
class SlidingWindow {
 public:
  SlidingWindow(Function<BucketT(void)> fn, size_t numBuckets);

  SlidingWindow(SlidingWindow&& rhs);

  std::vector<BucketT> get() const;

  void set(size_t idx, BucketT bucket);

  BucketT front() const;

  /*
   * Slides the SlidingWindow by nBuckets, inserting new buckets using the
   * Function given during construction.
   */
  void slide(size_t nBuckets);

 private:
  Function<BucketT(void)> fn_;
  std::vector<BucketT> buckets_;
  size_t curHead_;
};

} // namespace detail
} // namespace folly
