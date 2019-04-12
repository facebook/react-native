// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>

#include <glog/logging.h>

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
  using Shared = std::shared_ptr<ContextContainer>;

  /*
   * Registers an instance of the particular type `T` in the container
   * using the provided `key`. Only one instance can be registered per key.
   *
   * Convention is to use the plain base class name for the key, so for
   * example if the type `T` is `std::shared_ptr<const ReactNativeConfig>`,
   * then one would use `"ReactNativeConfig"` for the `key`, even if the
   * instance is actually a `shared_ptr` of derived class
   *`EmptyReactNativeConfig`.
   */
  template <typename T>
  void registerInstance(T const &instance, std::string const &key) {
    std::lock_guard<std::mutex> lock(mutex_);

    auto res = instances_.insert({key, std::make_shared<T>(instance)});
    if (res.second == false) {
      LOG(FATAL) << "ContextContainer already had instance for key '" << key
                 << "'";
    }
  }

  /*
   * Returns a previously registered instance of the particular type `T`
   * for `key`.
   */
  template <typename T>
  T getInstance(std::string const &key) const {
    std::lock_guard<std::mutex> lock(mutex_);

    return *std::static_pointer_cast<T>(instances_.at(key));
  }

 private:
  std::unordered_map<std::string, std::shared_ptr<void>> instances_;

  mutable std::mutex mutex_;
};

} // namespace react
} // namespace facebook
