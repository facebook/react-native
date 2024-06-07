/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <algorithm>
#include <functional>
#include <vector>

namespace facebook::react {

constexpr size_t DEFAULT_MAX_SIZE = 1024;

/**
 * A container for storing entries of type T, with the following properties:
 * - It can only grow up to a specified max size
 * - It's a circular buffer (the oldest elements are dropped if reached max
 * size and adding a new element)
 * - The entries can be "consumed" (once), which from the point of view of
 *   the consumer effectively clears the buffer
 * - Even after the entries are consumed, all of the non-overwritten entries
 *   can still be independently retrieved an arbitrary amount of times
 *
 * Note that the space for maxSize elements is reserved on construction. This
 * ensures that pointers to elements remain stable across add() operations.
 */
template <class T>
class BoundedConsumableBuffer {
 public:
  /**
   * Status of the add/push operation for the `BoundedConsumableBuffer`
   * container
   */
  enum class PushStatus {
    // There was free space in the buffer, element was successfully pushed:
    OK = 0,

    // Element was pushed, but had to overwrite some already consumed elements:
    OVERWRITE = 1,

    // Element wasn't pushed, as buffer size limit has been reached and it's
    // not possible to overwrite already consumed elements anymore:
    DROP = 2,
  };

  BoundedConsumableBuffer(size_t maxSize = DEFAULT_MAX_SIZE)
      : maxSize_(maxSize) {
    entries_.reserve(maxSize_);
  }

  /**
   * Adds (pushes) element into the buffer. Returns the result/status of the
   * operation, which will depend on whether the buffer reached the max allowed
   * size and how many are there unconsumed elements.
   */
  PushStatus add(const T&& el) {
    if (entries_.size() < maxSize_) {
      // Haven't reached max buffer size yet, just add and grow the buffer
      entries_.emplace_back(el);
      cursorEnd_++;
      numToConsume_++;
      return PushStatus::OK;
    } else if (numToConsume_ == maxSize_) {
      // Drop the oldest (yet unconsumed) element in the buffer
      entries_[position_] = el;
      cursorEnd_ = (cursorEnd_ + 1) % maxSize_;
      position_ = (position_ + 1) % maxSize_;
      cursorStart_ = position_;
      return PushStatus::DROP;
    } else {
      // Overwrite the oldest (but already consumed) element in the buffer
      entries_[position_] = el;
      position_ = (position_ + 1) % entries_.size();
      cursorEnd_ = position_;
      numToConsume_++;
      return PushStatus::OVERWRITE;
    }
  }

  /**
   * Returns pointer to next entry which would be overwritten or dropped if
   * added a new element. Null if no entry will be dropped.
   */
  const T* getNextOverwriteCandidate() const {
    if (entries_.size() < maxSize_) {
      return nullptr;
    } else {
      return &entries_[position_];
    }
  }

  T& operator[](size_t idx) {
    return entries_[(position_ + idx) % entries_.size()];
  }

  /**
   * Returns reference to the last unconsumed element
   */
  T& back() {
    return entries_[(cursorEnd_ - 1 + entries_.size()) % entries_.size()];
  }

  size_t size() const {
    return entries_.size();
  }

  size_t getNumToConsume() const {
    return numToConsume_;
  }

  void clear() {
    entries_.clear();
    position_ = 0;
    cursorStart_ = 0;
    cursorEnd_ = 0;
    numToConsume_ = 0;
  }

  /**
   * Clears buffer entries by predicate
   */
  void clear(std::function<bool(const T&)> predicate) {
    std::vector<T> entries;
    int numToConsume = 0;

    entries.reserve(maxSize_);
    for (size_t i = 0; i < entries_.size(); i++) {
      T& el = entries_[(i + position_) % entries_.size()];
      if (predicate(el)) {
        continue;
      }

      entries.push_back(std::move(el));
      if (i + numToConsume_ >= entries_.size()) { // el is unconsumed
        numToConsume++;
      }
    }

    numToConsume_ = numToConsume;
    cursorEnd_ = entries.size() % maxSize_;
    cursorStart_ = (cursorEnd_ - numToConsume_ + maxSize_) % maxSize_;
    position_ = 0;

    entries.swap(entries_);
  }

  /**
   * Retrieves buffer entries, whether consumed or not
   */
  std::vector<T> getEntries() const {
    std::vector<T> res;
    getEntries(res);
    return res;
  }

  /**
   * Retrieves buffer entries, whether consumed or not, with predicate
   */
  std::vector<T> getEntries(std::function<bool(const T&)> predicate) const {
    std::vector<T> res;
    getEntries(res, predicate);
    return res;
  }

  void getEntries(std::vector<T>& res) const {
    const size_t oldSize = res.size();
    res.resize(oldSize + entries_.size());
    std::copy(
        entries_.begin() + position_, entries_.end(), res.begin() + oldSize);
    std::copy(
        entries_.begin(),
        entries_.begin() + position_,
        res.begin() + oldSize + entries_.size() - position_);
  }

  void getEntries(std::vector<T>& res, std::function<bool(const T&)> predicate)
      const {
    for (size_t i = 0; i < entries_.size(); i++) {
      const T& el = entries_[(i + position_) % entries_.size()];
      if (predicate(el)) {
        res.push_back(el);
      }
    }
  }

  /**
   * "Consumes" all the currently unconsumed entries in the buffer and returns
   * these entries. Note that even if the buffer may not have unconsumed
   * elements currently, it's still possible to retrieve all buffer elements
   * via `getEntries`.
   */
  std::vector<T> consume() {
    std::vector<T> res;
    consume(res);
    return res;
  }

  void consume(std::vector<T>& res) {
    if (numToConsume_ == 0) {
      return;
    }

    const size_t resStart = res.size();
    res.resize(res.size() + numToConsume_);
    if (cursorEnd_ > cursorStart_) {
      std::copy(
          entries_.begin() + cursorStart_,
          entries_.begin() + cursorEnd_,
          res.begin() + resStart);
    } else {
      std::copy(
          entries_.begin() + cursorStart_,
          entries_.end(),
          res.begin() + resStart);
      std::copy(
          entries_.begin(),
          entries_.begin() + cursorEnd_,
          res.begin() + resStart + static_cast<int>(entries_.size()) -
              cursorStart_);
    }

    cursorStart_ = cursorEnd_;
    numToConsume_ = 0;
  }

 private:
  std::vector<T> entries_;

  const size_t maxSize_;

  // Current starting position in the circular buffer:
  size_t position_{0};

  // Current "cursor" - positions of the first and after last unconsumed
  // element, relative to the starting position:
  size_t cursorStart_{0};
  size_t cursorEnd_{0};

  // Number of currently unconsumed elements:
  size_t numToConsume_{0};
};

} // namespace facebook::react
