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

namespace folly {
namespace observer {

namespace detail {

template <typename Observable, typename Traits>
class ObserverCreatorContext {
  using T = typename Traits::element_type;

 public:
  template <typename... Args>
  ObserverCreatorContext(Args&&... args)
      : observable_(std::forward<Args>(args)...) {
    updateValue();
  }

  ~ObserverCreatorContext() {
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
    if (!updateValue()) {
      // Value didn't change, so we can skip the version update.
      return;
    }

    bool expected = false;
    if (updateRequested_.compare_exchange_strong(expected, true)) {
      observer_detail::ObserverManager::scheduleRefreshNewVersion(coreWeak_);
    }
  }

  template <typename F>
  void subscribe(F&& callback) {
    Traits::subscribe(observable_, std::forward<F>(callback));
  }

 private:
  bool updateValue() {
    auto newValue = Traits::get(observable_);
    auto newValuePtr = newValue.get();
    if (!newValue) {
      throw std::logic_error("Observable returned nullptr.");
    }
    value_.swap(newValue);
    return newValuePtr != newValue.get();
  }

  folly::Synchronized<std::shared_ptr<const T>> value_;
  std::atomic<bool> updateRequested_{false};

  observer_detail::Core::WeakPtr coreWeak_;

  Observable observable_;

  std::mutex updateMutex_;
};

} // namespace detail

template <typename Observable, typename Traits>
template <typename... Args>
ObserverCreator<Observable, Traits>::ObserverCreator(Args&&... args)
    : context_(std::make_shared<Context>(std::forward<Args>(args)...)) {}

template <typename Observable, typename Traits>
Observer<typename ObserverCreator<Observable, Traits>::T>
ObserverCreator<Observable, Traits>::getObserver() && {
  // This master shared_ptr allows grabbing derived weak_ptrs, pointing to the
  // the same Context object, but using a separate reference count. Master
  // shared_ptr destructor then blocks until all shared_ptrs obtained from
  // derived weak_ptrs are released.
  class ContextMasterPointer {
   public:
    explicit ContextMasterPointer(std::shared_ptr<Context> context)
        : contextMaster_(std::move(context)),
          context_(
              contextMaster_.get(),
              [destroyBaton = destroyBaton_](Context*) {
                destroyBaton->post();
              }) {}
    ~ContextMasterPointer() {
      if (context_) {
        context_.reset();
        destroyBaton_->wait();
      }
    }
    ContextMasterPointer(const ContextMasterPointer&) = delete;
    ContextMasterPointer(ContextMasterPointer&&) = default;
    ContextMasterPointer& operator=(const ContextMasterPointer&) = delete;
    ContextMasterPointer& operator=(ContextMasterPointer&&) = default;

    Context* operator->() const {
      return contextMaster_.get();
    }

    std::weak_ptr<Context> get_weak() {
      return context_;
    }

   private:
    std::shared_ptr<folly::Baton<>> destroyBaton_{
        std::make_shared<folly::Baton<>>()};
    std::shared_ptr<Context> contextMaster_;
    std::shared_ptr<Context> context_;
  };
  // We want to make sure that Context can only be destroyed when Core is
  // destroyed. So we have to avoid the situation when subscribe callback is
  // locking Context shared_ptr and remains the last to release it.
  // We solve this by having Core hold the master shared_ptr and subscription
  // callback gets derived weak_ptr.
  ContextMasterPointer contextMaster(context_);
  auto contextWeak = contextMaster.get_weak();
  auto observer = makeObserver(
      [context = std::move(contextMaster)]() { return context->get(); });

  context_->setCore(observer.core_);
  context_->subscribe([contextWeak = std::move(contextWeak)] {
    if (auto context = contextWeak.lock()) {
      context->update();
    }
  });

  // Do an extra update in case observable was updated between observer creation
  // and setting updates callback.
  context_->update();
  context_.reset();

  return observer;
}
} // namespace observer
} // namespace folly
