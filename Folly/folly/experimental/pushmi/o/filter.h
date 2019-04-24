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
#include <folly/experimental/pushmi/piping.h>

namespace pushmi {

namespace detail {

struct filter_fn {
 private:
  template <class In, class Predicate>
  struct on_value_impl {
    Predicate p_;
    PUSHMI_TEMPLATE(class Out, class... VN)
    (requires Receiver<Out>)
    void operator()(Out& out, VN&&... vn) const {
      if (p_(as_const(vn)...)) {
        ::pushmi::set_value(out, (VN &&) vn...);
      }
    }
  };
  template <class In, class Predicate>
  struct submit_impl {
    Predicate p_;
    PUSHMI_TEMPLATE(class Out)
    (requires Receiver<Out>)
    auto operator()(Out out) const {
      return ::pushmi::detail::receiver_from_fn<In>()(
          std::move(out),
          // copy 'p' to allow multiple calls to submit
          on_value_impl<In, Predicate>{p_});
    }
  };
  template <class Predicate>
  struct adapt_impl {
    Predicate p_;
    PUSHMI_TEMPLATE(class In)
    (requires Sender<In>)
    auto operator()(In in) const {
      return ::pushmi::detail::sender_from(
          std::move(in),
          ::pushmi::detail::submit_transform_out<In>(
              submit_impl<In, Predicate>{p_}));
    }
  };

 public:
  PUSHMI_TEMPLATE(class Predicate)
  (requires SemiMovable<Predicate>)
  auto operator()(Predicate p) const {
    return adapt_impl<Predicate>{std::move(p)};
  }
};

} // namespace detail

namespace operators {
PUSHMI_INLINE_VAR constexpr detail::filter_fn filter{};
} // namespace operators

} // namespace pushmi
