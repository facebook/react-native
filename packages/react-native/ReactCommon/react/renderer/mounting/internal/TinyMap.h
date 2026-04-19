/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <algorithm>
#include <utility>

/*
 * Extremely simple and naive implementation of a map.
 * The map is simple but it's optimized for particular constraints that we have
 * here.
 *
 * A regular map implementation (e.g. `std::unordered_map`) has some basic
 * performance guarantees like constant average insertion and lookup complexity.
 * This is nice, but it's *average* complexity measured on a non-trivial amount
 * of data. The regular map is a very complex data structure that using hashing,
 * buckets, multiple comprising operations, multiple allocations and so on.
 *
 * In our particular case, we need a map for `int` to `void *` with a dozen
 * values. In these conditions, nothing can beat a naive implementation using a
 * stack-allocated vector. And this implementation is exactly this: no
 * allocation, no hashing, no complex branching, no buckets, no iterators, no
 * rehashing, no other guarantees. It's crazy limited, unsafe, and performant on
 * a trivial amount of data.
 *
 * Besides that, we also need to optimize for insertion performance (the case
 * where a bunch of views appears on the screen first time); in this
 * implementation, this is as performant as vector `push_back`.
 */
template <typename KeyT, typename ValueT>
class TinyMap final {
 public:
  using Pair = std::pair<KeyT, ValueT>;
  using Iterator = Pair *;

  /**
   * This must strictly only be called from outside of this class.
   */
  inline Iterator begin()
  {
    // Force a clean so that iterating over this TinyMap doesn't iterate over
    // erased elements. If all elements erased are at the front of the vector,
    // then we don't need to clean.
    cleanVector(erasedAtFront_ != numErased_);

    Iterator it = begin_();

    if (it != nullptr) {
      return it + erasedAtFront_;
    }

    return nullptr;
  }

  inline Iterator end()
  {
    // `back()` asserts on the vector being non-empty
    if (vector_.empty() || numErased_ == vector_.size()) {
      return nullptr;
    }

    return &vector_.back() + 1;
  }

  inline Iterator find(KeyT key)
  {
    cleanVector();

    react_native_assert(key != 0);

    if (begin_() == nullptr) {
      return end();
    }

    for (auto it = begin_() + erasedAtFront_; it != end(); it++) {
      if (it->first == key) {
        return it;
      }
    }

    return end();
  }

  inline void insert(Pair pair)
  {
    react_native_assert(pair.first != 0);
    vector_.push_back(pair);
  }

  inline void erase(Iterator iterator)
  {
    // Invalidate tag.
    iterator->first = 0;

    if (iterator == begin_() + erasedAtFront_) {
      erasedAtFront_++;
    }

    numErased_++;
  }

 private:
  /**
   * Same as begin() but doesn't call cleanVector at the beginning.
   */
  inline Iterator begin_()
  {
    // `front()` asserts on the vector being non-empty
    if (vector_.empty() || vector_.size() == numErased_) {
      return nullptr;
    }

    return &vector_.front();
  }

  /**
   * Remove erased elements from internal vector.
   * We only modify the vector if erased elements are at least half of the
   * vector.
   */
  inline void cleanVector(bool forceClean = false)
  {
    if ((numErased_ < (vector_.size() / 2) && !forceClean) || vector_.empty() || numErased_ == 0 ||
        numErased_ == erasedAtFront_) {
      return;
    }

    if (numErased_ == vector_.size()) {
      vector_.clear();
    } else {
      vector_.erase(
          std::remove_if(vector_.begin(), vector_.end(), [](const auto &item) { return item.first == 0; }),
          vector_.end());
    }
    numErased_ = 0;
    erasedAtFront_ = 0;
  }

  std::vector<Pair> vector_;
  size_t numErased_{0};
  size_t erasedAtFront_{0};
};
