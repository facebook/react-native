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

#include <folly/experimental/pushmi/executor.h>
#include <folly/experimental/pushmi/o/extension_operators.h>
#include <folly/experimental/pushmi/piping.h>

namespace pushmi {

namespace detail {

template <class Executor>
struct via_fn_base {
  Executor exec;
  bool done;
  explicit via_fn_base(Executor ex) : exec(std::move(ex)), done(false) {}
  via_fn_base& via_fn_base_ref() {
    return *this;
  }
};
template <class Executor, class Out>
struct via_fn_data : public Out, public via_fn_base<Executor> {
  via_fn_data(Out out, Executor exec)
      : Out(std::move(out)), via_fn_base<Executor>(std::move(exec)) {}

  using Out::done;
  using Out::error;
  using typename Out::properties;
};

template <class Out, class Executor>
auto make_via_fn_data(Out out, Executor ex) -> via_fn_data<Executor, Out> {
  return {std::move(out), std::move(ex)};
}

struct via_fn {
 private:
  template <class Out>
  struct on_value_impl {
    template <class V>
    struct impl {
      V v_;
      Out out_;
      void operator()(any) {
        ::pushmi::set_value(out_, std::move(v_));
      }
    };
    template <class Data, class V>
    void operator()(Data& data, V&& v) const {
      if (data.via_fn_base_ref().done) {
        return;
      }
      ::pushmi::submit(
          data.via_fn_base_ref().exec,
          ::pushmi::make_receiver(impl<std::decay_t<V>>{
              (V &&) v, std::move(static_cast<Out&>(data))}));
    }
  };
  template <class Out>
  struct on_error_impl {
    template <class E>
    struct impl {
      E e_;
      Out out_;
      void operator()(any) noexcept {
        ::pushmi::set_error(out_, std::move(e_));
      }
    };
    template <class Data, class E>
    void operator()(Data& data, E e) const noexcept {
      if (data.via_fn_base_ref().done) {
        return;
      }
      data.via_fn_base_ref().done = true;
      ::pushmi::submit(
          data.via_fn_base_ref().exec,
          ::pushmi::make_receiver(
              impl<E>{std::move(e), std::move(static_cast<Out&>(data))}));
    }
  };
  template <class Out>
  struct on_done_impl {
    struct impl {
      Out out_;
      void operator()(any) {
        ::pushmi::set_done(out_);
      }
    };
    template <class Data>
    void operator()(Data& data) const {
      if (data.via_fn_base_ref().done) {
        return;
      }
      data.via_fn_base_ref().done = true;
      ::pushmi::submit(
          data.via_fn_base_ref().exec,
          ::pushmi::make_receiver(impl{std::move(static_cast<Out&>(data))}));
    }
  };
  template <class In, class ExecutorFactory>
  struct executor_impl {
    ExecutorFactory ef_;
    template <class Data>
    auto operator()(Data&) const {
      return ef_();
    }
  };
  template <class In, class ExecutorFactory>
  struct out_impl {
    ExecutorFactory ef_;
    PUSHMI_TEMPLATE(class Out)
    (requires Receiver<Out>)
    auto operator()(Out out) const {
      auto exec = ef_();
      return ::pushmi::detail::receiver_from_fn<In>()(
          make_via_fn_data(std::move(out), std::move(exec)),
          on_value_impl<Out>{},
          on_error_impl<Out>{},
          on_done_impl<Out>{});
    }
  };
  template <class ExecutorFactory>
  struct in_impl {
    ExecutorFactory ef_;
    PUSHMI_TEMPLATE(class In)
    (requires Sender<In>)
    auto operator()(In in) const {
      return ::pushmi::detail::sender_from(
          std::move(in),
          ::pushmi::detail::submit_transform_out<In>(
              out_impl<In, ExecutorFactory>{ef_}),
          ::pushmi::on_executor(executor_impl<In, ExecutorFactory>{ef_}));
    }
  };

 public:
  PUSHMI_TEMPLATE(class ExecutorFactory)
  (requires Invocable<ExecutorFactory&>&&
       Executor<invoke_result_t<ExecutorFactory&>>&&
           FifoSequence<invoke_result_t<ExecutorFactory&>>)
  auto operator()(ExecutorFactory ef) const {
    return in_impl<ExecutorFactory>{std::move(ef)};
  }
};

} // namespace detail

namespace operators {
PUSHMI_INLINE_VAR constexpr detail::via_fn via{};
} // namespace operators

} // namespace pushmi
