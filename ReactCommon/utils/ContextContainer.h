// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>
#include <mutex>
#include <string>

#include <better/map.h>
#include <better/mutex.h>
#include <better/optional.h>

namespace facebook {
namespace react {

/*
 * General purpose dependecy injection container.
 * Instance types must be copyable.
 */
class ContextContainer final {
 public:
  using Shared = std::shared_ptr<const ContextContainer>;

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
  void registerInstance(T const &instance, std::string const &key) const {
    std::unique_lock<better::shared_mutex> lock(mutex_);

    assert(
        instances_.find(key) == instances_.end() &&
        "ContextContainer already had instance for given key.");
    instances_.insert({key, std::make_shared<T>(instance)});
  }

  /*
   * Returns a previously registered instance of the particular type `T`
   * for `key`.
   */
  template <typename T>
  T getInstance(std::string const &key) const {
    std::shared_lock<better::shared_mutex> lock(mutex_);

    assert(
        instances_.find(key) != instances_.end() &&
        "ContextContainer doesn't have an instance for given key.");
    return *std::static_pointer_cast<T>(instances_.at(key));
  }

 private:
  mutable better::shared_mutex mutex_;
  // Protected by mutex_`.
  mutable better::map<std::string, std::shared_ptr<void>> instances_;
};

} // namespace react
} // namespace facebook
