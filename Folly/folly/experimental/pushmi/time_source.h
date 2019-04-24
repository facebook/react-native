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
#include <folly/experimental/pushmi/time_single_sender.h>

#include <queue>

//
// time_source is used to build a time_single_executor from a single_executor.
//

namespace pushmi {

template <class E, class TP>
class time_source_shared;

template <class E, class TP, class NF, class Executor>
class time_source_executor;

template <class E, class TP>
class time_heap_item {
 public:
  using time_point = std::decay_t<TP>;

  time_heap_item(
      time_point at,
      any_receiver<E, any_time_executor_ref<E, TP>> out)
      : when(std::move(at)), what(std::move(out)) {}

  time_point when;
  any_receiver<E, any_time_executor_ref<E, TP>> what;
};
template <class E, class TP>
bool operator<(const time_heap_item<E, TP>& l, const time_heap_item<E, TP>& r) {
  return l.when < r.when;
}
template <class E, class TP>
bool operator>(const time_heap_item<E, TP>& l, const time_heap_item<E, TP>& r) {
  return l.when > r.when;
}
template <class E, class TP>
bool operator==(
    const time_heap_item<E, TP>& l,
    const time_heap_item<E, TP>& r) {
  return l.when == r.when;
}
template <class E, class TP>
bool operator!=(
    const time_heap_item<E, TP>& l,
    const time_heap_item<E, TP>& r) {
  return !(l == r);
}
template <class E, class TP>
bool operator<=(
    const time_heap_item<E, TP>& l,
    const time_heap_item<E, TP>& r) {
  return !(l > r);
}
template <class E, class TP>
bool operator>=(
    const time_heap_item<E, TP>& l,
    const time_heap_item<E, TP>& r) {
  return !(l < r);
}

template <class E, class TP>
class time_source_queue_base
    : public std::enable_shared_from_this<time_source_queue_base<E, TP>> {
 public:
  using time_point = std::decay_t<TP>;
  bool dispatching_ = false;
  bool pending_ = false;
  std::priority_queue<
      time_heap_item<E, TP>,
      std::vector<time_heap_item<E, TP>>,
      std::greater<>>
      heap_;

  virtual ~time_source_queue_base() {}

  time_heap_item<E, TP>& top() {
    // :(
    return const_cast<time_heap_item<E, TP>&>(this->heap_.top());
  }

  virtual void dispatch() = 0;
};

template <class E, class TP, class NF, class Executor>
class time_source_queue : public time_source_queue_base<E, TP> {
 public:
  using time_point = std::decay_t<TP>;
  ~time_source_queue() {}
  time_source_queue(
      std::weak_ptr<time_source_shared<E, time_point>> source,
      NF nf,
      Executor ex)
      : source_(std::move(source)), nf_(std::move(nf)), ex_(std::move(ex)) {}
  std::weak_ptr<time_source_shared<E, time_point>> source_;
  NF nf_;
  Executor ex_;

  void dispatch() override;

  auto shared_from_that() {
    return std::static_pointer_cast<time_source_queue<E, TP, NF, Executor>>(
        this->shared_from_this());
  }

  template <class Exec>
  void value(Exec&&) {
    auto s = source_.lock();

    if (s->t_.get_id() == std::this_thread::get_id()) {
      // Executor is not allowed to use the time_source thread
      std::abort();
    }

    //
    // pull ready items from the heap in order.

    // drain anything queued within the next 50ms before
    // going back to the pending queue.
    auto start = nf_() + std::chrono::milliseconds(50);

    std::unique_lock<std::mutex> guard{s->lock_};

    if (!this->dispatching_ || this->pending_) {
      std::abort();
    }

    if (this->heap_.empty()) {
      return;
    }
    auto that = shared_from_that();
    auto subEx = time_source_executor<E, TP, NF, Executor>{s, that};
    while (!this->heap_.empty() && this->heap_.top().when <= start) {
      auto item{std::move(this->top())};
      this->heap_.pop();
      guard.unlock();
      std::this_thread::sleep_until(item.when);
      ::pushmi::set_value(item.what, any_time_executor_ref<E, TP>{subEx});
      ::pushmi::set_done(item.what);
      guard.lock();
      // allows set_value to queue nested items
      --s->items_;
    }

    if (this->heap_.empty()) {
      // if this is empty, tell worker to check for the done condition.
      ++s->dirty_;
      s->wake_.notify_one();
    } else {
      if (!!s->error_) {
        while (!this->heap_.empty()) {
          try {
            auto what{std::move(this->top().what)};
            this->heap_.pop();
            --s->items_;
            guard.unlock();
            ::pushmi::set_error(what, *s->error_);
            guard.lock();
          } catch (...) {
            // we already have an error, ignore this one.
          }
        }
      }
    }
  }
  template <class AE>
  void error(AE e) noexcept {
    auto s = source_.lock();
    std::unique_lock<std::mutex> guard{s->lock_};

    if (!this->dispatching_ || this->pending_) {
      std::abort();
    }

    while (!this->heap_.empty()) {
      auto what{std::move(this->top().what)};
      this->heap_.pop();
      --s->items_;
      guard.unlock();
      ::pushmi::set_error(what, detail::as_const(e));
      guard.lock();
    }
    this->dispatching_ = false;
  }
  void done() {
    auto s = source_.lock();
    std::unique_lock<std::mutex> guard{s->lock_};

    if (!this->dispatching_ || this->pending_) {
      std::abort();
    }
    this->dispatching_ = false;

    // add back to pending_ to get the remaining items dispatched
    s->pending_.push_back(this->shared_from_this());
    this->pending_ = true;
    if (this->heap_.top().when <= s->earliest_) {
      // this is the earliest, tell worker to reset earliest_
      ++s->dirty_;
      s->wake_.notify_one();
    }
  }
};

template <class E, class TP, class NF, class Executor>
struct time_source_queue_receiver
    : std::shared_ptr<time_source_queue<E, TP, NF, Executor>> {
  ~time_source_queue_receiver() {}
  explicit time_source_queue_receiver(
      std::shared_ptr<time_source_queue<E, TP, NF, Executor>> that)
      : std::shared_ptr<time_source_queue<E, TP, NF, Executor>>(that),
        source_(that->source_.lock()) {}
  using properties = property_set<is_receiver<>>;
  std::shared_ptr<time_source_shared<E, TP>> source_;
};

template <class E, class TP, class NF, class Executor>
void time_source_queue<E, TP, NF, Executor>::dispatch() {
  ::pushmi::submit(
      ex_, time_source_queue_receiver<E, TP, NF, Executor>{shared_from_that()});
}

template <class E, class TP>
class time_queue_dispatch_pred_fn {
 public:
  bool operator()(std::shared_ptr<time_source_queue_base<E, TP>>& q) {
    return !q->heap_.empty();
  }
};

template <class E, class TP>
class time_item_process_pred_fn {
 public:
  using time_point = std::decay_t<TP>;
  const time_point* start_;
  time_point* earliest_;
  bool operator()(const std::shared_ptr<time_source_queue_base<E, TP>>& q) {
    // ready for dispatch if it has a ready item
    bool ready =
        !q->dispatching_ && !q->heap_.empty() && q->heap_.top().when <= *start_;
    q->dispatching_ = ready;
    q->pending_ = !ready && !q->heap_.empty();
    // ready queues are ignored, they will update earliest_ after they have
    // processed the ready items
    *earliest_ = !ready && !q->heap_.empty()
        ? min(*earliest_, q->heap_.top().when)
        : *earliest_;
    return q->pending_;
  }
};

template <class E, class TP>
class time_source_shared_base
    : public std::enable_shared_from_this<time_source_shared_base<E, TP>> {
 public:
  using time_point = std::decay_t<TP>;
  std::mutex lock_;
  std::condition_variable wake_;
  std::thread t_;
  std::chrono::system_clock::time_point earliest_;
  bool done_;
  bool joined_;
  int dirty_;
  int items_;
  detail::opt<E> error_;
  std::deque<std::shared_ptr<time_source_queue_base<E, TP>>> pending_;

  time_source_shared_base()
      : earliest_(std::chrono::system_clock::now() + std::chrono::hours(24)),
        done_(false),
        joined_(false),
        dirty_(0),
        items_(0) {}
};

template <class E, class TP>
class time_source_shared : public time_source_shared_base<E, TP> {
 public:
  std::thread t_;
  // this is safe to reuse as long as there is only one thread in the
  // time_source_shared
  std::vector<std::shared_ptr<time_source_queue_base<E, TP>>> ready_;

  ~time_source_shared() {
    // not allowed to be discarded without joining and completing all queued
    // items
    if (t_.joinable() || this->items_ != 0) {
      std::abort();
    }
  }
  time_source_shared() {}

  static void start(std::shared_ptr<time_source_shared<E, TP>> that) {
    that->t_ = std::thread{&time_source_shared<E, TP>::worker, that};
  }
  static void join(std::shared_ptr<time_source_shared<E, TP>> that) {
    std::unique_lock<std::mutex> guard{that->lock_};
    that->done_ = true;
    ++that->dirty_;
    that->wake_.notify_one();
    guard.unlock();
    that->t_.join();
  }

  static void worker(std::shared_ptr<time_source_shared<E, TP>> that) {
    try {
      std::unique_lock<std::mutex> guard{that->lock_};

      // once done_, keep going until empty
      while (!that->done_ || that->items_ > 0) {
        // wait for something to do
        that->wake_.wait_until(guard, that->earliest_, [&]() {
          return that->dirty_ != 0 ||
              std::chrono::system_clock::now() >= that->earliest_;
        });
        that->dirty_ = 0;

        //
        // select ready and empty queues and reset earliest_

        auto start = std::chrono::system_clock::now();
        auto earliest = start + std::chrono::hours(24);
        auto process = time_item_process_pred_fn<E, TP>{&start, &earliest};

        auto process_begin = std::partition(
            that->pending_.begin(), that->pending_.end(), process);
        that->earliest_ = earliest;

        // copy out the queues that have ready items so that the lock
        // is not held during dispatch

        std::copy_if(
            process_begin,
            that->pending_.end(),
            std::back_inserter(that->ready_),
            time_queue_dispatch_pred_fn<E, TP>{});

        // remove processed queues from pending queue.
        that->pending_.erase(process_begin, that->pending_.end());

        // printf("d %lu, %lu, %d, %ld\n", that->pending_.size(),
        // that->ready_.size(), that->items_,
        // std::chrono::duration_cast<std::chrono::milliseconds>(earliest -
        // start).count());

        // dispatch to queues with ready items
        guard.unlock();
        for (auto& q : that->ready_) {
          q->dispatch();
        }
        guard.lock();
        that->ready_.clear();
      }
      that->joined_ = true;
    } catch (...) {
      //
      // block any more items from being enqueued, all new items will be sent
      // this error on the same context that calls submit
      //
      // also dispatch errors to all items already in the queues from the
      // time thread
      std::unique_lock<std::mutex> guard{that->lock_};
      // creates a dependency that std::exception_ptr must be ConvertibleTo E
      // TODO: break this dependency rather than enforce it with concepts
      that->error_ = std::current_exception();
      for (auto& q : that->pending_) {
        while (!q->heap_.empty()) {
          try {
            auto what{std::move(q->top().what)};
            q->heap_.pop();
            --that->items_;
            guard.unlock();
            ::pushmi::set_error(what, *that->error_);
            guard.lock();
          } catch (...) {
            // we already have an error, ignore this one.
          }
        }
      }
    }
  }

  void insert(
      std::shared_ptr<time_source_queue_base<E, TP>> queue,
      time_heap_item<E, TP> item) {
    std::unique_lock<std::mutex> guard{this->lock_};

    // deliver error_ and return
    if (!!this->error_) {
      ::pushmi::set_error(item.what, *this->error_);
      return;
    }
    // once join() is called, new work queued to the executor is not safe unless
    // it is nested in an existing item.
    if (!!this->joined_) {
      std::abort();
    };

    queue->heap_.push(std::move(item));
    ++this->items_;

    if (!queue->dispatching_ && !queue->pending_) {
      // add queue to pending pending_ list if it is not already there
      this->pending_.push_back(queue);
      queue->pending_ = true;
    }

    if (queue->heap_.top().when < this->earliest_) {
      // this is the earliest, tell worker to reset earliest_
      ++this->dirty_;
      this->wake_.notify_one();
    }
  }
};

//
// the time executor will queue the work to the time ordered heap.
//

template <class E, class TP, class NF, class Executor>
class time_source_executor {
  using time_point = std::decay_t<TP>;
  std::shared_ptr<time_source_shared<E, time_point>> source_;
  std::shared_ptr<time_source_queue<E, time_point, NF, Executor>> queue_;

 public:
  using properties = property_set<
      is_time<>,
      is_executor<>,
      is_maybe_blocking<>,
      is_fifo_sequence<>,
      is_single<>>;

  time_source_executor(
      std::shared_ptr<time_source_shared<E, time_point>> source,
      std::shared_ptr<time_source_queue<E, time_point, NF, Executor>> queue)
      : source_(std::move(source)), queue_(std::move(queue)) {}

  auto top() {
    return queue_->nf_();
  }
  auto executor() {
    return *this;
  }

  PUSHMI_TEMPLATE(class TPA, class Out)
  (requires Regular<TPA>&& ReceiveValue<Out, any_time_executor_ref<E, TP>>&&
       ReceiveError<Out, E>)
  void submit(TPA tp, Out out) {
    // queue for later
    source_->insert(
        queue_,
        time_heap_item<E, TP>{
            tp, any_receiver<E, any_time_executor_ref<E, TP>>{std::move(out)}});
  }
};

//
// the time executor factory produces a new time ordered queue each time that it
// is called.
//

template <class E, class TP, class NF, class ExecutorFactory>
class time_source_executor_factory_fn {
  using time_point = std::decay_t<TP>;
  std::shared_ptr<time_source_shared<E, time_point>> source_;
  NF nf_;
  ExecutorFactory ef_;

 public:
  time_source_executor_factory_fn(
      std::shared_ptr<time_source_shared<E, time_point>> source,
      NF nf,
      ExecutorFactory ef)
      : source_(std::move(source)), nf_(std::move(nf)), ef_(std::move(ef)) {}
  auto operator()() {
    auto ex = ef_();
    auto queue =
        std::make_shared<time_source_queue<E, time_point, NF, decltype(ex)>>(
            source_, nf_, std::move(ex));
    return time_source_executor<E, time_point, NF, decltype(ex)>{source_,
                                                                 queue};
  }
};

//
// each time_source is an independent source of timed events
//
// a time_source is a time_single_executor factory, it is not an executor
// itself.
//
// each time_source has a single thread that is shared across all the
// time executors it produces. the thread is used to wait for the next time
// event. when a time event is ready the thread will use the executor passed
// into make() to callback on the receiver passed to the time executor submit()
//
// passing an executor to time_source.make() will create a time executor
// factory. the time executor factory is a function that will return a time
// executor when called with no arguments.
//
//
//

template <
    class E = std::exception_ptr,
    class TP = std::chrono::system_clock::time_point>
class time_source {
 public:
  using time_point = std::decay_t<TP>;

 private:
  std::shared_ptr<time_source_shared<E, time_point>> source_;

 public:
  time_source()
      : source_(std::make_shared<time_source_shared<E, time_point>>()) {
    source_->start(source_);
  }

  PUSHMI_TEMPLATE(class NF, class ExecutorFactory)
  (requires Invocable<ExecutorFactory&>&&
       Executor<invoke_result_t<ExecutorFactory&>>&&
           NeverBlocking<invoke_result_t<
               ExecutorFactory&>>)
  auto make(NF nf, ExecutorFactory ef) {
    return time_source_executor_factory_fn<E, time_point, NF, ExecutorFactory>{
        source_, std::move(nf), std::move(ef)};
  }

  void join() {
    source_->join(source_);
  }
};
} // namespace pushmi
