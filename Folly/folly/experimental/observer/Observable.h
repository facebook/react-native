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

#include <folly/experimental/observer/Observer.h>

namespace folly {
namespace observer {

namespace detail {
template <typename Observable, typename Traits>
class ObserverCreatorContext;
}

template <typename Observable>
struct ObservableTraits {
  using element_type =
      typename std::remove_reference<Observable>::type::element_type;

  static std::shared_ptr<const element_type> get(Observable& observable) {
    return observable.get();
  }

  template <typename F>
  static void subscribe(Observable& observable, F&& callback) {
    observable.subscribe(std::forward<F>(callback));
  }

  static void unsubscribe(Observable& observable) {
    observable.unsubscribe();
  }
};

template <typename Observable, typename Traits = ObservableTraits<Observable>>
class ObserverCreator {
 public:
  using T = typename Traits::element_type;

  template <typename... Args>
  explicit ObserverCreator(Args&&... args);

  Observer<T> getObserver() &&;

 private:
  using Context = detail::ObserverCreatorContext<Observable, Traits>;

  std::shared_ptr<Context> context_;
};
} // namespace observer
} // namespace folly

#include <folly/experimental/observer/Observable-inl.h>
