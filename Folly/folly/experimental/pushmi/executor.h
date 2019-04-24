#pragma once
/*
 * Copyright 2018-present Facebook, Inc.
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

#include <chrono>
#include <functional>
#include <folly/experimental/pushmi/receiver.h>

namespace pushmi {
namespace detail {
template <class T, template <class...> class C>
using not_is_t = std::enable_if_t<!is_v<std::decay_t<T>, C>, std::decay_t<T>>;
} // namespace detail

//
// define types for executors

namespace detail {
template <class T>
using not_any_executor_ref_t = not_is_t<T, any_executor_ref>;
} // namespace detail

template<class E>
struct any_executor_ref {
private:
  using This = any_executor_ref;
  void* pobj_;
  struct vtable {
    void (*submit_)(void*, void*);
  } const *vptr_;
  template <class T>
  using wrapped_t = detail::not_any_executor_ref_t<T>;
public:
  using properties = property_set<is_sender<>, is_executor<>, is_single<>>;

  any_executor_ref() = delete;
  any_executor_ref(const any_executor_ref&) = default;

  PUSHMI_TEMPLATE (class Wrapped)
    (requires Sender<wrapped_t<Wrapped>, is_executor<>, is_single<>>)
    // (requires SenderTo<wrapped_t<Wrapped>, any_receiver<E, This>>)
  any_executor_ref(Wrapped& w) {
    // This can't be a requirement because it asks if submit(w, any_receiver<E,T>)
    // is well-formed (where T is an alias for any_executor_ref). If w
    // has a submit that is constrained with SingleReceiver<any_receiver<E,T>, T'&, E'>, that
    // will ask whether value(any_receiver<E,T>, T'&) is well-formed. And *that* will
    // ask whether T'& is convertible to T. That brings us right back to this
    // constructor. Constraint recursion!
    static_assert(
      SenderTo<Wrapped, any_receiver<E,This>>,
      "Expecting to be passed a Sender that can send to a SingleReceiver"
      " that accpets a value of type This and an error of type E");
    struct s {
      static void submit(void* pobj, void* s) {
        return ::pushmi::submit(
          *static_cast<Wrapped*>(pobj),
          std::move(*static_cast<any_receiver<E,This>*>(s)));
      }
    };
    static const vtable vtbl{s::submit};
    pobj_ = std::addressof(w);
    vptr_ = &vtbl;
  }
  any_executor_ref executor() { return *this; }
  template<class SingleReceiver>
  void submit(SingleReceiver&& sa) {
    // static_assert(
    //   ConvertibleTo<SingleReceiver, any_receiver<E, This>>,
    //   "requires any_receiver<E, any_executor_ref<E>>");
    any_receiver<E, This> s{(SingleReceiver&&) sa};
    vptr_->submit_(pobj_, &s);
  }
};

////////////////////////////////////////////////////////////////////////////////
// make_any_executor_ref
template <
    class E = std::exception_ptr>
auto make_any_executor_ref() {
  return any_executor_ref<E>{};
}

PUSHMI_TEMPLATE (
    class E = std::exception_ptr,
    class Wrapped)
  (requires Sender<detail::not_any_executor_ref_t<Wrapped>, is_executor<>, is_single<>>)
auto make_any_executor_ref(Wrapped& w) {
  return any_executor_ref<E>{w};
}

////////////////////////////////////////////////////////////////////////////////
// deduction guides
#if __cpp_deduction_guides >= 201703
any_executor_ref() ->
    any_executor_ref<
        std::exception_ptr>;

PUSHMI_TEMPLATE (class Wrapped)
  (requires Sender<detail::not_any_executor_ref_t<Wrapped>, is_executor<>, is_single<>>)
any_executor_ref(Wrapped&) ->
    any_executor_ref<
        std::exception_ptr>;
#endif

namespace detail {
template<class E>
using any_executor_base =
  any_single_sender<E, any_executor_ref<E>>;

template<class T, class E>
using not_any_executor =
  std::enable_if_t<
    !std::is_base_of<any_executor_base<E>, std::decay_t<T>>::value,
    std::decay_t<T>>;
} // namespace detail

template <class E>
struct any_executor : detail::any_executor_base<E> {
  constexpr any_executor() = default;
  using properties = property_set<is_sender<>, is_executor<>, is_single<>>;
  using detail::any_executor_base<E>::any_executor_base;
};

////////////////////////////////////////////////////////////////////////////////
// make_any_executor
template <
    class E = std::exception_ptr>
auto make_any_executor() -> any_executor<E> {
  return any_executor<E>{};
}

PUSHMI_TEMPLATE(
    class E = std::exception_ptr,
    class Wrapped)
  (requires SenderTo<
      detail::not_any_executor<Wrapped, E>,
      any_receiver<E, any_executor_ref<E>>>)
auto make_any_executor(Wrapped w) -> any_executor<E> {
  return any_executor<E>{std::move(w)};
}

////////////////////////////////////////////////////////////////////////////////
// deduction guides
#if __cpp_deduction_guides >= 201703
any_executor() ->
    any_executor<
        std::exception_ptr>;

PUSHMI_TEMPLATE(class Wrapped)
  (requires SenderTo<
      detail::not_any_executor<
          Wrapped,
          std::exception_ptr>,
      any_receiver<
          std::exception_ptr,
          any_executor_ref<
              std::exception_ptr>>>)
any_executor(Wrapped) ->
    any_executor<
        std::exception_ptr>;
#endif


//
// define types for constrained executors

namespace detail {
template <class T>
using not_any_constrained_executor_ref_t = not_is_t<T, any_constrained_executor_ref>;
} // namespace detail

template<class E, class CV>
struct any_constrained_executor_ref {
private:
  using This = any_constrained_executor_ref;
  void* pobj_;
  struct vtable {
    CV (*top_)(void*);
    void (*submit_)(void*, CV, void*);
  } const *vptr_;
  template <class T>
  using wrapped_t = detail::not_any_constrained_executor_ref_t<T>;
public:
  using properties = property_set<is_constrained<>, is_executor<>, is_single<>>;

  any_constrained_executor_ref() = delete;
  any_constrained_executor_ref(const any_constrained_executor_ref&) = default;

  PUSHMI_TEMPLATE (class Wrapped)
    (requires ConstrainedSender<wrapped_t<Wrapped>, is_single<>>)
    // (requires ConstrainedSenderTo<wrapped_t<Wrapped>, any_receiver<E,This>>)
  any_constrained_executor_ref(Wrapped& w) {
    // This can't be a requirement because it asks if submit(w, top(w), any_receiver<E,T>)
    // is well-formed (where T is an alias for any_constrained_executor_ref). If w
    // has a submit that is constrained with ReceiveValue<any_receiver<E,T>, T'&>, that
    // will ask whether value(any_receiver<E,T>, T'&) is well-formed. And *that* will
    // ask whether T'& is convertible to T. That brings us right back to this
    // constructor. Constraint recursion!
    static_assert(
      ConstrainedSenderTo<Wrapped, any_receiver<E,This>>,
      "Expecting to be passed a ConstrainedSender that can send to a SingleReceiver"
      " that accpets a value of type This and an error of type E");
    struct s {
      static CV top(void* pobj) {
        return ::pushmi::top(*static_cast<Wrapped*>(pobj));
      }
      static void submit(void* pobj, CV cv, void* s) {
        return ::pushmi::submit(
          *static_cast<Wrapped*>(pobj),
          cv,
          std::move(*static_cast<any_receiver<E,This>*>(s)));
      }
    };
    static const vtable vtbl{s::top, s::submit};
    pobj_ = std::addressof(w);
    vptr_ = &vtbl;
  }
  CV top() {
    return vptr_->top_(pobj_);
  }
  any_constrained_executor_ref executor() { return *this; }
  template<class SingleReceiver>
  void submit(CV cv, SingleReceiver&& sa) {
    // static_assert(
    //   ConvertibleTo<SingleReceiver, any_receiver<E, This>>,
    //   "requires any_receiver<E, any_constrained_executor_ref<E, TP>>");
    any_receiver<E, This> s{(SingleReceiver&&) sa};
    vptr_->submit_(pobj_, cv, &s);
  }
};

////////////////////////////////////////////////////////////////////////////////
// make_any_constrained_executor_ref
template <
    class E = std::exception_ptr,
    class CV = std::ptrdiff_t>
auto make_any_constrained_executor_ref() {
  return any_constrained_executor_ref<E, CV>{};
}

PUSHMI_TEMPLATE (
    class E = std::exception_ptr,
    class Wrapped)
  (requires ConstrainedSender<detail::not_any_constrained_executor_ref_t<Wrapped>, is_single<>>)
auto make_any_constrained_executor_ref(Wrapped& w) {
  return any_constrained_executor_ref<E, constraint_t<Wrapped>>{w};
}

////////////////////////////////////////////////////////////////////////////////
// deduction guides
#if __cpp_deduction_guides >= 201703
any_constrained_executor_ref() ->
    any_constrained_executor_ref<
        std::exception_ptr,
        std::ptrdiff_t>;

PUSHMI_TEMPLATE (class Wrapped)
  (requires ConstrainedSender<detail::not_any_constrained_executor_ref_t<Wrapped>, is_single<>>)
any_constrained_executor_ref(Wrapped&) ->
    any_constrained_executor_ref<
        std::exception_ptr,
        constraint_t<Wrapped>>;
#endif

namespace detail {
template<class E, class CV>
using any_constrained_executor_base =
  any_constrained_single_sender<E, CV, any_constrained_executor_ref<E, CV>>;

template<class T, class E, class CV>
using not_any_constrained_executor =
  std::enable_if_t<
    !std::is_base_of<any_constrained_executor_base<E, CV>, std::decay_t<T>>::value,
    std::decay_t<T>>;
} // namespace detail

template <class E, class CV>
struct any_constrained_executor : detail::any_constrained_executor_base<E, CV> {
  using properties = property_set<is_constrained<>, is_executor<>, is_single<>>;
  constexpr any_constrained_executor() = default;
  using detail::any_constrained_executor_base<E, CV>::any_constrained_executor_base;
};

////////////////////////////////////////////////////////////////////////////////
// make_any_constrained_executor
template <
    class E = std::exception_ptr,
    class CV = std::ptrdiff_t>
auto make_any_constrained_executor() -> any_constrained_executor<E, CV> {
  return any_constrained_executor<E, CV>{};
}

PUSHMI_TEMPLATE(
    class E = std::exception_ptr,
    class Wrapped)
  (requires ConstrainedSenderTo<
      detail::not_any_constrained_executor<Wrapped, E, constraint_t<Wrapped>>,
      any_receiver<E, any_constrained_executor_ref<E, constraint_t<Wrapped>>>>)
auto make_any_constrained_executor(Wrapped w) -> any_constrained_executor<E, constraint_t<Wrapped>> {
  return any_constrained_executor<E, constraint_t<Wrapped>>{std::move(w)};
}

////////////////////////////////////////////////////////////////////////////////
// deduction guides
#if __cpp_deduction_guides >= 201703
any_constrained_executor() ->
    any_constrained_executor<
        std::exception_ptr,
        std::ptrdiff_t>;

PUSHMI_TEMPLATE(class Wrapped)
  (requires ConstrainedSenderTo<
      detail::not_any_constrained_executor<
          Wrapped,
          std::exception_ptr,
          constraint_t<Wrapped>>,
      any_receiver<
          std::exception_ptr,
          any_constrained_executor_ref<
              std::exception_ptr,
              constraint_t<Wrapped>>>>)
any_constrained_executor(Wrapped) ->
    any_constrained_executor<
        std::exception_ptr,
        constraint_t<Wrapped>>;
#endif

//
// define types for time executors

namespace detail {
template <class T>
using not_any_time_executor_ref_t = not_is_t<T, any_time_executor_ref>;
} // namespace detail

template<class E, class TP>
struct any_time_executor_ref {
private:
  using This = any_time_executor_ref;
  void* pobj_;
  struct vtable {
    TP (*now_)(void*);
    void (*submit_)(void*, TP, void*);
  } const *vptr_;
  template <class T>
  using wrapped_t = detail::not_any_time_executor_ref_t<T>;
public:
  using properties = property_set<is_time<>, is_executor<>, is_single<>>;

  any_time_executor_ref() = delete;
  any_time_executor_ref(const any_time_executor_ref&) = default;

  PUSHMI_TEMPLATE (class Wrapped)
    (requires TimeSender<wrapped_t<Wrapped>, is_single<>>)
    // (requires TimeSenderTo<wrapped_t<Wrapped>, receiver<E, This>>)
  any_time_executor_ref(Wrapped& w) {
    // This can't be a requirement because it asks if submit(w, now(w), any_receiver<E, T>)
    // is well-formed (where T is an alias for any_time_executor_ref). If w
    // has a submit that is constrained with ReceiverValue<any_receiver<E, T>, T'&>, that
    // will ask whether value(any_receiver<E, T>, T'&) is well-formed. And *that* will
    // ask whether T'& is convertible to T. That brings us right back to this
    // constructor. Constraint recursion!
    static_assert(
      TimeSenderTo<Wrapped, any_receiver<E, This>>,
      "Expecting to be passed a TimeSender that can send to a SingleReceiver"
      " that accpets a value of type This and an error of type E");
    struct s {
      static TP now(void* pobj) {
        return ::pushmi::now(*static_cast<Wrapped*>(pobj));
      }
      static void submit(void* pobj, TP tp, void* s) {
        return ::pushmi::submit(
          *static_cast<Wrapped*>(pobj),
          tp,
          std::move(*static_cast<any_receiver<E,This>*>(s)));
      }
    };
    static const vtable vtbl{s::now, s::submit};
    pobj_ = std::addressof(w);
    vptr_ = &vtbl;
  }
  std::chrono::system_clock::time_point top() {
    return vptr_->now_(pobj_);
  }
  any_time_executor_ref executor() { return *this; }
  template<class SingleReceiver>
  void submit(TP tp, SingleReceiver&& sa) {
    // static_assert(
    //   ConvertibleTo<SingleReceiver, any_receiver<E, This>>,
    //   "requires any_receiver<E, any_time_executor_ref<E, TP>>");
    any_receiver<E, This> s{(SingleReceiver&&) sa};
    vptr_->submit_(pobj_, tp, &s);
  }
};

////////////////////////////////////////////////////////////////////////////////
// make_any_time_executor_ref
template <
    class E = std::exception_ptr,
    class TP = std::chrono::system_clock::time_point>
auto make_any_time_executor_ref() {
  return any_time_executor_ref<E, TP>{};
}

PUSHMI_TEMPLATE (
    class E = std::exception_ptr,
    class Wrapped)
  (requires TimeSender<detail::not_any_time_executor_ref_t<Wrapped>, is_single<>>)
auto make_any_time_executor_ref(Wrapped& w) {
  return any_time_executor_ref<E, time_point_t<Wrapped>>{w};
}

////////////////////////////////////////////////////////////////////////////////
// deduction guides
#if __cpp_deduction_guides >= 201703
any_time_executor_ref() ->
    any_time_executor_ref<
        std::exception_ptr,
        std::chrono::system_clock::time_point>;

PUSHMI_TEMPLATE (class Wrapped)
  (requires TimeSender<detail::not_any_time_executor_ref_t<Wrapped>, is_single<>>)
any_time_executor_ref(Wrapped&) ->
    any_time_executor_ref<
        std::exception_ptr,
        time_point_t<Wrapped>>;
#endif

namespace detail {
template<class E, class TP>
using any_time_executor_base =
  any_time_single_sender<E, TP, any_time_executor_ref<E, TP>>;

template<class T, class E, class TP>
using not_any_time_executor =
  std::enable_if_t<
    !std::is_base_of<any_time_executor_base<E, TP>, std::decay_t<T>>::value,
    std::decay_t<T>>;
} // namespace detail

template <class E, class TP>
struct any_time_executor : detail::any_time_executor_base<E, TP> {
  using properties = property_set<is_time<>, is_executor<>, is_single<>>;
  constexpr any_time_executor() = default;
  using detail::any_time_executor_base<E, TP>::any_time_executor_base;
};

////////////////////////////////////////////////////////////////////////////////
// make_any_time_executor
template <
    class E = std::exception_ptr,
    class TP = std::chrono::system_clock::time_point>
auto make_any_time_executor() -> any_time_executor<E, TP> {
  return any_time_executor<E, TP>{};
}

PUSHMI_TEMPLATE(
    class E = std::exception_ptr,
    class Wrapped)
  (requires TimeSenderTo<
      detail::not_any_time_executor<Wrapped, E, time_point_t<Wrapped>>,
      any_receiver<E, any_time_executor_ref<E, time_point_t<Wrapped>>>>)
auto make_any_time_executor(Wrapped w) -> any_time_executor<E, time_point_t<Wrapped>> {
  return any_time_executor<E, time_point_t<Wrapped>>{std::move(w)};
}

////////////////////////////////////////////////////////////////////////////////
// deduction guides
#if __cpp_deduction_guides >= 201703
any_time_executor() ->
    any_time_executor<
        std::exception_ptr,
        std::chrono::system_clock::time_point>;

PUSHMI_TEMPLATE(class Wrapped)
  (requires TimeSenderTo<
      detail::not_any_time_executor<
          Wrapped,
          std::exception_ptr,
          time_point_t<Wrapped>>,
      any_receiver<
          std::exception_ptr,
          any_time_executor_ref<
              std::exception_ptr,
              time_point_t<Wrapped>>>>)
any_time_executor(Wrapped) ->
    any_time_executor<
        std::exception_ptr,
        time_point_t<Wrapped>>;
#endif

} // namespace pushmi
