/*
 * Copyright 2017 Facebook, Inc.
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

#include <folly/experimental/observer/detail/ObserverManager.h>

namespace folly {
namespace observer {

template <typename T>
Snapshot<T> Observer<T>::getSnapshot() const {
  auto data = core_->getData();
  return Snapshot<T>(
      *core_,
      std::static_pointer_cast<const T>(std::move(data.data)),
      data.version);
}

template <typename T>
Observer<T>::Observer(observer_detail::Core::Ptr core)
    : core_(std::move(core)) {}

template <typename F>
Observer<observer_detail::ResultOfUnwrapSharedPtr<F>> makeObserver(
    F&& creator) {
  auto core = observer_detail::Core::
      create([creator = std::forward<F>(creator)]() mutable {
        return std::static_pointer_cast<void>(creator());
      });

  observer_detail::ObserverManager::scheduleRefreshNewVersion(core);

  return Observer<observer_detail::ResultOfUnwrapSharedPtr<F>>(core);
}

template <typename F>
Observer<observer_detail::ResultOf<F>> makeObserver(F&& creator) {
  return makeObserver([creator = std::forward<F>(creator)]() mutable {
    return std::make_shared<observer_detail::ResultOf<F>>(creator());
  });
}

template <typename T>
TLObserver<T>::TLObserver(Observer<T> observer)
    : observer_(observer),
      snapshot_([&] { return new Snapshot<T>(observer_.getSnapshot()); }) {}

template <typename T>
TLObserver<T>::TLObserver(const TLObserver<T>& other)
    : TLObserver(other.observer_) {}

template <typename T>
const Snapshot<T>& TLObserver<T>::getSnapshotRef() const {
  auto& snapshot = *snapshot_;
  if (observer_.needRefresh(snapshot) ||
      observer_detail::ObserverManager::inManagerThread()) {
    snapshot = observer_.getSnapshot();
  }

  return snapshot;
}
}
}
