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

#include <folly/experimental/pushmi/boosters.h>
#include <future>

namespace pushmi {

template <class E, class... VN>
class any_receiver {
  bool done_ = false;
  union data {
    void* pobj_ = nullptr;
    char buffer_[sizeof(std::promise<int>)]; // can hold a std::promise in-situ
  } data_{};
  template <class Wrapped>
  static constexpr bool insitu() noexcept {
    return sizeof(Wrapped) <= sizeof(data::buffer_) &&
        std::is_nothrow_move_constructible<Wrapped>::value;
  }
  struct vtable {
    static void s_op(data&, data*) {}
    static void s_done(data&) {}
    static void s_error(data&, E) noexcept {
      std::terminate();
    }
    static void s_value(data&, VN...) {}
    void (*op_)(data&, data*) = vtable::s_op;
    void (*done_)(data&) = vtable::s_done;
    void (*error_)(data&, E) noexcept = vtable::s_error;
    void (*value_)(data&, VN...) = vtable::s_value;
  };
  static constexpr vtable const noop_{};
  vtable const* vptr_ = &noop_;
  template <class T, class U = std::decay_t<T>>
  using wrapped_t = std::enable_if_t<!std::is_same<U, any_receiver>::value, U>;
  template <class Wrapped>
  static void check() {
    static_assert(
        ReceiveValue<Wrapped, VN...>,
        "Wrapped receiver must support values of type VN...");
    static_assert(
        ReceiveError<Wrapped, std::exception_ptr>,
        "Wrapped receiver must support std::exception_ptr and be noexcept");
    static_assert(
        NothrowInvocable<decltype(::pushmi::set_error), Wrapped, E>,
        "Wrapped receiver must support E and be noexcept");
  }
  template <class Wrapped>
  any_receiver(Wrapped obj, std::false_type) : any_receiver() {
    struct s {
      static void op(data& src, data* dst) {
        if (dst)
          dst->pobj_ = std::exchange(src.pobj_, nullptr);
        delete static_cast<Wrapped const*>(src.pobj_);
      }
      static void done(data& src) {
        ::pushmi::set_done(*static_cast<Wrapped*>(src.pobj_));
      }
      static void error(data& src, E e) noexcept {
        ::pushmi::set_error(*static_cast<Wrapped*>(src.pobj_), std::move(e));
      }
      static void value(data& src, VN... vn) {
        ::pushmi::set_value(
            *static_cast<Wrapped*>(src.pobj_), std::move(vn)...);
      }
    };
    static const vtable vtbl{s::op, s::done, s::error, s::value};
    data_.pobj_ = new Wrapped(std::move(obj));
    vptr_ = &vtbl;
  }
  template <class Wrapped>
  any_receiver(Wrapped obj, std::true_type) noexcept : any_receiver() {
    struct s {
      static void op(data& src, data* dst) {
        if (dst)
          new (dst->buffer_)
              Wrapped(std::move(*static_cast<Wrapped*>((void*)src.buffer_)));
        static_cast<Wrapped const*>((void*)src.buffer_)->~Wrapped();
      }
      static void done(data& src) {
        ::pushmi::set_done(*static_cast<Wrapped*>((void*)src.buffer_));
      }
      static void error(data& src, E e) noexcept {
        ::pushmi::set_error(
            *static_cast<Wrapped*>((void*)src.buffer_), std::move(e));
      }
      static void value(data& src, VN... vn) {
        ::pushmi::set_value(
            *static_cast<Wrapped*>((void*)src.buffer_), std::move(vn)...);
      }
    };
    static const vtable vtbl{s::op, s::done, s::error, s::value};
    new ((void*)data_.buffer_) Wrapped(std::move(obj));
    vptr_ = &vtbl;
  }

 public:
  using properties = property_set<is_receiver<>>;

  any_receiver() = default;
  any_receiver(any_receiver&& that) noexcept : any_receiver() {
    that.vptr_->op_(that.data_, &data_);
    std::swap(that.vptr_, vptr_);
  }
  PUSHMI_TEMPLATE(class Wrapped)
  (requires ReceiveValue<wrapped_t<Wrapped>, VN...>&& ReceiveError<
      Wrapped,
      E>)
  explicit any_receiver(Wrapped obj) noexcept(insitu<Wrapped>())
      : any_receiver{std::move(obj), bool_<insitu<Wrapped>()>{}} {
    check<Wrapped>();
  }
  ~any_receiver() {
    vptr_->op_(data_, nullptr);
  }
  any_receiver& operator=(any_receiver&& that) noexcept {
    this->~any_receiver();
    new ((void*)this) any_receiver(std::move(that));
    return *this;
  }
  void value(VN&&... vn) {
    if (!done_) {
      // done_ = true;
      vptr_->value_(data_, (VN &&) vn...);
    }
  }
  void error(E e) noexcept {
    if (!done_) {
      done_ = true;
      vptr_->error_(data_, std::move(e));
    }
  }
  void done() {
    if (!done_) {
      done_ = true;
      vptr_->done_(data_);
    }
  }
};

// Class static definitions:
template <class E, class... VN>
constexpr
    typename any_receiver<E, VN...>::vtable const any_receiver<E, VN...>::noop_;

template <class VF, class EF, class DF>
#if __cpp_concepts
requires Invocable<DF&>
#endif
class receiver<VF, EF, DF> {
  bool done_ = false;
  VF vf_;
  EF ef_;
  DF df_;

  static_assert(
      !detail::is_v<VF, on_error_fn>,
      "the first parameter is the value implementation, but on_error{} was passed");
  static_assert(
      !detail::is_v<EF, on_value_fn>,
      "the second parameter is the error implementation, but on_value{} was passed");
  static_assert(
      NothrowInvocable<EF&, std::exception_ptr>,
      "error function must be noexcept and support std::exception_ptr");

 public:
  using properties = property_set<is_receiver<>>;

  receiver() = default;
  constexpr explicit receiver(VF vf) : receiver(std::move(vf), EF{}, DF{}) {}
  constexpr explicit receiver(EF ef) : receiver(VF{}, std::move(ef), DF{}) {}
  constexpr explicit receiver(DF df) : receiver(VF{}, EF{}, std::move(df)) {}
  constexpr receiver(EF ef, DF df)
      : done_(false), vf_(), ef_(std::move(ef)), df_(std::move(df)) {}
  constexpr receiver(VF vf, EF ef, DF df = DF{})
      : done_(false),
        vf_(std::move(vf)),
        ef_(std::move(ef)),
        df_(std::move(df)) {}

  PUSHMI_TEMPLATE(class... VN)
  (requires Invocable<VF&, VN...>)
  void value(VN&&... vn) {
    if (done_) {
      return;
    }
    // done_ = true;
    vf_((VN &&) vn...);
  }
  PUSHMI_TEMPLATE(class E)
  (requires Invocable<EF&, E>)
  void error(E e) noexcept {
    static_assert(NothrowInvocable<EF&, E>, "error function must be noexcept");
    if (!done_) {
      done_ = true;
      ef_(std::move(e));
    }
  }
  void done() {
    if (!done_) {
      done_ = true;
      df_();
    }
  }
};

template <
    PUSHMI_TYPE_CONSTRAINT(Receiver) Data,
    class DVF,
    class DEF,
    class DDF>
#if __cpp_concepts
requires Invocable<DDF&, Data&>
#endif
class receiver<Data, DVF, DEF, DDF> {
  bool done_ = false;
  Data data_;
  DVF vf_;
  DEF ef_;
  DDF df_;

  static_assert(
      !detail::is_v<DVF, on_error_fn>,
      "the first parameter is the value implementation, but on_error{} was passed");
  static_assert(
      !detail::is_v<DEF, on_value_fn>,
      "the second parameter is the error implementation, but on_value{} was passed");
  static_assert(
      Invocable<DEF, Data&, std::exception_ptr>,
      "error function must support std::exception_ptr");
  static_assert(
      NothrowInvocable<DEF, Data&, std::exception_ptr>,
      "error function must be noexcept");

 public:
  using properties =
      property_set_insert_t<properties_t<Data>, property_set<is_receiver<>>>;

  constexpr explicit receiver(Data d)
      : receiver(std::move(d), DVF{}, DEF{}, DDF{}) {}
  constexpr receiver(Data d, DDF df)
      : done_(false), data_(std::move(d)), vf_(), ef_(), df_(df) {}
  constexpr receiver(Data d, DEF ef, DDF df = DDF{})
      : done_(false), data_(std::move(d)), vf_(), ef_(ef), df_(df) {}
  constexpr receiver(Data d, DVF vf, DEF ef = DEF{}, DDF df = DDF{})
      : done_(false), data_(std::move(d)), vf_(vf), ef_(ef), df_(df) {}

  Data& data() {
    return data_;
  }

  PUSHMI_TEMPLATE(class... VN)
  (requires Invocable<DVF&, Data&, VN...>)
  void value(VN&&... vn) {
    if (!done_) {
      // done_ = true;
      vf_(data_, (VN &&) vn...);
    }
  }
  PUSHMI_TEMPLATE(class E)
  (requires Invocable<DEF&, Data&, E>)
  void error(E e) noexcept {
    static_assert(
        NothrowInvocable<DEF&, Data&, E>, "error function must be noexcept");
    if (!done_) {
      done_ = true;
      ef_(data_, std::move(e));
    }
  }
  void done() {
    if (!done_) {
      done_ = true;
      df_(data_);
    }
  }
};

template <>
class receiver<> : public receiver<ignoreVF, abortEF, ignoreDF> {
 public:
  receiver() = default;
};

PUSHMI_CONCEPT_DEF(
  template (class T)
  concept ReceiverDataArg,
    Receiver<T> &&
    not Invocable<T&>
);

////////////////////////////////////////////////////////////////////////////////
// make_receiver
PUSHMI_INLINE_VAR constexpr struct make_receiver_fn {
  inline auto operator()() const {
    return receiver<>{};
  }
  PUSHMI_TEMPLATE(class VF)
    (requires PUSHMI_EXP(
      lazy::True<>
      PUSHMI_BROKEN_SUBSUMPTION(PUSHMI_AND not lazy::ReceiverDataArg<VF>)))
  auto operator()(VF vf) const {
    return receiver<VF, abortEF, ignoreDF>{std::move(vf)};
  }
  template <class... EFN>
  auto operator()(on_error_fn<EFN...> ef) const {
    return receiver<ignoreVF, on_error_fn<EFN...>, ignoreDF>{std::move(ef)};
  }
  template <class... DFN>
  auto operator()(on_done_fn<DFN...> df) const {
    return receiver<ignoreVF, abortEF, on_done_fn<DFN...>>{std::move(df)};
  }
  PUSHMI_TEMPLATE(class VF, class EF)
    (requires PUSHMI_EXP(
      lazy::True<>
      PUSHMI_BROKEN_SUBSUMPTION(PUSHMI_AND
        not lazy::ReceiverDataArg<VF> PUSHMI_AND
        not lazy::Invocable<EF&>)))
  auto operator()(VF vf, EF ef) const {
    return receiver<VF, EF, ignoreDF>{std::move(vf), std::move(ef)};
  }
  PUSHMI_TEMPLATE(class EF, class DF)
    (requires PUSHMI_EXP(
      lazy::True<> PUSHMI_AND
      lazy::Invocable<DF&>
      PUSHMI_BROKEN_SUBSUMPTION(PUSHMI_AND not lazy::ReceiverDataArg<EF>)))
  auto operator()(EF ef, DF df) const {
    return receiver<ignoreVF, EF, DF>{std::move(ef), std::move(df)};
  }
  PUSHMI_TEMPLATE(class VF, class EF, class DF)
    (requires PUSHMI_EXP(
      lazy::True<> PUSHMI_AND
      lazy::Invocable<DF&>
      PUSHMI_BROKEN_SUBSUMPTION(PUSHMI_AND not lazy::ReceiverDataArg<VF>)))
  auto operator()(VF vf, EF ef, DF df) const {
    return receiver<VF, EF, DF>{std::move(vf), std::move(ef), std::move(df)};
  }
  PUSHMI_TEMPLATE(class Data)
    (requires PUSHMI_EXP(
      lazy::True<> PUSHMI_AND
      lazy::ReceiverDataArg<Data>))
  auto operator()(Data d) const {
    return receiver<Data, passDVF, passDEF, passDDF>{std::move(d)};
  }
  PUSHMI_TEMPLATE(class Data, class DVF)
    (requires PUSHMI_EXP(
      lazy::True<> PUSHMI_AND
      lazy::ReceiverDataArg<Data>))
  auto operator()(Data d, DVF vf) const {
    return receiver<Data, DVF, passDEF, passDDF>{std::move(d), std::move(vf)};
  }
  PUSHMI_TEMPLATE(class Data, class... DEFN)
    (requires PUSHMI_EXP(
      lazy::True<> PUSHMI_AND
      lazy::ReceiverDataArg<Data>))
  auto operator()(Data d, on_error_fn<DEFN...> ef) const {
    return receiver<Data, passDVF, on_error_fn<DEFN...>, passDDF>{std::move(d), std::move(ef)};
  }
  PUSHMI_TEMPLATE(class Data, class... DDFN)
    (requires PUSHMI_EXP(
      lazy::True<> PUSHMI_AND
      lazy::ReceiverDataArg<Data>))
  auto operator()(Data d, on_done_fn<DDFN...> df) const {
    return receiver<Data, passDVF, passDEF, on_done_fn<DDFN...>>{std::move(d), std::move(df)};
  }
  PUSHMI_TEMPLATE(class Data, class DVF, class... DEFN)
    (requires PUSHMI_EXP(
      lazy::True<> PUSHMI_AND
      lazy::ReceiverDataArg<Data>))
  auto operator()(Data d, DVF vf, on_error_fn<DEFN...> ef) const {
    return receiver<Data, DVF, on_error_fn<DEFN...>, passDDF>{std::move(d), std::move(vf), std::move(ef)};
  }
  PUSHMI_TEMPLATE(class Data, class DEF, class... DDFN)
    (requires PUSHMI_EXP(
      lazy::True<> PUSHMI_AND
      lazy::ReceiverDataArg<Data>))
  auto operator()(Data d, DEF ef, on_done_fn<DDFN...> df) const {
    return receiver<Data, passDVF, DEF, on_done_fn<DDFN...>>{std::move(d), std::move(ef), std::move(df)};
  }
  PUSHMI_TEMPLATE(class Data, class DVF, class DEF, class DDF)
    (requires PUSHMI_EXP(
      lazy::True<> PUSHMI_AND
      lazy::ReceiverDataArg<Data> PUSHMI_AND
      lazy::Invocable<DDF&, Data&>))
  auto operator()(Data d, DVF vf, DEF ef, DDF df) const {
    return receiver<Data, DVF, DEF, DDF>{std::move(d), std::move(vf), std::move(ef), std::move(df)};
  }
} const make_receiver {};

////////////////////////////////////////////////////////////////////////////////
// deduction guides
#if __cpp_deduction_guides >= 201703
receiver() -> receiver<>;

PUSHMI_TEMPLATE(class VF)
  (requires PUSHMI_EXP(
    True<>
    PUSHMI_BROKEN_SUBSUMPTION(PUSHMI_AND not lazy::Receiver<VF>)))
receiver(VF) -> receiver<VF, abortEF, ignoreDF>;

template <class... EFN>
receiver(on_error_fn<EFN...>) -> receiver<ignoreVF, on_error_fn<EFN...>, ignoreDF>;

template <class... DFN>
receiver(on_done_fn<DFN...>) -> receiver<ignoreVF, abortEF, on_done_fn<DFN...>>;

PUSHMI_TEMPLATE(class VF, class EF)
  (requires PUSHMI_EXP(
    lazy::True<>
    PUSHMI_BROKEN_SUBSUMPTION(PUSHMI_AND
      not lazy::ReceiverDataArg<VF> PUSHMI_AND
      not lazy::Invocable<EF&>)))
receiver(VF, EF) -> receiver<VF, EF, ignoreDF>;

PUSHMI_TEMPLATE(class EF, class DF)
  (requires PUSHMI_EXP(
    lazy::True<> PUSHMI_AND
    lazy::Invocable<DF&>
    PUSHMI_BROKEN_SUBSUMPTION(PUSHMI_AND not lazy::ReceiverDataArg<EF>)))
receiver(EF, DF) -> receiver<ignoreVF, EF, DF>;

PUSHMI_TEMPLATE(class VF, class EF, class DF)
  (requires PUSHMI_EXP(
    lazy::True<> PUSHMI_AND
    lazy::Invocable<DF&>
    PUSHMI_BROKEN_SUBSUMPTION(PUSHMI_AND not lazy::ReceiverDataArg<VF>)))
receiver(VF, EF, DF) -> receiver<VF, EF, DF>;

PUSHMI_TEMPLATE(class Data)
  (requires PUSHMI_EXP(
    lazy::True<> PUSHMI_AND
    lazy::ReceiverDataArg<Data>))
receiver(Data d) -> receiver<Data, passDVF, passDEF, passDDF>;

PUSHMI_TEMPLATE(class Data, class DVF)
  (requires PUSHMI_EXP(
    lazy::True<> PUSHMI_AND
    lazy::ReceiverDataArg<Data>))
receiver(Data d, DVF vf) -> receiver<Data, DVF, passDEF, passDDF>;

PUSHMI_TEMPLATE(class Data, class... DEFN)
  (requires PUSHMI_EXP(
    lazy::True<> PUSHMI_AND
    lazy::ReceiverDataArg<Data>))
receiver(Data d, on_error_fn<DEFN...>) ->
    receiver<Data, passDVF, on_error_fn<DEFN...>, passDDF>;

PUSHMI_TEMPLATE(class Data, class... DDFN)
  (requires PUSHMI_EXP(
    lazy::True<> PUSHMI_AND
    lazy::ReceiverDataArg<Data>))
receiver(Data d, on_done_fn<DDFN...>) ->
    receiver<Data, passDVF, passDEF, on_done_fn<DDFN...>>;

PUSHMI_TEMPLATE(class Data, class DVF, class... DEFN)
  (requires PUSHMI_EXP(
    lazy::True<> PUSHMI_AND
    lazy::ReceiverDataArg<Data>))
receiver(Data d, DVF vf, on_error_fn<DEFN...> ef) -> receiver<Data, DVF, on_error_fn<DEFN...>, passDDF>;

PUSHMI_TEMPLATE(class Data, class DEF, class... DDFN)
  (requires PUSHMI_EXP(
    lazy::True<> PUSHMI_AND
    lazy::ReceiverDataArg<Data>
    PUSHMI_BROKEN_SUBSUMPTION(PUSHMI_AND not lazy::Invocable<DEF&, Data&>)))
receiver(Data d, DEF, on_done_fn<DDFN...>) -> receiver<Data, passDVF, DEF, on_done_fn<DDFN...>>;

PUSHMI_TEMPLATE(class Data, class DVF, class DEF, class DDF)
  (requires PUSHMI_EXP(
    lazy::True<> PUSHMI_AND
    lazy::ReceiverDataArg<Data>PUSHMI_AND
    lazy::Invocable<DDF&, Data&>))
receiver(Data d, DVF vf, DEF ef, DDF df) -> receiver<Data, DVF, DEF, DDF>;
#endif

template<>
struct construct_deduced<receiver> : make_receiver_fn {};

PUSHMI_TEMPLATE (class T, class In)
  (requires SenderTo<In, std::promise<T>, is_single<>>)
std::future<T> future_from(In in) {
  std::promise<T> p;
  auto result = p.get_future();
  submit(in, std::move(p));
  return result;
}
PUSHMI_TEMPLATE (class In)
  (requires SenderTo<In, std::promise<void>, is_single<>>)
std::future<void> future_from(In in) {
  std::promise<void> p;
  auto result = p.get_future();
  submit(in, std::move(p));
  return result;
}

} // namespace pushmi
