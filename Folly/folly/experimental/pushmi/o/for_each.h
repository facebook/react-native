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

#include <folly/experimental/pushmi/o/extension_operators.h>
#include <folly/experimental/pushmi/o/submit.h>

namespace pushmi {
namespace detail {

struct for_each_fn {
 private:
  template <class... PN>
  struct subset {
    using properties = property_set<PN...>;
  };
  template <class In, class Out>
  struct Pull : Out {
    explicit Pull(Out out) : Out(std::move(out)) {}
    using properties =
        property_set_insert_t<properties_t<Out>, property_set<is_flow<>>>;
    std::function<void(std::ptrdiff_t)> pull;
    template <class V>
    void value(V&& v) {
      ::pushmi::set_value(static_cast<Out&>(*this), (V &&) v);
      pull(1);
    }
    PUSHMI_TEMPLATE(class Up)
    (requires Receiver<Up>)
    void starting(Up up) {
      pull = [up = std::move(up)](std::ptrdiff_t requested) mutable {
        ::pushmi::set_value(up, requested);
      };
      pull(1);
    }
    PUSHMI_TEMPLATE(class Up)
    (requires ReceiveValue<Up>)
    void starting(Up) {}
  };
  template <class... AN>
  struct fn {
    std::tuple<AN...> args_;
    PUSHMI_TEMPLATE(class In)
    (requires Sender<In>&& Flow<In>&& Many<In>)
    In operator()(In in) {
      auto out{::pushmi::detail::receiver_from_fn<subset<
          is_sender<>,
          property_set_index_t<properties_t<In>, is_single<>>>>()(
          std::move(args_))};
      using Out = decltype(out);
      ::pushmi::submit(
          in,
          ::pushmi::detail::receiver_from_fn<In>()(
              Pull<In, Out>{std::move(out)}));
      return in;
    }
    PUSHMI_TEMPLATE(class In)
    (requires Sender<In>&& Constrained<In>&& Flow<In>&& Many<In>)
    In operator()(In in) {
      auto out{::pushmi::detail::receiver_from_fn<subset<
          is_sender<>,
          property_set_index_t<properties_t<In>, is_single<>>>>()(
          std::move(args_))};
      using Out = decltype(out);
      ::pushmi::submit(
          in,
          ::pushmi::top(in),
          ::pushmi::detail::receiver_from_fn<In>()(
              Pull<In, Out>{std::move(out)}));
      return in;
    }
  };

 public:
  template <class... AN>
  auto operator()(AN&&... an) const {
    return for_each_fn::fn<AN...>{{(AN &&) an...}};
  }
};

} // namespace detail

namespace operators {
PUSHMI_INLINE_VAR constexpr detail::for_each_fn for_each{};
} // namespace operators

} // namespace pushmi
