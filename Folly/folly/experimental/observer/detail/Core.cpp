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

#include <folly/experimental/observer/detail/Core.h>

#include <folly/ExceptionString.h>
#include <folly/experimental/observer/detail/ObserverManager.h>

namespace folly {
namespace observer_detail {

Core::VersionedData Core::getData() {
  if (!ObserverManager::inManagerThread()) {
    return data_.copy();
  }

  ObserverManager::DependencyRecorder::markDependency(shared_from_this());

  auto version = ObserverManager::getVersion();

  if (version_ >= version) {
    return data_.copy();
  }

  refresh(version);

  DCHECK_GE(version_, version);
  return data_.copy();
}

size_t Core::refresh(size_t version, bool force) {
  CHECK(ObserverManager::inManagerThread());

  ObserverManager::DependencyRecorder::markRefreshDependency(*this);
  SCOPE_EXIT {
    ObserverManager::DependencyRecorder::unmarkRefreshDependency(*this);
  };

  if (version_ >= version) {
    return versionLastChange_;
  }

  {
    std::lock_guard<std::mutex> lgRefresh(refreshMutex_);

    // Recheck in case this code was already refreshed
    if (version_ >= version) {
      return versionLastChange_;
    }

    bool needRefresh = force || version_ == 0;

    ObserverManager::DependencyRecorder dependencyRecorder(*this);

    // This can be run in parallel, but we expect most updates to propagate
    // bottom to top.
    dependencies_.withRLock([&](const Dependencies& dependencies) {
      for (const auto& dependency : dependencies) {
        try {
          if (dependency->refresh(version) > version_) {
            needRefresh = true;
            break;
          }
        } catch (...) {
          LOG(ERROR) << "Exception while checking dependencies for updates: "
                     << exceptionStr(std::current_exception());

          needRefresh = true;
          break;
        }
      }
    });

    if (!needRefresh) {
      version_ = version;
      return versionLastChange_;
    }

    try {
      {
        VersionedData newData{creator_(), version};
        if (!newData.data) {
          throw std::logic_error("Observer creator returned nullptr.");
        }
        data_.swap(newData);
      }

      versionLastChange_ = version;
    } catch (...) {
      LOG(ERROR) << "Exception while refreshing Observer: "
                 << exceptionStr(std::current_exception());

      if (version_ == 0) {
        // Re-throw exception if this is the first time we run creator
        throw;
      }
    }

    version_ = version;

    if (versionLastChange_ != version) {
      return versionLastChange_;
    }

    auto newDependencies = dependencyRecorder.release();
    dependencies_.withWLock([&](Dependencies& dependencies) {
      for (const auto& dependency : newDependencies) {
        if (!dependencies.count(dependency)) {
          dependency->addDependent(this->shared_from_this());
        }
      }

      for (const auto& dependency : dependencies) {
        if (!newDependencies.count(dependency)) {
          dependency->removeStaleDependents();
        }
      }

      dependencies = std::move(newDependencies);
    });
  }

  auto dependents = dependents_.copy();

  for (const auto& dependentWeak : dependents) {
    if (auto dependent = dependentWeak.lock()) {
      ObserverManager::scheduleRefresh(std::move(dependent), version);
    }
  }

  return versionLastChange_;
}

Core::Core(folly::Function<std::shared_ptr<const void>()> creator)
    : creator_(std::move(creator)) {}

Core::~Core() {
  dependencies_.withWLock([](const Dependencies& dependencies) {
    for (const auto& dependecy : dependencies) {
      dependecy->removeStaleDependents();
    }
  });
}

Core::Ptr Core::create(folly::Function<std::shared_ptr<const void>()> creator) {
  auto core = Core::Ptr(new Core(std::move(creator)));
  return core;
}

void Core::addDependent(Core::WeakPtr dependent) {
  dependents_.withWLock([&](Dependents& dependents) {
    dependents.push_back(std::move(dependent));
  });
}

void Core::removeStaleDependents() {
  // This is inefficient, the assumption is that we won't have many dependents
  dependents_.withWLock([](Dependents& dependents) {
    for (size_t i = 0; i < dependents.size(); ++i) {
      if (dependents[i].expired()) {
        std::swap(dependents[i], dependents.back());
        dependents.pop_back();
        --i;
      }
    }
  });
}
} // namespace observer_detail
} // namespace folly
