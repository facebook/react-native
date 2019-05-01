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

#include <folly/experimental/pushmi/o/defer.h>
#include <folly/experimental/pushmi/o/for_each.h>
#include <folly/experimental/pushmi/o/from.h>
#include <folly/experimental/pushmi/o/just.h>
#include <folly/experimental/pushmi/o/on.h>
#include <folly/experimental/pushmi/o/submit.h>
#include <folly/experimental/pushmi/o/tap.h>
#include <folly/experimental/pushmi/o/transform.h>
#include <folly/experimental/pushmi/o/via.h>

#include <folly/experimental/pushmi/new_thread.h>
#include <folly/experimental/pushmi/time_source.h>
#include <folly/experimental/pushmi/trampoline.h>

#include <folly/experimental/pushmi/entangle.h>
#include <folly/experimental/pushmi/receiver.h>

#include <folly/experimental/pushmi/pool.h>

using namespace pushmi::aliases;

template <class R>
struct countdown {
  explicit countdown(std::atomic<int>& c) : counter(&c) {}

  using properties = mi::properties_t<decltype(R{}())>;

  std::atomic<int>* counter;

  template <class ExecutorRef>
  void value(ExecutorRef exec);
  template <class E>
  void error(E e) {
    std::abort();
  }
  void done() {}
  PUSHMI_TEMPLATE(class Up)
  (requires mi::Invocable<
      decltype(mi::set_value),
      Up,
      std::ptrdiff_t>)void starting(Up up) {
    mi::set_value(up, 1);
  }
  PUSHMI_TEMPLATE(class Up)
  (requires mi::True<>&& mi::
       Invocable<decltype(mi::set_value), Up>)void starting(Up up) volatile {
    mi::set_value(up);
  }
};

template <class R>
template <class ExecutorRef>
void countdown<R>::value(ExecutorRef exec) {
  if (--*counter >= 0) {
    exec | op::submit(R{}(*this));
  }
}

using countdownsingle = countdown<decltype(mi::make_receiver)>;
using countdownflowsingle = countdown<decltype(mi::make_flow_receiver)>;
using countdownmany = countdown<decltype(mi::make_receiver)>;
using countdownflowmany = countdown<decltype(mi::make_flow_receiver)>;

struct inline_time_executor {
  using properties = mi::property_set<
      mi::is_time<>,
      mi::is_executor<>,
      mi::is_fifo_sequence<>,
      mi::is_always_blocking<>,
      mi::is_single<>>;

  std::chrono::system_clock::time_point top() {
    return std::chrono::system_clock::now();
  }
  auto executor() {
    return *this;
  }
  template <class Out>
  void submit(std::chrono::system_clock::time_point at, Out out) {
    std::this_thread::sleep_until(at);
    ::mi::set_value(out, *this);
  }
};

struct inline_executor {
  using properties = mi::property_set<
      mi::is_sender<>,
      mi::is_fifo_sequence<>,
      mi::is_always_blocking<>,
      mi::is_single<>>;
  auto executor() {
    return inline_time_executor{};
  }
  template <class Out>
  void submit(Out out) {
    ::mi::set_value(out, *this);
  }
};

template <class CancellationFactory>
struct inline_executor_flow_single {
  CancellationFactory cf;

  using properties = mi::property_set<
      mi::is_sender<>,
      mi::is_flow<>,
      mi::is_fifo_sequence<>,
      mi::is_maybe_blocking<>,
      mi::is_single<>>;
  auto executor() {
    return inline_time_executor{};
  }
  template <class Out>
  void submit(Out out) {
    auto tokens = cf();

    using Stopper = decltype(tokens.second);
    struct Data : mi::receiver<> {
      explicit Data(Stopper stopper) : stopper(std::move(stopper)) {}
      Stopper stopper;
    };
    auto up = mi::MAKE(receiver)(
        Data{std::move(tokens.second)},
        [](auto& data) {},
        [](auto& data, auto e) noexcept {
          auto both = lock_both(data.stopper);
          (*(both.first))(both.second);
        },
        [](auto& data) {
          auto both = lock_both(data.stopper);
          (*(both.first))(both.second);
        });

    // pass reference for cancellation.
    ::mi::set_starting(out, std::move(up));

    auto both = lock_both(tokens.first);
    if (!!both.first && !*(both.first)) {
      ::mi::set_value(out, *this);
    } else {
      // cancellation is not an error
      ::mi::set_done(out);
    }
  }
};

struct shared_cancellation_factory {
  auto operator()() {
    // boolean cancellation
    bool stop = false;
    auto set_stop = [](auto& stop) {
      if (!!stop) {
        *stop = true;
      }
    };
    return mi::shared_entangle(stop, set_stop);
  }
};
using inline_executor_flow_single_shared =
    inline_executor_flow_single<shared_cancellation_factory>;

struct entangled_cancellation_factory {
  auto operator()() {
    // boolean cancellation
    bool stop = false;
    auto set_stop = [](auto& stop) {
      if (!!stop) {
        *stop = true;
      }
    };
    return mi::entangle(stop, set_stop);
  }
};
using inline_executor_flow_single_entangled =
    inline_executor_flow_single<entangled_cancellation_factory>;

struct inline_executor_flow_single_ignore {
  using properties = mi::property_set<
      mi::is_sender<>,
      mi::is_flow<>,
      mi::is_fifo_sequence<>,
      mi::is_maybe_blocking<>,
      mi::is_single<>>;
  auto executor() {
    return inline_time_executor{};
  }
  template <class Out>
  void submit(Out out) {
    // pass reference for cancellation.
    ::mi::set_starting(out, mi::receiver<>{});

    ::mi::set_value(out, *this);
  }
};

struct inline_executor_flow_many {
  inline_executor_flow_many() : counter(nullptr) {}
  inline_executor_flow_many(std::atomic<int>& c) : counter(&c) {}

  std::atomic<int>* counter;

  using properties = mi::property_set<
      mi::is_sender<>,
      mi::is_flow<>,
      mi::is_fifo_sequence<>,
      mi::is_maybe_blocking<>,
      mi::is_many<>>;

  auto executor() {
    return inline_time_executor{};
  }
  template <class Out>
  void submit(Out out) {
    // boolean cancellation
    struct producer {
      producer(Out out, bool s) : out(std::move(out)), stop(s) {}
      Out out;
      std::atomic<bool> stop;
    };
    auto p = std::make_shared<producer>(std::move(out), false);

    struct Data : mi::receiver<> {
      explicit Data(std::shared_ptr<producer> p) : p(std::move(p)) {}
      std::shared_ptr<producer> p;
    };

    auto up = mi::MAKE(receiver)(
        Data{p},
        [counter = this->counter](auto& data, auto requested) {
          if (requested < 1) {
            return;
          }
          // this is re-entrant
          while (!data.p->stop && --requested >= 0 &&
                 (!counter || --*counter >= 0)) {
            ::mi::set_value(
                data.p->out,
                !!counter ? inline_executor_flow_many{*counter}
                          : inline_executor_flow_many{});
          }
          if (!counter || *counter == 0) {
            ::mi::set_done(data.p->out);
          }
        },
        [](auto& data, auto e) noexcept {
          data.p->stop.store(true);
          ::mi::set_done(data.p->out);
        },
        [](auto& data) {
          data.p->stop.store(true);
          ::mi::set_done(data.p->out);
        });

    // pass reference for cancellation.
    ::mi::set_starting(p->out, std::move(up));
  }
};

struct inline_executor_flow_many_ignore {
  using properties = mi::property_set<
      mi::is_sender<>,
      mi::is_flow<>,
      mi::is_fifo_sequence<>,
      mi::is_always_blocking<>,
      mi::is_many<>>;
  auto executor() {
    return inline_time_executor{};
  }
  template <class Out>
  void submit(Out out) {
    // pass reference for cancellation.
    ::mi::set_starting(out, mi::receiver<>{});

    ::mi::set_value(out, *this);

    ::mi::set_done(out);
  }
};

struct inline_executor_many {
  using properties = mi::property_set<
      mi::is_sender<>,
      mi::is_fifo_sequence<>,
      mi::is_always_blocking<>,
      mi::is_many<>>;
  auto executor() {
    return inline_time_executor{};
  }
  template <class Out>
  void submit(Out out) {
    ::mi::set_value(out, *this);
    ::mi::set_done(out);
  }
};

#define concept Concept
#include <nonius/nonius.h++>

NONIUS_BENCHMARK("ready 1'000 single get (submit)", [](nonius::chronometer meter){
  int counter{0};
  meter.measure([&]{
    counter = 1'000;
    while (--counter >=0) {
      auto fortyTwo = op::just(42) | op::get<int>;
    }
    return counter;
  });
})

NONIUS_BENCHMARK("ready 1'000 single get (blocking_submit)", [](nonius::chronometer meter){
  int counter{0};
  meter.measure([&]{
    counter = 1'000;
    while (--counter >=0) {
      auto fortyTwo = mi::make_single_sender([](auto out){ mi::set_value(out, 42); mi::set_done(out);}) | op::get<int>;
    }
    return counter;
  });
})

NONIUS_BENCHMARK("inline 1'000 single", [](nonius::chronometer meter){
  std::atomic<int> counter{0};
  auto ie = inline_executor{};
  using IE = decltype(ie);
  countdownsingle single{counter};
  meter.measure([&]{
    counter.store(1'000);
    ie | op::submit(mi::make_receiver(single));
    while(counter.load() > 0);
    return counter.load();
  });
})

NONIUS_BENCHMARK("inline 1'000 time single", [](nonius::chronometer meter){
  std::atomic<int> counter{0};
  auto ie = inline_time_executor{};
  using IE = decltype(ie);
  countdownsingle single{counter};
  meter.measure([&]{
    counter.store(1'000);
    ie | op::submit(mi::make_receiver(single));
    while(counter.load() > 0);
    return counter.load();
  });
})

NONIUS_BENCHMARK("inline 1'000 many", [](nonius::chronometer meter){
  std::atomic<int> counter{0};
  auto ie = inline_executor_many{};
  using IE = decltype(ie);
  countdownmany many{counter};
  meter.measure([&]{
    counter.store(1'000);
    ie | op::submit(mi::make_receiver(many));
    while(counter.load() > 0);
    return counter.load();
  });
})

NONIUS_BENCHMARK("inline 1'000 flow_single shared", [](nonius::chronometer meter){
  std::atomic<int> counter{0};
  auto ie = inline_executor_flow_single_shared{};
  using IE = decltype(ie);
  countdownflowsingle flowsingle{counter};
  meter.measure([&]{
    counter.store(1'000);
    ie | op::submit(mi::make_flow_receiver(flowsingle));
    while(counter.load() > 0);
    return counter.load();
  });
})

NONIUS_BENCHMARK("inline 1'000 flow_single entangle", [](nonius::chronometer meter){
  std::atomic<int> counter{0};
  auto ie = inline_executor_flow_single_entangled{};
  using IE = decltype(ie);
  countdownflowsingle flowsingle{counter};
  meter.measure([&]{
    counter.store(1'000);
    ie | op::submit(mi::make_flow_receiver(flowsingle));
    while(counter.load() > 0);
    return counter.load();
  });
})

NONIUS_BENCHMARK("inline 1'000 flow_single ignore cancellation", [](nonius::chronometer meter){
  std::atomic<int> counter{0};
  auto ie = inline_executor_flow_single_ignore{};
  using IE = decltype(ie);
  countdownflowsingle flowsingle{counter};
  meter.measure([&]{
    counter.store(1'000);
    ie | op::submit(mi::make_flow_receiver(flowsingle));
    while(counter.load() > 0);
    return counter.load();
  });
})

NONIUS_BENCHMARK("inline 1'000 flow_many", [](nonius::chronometer meter){
  std::atomic<int> counter{0};
  auto ie = inline_executor_flow_many{};
  using IE = decltype(ie);
  countdownflowmany flowmany{counter};
  meter.measure([&]{
    counter.store(1'000);
    ie | op::submit(mi::make_flow_receiver(flowmany));
    while(counter.load() > 0);
    return counter.load();
  });
})

NONIUS_BENCHMARK("inline 1 flow_many with 1'000 values pull 1", [](nonius::chronometer meter){
  std::atomic<int> counter{0};
  auto ie = inline_executor_flow_many{counter};
  using IE = decltype(ie);
  meter.measure([&]{
    counter.store(1'000);
    ie | op::for_each(mi::make_receiver());
    while(counter.load() > 0);
    return counter.load();
  });
})

NONIUS_BENCHMARK("inline 1 flow_many with 1'000 values pull 1'000", [](nonius::chronometer meter){
  std::atomic<int> counter{0};
  auto ie = inline_executor_flow_many{counter};
  using IE = decltype(ie);
  meter.measure([&]{
    counter.store(1'000);
    ie | op::submit(mi::make_flow_receiver(mi::ignoreNF{}, mi::abortEF{}, mi::ignoreDF{}, [](auto up){
      mi::set_value(up, 1'000);
    }));
    while(counter.load() > 0);
    return counter.load();
  });
})

NONIUS_BENCHMARK("inline 1'000 flow_many ignore cancellation", [](nonius::chronometer meter){
  std::atomic<int> counter{0};
  auto ie = inline_executor_flow_many_ignore{};
  using IE = decltype(ie);
  countdownflowmany flowmany{counter};
  meter.measure([&]{
    counter.store(1'000);
    ie | op::submit(mi::make_flow_receiver(flowmany));
    while(counter.load() > 0);
    return counter.load();
  });
})

NONIUS_BENCHMARK("trampoline 1'000 single get (blocking_submit)", [](nonius::chronometer meter){
  int counter{0};
  auto tr = mi::trampoline();
  using TR = decltype(tr);
  meter.measure([&]{
    counter = 1'000;
    while (--counter >=0) {
      auto fortyTwo = tr | op::transform([](auto){return 42;}) | op::get<int>;
    }
    return counter;
  });
})

NONIUS_BENCHMARK("trampoline static derecursion 1'000", [](nonius::chronometer meter){
  std::atomic<int> counter{0};
  auto tr = mi::trampoline();
  using TR = decltype(tr);
  countdownsingle single{counter};
  meter.measure([&]{
    counter.store(1'000);
    tr | op::submit(single);
    while(counter.load() > 0);
    return counter.load();
  });
})

NONIUS_BENCHMARK("trampoline virtual derecursion 1'000", [](nonius::chronometer meter){
  std::atomic<int> counter{0};
  auto tr = mi::trampoline();
  using TR = decltype(tr);
  auto single = countdownsingle{counter};
  std::function<void(mi::any_executor_ref<>)> recurse{[&](auto exec){::pushmi::set_value(single, exec);}};
  meter.measure([&]{
    counter.store(1'000);
    tr | op::submit([&](auto exec) { recurse(exec); });
    while(counter.load() > 0);
    return counter.load();
  });
})

NONIUS_BENCHMARK("trampoline flow_many_sender 1'000", [](nonius::chronometer meter){
  std::atomic<int> counter{0};
  auto tr = mi::trampoline();
  using TR = decltype(tr);
  std::vector<int> values(1'000);
  std::iota(values.begin(), values.end(), 1);
  auto f = op::flow_from(values, tr) | op::tap([&](int){
    --counter;
  });
  meter.measure([&]{
    counter.store(1'000);
    f | op::for_each(mi::make_receiver());
    while(counter.load() > 0);
    return counter.load();
  });
})

NONIUS_BENCHMARK("pool{1} submit 1'000", [](nonius::chronometer meter){
  mi::pool pl{std::max(1u,std::thread::hardware_concurrency())};
  auto pe = pl.executor();
  using PE = decltype(pe);
  std::atomic<int> counter{0};
  countdownsingle single{counter};
  meter.measure([&]{
    counter.store(1'000);
    pe | op::submit(single);
    while(counter.load() > 0);
    return counter.load();
  });
})

NONIUS_BENCHMARK("pool{hardware_concurrency} submit 1'000", [](nonius::chronometer meter){
  mi::pool pl{std::min(1u,std::thread::hardware_concurrency())};
  auto pe = pl.executor();
  using PE = decltype(pe);
  std::atomic<int> counter{0};
  countdownsingle single{counter};
  meter.measure([&]{
    counter.store(1'000);
    pe | op::submit(single);
    while(counter.load() > 0);
    return counter.load();
  });
})

NONIUS_BENCHMARK("new thread submit 1'000", [](nonius::chronometer meter){
  auto nt = mi::new_thread();
  using NT = decltype(nt);
  std::atomic<int> counter{0};
  countdownsingle single{counter};
  meter.measure([&]{
    counter.store(1'000);
    nt | op::submit(single);
    while(counter.load() > 0);
    return counter.load();
  });
})

NONIUS_BENCHMARK("new thread blocking_submit 1'000", [](nonius::chronometer meter){
  auto nt = mi::new_thread();
  using NT = decltype(nt);
  std::atomic<int> counter{0};
  countdownsingle single{counter};
  meter.measure([&]{
    counter.store(1'000);
    nt | op::blocking_submit(single);
    return counter.load();
  });
})

NONIUS_BENCHMARK("new thread + time submit 1'000", [](nonius::chronometer meter){
  auto nt = mi::new_thread();
  using NT = decltype(nt);
  auto time = mi::time_source<>{};
  auto tnt = time.make(mi::systemNowF{}, [nt](){ return nt; })();
  using TNT = decltype(tnt);
  std::atomic<int> counter{0};
  countdownsingle single{counter};
  meter.measure([&]{
    counter.store(1'000);
    tnt | op::submit(single);
    while(counter.load() > 0);
    return counter.load();
  });
  time.join();
})
