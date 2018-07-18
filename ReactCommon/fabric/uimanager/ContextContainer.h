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
 * Instance types must be copyable.
 */
class ContextContainer final {

public:
  /*
   * Registers an instance of the particular type `T` in the container.
   * If `key` parameter is specified, the instance is registered
   * by `{type, key}` pair.
   */
  template<typename T>
  void registerInstance(const T &instance, const std::string &key = "") {
    std::lock_guard<std::mutex> lock(mutex_);

    instances_.insert({
      {std::type_index(typeid(T)), key},
      std::make_shared<T>(instance)
    });
  }

  /*
   * Returns a previously registered instance of the particular type `T`.
   * If `key` parameter is specified, the lookup will be performed
   * by {type, key} pair.
   */
  template<typename T>
  T getInstance(const std::string &key = "") const {
    std::lock_guard<std::mutex> lock(mutex_);

    return *std::static_pointer_cast<T>(instances_.at({std::type_index(typeid(T)), key}));
  }

private:
  std::unordered_map<
    std::pair<std::type_index, std::string>,
    std::shared_ptr<void>
  > instances_;

  mutable std::mutex mutex_;
};

} // namespace react
} // namespace facebook
