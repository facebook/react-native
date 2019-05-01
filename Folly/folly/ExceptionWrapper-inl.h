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
/*
 *
 * Author: Eric Niebler <eniebler@fb.com>
 */

#include <folly/Portability.h>

namespace folly {

template <class Fn>
struct exception_wrapper::arg_type_
    : public arg_type_<decltype(&Fn::operator())> {};
template <class Ret, class Class, class Arg>
struct exception_wrapper::arg_type_<Ret (Class::*)(Arg)> {
  using type = Arg;
};
template <class Ret, class Class, class Arg>
struct exception_wrapper::arg_type_<Ret (Class::*)(Arg) const> {
  using type = Arg;
};
template <class Ret, class Arg>
struct exception_wrapper::arg_type_<Ret(Arg)> {
  using type = Arg;
};
template <class Ret, class Arg>
struct exception_wrapper::arg_type_<Ret (*)(Arg)> {
  using type = Arg;
};
template <class Ret, class Class>
struct exception_wrapper::arg_type_<Ret (Class::*)(...)> {
  using type = AnyException;
};
template <class Ret, class Class>
struct exception_wrapper::arg_type_<Ret (Class::*)(...) const> {
  using type = AnyException;
};
template <class Ret>
struct exception_wrapper::arg_type_<Ret(...)> {
  using type = AnyException;
};
template <class Ret>
struct exception_wrapper::arg_type_<Ret (*)(...)> {
  using type = AnyException;
};

template <class Ret, class... Args>
inline Ret exception_wrapper::noop_(Args...) {
  return Ret();
}

inline std::type_info const* exception_wrapper::uninit_type_(
    exception_wrapper const*) {
  return &typeid(void);
}

template <class Ex, typename... As>
inline exception_wrapper::Buffer::Buffer(in_place_type_t<Ex>, As&&... as_) {
  ::new (static_cast<void*>(&buff_)) Ex(std::forward<As>(as_)...);
}

template <class Ex>
inline Ex& exception_wrapper::Buffer::as() noexcept {
  return *static_cast<Ex*>(static_cast<void*>(&buff_));
}
template <class Ex>
inline Ex const& exception_wrapper::Buffer::as() const noexcept {
  return *static_cast<Ex const*>(static_cast<void const*>(&buff_));
}

inline std::exception const* exception_wrapper::as_exception_or_null_(
    std::exception const& ex) {
  return &ex;
}
inline std::exception const* exception_wrapper::as_exception_or_null_(
    AnyException) {
  return nullptr;
}

static_assert(
    !kMicrosoftAbiVer || (kMicrosoftAbiVer >= 1900 && kMicrosoftAbiVer <= 2000),
    "exception_wrapper is untested and possibly broken on your version of "
    "MSVC");

inline std::uintptr_t exception_wrapper::ExceptionPtr::as_int_(
    std::exception_ptr const& ptr,
    std::exception const& e) noexcept {
  if (!kMicrosoftAbiVer) {
    return reinterpret_cast<std::uintptr_t>(&e);
  } else {
    // On Windows, as of MSVC2017, all thrown exceptions are copied to the stack
    // first. Thus, we cannot depend on exception references associated with an
    // exception_ptr to be live for the duration of the exception_ptr. We need
    // to directly access the heap allocated memory inside the exception_ptr.
    //
    // std::exception_ptr is an opaque reinterpret_cast of
    // std::shared_ptr<__ExceptionPtr>
    // __ExceptionPtr is a non-virtual class with two members, a union and a
    // bool. The union contains the now-undocumented EHExceptionRecord, which
    // contains a struct which contains a void* which points to the heap
    // allocated exception.
    // We derive the offset to pExceptionObject via manual means.
    FOLLY_PACK_PUSH
    struct Win32ExceptionPtr {
      char offset[8 + 4 * sizeof(void*)];
      void* exceptionObject;
    } FOLLY_PACK_ATTR;
    FOLLY_PACK_POP

    auto* win32ExceptionPtr =
        reinterpret_cast<std::shared_ptr<Win32ExceptionPtr> const*>(&ptr)
            ->get();
    return reinterpret_cast<std::uintptr_t>(win32ExceptionPtr->exceptionObject);
  }
}
inline std::uintptr_t exception_wrapper::ExceptionPtr::as_int_(
    std::exception_ptr const&,
    AnyException e) noexcept {
  return reinterpret_cast<std::uintptr_t>(e.typeinfo_) + 1;
}
inline bool exception_wrapper::ExceptionPtr::has_exception_() const {
  return 0 == exception_or_type_ % 2;
}
inline std::exception const* exception_wrapper::ExceptionPtr::as_exception_()
    const {
  return reinterpret_cast<std::exception const*>(exception_or_type_);
}
inline std::type_info const* exception_wrapper::ExceptionPtr::as_type_() const {
  return reinterpret_cast<std::type_info const*>(exception_or_type_ - 1);
}

inline void exception_wrapper::ExceptionPtr::copy_(
    exception_wrapper const* from,
    exception_wrapper* to) {
  ::new (static_cast<void*>(&to->eptr_)) ExceptionPtr(from->eptr_);
}
inline void exception_wrapper::ExceptionPtr::move_(
    exception_wrapper* from,
    exception_wrapper* to) {
  ::new (static_cast<void*>(&to->eptr_)) ExceptionPtr(std::move(from->eptr_));
  delete_(from);
}
inline void exception_wrapper::ExceptionPtr::delete_(exception_wrapper* that) {
  that->eptr_.~ExceptionPtr();
  that->vptr_ = &uninit_;
}
[[noreturn]] inline void exception_wrapper::ExceptionPtr::throw_(
    exception_wrapper const* that) {
  std::rethrow_exception(that->eptr_.ptr_);
}
inline std::type_info const* exception_wrapper::ExceptionPtr::type_(
    exception_wrapper const* that) {
  if (auto e = get_exception_(that)) {
    return &typeid(*e);
  }
  return that->eptr_.as_type_();
}
inline std::exception const* exception_wrapper::ExceptionPtr::get_exception_(
    exception_wrapper const* that) {
  return that->eptr_.has_exception_() ? that->eptr_.as_exception_() : nullptr;
}
inline exception_wrapper exception_wrapper::ExceptionPtr::get_exception_ptr_(
    exception_wrapper const* that) {
  return *that;
}

template <class Ex>
inline void exception_wrapper::InPlace<Ex>::copy_(
    exception_wrapper const* from,
    exception_wrapper* to) {
  ::new (static_cast<void*>(std::addressof(to->buff_.as<Ex>())))
      Ex(from->buff_.as<Ex>());
}
template <class Ex>
inline void exception_wrapper::InPlace<Ex>::move_(
    exception_wrapper* from,
    exception_wrapper* to) {
  ::new (static_cast<void*>(std::addressof(to->buff_.as<Ex>())))
      Ex(std::move(from->buff_.as<Ex>()));
  delete_(from);
}
template <class Ex>
inline void exception_wrapper::InPlace<Ex>::delete_(exception_wrapper* that) {
  that->buff_.as<Ex>().~Ex();
  that->vptr_ = &uninit_;
}
template <class Ex>
[[noreturn]] inline void exception_wrapper::InPlace<Ex>::throw_(
    exception_wrapper const* that) {
  throw that->buff_.as<Ex>(); // @nolint
}
template <class Ex>
inline std::type_info const* exception_wrapper::InPlace<Ex>::type_(
    exception_wrapper const*) {
  return &typeid(Ex);
}
template <class Ex>
inline std::exception const* exception_wrapper::InPlace<Ex>::get_exception_(
    exception_wrapper const* that) {
  return as_exception_or_null_(that->buff_.as<Ex>());
}
template <class Ex>
inline exception_wrapper exception_wrapper::InPlace<Ex>::get_exception_ptr_(
    exception_wrapper const* that) {
  try {
    throw_(that);
  } catch (Ex const& ex) {
    return exception_wrapper{std::current_exception(), ex};
  }
}

template <class Ex>
[[noreturn]] inline void exception_wrapper::SharedPtr::Impl<Ex>::throw_()
    const {
  throw ex_; // @nolint
}
template <class Ex>
inline std::exception const*
exception_wrapper::SharedPtr::Impl<Ex>::get_exception_() const noexcept {
  return as_exception_or_null_(ex_);
}
template <class Ex>
inline exception_wrapper
exception_wrapper::SharedPtr::Impl<Ex>::get_exception_ptr_() const noexcept {
  try {
    throw_();
  } catch (Ex& ex) {
    return exception_wrapper{std::current_exception(), ex};
  }
}
inline void exception_wrapper::SharedPtr::copy_(
    exception_wrapper const* from,
    exception_wrapper* to) {
  ::new (static_cast<void*>(std::addressof(to->sptr_))) SharedPtr(from->sptr_);
}
inline void exception_wrapper::SharedPtr::move_(
    exception_wrapper* from,
    exception_wrapper* to) {
  ::new (static_cast<void*>(std::addressof(to->sptr_)))
      SharedPtr(std::move(from->sptr_));
  delete_(from);
}
inline void exception_wrapper::SharedPtr::delete_(exception_wrapper* that) {
  that->sptr_.~SharedPtr();
  that->vptr_ = &uninit_;
}
[[noreturn]] inline void exception_wrapper::SharedPtr::throw_(
    exception_wrapper const* that) {
  that->sptr_.ptr_->throw_();
  folly::assume_unreachable();
}
inline std::type_info const* exception_wrapper::SharedPtr::type_(
    exception_wrapper const* that) {
  return that->sptr_.ptr_->info_;
}
inline std::exception const* exception_wrapper::SharedPtr::get_exception_(
    exception_wrapper const* that) {
  return that->sptr_.ptr_->get_exception_();
}
inline exception_wrapper exception_wrapper::SharedPtr::get_exception_ptr_(
    exception_wrapper const* that) {
  return that->sptr_.ptr_->get_exception_ptr_();
}

template <class Ex, typename... As>
inline exception_wrapper::exception_wrapper(
    ThrownTag,
    in_place_type_t<Ex>,
    As&&... as)
    : eptr_{std::make_exception_ptr(Ex(std::forward<As>(as)...)),
            reinterpret_cast<std::uintptr_t>(std::addressof(typeid(Ex))) + 1u},
      vptr_(&ExceptionPtr::ops_) {}

template <class Ex, typename... As>
inline exception_wrapper::exception_wrapper(
    OnHeapTag,
    in_place_type_t<Ex>,
    As&&... as)
    : sptr_{std::make_shared<SharedPtr::Impl<Ex>>(std::forward<As>(as)...)},
      vptr_(&SharedPtr::ops_) {}

template <class Ex, typename... As>
inline exception_wrapper::exception_wrapper(
    InSituTag,
    in_place_type_t<Ex>,
    As&&... as)
    : buff_{in_place_type<Ex>, std::forward<As>(as)...},
      vptr_(&InPlace<Ex>::ops_) {}

inline exception_wrapper::exception_wrapper(exception_wrapper&& that) noexcept
    : exception_wrapper{} {
  (vptr_ = that.vptr_)->move_(&that, this); // Move into *this, won't throw
}

inline exception_wrapper::exception_wrapper(
    exception_wrapper const& that) noexcept
    : exception_wrapper{} {
  that.vptr_->copy_(&that, this); // Copy into *this, won't throw
  vptr_ = that.vptr_;
}

// If `this == &that`, this move assignment operator leaves the object in a
// valid but unspecified state.
inline exception_wrapper& exception_wrapper::operator=(
    exception_wrapper&& that) noexcept {
  vptr_->delete_(this); // Free the current exception
  (vptr_ = that.vptr_)->move_(&that, this); // Move into *this, won't throw
  return *this;
}

inline exception_wrapper& exception_wrapper::operator=(
    exception_wrapper const& that) noexcept {
  exception_wrapper(that).swap(*this);
  return *this;
}

inline exception_wrapper::~exception_wrapper() {
  reset();
}

template <class Ex>
inline exception_wrapper::exception_wrapper(
    std::exception_ptr ptr,
    Ex& ex) noexcept
    : eptr_{ptr, ExceptionPtr::as_int_(ptr, ex)}, vptr_(&ExceptionPtr::ops_) {
  assert(eptr_.ptr_);
}

namespace exception_wrapper_detail {
template <class Ex>
Ex&& dont_slice(Ex&& ex) {
  assert(typeid(ex) == typeid(_t<std::decay<Ex>>) ||
       !"Dynamic and static exception types don't match. Exception would "
        "be sliced when storing in exception_wrapper.");
  return std::forward<Ex>(ex);
}
} // namespace exception_wrapper_detail

template <
    class Ex,
    class Ex_,
    FOLLY_REQUIRES_DEF(Conjunction<
                       exception_wrapper::IsStdException<Ex_>,
                       exception_wrapper::IsRegularExceptionType<Ex_>>::value)>
inline exception_wrapper::exception_wrapper(Ex&& ex)
    : exception_wrapper{
          PlacementOf<Ex_>{},
          in_place_type<Ex_>,
          exception_wrapper_detail::dont_slice(std::forward<Ex>(ex))} {}

template <
    class Ex,
    class Ex_,
    FOLLY_REQUIRES_DEF(exception_wrapper::IsRegularExceptionType<Ex_>::value)>
inline exception_wrapper::exception_wrapper(in_place_t, Ex&& ex)
    : exception_wrapper{
          PlacementOf<Ex_>{},
          in_place_type<Ex_>,
          exception_wrapper_detail::dont_slice(std::forward<Ex>(ex))} {}

template <
    class Ex,
    typename... As,
    FOLLY_REQUIRES_DEF(exception_wrapper::IsRegularExceptionType<Ex>::value)>
inline exception_wrapper::exception_wrapper(in_place_type_t<Ex>, As&&... as)
    : exception_wrapper{PlacementOf<Ex>{},
                        in_place_type<Ex>,
                        std::forward<As>(as)...} {}

inline void exception_wrapper::swap(exception_wrapper& that) noexcept {
  exception_wrapper tmp(std::move(that));
  that = std::move(*this);
  *this = std::move(tmp);
}

inline exception_wrapper::operator bool() const noexcept {
  return vptr_ != &uninit_;
}

inline bool exception_wrapper::operator!() const noexcept {
  return !static_cast<bool>(*this);
}

inline void exception_wrapper::reset() {
  vptr_->delete_(this);
}

inline bool exception_wrapper::has_exception_ptr() const noexcept {
  return vptr_ == &ExceptionPtr::ops_;
}

inline std::exception* exception_wrapper::get_exception() noexcept {
  return const_cast<std::exception*>(vptr_->get_exception_(this));
}
inline std::exception const* exception_wrapper::get_exception() const noexcept {
  return vptr_->get_exception_(this);
}

template <typename Ex>
inline Ex* exception_wrapper::get_exception() noexcept {
  Ex* object{nullptr};
  with_exception([&](Ex& ex) { object = &ex; });
  return object;
}

template <typename Ex>
inline Ex const* exception_wrapper::get_exception() const noexcept {
  Ex const* object{nullptr};
  with_exception([&](Ex const& ex) { object = &ex; });
  return object;
}

inline std::exception_ptr const&
exception_wrapper::to_exception_ptr() noexcept {
  // Computing an exception_ptr is expensive so cache the result.
  return (*this = vptr_->get_exception_ptr_(this)).eptr_.ptr_;
}
inline std::exception_ptr exception_wrapper::to_exception_ptr() const noexcept {
  return vptr_->get_exception_ptr_(this).eptr_.ptr_;
}

inline std::type_info const& exception_wrapper::none() noexcept {
  return typeid(void);
}
inline std::type_info const& exception_wrapper::unknown() noexcept {
  return typeid(Unknown);
}

inline std::type_info const& exception_wrapper::type() const noexcept {
  return *vptr_->type_(this);
}

inline folly::fbstring exception_wrapper::what() const {
  if (auto e = get_exception()) {
    return class_name() + ": " + e->what();
  }
  return class_name();
}

inline folly::fbstring exception_wrapper::class_name() const {
  auto& ti = type();
  return ti == none()
      ? ""
      : ti == unknown() ? "<unknown exception>" : folly::demangle(ti);
}

template <class Ex>
inline bool exception_wrapper::is_compatible_with() const noexcept {
  return with_exception([](Ex const&) {});
}

[[noreturn]] inline void exception_wrapper::throw_exception() const {
  vptr_->throw_(this);
  onNoExceptionError(__func__);
}

template <class Ex>
[[noreturn]] inline void exception_wrapper::throw_with_nested(Ex&& ex) const {
  try {
    throw_exception();
  } catch (...) {
    std::throw_with_nested(std::forward<Ex>(ex));
  }
}

template <class CatchFn, bool IsConst>
struct exception_wrapper::ExceptionTypeOf {
  using type = arg_type<_t<std::decay<CatchFn>>>;
  static_assert(
      std::is_reference<type>::value,
      "Always catch exceptions by reference.");
  static_assert(
      !IsConst || std::is_const<_t<std::remove_reference<type>>>::value,
      "handle() or with_exception() called on a const exception_wrapper "
      "and asked to catch a non-const exception. Handler will never fire. "
      "Catch exception by const reference to fix this.");
};

// Nests a throw in the proper try/catch blocks
template <bool IsConst>
struct exception_wrapper::HandleReduce {
  bool* handled_;

  template <
      class ThrowFn,
      class CatchFn,
      FOLLY_REQUIRES(!IsCatchAll<CatchFn>::value)>
  auto operator()(ThrowFn&& th, CatchFn& ca) const {
    using Ex = _t<ExceptionTypeOf<CatchFn, IsConst>>;
    return [th = std::forward<ThrowFn>(th), &ca, handled_ = handled_] {
      try {
        th();
      } catch (Ex& e) {
        // If we got here because a catch function threw, rethrow.
        if (*handled_) {
          throw;
        }
        *handled_ = true;
        ca(e);
      }
    };
  }

  template <
      class ThrowFn,
      class CatchFn,
      FOLLY_REQUIRES(IsCatchAll<CatchFn>::value)>
  auto operator()(ThrowFn&& th, CatchFn& ca) const {
    return [th = std::forward<ThrowFn>(th), &ca, handled_ = handled_] {
      try {
        th();
      } catch (...) {
        // If we got here because a catch function threw, rethrow.
        if (*handled_) {
          throw;
        }
        *handled_ = true;
        ca();
      }
    };
  }
};

// When all the handlers expect types derived from std::exception, we can
// sometimes invoke the handlers without throwing any exceptions.
template <bool IsConst>
struct exception_wrapper::HandleStdExceptReduce {
  using StdEx = AddConstIf<IsConst, std::exception>;

  template <
      class ThrowFn,
      class CatchFn,
      FOLLY_REQUIRES(!IsCatchAll<CatchFn>::value)>
  auto operator()(ThrowFn&& th, CatchFn& ca) const {
    using Ex = _t<ExceptionTypeOf<CatchFn, IsConst>>;
    return
        [th = std::forward<ThrowFn>(th), &ca](auto&& continuation) -> StdEx* {
          if (auto e = const_cast<StdEx*>(th(continuation))) {
            if (auto e2 = dynamic_cast<_t<std::add_pointer<Ex>>>(e)) {
              ca(*e2);
            } else {
              return e;
            }
          }
          return nullptr;
        };
  }

  template <
      class ThrowFn,
      class CatchFn,
      FOLLY_REQUIRES(IsCatchAll<CatchFn>::value)>
  auto operator()(ThrowFn&& th, CatchFn& ca) const {
    return [th = std::forward<ThrowFn>(th), &ca](auto &&) -> StdEx* {
      // The following continuation causes ca() to execute if *this contains
      // an exception /not/ derived from std::exception.
      auto continuation = [&ca](StdEx* e) {
        return e != nullptr ? e : ((void)ca(), nullptr);
      };
      if (th(continuation) != nullptr) {
        ca();
      }
      return nullptr;
    };
  }
};

// Called when some types in the catch clauses are not derived from
// std::exception.
template <class This, class... CatchFns>
inline void
exception_wrapper::handle_(std::false_type, This& this_, CatchFns&... fns) {
  bool handled = false;
  auto impl = exception_wrapper_detail::fold(
      HandleReduce<std::is_const<This>::value>{&handled},
      [&] { this_.throw_exception(); },
      fns...);
  impl();
}

// Called when all types in the catch clauses are either derived from
// std::exception or a catch-all clause.
template <class This, class... CatchFns>
inline void
exception_wrapper::handle_(std::true_type, This& this_, CatchFns&... fns) {
  using StdEx = exception_wrapper_detail::
      AddConstIf<std::is_const<This>::value, std::exception>;
  auto impl = exception_wrapper_detail::fold(
      HandleStdExceptReduce<std::is_const<This>::value>{},
      [&](auto&& continuation) {
        return continuation(
            const_cast<StdEx*>(this_.vptr_->get_exception_(&this_)));
      },
      fns...);
  // This continuation gets evaluated if CatchFns... does not include a
  // catch-all handler. It is a no-op.
  auto continuation = [](StdEx* ex) { return ex; };
  if (nullptr != impl(continuation)) {
    this_.throw_exception();
  }
}

namespace exception_wrapper_detail {
template <class Ex, class Fn>
struct catch_fn {
  Fn fn_;
  auto operator()(Ex& ex) {
    return fn_(ex);
  }
};

template <class Ex, class Fn>
inline catch_fn<Ex, Fn> catch_(Ex*, Fn fn) {
  return {std::move(fn)};
}
template <class Fn>
inline Fn catch_(void const*, Fn fn) {
  return fn;
}
} // namespace exception_wrapper_detail

template <class Ex, class This, class Fn>
inline bool exception_wrapper::with_exception_(This& this_, Fn fn_) {
  if (!this_) {
    return false;
  }
  bool handled = true;
  auto fn = exception_wrapper_detail::catch_(
      static_cast<Ex*>(nullptr), std::move(fn_));
  auto&& all = [&](...) { handled = false; };
  handle_(IsStdException<arg_type<decltype(fn)>>{}, this_, fn, all);
  return handled;
}

template <class Ex, class Fn>
inline bool exception_wrapper::with_exception(Fn fn) {
  return with_exception_<Ex>(*this, std::move(fn));
}
template <class Ex, class Fn>
inline bool exception_wrapper::with_exception(Fn fn) const {
  return with_exception_<Ex const>(*this, std::move(fn));
}

template <class... CatchFns>
inline void exception_wrapper::handle(CatchFns... fns) {
  using AllStdEx =
      exception_wrapper_detail::AllOf<IsStdException, arg_type<CatchFns>...>;
  if (!*this) {
    onNoExceptionError(__func__);
  }
  this->handle_(AllStdEx{}, *this, fns...);
}
template <class... CatchFns>
inline void exception_wrapper::handle(CatchFns... fns) const {
  using AllStdEx =
      exception_wrapper_detail::AllOf<IsStdException, arg_type<CatchFns>...>;
  if (!*this) {
    onNoExceptionError(__func__);
  }
  this->handle_(AllStdEx{}, *this, fns...);
}

} // namespace folly
