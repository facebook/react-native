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

#pragma once

#include <cstddef>
#include <utility>

#include <folly/Traits.h>
#include <folly/Utility.h>

/**
 * \file TypeList.h
 * \author Eric Niebler
 *
 * The file contains facilities for manipulating lists of types, and for
 * defining and composing operations over types.
 *
 * The type-operations behave like compile-time functions: they accept types as
 * input and produce types as output. A simple example is a template alias, like
 * `std::add_pointer_t`. However, templates are not themselves first class
 * citizens of the language; they cannot be easily "returned" from a
 * metafunction, and passing them to a metafunction is awkward and often
 * requires the user to help the C++ parser by adding hints like `typename`
 * and `template` to disambiguate the syntax. That makes higher-ordered
 * metaprogramming difficult. (There is no simple way to e.g., compose two
 * template aliases and pass the result as an argument to another template.)
 *
 * Instead, we wrap template aliases in a ordinary class, which _can_ be passed
 * and returned simply from metafunctions. This is like Boost.MPL's notion of a
 * "metafunction class"[1], and we adopt that terminology here.
 *
 * For the Folly.TypeList library, a metafunction class is a protocol that
 * all the components of Folly.TypeList expect and agree upon. It is a class
 * type that has a nested template alias called `Apply`. So for instance,
 * `std::add_pointer_t` as a Folly metafunction class would look like this:
 *
 *     struct AddPointer {
 *       template <class T>
 *       using apply = T*;
 *     };
 *
 * Folly.TypeList gives a simple way to "lift" an ordinary template alias into
 * a metafunction class: `MetaQuote`. The above `AddPointer` could instead be
 * written as:
 *
 *     using AddPointer = folly::MetaQuote<std::add_pointer_t>;
 *
 * \par Naming
 *
 * A word about naming. Components in Folly.TypeList fall into two buckets:
 * utilities for manipulating lists of types, and utilities for manipulating
 * metafunction classes. The former have names that start with `Type`, as in
 * `TypeList` and `TypeTransform`. The latter have names that start with `Meta`,
 * as in `MetaQuote` and `MetaApply`.
 *
 * [1] Boost.MPL Metafunction Class:
 *     http://www.boost.org/libs/mpl/doc/refmanual/metafunction-class.html
 */

namespace folly {
namespace detail {

/**
 * Handy shortcuts for some standard facilities
 */
template <bool B>
using Bool = bool_constant<B>;
using True = std::true_type;
using False = std::false_type;

/**
 * Given a metafunction class `Fn` and arguments `Ts...`, invoke `Fn`
 * with `Ts...`.
 */
template <class Fn, class... Ts>
using MetaApply = typename Fn::template apply<Ts...>;

/**
 * A list of types.
 */
template <class... Ts>
struct TypeList {
  /**
   * An alias for this list of types
   */
  using type = TypeList;

  /**
   * \return the number of types in this list.
   */
  static constexpr std::size_t size() noexcept {
    return sizeof...(Ts);
  }

  /**
   * This list of types is also a metafunction class that accepts another
   * metafunction class and invokes it with all the types in the list.
   */
  template <class Fn>
  using apply = MetaApply<Fn, Ts...>;
};

/**
 * A wrapper for a type
 */
template <class T>
struct Type {
  /**
   * An alias for the wrapped type
   */
  using type = T;

  /**
   * This wrapper is a metafunction class that, when applied with any number
   * of arguments, returns the wrapped type.
   */
  template <class...>
  using apply = T;
};

/**
 * An empty struct.
 */
struct Empty {};

/// \cond
namespace impl {
template <bool B>
struct If_ {
  template <class T, class U>
  using apply = T;
};
template <>
struct If_<false> {
  template <class T, class U>
  using apply = U;
};
} // namespace impl
/// \endcond

/**
 * Like std::conditional, but with fewer template instantiations
 */
template <bool If_, class Then, class Else>
using If = MetaApply<impl::If_<If_>, Then, Else>;

/**
 * Defers the evaluation of an alias.
 *
 * Given a template `C` and arguments `Ts...`, then
 * - If `C<Ts...>` is well-formed, `MetaApply<MetaDefer<C, Ts...>>` is well-
 *   formed and is an alias for `C<Ts...>`.
 * - Otherwise, `MetaApply<MetaDefer<C, Ts...>>` is ill-formed.
 */
template <template <class...> class C, class... Ts>
class MetaDefer {
  template <template <class...> class D = C, class = D<Ts...>>
  static char (&try_(int))[1];
  static char (&try_(long))[2];
  struct Result {
    using type = C<Ts...>;
  };

 public:
  template <class... Us>
  using apply = _t<If<sizeof(try_(0)) - 1 || sizeof...(Us), Empty, Result>>;
};

/**
 * Compose two metafunction classes into one by chaining.
 *
 * `MetaApply<MetaCompose<P, Q>, Ts...>` is equivalent to
 * `MetaApply<P, MetaApply<Q, Ts...>>`.
 */
template <class P, class Q>
struct MetaCompose {
  template <class... Ts>
  using apply = MetaApply<P, MetaApply<Q, Ts...>>;
};

/**
 * A metafunction class that always returns its argument unmodified.
 *
 * `MetaApply<MetaIdentity, int>` is equivalent to `int`.
 */
struct MetaIdentity {
  template <class T>
  using apply = T;
};

/**
 * Lifts a class template or an alias template to be a metafunction class.
 *
 * `MetaApply<MetaQuote<C>, Ts...>` is equivalent to `C<Ts...>`.
 */
template <template <class...> class C>
struct MetaQuote {
  template <class... Ts>
  using apply = MetaApply<MetaDefer<C, Ts...>>;
};

/// \cond
// Specialization for TypeList since it doesn't need to go through MetaDefer
template <>
struct MetaQuote<TypeList> {
  template <class... Ts>
  using apply = TypeList<Ts...>;
};
/// \endcond

/**
 * Lifts a trait class template to be a metafunction class.
 *
 * `MetaApply<MetaQuoteTrait<C>, Ts...>` is equivalent to
 * `typename C<Ts...>::type`.
 */
template <template <class...> class C>
using MetaQuoteTrait = MetaCompose<MetaQuote<_t>, MetaQuote<C>>;

/**
 * Partially evaluate the metafunction class `Fn` by binding the arguments
 * `Ts...` to the front of the argument list.
 *
 * `MetaApply<MetaBindFront<Fn, Ts...>, Us...>` is equivalent to
 * `MetaApply<Fn, Ts..., Us...>`.
 */
template <class Fn, class... Ts>
struct MetaBindFront {
  template <class... Us>
  using apply = MetaApply<Fn, Ts..., Us...>;
};

/**
 * Partially evaluate the metafunction class `Fn` by binding the arguments
 * `Ts...` to the back of the argument list.
 *
 * `MetaApply<MetaBindBack<Fn, Ts...>, Us...>` is equivalent to
 * `MetaApply<Fn, Us..., Ts...>`.
 */
template <class Fn, class... Ts>
struct MetaBindBack {
  template <class... Us>
  using apply = MetaApply<Fn, Us..., Ts...>;
};

/**
 * Given a metafunction class `Fn` that expects a single `TypeList` argument,
 * turn it into a metafunction class that takes `N` arguments, wraps them in
 * a `TypeList`, and calls `Fn` with it.
 *
 * `MetaApply<MetaCurry<Fn>, Ts...>` is equivalent to
 * `MetaApply<Fn, TypeList<Ts...>>`.
 */
template <class Fn>
using MetaCurry = MetaCompose<Fn, MetaQuote<TypeList>>;

/**
 * Given a metafunction class `Fn` that expects `N` arguments,
 * turn it into a metafunction class that takes a single `TypeList` arguments
 * and calls `Fn` with the types in the `TypeList`.
 *
 * `MetaApply<MetaUncurry<Fn>, TypeList<Ts...>>` is equivalent to
 * `MetaApply<Fn, Ts...>`.
 */
template <class Fn>
using MetaUncurry = MetaBindBack<MetaQuote<MetaApply>, Fn>;

/**
 * Given a `TypeList` and some arguments, append those arguments to the end of
 * the `TypeList`.
 *
 * `TypePushBack<TypeList<Ts...>, Us...>` is equivalent to
 * `TypeList<Ts..., Us...>`.
 */
template <class List, class... Ts>
using TypePushBack = MetaApply<List, MetaBindBack<MetaQuote<TypeList>, Ts...>>;

/**
 * Given a `TypeList` and some arguments, prepend those arguments to the start
 * of the `TypeList`.
 *
 * `TypePushFront<TypeList<Ts...>, Us...>` is equivalent to
 * `TypeList<Us..., Ts...>`.
 */
template <class List, class... Ts>
using TypePushFront =
    MetaApply<List, MetaBindFront<MetaQuote<TypeList>, Ts...>>;

/**
 * Given a metafunction class `Fn` and a `TypeList`, call `Fn` with the types
 * in the `TypeList`.
 */
template <class Fn, class List>
using MetaUnpack = MetaApply<List, Fn>;

/// \cond
namespace impl {
template <class Fn>
struct TypeTransform_ {
  template <class... Ts>
  using apply = TypeList<MetaApply<Fn, Ts>...>;
};
} // namespace impl
/// \endcond

/**
 * Transform all the elements in a `TypeList` with the metafunction class `Fn`.
 *
 * `TypeTransform<TypeList<Ts..>, Fn>` is equivalent to
 * `TypeList<MetaApply<Fn, Ts>...>`.
 */
template <class List, class Fn>
using TypeTransform = MetaApply<List, impl::TypeTransform_<Fn>>;

/**
 * Given a binary metafunction class, convert it to another binary metafunction
 * class with the argument order reversed.
 */
template <class Fn>
struct MetaFlip {
  template <class A, class B>
  using apply = MetaApply<Fn, B, A>;
};

/// \cond
namespace impl {
template <class Fn>
struct FoldR_ {
  template <class... Ts>
  struct Lambda : MetaIdentity {};
  template <class A, class... Ts>
  struct Lambda<A, Ts...> {
    template <class State>
    using apply = MetaApply<Fn, A, MetaApply<Lambda<Ts...>, State>>;
  };
  template <class A, class B, class C, class D, class... Ts>
  struct Lambda<A, B, C, D, Ts...> { // manually unroll 4 elements
    template <class State>
    using apply = MetaApply<
        Fn,
        A,
        MetaApply<
            Fn,
            B,
            MetaApply<
                Fn,
                C,
                MetaApply<Fn, D, MetaApply<Lambda<Ts...>, State>>>>>;
  };
  template <class... Ts>
  using apply = Lambda<Ts...>;
};
} // namespace impl
/// \endcond

/**
 * Given a `TypeList`, an initial state, and a binary function, reduce the
 * `TypeList` by applying the function to each element and the current state,
 * producing a new state to be used with the next element. This is a "right"
 * fold in functional parlance.
 *
 * `TypeFold<TypeList<A, B, C>, X, Fn>` is equivalent to
 * `MetaApply<Fn, A, MetaApply<Fn, B, MetaApply<Fn, C, X>>>`.
 */
template <class List, class State, class Fn>
using TypeFold = MetaApply<MetaApply<List, impl::FoldR_<Fn>>, State>;

/// \cond
namespace impl {
template <class Fn>
struct FoldL_ {
  template <class... Ts>
  struct Lambda : MetaIdentity {};
  template <class A, class... Ts>
  struct Lambda<A, Ts...> {
    template <class State>
    using apply = MetaApply<Lambda<Ts...>, MetaApply<Fn, State, A>>;
  };
  template <class A, class B, class C, class D, class... Ts>
  struct Lambda<A, B, C, D, Ts...> { // manually unroll 4 elements
    template <class State>
    using apply = MetaApply<
        Lambda<Ts...>,
        MetaApply<
            Fn,
            MetaApply<Fn, MetaApply<Fn, MetaApply<Fn, State, A>, B>, C>,
            D>>;
  };
  template <class... Ts>
  using apply = Lambda<Ts...>;
};
} // namespace impl
/// \endcond

/**
 * Given a `TypeList`, an initial state, and a binary function, reduce the
 * `TypeList` by applying the function to each element and the current state,
 * producing a new state to be used with the next element. This is a "left"
 * fold, in functional parlance.
 *
 * `TypeReverseFold<TypeList<A, B, C>, X, Fn>` is equivalent to
 * `MetaApply<Fn, MetaApply<Fn, MetaApply<Fn, X, C>, B, A>`.
 */
template <class List, class State, class Fn>
using TypeReverseFold = MetaApply<MetaApply<List, impl::FoldL_<Fn>>, State>;

namespace impl {
template <class List>
struct Inherit_;
template <class... Ts>
struct Inherit_<TypeList<Ts...>> : Ts... {
  using type = Inherit_;
};
} // namespace impl

/**
 * Given a `TypeList`, create a type that inherits from all the types in the
 * list.
 *
 * Requires: all of the types in the list are non-final class types, and the
 * types are all unique.
 */
template <class List>
using Inherit = impl::Inherit_<List>;

/// \cond
namespace impl {
// Avoid instantiating std::is_base_of when we have an intrinsic.
#if defined(__GNUC__) || defined(_MSC_VER)
template <class T, class... Set>
using In_ = Bool<__is_base_of(Type<T>, Inherit<TypeList<Type<Set>...>>)>;
#else
template <class T, class... Set>
using In_ = std::is_base_of<Type<T>, Inherit<TypeList<Type<Set>...>>>;
#endif

template <class T>
struct InsertFront_ {
  template <class... Set>
  using apply =
      If<In_<T, Set...>::value, TypeList<Set...>, TypeList<T, Set...>>;
};

struct Unique_ {
  template <class T, class List>
  using apply = MetaApply<List, impl::InsertFront_<T>>;
};
} // namespace impl
/// \endcond

/**
 * Given a `TypeList`, produce a new list of types removing duplicates, keeping
 * the first seen element.
 *
 * `TypeUnique<TypeList<int, short, int>>` is equivalent to
 * `TypeList<int, short>`.
 *
 * \note This algorithm is O(N^2).
 */
template <class List>
using TypeUnique = TypeFold<List, TypeList<>, impl::Unique_>;

/**
 * Given a `TypeList`, produce a new list of types removing duplicates, keeping
 * the last seen element.
 *
 * `TypeUnique<TypeList<int, short, int>>` is equivalent to
 * `TypeList<short, int>`.
 *
 * \note This algorithm is O(N^2).
 */
template <class List>
using TypeReverseUnique =
    TypeReverseFold<List, TypeList<>, MetaFlip<impl::Unique_>>;

/// \cond
namespace impl {
template <class T>
struct AsTypeList_ {};
template <template <class...> class T, class... Ts>
struct AsTypeList_<T<Ts...>> {
  using type = TypeList<Ts...>;
};
template <class T, T... Is>
struct AsTypeList_<folly::integer_sequence<T, Is...>> {
  using type = TypeList<std::integral_constant<T, Is>...>;
};
} // namespace impl
/// \endcond

/**
 * Convert a type to a list of types. Given a type `T`:
 * - If `T` is of the form `C<Ts...>`, where `C` is a class template and
 *   `Ts...` is a list of types, the result is `TypeList<Ts...>`.
 * - Else, if `T` is of the form `std::integer_sequence<T, Is...>`, then
 *   the result is `TypeList<std::integral_constant<T, Is>...>`.
 * - Otherwise, `asTypeList<T>` is ill-formed.
 */
template <class T>
using AsTypeList = _t<impl::AsTypeList_<T>>;

/// \cond
namespace impl {
// TODO For a list of N lists, this algorithm is O(N). It does no unrolling.
struct Join_ {
  template <class Fn>
  struct Lambda {
    template <class... Ts>
    using apply = MetaBindBack<Fn, Ts...>;
  };
  template <class List, class Fn>
  using apply = MetaApply<List, Lambda<Fn>>;
};
} // namespace impl
/// \endcond

/**
 * Given a `TypeList` of `TypeList`s, flatten the lists into a single list.
 *
 * `TypeJoin<TypeList<TypeList<As...>, TypeList<Bs...>>>` is equivalent to
 * `TypeList<As..., Bs...>`
 */
template <class List>
using TypeJoin = MetaApply<TypeFold<List, MetaQuote<TypeList>, impl::Join_>>;

/**
 * Given several `TypeList`s, flatten the lists into a single list.
 *
 * \note This is just the curried form of `TypeJoin`. (See `MetaCurry`.)
 *
 * `TypeConcat<TypeList<As...>, TypeList<Bs...>>` is equivalent to
 * `TypeList<As..., Bs...>`
 */
template <class... Ts>
using TypeConcat = TypeJoin<TypeList<Ts...>>;
} // namespace detail
} // namespace folly
