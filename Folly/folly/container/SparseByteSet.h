/*
 * Copyright 2015-present Facebook, Inc.
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

#include <cstdint>

#include <glog/logging.h>

namespace folly {

/***
 *  SparseByteSet
 *
 *  A special-purpose data structure representing an insert-only set of bytes.
 *  May have better performance than std::bitset<256>, depending on workload.
 *
 *  Operations:
 *  - add(byte)
 *  - contains(byte)
 *
 *  Performance:
 *  - The entire capacity of the set is inline; the set never allocates.
 *  - The constructor zeros only the first two bytes of the object.
 *  - add and contains both run in constant time w.r.t. the size of the set.
 *    Constant time - not amortized constant - and with small constant factor.
 *
 *  This data structure is ideal for on-stack use.
 *
 *  Aho, Hopcroft, and Ullman refer to this trick in "The Design and Analysis
 *  of Computer Algorithms" (1974), but the best description is here:
 *  http://research.swtch.com/sparse
 *  http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.30.7319
 */
class SparseByteSet {
 public:
  //  There are this many possible values:
  static constexpr uint16_t kCapacity = 256;

  //  No init of byte-arrays required!
  SparseByteSet() : size_(0) {}

  /***
   *  add(byte)
   *
   *  O(1), non-amortized.
   */
  inline bool add(uint8_t i) {
    bool r = !contains(i);
    if (r) {
      DCHECK_LT(size_, kCapacity);
      dense_[size_] = i;
      sparse_[i] = uint8_t(size_);
      size_++;
    }
    return r;
  }

  /***
   *  contains(byte)
   *
   *  O(1), non-amortized.
   */
  inline bool contains(uint8_t i) const {
    return sparse_[i] < size_ && dense_[sparse_[i]] == i;
  }

 private:
  uint16_t size_; // can't use uint8_t because it would overflow if all
                  // possible values were inserted.
  uint8_t sparse_[kCapacity];
  uint8_t dense_[kCapacity];
};

} // namespace folly
