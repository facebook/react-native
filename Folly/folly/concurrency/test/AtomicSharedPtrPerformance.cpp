/*
 * Copyright 2017-present Facebook, Inc.
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

// AtomicSharedPtr-detail.h only works with libstdc++, so skip these tests for
// other vendors
#ifdef FOLLY_USE_LIBSTDCPP

#include <folly/concurrency/AtomicSharedPtr.h>

#include <sys/time.h>
#include <atomic>
#include <chrono>
#include <condition_variable>
#include <iostream>
#include <mutex>
#include <thread>
#include <vector>

using std::atomic;
using std::cerr;
using std::condition_variable;
using std::cout;
using std::endl;
using std::is_same;
using std::make_shared;
using std::memory_order;
using std::memory_order_acq_rel;
using std::memory_order_acquire;
using std::memory_order_relaxed;
using std::memory_order_release;
using std::memory_order_seq_cst;
using std::move;
using std::mutex;
using std::ref;
using std::shared_ptr;
using std::thread;
using std::unique_lock;
using std::vector;
using std::chrono::duration_cast;
using std::chrono::microseconds;
using std::chrono::steady_clock;

static uint64_t nowMicro() {
  return duration_cast<microseconds>(steady_clock::now().time_since_epoch())
      .count();
}

static const char* memoryOrder(memory_order order) {
  switch (order) {
    case memory_order_relaxed:
      return "relaxed";
    case memory_order_acquire:
      return "acquire";
    case memory_order_release:
      return "release";
    case memory_order_acq_rel:
      return "acq_rel";
    case memory_order_seq_cst:
      return "seq_cst";
    default:
      return "";
  }
}

template <typename T>
void uncontended_read_write(
    size_t readers,
    size_t writers,
    memory_order readOrder = memory_order_seq_cst,
    memory_order writeOrder = memory_order_seq_cst) {
  std::shared_ptr<int> zero = std::make_shared<int>(0);
  T a(zero);
  auto time1 = nowMicro();
  for (size_t i = 0; i < 10000000; ++i) {
    for (size_t j = 0; j < readers; ++j) {
      a.load(readOrder);
    }
    for (size_t j = 0; j < writers; ++j) {
      a.store(zero, writeOrder);
    }
  }
  auto time2 = nowMicro();
  cout << "Uncontended Read(" << readers << "," << memoryOrder(readOrder)
       << ")/Write(" << writers << "," << memoryOrder(writeOrder)
       << "): " << (time2 - time1) << " \u03BCs" << endl;
}

template <typename T>
void read_asp(
    unique_lock<mutex> lock,
    condition_variable& cvar,
    atomic<bool>& go,
    T& aptr,
    memory_order order) {
  cvar.wait(lock, [&go]() {
    return atomic_load_explicit(&go, memory_order_acquire);
  });
  lock.unlock();
  for (size_t i = 0; i < 1000000; ++i) {
    aptr.load(order);
  }
}

template <typename T>
void write_asp(
    unique_lock<mutex> lock,
    condition_variable& cvar,
    atomic<bool>& go,
    T& aptr,
    memory_order order) {
  std::shared_ptr<int> zero = std::make_shared<int>(0);
  cvar.wait(lock, [&go]() {
    return atomic_load_explicit(&go, memory_order_acquire);
  });
  lock.unlock();
  for (size_t i = 0; i < 1000000; ++i) {
    aptr.store(zero, order);
  }
}

template <typename T>
void contended_read_write(
    size_t readers,
    size_t writers,
    memory_order readOrder = memory_order_seq_cst,
    memory_order writeOrder = memory_order_seq_cst) {
  vector<thread> threads;
  mutex lock;
  condition_variable cvar;
  atomic<bool> go{false};
  T aptr(std::make_shared<int>());
  for (size_t i = 0; i < readers; ++i) {
    unique_lock<mutex> ulock(lock);
    threads.emplace_back(
        &read_asp<T>, move(ulock), ref(cvar), ref(go), ref(aptr), readOrder);
  }
  for (size_t i = 0; i < writers; ++i) {
    unique_lock<mutex> ulock(lock);
    threads.emplace_back(
        &write_asp<T>, move(ulock), ref(cvar), ref(go), ref(aptr), writeOrder);
  }
  unique_lock<mutex> ulock(lock);
  ulock.unlock();
  atomic_store_explicit(&go, true, memory_order_release);
  auto time1 = nowMicro();
  cvar.notify_all();
  for (auto& thread : threads) {
    thread.join();
  }
  auto time2 = nowMicro();
  cout << "Contended Read(" << readers << "," << memoryOrder(readOrder)
       << ")/Write(" << writers << "," << memoryOrder(writeOrder)
       << "): " << (time2 - time1) << " \u03BCs" << endl;
}

template <typename T>
void document_noexcept() {
  shared_ptr<int> ptr = make_shared<int>(0);
  T aptr{};
  cout << "  ctor () is " << (noexcept(T()) ? "" : "not ") << "noexcept."
       << endl;
  cout << "  ctor (ptr) is " << (noexcept(T(ptr)) ? "" : "not ") << "noexcept."
       << endl;
#define _(A)                                                                  \
  do {                                                                        \
    cout << "  " #A " is " << (noexcept(aptr.A) ? "" : "not ") << "noexcept." \
         << endl;                                                             \
  } while (0)
  _(operator=(ptr));

  _(is_lock_free());

  _(store(ptr));
  _(store(ptr, memory_order_seq_cst));

  _(load());
  _(load(memory_order_seq_cst));

  _(exchange(ptr));
  _(exchange(ptr, memory_order_seq_cst));

  _(compare_exchange_strong(ptr, ptr));
  _(compare_exchange_strong(ptr, ptr, memory_order_seq_cst));
  _(compare_exchange_strong(
      ptr, ptr, memory_order_seq_cst, memory_order_seq_cst));

  _(compare_exchange_weak(ptr, ptr));
  _(compare_exchange_weak(ptr, ptr, memory_order_seq_cst));
  _(compare_exchange_weak(
      ptr, ptr, memory_order_seq_cst, memory_order_seq_cst));

#undef _
  cout << "  operator std::shared_ptr<T>() is "
       << (noexcept(ptr = aptr) ? "" : "not ") << "noexcept." << endl;
}

template <typename T>
void runSuite() {
  document_noexcept<T>();
  uncontended_read_write<T>(10, 0);
  uncontended_read_write<T>(0, 10);
  uncontended_read_write<T>(10, 10);
  uncontended_read_write<T>(10, 10, memory_order_relaxed, memory_order_relaxed);
  uncontended_read_write<T>(10, 10, memory_order_acquire, memory_order_release);
  contended_read_write<T>(10, 0);
  contended_read_write<T>(0, 10);
  contended_read_write<T>(1, 1);
  contended_read_write<T>(5, 1);
  contended_read_write<T>(10, 1);
  contended_read_write<T>(100, 1);
  contended_read_write<T>(100, 1, memory_order_relaxed, memory_order_relaxed);
  contended_read_write<T>(100, 1, memory_order_acquire, memory_order_release);
}

int main(int, char**) {
  cout << endl << "Folly implementation.  Is lock free: 1" << endl;
  runSuite<folly::atomic_shared_ptr<int>>();
  return 0;
}

#else // #ifdef FOLLY_USE_LIBSTDCPP

int main(int, char**) {
  return 1;
}

#endif // #ifdef FOLLY_USE_LIBSTDCPP
