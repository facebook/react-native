/*
 * Copyright 2015-present Facebook, Inc.
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

// included by Future.h, do not include directly.

namespace folly {

template <class>
class Promise;

template <class T>
class SemiFuture;

template <typename T>
struct isSemiFuture : std::false_type {
  using Inner = typename lift_unit<T>::type;
};

template <typename T>
struct isSemiFuture<SemiFuture<T>> : std::true_type {
  typedef T Inner;
};

template <typename T>
struct isFuture : std::false_type {
  using Inner = typename lift_unit<T>::type;
};

template <typename T>
struct isFuture<Future<T>> : std::true_type {
  typedef T Inner;
};

template <typename T>
struct isFutureOrSemiFuture : std::false_type {
  using Inner = typename lift_unit<T>::type;
  using Return = Inner;
};

template <typename T>
struct isFutureOrSemiFuture<Future<T>> : std::true_type {
  typedef T Inner;
  using Return = Future<Inner>;
};

template <typename T>
struct isFutureOrSemiFuture<SemiFuture<T>> : std::true_type {
  typedef T Inner;
  using Return = SemiFuture<Inner>;
};

template <typename T>
struct isTry : std::false_type {};

template <typename T>
struct isTry<Try<T>> : std::true_type {};

namespace futures {
namespace detail {

template <class>
class Core;

template <typename...>
struct ArgType;

template <typename Arg, typename... Args>
struct ArgType<Arg, Args...> {
  typedef Arg FirstArg;
};

template <>
struct ArgType<> {
  typedef void FirstArg;
};

template <bool isTry_, typename F, typename... Args>
struct argResult {
  using Function = F;
  using ArgList = ArgType<Args...>;
  using Result = invoke_result_t<F, Args...>;
  using ArgsSize = index_constant<sizeof...(Args)>;
  static constexpr bool isTry() {
    return isTry_;
  }
};

template <typename T, typename F>
struct callableResult {
  typedef typename std::conditional<
      is_invocable<F>::value,
      detail::argResult<false, F>,
      typename std::conditional<
          is_invocable<F, T&&>::value,
          detail::argResult<false, F, T&&>,
          detail::argResult<true, F, Try<T>&&>>::type>::type Arg;
  typedef isFutureOrSemiFuture<typename Arg::Result> ReturnsFuture;
  typedef Future<typename ReturnsFuture::Inner> Return;
};

template <typename T, typename F>
struct tryCallableResult {
  typedef detail::argResult<true, F, Try<T>&&> Arg;
  typedef isFutureOrSemiFuture<typename Arg::Result> ReturnsFuture;
  typedef typename ReturnsFuture::Inner value_type;
  typedef Future<value_type> Return;
};

template <typename T, typename F>
struct valueCallableResult {
  typedef detail::argResult<false, F, T&&> Arg;
  typedef isFutureOrSemiFuture<typename Arg::Result> ReturnsFuture;
  typedef typename ReturnsFuture::Inner value_type;
  typedef typename Arg::ArgList::FirstArg FirstArg;
  typedef Future<value_type> Return;
};

template <typename L>
struct Extract : Extract<decltype(&L::operator())> {};

template <typename Class, typename R, typename... Args>
struct Extract<R (Class::*)(Args...) const> {
  typedef isFutureOrSemiFuture<R> ReturnsFuture;
  typedef Future<typename ReturnsFuture::Inner> Return;
  typedef typename ReturnsFuture::Inner RawReturn;
  typedef typename ArgType<Args...>::FirstArg FirstArg;
};

template <typename Class, typename R, typename... Args>
struct Extract<R (Class::*)(Args...)> {
  typedef isFutureOrSemiFuture<R> ReturnsFuture;
  typedef Future<typename ReturnsFuture::Inner> Return;
  typedef typename ReturnsFuture::Inner RawReturn;
  typedef typename ArgType<Args...>::FirstArg FirstArg;
};

template <typename R, typename... Args>
struct Extract<R (*)(Args...)> {
  typedef isFutureOrSemiFuture<R> ReturnsFuture;
  typedef Future<typename ReturnsFuture::Inner> Return;
  typedef typename ReturnsFuture::Inner RawReturn;
  typedef typename ArgType<Args...>::FirstArg FirstArg;
};

template <typename R, typename... Args>
struct Extract<R (&)(Args...)> {
  typedef isFutureOrSemiFuture<R> ReturnsFuture;
  typedef Future<typename ReturnsFuture::Inner> Return;
  typedef typename ReturnsFuture::Inner RawReturn;
  typedef typename ArgType<Args...>::FirstArg FirstArg;
};

class DeferredExecutor;

} // namespace detail
} // namespace futures

class Timekeeper;

} // namespace folly
