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

#include <vector>

#include <folly/experimental/pushmi/time_single_sender.h>
#include <folly/experimental/pushmi/trampoline.h>

namespace pushmi {

template <class... TN>
struct subject;

template <class PS, class... TN>
struct subject<PS, TN...> {
  using properties = property_set_insert_t<
      property_set<is_sender<>, is_single<>>,
      property_set<property_set_index_t<PS, is_single<>>>>;

  struct subject_shared {
    using receiver_t = any_receiver<std::exception_ptr, TN...>;
    bool done_ = false;
    pushmi::detail::opt<std::tuple<std::decay_t<TN>...>> t_;
    std::exception_ptr ep_;
    std::vector<receiver_t> receivers_;
    std::mutex lock_;
    PUSHMI_TEMPLATE(class Out)
    (requires Receiver<Out>)
    void submit(Out out) {
      std::unique_lock<std::mutex> guard(lock_);
      if (ep_) {
        ::pushmi::set_error(out, ep_);
        return;
      }
      if (!!t_) {
        auto args = *t_;
        ::pushmi::apply(
            ::pushmi::set_value,
            std::tuple_cat(std::tuple<Out>{std::move(out)}, std::move(args)));
        return;
      }
      if (done_) {
        ::pushmi::set_done(out);
        return;
      }
      receivers_.push_back(receiver_t{out});
    }
    PUSHMI_TEMPLATE(class... VN)
    (requires And<SemiMovable<VN>...>)
    void value(VN&&... vn) {
      std::unique_lock<std::mutex> guard(lock_);
      for (auto& out : receivers_) {
        ::pushmi::apply(
            ::pushmi::set_value,
            std::tuple<decltype(out), std::decay_t<TN>...>{
                out, detail::as_const(vn)...});
      }
      t_ = std::make_tuple((VN &&) vn...);
      receivers_.clear();
    }
    PUSHMI_TEMPLATE(class E)
    (requires SemiMovable<E>)
    void error(E e) noexcept {
      std::unique_lock<std::mutex> guard(lock_);
      ep_ = e;
      for (auto& out : receivers_) {
        ::pushmi::set_error(out, std::move(e));
      }
      receivers_.clear();
    }
    void done() {
      std::unique_lock<std::mutex> guard(lock_);
      done_ = true;
      for (auto& out : receivers_) {
        ::pushmi::set_done(out);
      }
      receivers_.clear();
    }
  };

  struct subject_receiver {
    using properties = property_set<is_receiver<>>;

    std::shared_ptr<subject_shared> s;

    PUSHMI_TEMPLATE(class... VN)
    (requires And<SemiMovable<VN>...>)
    void value(VN&&... vn) {
      s->value((VN &&) vn...);
    }
    PUSHMI_TEMPLATE(class E)
    (requires SemiMovable<E>)
    void error(E e) noexcept {
      s->error(std::move(e));
    }
    void done() {
      s->done();
    }
  };

  std::shared_ptr<subject_shared> s = std::make_shared<subject_shared>();

  auto executor() {
    return trampoline();
  }
  PUSHMI_TEMPLATE(class Out)
  (requires Receiver<Out>)
  void submit(Out out) {
    s->submit(std::move(out));
  }

  auto receiver() {
    return detail::receiver_from_fn<subject>{}(subject_receiver{s});
  }
};

} // namespace pushmi
