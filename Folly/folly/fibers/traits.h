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

#include <type_traits>

namespace folly {
namespace fibers {

/**
 * For any functor F taking >= 1 argument,
 * FirstArgOf<F>::type is the type of F's first parameter.
 *
 * Rationale: we want to declare a function func(F), where F has the
 * signature `void(X)` and func should return T<X> (T and X are some types).
 * Solution:
 *
 * template <typename F>
 * T<typename FirstArgOf<F>::type>
 * func(F&& f);
 */

namespace detail {

template <typename F>
struct ExtractFirstArg;

template <typename Ret, typename T, typename First, typename... Args>
struct ExtractFirstArg<Ret (T::*)(First, Args...)> {
  typedef First type;
};

template <typename Ret, typename T, typename First, typename... Args>
struct ExtractFirstArg<Ret (T::*)(First, Args...) const> {
  typedef First type;
};

template <typename Ret, typename First, typename... Args>
struct ExtractFirstArg<Ret(First, Args...)> {
  typedef First type;
};

} // namespace detail

template <typename F, typename Enable = void>
struct FirstArgOf;

/** Specialization for non-function-object callables */
template <typename F>
struct FirstArgOf<F, typename std::enable_if<!std::is_class<F>::value>::type> {
  typedef typename detail::ExtractFirstArg<
      typename std::remove_pointer<F>::type>::type type;
};

/** Specialization for function objects */
template <typename F>
struct FirstArgOf<F, typename std::enable_if<std::is_class<F>::value>::type> {
  typedef typename FirstArgOf<decltype(&F::operator())>::type type;
};

} // namespace fibers
} // namespace folly
