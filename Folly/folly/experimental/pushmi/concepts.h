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

#include <folly/experimental/pushmi/extension_points.h>
#include <folly/experimental/pushmi/forwards.h>
#include <folly/experimental/pushmi/properties.h>

namespace pushmi {

// traits & tags

// cardinality affects both sender and receiver

struct cardinality_category {};

// Trait
template <class PS>
struct has_cardinality : category_query<PS, cardinality_category> {};
template <class PS>
PUSHMI_INLINE_VAR constexpr bool has_cardinality_v = has_cardinality<PS>::value;
PUSHMI_CONCEPT_DEF(
    template(class PS) concept Cardinality,
    has_cardinality_v<PS>);

// flow affects both sender and receiver

struct flow_category {};

// sender and receiver are mutually exclusive

struct receiver_category {};

struct sender_category {};

// for senders that are executors

struct executor_category {};

// time and constrained are mutually exclusive refinements of sender (time is a
// special case of constrained and may be folded in later)

// blocking affects senders

struct blocking_category {};

// sequence affects senders

struct sequence_category {};

// Single trait and tag
template <class... TN>
struct is_single;
// Tag
template <>
struct is_single<> {
  using property_category = cardinality_category;
};
// Trait
template <class PS>
struct is_single<PS> : property_query<PS, is_single<>> {};
template <class PS>
PUSHMI_INLINE_VAR constexpr bool is_single_v = is_single<PS>::value;
PUSHMI_CONCEPT_DEF(template(class PS) concept Single, is_single_v<PS>);

// Many trait and tag
template <class... TN>
struct is_many;
// Tag
template <>
struct is_many<> {
  using property_category = cardinality_category;
}; // many::value() does not terminate, so it is not a refinement of single
// Trait
template <class PS>
struct is_many<PS> : property_query<PS, is_many<>> {};
template <class PS>
PUSHMI_INLINE_VAR constexpr bool is_many_v = is_many<PS>::value;
PUSHMI_CONCEPT_DEF(template(class PS) concept Many, is_many_v<PS>);

// Flow trait and tag
template <class... TN>
struct is_flow;
// Tag
template <>
struct is_flow<> {
  using property_category = flow_category;
};
// Trait
template <class PS>
struct is_flow<PS> : property_query<PS, is_flow<>> {};
template <class PS>
PUSHMI_INLINE_VAR constexpr bool is_flow_v = is_flow<PS>::value;
PUSHMI_CONCEPT_DEF(template(class PS) concept Flow, is_flow_v<PS>);

// Receiver trait and tag
template <class... TN>
struct is_receiver;
// Tag
template <>
struct is_receiver<> {
  using property_category = receiver_category;
};
// Trait
template <class PS>
struct is_receiver<PS> : property_query<PS, is_receiver<>> {};
template <class PS>
PUSHMI_INLINE_VAR constexpr bool is_receiver_v = is_receiver<PS>::value;
// PUSHMI_CONCEPT_DEF(
//   template (class PS)
//   concept Receiver,
//     is_receiver_v<PS>
// );

// Sender trait and tag
template <class... TN>
struct is_sender;
// Tag
template <>
struct is_sender<> {
  using property_category = sender_category;
};
// Trait
template <class PS>
struct is_sender<PS> : property_query<PS, is_sender<>> {};
template <class PS>
PUSHMI_INLINE_VAR constexpr bool is_sender_v = is_sender<PS>::value;
// PUSHMI_CONCEPT_DEF(
//   template (class PS)
//   concept Sender,
//     is_sender_v<PS>
// );

// Executor trait and tag
template <class... TN>
struct is_executor;
// Tag
template <>
struct is_executor<> {
  using property_category = executor_category;
};
// Trait
template <class PS>
struct is_executor<PS> : property_query<PS, is_executor<>> {};
template <class PS>
PUSHMI_INLINE_VAR constexpr bool is_executor_v = is_executor<PS>::value;
PUSHMI_CONCEPT_DEF(
    template(class PS) concept Executor,
    is_executor_v<PS>&& is_sender_v<PS>&& is_single_v<PS>);

// Constrained trait and tag
template <class... TN>
struct is_constrained;
// Tag
template <>
struct is_constrained<> : is_sender<> {};
// Trait
template <class PS>
struct is_constrained<PS> : property_query<PS, is_constrained<>> {};
template <class PS>
PUSHMI_INLINE_VAR constexpr bool is_constrained_v = is_constrained<PS>::value;
PUSHMI_CONCEPT_DEF(
    template(class PS) concept Constrained,
    is_constrained_v<PS>&& is_sender_v<PS>);

// Time trait and tag
template <class... TN>
struct is_time;
// Tag
template <>
struct is_time<> : is_constrained<> {};
// Trait
template <class PS>
struct is_time<PS> : property_query<PS, is_time<>> {};
template <class PS>
PUSHMI_INLINE_VAR constexpr bool is_time_v = is_time<PS>::value;
PUSHMI_CONCEPT_DEF(
    template(class PS) concept Time,
    is_time_v<PS>&& is_constrained_v<PS>&& is_sender_v<PS>);

// AlwaysBlocking trait and tag
template <class... TN>
struct is_always_blocking;
// Tag
template <>
struct is_always_blocking<> {
  using property_category = blocking_category;
};
// Trait
template <class PS>
struct is_always_blocking<PS> : property_query<PS, is_always_blocking<>> {};
template <class PS>
PUSHMI_INLINE_VAR constexpr bool is_always_blocking_v =
    is_always_blocking<PS>::value;
PUSHMI_CONCEPT_DEF(
    template(class PS) concept AlwaysBlocking,
    is_always_blocking_v<PS>&& is_sender_v<PS>);

// NeverBlocking trait and tag
template <class... TN>
struct is_never_blocking;
// Tag
template <>
struct is_never_blocking<> {
  using property_category = blocking_category;
};
// Trait
template <class PS>
struct is_never_blocking<PS> : property_query<PS, is_never_blocking<>> {};
template <class PS>
PUSHMI_INLINE_VAR constexpr bool is_never_blocking_v =
    is_never_blocking<PS>::value;
PUSHMI_CONCEPT_DEF(
    template(class PS) concept NeverBlocking,
    is_never_blocking_v<PS>&& is_sender_v<PS>);

// MaybeBlocking trait and tag
template <class... TN>
struct is_maybe_blocking;
// Tag
template <>
struct is_maybe_blocking<> {
  using property_category = blocking_category;
};
// Trait
template <class PS>
struct is_maybe_blocking<PS> : property_query<PS, is_maybe_blocking<>> {};
template <class PS>
PUSHMI_INLINE_VAR constexpr bool is_maybe_blocking_v =
    is_maybe_blocking<PS>::value;
PUSHMI_CONCEPT_DEF(
    template(class PS) concept MaybeBlocking,
    is_maybe_blocking_v<PS>&& is_sender_v<PS>);

// FifoSequence trait and tag
template <class... TN>
struct is_fifo_sequence;
// Tag
template <>
struct is_fifo_sequence<> {
  using property_category = sequence_category;
};
// Trait
template <class PS>
struct is_fifo_sequence<PS> : property_query<PS, is_fifo_sequence<>> {};
template <class PS>
PUSHMI_INLINE_VAR constexpr bool is_fifo_sequence_v =
    is_fifo_sequence<PS>::value;
PUSHMI_CONCEPT_DEF(
    template(class PS) concept FifoSequence,
    is_fifo_sequence_v<PS>&& is_sender_v<PS>);

// ConcurrentSequence trait and tag
template <class... TN>
struct is_concurrent_sequence;
// Tag
template <>
struct is_concurrent_sequence<> {
  using property_category = sequence_category;
};
// Trait
template <class PS>
struct is_concurrent_sequence<PS>
    : property_query<PS, is_concurrent_sequence<>> {};
template <class PS>
PUSHMI_INLINE_VAR constexpr bool is_concurrent_sequence_v =
    is_concurrent_sequence<PS>::value;
PUSHMI_CONCEPT_DEF(
    template(class PS) concept ConcurrentSequence,
    is_concurrent_sequence_v<PS>&& is_sender_v<PS>);

PUSHMI_CONCEPT_DEF(
    template(class R, class... PropertyN)(concept Receiver)(R, PropertyN...),
    requires(R& r)(
        ::pushmi::set_done(r),
        ::pushmi::set_error(r, std::exception_ptr{})) &&
        SemiMovable<R> && property_query_v<R, PropertyN...> &&
        is_receiver_v<R> && !is_sender_v<R>);

PUSHMI_CONCEPT_DEF(
    template(class R, class... VN)(concept ReceiveValue)(R, VN...),
    requires(R& r)(::pushmi::set_value(r, std::declval<VN&&>()...)) &&
        Receiver<R> &&
        // GCC w/-fconcepts ICE on SemiMovable<VN>...
        True<> // And<SemiMovable<VN>...>
);

PUSHMI_CONCEPT_DEF(
    template(class R, class E = std::exception_ptr)(concept ReceiveError)(R, E),
    requires(R& r, E&& e)(::pushmi::set_error(r, (E &&) e)) && Receiver<R> &&
        SemiMovable<E>);

PUSHMI_CONCEPT_DEF(
    template(class D, class... PropertyN)(concept Sender)(D, PropertyN...),
    requires(D& d)(
        ::pushmi::executor(d),
        requires_<Executor<decltype(::pushmi::executor(d))>>) &&
        SemiMovable<D> && Cardinality<D> && property_query_v<D, PropertyN...> &&
        is_sender_v<D> && !is_receiver_v<D>);

PUSHMI_CONCEPT_DEF(
    template(class D, class S, class... PropertyN)(
        concept SenderTo)(D, S, PropertyN...),
    requires(D& d, S&& s)(::pushmi::submit(d, (S &&) s)) && Sender<D> &&
        Receiver<S> && property_query_v<D, PropertyN...>);

template <class D>
PUSHMI_PP_CONSTRAINED_USING(
    Sender<D>,
    executor_t =,
    decltype(::pushmi::executor(std::declval<D&>())));

// add concepts to support cancellation
//

PUSHMI_CONCEPT_DEF(
    template(class S, class... PropertyN)(
        concept FlowReceiver)(S, PropertyN...),
    Receiver<S>&& property_query_v<S, PropertyN...>&& Flow<S>);

PUSHMI_CONCEPT_DEF(
    template(class R, class... VN)(concept FlowReceiveValue)(R, VN...),
    Flow<R>&& ReceiveValue<R, VN...>);

PUSHMI_CONCEPT_DEF(
    template(class R, class E = std::exception_ptr)(
        concept FlowReceiveError)(R, E),
    Flow<R>&& ReceiveError<R, E>);

PUSHMI_CONCEPT_DEF(
    template(class R, class Up)(concept FlowUpTo)(R, Up),
    requires(R& r, Up&& up)(::pushmi::set_starting(r, (Up &&) up)) && Flow<R>);

PUSHMI_CONCEPT_DEF(
    template(class S, class... PropertyN)(concept FlowSender)(S, PropertyN...),
    Sender<S>&& property_query_v<S, PropertyN...>&& Flow<S>);

PUSHMI_CONCEPT_DEF(
    template(class D, class S, class... PropertyN)(
        concept FlowSenderTo)(D, S, PropertyN...),
    FlowSender<D>&& property_query_v<D, PropertyN...>&& FlowReceiver<S>);

// add concepts for constraints
//
// the constraint could be time or priority enum or any other
// ordering constraint value-type.
//
// top() returns the constraint value that will cause the item to run asap.
// So now() for time and NORMAL for priority.
//

PUSHMI_CONCEPT_DEF(
    template(class D, class... PropertyN)(
        concept ConstrainedSender)(D, PropertyN...),
    requires(D& d)(
        ::pushmi::top(d),
        requires_<Regular<decltype(::pushmi::top(d))>>) &&
        Sender<D> && property_query_v<D, PropertyN...> && Constrained<D>);

PUSHMI_CONCEPT_DEF(
    template(class D, class S, class... PropertyN)(
        concept ConstrainedSenderTo)(D, S, PropertyN...),
    requires(D& d, S&& s)(::pushmi::submit(d, ::pushmi::top(d), (S &&) s)) &&
        ConstrainedSender<D> && property_query_v<D, PropertyN...> &&
        Receiver<S>);

template <class D>
PUSHMI_PP_CONSTRAINED_USING(
    ConstrainedSender<D>,
    constraint_t =,
    decltype(::pushmi::top(std::declval<D&>())));

PUSHMI_CONCEPT_DEF(
    template(class D, class... PropertyN)(concept TimeSender)(D, PropertyN...),
    requires(D& d)(
        ::pushmi::now(d),
        requires_<
            Regular<decltype(::pushmi::now(d) + std::chrono::seconds(1))>>) &&
        ConstrainedSender<D, PropertyN...> && Time<D>);

PUSHMI_CONCEPT_DEF(
    template(class D, class S, class... PropertyN)(
        concept TimeSenderTo)(D, S, PropertyN...),
    ConstrainedSenderTo<D, S, PropertyN...>&& TimeSender<D>);

template <class D>
PUSHMI_PP_CONSTRAINED_USING(
    TimeSender<D>,
    time_point_t =,
    decltype(::pushmi::now(std::declval<D&>())));

} // namespace pushmi
