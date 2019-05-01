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

#include <functional>
#include <new>
#include <tuple>
#include <type_traits>
#include <typeinfo>
#include <utility>

#include <folly/Traits.h>
#include <folly/Utility.h>
#include <folly/detail/TypeList.h>
#include <folly/functional/Invoke.h>
#include <folly/lang/Exception.h>

#include <folly/PolyException.h>

namespace folly {
/// \cond
namespace detail {
template <class I>
struct PolyRoot;

using RRef_ = MetaQuoteTrait<std::add_rvalue_reference>;
using LRef_ = MetaQuoteTrait<std::add_lvalue_reference>;

template <typename T>
struct XRef_ : Type<MetaQuoteTrait<Type>> {};
template <typename T>
using XRef = _t<XRef_<T>>;
template <typename T>
struct XRef_<T&&> : Type<MetaCompose<RRef_, XRef<T>>> {};
template <typename T>
struct XRef_<T&> : Type<MetaCompose<LRef_, XRef<T>>> {};
template <typename T>
struct XRef_<T const> : Type<MetaQuoteTrait<std::add_const>> {};

template <class A, class B>
using AddCvrefOf = MetaApply<XRef<B>, A>;
} // namespace detail
/// \endcond

template <class I>
struct Poly;

template <class T, class I>
detail::AddCvrefOf<T, I>& poly_cast(detail::PolyRoot<I>&);

template <class T, class I>
detail::AddCvrefOf<T, I> const& poly_cast(detail::PolyRoot<I> const&);

#if !defined(__cpp_template_auto)
#define FOLLY_AUTO class
template <class... Ts>
using PolyMembers = detail::TypeList<Ts...>;
#else
#define FOLLY_AUTO auto
template <auto...>
struct PolyMembers;
#endif

/// \cond
namespace detail {
/* *****************************************************************************
 * IMPLEMENTATION NOTES
 *

Building the Interface
----------------------

Here is a high-level description of how Poly works. Users write an interface
such as:

  struct Mine {
    template <class Base>
    struct Interface {
      int Exec() const {
        return folly::poly_call<0>(*this);
      }
    }
    template <class T>
    using Members = folly::PolyMembers<&T::Exec>;
  };

Then they instantiate Poly<Mine>, which will have an Exec member function
of the correct signature. The Exec member function comes from
Mine::Interface<PolyNode<Mine, PolyRoot<Mine>>>, from which Poly<Mine> inherits.
Here's what each piece means:

- PolyRoot<I>: stores Data, which is a union of a void* (used when the Poly is
  storing an object on the heap or a reference) and some aligned storage (used
  when the Poly is storing an object in-situ). PolyRoot also stores a vtable
  pointer for interface I, which is a pointer to a struct containing function
  pointers. The function pointers are bound member functions (e.g.,
  SomeType::Exec). More on the vtable pointer and how it is generated below.

- PolyNode: provides the hooks used by folly::poly_call to dispatch to the
correctly bound member function for this interface. In the context of an
interface I, folly::poly_call<K>(*this, args...) will:
    1. Fetch the vtable pointer from PolyRoot,
    2. Select the I portion of that vtable (which, in the case of interface
       extension, may only be a part of the total vtable),
    3. Fetch the K-th function pointer from that vtable part,
    4. Call through that function pointer, passing Data (from PolyRoot) and any
       additional arguments in the folly::poly_call<K> invocation.

In the case of interface extension -- for instance, if interface Mine extended
interface Yours by inheriting from PolyExtends<Yours> -- then interface Mine
will have a list of base interfaces in a typelist called "Subsumptions".
Poly<Mine> will fold all the subsumed interfaces together, linearly inheriting
from them. To take the example of an interface Mine that extends Yours,
Poly<Mine> would inherit from this type:

  Mine::Interface<
    PolyNode<Mine,
      Your::Interface<
        PolyNode<Your, PolyRoot<Mine>>>>>

Through linear inheritance, Poly<Mine> ends up with the public member functions
of both interfaces, Mine and Yours.

VTables
-------

As mentioned above, PolyRoot<I> stores a vtable pointer for interface I. The
vtable is a struct whose members are function pointers. How are the types of
those function pointers computed from the interface? A dummy type is created,
Archetype<I>, in much the same way that Poly<I>'s base type is computed. Instead
of PolyNode and PolyRoot, there is ArchetypeNode and ArchetypeRoot. These types
also provide hooks for folly::poly_call, but they are dummy hooks that do
nothing. (Actually, they call std::terminate; they will never be called.) Once
Archetype<I> has been constructed, it is a concrete type that has all the
member functions of the interface and its subsumed interfaces. That type is
passed to Mine::Members, which takes the address of Archetype<I>::Exec and
inspects the resulting member function type. This is done for each member in the
interface. From a list of [member] function pointers, it is a simple matter of
metaprogramming to build a struct of function pointers. std::tuple is used for
this.

An extra field is added to the tuple for a function that handles all of the
"special" operations: destruction, copying, moving, getting the type
information, getting the address of the stored object, and fetching a fixed-up
vtable pointer for reference conversions (e.g., I -> I&, I& -> I const&, etc).

Subsumed interfaces are handled by having VTable<IDerived> inherit from
BasePtr<IBase>, where BasePtr<IBase> has only one member of type
VTable<IBase> const*.

Now that the type of VTable<I> is computed, how are the fields populated?
Poly<I> default-constructs to an empty state. Its vtable pointer points to a
vtable whose fields are initialized with the addresses of functions that do
nothing but throw a BadPolyAccess exception. That way, if you call a member
function on an empty Poly, you get an exception. The function pointer
corresponding to the "special" operations points to a no-op function; copying,
moving and destroying an empty Poly does nothing.

On the other hand, when you pass an object of type T satisfying interface I to
Poly<I>'s constructor or assignment operator, a vtable for {I,T} is reified by
passing type T to I::Members, thereby creating a list of bindings for T's member
functions. The address of this vtable gets stored in the PolyRoot<I> subobject,
imbuing the Poly object with the behaviors of type T. The T object itself gets
stored either on the heap or in the aligned storage within the Poly object
itself, depending on the size of T and whether or not it has a noexcept move
constructor.
*/

template <class T>
using Uncvref = std::remove_cv_t<std::remove_reference_t<T>>;

template <class T, template <class...> class U>
struct IsInstanceOf : std::false_type {};

template <class... Ts, template <class...> class U>
struct IsInstanceOf<U<Ts...>, U> : std::true_type {};

template <class T>
using Not = Bool<!T::value>;

template <class T>
struct StaticConst {
  static constexpr T value{};
};

template <class T>
constexpr T StaticConst<T>::value;

template <class Then>
decltype(auto) if_constexpr(std::true_type, Then then) {
  return then(Identity{});
}

template <class Then>
void if_constexpr(std::false_type, Then) {}

template <class Then, class Else>
decltype(auto) if_constexpr(std::true_type, Then then, Else) {
  return then(Identity{});
}

template <class Then, class Else>
decltype(auto) if_constexpr(std::false_type, Then, Else else_) {
  return else_(Identity{});
}

enum class Op : short { eNuke, eMove, eCopy, eType, eAddr, eRefr };

enum class RefType : std::uintptr_t { eRvalue, eLvalue, eConstLvalue };

struct Data;

template <class I>
struct PolyVal;

template <class I>
struct PolyRef;

struct PolyAccess;

template <class T>
using IsPoly = IsInstanceOf<Uncvref<T>, Poly>;

// Given an interface I and a concrete type T that satisfies the interface
// I, create a list of member function bindings from members of T to members
// of I.
template <class I, class T>
using MembersOf = typename I::template Members<Uncvref<T>>;

// Given an interface I and a base type T, create a type that implements
// the interface I in terms of the capabilities of T.
template <class I, class T>
using InterfaceOf = typename I::template Interface<T>;

#if !defined(__cpp_template_auto)
template <class T, T V>
using Member = std::integral_constant<T, V>;

template <class M>
using MemberType = typename M::value_type;

template <class M>
inline constexpr MemberType<M> memberValue() noexcept {
  return M::value;
}

template <class... Ts>
struct MakeMembers {
  template <Ts... Vs>
  using Members = PolyMembers<Member<Ts, Vs>...>;
};

template <class... Ts>
MakeMembers<Ts...> deduceMembers(Ts...);

template <class Member, class = MemberType<Member>>
struct MemberDef;

template <class Member, class R, class D, class... As>
struct MemberDef<Member, R (D::*)(As...)> {
  static R value(D& d, As... as) {
    return folly::invoke(memberValue<Member>(), d, static_cast<As&&>(as)...);
  }
};

template <class Member, class R, class D, class... As>
struct MemberDef<Member, R (D::*)(As...) const> {
  static R value(D const& d, As... as) {
    return folly::invoke(memberValue<Member>(), d, static_cast<As&&>(as)...);
  }
};

#else
template <auto M>
using MemberType = decltype(M);

template <auto M>
inline constexpr MemberType<M> memberValue() noexcept {
  return M;
}
#endif

struct PolyBase {};

template <class I, class = void>
struct SubsumptionsOf_ {
  using type = TypeList<>;
};

template <class I>
using InclusiveSubsumptionsOf = TypePushFront<_t<SubsumptionsOf_<I>>, I>;

template <class I>
struct SubsumptionsOf_<I, void_t<typename I::Subsumptions>> {
  using type = TypeJoin<TypeTransform<
      typename I::Subsumptions,
      MetaQuote<InclusiveSubsumptionsOf>>>;
};

template <class I>
using SubsumptionsOf = TypeReverseUnique<_t<SubsumptionsOf_<I>>>;

struct Bottom {
  template <class T>
  [[noreturn]] /* implicit */ operator T &&() const {
    std::terminate();
  }
};

using ArchetypeNode = MetaQuote<InterfaceOf>;

template <class I>
struct ArchetypeRoot;

template <class I>
using Archetype =
    TypeFold<InclusiveSubsumptionsOf<I>, ArchetypeRoot<I>, ArchetypeNode>;

struct ArchetypeBase : Bottom {
  ArchetypeBase() = default;
  template <class T>
  /* implicit */ ArchetypeBase(T&&);
  template <std::size_t, class... As>
  [[noreturn]] Bottom _polyCall_(As&&...) const {
    std::terminate();
  }

  friend bool operator==(ArchetypeBase const&, ArchetypeBase const&);
  friend bool operator!=(ArchetypeBase const&, ArchetypeBase const&);
  friend bool operator<(ArchetypeBase const&, ArchetypeBase const&);
  friend bool operator<=(ArchetypeBase const&, ArchetypeBase const&);
  friend bool operator>(ArchetypeBase const&, ArchetypeBase const&);
  friend bool operator>=(ArchetypeBase const&, ArchetypeBase const&);
  friend Bottom operator++(ArchetypeBase const&);
  friend Bottom operator++(ArchetypeBase const&, int);
  friend Bottom operator--(ArchetypeBase const&);
  friend Bottom operator--(ArchetypeBase const&, int);
  friend Bottom operator+(ArchetypeBase const&, ArchetypeBase const&);
  friend Bottom operator+=(ArchetypeBase const&, ArchetypeBase const&);
  friend Bottom operator-(ArchetypeBase const&, ArchetypeBase const&);
  friend Bottom operator-=(ArchetypeBase const&, ArchetypeBase const&);
  friend Bottom operator*(ArchetypeBase const&, ArchetypeBase const&);
  friend Bottom operator*=(ArchetypeBase const&, ArchetypeBase const&);
  friend Bottom operator/(ArchetypeBase const&, ArchetypeBase const&);
  friend Bottom operator/=(ArchetypeBase const&, ArchetypeBase const&);
  friend Bottom operator%(ArchetypeBase const&, ArchetypeBase const&);
  friend Bottom operator%=(ArchetypeBase const&, ArchetypeBase const&);
  friend Bottom operator<<(ArchetypeBase const&, ArchetypeBase const&);
  friend Bottom operator<<=(ArchetypeBase const&, ArchetypeBase const&);
  friend Bottom operator>>(ArchetypeBase const&, ArchetypeBase const&);
  friend Bottom operator>>=(ArchetypeBase const&, ArchetypeBase const&);
};

template <class I>
struct ArchetypeRoot : ArchetypeBase {
  template <class Node, class Tfx>
  using _polySelf_ = Archetype<AddCvrefOf<MetaApply<Tfx, I>, Node>>;
  using _polyInterface_ = I;
};

struct Data {
  Data() = default;
  // Suppress compiler-generated copy ops to not copy anything:
  Data(Data const&) {}
  Data& operator=(Data const&) {
    return *this;
  }
  union {
    void* pobj_ = nullptr;
    std::aligned_storage_t<sizeof(double[2])> buff_;
  };
};

template <class U, class I>
using Arg =
    If<std::is_same<Uncvref<U>, Archetype<I>>::value,
       Poly<AddCvrefOf<I, U const&>>,
       U>;

template <class U, class I>
using Ret =
    If<std::is_same<Uncvref<U>, Archetype<I>>::value,
       AddCvrefOf<Poly<I>, U>,
       U>;

template <class Member, class I>
struct SignatureOf_;

template <class R, class C, class... As, class I>
struct SignatureOf_<R (C::*)(As...), I> {
  using type = Ret<R, I> (*)(Data&, Arg<As, I>...);
};

template <class R, class C, class... As, class I>
struct SignatureOf_<R (C::*)(As...) const, I> {
  using type = Ret<R, I> (*)(Data const&, Arg<As, I>...);
};

template <class R, class This, class... As, class I>
struct SignatureOf_<R (*)(This&, As...), I> {
  using type = Ret<R, I> (*)(Data&, Arg<As, I>...);
};

template <class R, class This, class... As, class I>
struct SignatureOf_<R (*)(This const&, As...), I> {
  using type = Ret<R, I> (*)(Data const&, Arg<As, I>...);
};

template <FOLLY_AUTO Arch, class I>
using SignatureOf = _t<SignatureOf_<MemberType<Arch>, I>>;

template <FOLLY_AUTO User, class I, class Sig = SignatureOf<User, I>>
struct ArgTypes_;

template <FOLLY_AUTO User, class I, class Ret, class Data, class... Args>
struct ArgTypes_<User, I, Ret (*)(Data, Args...)> {
  using type = TypeList<Args...>;
};

template <FOLLY_AUTO User, class I>
using ArgTypes = _t<ArgTypes_<User, I>>;

template <class R, class... Args>
using FnPtr = R (*)(Args...);

struct ThrowThunk {
  template <class R, class... Args>
  constexpr /* implicit */ operator FnPtr<R, Args...>() const noexcept {
    struct _ {
      static R call(Args...) {
        throw_exception<BadPolyAccess>();
      }
    };
    return &_::call;
  }
};

inline constexpr ThrowThunk throw_() noexcept {
  return ThrowThunk{};
}

template <class T>
inline constexpr bool inSitu() noexcept {
  return !std::is_reference<T>::value &&
      sizeof(std::decay_t<T>) <= sizeof(Data) &&
      std::is_nothrow_move_constructible<std::decay_t<T>>::value;
}

template <class T>
T& get(Data& d) noexcept {
  if (inSitu<T>()) {
    return *(std::add_pointer_t<T>)static_cast<void*>(&d.buff_);
  } else {
    return *static_cast<std::add_pointer_t<T>>(d.pobj_);
  }
}

template <class T>
T const& get(Data const& d) noexcept {
  if (inSitu<T>()) {
    return *(std::add_pointer_t<T const>)static_cast<void const*>(&d.buff_);
  } else {
    return *static_cast<std::add_pointer_t<T const>>(d.pobj_);
  }
}

enum class State : short { eEmpty, eInSitu, eOnHeap };

template <class T>
struct IsPolyRef : std::false_type {};

template <class T>
struct IsPolyRef<Poly<T&>> : std::true_type {};

template <class Arg, class U>
decltype(auto) convert(U&& u) {
  return detail::if_constexpr(
      StrictConjunction<
          IsPolyRef<Uncvref<U>>,
          Negation<std::is_convertible<U, Arg>>>(),
      [&](auto id) -> decltype(auto) {
        return poly_cast<Uncvref<Arg>>(id(u).get());
      },
      [&](auto id) -> U&& { return static_cast<U&&>(id(u)); });
}

template <class Fun>
struct IsConstMember : std::false_type {};

template <class R, class C, class... As>
struct IsConstMember<R (C::*)(As...) const> : std::true_type {};

template <class R, class C, class... As>
struct IsConstMember<R (*)(C const&, As...)> : std::true_type {};

template <
    class T,
    FOLLY_AUTO User,
    class I,
    class = ArgTypes<User, I>,
    class = Bool<true>>
struct ThunkFn {
  template <class R, class D, class... As>
  constexpr /* implicit */ operator FnPtr<R, D&, As...>() const noexcept {
    return nullptr;
  }
};

template <class T, FOLLY_AUTO User, class I, class... Args>
struct ThunkFn<
    T,
    User,
    I,
    TypeList<Args...>,
    Bool<
        !std::is_const<std::remove_reference_t<T>>::value ||
        IsConstMember<MemberType<User>>::value>> {
  template <class R, class D, class... As>
  constexpr /* implicit */ operator FnPtr<R, D&, As...>() const noexcept {
    struct _ {
      static R call(D& d, As... as) {
        return folly::invoke(
            memberValue<User>(),
            get<T>(d),
            convert<Args>(static_cast<As&&>(as))...);
      }
    };
    return &_::call;
  }
};

template <
    class I,
    class = MembersOf<I, Archetype<I>>,
    class = SubsumptionsOf<I>>
struct VTable;

template <class T, FOLLY_AUTO User, class I>
inline constexpr ThunkFn<T, User, I> thunk() noexcept {
  return ThunkFn<T, User, I>{};
}

template <class I>
constexpr VTable<I> const* vtable() noexcept {
  return &StaticConst<VTable<I>>::value;
}

template <class I, class T>
struct VTableFor : VTable<I> {
  constexpr VTableFor() noexcept : VTable<I>{Type<T>{}} {}
};

template <class I, class T>
constexpr VTable<I> const* vtableFor() noexcept {
  return &StaticConst<VTableFor<I, T>>::value;
}

template <class I, class T>
constexpr void* vtableForRef(RefType ref) {
  switch (ref) {
    case RefType::eRvalue:
      return const_cast<VTable<I>*>(vtableFor<I, T&&>());
    case RefType::eLvalue:
      return const_cast<VTable<I>*>(vtableFor<I, T&>());
    case RefType::eConstLvalue:
      return const_cast<VTable<I>*>(vtableFor<I, T const&>());
  }
  return nullptr;
}

template <
    class I,
    class T,
    std::enable_if_t<std::is_reference<T>::value, int> = 0>
void* execOnHeap(Op op, Data* from, void* to) {
  switch (op) {
    case Op::eNuke:
      break;
    case Op::eMove:
    case Op::eCopy:
      static_cast<Data*>(to)->pobj_ = from->pobj_;
      break;
    case Op::eType:
      return const_cast<void*>(static_cast<void const*>(&typeid(T)));
    case Op::eAddr:
      if (*static_cast<std::type_info const*>(to) == typeid(T)) {
        return from->pobj_;
      }
      throw_exception<BadPolyCast>();
    case Op::eRefr:
      return vtableForRef<I, Uncvref<T>>(
          static_cast<RefType>(reinterpret_cast<std::uintptr_t>(to)));
  }
  return nullptr;
}

template <
    class I,
    class T,
    std::enable_if_t<Not<std::is_reference<T>>::value, int> = 0>
void* execOnHeap(Op op, Data* from, void* to) {
  switch (op) {
    case Op::eNuke:
      delete &get<T>(*from);
      break;
    case Op::eMove:
      static_cast<Data*>(to)->pobj_ = std::exchange(from->pobj_, nullptr);
      break;
    case Op::eCopy:
      detail::if_constexpr(std::is_copy_constructible<T>(), [&](auto id) {
        static_cast<Data*>(to)->pobj_ = new T(id(get<T>(*from)));
      });
      break;
    case Op::eType:
      return const_cast<void*>(static_cast<void const*>(&typeid(T)));
    case Op::eAddr:
      if (*static_cast<std::type_info const*>(to) == typeid(T)) {
        return from->pobj_;
      }
      throw_exception<BadPolyCast>();
    case Op::eRefr:
      return vtableForRef<I, Uncvref<T>>(
          static_cast<RefType>(reinterpret_cast<std::uintptr_t>(to)));
  }
  return nullptr;
}

template <class I, class T>
void* execInSitu(Op op, Data* from, void* to) {
  switch (op) {
    case Op::eNuke:
      get<T>(*from).~T();
      break;
    case Op::eMove:
      ::new (static_cast<void*>(&static_cast<Data*>(to)->buff_))
          T(std::move(get<T>(*from)));
      get<T>(*from).~T();
      break;
    case Op::eCopy:
      detail::if_constexpr(std::is_copy_constructible<T>(), [&](auto id) {
        ::new (static_cast<void*>(&static_cast<Data*>(to)->buff_))
            T(id(get<T>(*from)));
      });
      break;
    case Op::eType:
      return const_cast<void*>(static_cast<void const*>(&typeid(T)));
    case Op::eAddr:
      if (*static_cast<std::type_info const*>(to) == typeid(T)) {
        return &from->buff_;
      }
      throw_exception<BadPolyCast>();
    case Op::eRefr:
      return vtableForRef<I, Uncvref<T>>(
          static_cast<RefType>(reinterpret_cast<std::uintptr_t>(to)));
  }
  return nullptr;
}

inline void* noopExec(Op op, Data*, void*) {
  if (op == Op::eAddr)
    throw_exception<BadPolyAccess>();
  return const_cast<void*>(static_cast<void const*>(&typeid(void)));
}

template <class I>
struct BasePtr {
  VTable<I> const* vptr_;
};

template <class I, class T, std::enable_if_t<inSitu<T>(), int> = 0>
constexpr void* (*getOps() noexcept)(Op, Data*, void*) {
  return &execInSitu<I, T>;
}

template <class I, class T, std::enable_if_t<!inSitu<T>(), int> = 0>
constexpr void* (*getOps() noexcept)(Op, Data*, void*) {
  return &execOnHeap<I, T>;
}

template <class I, FOLLY_AUTO... Arch, class... S>
struct VTable<I, PolyMembers<Arch...>, TypeList<S...>>
    : BasePtr<S>..., std::tuple<SignatureOf<Arch, I>...> {
 private:
  template <class T, FOLLY_AUTO... User>
  constexpr VTable(Type<T>, PolyMembers<User...>) noexcept
      : BasePtr<S>{vtableFor<S, T>()}...,
        std::tuple<SignatureOf<Arch, I>...>{thunk<T, User, I>()...},
        state_{inSitu<T>() ? State::eInSitu : State::eOnHeap},
        ops_{getOps<I, T>()} {}

 public:
  constexpr VTable() noexcept
      : BasePtr<S>{vtable<S>()}...,
        std::tuple<SignatureOf<Arch, I>...>{
            static_cast<SignatureOf<Arch, I>>(throw_())...},
        state_{State::eEmpty},
        ops_{&noopExec} {}

  template <class T>
  explicit constexpr VTable(Type<T>) noexcept
      : VTable{Type<T>{}, MembersOf<I, T>{}} {}

  State state_;
  void* (*ops_)(Op, Data*, void*);
};

template <class I>
constexpr VTable<I> const& select(VTable<_t<Type<I>>> const& vtbl) noexcept {
  return vtbl;
}

template <class I>
constexpr VTable<I> const& select(BasePtr<_t<Type<I>>> const& base) noexcept {
  return *base.vptr_;
}

struct PolyAccess {
  template <std::size_t N, typename This, typename... As>
  static auto call(This&& _this, As&&... args)
      -> decltype(static_cast<This&&>(_this).template _polyCall_<N>(
          static_cast<As&&>(args)...)) {
    static_assert(
        !IsInstanceOf<std::decay_t<This>, Poly>::value,
        "When passing a Poly<> object to call(), you must explicitly "
        "say which Interface to dispatch to, as in "
        "call<0, MyInterface>(self, args...)");
    return static_cast<This&&>(_this).template _polyCall_<N>(
        static_cast<As&&>(args)...);
  }

  template <class Poly>
  using Iface = typename Uncvref<Poly>::_polyInterface_;

  template <class Node, class Tfx = MetaIdentity>
  static typename Uncvref<Node>::template _polySelf_<Node, Tfx> self_();

  template <class T, class Poly, class I = Iface<Poly>>
  static decltype(auto) cast(Poly&& _this) {
    using Ret = AddCvrefOf<AddCvrefOf<T, I>, Poly&&>;
    return static_cast<Ret>(
        *static_cast<std::add_pointer_t<Ret>>(_this.vptr_->ops_(
            Op::eAddr,
            const_cast<Data*>(static_cast<Data const*>(&_this)),
            const_cast<void*>(static_cast<void const*>(&typeid(T))))));
  }

  template <class Poly>
  static decltype(auto) root(Poly&& _this) noexcept {
    return static_cast<Poly&&>(_this)._polyRoot_();
  }

  template <class I>
  static std::type_info const& type(PolyRoot<I> const& _this) noexcept {
    return *static_cast<std::type_info const*>(
        _this.vptr_->ops_(Op::eType, nullptr, nullptr));
  }

  template <class I>
  static VTable<Uncvref<I>> const* vtable(PolyRoot<I> const& _this) noexcept {
    return _this.vptr_;
  }

  template <class I>
  static Data* data(PolyRoot<I>& _this) noexcept {
    return &_this;
  }

  template <class I>
  static Data const* data(PolyRoot<I> const& _this) noexcept {
    return &_this;
  }

  template <class I>
  static Poly<I&&> move(PolyRoot<I&> const& _this) noexcept {
    return Poly<I&&>{_this, Type<I&>{}};
  }

  template <class I>
  static Poly<I const&> move(PolyRoot<I const&> const& _this) noexcept {
    return Poly<I const&>{_this, Type<I const&>{}};
  }
};

template <class I, class Tail>
struct PolyNode : Tail {
 private:
  friend PolyAccess;
  using Tail::Tail;

  template <std::size_t K, typename... As>
  decltype(auto) _polyCall_(As&&... as) {
    return std::get<K>(select<I>(*PolyAccess::vtable(*this)))(
        *PolyAccess::data(*this), static_cast<As&&>(as)...);
  }
  template <std::size_t K, typename... As>
  decltype(auto) _polyCall_(As&&... as) const {
    return std::get<K>(select<I>(*PolyAccess::vtable(*this)))(
        *PolyAccess::data(*this), static_cast<As&&>(as)...);
  }
};

struct MakePolyNode {
  template <class I, class State>
  using apply = InterfaceOf<I, PolyNode<I, State>>;
};

template <class I>
struct PolyRoot : private PolyBase, private Data {
  friend PolyAccess;
  friend Poly<I>;
  friend PolyVal<I>;
  friend PolyRef<I>;
  template <class Node, class Tfx>
  using _polySelf_ = Poly<AddCvrefOf<MetaApply<Tfx, I>, Node>>;
  using _polyInterface_ = I;

 private:
  PolyRoot& _polyRoot_() noexcept {
    return *this;
  }
  PolyRoot const& _polyRoot_() const noexcept {
    return *this;
  }
  VTable<std::decay_t<I>> const* vptr_ = vtable<std::decay_t<I>>();
};

template <class I>
using PolyImpl =
    TypeFold<InclusiveSubsumptionsOf<Uncvref<I>>, PolyRoot<I>, MakePolyNode>;

// A const-qualified function type means the user is trying to disambiguate
// a member function pointer.
template <class Fun> // Fun = R(As...) const
struct Sig {
  template <class T>
  constexpr Fun T::*operator()(Fun T::*t) const /* nolint */ volatile noexcept {
    return t;
  }
  template <class F, class T>
  constexpr F T::*operator()(F T::*t) const /* nolint */ volatile noexcept {
    return t;
  }
};

// A functon type with no arguments means the user is trying to disambiguate
// a member function pointer.
template <class R>
struct Sig<R()> : Sig<R() const> {
  using Fun = R();
  using Sig<R() const>::operator();

  template <class T>
  constexpr Fun T::*operator()(Fun T::*t) const noexcept {
    return t;
  }
};

template <class R, class... As>
struct SigImpl : Sig<R(As...) const> {
  using Fun = R(As...);
  using Sig<R(As...) const>::operator();

  template <class T>
  constexpr Fun T::*operator()(Fun T::*t) const noexcept {
    return t;
  }
  constexpr Fun* operator()(Fun* t) const noexcept {
    return t;
  }
  template <class F>
  constexpr F* operator()(F* t) const noexcept {
    return t;
  }
};

// The user could be trying to disambiguate either a member or a free function.
template <class R, class... As>
struct Sig<R(As...)> : SigImpl<R, As...> {};

// This case is like the one above, except we want to add an overload that
// handles the case of a free function where the first argument is more
// const-qualified than the user explicitly specified.
template <class R, class A, class... As>
struct Sig<R(A&, As...)> : SigImpl<R, A&, As...> {
  using CCFun = R(A const&, As...);
  using SigImpl<R, A&, As...>::operator();

  constexpr CCFun* operator()(CCFun* t) const /* nolint */ volatile noexcept {
    return t;
  }
};

template <
    class T,
    class I,
    class U = std::decay_t<T>,
    std::enable_if_t<Not<std::is_base_of<PolyBase, U>>::value, int> = 0,
    std::enable_if_t<std::is_constructible<AddCvrefOf<U, I>, T>::value, int> =
        0,
    class = MembersOf<std::decay_t<I>, U>>
std::true_type modelsInterface_(int);
template <class T, class I>
std::false_type modelsInterface_(long);

template <class T, class I>
struct ModelsInterface : decltype(modelsInterface_<T, I>(0)) {};

template <class I1, class I2>
struct ValueCompatible : std::is_base_of<I1, I2> {};

// This prevents PolyRef's converting constructors and assignment operators
// from being considered as copy constructors and assignment operators:
template <class I1>
struct ValueCompatible<I1, I1> : std::false_type {};

template <class I1, class I2, class I2Ref>
struct ReferenceCompatible : std::is_constructible<I1, I2Ref> {};

// This prevents PolyRef's converting constructors and assignment operators
// from being considered as copy constructors and assignment operators:
template <class I1, class I2Ref>
struct ReferenceCompatible<I1, I1, I2Ref> : std::false_type {};

} // namespace detail
/// \endcond
} // namespace folly

#undef FOLLY_AUTO
