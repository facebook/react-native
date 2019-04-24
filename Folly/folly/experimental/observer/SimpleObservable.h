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
#include <folly/experimental/observer/Observer.h>

namespace folly {
namespace observer {

template <typename T>
class SimpleObservable {
 public:
  explicit SimpleObservable(T value);
  explicit SimpleObservable(std::shared_ptr<const T> value);

  void setValue(T value);
  void setValue(std::shared_ptr<const T> value);

  Observer<T> getObserver();

 private:
  struct Context {
    folly::Synchronized<std::shared_ptr<const T>> value_;
    folly::Synchronized<folly::Function<void()>> callback_;
  };
  struct Wrapper;
  std::shared_ptr<Context> context_;

  std::once_flag observerInit_;
  folly::Optional<Observer<T>> observer_;
};
} // namespace observer
} // namespace folly

#include <folly/experimental/observer/SimpleObservable-inl.h>
