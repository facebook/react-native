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

#include <folly/experimental/pushmi/flow_many_sender.h>
#include <folly/experimental/pushmi/many_sender.h>
#include <folly/experimental/pushmi/o/extension_operators.h>
#include <folly/experimental/pushmi/o/submit.h>
#include <folly/experimental/pushmi/trampoline.h>

namespace pushmi {

PUSHMI_CONCEPT_DEF(
    template(class R)
    concept Range,
      requires(R&& r)(
        implicitly_convertible_to<bool>(std::begin(r) == std::end(r)))
);

namespace operators {

PUSHMI_INLINE_VAR constexpr struct from_fn {
 private:
  struct sender_base : many_sender<ignoreSF, inlineEXF> {
    using properties = property_set<
        is_sender<>,
        is_many<>,
        is_always_blocking<>,
        is_fifo_sequence<>>;
  };
  template <class I, class S>
  struct out_impl {
    I begin_;
    S end_;
    PUSHMI_TEMPLATE(class Out)
    (requires ReceiveValue<
        Out,
        typename std::iterator_traits<I>::value_type>)
    void operator()(sender_base&, Out out) const {
      auto c = begin_;
      for (; c != end_; ++c) {
        ::pushmi::set_value(out, *c);
      }
      ::pushmi::set_done(out);
    }
  };

 public:
  PUSHMI_TEMPLATE(class I, class S)
  (requires DerivedFrom<
      typename std::iterator_traits<I>::iterator_category,
      std::forward_iterator_tag>)
  auto operator()(I begin, S end) const {
    return make_many_sender(sender_base{}, out_impl<I, S>{begin, end});
  }

  PUSHMI_TEMPLATE(class R)
  (requires Range<R>)
  auto operator()(R&& range) const {
    return (*this)(std::begin(range), std::end(range));
  }
} from{};

template <class I, class S, class Out, class Exec>
struct flow_from_producer {
  flow_from_producer(I begin, S end, Out out, Exec exec, bool s)
      : c(begin),
        end(end),
        out(std::move(out)),
        exec(std::move(exec)),
        stop(s) {}
  I c;
  S end;
  Out out;
  Exec exec;
  std::atomic<bool> stop;
};

template <class Producer>
struct flow_from_up {
  using properties = properties_t<receiver<>>;

  explicit flow_from_up(std::shared_ptr<Producer> p) : p(std::move(p)) {}
  std::shared_ptr<Producer> p;

  void value(std::ptrdiff_t requested) {
    if (requested < 1) {
      return;
    }
    // submit work to exec
    ::pushmi::submit(p->exec, make_receiver([p = p, requested](auto) {
                       auto remaining = requested;
                       // this loop is structured to work when there is
                       // re-entrancy out.value in the loop may call up.value.
                       // to handle this the state of p->c must be captured and
                       // the remaining and p->c must be changed before
                       // out.value is called.
                       while (remaining-- > 0 && !p->stop && p->c != p->end) {
                         auto i = (p->c)++;
                         ::pushmi::set_value(
                             p->out, ::pushmi::detail::as_const(*i));
                       }
                       if (p->c == p->end) {
                         ::pushmi::set_done(p->out);
                       }
                     }));
  }

  template <class E>
  void error(E) noexcept {
    p->stop.store(true);
    ::pushmi::submit(
        p->exec, make_receiver([p = p](auto) { ::pushmi::set_done(p->out); }));
  }

  void done() {
    p->stop.store(true);
    ::pushmi::submit(
        p->exec, make_receiver([p = p](auto) { ::pushmi::set_done(p->out); }));
  }
};

PUSHMI_INLINE_VAR constexpr struct flow_from_fn {
 private:
  template <class I, class S, class Exec>
  struct out_impl {
    I begin_;
    S end_;
    mutable Exec exec_;
    PUSHMI_TEMPLATE(class Out)
    (requires ReceiveValue<
        Out,
        typename std::iterator_traits<I>::value_type>)
    void operator()(Out out) const {
      using Producer = flow_from_producer<I, S, Out, Exec>;
      auto p = std::make_shared<Producer>(
          begin_, end_, std::move(out), exec_, false);

      ::pushmi::submit(exec_, make_receiver([p](auto) {
                         // pass reference for cancellation.
                         ::pushmi::set_starting(
                             p->out, make_receiver(flow_from_up<Producer>{p}));
                       }));
    }
  };

 public:
  PUSHMI_TEMPLATE(class I, class S)
  (requires DerivedFrom<
      typename std::iterator_traits<I>::iterator_category,
      std::forward_iterator_tag>)
  auto operator()(I begin, S end) const {
    return (*this)(begin, end, trampoline());
  }

  PUSHMI_TEMPLATE(class R)
  (requires Range<R>)
  auto operator()(R&& range) const {
    return (*this)(std::begin(range), std::end(range), trampoline());
  }

  PUSHMI_TEMPLATE(class I, class S, class Exec)
  (requires DerivedFrom<
      typename std::iterator_traits<I>::iterator_category,
      std::forward_iterator_tag>&& Sender<Exec, is_single<>, is_executor<>>)
  auto operator()(I begin, S end, Exec exec) const {
    return make_flow_many_sender(out_impl<I, S, Exec>{begin, end, exec});
  }

  PUSHMI_TEMPLATE(class R, class Exec)
  (requires Range<R>&& Sender<Exec, is_single<>, is_executor<>>)
  auto operator()(
      R&& range,
      Exec exec) const {
    return (*this)(std::begin(range), std::end(range), exec);
  }
} flow_from{};

} // namespace operators

} // namespace pushmi
