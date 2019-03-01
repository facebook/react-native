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

#include <type_traits>

namespace folly {

/// In functional programming, the degenerate case is often called "unit". In
/// C++, "void" is often the best analogue. However, because of the syntactic
/// special-casing required for void, it is frequently a liability for template
/// metaprogramming. So, instead of writing specializations to handle cases like
/// SomeContainer<void>, a library author may instead rule that out and simply
/// have library users use SomeContainer<Unit>. Contained values may be ignored.
/// Much easier.
///
/// "void" is the type that admits of no values at all. It is not possible to
/// construct a value of this type.
/// "unit" is the type that admits of precisely one unique value. It is
/// possible to construct a value of this type, but it is always the same value
/// every time, so it is uninteresting.
struct Unit {
  // These are structs rather than type aliases because MSVC 2017 RC has
  // trouble correctly resolving dependent expressions in type aliases
  // in certain very specific contexts, including a couple where this is
  // used. See the known issues section here for more info:
  // https://blogs.msdn.microsoft.com/vcblog/2016/06/07/expression-sfinae-improvements-in-vs-2015-update-3/

  template <typename T>
  struct Lift : std::conditional<std::is_same<T, void>::value, Unit, T> {};
  template <typename T>
  struct Drop : std::conditional<std::is_same<T, Unit>::value, void, T> {};

  bool operator==(const Unit& /*other*/) const { return true; }
  bool operator!=(const Unit& /*other*/) const { return false; }
};

constexpr Unit unit {};

}
