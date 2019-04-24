/*
 * Copyright 2014-present Facebook, Inc.
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

#include <folly/Benchmark.h>
#include <folly/executors/InlineExecutor.h>
#include <folly/futures/Future.h>
#include <folly/futures/Promise.h>
#include <folly/portability/GFlags.h>
#include <folly/portability/Semaphore.h>
#include <folly/synchronization/Baton.h>

#include <vector>

using namespace folly;

namespace {

template <class T>
T incr(Try<T>&& t) {
  return t.value() + 1;
}

void someThens(size_t n) {
  auto f = makeFuture<int>(42);
  for (size_t i = 0; i < n; i++) {
    f = std::move(f).then(incr<int>);
  }
}

} // namespace

BENCHMARK(constantFuture) {
  makeFuture(42);
}

BENCHMARK_RELATIVE(promiseAndFuture) {
  Promise<int> p;
  Future<int> f = p.getFuture();
  p.setValue(42);
  f.value();
}

BENCHMARK_RELATIVE(withThen) {
  Promise<int> p;
  Future<int> f = p.getFuture().then(incr<int>);
  p.setValue(42);
  f.value();
}

// thens
BENCHMARK_DRAW_LINE();

BENCHMARK(oneThen) {
  someThens(1);
}

// look for >= 50% relative
BENCHMARK_RELATIVE(twoThens) {
  someThens(2);
}

// look for >= 25% relative
BENCHMARK_RELATIVE(fourThens) {
  someThens(4);
}

// look for >= 1% relative
BENCHMARK_RELATIVE(hundredThens) {
  someThens(100);
}

// Lock contention. Although in practice fulfills tend to be temporally
// separate from then()s, still sometimes they will be concurrent. So the
// higher this number is, the better.
BENCHMARK_DRAW_LINE();

BENCHMARK(no_contention) {
  std::vector<Promise<int>> promises(10000);
  std::vector<Future<int>> futures;
  std::thread producer, consumer;

  BENCHMARK_SUSPEND {
    folly::Baton<> b1, b2;
    for (auto& p : promises) {
      futures.push_back(p.getFuture());
    }

    consumer = std::thread([&] {
      b1.post();
      for (auto& f : futures) {
        std::move(f).then(incr<int>);
      }
    });
    consumer.join();

    producer = std::thread([&] {
      b2.post();
      for (auto& p : promises) {
        p.setValue(42);
      }
    });

    b1.wait();
    b2.wait();
  }

  // The only thing we are measuring is how long fulfill + callbacks take
  producer.join();
}

BENCHMARK_RELATIVE(contention) {
  std::vector<Promise<int>> promises(10000);
  std::vector<Future<int>> futures;
  std::thread producer, consumer;
  sem_t sem;
  sem_init(&sem, 0, 0);

  BENCHMARK_SUSPEND {
    folly::Baton<> b1, b2;
    for (auto& p : promises) {
      futures.push_back(p.getFuture());
    }

    consumer = std::thread([&] {
      b1.post();
      for (auto& f : futures) {
        sem_wait(&sem);
        std::move(f).then(incr<int>);
      }
    });

    producer = std::thread([&] {
      b2.post();
      for (auto& p : promises) {
        sem_post(&sem);
        p.setValue(42);
      }
    });

    b1.wait();
    b2.wait();
  }

  // The astute reader will notice that we're not *precisely* comparing apples
  // to apples here. Well, maybe it's like comparing Granny Smith to
  // Braeburn or something. In the serial version, we waited for the futures
  // to be all set up, but here we are probably still doing that work
  // (although in parallel). But even though there is more work (on the order
  // of 2x), it is being done by two threads. Hopefully most of the difference
  // we see is due to lock contention and not false parallelism.
  //
  // Be warned that if the box is under heavy load, this will greatly skew
  // these results (scheduling overhead will begin to dwarf lock contention).
  // I'm not sure but I'd guess in Windtunnel this will mean large variance,
  // because I expect they load the boxes as much as they can?
  consumer.join();
  producer.join();
}

BENCHMARK_DRAW_LINE();

// The old way. Throw an exception, and rethrow to access it upstream.
void throwAndCatchImpl() {
  makeFuture()
      .then([](Try<Unit>&&) { throw std::runtime_error("oh no"); })
      .then([](Try<Unit>&& t) {
        try {
          t.value();
        } catch (const std::runtime_error& e) {
          // ...
          return;
        }
        CHECK(false);
      });
}

// Not much better. Throw an exception, and access it via the wrapper upstream.
// Actually a little worse due to wrapper overhead. then() won't know that the
// exception is a runtime_error, so will have to store it as an exception_ptr
// anyways. withException will therefore have to rethrow. Note that if we threw
// std::exception instead, we would see some wins, as that's the type then()
// will try to wrap, so no exception_ptrs/rethrows are necessary.
void throwAndCatchWrappedImpl() {
  makeFuture()
      .then([](Try<Unit>&&) { throw std::runtime_error("oh no"); })
      .then([](Try<Unit>&& t) {
        auto caught = t.withException<std::runtime_error>(
            [](const std::runtime_error& /* e */) {
              // ...
            });
        CHECK(caught);
      });
}

// Better. Wrap an exception, and rethrow to access it upstream.
void throwWrappedAndCatchImpl() {
  makeFuture()
      .then([](Try<Unit>&&) {
        return makeFuture<Unit>(std::runtime_error("oh no"));
      })
      .then([](Try<Unit>&& t) {
        try {
          t.value();
        } catch (const std::runtime_error& e) {
          // ...
          return;
        }
        CHECK(false);
      });
}

// The new way. Wrap an exception, and access it via the wrapper upstream
void throwWrappedAndCatchWrappedImpl() {
  makeFuture()
      .then([](Try<Unit>&&) {
        return makeFuture<Unit>(std::runtime_error("oh no"));
      })
      .then([](Try<Unit>&& t) {
        auto caught = t.withException<std::runtime_error>(
            [](const std::runtime_error& /* e */) {
              // ...
            });
        CHECK(caught);
      });
}

// Simulate heavy contention on func
void contend(void (*func)()) {
  folly::BenchmarkSuspender s;
  const int N = 100;
  const int iters = 1000;
  pthread_barrier_t barrier;
  pthread_barrier_init(&barrier, nullptr, N + 1);
  std::vector<std::thread> threads;
  for (int i = 0; i < N; i++) {
    threads.push_back(std::thread([&]() {
      pthread_barrier_wait(&barrier);
      for (int j = 0; j < iters; j++) {
        func();
      }
    }));
  }
  pthread_barrier_wait(&barrier);
  s.dismiss();
  for (auto& t : threads) {
    t.join();
  }
  s.rehire();
  pthread_barrier_destroy(&barrier);
}

BENCHMARK(throwAndCatch) {
  throwAndCatchImpl();
}

BENCHMARK_RELATIVE(throwAndCatchWrapped) {
  throwAndCatchWrappedImpl();
}

BENCHMARK_RELATIVE(throwWrappedAndCatch) {
  throwWrappedAndCatchImpl();
}

BENCHMARK_RELATIVE(throwWrappedAndCatchWrapped) {
  throwWrappedAndCatchWrappedImpl();
}

BENCHMARK_DRAW_LINE();

BENCHMARK(throwAndCatchContended) {
  contend(throwAndCatchImpl);
}

BENCHMARK_RELATIVE(throwAndCatchWrappedContended) {
  contend(throwAndCatchWrappedImpl);
}

BENCHMARK_RELATIVE(throwWrappedAndCatchContended) {
  contend(throwWrappedAndCatchImpl);
}

BENCHMARK_RELATIVE(throwWrappedAndCatchWrappedContended) {
  contend(throwWrappedAndCatchWrappedImpl);
}

BENCHMARK_DRAW_LINE();

namespace {
struct Bulky {
  explicit Bulky(std::string message) : message_(message) {}
  std::string message() & {
    return message_;
  }
  std::string&& message() && {
    return std::move(message_);
  }

 private:
  std::string message_;
  std::array<int, 1024> ints_;
};
} // anonymous namespace

BENCHMARK(lvalue_get) {
  BenchmarkSuspender suspender;
  Optional<Future<Bulky>> future;
  future = makeFuture(Bulky("Hello"));
  suspender.dismissing([&] {
    std::string message = std::move(future.value()).get().message();
    doNotOptimizeAway(message);
  });
}

BENCHMARK_RELATIVE(rvalue_get) {
  BenchmarkSuspender suspender;
  Optional<Future<Bulky>> future;
  future = makeFuture(Bulky("Hello"));
  suspender.dismissing([&] {
    std::string message = std::move(future.value()).get().message();
    doNotOptimizeAway(message);
  });
}

InlineExecutor exe;

template <class T>
Future<T> fGen() {
  Promise<T> p;
  auto f = p.getFuture()
               .then([](T&& t) { return std::move(t); })
               .then([](T&& t) { return makeFuture(std::move(t)); })
               .via(&exe)
               .then([](T&& t) { return std::move(t); })
               .then([](T&& t) { return makeFuture(std::move(t)); });
  p.setValue(T());
  return f;
}

template <class T>
std::vector<Future<T>> fsGen() {
  std::vector<Future<T>> fs;
  for (auto i = 0; i < 10; i++) {
    fs.push_back(fGen<T>());
  }
  return fs;
}

template <class T>
void complexBenchmark() {
  collect(fsGen<T>());
  collectAll(fsGen<T>());
  collectAny(fsGen<T>());
  futures::map(fsGen<T>(), [](const T& t) { return t; });
  futures::map(fsGen<T>(), [](const T& t) { return makeFuture(T(t)); });
}

BENCHMARK_DRAW_LINE();

template <size_t S>
struct Blob {
  char buf[S];
};

BENCHMARK(complexUnit) {
  complexBenchmark<Unit>();
}

BENCHMARK_RELATIVE(complexBlob4) {
  complexBenchmark<Blob<4>>();
}

BENCHMARK_RELATIVE(complexBlob8) {
  complexBenchmark<Blob<8>>();
}

BENCHMARK_RELATIVE(complexBlob64) {
  complexBenchmark<Blob<64>>();
}

BENCHMARK_RELATIVE(complexBlob128) {
  complexBenchmark<Blob<128>>();
}

BENCHMARK_RELATIVE(complexBlob256) {
  complexBenchmark<Blob<256>>();
}

BENCHMARK_RELATIVE(complexBlob512) {
  complexBenchmark<Blob<512>>();
}

BENCHMARK_RELATIVE(complexBlob1024) {
  complexBenchmark<Blob<1024>>();
}

BENCHMARK_RELATIVE(complexBlob2048) {
  complexBenchmark<Blob<2048>>();
}

BENCHMARK_RELATIVE(complexBlob4096) {
  complexBenchmark<Blob<4096>>();
}

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}
