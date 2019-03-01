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

namespace folly {
namespace observer {

template <typename Observable, typename Traits>
class ObserverCreator<Observable, Traits>::Context {
 public:
  template <typename... Args>
  Context(Args&&... args) : observable_(std::forward<Args>(args)...) {}

  ~Context() {
    if (value_.copy()) {
      Traits::unsubscribe(observable_);
    }
  }

  void setCore(observer_detail::Core::WeakPtr coreWeak) {
    coreWeak_ = std::move(coreWeak);
  }

  std::shared_ptr<const T> get() {
    updateRequested_ = false;
    return value_.copy();
  }

  void update() {
    // This mutex ensures there's no race condition between initial update()
    // call and update() calls from the subsciption callback.
    //
    // Additionally it helps avoid races between two different subscription
    // callbacks (getting new value from observable and storing it into value_
    // is not atomic).
    std::lock_guard<std::mutex> lg(updateMutex_);

    {
      auto newValue = Traits::get(observable_);
      if (!newValue) {
        throw std::logic_error("Observable returned nullptr.");
      }
      value_.swap(newValue);
    }

    bool expected = false;
    if (updateRequested_.compare_exchange_strong(expected, true)) {
      if (auto core = coreWeak_.lock()) {
        observer_detail::ObserverManager::scheduleRefreshNewVersion(
            std::move(core));
      }
    }
  }

  template <typename F>
  void subscribe(F&& callback) {
    Traits::subscribe(observable_, std::forward<F>(callback));
  }

 private:
  folly::Synchronized<std::shared_ptr<const T>> value_;
  std::atomic<bool> updateRequested_{false};

  observer_detail::Core::WeakPtr coreWeak_;

  Observable observable_;

  std::mutex updateMutex_;
};

template <typename Observable, typename Traits>
template <typename... Args>
ObserverCreator<Observable, Traits>::ObserverCreator(Args&&... args)
    : context_(std::make_shared<Context>(std::forward<Args>(args)...)) {}

template <typename Observable, typename Traits>
Observer<typename ObserverCreator<Observable, Traits>::T>
ObserverCreator<Observable, Traits>::getObserver()&& {
  auto core = observer_detail::Core::create([context = context_]() {
    return context->get();
  });

  context_->setCore(core);

  context_->subscribe([contextWeak = std::weak_ptr<Context>(context_)] {
    if (auto context = contextWeak.lock()) {
      context->update();
    }
  });

  context_->update();
  context_.reset();

  DCHECK(core->getVersion() > 0);

  return Observer<T>(std::move(core));
}
}
}
