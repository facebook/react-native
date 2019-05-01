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

#include <folly/experimental/pushmi/receiver.h>

namespace pushmi {

template <class PE, class PV, class E, class... VN>
class any_flow_receiver {
  bool done_ = false;
  bool started_ = false;
  union data {
    void* pobj_ = nullptr;
    char buffer_[sizeof(std::tuple<VN...>)]; // can hold V in-situ
  } data_{};
  template <class Wrapped>
  static constexpr bool insitu() {
    return sizeof(Wrapped) <= sizeof(data::buffer_) &&
        std::is_nothrow_move_constructible<Wrapped>::value;
  }
  struct vtable {
    static void s_op(data&, data*) {}
    static void s_done(data&) {}
    static void s_error(data&, E) noexcept { std::terminate(); }
    static void s_value(data&, VN...) {}
    static void s_starting(data&, any_receiver<PE, PV>) {}
    void (*op_)(data&, data*) = vtable::s_op;
    void (*done_)(data&) = vtable::s_done;
    void (*error_)(data&, E) noexcept = vtable::s_error;
    void (*value_)(data&, VN...) = vtable::s_value;
    void (*starting_)(data&, any_receiver<PE, PV>) = vtable::s_starting;
  };
  static constexpr vtable const noop_ {};
  vtable const* vptr_ = &noop_;
  template <class Wrapped>
  any_flow_receiver(Wrapped obj, std::false_type) : any_flow_receiver() {
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
        ::pushmi::set_value(*static_cast<Wrapped*>(src.pobj_), std::move(vn)...);
      }
      static void starting(data& src, any_receiver<PE, PV> up) {
        ::pushmi::set_starting(*static_cast<Wrapped*>(src.pobj_), std::move(up));
      }
    };
    static const vtable vtbl{s::op, s::done, s::error, s::value, s::starting};
    data_.pobj_ = new Wrapped(std::move(obj));
    vptr_ = &vtbl;
  }
  template <class Wrapped>
  any_flow_receiver(Wrapped obj, std::true_type) noexcept : any_flow_receiver() {
    struct s {
      static void op(data& src, data* dst) {
        if (dst)
          new (dst->buffer_) Wrapped(
              std::move(*static_cast<Wrapped*>((void*)src.buffer_)));
        static_cast<Wrapped const*>((void*)src.buffer_)->~Wrapped();
      }
      static void done(data& src) {
        ::pushmi::set_done(*static_cast<Wrapped*>((void*)src.buffer_));
      }
      static void error(data& src, E e) noexcept {::pushmi::set_error(
          *static_cast<Wrapped*>((void*)src.buffer_),
          std::move(e));
      }
      static void value(data& src, VN... vn) {
        ::pushmi::set_value(
            *static_cast<Wrapped*>((void*)src.buffer_), std::move(vn)...);
      }
      static void starting(data& src, any_receiver<PE, PV> up) {
        ::pushmi::set_starting(*static_cast<Wrapped*>((void*)src.buffer_), std::move(up));
      }
    };
    static const vtable vtbl{s::op, s::done, s::error, s::value, s::starting};
    new (data_.buffer_) Wrapped(std::move(obj));
    vptr_ = &vtbl;
  }
  template <class T, class U = std::decay_t<T>>
  using wrapped_t =
    std::enable_if_t<!std::is_same<U, any_flow_receiver>::value, U>;
public:
  using properties = property_set<is_receiver<>, is_flow<>>;

  any_flow_receiver() = default;
  any_flow_receiver(any_flow_receiver&& that) noexcept : any_flow_receiver() {
    that.vptr_->op_(that.data_, &data_);
    std::swap(that.vptr_, vptr_);
  }
  PUSHMI_TEMPLATE(class Wrapped)
    (requires FlowUpTo<wrapped_t<Wrapped>, any_receiver<PE, PV>> &&
      ReceiveValue<wrapped_t<Wrapped>, VN...> &&
      ReceiveError<wrapped_t<Wrapped>, E>)
  explicit any_flow_receiver(Wrapped obj) noexcept(insitu<Wrapped>())
    : any_flow_receiver{std::move(obj), bool_<insitu<Wrapped>()>{}} {}
  ~any_flow_receiver() {
    vptr_->op_(data_, nullptr);
  }
  any_flow_receiver& operator=(any_flow_receiver&& that) noexcept {
    this->~any_flow_receiver();
    new ((void*)this) any_flow_receiver(std::move(that));
    return *this;
  }
  void value(VN... vn) {
    if (!started_) {std::abort();}
    if (done_){ return; }
    vptr_->value_(data_, std::move(vn)...);
  }
  void error(E e) noexcept {
    if (!started_) {std::abort();}
    if (done_){ return; }
    done_ = true;
    vptr_->error_(data_, std::move(e));
  }
  void done() {
    if (!started_) {std::abort();}
    if (done_){ return; }
    done_ = true;
    vptr_->done_(data_);
  }

  void starting(any_receiver<PE, PV> up) {
    if (started_) {std::abort();}
    started_ = true;
    vptr_->starting_(data_, std::move(up));
  }
};

// Class static definitions:
template <class PE, class PV, class E, class... VN>
constexpr typename any_flow_receiver<PE, PV, E, VN...>::vtable const
  any_flow_receiver<PE, PV, E, VN...>::noop_;

template <class VF, class EF, class DF, class StrtF>
#if __cpp_concepts
  requires Invocable<DF&>
#endif
class flow_receiver<VF, EF, DF, StrtF> {
  bool done_ = false;
  bool started_ = false;
  VF nf_;
  EF ef_;
  DF df_;
  StrtF strtf_;

 public:
  using properties = property_set<is_receiver<>, is_flow<>>;

  static_assert(
      !detail::is_v<VF, on_error_fn>,
      "the first parameter is the value implementation, but on_error{} was passed");
  static_assert(
      !detail::is_v<EF, on_value_fn>,
      "the second parameter is the error implementation, but on_value{} was passed");

  flow_receiver() = default;
  constexpr explicit flow_receiver(VF nf)
      : flow_receiver(std::move(nf), EF{}, DF{}) {}
  constexpr explicit flow_receiver(EF ef)
      : flow_receiver(VF{}, std::move(ef), DF{}) {}
  constexpr explicit flow_receiver(DF df)
      : flow_receiver(VF{}, EF{}, std::move(df)) {}
  constexpr flow_receiver(EF ef, DF df)
      : nf_(), ef_(std::move(ef)), df_(std::move(df)) {}
  constexpr flow_receiver(
      VF nf,
      EF ef,
      DF df = DF{},
      StrtF strtf = StrtF{})
      : nf_(std::move(nf)),
        ef_(std::move(ef)),
        df_(std::move(df)),
        strtf_(std::move(strtf)) {}
  PUSHMI_TEMPLATE (class V)
    (requires Invocable<VF&, V>)
  void value(V&& v) {
    if (!started_) {std::abort();}
    if (done_){ return; }
    nf_((V&&) v);
  }
  PUSHMI_TEMPLATE (class E)
    (requires Invocable<EF&, E>)
  void error(E e) noexcept {
    static_assert(NothrowInvocable<EF&, E>, "error function must be noexcept");
    if (!started_) {std::abort();}
    if (done_){ return; }
    done_ = true;
    ef_(std::move(e));
  }
  void done() {
    if (!started_) {std::abort();}
    if (done_){ return; }
    done_ = true;
    df_();
  }
  PUSHMI_TEMPLATE(class Up)
    (requires Invocable<StrtF&, Up&&>)
  void starting(Up&& up) {
    if (started_) {std::abort();}
    started_ = true;
    strtf_( (Up &&) up);
  }
};

template<
    PUSHMI_TYPE_CONSTRAINT(Receiver) Data,
    class DVF,
    class DEF,
    class DDF,
    class DStrtF>
#if __cpp_concepts
  requires Invocable<DDF&, Data&>
#endif
class flow_receiver<Data, DVF, DEF, DDF, DStrtF> {
  bool done_ = false;
  bool started_ = false;
  Data data_;
  DVF nf_;
  DEF ef_;
  DDF df_;
  DStrtF strtf_;

 public:
  using properties = property_set_insert_t<properties_t<Data>, property_set<is_receiver<>, is_flow<>>>;

  static_assert(
      !detail::is_v<DVF, on_error_fn>,
      "the first parameter is the value implementation, but on_error{} was passed");
  static_assert(
      !detail::is_v<DEF, on_value_fn>,
      "the second parameter is the error implementation, but on_value{} was passed");

  constexpr explicit flow_receiver(Data d)
      : flow_receiver(std::move(d), DVF{}, DEF{}, DDF{}) {}
  constexpr flow_receiver(Data d, DDF df)
      : data_(std::move(d)), nf_(), ef_(), df_(df) {}
  constexpr flow_receiver(Data d, DEF ef, DDF df = DDF{})
      : data_(std::move(d)), nf_(), ef_(ef), df_(df) {}
  constexpr flow_receiver(
      Data d,
      DVF nf,
      DEF ef = DEF{},
      DDF df = DDF{},
      DStrtF strtf = DStrtF{})
      : data_(std::move(d)),
        nf_(nf),
        ef_(ef),
        df_(df),
        strtf_(std::move(strtf)) {}


  Data& data() { return data_; }

  PUSHMI_TEMPLATE (class V)
    (requires Invocable<DVF&, Data&, V>)
  void value(V&& v) {
    if (!started_) {std::abort();}
    if (done_){ return; }
    nf_(data_, (V&&) v);
  }
  PUSHMI_TEMPLATE (class E)
    (requires Invocable<DEF&, Data&, E>)
  void error(E&& e) noexcept {
    static_assert(
        NothrowInvocable<DEF&, Data&, E>, "error function must be noexcept");
    if (!started_) {std::abort();}
    if (done_){ return; }
    done_ = true;
    ef_(data_, (E&&) e);
  }
  void done() {
    if (!started_) {std::abort();}
    if (done_){ return; }
    done_ = true;
    df_(data_);
  }
  PUSHMI_TEMPLATE (class Up)
    (requires Invocable<DStrtF&, Data&, Up&&>)
  void starting(Up&& up) {
    if (started_) {std::abort();}
    started_ = true;
    strtf_(data_, (Up &&) up);
  }
};

template <>
class flow_receiver<>
    : public flow_receiver<ignoreVF, abortEF, ignoreDF, ignoreStrtF> {
};

PUSHMI_CONCEPT_DEF(
  template (class T)
  concept FlowReceiverDataArg,
    Receiver<T, is_flow<>> &&
    not Invocable<T&>
);

// TODO winnow down the number of make_flow_receiver overloads and deduction
// guides here, as was done for make_many.

////////////////////////////////////////////////////////////////////////////////
// make_flow_receiver
PUSHMI_INLINE_VAR constexpr struct make_flow_receiver_fn {
  inline auto operator()() const {
    return flow_receiver<>{};
  }
  PUSHMI_TEMPLATE (class VF)
    (requires PUSHMI_EXP(
      lazy::True<>
      PUSHMI_BROKEN_SUBSUMPTION(PUSHMI_AND
        not lazy::FlowReceiverDataArg<VF>)))
  auto operator()(VF nf) const {
    return flow_receiver<VF, abortEF, ignoreDF, ignoreStrtF>{
      std::move(nf)};
  }
  template <class... EFN>
  auto operator()(on_error_fn<EFN...> ef) const {
    return flow_receiver<ignoreVF, on_error_fn<EFN...>, ignoreDF, ignoreStrtF>{
      std::move(ef)};
  }
  template <class... DFN>
  auto operator()(on_done_fn<DFN...> df) const {
    return flow_receiver<ignoreVF, abortEF, on_done_fn<DFN...>, ignoreStrtF>{
      std::move(df)};
  }
  PUSHMI_TEMPLATE (class VF, class EF)
    (requires PUSHMI_EXP(
      lazy::True<>
      PUSHMI_BROKEN_SUBSUMPTION(PUSHMI_AND
        not lazy::FlowReceiverDataArg<VF> PUSHMI_AND
        not lazy::Invocable<EF&>)))
  auto operator()(VF nf, EF ef) const {
    return flow_receiver<VF, EF, ignoreDF, ignoreStrtF>{std::move(nf),
      std::move(ef)};
  }
  PUSHMI_TEMPLATE(class EF, class DF)
    (requires PUSHMI_EXP(
      lazy::True<> PUSHMI_AND
      lazy::Invocable<DF&>
      PUSHMI_BROKEN_SUBSUMPTION(PUSHMI_AND
        not lazy::FlowReceiverDataArg<EF>)))
  auto operator()(EF ef, DF df) const {
    return flow_receiver<ignoreVF, EF, DF, ignoreStrtF>{std::move(ef), std::move(df)};
  }
  PUSHMI_TEMPLATE (class VF, class EF, class DF)
    (requires PUSHMI_EXP(
      lazy::Invocable<DF&>
      PUSHMI_BROKEN_SUBSUMPTION(PUSHMI_AND
        not lazy::FlowReceiverDataArg<VF>)))
  auto operator()(VF nf, EF ef, DF df) const {
    return flow_receiver<VF, EF, DF, ignoreStrtF>{std::move(nf),
      std::move(ef), std::move(df)};
  }
  PUSHMI_TEMPLATE (class VF, class EF, class DF, class StrtF)
    (requires PUSHMI_EXP(
      lazy::Invocable<DF&>
      PUSHMI_BROKEN_SUBSUMPTION(PUSHMI_AND
        not lazy::FlowReceiverDataArg<VF>)))
  auto operator()(VF nf, EF ef, DF df, StrtF strtf) const {
    return flow_receiver<VF, EF, DF, StrtF>{std::move(nf), std::move(ef),
      std::move(df), std::move(strtf)};
  }
  PUSHMI_TEMPLATE(class Data)
    (requires PUSHMI_EXP(
      lazy::True<> PUSHMI_AND
      lazy::FlowReceiverDataArg<Data>))
  auto operator()(Data d) const {
    return flow_receiver<Data, passDVF, passDEF, passDDF, passDStrtF>{
        std::move(d)};
  }
  PUSHMI_TEMPLATE(class Data, class DVF)
    (requires PUSHMI_EXP(
      lazy::True<> PUSHMI_AND
      lazy::FlowReceiverDataArg<Data>))
  auto operator()(Data d, DVF nf) const {
    return flow_receiver<Data, DVF, passDEF, passDDF, passDStrtF>{
      std::move(d), std::move(nf)};
  }
  PUSHMI_TEMPLATE(class Data, class... DEFN)
    (requires PUSHMI_EXP(
      lazy::FlowReceiverDataArg<Data>))
  auto operator()(Data d, on_error_fn<DEFN...> ef) const {
    return flow_receiver<Data, passDVF, on_error_fn<DEFN...>, passDDF, passDStrtF>{
      std::move(d), std::move(ef)};
  }
  PUSHMI_TEMPLATE(class Data, class... DDFN)
    (requires PUSHMI_EXP(
      lazy::FlowReceiverDataArg<Data>))
  auto operator()(Data d, on_done_fn<DDFN...> df) const {
    return flow_receiver<Data, passDVF, passDEF, on_done_fn<DDFN...>, passDStrtF>{
      std::move(d), std::move(df)};
  }
  PUSHMI_TEMPLATE(class Data, class DVF, class DEF)
    (requires PUSHMI_EXP(
      lazy::FlowReceiverDataArg<Data>
      PUSHMI_BROKEN_SUBSUMPTION(PUSHMI_AND
        not lazy::Invocable<DEF&, Data&>)))
  auto operator()(Data d, DVF nf, DEF ef) const {
    return flow_receiver<Data, DVF, DEF, passDDF, passDStrtF>{std::move(d), std::move(nf), std::move(ef)};
  }
  PUSHMI_TEMPLATE(class Data, class DEF, class DDF)
    (requires PUSHMI_EXP(
      lazy::FlowReceiverDataArg<Data> PUSHMI_AND
      lazy::Invocable<DDF&, Data&>))
  auto operator()(Data d, DEF ef, DDF df) const {
    return flow_receiver<Data, passDVF, DEF, DDF, passDStrtF>{
      std::move(d), std::move(ef), std::move(df)};
  }
  PUSHMI_TEMPLATE(class Data, class DVF, class DEF, class DDF)
    (requires PUSHMI_EXP(
      lazy::FlowReceiverDataArg<Data> PUSHMI_AND
      lazy::Invocable<DDF&, Data&>))
  auto operator()(Data d, DVF nf, DEF ef, DDF df) const {
    return flow_receiver<Data, DVF, DEF, DDF, passDStrtF>{std::move(d),
      std::move(nf), std::move(ef), std::move(df)};
  }
  PUSHMI_TEMPLATE(class Data, class DVF, class DEF, class DDF, class DStrtF)
    (requires PUSHMI_EXP(
      lazy::FlowReceiverDataArg<Data> PUSHMI_AND
      lazy::Invocable<DDF&, Data&>))
  auto operator()(Data d, DVF nf, DEF ef, DDF df, DStrtF strtf) const {
    return flow_receiver<Data, DVF, DEF, DDF, DStrtF>{std::move(d),
      std::move(nf), std::move(ef), std::move(df), std::move(strtf)};
  }
} const make_flow_receiver {};

////////////////////////////////////////////////////////////////////////////////
// deduction guides
#if __cpp_deduction_guides >= 201703
flow_receiver() -> flow_receiver<>;

PUSHMI_TEMPLATE(class VF)
  (requires PUSHMI_EXP(
    lazy::True<>
    PUSHMI_BROKEN_SUBSUMPTION(PUSHMI_AND
      not lazy::FlowReceiverDataArg<VF>)))
flow_receiver(VF) ->
  flow_receiver<VF, abortEF, ignoreDF, ignoreStrtF>;

template <class... EFN>
flow_receiver(on_error_fn<EFN...>) ->
  flow_receiver<ignoreVF, on_error_fn<EFN...>, ignoreDF, ignoreStrtF>;

template <class... DFN>
flow_receiver(on_done_fn<DFN...>) ->
  flow_receiver<ignoreVF, abortEF, on_done_fn<DFN...>, ignoreStrtF>;

PUSHMI_TEMPLATE(class VF, class EF)
  (requires PUSHMI_EXP(
    lazy::True<>
    PUSHMI_BROKEN_SUBSUMPTION(PUSHMI_AND
      not lazy::FlowReceiverDataArg<VF> PUSHMI_AND
      not lazy::Invocable<EF&>)))
flow_receiver(VF, EF) ->
  flow_receiver<VF, EF, ignoreDF, ignoreStrtF>;

PUSHMI_TEMPLATE(class EF, class DF)
  (requires PUSHMI_EXP(
    lazy::True<> PUSHMI_AND
    lazy::Invocable<DF&>
    PUSHMI_BROKEN_SUBSUMPTION(PUSHMI_AND
      not lazy::FlowReceiverDataArg<EF>)))
flow_receiver(EF, DF) ->
  flow_receiver<ignoreVF, EF, DF, ignoreStrtF>;

PUSHMI_TEMPLATE(class VF, class EF, class DF)
  (requires PUSHMI_EXP(
    lazy::Invocable<DF&>
    PUSHMI_BROKEN_SUBSUMPTION(PUSHMI_AND
      not lazy::FlowReceiverDataArg<VF>)))
flow_receiver(VF, EF, DF) ->
  flow_receiver<VF, EF, DF, ignoreStrtF>;

PUSHMI_TEMPLATE(class VF, class EF, class DF, class StrtF)
  (requires PUSHMI_EXP(
    lazy::Invocable<DF&>
    PUSHMI_BROKEN_SUBSUMPTION(PUSHMI_AND
      not lazy::FlowReceiverDataArg<VF>)))
flow_receiver(VF, EF, DF, StrtF) ->
  flow_receiver<VF, EF, DF, StrtF>;

PUSHMI_TEMPLATE(class Data)
  (requires PUSHMI_EXP(
    lazy::True<> PUSHMI_AND
    lazy::FlowReceiverDataArg<Data>))
flow_receiver(Data d) ->
  flow_receiver<Data, passDVF, passDEF, passDDF, passDStrtF>;

PUSHMI_TEMPLATE(class Data, class DVF)
  (requires PUSHMI_EXP(
    lazy::True<> PUSHMI_AND
    lazy::FlowReceiverDataArg<Data>))
flow_receiver(Data d, DVF nf) ->
  flow_receiver<Data, DVF, passDEF, passDDF, passDStrtF>;

PUSHMI_TEMPLATE(class Data, class... DEFN)
  (requires PUSHMI_EXP(
    lazy::FlowReceiverDataArg<Data>))
flow_receiver(Data d, on_error_fn<DEFN...>) ->
  flow_receiver<Data, passDVF, on_error_fn<DEFN...>, passDDF, passDStrtF>;

PUSHMI_TEMPLATE(class Data, class... DDFN)
  (requires PUSHMI_EXP(
    lazy::FlowReceiverDataArg<Data>))
flow_receiver(Data d, on_done_fn<DDFN...>) ->
  flow_receiver<Data, passDVF, passDEF, on_done_fn<DDFN...>, passDStrtF>;

PUSHMI_TEMPLATE(class Data, class DDF)
  (requires PUSHMI_EXP(
    lazy::True<> PUSHMI_AND
    lazy::FlowReceiverDataArg<Data> PUSHMI_AND
    lazy::Invocable<DDF&, Data&>))
flow_receiver(Data d, DDF) ->
    flow_receiver<Data, passDVF, passDEF, DDF, passDStrtF>;

PUSHMI_TEMPLATE(class Data, class DVF, class DEF)
  (requires PUSHMI_EXP(
    lazy::FlowReceiverDataArg<Data>
    PUSHMI_BROKEN_SUBSUMPTION(PUSHMI_AND
      not lazy::Invocable<DEF&, Data&>)))
flow_receiver(Data d, DVF nf, DEF ef) ->
  flow_receiver<Data, DVF, DEF, passDDF, passDStrtF>;

PUSHMI_TEMPLATE(class Data, class DEF, class DDF)
  (requires PUSHMI_EXP(
    lazy::FlowReceiverDataArg<Data> PUSHMI_AND
    lazy::Invocable<DDF&, Data&>))
flow_receiver(Data d, DEF, DDF) ->
  flow_receiver<Data, passDVF, DEF, DDF, passDStrtF>;

PUSHMI_TEMPLATE(class Data, class DVF, class DEF, class DDF)
  (requires PUSHMI_EXP(
    lazy::FlowReceiverDataArg<Data> PUSHMI_AND
    lazy::Invocable<DDF&, Data&>))
flow_receiver(Data d, DVF nf, DEF ef, DDF df) ->
  flow_receiver<Data, DVF, DEF, DDF, passDStrtF>;

PUSHMI_TEMPLATE(class Data, class DVF, class DEF, class DDF, class DStrtF)
  (requires PUSHMI_EXP(
    lazy::FlowReceiverDataArg<Data> PUSHMI_AND
    lazy::Invocable<DDF&, Data&> ))
flow_receiver(Data d, DVF nf, DEF ef, DDF df, DStrtF strtf) ->
  flow_receiver<Data, DVF, DEF, DDF, DStrtF>;
#endif

template<>
struct construct_deduced<flow_receiver> : make_flow_receiver_fn {};


} // namespace pushmi
