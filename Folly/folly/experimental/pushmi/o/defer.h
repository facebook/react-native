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
#include <folly/experimental/pushmi/receiver.h>
#include <folly/experimental/pushmi/single_sender.h>

namespace pushmi {

namespace operators {

PUSHMI_INLINE_VAR constexpr struct defer_fn {
 private:
  template <class F>
  struct impl {
    F f_;
    PUSHMI_TEMPLATE(class Data, class Out)
    (requires Receiver<Out>)
    void operator()(Data&, Out out) {
      auto sender = f_();
      ::pushmi::submit(sender, std::move(out));
    }
  };

 public:
  PUSHMI_TEMPLATE(class F)
  (requires Invocable<F&>)
  auto operator()(F f) const {
    struct sender_base : single_sender<> {
      using properties = properties_t<invoke_result_t<F&>>;
    };
    return make_single_sender(sender_base{}, impl<F>{std::move(f)});
  }
} defer{};

} // namespace operators

} // namespace pushmi
