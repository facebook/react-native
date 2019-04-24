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
#include <folly/experimental/pushmi/detail/functional.h>
#include <folly/experimental/pushmi/detail/if_constexpr.h>
#include <folly/experimental/pushmi/flow_many_sender.h>
#include <folly/experimental/pushmi/flow_receiver.h>
#include <folly/experimental/pushmi/flow_single_sender.h>
#include <folly/experimental/pushmi/many_sender.h>
#include <folly/experimental/pushmi/piping.h>
#include <folly/experimental/pushmi/receiver.h>
#include <folly/experimental/pushmi/single_sender.h>
#include <folly/experimental/pushmi/time_single_sender.h>
#include <tuple>

namespace pushmi {

#if __cpp_lib_apply >= 201603
using std::apply;
#else
namespace detail {
PUSHMI_TEMPLATE(class F, class Tuple, std::size_t... Is)
(requires requires(pushmi::invoke(
    std::declval<F>(),
    std::get<Is>(std::declval<Tuple>())...)))
constexpr decltype(auto) apply_impl(
    F&& f,
    Tuple&& t,
    std::index_sequence<Is...>) {
  return pushmi::invoke((F &&) f, std::get<Is>((Tuple &&) t)...);
}
template <class Tuple_, class Tuple = std::remove_reference_t<Tuple_>>
using tupidxs = std::make_index_sequence<std::tuple_size<Tuple>::value>;
} // namespace detail

PUSHMI_TEMPLATE(class F, class Tuple)
(requires requires(detail::apply_impl(
    std::declval<F>(),
    std::declval<Tuple>(),
    detail::tupidxs<Tuple>{})))
constexpr decltype(auto) apply(F&& f, Tuple&& t) {
  return detail::apply_impl((F &&) f, (Tuple &&) t, detail::tupidxs<Tuple>{});
}
#endif

namespace detail {

template <class Cardinality, bool IsFlow = false>
struct make_receiver;
template <>
struct make_receiver<is_single<>> : construct_deduced<receiver> {};
template <>
struct make_receiver<is_many<>> : construct_deduced<receiver> {};
template <>
struct make_receiver<is_single<>, true> : construct_deduced<flow_receiver> {};
template <>
struct make_receiver<is_many<>, true> : construct_deduced<flow_receiver> {};

template <class Cardinality, bool IsFlow>
struct receiver_from_impl {
  using MakeReceiver = make_receiver<Cardinality, IsFlow>;
  template <class... AN>
  using receiver_type = pushmi::invoke_result_t<MakeReceiver&, AN...>;
  PUSHMI_TEMPLATE(class... Ts)
  (requires Invocable<MakeReceiver, Ts...>)
  auto operator()(
      std::tuple<Ts...> args) const {
    return pushmi::apply(MakeReceiver(), std::move(args));
  }
  PUSHMI_TEMPLATE(
      class... Ts,
      class... Fns,
      class This = std::enable_if_t<sizeof...(Fns) != 0, receiver_from_impl>)
  (requires And<SemiMovable<Fns>...>&& Invocable<MakeReceiver, Ts...>&&
       Invocable<
           This,
           pushmi::invoke_result_t<MakeReceiver, Ts...>,
           Fns...>)
  auto operator()(std::tuple<Ts...> args, Fns... fns) const {
    return This()(This()(std::move(args)), std::move(fns)...);
  }
  PUSHMI_TEMPLATE(class Out, class... Fns)
  (requires Receiver<Out>&& And<SemiMovable<Fns>...>)
  auto operator()(
      Out out,
      Fns... fns) const {
    return MakeReceiver()(std::move(out), std::move(fns)...);
  }
};

template <PUSHMI_TYPE_CONSTRAINT(Sender) In>
using receiver_from_fn = receiver_from_impl<
    property_set_index_t<properties_t<In>, is_single<>>,
    property_query_v<properties_t<In>, is_flow<>>>;

template <PUSHMI_TYPE_CONSTRAINT(Sender) In, class... AN>
using receiver_type_t =
    typename receiver_from_fn<In>::template receiver_type<AN...>;

template <class In, class FN>
struct submit_transform_out_1 {
  FN fn_;
  PUSHMI_TEMPLATE(class Out)
  (requires Receiver<Out>&& Invocable<FN, Out>&&
       SenderTo<In, pushmi::invoke_result_t<const FN&, Out>>)
  void operator()(In& in, Out out) const {
    ::pushmi::submit(in, fn_(std::move(out)));
  }
};
template <class In, class FN>
struct submit_transform_out_2 {
  FN fn_;
  PUSHMI_TEMPLATE(class CV, class Out)
  (requires Receiver<Out>&& Invocable<FN, Out>&&
       ConstrainedSenderTo<In, pushmi::invoke_result_t<const FN&, Out>>)
  void operator()(In& in, CV cv, Out out) const {
    ::pushmi::submit(in, cv, fn_(std::move(out)));
  }
};
template <class In, class SDSF>
struct submit_transform_out_3 {
  SDSF sdsf_;
  PUSHMI_TEMPLATE(class Out)
  (requires Receiver<Out>&& Invocable<const SDSF&, In&, Out>)
  void operator()(In& in, Out out) const {
    sdsf_(in, std::move(out));
  }
};
template <class In, class TSDSF>
struct submit_transform_out_4 {
  TSDSF tsdsf_;
  PUSHMI_TEMPLATE(class CV, class Out)
  (requires Receiver<Out>&& Invocable<const TSDSF&, In&, CV, Out>)
  void operator()(In& in, CV cv, Out out) const {
    tsdsf_(in, cv, std::move(out));
  }
};

PUSHMI_TEMPLATE(class In, class FN)
(requires Sender<In>&& SemiMovable<FN> PUSHMI_BROKEN_SUBSUMPTION(
    &&not ConstrainedSender<In>))
auto submit_transform_out(FN fn) {
  return on_submit(submit_transform_out_1<In, FN>{std::move(fn)});
}

PUSHMI_TEMPLATE(class In, class FN)
(requires ConstrainedSender<In>&& SemiMovable<FN>)
auto submit_transform_out(
    FN fn) {
  return submit_transform_out_2<In, FN>{std::move(fn)};
}

PUSHMI_TEMPLATE(class In, class SDSF, class TSDSF)
(requires Sender<In>&& SemiMovable<SDSF>&& SemiMovable<TSDSF>
     PUSHMI_BROKEN_SUBSUMPTION(
         &&not ConstrainedSender<
             In>))
auto submit_transform_out(SDSF sdsf, TSDSF) {
  return submit_transform_out_3<In, SDSF>{std::move(sdsf)};
}

PUSHMI_TEMPLATE(class In, class SDSF, class TSDSF)
(requires ConstrainedSender<In>&& SemiMovable<SDSF>&&
     SemiMovable<TSDSF>)
auto submit_transform_out(SDSF, TSDSF tsdsf) {
  return submit_transform_out_4<In, TSDSF>{std::move(tsdsf)};
}

template <
    class Cardinality,
    bool IsConstrained = false,
    bool IsTime = false,
    bool IsFlow = false>
struct make_sender;
template <>
struct make_sender<is_single<>> : construct_deduced<single_sender> {};
template <>
struct make_sender<is_many<>> : construct_deduced<many_sender> {};
template <>
struct make_sender<is_single<>, false, false, true>
    : construct_deduced<flow_single_sender> {};
template <>
struct make_sender<is_many<>, false, false, true>
    : construct_deduced<flow_many_sender> {};
template <>
struct make_sender<is_single<>, true, true, false>
    : construct_deduced<time_single_sender> {};
template <>
struct make_sender<is_single<>, true, false, false>
    : construct_deduced<constrained_single_sender> {};

PUSHMI_INLINE_VAR constexpr struct sender_from_fn {
  PUSHMI_TEMPLATE(class In, class... FN)
  (requires Sender<In>)
  auto operator()(In in, FN&&... fn) const {
    using MakeSender = make_sender<
        property_set_index_t<properties_t<In>, is_single<>>,
        property_query_v<properties_t<In>, is_constrained<>>,
        property_query_v<properties_t<In>, is_time<>>,
        property_query_v<properties_t<In>, is_flow<>>>;
    return MakeSender{}(std::move(in), (FN &&) fn...);
  }
} const sender_from{};

PUSHMI_TEMPLATE(
    class In,
    class Out,
    bool SenderRequires,
    bool SingleSenderRequires,
    bool TimeSingleSenderRequires)
(requires Sender<In>&& Receiver<Out>)constexpr bool sender_requires_from() {
  PUSHMI_IF_CONSTEXPR_RETURN(((bool)TimeSenderTo<In, Out>)(
    return TimeSingleSenderRequires;
  ) else (
    PUSHMI_IF_CONSTEXPR_RETURN(((bool)SenderTo<In, Out>)(
      return SingleSenderRequires;
    ) else (
      PUSHMI_IF_CONSTEXPR_RETURN(((bool) SenderTo<In, Out>)(
        return SenderRequires;
      ) else (

      ))
    ))
  ))
}

struct set_value_fn {
 private:
  template <class... VN>
  struct impl {
    std::tuple<VN...> vn_;
    PUSHMI_TEMPLATE(class Out)
    (requires ReceiveValue<Out, VN...>)
    void operator()(Out out) {
      ::pushmi::apply(
          ::pushmi::set_value,
          std::tuple_cat(std::tuple<Out>{std::move(out)}, std::move(vn_)));
    }
  };

 public:
  template <class... VN>
  auto operator()(VN&&... vn) const {
    return impl<std::decay_t<VN>...>{(VN &&) vn...};
  }
};

struct set_error_fn {
 private:
  template <class E>
  struct impl {
    E e_;
    PUSHMI_TEMPLATE(class Out)
    (requires ReceiveError<Out, E>)
    void operator()(Out out) {
      ::pushmi::set_error(out, std::move(e_));
    }
  };

 public:
  PUSHMI_TEMPLATE(class E)
  (requires SemiMovable<E>)
  auto operator()(E e) const {
    return impl<E>{std::move(e)};
  }
};

struct set_done_fn {
 private:
  struct impl {
    PUSHMI_TEMPLATE(class Out)
    (requires Receiver<Out>)
    void operator()(Out out) {
      ::pushmi::set_done(out);
    }
  };

 public:
  auto operator()() const {
    return impl{};
  }
};

struct set_starting_fn {
 private:
  template <class Up>
  struct impl {
    Up up_;
    PUSHMI_TEMPLATE(class Out)
    (requires Receiver<Out>)
    void operator()(Out out) {
      ::pushmi::set_starting(out, std::move(up_));
    }
  };

 public:
  PUSHMI_TEMPLATE(class Up)
  (requires Receiver<Up>)
  auto operator()(Up up) const {
    return impl<Up>{std::move(up)};
  }
};

struct executor_fn {
 private:
  struct impl {
    PUSHMI_TEMPLATE(class In)
    (requires Sender<In>)
    auto operator()(In& in) const {
      return ::pushmi::executor(in);
    }
  };

 public:
  auto operator()() const {
    return impl{};
  }
};

struct do_submit_fn {
 private:
  template <class Out>
  struct impl {
    Out out_;
    PUSHMI_TEMPLATE(class In)
    (requires SenderTo<In, Out>)
    void operator()(In& in) {
      ::pushmi::submit(in, std::move(out_));
    }
  };
  template <class TP, class Out>
  struct time_impl {
    TP tp_;
    Out out_;
    PUSHMI_TEMPLATE(class In)
    (requires TimeSenderTo<In, Out>)
    void operator()(In& in) {
      ::pushmi::submit(in, std::move(tp_), std::move(out_));
    }
  };

 public:
  PUSHMI_TEMPLATE(class Out)
  (requires Receiver<Out>)
  auto operator()(Out out) const {
    return impl<Out>{std::move(out)};
  }
  PUSHMI_TEMPLATE(class TP, class Out)
  (requires Receiver<Out>)
  auto operator()(TP tp, Out out) const {
    return time_impl<TP, Out>{std::move(tp), std::move(out)};
  }
};

struct top_fn {
 private:
  struct impl {
    PUSHMI_TEMPLATE(class In)
    (requires ConstrainedSender<In>)
    auto operator()(In& in) const {
      return ::pushmi::top(in);
    }
  };

 public:
  auto operator()() const {
    return impl{};
  }
};

struct now_fn {
 private:
  struct impl {
    PUSHMI_TEMPLATE(class In)
    (requires TimeSender<In>)
    auto operator()(In& in) const {
      return ::pushmi::now(in);
    }
  };

 public:
  auto operator()() const {
    return impl{};
  }
};

} // namespace detail

namespace extension_operators {

PUSHMI_INLINE_VAR constexpr detail::set_done_fn set_done{};
PUSHMI_INLINE_VAR constexpr detail::set_error_fn set_error{};
PUSHMI_INLINE_VAR constexpr detail::set_value_fn set_value{};
PUSHMI_INLINE_VAR constexpr detail::set_starting_fn set_starting{};
PUSHMI_INLINE_VAR constexpr detail::executor_fn executor{};
PUSHMI_INLINE_VAR constexpr detail::do_submit_fn submit{};
PUSHMI_INLINE_VAR constexpr detail::now_fn now{};
PUSHMI_INLINE_VAR constexpr detail::top_fn top{};

} // namespace extension_operators

} // namespace pushmi
