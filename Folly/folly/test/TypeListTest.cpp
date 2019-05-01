/*
 * Copyright 2017-present Facebook, Inc.
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

#include <folly/detail/TypeList.h>
#include <folly/portability/GTest.h>

using namespace folly;
using namespace detail;

namespace {
template <class T, class Ts, class = void>
struct IsApplicable_ : std::false_type {};
template <class T, class... Ts>
struct IsApplicable_<T, TypeList<Ts...>, void_t<MetaApply<T, Ts...>>>
    : std::true_type {};
template <class T, class... Ts>
using IsApplicable = IsApplicable_<T, TypeList<Ts...>>;
} // namespace

TEST(TypeList, Basic) {
  static_assert(TypeList<>::size() == 0, "");
  static_assert(TypeList<int>::size() == 1, "");
  static_assert(TypeList<int, short, float>::size() == 3, "");
}

template <class T>
using AddPointer = T*;

TEST(TypeList, Defer) {
  static_assert(
      std::is_same<MetaApply<MetaDefer<AddPointer, int>>, int*>::value, "");
  static_assert(!IsApplicable<MetaDefer<AddPointer, int, short>>::value, "");
  static_assert(!IsApplicable<MetaDefer<AddPointer, int&>>::value, "");
}

TEST(TypeList, Transform) {
  using Fn = MetaQuote<AddPointer>;
  using T1 = TypeTransform<TypeList<>, Fn>;
  static_assert(std::is_same<T1, TypeList<>>::value, "");
  using T2 = TypeTransform<TypeList<int>, Fn>;
  static_assert(std::is_same<T2, TypeList<int*>>::value, "");
  using T3 = TypeTransform<TypeList<int, short, void>, Fn>;
  static_assert(std::is_same<T3, TypeList<int*, short*, void*>>::value, "");
}

using Nil = Empty;
template <class Car, class Cdr = Nil>
struct Cons {};

TEST(TypeList, Fold) {
  using Fn = MetaQuote<Cons>;
  using T1 = TypeFold<TypeList<int, short, void>, Nil, Fn>;
  using E1 = Cons<int, Cons<short, Cons<void, Nil>>>;
  static_assert(std::is_same<T1, E1>::value, "");

  using T2 = TypeFold<TypeList<int, short, void, int*, short*, void*>, Nil, Fn>;
  using E2 = Cons<
      int,
      Cons<short, Cons<void, Cons<int*, Cons<short*, Cons<void*, Nil>>>>>>;
  static_assert(std::is_same<T2, E2>::value, "");

  using T3 = TypeReverseFold<TypeList<int, short, void>, Nil, MetaFlip<Fn>>;
  using E3 = Cons<void, Cons<short, Cons<int, Nil>>>;
  static_assert(std::is_same<T3, E3>::value, "");

  using T4 = TypeReverseFold<
      TypeList<int, short, void, int*, short*, void*>,
      Nil,
      MetaFlip<Fn>>;
  using E4 = Cons<
      void*,
      Cons<short*, Cons<int*, Cons<void, Cons<short, Cons<int, Nil>>>>>>;
  static_assert(std::is_same<T4, E4>::value, "");
}

TEST(TypeList, Unique) {
  using T1 = TypeUnique<TypeList<int, int, int, short, int, short>>;
  static_assert(std::is_same<T1, TypeList<int, short>>::value, "");

  using T2 = TypeReverseUnique<TypeList<int, int, int, short, int, short>>;
  static_assert(std::is_same<T2, TypeList<short, int>>::value, "");
}

TEST(TypeList, PushFront) {
  using T1 = TypePushFront<TypeList<>, int, short>;
  static_assert(std::is_same<T1, TypeList<int, short>>::value, "");

  using T2 = TypePushFront<T1, float, double, struct XXX>;
  static_assert(
      std::is_same<T2, TypeList<float, double, struct XXX, int, short>>::value,
      "");
}

TEST(TypeList, PushBack) {
  using T1 = TypePushBack<TypeList<>, int, short>;
  static_assert(std::is_same<T1, TypeList<int, short>>::value, "");

  using T2 = TypePushBack<T1, float, double, struct XXX>;
  static_assert(
      std::is_same<T2, TypeList<int, short, float, double, struct XXX>>::value,
      "");
}

TEST(TypeList, Join) {
  using T1 = TypeJoin<
      TypeList<TypeList<int>, TypeList<short, float>, TypeList<void*>>>;
  static_assert(
      std::is_same<T1, TypeList<int, short, float, void*>>::value, "");
}
