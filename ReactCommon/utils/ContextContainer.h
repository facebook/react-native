/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
 * General purpose dependency injection container.
 * Instance types must be copyable.
 */
class ContextContainer final {
 public:
  using Shared = std::shared_ptr<ContextContainer const>;

  /*
   * Registers an instance of the particular type `T` in the container
   * using the provided `key`. Only one instance can be registered per key.
   * The method does nothing if given `key` already exists in the container.
   *
   * Convention is to use the plain base class name for the key, so for
   * example if the type `T` is `std::shared_ptr<const ReactNativeConfig>`,
   * then one would use `"ReactNativeConfig"` for the `key`, even if the
   * instance is actually a `shared_ptr` of derived class
   *`EmptyReactNativeConfig`.
   */
  template <typename T>
  void insert(std::string const &key, T const &instance) const {
    std::unique_lock<better::shared_mutex> lock(mutex_);

    instances_.insert({key, std::make_shared<T>(instance)});

#ifndef NDEBUG
    typeNames_.insert({key, typeid(T).name()});
#endif
  }

  /*
   * Removes an instance stored for a given `key`.
   * Does nothing if the instance was not found.
   */
  void erase(std::string const &key) const {
    std::unique_lock<better::shared_mutex> lock(mutex_);

    instances_.erase(key);

#ifndef NDEBUG
    typeNames_.erase(key);
#endif
  }

  /*
   * Updates the container with values from a given container.
   * Values with keys that already exist in the container will be replaced with
   * values from the given container.
   */
  void update(ContextContainer const &contextContainer) const {
    std::unique_lock<better::shared_mutex> lock(mutex_);

    for (auto const &pair : contextContainer.instances_) {
      instances_.erase(pair.first);
      instances_.insert(pair);
#ifndef NDEBUG
      typeNames_.erase(pair.first);
      typeNames_.insert(
          {pair.first, contextContainer.typeNames_.at(pair.first)});
#endif
    }
  }

  /*
   * Returns a previously registered instance of the particular type `T`
   * for `key`.
   * Throws an exception if the instance could not be found.
   */
  template <typename T>
  T at(std::string const &key) const {
    std::shared_lock<better::shared_mutex> lock(mutex_);

    assert(
        instances_.find(key) != instances_.end() &&
        "ContextContainer doesn't have an instance for given key.");
    assert(
        typeNames_.at(key) == typeid(T).name() &&
        "ContextContainer stores an instance of different type for given key.");
    return *std::static_pointer_cast<T>(instances_.at(key));
  }

  /*
   * Returns a (wrapped in an optional) previously registered instance of
   * the particular type `T` for given `key`.
   * Returns an empty optional if the instance could not be found.
   */
  template <typename T>
  better::optional<T> find(std::string const &key) const {
    std::shared_lock<better::shared_mutex> lock(mutex_);

    auto iterator = instances_.find(key);
    if (iterator == instances_.end()) {
      return {};
    }

    assert(
        typeNames_.at(key) == typeid(T).name() &&
        "ContextContainer stores an instance of different type for given key.");

    return *std::static_pointer_cast<T>(iterator->second);
  }

 private:
  mutable better::shared_mutex mutex_;
  // Protected by mutex_`.
  mutable better::map<std::string, std::shared_ptr<void>> instances_;
#ifndef NDEBUG
  mutable better::map<std::string, std::string> typeNames_;
#endif
};

} // namespace react
} // namespace facebook
