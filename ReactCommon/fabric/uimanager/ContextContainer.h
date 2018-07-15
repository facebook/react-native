// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>
#include <mutex>
#include <typeindex>
#include <typeinfo>
#include <unordered_map>

namespace facebook {
namespace react {

class ContextContainer;

using SharedContextContainer = std::shared_ptr<ContextContainer>;

/*
 * General purpose dependecy injection container.
 */
class ContextContainer final {

public:
  template<typename T>
  void registerInstance(std::shared_ptr<T> instance) {
    std::lock_guard<std::mutex> lock(mutex_);
    instances_.insert({std::type_index(typeid(T)), instance});
  }

  template<typename T>
  std::shared_ptr<T> getInstance() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return std::static_pointer_cast<T>(instances_.at(std::type_index(typeid(T))));
  }

private:
  std::unordered_map<std::type_index, std::shared_ptr<void>> instances_;
  mutable std::mutex mutex_;
};

} // namespace react
} // namespace facebook
