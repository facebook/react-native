/*
 * Copyright 2017 Facebook, Inc.
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

#include <thread>

#include <folly/Singleton.h>
#include <folly/experimental/io/FsUtil.h>
#include <folly/io/async/EventBase.h>
#include <folly/portability/GMock.h>
#include <folly/portability/GTest.h>
#include <folly/test/SingletonTestStructs.h>

#ifndef _MSC_VER
#include <folly/Subprocess.h>
#endif

#include <glog/logging.h>
#include <boost/thread/barrier.hpp>

FOLLY_GCC_DISABLE_WARNING(deprecated-declarations)

using namespace folly;

TEST(Singleton, MissingSingleton) {
  EXPECT_DEATH([]() { auto u = Singleton<UnregisteredWatchdog>::try_get(); }(),
      "");
}

struct BasicUsageTag {};
template <typename T, typename Tag = detail::DefaultTag>
using SingletonBasicUsage = Singleton <T, Tag, BasicUsageTag>;

// Exercise some basic codepaths ensuring registration order and
// destruction order happen as expected, that instances are created
// when expected, etc etc.
TEST(Singleton, BasicUsage) {
  auto& vault = *SingletonVault::singleton<BasicUsageTag>();

  EXPECT_EQ(vault.registeredSingletonCount(), 0);
  SingletonBasicUsage<Watchdog> watchdog_singleton;
  EXPECT_EQ(vault.registeredSingletonCount(), 1);

  SingletonBasicUsage<ChildWatchdog> child_watchdog_singleton;
  EXPECT_EQ(vault.registeredSingletonCount(), 2);

  vault.registrationComplete();

  // limit a scope to release references so we can destroy them later
  {
    std::shared_ptr<Watchdog> s1 = SingletonBasicUsage<Watchdog>::try_get();
    EXPECT_NE(s1, nullptr);

    std::shared_ptr<Watchdog> s2 = SingletonBasicUsage<Watchdog>::try_get();
    EXPECT_NE(s2, nullptr);

    EXPECT_EQ(s1, s2);
    EXPECT_EQ(s1.get(), SingletonBasicUsage<Watchdog>::try_get_fast().get());

    std::shared_ptr<ChildWatchdog> s3 =
      SingletonBasicUsage<ChildWatchdog>::try_get();
    EXPECT_NE(s3, nullptr);
    EXPECT_NE(s2, s3);

    EXPECT_EQ(vault.registeredSingletonCount(), 2);
    EXPECT_EQ(vault.livingSingletonCount(), 2);
  }

  vault.destroyInstances();
  EXPECT_EQ(vault.registeredSingletonCount(), 2);
  EXPECT_EQ(vault.livingSingletonCount(), 0);
}

struct DirectUsageTag {};
template <typename T, typename Tag = detail::DefaultTag>
using SingletonDirectUsage = Singleton <T, Tag, DirectUsageTag>;

TEST(Singleton, DirectUsage) {
  auto& vault = *SingletonVault::singleton<DirectUsageTag>();

  EXPECT_EQ(vault.registeredSingletonCount(), 0);

  // Verify we can get to the underlying singletons via directly using
  // the singleton definition.
  SingletonDirectUsage<Watchdog> watchdog;
  struct TestTag {};
  SingletonDirectUsage<Watchdog, TestTag> named_watchdog;
  EXPECT_EQ(vault.registeredSingletonCount(), 2);
  vault.registrationComplete();

  EXPECT_NE(watchdog.try_get(), nullptr);
  EXPECT_EQ(watchdog.try_get(), SingletonDirectUsage<Watchdog>::try_get());
  EXPECT_NE(watchdog.try_get(), named_watchdog.try_get());
  EXPECT_EQ(watchdog.try_get()->livingWatchdogCount(), 2);

  vault.destroyInstances();
}

struct NamedUsageTag {};
template <typename T, typename Tag = detail::DefaultTag>
using SingletonNamedUsage = Singleton <T, Tag, NamedUsageTag>;

TEST(Singleton, NamedUsage) {
  auto& vault = *SingletonVault::singleton<NamedUsageTag>();

  EXPECT_EQ(vault.registeredSingletonCount(), 0);

  // Define two named Watchdog singletons and one unnamed singleton.
  struct Watchdog1 {};
  struct Watchdog2 {};
  typedef detail::DefaultTag Watchdog3;
  SingletonNamedUsage<Watchdog, Watchdog1> watchdog1_singleton;
  EXPECT_EQ(vault.registeredSingletonCount(), 1);
  SingletonNamedUsage<Watchdog, Watchdog2> watchdog2_singleton;
  EXPECT_EQ(vault.registeredSingletonCount(), 2);
  SingletonNamedUsage<Watchdog, Watchdog3> watchdog3_singleton;
  EXPECT_EQ(vault.registeredSingletonCount(), 3);

  vault.registrationComplete();
  {
    // Verify our three singletons are distinct and non-nullptr.
    auto s1 = SingletonNamedUsage<Watchdog, Watchdog1>::try_get();
    EXPECT_EQ(s1, watchdog1_singleton.try_get());
    auto s2 = SingletonNamedUsage<Watchdog, Watchdog2>::try_get();
    EXPECT_EQ(s2, watchdog2_singleton.try_get());
    EXPECT_NE(s1, s2);
    auto s3 = SingletonNamedUsage<Watchdog, Watchdog3>::try_get();
    EXPECT_EQ(s3, watchdog3_singleton.try_get());
    EXPECT_NE(s3, s1);
    EXPECT_NE(s3, s2);

    // Verify the "default" singleton is the same as the DefaultTag-tagged
    // singleton.
    auto s4 = SingletonNamedUsage<Watchdog>::try_get();
    EXPECT_EQ(s4, watchdog3_singleton.try_get());
  }

  vault.destroyInstances();
}

struct NaughtyUsageTag {};
template <typename T, typename Tag = detail::DefaultTag>
using SingletonNaughtyUsage = Singleton <T, Tag, NaughtyUsageTag>;
struct NaughtyUsageTag2 {};
template <typename T, typename Tag = detail::DefaultTag>
using SingletonNaughtyUsage2 = Singleton <T, Tag, NaughtyUsageTag2>;

// Some pathological cases such as getting unregistered singletons,
// double registration, etc.
TEST(Singleton, NaughtyUsage) {
  auto& vault = *SingletonVault::singleton<NaughtyUsageTag>();

  vault.registrationComplete();

  // Unregistered.
  EXPECT_DEATH(Singleton<Watchdog>::try_get(), "");
  EXPECT_DEATH(SingletonNaughtyUsage<Watchdog>::try_get(), "");

  vault.destroyInstances();

  auto& vault2 = *SingletonVault::singleton<NaughtyUsageTag2>();

   EXPECT_DEATH(SingletonNaughtyUsage2<Watchdog>::try_get(), "");
  SingletonNaughtyUsage2<Watchdog> watchdog_singleton;

  // double registration
  EXPECT_DEATH([]() { SingletonNaughtyUsage2<Watchdog> w2; }(), "");
  vault2.destroyInstances();

  // double registration after destroy
  EXPECT_DEATH([]() { SingletonNaughtyUsage2<Watchdog> w3; }(), "");
}

struct SharedPtrUsageTag {};
template <typename T, typename Tag = detail::DefaultTag>
using SingletonSharedPtrUsage = Singleton <T, Tag, SharedPtrUsageTag>;

// TODO (anob): revisit this test
TEST(Singleton, SharedPtrUsage) {
  struct WatchdogHolder {
    ~WatchdogHolder() {
      if (watchdog) {
        LOG(ERROR) << "The following log message with stack trace is expected";
      }
    }

    std::shared_ptr<Watchdog> watchdog;
  };

  auto& vault = *SingletonVault::singleton<SharedPtrUsageTag>();

  EXPECT_EQ(vault.registeredSingletonCount(), 0);
  SingletonSharedPtrUsage<Watchdog> watchdog_singleton;
  EXPECT_EQ(vault.registeredSingletonCount(), 1);

  SingletonSharedPtrUsage<ChildWatchdog> child_watchdog_singleton;
  EXPECT_EQ(vault.registeredSingletonCount(), 2);

  struct ATag {};
  SingletonSharedPtrUsage<Watchdog, ATag> named_watchdog_singleton;

  SingletonSharedPtrUsage<WatchdogHolder> watchdog_holder_singleton;

  vault.registrationComplete();

  // Initilize holder singleton first, so that it's the last one to be
  // destroyed.
  watchdog_holder_singleton.try_get();

  auto s1 = SingletonSharedPtrUsage<Watchdog>::try_get().get();
  EXPECT_NE(s1, nullptr);

  auto s2 = SingletonSharedPtrUsage<Watchdog>::try_get().get();
  EXPECT_NE(s2, nullptr);

  EXPECT_EQ(s1, s2);

  auto weak_s1 = SingletonSharedPtrUsage<Watchdog>::get_weak();

  auto shared_s1 = weak_s1.lock();
  EXPECT_EQ(shared_s1.get(), s1);
  EXPECT_EQ(shared_s1.use_count(), 2);

  auto old_serial = shared_s1->serial_number;

  {
    auto named_weak_s1 =
      SingletonSharedPtrUsage<Watchdog, ATag>::get_weak();
    auto locked = named_weak_s1.lock();
    EXPECT_NE(locked.get(), shared_s1.get());
  }

  // We should release externally locked shared_ptr, otherwise it will be
  // considered a leak
  watchdog_holder_singleton.try_get()->watchdog = std::move(shared_s1);

  LOG(ERROR) << "The following log message regarding shared_ptr is expected";
  {
    auto start_time = std::chrono::steady_clock::now();
    vault.destroyInstances();
    auto duration = std::chrono::steady_clock::now() - start_time;
    EXPECT_TRUE(duration > std::chrono::seconds{4} &&
                duration < std::chrono::seconds{6});
  }
  EXPECT_EQ(vault.registeredSingletonCount(), 4);
  EXPECT_EQ(vault.livingSingletonCount(), 0);

  EXPECT_TRUE(weak_s1.expired());

  auto empty_s1 = SingletonSharedPtrUsage<Watchdog>::get_weak();
  EXPECT_FALSE(empty_s1.lock());

  vault.reenableInstances();

  {
    // Singleton should be re-created only after reenableInstances() was called.
    auto new_s1 = SingletonSharedPtrUsage<Watchdog>::try_get();
    // Track serial number rather than pointer since the memory could be
    // re-used when we create new_s1.
    EXPECT_NE(new_s1->serial_number, old_serial);
  }

  auto new_s1_weak = SingletonSharedPtrUsage<Watchdog>::get_weak();
  auto new_s1_shared = new_s1_weak.lock();
  std::thread t([new_s1_shared]() mutable {
      std::this_thread::sleep_for(std::chrono::seconds{2});
      new_s1_shared.reset();
    });
  new_s1_shared.reset();
  {
    auto start_time = std::chrono::steady_clock::now();
    vault.destroyInstances();
    auto duration = std::chrono::steady_clock::now() - start_time;
    EXPECT_TRUE(duration > std::chrono::seconds{1} &&
                duration < std::chrono::seconds{3});
  }
  EXPECT_TRUE(new_s1_weak.expired());
  t.join();
}

// Some classes to test singleton dependencies.  NeedySingleton has a
// dependency on NeededSingleton, which happens during its
// construction.
struct NeedyTag {};
template <typename T, typename Tag = detail::DefaultTag>
using SingletonNeedy = Singleton <T, Tag, NeedyTag>;

struct NeededSingleton {};
struct NeedySingleton {
  NeedySingleton() {
    auto unused = SingletonNeedy<NeededSingleton>::try_get();
    EXPECT_NE(unused, nullptr);
  }
};

// Ensure circular dependencies fail -- a singleton that needs itself, whoops.
struct SelfNeedyTag {};
template <typename T, typename Tag = detail::DefaultTag>
using SingletonSelfNeedy = Singleton <T, Tag, SelfNeedyTag>;

struct SelfNeedySingleton {
  SelfNeedySingleton() {
    auto unused = SingletonSelfNeedy<SelfNeedySingleton>::try_get();
    EXPECT_NE(unused, nullptr);
  }
};

TEST(Singleton, SingletonDependencies) {
  SingletonNeedy<NeededSingleton> needed_singleton;
  SingletonNeedy<NeedySingleton> needy_singleton;
  auto& needy_vault = *SingletonVault::singleton<NeedyTag>();

  needy_vault.registrationComplete();

  EXPECT_EQ(needy_vault.registeredSingletonCount(), 2);
  EXPECT_EQ(needy_vault.livingSingletonCount(), 0);

  auto needy = SingletonNeedy<NeedySingleton>::try_get();
  EXPECT_EQ(needy_vault.livingSingletonCount(), 2);

  SingletonSelfNeedy<SelfNeedySingleton> self_needy_singleton;
  auto& self_needy_vault = *SingletonVault::singleton<SelfNeedyTag>();

  self_needy_vault.registrationComplete();
  EXPECT_DEATH([]() { SingletonSelfNeedy<SelfNeedySingleton>::try_get(); }(),
      "");
}

// A test to ensure multiple threads contending on singleton creation
// properly wait for creation rather than thinking it is a circular
// dependency.
class Slowpoke : public Watchdog {
 public:
  Slowpoke() { std::this_thread::sleep_for(std::chrono::milliseconds(10)); }
};

struct ConcurrencyTag {};
template <typename T, typename Tag = detail::DefaultTag>
using SingletonConcurrency = Singleton <T, Tag, ConcurrencyTag>;

TEST(Singleton, SingletonConcurrency) {
  auto& vault = *SingletonVault::singleton<ConcurrencyTag>();
  SingletonConcurrency<Slowpoke> slowpoke_singleton;
  vault.registrationComplete();

  std::mutex gatekeeper;
  gatekeeper.lock();
  auto func = [&gatekeeper]() {
    gatekeeper.lock();
    gatekeeper.unlock();
    auto unused = SingletonConcurrency<Slowpoke>::try_get();
  };

  EXPECT_EQ(vault.livingSingletonCount(), 0);
  std::vector<std::thread> threads;
  for (int i = 0; i < 100; ++i) {
    threads.emplace_back(func);
  }
  // If circular dependency checks fail, the unlock would trigger a
  // crash.  Instead, it succeeds, and we have exactly one living
  // singleton.
  gatekeeper.unlock();
  for (auto& t : threads) {
    t.join();
  }
  EXPECT_EQ(vault.livingSingletonCount(), 1);
}

struct ErrorConstructor {
  static size_t constructCount_;
  ErrorConstructor() {
    if ((constructCount_++) == 0) {
      throw std::runtime_error("first time fails");
    }
  }
};
size_t ErrorConstructor::constructCount_(0);

struct CreationErrorTag {};
template <typename T, typename Tag = detail::DefaultTag>
using SingletonCreationError = Singleton<T, Tag, CreationErrorTag>;

TEST(Singleton, SingletonCreationError) {
  SingletonCreationError<ErrorConstructor> error_once_singleton;
  SingletonVault::singleton<CreationErrorTag>()->registrationComplete();

  // first time should error out
  EXPECT_THROW(error_once_singleton.try_get(), std::runtime_error);

  // second time it'll work fine
  error_once_singleton.try_get();
  SUCCEED();
}

struct ConcurrencyStressTag {};
template <typename T, typename Tag = detail::DefaultTag>
using SingletonConcurrencyStress = Singleton <T, Tag, ConcurrencyStressTag>;

TEST(Singleton, SingletonConcurrencyStress) {
  auto& vault = *SingletonVault::singleton<ConcurrencyStressTag>();
  SingletonConcurrencyStress<Slowpoke> slowpoke_singleton;
  vault.registrationComplete();

  std::vector<std::thread> ts;
  for (size_t i = 0; i < 100; ++i) {
    ts.emplace_back([&]() {
        slowpoke_singleton.try_get();
      });
  }

  for (size_t i = 0; i < 100; ++i) {
    std::chrono::milliseconds d(20);

    std::this_thread::sleep_for(d);
    vault.destroyInstances();
    std::this_thread::sleep_for(d);
    vault.destroyInstances();
  }

  for (auto& t : ts) {
    t.join();
  }
}

namespace {
struct EagerInitSyncTag {};
}
template <typename T, typename Tag = detail::DefaultTag>
using SingletonEagerInitSync = Singleton<T, Tag, EagerInitSyncTag>;
TEST(Singleton, SingletonEagerInitSync) {
  auto& vault = *SingletonVault::singleton<EagerInitSyncTag>();
  bool didEagerInit = false;
  auto sing = SingletonEagerInitSync<std::string>(
                  [&] {didEagerInit = true; return new std::string("foo"); })
              .shouldEagerInit();
  vault.registrationComplete();
  EXPECT_FALSE(didEagerInit);
  vault.doEagerInit();
  EXPECT_TRUE(didEagerInit);
  sing.get_weak();  // (avoid compile error complaining about unused var 'sing')
}

namespace {
struct EagerInitAsyncTag {};
}
template <typename T, typename Tag = detail::DefaultTag>
using SingletonEagerInitAsync = Singleton<T, Tag, EagerInitAsyncTag>;
TEST(Singleton, SingletonEagerInitAsync) {
  auto& vault = *SingletonVault::singleton<EagerInitAsyncTag>();
  bool didEagerInit = false;
  auto sing = SingletonEagerInitAsync<std::string>(
                  [&] {didEagerInit = true; return new std::string("foo"); })
              .shouldEagerInit();
  folly::EventBase eb;
  folly::Baton<> done;
  vault.registrationComplete();
  EXPECT_FALSE(didEagerInit);
  vault.doEagerInitVia(eb, &done);
  eb.loop();
  done.wait();
  EXPECT_TRUE(didEagerInit);
  sing.get_weak();  // (avoid compile error complaining about unused var 'sing')
}

namespace {
class TestEagerInitParallelExecutor : public folly::Executor {
 public:
  explicit TestEagerInitParallelExecutor(const size_t threadCount) {
    eventBases_.reserve(threadCount);
    threads_.reserve(threadCount);
    for (size_t i = 0; i < threadCount; i++) {
      eventBases_.push_back(std::make_shared<folly::EventBase>());
      auto eb = eventBases_.back();
      threads_.emplace_back(std::make_shared<std::thread>(
          [eb] { eb->loopForever(); }));
    }
  }

  virtual ~TestEagerInitParallelExecutor() override {
    for (auto eb : eventBases_) {
      eb->runInEventBaseThread([eb] { eb->terminateLoopSoon(); });
    }
    for (auto thread : threads_) {
      thread->join();
    }
  }

  virtual void add(folly::Func func) override {
    const auto index = (counter_ ++) % eventBases_.size();
    eventBases_[index]->add(std::move(func));
  }

 private:
  std::vector<std::shared_ptr<folly::EventBase>> eventBases_;
  std::vector<std::shared_ptr<std::thread>> threads_;
  std::atomic<size_t> counter_ {0};
};
}  // namespace

namespace {
struct EagerInitParallelTag {};
}
template <typename T, typename Tag = detail::DefaultTag>
using SingletonEagerInitParallel = Singleton<T, Tag, EagerInitParallelTag>;
TEST(Singleton, SingletonEagerInitParallel) {
  const static size_t kIters = 1000;
  const static size_t kThreads = 20;

  std::atomic<size_t> initCounter;

  auto& vault = *SingletonVault::singleton<EagerInitParallelTag>();

  auto sing = SingletonEagerInitParallel<std::string>(
                  [&] {++initCounter; return new std::string(""); })
              .shouldEagerInit();

  for (size_t i = 0; i < kIters; i++) {
    SCOPE_EXIT {
      // clean up each time
      vault.destroyInstances();
      vault.reenableInstances();
    };

    initCounter.store(0);

    {
      std::vector<std::shared_ptr<std::thread>> threads;
      boost::barrier barrier(kThreads);
      TestEagerInitParallelExecutor exe(kThreads);
      vault.registrationComplete();

      EXPECT_EQ(0, initCounter.load());

      for (size_t j = 0; j < kThreads; j++) {
        threads.push_back(std::make_shared<std::thread>([&] {
          barrier.wait();
          vault.doEagerInitVia(exe);
        }));
      }

      for (auto thread : threads) {
        thread->join();
      }
    }

    EXPECT_EQ(1, initCounter.load());

    sing.get_weak();  // (avoid compile error complaining about unused var)
  }
}

struct MockTag {};
template <typename T, typename Tag = detail::DefaultTag>
using SingletonMock = Singleton <T, Tag, MockTag>;

// Verify that existing Singleton's can be overridden
// using the make_mock functionality.
TEST(Singleton, MockTest) {
  auto& vault = *SingletonVault::singleton<MockTag>();

  SingletonMock<Watchdog> watchdog_singleton;
  vault.registrationComplete();

  // Registring singletons after registrationComplete called works
  // with make_mock (but not with Singleton ctor).
  EXPECT_EQ(vault.registeredSingletonCount(), 1);
  int serial_count_first = SingletonMock<Watchdog>::try_get()->serial_number;

  // Override existing mock using make_mock.
  SingletonMock<Watchdog>::make_mock();

  EXPECT_EQ(vault.registeredSingletonCount(), 1);
  int serial_count_mock = SingletonMock<Watchdog>::try_get()->serial_number;

  // If serial_count value is the same, then singleton was not replaced.
  EXPECT_NE(serial_count_first, serial_count_mock);

  // Override existing mock using make_mock one more time
  SingletonMock<Watchdog>::make_mock();

  EXPECT_EQ(vault.registeredSingletonCount(), 1);
  int serial_count_mock2 = SingletonMock<Watchdog>::try_get()->serial_number;

  // If serial_count value is the same, then singleton was not replaced.
  EXPECT_NE(serial_count_first, serial_count_mock2);
  EXPECT_NE(serial_count_mock, serial_count_mock2);

  vault.destroyInstances();
}

#ifndef _MSC_VER
// Subprocess isn't currently supported under MSVC.
TEST(Singleton, DoubleRegistrationLogging) {
  const auto basename = "singleton_double_registration";
  const auto sub = fs::executable_path().remove_filename() / basename;
  auto p = Subprocess(
      std::vector<std::string>{sub.string()},
      Subprocess::Options()
          .stdinFd(Subprocess::CLOSE)
          .stdoutFd(Subprocess::CLOSE)
          .pipeStderr()
          .closeOtherFds());
  auto err = p.communicate("").second;
  auto res = p.wait();
  EXPECT_EQ(ProcessReturnCode::KILLED, res.state());
  EXPECT_EQ(SIGABRT, res.killSignal());
  EXPECT_THAT(err, testing::StartsWith("Double registration of singletons"));
}
#endif

// Singleton using a non default constructor test/example:
struct X {
  X() : X(-1, "unset") {}
  X(int a1, std::string a2) : a1(a1), a2(a2) {
    LOG(INFO) << "X(" << a1 << "," << a2 << ")";
  }
  const int a1;
  const std::string a2;
};

folly::Singleton<X> singleton_x([]() { return new X(42, "foo"); });

TEST(Singleton, CustomCreator) {
  X x1;
  std::shared_ptr<X> x2p = singleton_x.try_get();
  EXPECT_NE(nullptr, x2p);
  EXPECT_NE(x1.a1, x2p->a1);
  EXPECT_NE(x1.a2, x2p->a2);
  EXPECT_EQ(42, x2p->a1);
  EXPECT_EQ(std::string("foo"), x2p->a2);
}

struct ConcurrentCreationDestructionTag {};
template <typename T, typename Tag = detail::DefaultTag>
using SingletonConcurrentCreationDestruction =
    Singleton<T, Tag, ConcurrentCreationDestructionTag>;

folly::Baton<> slowpokeNeedySingletonBaton;

struct SlowpokeNeedySingleton {
  SlowpokeNeedySingleton() {
    slowpokeNeedySingletonBaton.post();
    /* sleep override */ std::this_thread::sleep_for(
        std::chrono::milliseconds(100));
    auto unused =
        SingletonConcurrentCreationDestruction<NeededSingleton>::try_get();
    EXPECT_NE(unused, nullptr);
  }
};

TEST(Singleton, ConcurrentCreationDestruction) {
  auto& vault = *SingletonVault::singleton<ConcurrentCreationDestructionTag>();
  SingletonConcurrentCreationDestruction<NeededSingleton> neededSingleton;
  SingletonConcurrentCreationDestruction<SlowpokeNeedySingleton> needySingleton;
  vault.registrationComplete();

  std::thread needyThread([&] { needySingleton.try_get(); });

  slowpokeNeedySingletonBaton.wait();

  vault.destroyInstances();

  needyThread.join();
}
