/*
 * Copyright 2014-present Facebook, Inc.
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

#include <folly/futures/Future.h>
#include <folly/portability/GTest.h>

#include <memory>

namespace folly {

typedef std::unique_ptr<int> A;
struct B {};

template <class T>
using EnableIfFuture = typename std::enable_if<isFuture<T>::value>::type;

template <class T>
using EnableUnlessFuture = typename std::enable_if<!isFuture<T>::value>::type;

template <class T>
Future<T> someFuture() {
  return makeFuture(T());
}

template <class Ret, class... Params>
typename std::enable_if<isFuture<Ret>::value, Ret>::type aFunction(Params...) {
  typedef typename Ret::value_type T;
  return makeFuture(T());
}

template <class Ret, class... Params>
typename std::enable_if<!isFuture<Ret>::value, Ret>::type aFunction(Params...) {
  return Ret();
}

template <class Ret, class... Params>
std::function<Ret(Params...)> aStdFunction(
    typename std::enable_if<!isFuture<Ret>::value, bool>::type = false) {
  return [](Params...) -> Ret { return Ret(); };
}

template <class Ret, class... Params>
std::function<Ret(Params...)> aStdFunction(
    typename std::enable_if<isFuture<Ret>::value, bool>::type = true) {
  typedef typename Ret::value_type T;
  return [](Params...) -> Future<T> { return makeFuture(T()); };
}

class SomeClass {
 public:
  template <class Ret, class... Params>
  static typename std::enable_if<!isFuture<Ret>::value, Ret>::type
  aStaticMethod(Params...) {
    return Ret();
  }

  template <class Ret, class... Params>
  static typename std::enable_if<isFuture<Ret>::value, Ret>::type aStaticMethod(
      Params...) {
    typedef typename Ret::value_type T;
    return makeFuture(T());
  }

  template <class Ret, class... Params>
  typename std::enable_if<!isFuture<Ret>::value, Ret>::type aMethod(Params...) {
    return Ret();
  }

  template <class Ret, class... Params>
  typename std::enable_if<isFuture<Ret>::value, Ret>::type aMethod(Params...) {
    typedef typename Ret::value_type T;
    return makeFuture(T());
  }
};

} // namespace folly
