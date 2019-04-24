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
#include <folly/experimental/pushmi/executor.h>
#include <folly/experimental/pushmi/inline.h>
#include <folly/experimental/pushmi/constrained_single_sender.h>

namespace pushmi {

template <class E, class TP, class... VN>
class any_time_single_sender
    : public any_constrained_single_sender<E, TP, VN...> {
 public:
  using properties = property_set<is_time<>, is_single<>>;
  constexpr any_time_single_sender() = default;
  template <class T>
  constexpr explicit any_time_single_sender(T t)
      : any_constrained_single_sender<E, TP, VN...>(std::move(t)) {}
  template <class T0, class T1, class... TN>
  constexpr any_time_single_sender(T0 t0, T1 t1, TN... tn)
      : any_constrained_single_sender<E, TP, VN...>(
            std::move(t0),
            std::move(t1),
            std::move(tn)...) {}

  any_time_executor<E, TP> executor() {
    return any_time_executor<E, TP>{
        any_constrained_single_sender<E, TP, VN...>::executor()};
  }
};

template <class SF, class NF, class EXF>
class time_single_sender<SF, NF, EXF>
    : public constrained_single_sender<SF, NF, EXF> {
 public:
  using properties = property_set<is_time<>, is_single<>>;

  constexpr time_single_sender() = default;
  template <class T>
  constexpr explicit time_single_sender(T t)
      : constrained_single_sender<SF, NF, EXF>(std::move(t)) {}
  template <class T0, class T1, class... TN>
  constexpr time_single_sender(T0 t0, T1 t1, TN... tn)
      : constrained_single_sender<SF, NF, EXF>(
            std::move(t0),
            std::move(t1),
            std::move(tn)...) {}
};

template <PUSHMI_TYPE_CONSTRAINT(SemiMovable)... TN>
class time_single_sender : public constrained_single_sender<TN...> {
 public:
  constexpr time_single_sender() = default;
  template <class T>
  constexpr explicit time_single_sender(T t)
      : constrained_single_sender<TN...>(std::move(t)) {}
  template <class C0, class C1, class... CN>
  constexpr time_single_sender(C0 c0, C1 c1, CN... cn)
      : constrained_single_sender<TN...>(
            std::move(c0),
            std::move(c1),
            std::move(cn)...) {}
};

template <>
class time_single_sender<>
    : public time_single_sender<ignoreSF, systemNowF, inlineTimeEXF> {
 public:
  time_single_sender() = default;
};

////////////////////////////////////////////////////////////////////////////////
// make_time_single_sender
PUSHMI_INLINE_VAR constexpr struct make_time_single_sender_fn {
  inline auto operator()() const  {
    return time_single_sender<ignoreSF, systemNowF, inlineTimeEXF>{};
  }
  PUSHMI_TEMPLATE(class SF)
    (requires True<> PUSHMI_BROKEN_SUBSUMPTION(&& not Sender<SF>))
  auto operator()(SF sf) const {
    return time_single_sender<SF, systemNowF, inlineTimeEXF>{std::move(sf)};
  }
  PUSHMI_TEMPLATE (class SF, class EXF)
    (requires Invocable<EXF&> PUSHMI_BROKEN_SUBSUMPTION(&& not Sender<SF>))
  auto operator()(SF sf, EXF exf) const {
    return time_single_sender<SF, systemNowF, EXF>{
      std::move(sf), std::move(exf)};
  }
  PUSHMI_TEMPLATE (class SF, class NF, class EXF)
    (requires Invocable<NF&> && Invocable<EXF&> PUSHMI_BROKEN_SUBSUMPTION(&& not Sender<SF>))
  auto operator()(SF sf, EXF exf, NF nf) const {
    return time_single_sender<SF, NF, EXF>{
      std::move(sf), std::move(exf), std::move(nf)};
  }
  PUSHMI_TEMPLATE (class Data)
    (requires TimeSender<Data, is_single<>>)
  auto operator()(Data d) const {
    return time_single_sender<Data, passDSF, passDNF, passDEXF>{std::move(d)};
  }
  PUSHMI_TEMPLATE (class Data, class DSF)
    (requires TimeSender<Data, is_single<>>)
  auto operator()(Data d, DSF sf) const {
    return time_single_sender<Data, DSF, passDNF, passDEXF>{
      std::move(d), std::move(sf)};
  }
  PUSHMI_TEMPLATE (class Data, class DSF, class DEXF)
    (requires TimeSender<Data, is_single<>> && Invocable<DEXF&, Data&>)
  auto operator()(Data d, DSF sf, DEXF exf) const  {
    return time_single_sender<Data, DSF, passDNF, DEXF>{
      std::move(d), std::move(sf), std::move(exf)};
  }
  PUSHMI_TEMPLATE (class Data, class DSF, class DNF, class DEXF)
    (requires TimeSender<Data, is_single<>> && Invocable<DNF&, Data&> &&
      Invocable<DEXF&, Data&>)
  auto operator()(Data d, DSF sf, DEXF exf, DNF nf) const  {
    return time_single_sender<Data, DSF, DNF, DEXF>{
      std::move(d), std::move(sf), std::move(exf), std::move(nf)};
  }
} const make_time_single_sender {};

////////////////////////////////////////////////////////////////////////////////
// deduction guides
#if __cpp_deduction_guides >= 201703
time_single_sender() -> time_single_sender<ignoreSF, systemNowF, inlineTimeEXF>;

PUSHMI_TEMPLATE(class SF)
  (requires True<> PUSHMI_BROKEN_SUBSUMPTION(&& not Sender<SF>))
time_single_sender(SF) -> time_single_sender<SF, systemNowF, inlineTimeEXF>;

PUSHMI_TEMPLATE (class SF, class EXF)
  (requires Invocable<EXF&> PUSHMI_BROKEN_SUBSUMPTION(&& not Sender<SF>))
time_single_sender(SF, EXF) -> time_single_sender<SF, systemNowF, EXF>;

PUSHMI_TEMPLATE (class SF, class NF, class EXF)
  (requires Invocable<NF&> && Invocable<EXF&>
    PUSHMI_BROKEN_SUBSUMPTION(&& not Sender<SF>))
time_single_sender(SF, EXF, NF) -> time_single_sender<SF, NF, EXF>;

PUSHMI_TEMPLATE (class Data, class DSF)
  (requires TimeSender<Data, is_single<>>)
time_single_sender(Data, DSF) ->
  time_single_sender<Data, DSF, passDNF, passDEXF>;

PUSHMI_TEMPLATE (class Data, class DSF, class DEXF)
  (requires TimeSender<Data, is_single<>> && Invocable<DEXF&, Data&>)
time_single_sender(Data, DSF, DEXF) ->
  time_single_sender<Data, DSF, passDNF, DEXF>;

PUSHMI_TEMPLATE (class Data, class DSF, class DNF, class DEXF)
  (requires TimeSender<Data, is_single<>> && Invocable<DNF&, Data&> &&
    Invocable<DEXF&, Data&>)
time_single_sender(Data, DSF, DEXF, DNF) ->
  time_single_sender<Data, DSF, DNF, DEXF>;
#endif

template<>
struct construct_deduced<time_single_sender>
  : make_time_single_sender_fn {};

} //namespace pushmi
