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

#include <folly/Utility.h>
#include <folly/functional/Invoke.h>

#include <tuple>
#include <utility>

namespace folly {

namespace detail {
namespace partial {

// helper type to make sure that the templated constructor in Partial does
// not accidentally act as copy or move constructor
struct PartialConstructFromCallable {};

template <typename F, typename Tuple>
class Partial {
  using Indexes = make_index_sequence<std::tuple_size<Tuple>{}>;

  template <typename Self, std::size_t... I, typename... Args>
  static auto invokeForward(Self&& self, index_sequence<I...>, Args&&... args)
      -> decltype(invoke(
          std::declval<Self>().f_,
          std::get<I>(std::declval<Self>().stored_args_)...,
          std::declval<Args>()...)) {
    return invoke(
        std::forward<Self>(self).f_,
        std::get<I>(std::forward<Self>(self).stored_args_)...,
        std::forward<Args>(args)...);
  }

 public:
  template <typename Callable, typename... Args>
  Partial(PartialConstructFromCallable, Callable&& callable, Args&&... args)
      : f_(std::forward<Callable>(callable)),
        stored_args_(std::forward<Args>(args)...) {}

  template <typename... CArgs>
  auto operator()(CArgs&&... cargs) & -> decltype(invokeForward(
      std::declval<Partial&>(),
      Indexes{},
      std::declval<CArgs>()...)) {
    return invokeForward(*this, Indexes{}, std::forward<CArgs>(cargs)...);
  }
  template <typename... CArgs>
  auto operator()(CArgs&&... cargs) const& -> decltype(invokeForward(
      std::declval<const Partial&>(),
      Indexes{},
      std::declval<CArgs>()...)) {
    return invokeForward(*this, Indexes{}, std::forward<CArgs>(cargs)...);
  }
  template <typename... As>
  auto operator()(As&&... a) && -> decltype(invokeForward(
      std::declval<Partial&&>(),
      Indexes{},
      std::declval<As>()...)) {
    return invokeForward(std::move(*this), Indexes{}, std::forward<As>(a)...);
  }
  template <typename... As>
  auto operator()(As&&... as) const&& -> decltype(invokeForward(
      std::declval<const Partial&&>(),
      Indexes{},
      std::declval<As>()...)) {
    return invokeForward(std::move(*this), Indexes{}, std::forward<As>(as)...);
  }

 private:
  // the stored callable
  F f_;
  // the stored arguments, these will be forwarded along with the actual
  // argumnets to the callable above
  Tuple stored_args_;
};

} // namespace partial
} // namespace detail

/**
 * Partially applies arguments to a callable
 *
 * `partial` takes a callable and zero or more additional arguments and returns
 * a callable object, which when called with zero or more arguments, will invoke
 * the original callable with the additional arguments passed to `partial`,
 * followed by those passed to the call.
 *
 * E.g. `partial(Foo, 1, 2)(3)` is equivalent to `Foo(1, 2, 3)`.
 *
 * `partial` can be used to bind a class method to an instance:
 * `partial(&Foo::method, foo_pointer)` returns a callable object that can be
 * invoked in the same way as `foo_pointer->method`. In case the first
 * argument in a call to `partial` is a member pointer, the second argument
 * can be a reference, pointer or any object that can be dereferenced to
 * an object of type Foo (like `std::shared_ptr` or `std::unique_ptr`).
 *
 * `partial` is similar to `std::bind`, but you don't have to use placeholders
 * to have arguments passed on. Any number of arguments passed to the object
 * returned by `partial` when called will be added to those passed to `partial`
 * and passed to the original callable.
 */
template <typename F, typename... Args>
auto partial(F&& f, Args&&... args) -> detail::partial::Partial<
    typename std::decay<F>::type,
    std::tuple<typename std::decay<Args>::type...>> {
  return {detail::partial::PartialConstructFromCallable{},
          std::forward<F>(f),
          std::forward<Args>(args)...};
}

} // namespace folly
