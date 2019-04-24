/*
 * Copyright 2011-present Facebook, Inc.
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

#include <folly/ThreadLocal.h>

#ifndef _WIN32
#include <dlfcn.h>
#include <sys/wait.h>
#endif

#include <sys/types.h>

#include <array>
#include <atomic>
#include <chrono>
#include <climits>
#include <condition_variable>
#include <map>
#include <memory>
#include <mutex>
#include <set>
#include <thread>
#include <unordered_map>

#include <glog/logging.h>

#include <folly/Memory.h>
#include <folly/experimental/io/FsUtil.h>
#include <folly/portability/GTest.h>
#include <folly/portability/Unistd.h>
#include <folly/synchronization/Baton.h>
#include <folly/synchronization/detail/ThreadCachedInts.h>
#include <folly/system/ThreadId.h>

using namespace folly;

struct Widget {
  static int totalVal_;
  int val_;
  ~Widget() {
    totalVal_ += val_;
  }

  static void customDeleter(Widget* w, TLPDestructionMode mode) {
    totalVal_ += (mode == TLPDestructionMode::ALL_THREADS) ? 1000 : 1;
    delete w;
  }
};
int Widget::totalVal_ = 0;

struct MultiWidget {
  int val_{0};
  MultiWidget() = default;
  ~MultiWidget() {
    // force a reallocation in the destructor by
    // allocating more than elementsCapacity

    using TL = ThreadLocal<size_t>;
    using TLMeta = threadlocal_detail::static_meta_of<TL>::type;
    auto const numElements = TLMeta::instance().elementsCapacity() + 1;
    std::vector<ThreadLocal<size_t>> elems(numElements);
    for (auto& t : elems) {
      *t += 1;
    }
  }
};

TEST(ThreadLocalPtr, BasicDestructor) {
  Widget::totalVal_ = 0;
  ThreadLocalPtr<Widget> w;
  std::thread([&w]() {
    w.reset(new Widget());
    w.get()->val_ += 10;
  })
      .join();
  EXPECT_EQ(10, Widget::totalVal_);
}

TEST(ThreadLocalPtr, CustomDeleter1) {
  Widget::totalVal_ = 0;
  {
    ThreadLocalPtr<Widget> w;
    std::thread([&w]() {
      w.reset(new Widget(), Widget::customDeleter);
      w.get()->val_ += 10;
    })
        .join();
    EXPECT_EQ(11, Widget::totalVal_);
  }
  EXPECT_EQ(11, Widget::totalVal_);
}

TEST(ThreadLocalPtr, CustomDeleterOwnershipTransfer) {
  Widget::totalVal_ = 0;
  {
    ThreadLocalPtr<Widget> w;
    auto deleter = [](Widget* ptr) {
      Widget::customDeleter(ptr, TLPDestructionMode::THIS_THREAD);
    };
    std::unique_ptr<Widget, decltype(deleter)> source(new Widget(), deleter);
    std::thread([&w, &source]() {
      w.reset(std::move(source));
      w.get()->val_ += 10;
    })
        .join();
    EXPECT_EQ(11, Widget::totalVal_);
  }
  EXPECT_EQ(11, Widget::totalVal_);
}

TEST(ThreadLocalPtr, DefaultDeleterOwnershipTransfer) {
  Widget::totalVal_ = 0;
  {
    ThreadLocalPtr<Widget> w;
    auto source = std::make_unique<Widget>();
    std::thread([&w, &source]() {
      w.reset(std::move(source));
      w.get()->val_ += 10;
    })
        .join();
    EXPECT_EQ(10, Widget::totalVal_);
  }
  EXPECT_EQ(10, Widget::totalVal_);
}

TEST(ThreadLocalPtr, resetNull) {
  ThreadLocalPtr<int> tl;
  EXPECT_FALSE(tl);
  tl.reset(new int(4));
  EXPECT_TRUE(static_cast<bool>(tl));
  EXPECT_EQ(*tl.get(), 4);
  tl.reset();
  EXPECT_FALSE(tl);
}

TEST(ThreadLocalPtr, TestRelease) {
  Widget::totalVal_ = 0;
  ThreadLocalPtr<Widget> w;
  std::unique_ptr<Widget> wPtr;
  std::thread([&w, &wPtr]() {
    w.reset(new Widget());
    w.get()->val_ += 10;

    wPtr.reset(w.release());
  })
      .join();
  EXPECT_EQ(0, Widget::totalVal_);
  wPtr.reset();
  EXPECT_EQ(10, Widget::totalVal_);
}

TEST(ThreadLocalPtr, CreateOnThreadExit) {
  Widget::totalVal_ = 0;
  ThreadLocal<Widget> w;
  ThreadLocalPtr<int> tl;

  std::thread([&] {
    tl.reset(new int(1), [&](int* ptr, TLPDestructionMode /* mode */) {
      delete ptr;
      // This test ensures Widgets allocated here are not leaked.
      ++w.get()->val_;
      ThreadLocal<Widget> wl;
      ++wl.get()->val_;
    });
  })
      .join();
  EXPECT_EQ(2, Widget::totalVal_);
}

// Test deleting the ThreadLocalPtr object
TEST(ThreadLocalPtr, CustomDeleter2) {
  Widget::totalVal_ = 0;
  std::thread t;
  std::mutex mutex;
  std::condition_variable cv;
  enum class State {
    START,
    DONE,
    EXIT,
  };
  State state = State::START;
  {
    ThreadLocalPtr<Widget> w;
    t = std::thread([&]() {
      w.reset(new Widget(), Widget::customDeleter);
      w.get()->val_ += 10;

      // Notify main thread that we're done
      {
        std::unique_lock<std::mutex> lock(mutex);
        state = State::DONE;
        cv.notify_all();
      }

      // Wait for main thread to allow us to exit
      {
        std::unique_lock<std::mutex> lock(mutex);
        while (state != State::EXIT) {
          cv.wait(lock);
        }
      }
    });

    // Wait for main thread to start (and set w.get()->val_)
    {
      std::unique_lock<std::mutex> lock(mutex);
      while (state != State::DONE) {
        cv.wait(lock);
      }
    }

    // Thread started but hasn't exited yet
    EXPECT_EQ(0, Widget::totalVal_);

    // Destroy ThreadLocalPtr<Widget> (by letting it go out of scope)
  }

  EXPECT_EQ(1010, Widget::totalVal_);

  // Allow thread to exit
  {
    std::unique_lock<std::mutex> lock(mutex);
    state = State::EXIT;
    cv.notify_all();
  }
  t.join();

  EXPECT_EQ(1010, Widget::totalVal_);
}

TEST(ThreadLocal, BasicDestructor) {
  Widget::totalVal_ = 0;
  ThreadLocal<Widget> w;
  std::thread([&w]() { w->val_ += 10; }).join();
  EXPECT_EQ(10, Widget::totalVal_);
}

// this should force a realloc of the ElementWrapper array
TEST(ThreadLocal, ReallocDestructor) {
  ThreadLocal<MultiWidget> w;
  std::thread([&w]() { w->val_ += 10; }).join();
}

TEST(ThreadLocal, SimpleRepeatDestructor) {
  Widget::totalVal_ = 0;
  {
    ThreadLocal<Widget> w;
    w->val_ += 10;
  }
  {
    ThreadLocal<Widget> w;
    w->val_ += 10;
  }
  EXPECT_EQ(20, Widget::totalVal_);
}

TEST(ThreadLocal, InterleavedDestructors) {
  Widget::totalVal_ = 0;
  std::unique_ptr<ThreadLocal<Widget>> w;
  int wVersion = 0;
  const int wVersionMax = 2;
  int thIter = 0;
  std::mutex lock;
  auto th = std::thread([&]() {
    int wVersionPrev = 0;
    while (true) {
      while (true) {
        std::lock_guard<std::mutex> g(lock);
        if (wVersion > wVersionMax) {
          return;
        }
        if (wVersion > wVersionPrev) {
          // We have a new version of w, so it should be initialized to zero
          EXPECT_EQ((*w)->val_, 0);
          break;
        }
      }
      std::lock_guard<std::mutex> g(lock);
      wVersionPrev = wVersion;
      (*w)->val_ += 10;
      ++thIter;
    }
  });
  FOR_EACH_RANGE (i, 0, wVersionMax) {
    int thIterPrev = 0;
    {
      std::lock_guard<std::mutex> g(lock);
      thIterPrev = thIter;
      w = std::make_unique<ThreadLocal<Widget>>();
      ++wVersion;
    }
    while (true) {
      std::lock_guard<std::mutex> g(lock);
      if (thIter > thIterPrev) {
        break;
      }
    }
  }
  {
    std::lock_guard<std::mutex> g(lock);
    wVersion = wVersionMax + 1;
  }
  th.join();
  EXPECT_EQ(wVersionMax * 10, Widget::totalVal_);
}

class SimpleThreadCachedInt {
  class NewTag;
  ThreadLocal<int, NewTag> val_;

 public:
  void add(int val) {
    *val_ += val;
  }

  int read() {
    int ret = 0;
    for (const auto& i : val_.accessAllThreads()) {
      ret += i;
    }
    return ret;
  }
};

TEST(ThreadLocalPtr, AccessAllThreadsCounter) {
  const int kNumThreads = 256;
  SimpleThreadCachedInt stci[kNumThreads + 1];
  std::atomic<bool> run(true);
  std::atomic<int> totalAtomic{0};
  std::vector<std::thread> threads;
  // thread i will increment all the thread locals
  // in the range 0..i
  for (int i = 0; i < kNumThreads; ++i) {
    threads.push_back(std::thread([i, // i needs to be captured by value
                                   &stci,
                                   &run,
                                   &totalAtomic]() {
      for (int j = 0; j <= i; j++) {
        stci[j].add(1);
      }

      totalAtomic.fetch_add(1);
      while (run.load()) {
        usleep(100);
      }
    }));
  }
  while (totalAtomic.load() != kNumThreads) {
    usleep(100);
  }
  for (int i = 0; i <= kNumThreads; i++) {
    EXPECT_EQ(kNumThreads - i, stci[i].read());
  }
  run.store(false);
  for (auto& t : threads) {
    t.join();
  }
}

TEST(ThreadLocal, resetNull) {
  ThreadLocal<int> tl;
  tl.reset(new int(4));
  EXPECT_EQ(*tl.get(), 4);
  tl.reset();
  EXPECT_EQ(*tl.get(), 0);
  tl.reset(new int(5));
  EXPECT_EQ(*tl.get(), 5);
}

namespace {
struct Tag {};

struct Foo {
  folly::ThreadLocal<int, Tag> tl;
};
} // namespace

TEST(ThreadLocal, Movable1) {
  Foo a;
  Foo b;
  EXPECT_TRUE(a.tl.get() != b.tl.get());

  a = Foo();
  b = Foo();
  EXPECT_TRUE(a.tl.get() != b.tl.get());
}

TEST(ThreadLocal, Movable2) {
  std::map<int, Foo> map;

  map[42];
  map[10];
  map[23];
  map[100];

  std::set<void*> tls;
  for (auto& m : map) {
    tls.insert(m.second.tl.get());
  }

  // Make sure that we have 4 different instances of *tl
  EXPECT_EQ(4, tls.size());
}

namespace {
class ThreadCachedIntWidget {
 public:
  ThreadCachedIntWidget() {}

  ~ThreadCachedIntWidget() {
    if (ints_) {
      ints_->increment(0);
    }
  }

  void set(detail::ThreadCachedInts<void>* ints) {
    ints_ = ints;
  }

 private:
  detail::ThreadCachedInts<void>* ints_{nullptr};
};
} // namespace

TEST(ThreadLocal, TCICreateOnThreadExit) {
  detail::ThreadCachedInts<void> ints;
  ThreadLocal<ThreadCachedIntWidget> w;

  std::thread([&] {
    // make sure the ints object is created
    ints.increment(1);
    // now the widget
    w->set(&ints);
  })
      .join();
}

namespace {

constexpr size_t kFillObjectSize = 300;

std::atomic<uint64_t> gDestroyed;

/**
 * Fill a chunk of memory with a unique-ish pattern that includes the thread id
 * (so deleting one of these from another thread would cause a failure)
 *
 * Verify it explicitly and on destruction.
 */
class FillObject {
 public:
  explicit FillObject(uint64_t idx) : idx_(idx) {
    uint64_t v = val();
    for (size_t i = 0; i < kFillObjectSize; ++i) {
      data_[i] = v;
    }
  }

  void check() {
    uint64_t v = val();
    for (size_t i = 0; i < kFillObjectSize; ++i) {
      CHECK_EQ(v, data_[i]);
    }
  }

  ~FillObject() {
    ++gDestroyed;
  }

 private:
  uint64_t val() const {
    return (idx_ << 40) | folly::getCurrentThreadID();
  }

  uint64_t idx_;
  uint64_t data_[kFillObjectSize];
};

} // namespace

TEST(ThreadLocal, Stress) {
  static constexpr size_t numFillObjects = 250;
  std::array<ThreadLocalPtr<FillObject>, numFillObjects> objects;

  static constexpr size_t numThreads = 32;
  static constexpr size_t numReps = 20;

  std::vector<std::thread> threads;
  threads.reserve(numThreads);

  for (size_t k = 0; k < numThreads; ++k) {
    threads.emplace_back([&objects] {
      for (size_t rep = 0; rep < numReps; ++rep) {
        for (size_t i = 0; i < objects.size(); ++i) {
          objects[i].reset(new FillObject(rep * objects.size() + i));
          std::this_thread::sleep_for(std::chrono::microseconds(100));
        }
        for (size_t i = 0; i < objects.size(); ++i) {
          objects[i]->check();
        }
      }
    });
  }

  for (auto& t : threads) {
    t.join();
  }

  EXPECT_EQ(numFillObjects * numThreads * numReps, gDestroyed);
}

// Yes, threads and fork don't mix
// (http://cppwisdom.quora.com/Why-threads-and-fork-dont-mix) but if you're
// stupid or desperate enough to try, we shouldn't stand in your way.
namespace {
class HoldsOne {
 public:
  HoldsOne() : value_(1) {}
  // Do an actual access to catch the buggy case where this == nullptr
  int value() const {
    return value_;
  }

 private:
  int value_;
};

struct HoldsOneTag {};

ThreadLocal<HoldsOne, HoldsOneTag> ptr;

int totalValue() {
  int value = 0;
  for (auto& p : ptr.accessAllThreads()) {
    value += p.value();
  }
  return value;
}

} // namespace

#ifdef FOLLY_HAVE_PTHREAD_ATFORK
TEST(ThreadLocal, Fork) {
  EXPECT_EQ(1, ptr->value()); // ensure created
  EXPECT_EQ(1, totalValue());
  // Spawn a new thread

  std::mutex mutex;
  bool started = false;
  std::condition_variable startedCond;
  bool stopped = false;
  std::condition_variable stoppedCond;

  std::thread t([&]() {
    EXPECT_EQ(1, ptr->value()); // ensure created
    {
      std::unique_lock<std::mutex> lock(mutex);
      started = true;
      startedCond.notify_all();
    }
    {
      std::unique_lock<std::mutex> lock(mutex);
      while (!stopped) {
        stoppedCond.wait(lock);
      }
    }
  });

  {
    std::unique_lock<std::mutex> lock(mutex);
    while (!started) {
      startedCond.wait(lock);
    }
  }

  EXPECT_EQ(2, totalValue());

  pid_t pid = fork();
  if (pid == 0) {
    // in child
    int v = totalValue();

    // exit successfully if v == 1 (one thread)
    // diagnostic error code otherwise :)
    switch (v) {
      case 1:
        _exit(0);
      case 0:
        _exit(1);
    }
    _exit(2);
  } else if (pid > 0) {
    // in parent
    int status;
    EXPECT_EQ(pid, waitpid(pid, &status, 0));
    EXPECT_TRUE(WIFEXITED(status));
    EXPECT_EQ(0, WEXITSTATUS(status));
  } else {
    ADD_FAILURE() << "fork failed";
  }

  EXPECT_EQ(2, totalValue());

  {
    std::unique_lock<std::mutex> lock(mutex);
    stopped = true;
    stoppedCond.notify_all();
  }

  t.join();

  EXPECT_EQ(1, totalValue());
}
#endif

#ifndef _WIN32
struct HoldsOneTag2 {};

TEST(ThreadLocal, Fork2) {
  // A thread-local tag that was used in the parent from a *different* thread
  // (but not the forking thread) would cause the child to hang in a
  // ThreadLocalPtr's object destructor. Yeah.
  ThreadLocal<HoldsOne, HoldsOneTag2> p;
  {
    // use tag in different thread
    std::thread t([&p] { p.get(); });
    t.join();
  }
  pid_t pid = fork();
  if (pid == 0) {
    {
      ThreadLocal<HoldsOne, HoldsOneTag2> q;
      q.get();
    }
    _exit(0);
  } else if (pid > 0) {
    int status;
    EXPECT_EQ(pid, waitpid(pid, &status, 0));
    EXPECT_TRUE(WIFEXITED(status));
    EXPECT_EQ(0, WEXITSTATUS(status));
  } else {
    ADD_FAILURE() << "fork failed";
  }
}

// Disable the SharedLibrary test when using any sanitizer. Otherwise, the
// dlopen'ed code would end up running without e.g., ASAN-initialized data
// structures and failing right away.
//
// We also cannot run this test unless folly was compiled with PIC support,
// since we cannot build thread_local_test_lib.so without PIC.
#if defined FOLLY_SANITIZE_ADDRESS || defined FOLLY_SANITIZE_THREAD || \
    !defined FOLLY_SUPPORT_SHARED_LIBRARY
#define SHARED_LIBRARY_TEST_NAME DISABLED_SharedLibrary
#else
#define SHARED_LIBRARY_TEST_NAME SharedLibrary
#endif

TEST(ThreadLocal, SHARED_LIBRARY_TEST_NAME) {
  auto exe = fs::executable_path();
  auto lib = exe.parent_path() / "thread_local_test_lib.so";
  auto handle = dlopen(lib.string().c_str(), RTLD_LAZY);
  ASSERT_NE(nullptr, handle)
      << "unable to load " << lib.string() << ": " << dlerror();

  typedef void (*useA_t)();
  dlerror();
  useA_t useA = (useA_t)dlsym(handle, "useA");

  const char* dlsym_error = dlerror();
  EXPECT_EQ(nullptr, dlsym_error);
  ASSERT_NE(nullptr, useA);

  useA();

  folly::Baton<> b11, b12, b21, b22;

  std::thread t1([&]() {
    useA();
    b11.post();
    b12.wait();
  });

  std::thread t2([&]() {
    useA();
    b21.post();
    b22.wait();
  });

  b11.wait();
  b21.wait();

  dlclose(handle);

  b12.post();
  b22.post();

  t1.join();
  t2.join();
}

#endif

namespace folly {
namespace threadlocal_detail {
struct PthreadKeyUnregisterTester {
  PthreadKeyUnregister p;
  constexpr PthreadKeyUnregisterTester() = default;
};
} // namespace threadlocal_detail
} // namespace folly

TEST(ThreadLocal, UnregisterClassHasConstExprCtor) {
  folly::threadlocal_detail::PthreadKeyUnregisterTester x;
  // yep!
  SUCCEED();
}
