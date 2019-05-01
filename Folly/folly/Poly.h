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

// TODO: [x] "cast" from Poly<C&> to Poly<C&&>
// TODO: [ ] copy/move from Poly<C&>/Poly<C&&> to Poly<C>
// TODO: [ ] copy-on-write?
// TODO: [ ] down- and cross-casting? (Possible?)
// TODO: [ ] shared ownership? (Dubious.)
// TODO: [ ] can games be played with making the VTable a member of a struct
//           with strange alignment such that the address of the VTable can
//           be used to tell whether the object is stored in-situ or not?

#pragma once

#if defined(__GNUC__) && !defined(__clang__) && __GNUC__ < 5
#error Folly.Poly requires gcc-5 or greater
#endif

#include <cassert>
#include <new>
#include <type_traits>
#include <typeinfo>
#include <utility>

#include <folly/CPortability.h>
#include <folly/CppAttributes.h>
#include <folly/Traits.h>
#include <folly/detail/TypeList.h>
#include <folly/lang/Assume.h>

#if !defined(__cpp_inline_variables)
#define FOLLY_INLINE_CONSTEXPR constexpr
#else
#define FOLLY_INLINE_CONSTEXPR inline constexpr
#endif

#include <folly/PolyException.h>
#include <folly/detail/PolyDetail.h>

namespace folly {
template <class I>
struct Poly;

/**
 * Within the definition of interface `I`, `PolySelf<Base>` is an alias for
 * the instance of `Poly` that is currently being instantiated. It is
 * one of: `Poly<J>`, `Poly<J&&>`, `Poly<J&>`, or `Poly<J const&>`; where
 * `J` is either `I` or some interface that extends `I`.
 *
 * It can be used within interface definitions to declare members that accept
 * other `Poly` objects of the same type as `*this`.
 *
 * The first parameter may optionally be cv- and/or reference-qualified, in
 * which case, the qualification is applies to the type of the interface in the
 * resulting `Poly<>` instance. The second template parameter controls whether
 * or not the interface is decayed before the cv-ref qualifiers of the first
 * argument are applied. For example, given the following:
 *
 *     struct Foo {
 *       template <class Base>
 *       struct Interface : Base {
 *         using A = PolySelf<Base>;
 *         using B = PolySelf<Base &>;
 *         using C = PolySelf<Base const &>;
 *         using X = PolySelf<Base, PolyDecay>;
 *         using Y = PolySelf<Base &, PolyDecay>;
 *         using Z = PolySelf<Base const &, PolyDecay>;
 *       };
 *       // ...
 *     };
 *     struct Bar : PolyExtends<Foo> {
 *       // ...
 *     };
 *
 * Then for `Poly<Bar>`, the typedefs are aliases for the following types:
 * - `A` is `Poly<Bar>`
 * - `B` is `Poly<Bar &>`
 * - `C` is `Poly<Bar const &>`
 * - `X` is `Poly<Bar>`
 * - `Y` is `Poly<Bar &>`
 * - `Z` is `Poly<Bar const &>`
 *
 * And for `Poly<Bar &>`, the typedefs are aliases for the following types:
 * - `A` is `Poly<Bar &>`
 * - `B` is `Poly<Bar &>`
 * - `C` is `Poly<Bar &>`
 * - `X` is `Poly<Bar>`
 * - `Y` is `Poly<Bar &>`
 * - `Z` is `Poly<Bar const &>`
 */
template <
    class Node,
    class Tfx = detail::MetaIdentity,
    class Access = detail::PolyAccess>
using PolySelf = decltype(Access::template self_<Node, Tfx>());

/**
 * When used in conjunction with `PolySelf`, controls how to construct `Poly`
 * types related to the one currently being instantiated.
 *
 * \sa PolySelf
 */
using PolyDecay = detail::MetaQuote<std::decay_t>;

#if !defined(__cpp_template_auto)

/**
 * Use `FOLLY_POLY_MEMBERS(MEMS...)` on pre-C++17 compilers to specify a
 * comma-separated list of member function bindings.
 *
 * For example:
 *
 *     struct IFooBar {
 *       template <class Base>
 *       struct Interface : Base {
 *         int foo() const { return folly::poly_call<0>(*this); }
 *         void bar() { folly::poly_call<1>(*this); }
 *       };
 *       template <class T>
 *       using Members = FOLLY_POLY_MEMBERS(&T::foo, &T::bar);
 *     };
 */
#define FOLLY_POLY_MEMBERS(...)                     \
  typename decltype(::folly::detail::deduceMembers( \
      __VA_ARGS__))::template Members<__VA_ARGS__>

/**
 * Use `FOLLY_POLY_MEMBER(SIG, MEM)` on pre-C++17 compilers to specify a member
 * function binding that needs to be disambiguated because of overloads. `SIG`
 * should the (possibly const-qualified) signature of the `MEM` member function
 * pointer.
 *
 * For example:
 *
 *     struct IFoo {
 *       template <class Base> struct Interface : Base {
 *         int foo() const { return folly::poly_call<0>(*this); }
 *       };
 *       template <class T> using Members = FOLLY_POLY_MEMBERS(
 *         // This works even if T::foo is overloaded:
 *         FOLLY_POLY_MEMBER(int()const, &T::foo)
 *       );
 *     };
 */
#define FOLLY_POLY_MEMBER(SIG, MEM) \
  ::folly::detail::MemberDef<       \
      ::folly::detail::Member<decltype(::folly::sig<SIG>(MEM)), MEM>>::value

/**
 * A list of member function bindings.
 */
template <class... Ts>
using PolyMembers = detail::TypeList<Ts...>;

#else
#define FOLLY_POLY_MEMBER(SIG, MEM) ::folly::sig<SIG>(MEM)
#define FOLLY_POLY_MEMBERS(...) ::folly::PolyMembers<__VA_ARGS__>

template <auto... Ps>
struct PolyMembers {};

#endif

/**
 * Used in the definition of a `Poly` interface to say that the current
 * interface is an extension of a set of zero or more interfaces.
 *
 * Example:
 *
 *   struct IFoo {
 *     template <class Base> struct Interface : Base {
 *       void foo() { folly::poly_call<0>(*this); }
 *     };
 *     template <class T> using Members = FOLLY_POLY_MEMBERS(&T::foo);
 *   }
 *   struct IBar : PolyExtends<IFoo> {
 *     template <class Base> struct Interface : Base {
 *       void bar(int i) { folly::poly_call<0>(*this, i); }
 *     };
 *     template <class T> using Members = FOLLY_POLY_MEMBERS(&T::bar);
 *   }
 */
template <class... I>
struct PolyExtends : virtual I... {
  using Subsumptions = detail::TypeList<I...>;

  template <class Base>
  struct Interface : Base {
    Interface() = default;
    using Base::Base;
  };

  template <class...>
  using Members = PolyMembers<>;
};

////////////////////////////////////////////////////////////////////////////////
/**
 * Call the N-th member of the currently-being-defined interface. When the
 * first parameter is an object of type `PolySelf<Base>` (as opposed to `*this`)
 * you must explicitly specify which interface through which to dispatch.
 * For instance:
 *
 *     struct IAddable {
 *       template <class Base>
 *       struct Interface : Base {
 *         friend PolySelf<Base, Decay>
 *         operator+(PolySelf<Base> const& a, PolySelf<Base> const& b) {
 *           return folly::poly_call<0, IAddable>(a, b);
 *         }
 *       };
 *       template <class T>
 *       static auto plus_(T const& a, T const& b) -> decltype(a + b) {
 *         return a + b;
 *       }
 *       template <class T>
 *       using Members = FOLLY_POLY_MEMBERS(&plus_<std::decay_t<T>>);
 *     };
 *
 * \sa PolySelf
 */
template <std::size_t N, typename This, typename... As>
auto poly_call(This&& _this, As&&... as)
    -> decltype(detail::PolyAccess::call<N>(
        static_cast<This&&>(_this),
        static_cast<As&&>(as)...)) {
  return detail::PolyAccess::call<N>(
      static_cast<This&&>(_this), static_cast<As&&>(as)...);
}

/// \overload
template <std::size_t N, class I, class Tail, typename... As>
decltype(auto) poly_call(detail::PolyNode<I, Tail>&& _this, As&&... as) {
  using This = detail::InterfaceOf<I, detail::PolyNode<I, Tail>>;
  return detail::PolyAccess::call<N>(
      static_cast<This&&>(_this), static_cast<As&&>(as)...);
}

/// \overload
template <std::size_t N, class I, class Tail, typename... As>
decltype(auto) poly_call(detail::PolyNode<I, Tail>& _this, As&&... as) {
  using This = detail::InterfaceOf<I, detail::PolyNode<I, Tail>>;
  return detail::PolyAccess::call<N>(
      static_cast<This&>(_this), static_cast<As&&>(as)...);
}

/// \overload
template <std::size_t N, class I, class Tail, typename... As>
decltype(auto) poly_call(detail::PolyNode<I, Tail> const& _this, As&&... as) {
  using This = detail::InterfaceOf<I, detail::PolyNode<I, Tail>>;
  return detail::PolyAccess::call<N>(
      static_cast<This const&>(_this), static_cast<As&&>(as)...);
}

/// \overload
template <
    std::size_t N,
    class I,
    class Poly,
    typename... As,
    std::enable_if_t<detail::IsPoly<Poly>::value, int> = 0>
auto poly_call(Poly&& _this, As&&... as) -> decltype(poly_call<N, I>(
    static_cast<Poly&&>(_this).get(),
    static_cast<As&&>(as)...)) {
  return poly_call<N, I>(
      static_cast<Poly&&>(_this).get(), static_cast<As&&>(as)...);
}

/// \cond
/// \overload
template <std::size_t N, class I, typename... As>
[[noreturn]] detail::Bottom poly_call(detail::ArchetypeBase const&, As&&...) {
  assume_unreachable();
}
/// \endcond

////////////////////////////////////////////////////////////////////////////////
/**
 * Try to cast the `Poly` object to the requested type. If the `Poly` stores an
 * object of that type, return a reference to the object; otherwise, throw an
 * exception.
 * \tparam T The (unqualified) type to which to cast the `Poly` object.
 * \tparam Poly The type of the `Poly` object.
 * \param that The `Poly` object to be cast.
 * \return A reference to the `T` object stored in or refered to by `that`.
 * \throw BadPolyAccess if `that` is empty.
 * \throw BadPolyCast if `that` does not store or refer to an object of type
 *        `T`.
 */
template <class T, class I>
detail::AddCvrefOf<T, I>&& poly_cast(detail::PolyRoot<I>&& that) {
  return detail::PolyAccess::cast<T>(std::move(that));
}

/// \overload
template <class T, class I>
detail::AddCvrefOf<T, I>& poly_cast(detail::PolyRoot<I>& that) {
  return detail::PolyAccess::cast<T>(that);
}

/// \overload
template <class T, class I>
detail::AddCvrefOf<T, I> const& poly_cast(detail::PolyRoot<I> const& that) {
  return detail::PolyAccess::cast<T>(that);
}

/// \cond
/// \overload
template <class T, class I>
[[noreturn]] detail::AddCvrefOf<T, I>&& poly_cast(detail::ArchetypeRoot<I>&&) {
  assume_unreachable();
}

/// \overload
template <class T, class I>
[[noreturn]] detail::AddCvrefOf<T, I>& poly_cast(detail::ArchetypeRoot<I>&) {
  assume_unreachable();
}

/// \overload
template <class T, class I>
[[noreturn]] detail::AddCvrefOf<T, I> const& poly_cast(
    detail::ArchetypeRoot<I> const&) {
  assume_unreachable();
}
/// \endcond

/// \overload
template <
    class T,
    class Poly,
    std::enable_if_t<detail::IsPoly<Poly>::value, int> = 0>
constexpr auto poly_cast(Poly&& that)
    -> decltype(poly_cast<T>(std::declval<Poly>().get())) {
  return poly_cast<T>(static_cast<Poly&&>(that).get());
}

////////////////////////////////////////////////////////////////////////////////
/**
 * Returns a reference to the `std::type_info` object corresponding to the
 * object currently stored in `that`. If `that` is empty, returns
 * `typeid(void)`.
 */
template <class I>
std::type_info const& poly_type(detail::PolyRoot<I> const& that) noexcept {
  return detail::PolyAccess::type(that);
}

/// \cond
/// \overload
[[noreturn]] inline std::type_info const& poly_type(
    detail::ArchetypeBase const&) noexcept {
  assume_unreachable();
}
/// \endcond

/// \overload
template <class Poly, std::enable_if_t<detail::IsPoly<Poly>::value, int> = 0>
constexpr auto poly_type(Poly const& that) noexcept
    -> decltype(poly_type(that.get())) {
  return poly_type(that.get());
}

////////////////////////////////////////////////////////////////////////////////
/**
 * Returns `true` if `that` is not currently storing an object; `false`,
 * otherwise.
 */
template <class I>
bool poly_empty(detail::PolyRoot<I> const& that) noexcept {
  return detail::State::eEmpty == detail::PolyAccess::vtable(that)->state_;
}

/// \overload
template <class I>
constexpr bool poly_empty(detail::PolyRoot<I&&> const&) noexcept {
  return false;
}

/// \overload
template <class I>
constexpr bool poly_empty(detail::PolyRoot<I&> const&) noexcept {
  return false;
}

/// \overload
template <class I>
constexpr bool poly_empty(Poly<I&&> const&) noexcept {
  return false;
}

/// \overload
template <class I>
constexpr bool poly_empty(Poly<I&> const&) noexcept {
  return false;
}

/// \cond
[[noreturn]] inline bool poly_empty(detail::ArchetypeBase const&) noexcept {
  assume_unreachable();
}
/// \endcond

////////////////////////////////////////////////////////////////////////////////
/**
 * Given a `Poly<I&>`, return a `Poly<I&&>`. Otherwise, when `I` is not a
 * reference type, returns a `Poly<I>&&` when given a `Poly<I>&`, like
 * `std::move`.
 */
template <
    class I,
    std::enable_if_t<detail::Not<std::is_reference<I>>::value, int> = 0>
constexpr Poly<I>&& poly_move(detail::PolyRoot<I>& that) noexcept {
  return static_cast<Poly<I>&&>(static_cast<Poly<I>&>(that));
}

/// \overload
template <
    class I,
    std::enable_if_t<detail::Not<std::is_const<I>>::value, int> = 0>
Poly<I&&> poly_move(detail::PolyRoot<I&> const& that) noexcept {
  return detail::PolyAccess::move(that);
}

/// \overload
template <class I>
Poly<I const&> poly_move(detail::PolyRoot<I const&> const& that) noexcept {
  return detail::PolyAccess::move(that);
}

/// \cond
/// \overload
[[noreturn]] inline detail::ArchetypeBase poly_move(
    detail::ArchetypeBase const&) noexcept {
  assume_unreachable();
}
/// \endcond

/// \overload
template <class Poly, std::enable_if_t<detail::IsPoly<Poly>::value, int> = 0>
constexpr auto poly_move(Poly& that) noexcept
    -> decltype(poly_move(that.get())) {
  return poly_move(that.get());
}

/// \cond
namespace detail {
/**
 * The implementation for `Poly` for when the interface type is not
 * reference-like qualified, as in `Poly<SemiRegular>`.
 */
template <class I>
struct PolyVal : PolyImpl<I> {
 private:
  friend PolyAccess;

  struct NoneSuch {};
  using Copyable = std::is_copy_constructible<PolyImpl<I>>;
  using PolyOrNonesuch = If<Copyable::value, PolyVal, NoneSuch>;

  using PolyRoot<I>::vptr_;

  PolyRoot<I>& _polyRoot_() noexcept {
    return *this;
  }
  PolyRoot<I> const& _polyRoot_() const noexcept {
    return *this;
  }

  Data* _data_() noexcept {
    return PolyAccess::data(*this);
  }
  Data const* _data_() const noexcept {
    return PolyAccess::data(*this);
  }

 public:
  /**
   * Default constructor.
   * \post `poly_empty(*this) == true`
   */
  PolyVal() = default;
  /**
   * Move constructor.
   * \post `poly_empty(that) == true`
   */
  PolyVal(PolyVal&& that) noexcept;
  /**
   * A copy constructor if `I` is copyable; otherwise, a useless constructor
   * from a private, incomplete type.
   */
  /* implicit */ PolyVal(PolyOrNonesuch const& that);

  ~PolyVal();

  /**
   * Inherit any constructors defined by any of the interfaces.
   */
  using PolyImpl<I>::PolyImpl;

  /**
   * Copy assignment, destroys the object currently held (if any) and makes
   * `*this` equal to `that` by stealing its guts.
   */
  Poly<I>& operator=(PolyVal that) noexcept;

  /**
   * Construct a Poly<I> from a concrete type that satisfies the I concept
   */
  template <class T, std::enable_if_t<ModelsInterface<T, I>::value, int> = 0>
  /* implicit */ PolyVal(T&& t);

  /**
   * Construct a `Poly` from a compatible `Poly`. "Compatible" here means: the
   * other interface extends this one either directly or indirectly.
   */
  template <class I2, std::enable_if_t<ValueCompatible<I, I2>::value, int> = 0>
  /* implicit */ PolyVal(Poly<I2> that);

  /**
   * Assign to this `Poly<I>` from a concrete type that satisfies the `I`
   * concept.
   */
  template <class T, std::enable_if_t<ModelsInterface<T, I>::value, int> = 0>
  Poly<I>& operator=(T&& t);

  /**
   * Assign a compatible `Poly` to `*this`. "Compatible" here means: the
   * other interface extends this one either directly or indirectly.
   */
  template <class I2, std::enable_if_t<ValueCompatible<I, I2>::value, int> = 0>
  Poly<I>& operator=(Poly<I2> that);

  /**
   * Swaps the values of two `Poly` objects.
   */
  void swap(Poly<I>& that) noexcept;
};

////////////////////////////////////////////////////////////////////////////////
/**
 * The implementation of `Poly` for when the interface type is
 * reference-quelified, like `Poly<SemuRegular &>`.
 */
template <class I>
struct PolyRef : private PolyImpl<I> {
 private:
  friend PolyAccess;

  AddCvrefOf<PolyRoot<I>, I>& _polyRoot_() const noexcept;

  Data* _data_() noexcept {
    return PolyAccess::data(*this);
  }
  Data const* _data_() const noexcept {
    return PolyAccess::data(*this);
  }

  static constexpr RefType refType() noexcept;

 protected:
  template <class That, class I2>
  PolyRef(That&& that, Type<I2>);

 public:
  /**
   * Copy constructor
   * \post `&poly_cast<T>(*this) == &poly_cast<T>(that)`, where `T` is the
   *       type of the object held by `that`.
   */
  PolyRef(PolyRef const& that) noexcept;

  /**
   * Copy assignment
   * \post `&poly_cast<T>(*this) == &poly_cast<T>(that)`, where `T` is the
   *       type of the object held by `that`.
   */
  Poly<I>& operator=(PolyRef const& that) noexcept;

  /**
   * Construct a `Poly<I>` from a concrete type that satisfies concept `I`.
   * \post `!poly_empty(*this)`
   */
  template <class T, std::enable_if_t<ModelsInterface<T, I>::value, int> = 0>
  /* implicit */ PolyRef(T&& t) noexcept;

  /**
   * Construct a `Poly<I>` from a compatible `Poly<I2>`.
   */
  template <
      class I2,
      std::enable_if_t<ReferenceCompatible<I, I2, I2&&>::value, int> = 0>
  /* implicit */ PolyRef(Poly<I2>&& that) noexcept(
      std::is_reference<I2>::value);

  template <
      class I2,
      std::enable_if_t<ReferenceCompatible<I, I2, I2&>::value, int> = 0>
  /* implicit */ PolyRef(Poly<I2>& that) noexcept(std::is_reference<I2>::value)
      : PolyRef{that, Type<I2>{}} {}

  template <
      class I2,
      std::enable_if_t<ReferenceCompatible<I, I2, I2 const&>::value, int> = 0>
  /* implicit */ PolyRef(Poly<I2> const& that) noexcept(
      std::is_reference<I2>::value)
      : PolyRef{that, Type<I2>{}} {}

  /**
   * Assign to a `Poly<I>` from a concrete type that satisfies concept `I`.
   * \post `!poly_empty(*this)`
   */
  template <class T, std::enable_if_t<ModelsInterface<T, I>::value, int> = 0>
  Poly<I>& operator=(T&& t) noexcept;

  /**
   * Assign to `*this` from another compatible `Poly`.
   */
  template <
      class I2,
      std::enable_if_t<ReferenceCompatible<I, I2, I2&&>::value, int> = 0>
  Poly<I>& operator=(Poly<I2>&& that) noexcept(std::is_reference<I2>::value);

  /**
   * \overload
   */
  template <
      class I2,
      std::enable_if_t<ReferenceCompatible<I, I2, I2&>::value, int> = 0>
  Poly<I>& operator=(Poly<I2>& that) noexcept(std::is_reference<I2>::value);

  /**
   * \overload
   */
  template <
      class I2,
      std::enable_if_t<ReferenceCompatible<I, I2, I2 const&>::value, int> = 0>
  Poly<I>& operator=(Poly<I2> const& that) noexcept(
      std::is_reference<I2>::value);

  /**
   * Swap which object this `Poly` references ("shallow" swap).
   */
  void swap(Poly<I>& that) noexcept;

  /**
   * Get a reference to the interface, with correct `const`-ness applied.
   */
  AddCvrefOf<PolyImpl<I>, I>& get() const noexcept;

  /**
   * Get a reference to the interface, with correct `const`-ness applied.
   */
  AddCvrefOf<PolyImpl<I>, I>& operator*() const noexcept {
    return get();
  }

  /**
   * Get a pointer to the interface, with correct `const`-ness applied.
   */
  auto operator-> () const noexcept {
    return &get();
  }
};

template <class I>
using PolyValOrRef = If<std::is_reference<I>::value, PolyRef<I>, PolyVal<I>>;
} // namespace detail
/// \endcond

/**
 * `Poly` is a class template that makes it relatively easy to define a
 * type-erasing polymorphic object wrapper.
 *
 * \par Type-erasure
 *
 * \par
 * `std::function` is one example of a type-erasing polymorphic object wrapper;
 * `folly::exception_wrapper` is another. Type-erasure is often used as an
 * alternative to dynamic polymorphism via inheritance-based virtual dispatch.
 * The distinguishing characteristic of type-erasing wrappers are:
 * \li **Duck typing:** Types do not need to inherit from an abstract base
 *     class in order to be assignable to a type-erasing wrapper; they merely
 *     need to satisfy a particular interface.
 * \li **Value semantics:** Type-erasing wrappers are objects that can be
 *     passed around _by value_. This is in contrast to abstract base classes
 *     which must be passed by reference or by pointer or else suffer from
 *     _slicing_, which causes them to lose their polymorphic behaviors.
 *     Reference semantics make it difficult to reason locally about code.
 * \li **Automatic memory management:** When dealing with inheritance-based
 *     dynamic polymorphism, it is often necessary to allocate and manage
 *     objects on the heap. This leads to a proliferation of `shared_ptr`s and
 *     `unique_ptr`s in APIs, complicating their point-of-use. APIs that take
 *     type-erasing wrappers, on the other hand, can often store small objects
 *     in-situ, with no dynamic allocation. The memory management, if any, is
 *     handled for you, and leads to cleaner APIs: consumers of your API don't
 *     need to pass `shared_ptr<AbstractBase>`; they can simply pass any object
 *     that satisfies the interface you require. (`std::function` is a
 *     particularly compelling example of this benefit. Far worse would be an
 *     inheritance-based callable solution like
 *     `shared_ptr<ICallable<void(int)>>`. )
 *
 * \par Example: Defining a type-erasing function wrapper with `folly::Poly`
 *
 * \par
 * Defining a polymorphic wrapper with `Poly` is a matter of defining two
 * things:
 * \li An *interface*, consisting of public member functions, and
 * \li A *mapping* from a concrete type to a set of member function bindings.
 *
 * Below is a (heavily commented) example of a simple implementation of a
 * `std::function`-like polymorphic wrapper. Its interface has only a simgle
 * member function: `operator()`
 *
 *     // An interface for a callable object of a particular signature, Fun
 *     // (most interfaces don't need to be templates, FWIW).
 *     template <class Fun>
 *     struct IFunction;
 *
 *     template <class R, class... As>
 *     struct IFunction<R(As...)> {
 *       // An interface is defined as a nested class template called
 *       // Interface that takes a single template parameter, Base, from
 *       // which it inherits.
 *       template <class Base>
 *       struct Interface : Base {
 *         // The Interface has public member functions. These become the
 *         // public interface of the resulting Poly instantiation.
 *         // (Implementation note: Poly<IFunction<Sig>> will publicly
 *         // inherit from this struct, which is what gives it the right
 *         // member functions.)
 *         R operator()(As... as) const {
 *           // The definition of each member function in your interface will
 *           // always consist of a single line dispatching to
 *           // folly::poly_call<N>. The "N" corresponds to the N-th member
 *           // function in the list of member function bindings, Members,
 *           // defined below. The first argument will always be *this, and the
 *           // rest of the arguments should simply forward (if necessary) the
 *           // member function's arguments.
 *           return static_cast<R>(
 *               folly::poly_call<0>(*this, std::forward<As>(as)...));
 *         }
 *       };
 *
 *       // The "Members" alias template is a comma-separated list of bound
 *       // member functions for a given concrete type "T". The
 *       // "FOLLY_POLY_MEMBERS" macro accepts a comma-separated list, and the
 *       // (optional) "FOLLY_POLY_MEMBER" macro lets you disambiguate overloads
 *       // by explicitly specifying the function signature the target member
 *       // function should have. In this case, we require "T" to have a
 *       // function call operator with the signature `R(As...) const`.
 *       //
 *       // If you are using a C++17-compatible compiler, you can do away with
 *       // the macros and write this as:
 *       //
 *       //   template <class T>
 *       //   using Members = folly::PolyMembers<
 *       //       folly::sig<R(As...) const>(&T::operator())>;
 *       //
 *       // And since `folly::sig` is only needed for disambiguation in case of
 *       // overloads, if you are not concerned about objects with overloaded
 *       // function call operators, it could be further simplified to:
 *       //
 *       //   template <class T>
 *       //   using Members = folly::PolyMembers<&T::operator()>;
 *       //
 *       template <class T>
 *       using Members = FOLLY_POLY_MEMBERS(
 *           FOLLY_POLY_MEMBER(R(As...) const, &T::operator()));
 *     };
 *
 *     // Now that we have defined the interface, we can pass it to Poly to
 *     // create our type-erasing wrapper:
 *     template <class Fun>
 *     using Function = Poly<IFunction<Fun>>;
 *
 * \par
 * Given the above definition of `Function`, users can now initialize instances
 * of (say) `Function<int(int, int)>` with function objects like
 * `std::plus<int>` and `std::multiplies<int>`, as below:
 *
 *     Function<int(int, int)> fun = std::plus<int>{};
 *     assert(5 == fun(2, 3));
 *     fun = std::multiplies<int>{};
 *     assert(6 = fun(2, 3));
 *
 * \par Defining an interface with C++17
 *
 * \par
 * With C++17, defining an interface to be used with `Poly` is fairly
 * straightforward. As in the `Function` example above, there is a struct with
 * a nested `Interface` class template and a nested `Members` alias template.
 * No macros are needed with C++17.
 * \par
 * Imagine we were defining something like a Java-style iterator. If we are
 * using a C++17 compiler, our interface would look something like this:
 *
 *     template <class Value>
 *     struct IJavaIterator {
 *       template <class Base>
 *       struct Interface : Base {
 *         bool Done() const { return folly::poly_call<0>(*this); }
 *         Value Current() const { return folly::poly_call<1>(*this); }
 *         void Next() { folly::poly_call<2>(*this); }
 *       };
 *       // NOTE: This works in C++17 only:
 *       template <class T>
 *       using Members = folly::PolyMembers<&T::Done, &T::Current, &T::Next>;
 *     };
 *
 *     template <class Value>
 *     using JavaIterator = Poly<IJavaIterator>;
 *
 * \par
 * Given the above definition, `JavaIterator<int>` can be used to hold instances
 * of any type that has `Done`, `Current`, and `Next` member functions with the
 * correct (or compatible) signatures.
 *
 * \par
 * The presence of overloaded member functions complicates this picture. Often,
 * property members are faked in C++ with `const` and non-`const` member
 * function overloads, like in the interface specified below:
 *
 *     struct IIntProperty {
 *       template <class Base>
 *       struct Interface : Base {
 *         int Value() const { return folly::poly_call<0>(*this); }
 *         void Value(int i) { folly::poly_call<1>(*this, i); }
 *       };
 *       // NOTE: This works in C++17 only:
 *       template <class T>
 *       using Members = folly::PolyMembers<
 *         folly::sig<int() const>(&T::Value),
 *         folly::sig<void(int)>(&T::Value)>;
 *     };
 *
 *     using IntProperty = Poly<IIntProperty>;
 *
 * \par
 * Now, any object that has `Value` members of compatible signatures can be
 * assigned to instances of `IntProperty` object. Note how `folly::sig` is used
 * to disambiguate the overloads of `&T::Value`.
 *
 * \par Defining an interface with C++14
 *
 * \par
 * In C++14, the nice syntax above doesn't work, so we have to resort to macros.
 * The two examples above would look like this:
 *
 *     template <class Value>
 *     struct IJavaIterator {
 *       template <class Base>
 *       struct Interface : Base {
 *         bool Done() const { return folly::poly_call<0>(*this); }
 *         Value Current() const { return folly::poly_call<1>(*this); }
 *         void Next() { folly::poly_call<2>(*this); }
 *       };
 *       // NOTE: This works in C++14 and C++17:
 *       template <class T>
 *       using Members = FOLLY_POLY_MEMBERS(&T::Done, &T::Current, &T::Next);
 *     };
 *
 *     template <class Value>
 *     using JavaIterator = Poly<IJavaIterator>;
 *
 * \par
 * and
 *
 *     struct IIntProperty {
 *       template <class Base>
 *       struct Interface : Base {
 *         int Value() const { return folly::poly_call<0>(*this); }
 *         void Value(int i) { return folly::poly_call<1>(*this, i); }
 *       };
 *       // NOTE: This works in C++14 and C++17:
 *       template <class T>
 *       using Members = FOLLY_POLY_MEMBERS(
 *         FOLLY_POLY_MEMBER(int() const, &T::Value),
 *         FOLLY_POLY_MEMBER(void(int), &T::Value));
 *     };
 *
 *     using IntProperty = Poly<IIntProperty>;
 *
 * \par Extending interfaces
 *
 * \par
 * One typical advantage of inheritance-based solutions to runtime polymorphism
 * is that one polymorphic interface could extend another through inheritance.
 * The same can be accomplished with type-erasing polymorphic wrappers. In
 * the `Poly` library, you can use `folly::PolyExtends` to say that one
 * interface extends another.
 *
 *     struct IFoo {
 *       template <class Base>
 *       struct Interface : Base {
 *         void Foo() const { return folly::poly_call<0>(*this); }
 *       };
 *       template <class T>
 *       using Members = FOLLY_POLY_MEMBERS(&T::Foo);
 *     };
 *
 *     // The IFooBar interface extends the IFoo interface
 *     struct IFooBar : PolyExtends<IFoo> {
 *       template <class Base>
 *       struct Interface : Base {
 *         void Bar() const { return folly::poly_call<0>(*this); }
 *       };
 *       template <class T>
 *       using Members = FOLLY_POLY_MEMBERS(&T::Bar);
 *     };
 *
 *     using FooBar = Poly<IFooBar>;
 *
 * \par
 * Given the above defintion, instances of type `FooBar` have both `Foo()` and
 * `Bar()` member functions.
 *
 * \par
 * The sensible conversions exist between a wrapped derived type and a wrapped
 * base type. For instance, assuming `IDerived` extends `IBase` with
 * `PolyExtends`:
 *
 *     Poly<IDerived> derived = ...;
 *     Poly<IBase> base = derived; // This conversion is OK.
 *
 * \par
 * As you would expect, there is no conversion in the other direction, and at
 * present there is no `Poly` equivalent to `dynamic_cast`.
 *
 * \par Type-erasing polymorphic reference wrappers
 *
 * \par
 * Sometimes you don't need to own a copy of an object; a reference will do. For
 * that you can use `Poly` to capture a _reference_ to an object satisfying an
 * interface rather than the whole object itself. The syntax is intuitive.
 *
 *     int i = 42;
 *     // Capture a mutable reference to an object of any IRegular type:
 *     Poly<IRegular &> intRef = i;
 *     assert(42 == folly::poly_cast<int>(intRef));
 *     // Assert that we captured the address of "i":
 *     assert(&i == &folly::poly_cast<int>(intRef));
 *
 * \par
 * A reference-like `Poly` has a different interface than a value-like `Poly`.
 * Rather than calling member functions with the `obj.fun()` syntax, you would
 * use the `obj->fun()` syntax. This is for the sake of `const`-correctness.
 * For example, consider the code below:
 *
 *     struct IFoo {
 *       template <class Base>
 *       struct Interface {
 *         void Foo() { folly::poly_call<0>(*this); }
 *       };
 *       template <class T>
 *       using Members = folly::PolyMembers<&T::Foo>;
 *     };
 *
 *     struct SomeFoo {
 *       void Foo() { std::printf("SomeFoo::Foo\n"); }
 *     };
 *
 *     SomeFoo foo;
 *     Poly<IFoo &> const anyFoo = foo;
 *     anyFoo->Foo(); // prints "SomeFoo::Foo"
 *
 * \par
 * Notice in the above code that the `Foo` member function is non-`const`.
 * Notice also that the `anyFoo` object is `const`. However, since it has
 * captured a non-`const` reference to the `foo` object, it should still be
 * possible to dispatch to the non-`const` `Foo` member function. When
 * instantiated with a reference type, `Poly` has an overloaded `operator->`
 * member that returns a pointer to the `IFoo` interface with the correct
 * `const`-ness, which makes this work.
 *
 * \par
 * The same mechanism also prevents users from calling non-`const` member
 * functions on `Poly` objects that have captured `const` references, which
 * would violate `const`-correctness.
 *
 * \par
 * Sensible conversions exist between non-reference and reference `Poly`s. For
 * instance:
 *
 *     Poly<IRegular> value = 42;
 *     Poly<IRegular &> mutable_ref = value;
 *     Poly<IRegular const &> const_ref = mutable_ref;
 *
 *     assert(&poly_cast<int>(value) == &poly_cast<int>(mutable_ref));
 *     assert(&poly_cast<int>(value) == &poly_cast<int>(const_ref));
 *
 * \par Non-member functions (C++17)
 *
 * \par
 * If you wanted to write the interface `ILogicallyNegatable`, which captures
 * all types that can be negated with unary `operator!`, you could do it
 * as we've shown above, by binding `&T::operator!` in the nested `Members`
 * alias template, but that has the problem that it won't work for types that
 * have defined unary `operator!` as a free function. To handle this case,
 * the `Poly` library lets you use a free function instead of a member function
 * when creating a binding.
 *
 * \par
 * With C++17 you may use a lambda to create a binding, as shown in the example
 * below:
 *
 *     struct ILogicallyNegatable {
 *       template <class Base>
 *       struct Interface : Base {
 *         bool operator!() const { return folly::poly_call<0>(*this); }
 *       };
 *       template <class T>
 *       using Members = folly::PolyMembers<
 *         +[](T const& t) -> decltype(!t) { return !t; }>;
 *     };
 *
 * \par
 * This requires some explanation. The unary `operator+` in front of the lambda
 * is necessary! It causes the lambda to decay to a C-style function pointer,
 * which is one of the types that `folly::PolyMembers` accepts. The `decltype`
 * in the lambda return type is also necessary. Through the magic of SFINAE, it
 * will cause `Poly<ILogicallyNegatable>` to reject any types that don't support
 * unary `operator!`.
 *
 * \par
 * If you are using a free function to create a binding, the first parameter is
 * implicitly the `this` parameter. It will receive the type-erased object.
 *
 * \par Non-member functions (C++14)
 *
 * \par
 * If you are using a C++14 compiler, the defintion of `ILogicallyNegatable`
 * above will fail because lambdas are not `constexpr`. We can get the same
 * effect by writing the lambda as a named free function, as show below:
 *
 *     struct ILogicallyNegatable {
 *       template <class Base>
 *       struct Interface : Base {
 *         bool operator!() const { return folly::poly_call<0>(*this); }
 *       };
 *
 *       template <class T>
 *       static auto negate(T const& t) -> decltype(!t) { return !t; }
 *
 *       template <class T>
 *       using Members = FOLLY_POLY_MEMBERS(&negate<T>);
 *     };
 *
 * \par
 * As with the example that uses the lambda in the preceding section, the first
 * parameter is implicitly the `this` parameter. It will receive the type-erased
 * object.
 *
 * \par Multi-dispatch
 *
 * \par
 * What if you want to create an `IAddable` interface for things that can be
 * added? Adding requires _two_ objects, both of which are type-erased. This
 * interface requires dispatching on both objects, doing the addition only
 * if the types are the same. For this we make use of the `PolySelf` template
 * alias to define an interface that takes more than one object of the the
 * erased type.
 *
 *     struct IAddable {
 *       template <class Base>
 *       struct Interface : Base {
 *         friend PolySelf<Base, Decay>
 *         operator+(PolySelf<Base> const& a, PolySelf<Base> const& b) {
 *           return folly::poly_call<0, IAddable>(a, b);
 *         }
 *       };
 *
 *       template <class T>
 *       using Members = folly::PolyMembers<
 *         +[](T const& a, T const& b) -> decltype(a + b) { return a + b; }>;
 *     };
 *
 * \par
 * Given the above defintion of `IAddable` we would be able to do the following:
 *
 *     Poly<IAddable> a = 2, b = 3;
 *     Poly<IAddable> c = a + b;
 *     assert(poly_cast<int>(c) == 5);
 *
 * \par
 * If `a` and `b` stored objects of different types, a `BadPolyCast` exception
 * would be thrown.
 *
 * \par Move-only types
 *
 * \par
 * If you want to store move-only types, then your interface should extend the
 * `IMoveOnly` interface.
 *
 * \par Implementation notes
 * \par
 * `Poly` will store "small" objects in an internal buffer, avoiding the cost of
 * of dynamic allocations. At present, this size is not configurable; it is
 * pegged at the size of two `double`s.
 *
 * \par
 * `Poly` objects are always nothrow movable. If you store an object in one that
 * has a potentially throwing move contructor, the object will be stored on the
 * heap, even if it could fit in the internal storage of the `Poly` object.
 * (So be sure to give your objects nothrow move constructors!)
 *
 * \par
 * `Poly` implements type-erasure in a manner very similar to how the compiler
 * accomplishes virtual dispatch. Every `Poly` object contains a pointer to a
 * table of function pointers. Member function calls involve a double-
 * indirection: once through the v-pointer, and other indirect function call
 * through the function pointer.
 */
template <class I>
struct Poly final : detail::PolyValOrRef<I> {
  friend detail::PolyAccess;
  Poly() = default;
  using detail::PolyValOrRef<I>::PolyValOrRef;
  using detail::PolyValOrRef<I>::operator=;
};

/**
 * Swap two `Poly<I>` instances.
 */
template <class I>
void swap(Poly<I>& left, Poly<I>& right) noexcept {
  left.swap(right);
}

/**
 * Pseudo-function template handy for disambiguating function overloads.
 *
 * For example, given:
 *     struct S {
 *       int property() const;
 *       void property(int);
 *     };
 *
 * You can get a member function pointer to the first overload with:
 *     folly::sig<int()const>(&S::property);
 *
 * This is arguably a nicer syntax that using the built-in `static_cast`:
 *     static_cast<int (S::*)() const>(&S::property);
 *
 * `sig` is also more permissive than `static_cast` about `const`. For instance,
 * the following also works:
 *     folly::sig<int()>(&S::property);
 *
 * The above is permitted
 */
template <class Sig>
FOLLY_INLINE_CONSTEXPR detail::Sig<Sig> const sig = {};

} // namespace folly

#include <folly/Poly-inl.h>

#undef FOLLY_INLINE_CONSTEXPR
