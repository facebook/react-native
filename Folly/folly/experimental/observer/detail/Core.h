/*
 * Copyright 2016-present Facebook, Inc.
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

#include <folly/Function.h>
#include <folly/Synchronized.h>
#include <folly/futures/Future.h>

#include <atomic>
#include <memory>
#include <mutex>
#include <unordered_set>
#include <utility>
#include <vector>

namespace folly {
namespace observer_detail {

class ObserverManager;

/**
 * Core stores the current version of the object held by Observer. It also keeps
 * all dependencies and dependents of the Observer.
 */
class Core : public std::enable_shared_from_this<Core> {
 public:
  using Ptr = std::shared_ptr<Core>;
  using WeakPtr = std::weak_ptr<Core>;

  /**
   * Blocks until creator is successfully run by ObserverManager
   */
  static Ptr create(folly::Function<std::shared_ptr<const void>()> creator);

  /**
   * View of the observed object and its version
   */
  struct VersionedData {
    VersionedData() {}

    VersionedData(std::shared_ptr<const void> data_, size_t version_)
        : data(std::move(data_)), version(version_) {}

    std::shared_ptr<const void> data;
    size_t version{0};
  };

  /**
   * Gets current view of the observed object.
   * This is safe to call from any thread. If this is called from other Observer
   * functor then that Observer is marked as dependent on current Observer.
   */
  VersionedData getData();

  /**
   * Gets the version of the observed object.
   */
  size_t getVersion() const {
    return version_;
  }

  /**
   * Get the last version at which the observed object was actually changed.
   */
  size_t getVersionLastChange() {
    return versionLastChange_;
  }

  /**
   * Check if the observed object needs to be re-computed. Returns the version
   * of last change. If force is true, re-computes the observed object, even if
   * dependencies didn't change.
   *
   * This should be only called from ObserverManager thread.
   */
  size_t refresh(size_t version, bool force = false);

  ~Core();

 private:
  explicit Core(folly::Function<std::shared_ptr<const void>()> creator);

  void addDependent(Core::WeakPtr dependent);
  void removeStaleDependents();

  using Dependents = std::vector<WeakPtr>;
  using Dependencies = std::unordered_set<Ptr>;

  folly::Synchronized<Dependents> dependents_;
  folly::Synchronized<Dependencies> dependencies_;

  std::atomic<size_t> version_{0};
  std::atomic<size_t> versionLastChange_{0};

  folly::Synchronized<VersionedData> data_;

  folly::Function<std::shared_ptr<const void>()> creator_;

  std::mutex refreshMutex_;
};
} // namespace observer_detail
} // namespace folly
