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
#include <folly/experimental/pushmi/detail/if_constexpr.h>
#include <folly/experimental/pushmi/detail/opt.h>
#include <folly/experimental/pushmi/o/extension_operators.h>
#include <folly/experimental/pushmi/time_single_sender.h>
#include <folly/experimental/pushmi/trampoline.h>
#include <functional>

namespace pushmi {
namespace detail {
namespace submit_detail {

PUSHMI_CONCEPT_DEF(
    template(class In, class... AN)(
    concept AutoSenderTo)(In, AN...),
      Sender<In>&& SenderTo<In, receiver_type_t<In, AN...>>
);
PUSHMI_CONCEPT_DEF(
    template(class In, class... AN)(
    concept AutoConstrainedSenderTo)(In, AN...),
      ConstrainedSenderTo<In, receiver_type_t<In, AN...>>
);
PUSHMI_CONCEPT_DEF(
    template(class In, class... AN)(
    concept AutoTimeSenderTo)(In, AN...),
      TimeSenderTo<In, receiver_type_t<In, AN...>>
);
} // namespace submit_detail

struct submit_fn {
 private:
  // TODO - only move, move-only types..
  // if out can be copied, then submit can be called multiple
  // times..
  template <class... AN>
  struct fn {
    std::tuple<AN...> args_;
    PUSHMI_TEMPLATE(class In)
    (requires submit_detail::AutoSenderTo<In, AN...>)
    In operator()(In in) {
      auto out{::pushmi::detail::receiver_from_fn<In>{}(std::move(args_))};
      ::pushmi::submit(in, std::move(out));
      return in;
    }
  };

 public:
  template <class... AN>
  auto operator()(AN&&... an) const {
    return submit_fn::fn<AN...>{std::tuple<AN...>{(AN &&) an...}};
  }
};

struct submit_at_fn {
 private:
  template <class TP, class... AN>
  struct fn {
    TP at_;
    std::tuple<AN...> args_;
    PUSHMI_TEMPLATE(class In)
    (requires submit_detail::AutoTimeSenderTo<In, AN...>)
    In operator()(In in) {
      auto out{::pushmi::detail::receiver_from_fn<In>()(std::move(args_))};
      ::pushmi::submit(in, std::move(at_), std::move(out));
      return in;
    }
  };

 public:
  PUSHMI_TEMPLATE(class TP, class... AN)
  (requires Regular<TP>)
  auto operator()(TP at, AN... an) const {
    return submit_at_fn::fn<TP, AN...>{std::move(at), {(AN &&) an...}};
  }
};

struct submit_after_fn {
 private:
  template <class D, class... AN>
  struct fn {
    D after_;
    std::tuple<AN...> args_;
    PUSHMI_TEMPLATE(class In)
    (requires submit_detail::AutoTimeSenderTo<In, AN...>)
    In operator()(In in) {
      // TODO - only move, move-only types..
      // if out can be copied, then submit can be called multiple
      // times..
      auto out{::pushmi::detail::receiver_from_fn<In>()(std::move(args_))};
      auto at = ::pushmi::now(in) + std::move(after_);
      ::pushmi::submit(in, std::move(at), std::move(out));
      return in;
    }
  };

 public:
  PUSHMI_TEMPLATE(class D, class... AN)
  (requires Regular<D>)
  auto operator()(D after, AN... an) const {
    return submit_after_fn::fn<D, AN...>{std::move(after), {(AN &&) an...}};
  }
};

struct blocking_submit_fn {
 private:
  struct lock_state {
    bool done{false};
    std::atomic<int> nested{0};
    std::mutex lock;
    std::condition_variable signaled;
  };
  template <class Out>
  struct nested_receiver_impl;
  PUSHMI_TEMPLATE(class Exec)
  (requires Sender<Exec>&& Executor<Exec>)
  struct nested_executor_impl {
    nested_executor_impl(lock_state* state, Exec ex)
        : state_(state), ex_(std::move(ex)) {}
    lock_state* state_;
    Exec ex_;

    template <class U>
    using test_for_this = nested_executor_impl<U>;

    PUSHMI_TEMPLATE(class Ex)
    (requires Sender<Ex>&& Executor<Ex>&&
         detail::is_v<Ex, test_for_this>)
    static auto make(lock_state*, Ex ex) {
      return ex;
    }
    PUSHMI_TEMPLATE(class Ex)
    (requires Sender<Ex>&& Executor<Ex> &&
     not detail::is_v<Ex, test_for_this>)
    static auto make(lock_state* state, Ex ex) {
      return nested_executor_impl<Ex>{state, ex};
    }

    using properties = properties_t<Exec>;

    auto executor() {
      return make(state_, ::pushmi::executor(ex_));
    }

    PUSHMI_TEMPLATE(class... ZN)
    (requires Constrained<Exec>)
    auto top() {
      return ::pushmi::top(ex_);
    }

    PUSHMI_TEMPLATE(class CV, class Out)
    (requires Receiver<Out>&& Constrained<Exec>)
    void submit(CV cv, Out out) {
      ++state_->nested;
      ::pushmi::submit(
          ex_, cv, nested_receiver_impl<Out>{state_, std::move(out)});
    }

    PUSHMI_TEMPLATE(class Out)
    (requires Receiver<Out> && not Constrained<Exec>)
    void submit(Out out) {
      ++state_->nested;
      ::pushmi::submit(ex_, nested_receiver_impl<Out>{state_, std::move(out)});
    }
  };
  template <class Out>
  struct nested_receiver_impl {
    nested_receiver_impl(lock_state* state, Out out)
        : state_(state), out_(std::move(out)) {}
    lock_state* state_;
    Out out_;

    using properties = properties_t<Out>;

    template <class V>
    void value(V&& v) {
      std::exception_ptr e;
      using executor_t = remove_cvref_t<V>;
      auto n = nested_executor_impl<executor_t>::make(state_, (V &&) v);
      ::pushmi::set_value(out_, any_executor_ref<>{n});
    }
    template <class E>
    void error(E&& e) noexcept {
      ::pushmi::set_error(out_, (E &&) e);
      if (--state_->nested == 0) {
        state_->signaled.notify_all();
      }
    }
    void done() {
      std::exception_ptr e;
      try {
        ::pushmi::set_done(out_);
      } catch (...) {
        e = std::current_exception();
      }
      if (--state_->nested == 0) {
        state_->signaled.notify_all();
      }
      if (e) {
        std::rethrow_exception(e);
      }
    }
  };
  struct nested_executor_impl_fn {
    PUSHMI_TEMPLATE(class Exec)
    (requires Executor<Exec>)
    auto operator()(lock_state* state, Exec ex) const {
      return nested_executor_impl<Exec>::make(state, std::move(ex));
    }
  };
  struct on_value_impl {
    lock_state* state_;
    PUSHMI_TEMPLATE(class Out, class Value)
    (requires Executor<std::decay_t<Value>>&& ReceiveValue<
        Out,
        pushmi::invoke_result_t<
            nested_executor_impl_fn,
            lock_state*,
            std::decay_t<Value>>>)
    void operator()(Out out, Value&& v) const {
      ++state_->nested;
      ::pushmi::set_value(out, nested_executor_impl_fn{}(state_, (Value &&) v));
      if (--state_->nested == 0) {
        std::unique_lock<std::mutex> guard{state_->lock};
        state_->signaled.notify_all();
      }
    }
    PUSHMI_TEMPLATE(class Out, class... VN)
    (requires True<>&& ReceiveValue<Out, VN...> &&
     not(sizeof...(VN) == 1 && And<Executor<std::decay_t<VN>>...>))
    void operator()(Out out, VN&&... vn) const {
      ::pushmi::set_value(out, (VN &&) vn...);
    }
  };
  struct on_error_impl {
    lock_state* state_;
    PUSHMI_TEMPLATE(class Out, class E)
    (requires ReceiveError<Out, E>)
    void operator()(Out out, E e) const noexcept {
      ::pushmi::set_error(out, std::move(e));
      std::unique_lock<std::mutex> guard{state_->lock};
      state_->done = true;
      state_->signaled.notify_all();
    }
  };
  struct on_done_impl {
    lock_state* state_;
    PUSHMI_TEMPLATE(class Out)
    (requires Receiver<Out>)
    void operator()(Out out) const {
      ::pushmi::set_done(out);
      std::unique_lock<std::mutex> guard{state_->lock};
      state_->done = true;
      state_->signaled.notify_all();
    }
  };

  template <class In>
  struct receiver_impl {
    PUSHMI_TEMPLATE(class... AN)
    (requires Sender<In>)
    auto operator()(
        lock_state* state,
        std::tuple<AN...> args) const {
      return ::pushmi::detail::receiver_from_fn<In>()(
          std::move(args),
          on_value_impl{state},
          on_error_impl{state},
          on_done_impl{state});
    }
  };
  template <class In>
  struct submit_impl {
    PUSHMI_TEMPLATE(class Out)
    (requires Receiver<Out>&& SenderTo<In, Out>)
    void operator()(In& in, Out out) const {
      ::pushmi::submit(in, std::move(out));
    }
  };
  // TODO - only move, move-only types..
  // if out can be copied, then submit can be called multiple
  // times..
  template <class... AN>
  struct fn {
    std::tuple<AN...> args_;

    PUSHMI_TEMPLATE(class In)
    (requires Sender<In>&& Invocable<
         submit_impl<In>&,
         In&,
         pushmi::invoke_result_t<
             receiver_impl<In>,
             lock_state*,
             std::tuple<AN...>&&>> &&
     not AlwaysBlocking<In>)
    In operator()(In in) {
      lock_state state{};

      auto make = receiver_impl<In>{};
      auto submit = submit_impl<In>{};
      submit(in, make(&state, std::move(args_)));

      std::unique_lock<std::mutex> guard{state.lock};
      state.signaled.wait(
          guard, [&] { return state.done && state.nested.load() == 0; });
      return in;
    }
  };

 public:
  template <class... AN>
  auto operator()(AN... an) const {
    return blocking_submit_fn::fn<AN...>{std::tuple<AN...>{(AN &&) an...}};
  }
};

template <class T>
struct get_fn {
 private:
  struct on_value_impl {
    pushmi::detail::opt<T>* result_;
    template <class... TN>
    void operator()(TN&&... tn) const {
      *result_ = T{(TN &&) tn...};
    }
  };
  struct on_error_impl {
    pushmi::detail::opt<std::exception_ptr>* ep_;
    template <class E>
    void operator()(E e) const noexcept {
      *ep_ = std::make_exception_ptr(e);
    }
    void operator()(std::exception_ptr ep) const noexcept {
      *ep_ = ep;
    }
  };

 public:
  // TODO constrain this better
  PUSHMI_TEMPLATE(class In)
  (requires Sender<In>)
  T operator()(In in) const {
    pushmi::detail::opt<T> result_;
    pushmi::detail::opt<std::exception_ptr> ep_;
    auto out =
        ::pushmi::make_receiver(on_value_impl{&result_}, on_error_impl{&ep_});
    using Out = decltype(out);
    static_assert(
        SenderTo<In, Out>,
        "'In' does not deliver value compatible with 'T' to 'Out'");
    std::conditional_t<AlwaysBlocking<In>, submit_fn, blocking_submit_fn>{}(
        std::move(out))(std::move(in));
    if (!!ep_) {
      std::rethrow_exception(*ep_);
    }
    return std::move(*result_);
  }
};

} // namespace detail

namespace operators {
PUSHMI_INLINE_VAR constexpr detail::submit_fn submit{};
PUSHMI_INLINE_VAR constexpr detail::submit_at_fn submit_at{};
PUSHMI_INLINE_VAR constexpr detail::submit_after_fn submit_after{};
PUSHMI_INLINE_VAR constexpr detail::blocking_submit_fn blocking_submit{};
template <class T>
PUSHMI_INLINE_VAR constexpr detail::get_fn<T> get{};
} // namespace operators

} // namespace pushmi
