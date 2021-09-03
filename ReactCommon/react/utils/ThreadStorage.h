/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/map.h>
#include <better/optional.h>
#include <mutex>
#include <thread>

namespace facebook {
namespace react {

/*
 * ThreadStorage is a class designed to store data for specific thread.
 * When data is inserted from thread 1, it can only be retrieved from thread 1.
 */
template <typename DataT>
class ThreadStorage {
  /*
   * Private default constructor. This class has to be used as a singleton.
   */
  ThreadStorage() = default;

 public:
  static ThreadStorage<DataT> &getInstance() {
    static ThreadStorage<DataT> threadStorage;
    return threadStorage;
  }

  better::optional<DataT> get() const {
    std::lock_guard<std::mutex> lock(mutex_);
    auto iterator = storage_.find(std::this_thread::get_id());

    if (iterator != storage_.end()) {
      return iterator->second;
    } else {
      return {};
    }
  }

  void set(DataT data) {
    std::lock_guard<std::mutex> lock(mutex_);
    storage_[std::this_thread::get_id()] = data;
  }

 private:
  mutable std::mutex mutex_;
  better::map<std::thread::id, DataT> storage_;
};

} // namespace react
} // namespace facebook
