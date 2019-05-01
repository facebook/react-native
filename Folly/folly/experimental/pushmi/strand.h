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
#include <folly/experimental/pushmi/single_sender.h>

#include <queue>

namespace pushmi {

template <class E, class Executor>
class strand_executor;

template <class E, class Executor>
struct strand_queue_receiver;

template <class E>
class strand_item {
 public:
  strand_item(any_receiver<E, any_executor_ref<E>> out)
      : what(std::move(out)) {}

  any_receiver<E, any_executor_ref<E>> what;
};
template <class E, class TP>
bool operator<(const strand_item<E>& l, const strand_item<E>& r) {
  return l.when < r.when;
}
template <class E, class TP>
bool operator>(const strand_item<E>& l, const strand_item<E>& r) {
  return l.when > r.when;
}
template <class E, class TP>
bool operator==(const strand_item<E>& l, const strand_item<E>& r) {
  return l.when == r.when;
}
template <class E, class TP>
bool operator!=(const strand_item<E>& l, const strand_item<E>& r) {
  return !(l == r);
}
template <class E, class TP>
bool operator<=(const strand_item<E>& l, const strand_item<E>& r) {
  return !(l > r);
}
template <class E, class TP>
bool operator>=(const strand_item<E>& l, const strand_item<E>& r) {
  return !(l < r);
}

template <class E>
class strand_queue_base
    : public std::enable_shared_from_this<strand_queue_base<E>> {
 public:
  std::mutex lock_;
  size_t remaining_ = 0;
  std::queue<strand_item<E>> items_;

  virtual ~strand_queue_base() {}

  strand_item<E>& front() {
    // :(
    return const_cast<strand_item<E>&>(this->items_.front());
  }

  virtual void dispatch() = 0;
};

template <class E, class Executor>
class strand_queue : public strand_queue_base<E> {
 public:
  ~strand_queue() {}
  strand_queue(Executor ex) : ex_(std::move(ex)) {}
  Executor ex_;

  void dispatch() override;

  auto shared_from_that() {
    return std::static_pointer_cast<strand_queue<E, Executor>>(
        this->shared_from_this());
  }

  template <class Exec>
  void value(Exec&&) {
    //
    // pull ready items from the queue in order.

    std::unique_lock<std::mutex> guard{this->lock_};

    // only allow one at a time
    if (this->remaining_ > 0) {
      return;
    }
    // skip when empty
    if (this->items_.empty()) {
      return;
    }

    // do not allow recursive queueing to block this executor
    this->remaining_ = this->items_.size();

    auto that = shared_from_that();
    auto subEx = strand_executor<E, Executor>{that};

    while (!this->items_.empty() && --this->remaining_ >= 0) {
      auto item{std::move(this->front())};
      this->items_.pop();
      guard.unlock();
      ::pushmi::set_value(item.what, any_executor_ref<E>{subEx});
      ::pushmi::set_done(item.what);
      guard.lock();
    }
  }
  template <class AE>
  void error(AE e) noexcept {
    std::unique_lock<std::mutex> guard{this->lock_};

    this->remaining_ = 0;

    while (!this->items_.empty()) {
      auto what{std::move(this->front().what)};
      this->items_.pop();
      guard.unlock();
      ::pushmi::set_error(what, detail::as_const(e));
      guard.lock();
    }
  }
  void done() {
    std::unique_lock<std::mutex> guard{this->lock_};

    // only allow one at a time
    if (this->remaining_ > 0) {
      return;
    }
    // skip when empty
    if (this->items_.empty()) {
      return;
    }

    auto that = shared_from_that();
    ::pushmi::submit(ex_, strand_queue_receiver<E, Executor>{that});
  }
};

template <class E, class Executor>
struct strand_queue_receiver : std::shared_ptr<strand_queue<E, Executor>> {
  ~strand_queue_receiver() {}
  explicit strand_queue_receiver(
      std::shared_ptr<strand_queue<E, Executor>> that)
      : std::shared_ptr<strand_queue<E, Executor>>(that) {}
  using properties = property_set<is_receiver<>>;
};

template <class E, class Executor>
void strand_queue<E, Executor>::dispatch() {
  ::pushmi::submit(ex_, strand_queue_receiver<E, Executor>{shared_from_that()});
}

//
// strand is used to build a fifo single_executor from a concurrent
// single_executor.
//

template <class E, class Executor>
class strand_executor {
  std::shared_ptr<strand_queue<E, Executor>> queue_;

 public:
  using properties = property_set<
      is_sender<>,
      is_executor<>,
      property_set_index_t<properties_t<Executor>, is_never_blocking<>>,
      is_fifo_sequence<>,
      is_single<>>;

  strand_executor(std::shared_ptr<strand_queue<E, Executor>> queue)
      : queue_(std::move(queue)) {}

  auto executor() {
    return *this;
  }

  PUSHMI_TEMPLATE(class Out)
  (requires ReceiveValue<Out, any_executor_ref<E>>&&
       ReceiveError<Out, E>)
  void submit(Out out) {
    // queue for later
    std::unique_lock<std::mutex> guard{queue_->lock_};
    queue_->items_.push(any_receiver<E, any_executor_ref<E>>{std::move(out)});
    if (queue_->remaining_ == 0) {
      // noone is minding the shop, send a worker
      ::pushmi::submit(queue_->ex_, strand_queue_receiver<E, Executor>{queue_});
    }
  }
};

//
// the strand executor factory produces a new fifo ordered queue each time that
// it is called.
//

template <class E, class ExecutorFactory>
class strand_executor_factory_fn {
  ExecutorFactory ef_;

 public:
  explicit strand_executor_factory_fn(ExecutorFactory ef)
      : ef_(std::move(ef)) {}
  auto operator()() const {
    auto ex = ef_();
    auto queue = std::make_shared<strand_queue<E, decltype(ex)>>(std::move(ex));
    return strand_executor<E, decltype(ex)>{queue};
  }
};

template <class Exec>
class same_executor_factory_fn {
  Exec ex_;

 public:
  explicit same_executor_factory_fn(Exec ex) : ex_(std::move(ex)) {}
  auto operator()() const {
    return ex_;
  }
};

PUSHMI_TEMPLATE(class E = std::exception_ptr, class ExecutorFactory)
(requires Invocable<ExecutorFactory&>&&
     Executor<invoke_result_t<ExecutorFactory&>>&& ConcurrentSequence<
         invoke_result_t<ExecutorFactory&>>)
auto strands(ExecutorFactory ef) {
  return strand_executor_factory_fn<E, ExecutorFactory>{std::move(ef)};
}
PUSHMI_TEMPLATE(class E = std::exception_ptr, class Exec)
(requires Executor<Exec>&& ConcurrentSequence<Exec>)
auto strands(Exec ex) {
  return strand_executor_factory_fn<E, same_executor_factory_fn<Exec>>{
      same_executor_factory_fn<Exec>{std::move(ex)}};
}

} // namespace pushmi
