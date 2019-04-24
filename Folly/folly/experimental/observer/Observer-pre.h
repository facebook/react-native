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

#include <folly/functional/Invoke.h>

namespace folly {
namespace observer_detail {

template <typename T>
struct NonSharedPtr {
  using type = typename std::decay<T>::type;
};

template <typename T>
struct NonSharedPtr<std::shared_ptr<T>> {};

template <typename T>
struct UnwrapSharedPtr {};

template <typename T>
struct UnwrapSharedPtr<std::shared_ptr<T>> {
  using type = typename std::decay<T>::type;
};

template <typename F>
using ResultOf = typename NonSharedPtr<invoke_result_t<F>>::type;

template <typename F>
using ResultOfUnwrapSharedPtr =
    typename UnwrapSharedPtr<invoke_result_t<F>>::type;
} // namespace observer_detail
} // namespace folly
