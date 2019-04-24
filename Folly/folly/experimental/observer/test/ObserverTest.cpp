/*
 * Copyright 2016-present Facebook, Inc.
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

#include <folly/experimental/observer/SimpleObservable.h>
#include <folly/portability/GTest.h>
#include <folly/synchronization/Baton.h>

using namespace folly::observer;

TEST(Observer, Observable) {
  SimpleObservable<int> observable(42);
  auto observer = observable.getObserver();

  EXPECT_EQ(42, **observer);

  folly::Baton<> baton;
  auto waitingObserver = makeObserver([observer, &baton]() {
    *observer;
    baton.post();
    return folly::Unit();
  });
  baton.reset();

  observable.setValue(24);

  EXPECT_TRUE(baton.try_wait_for(std::chrono::seconds{1}));

  EXPECT_EQ(24, **observer);
}

TEST(Observer, MakeObserver) {
  SimpleObservable<int> observable(42);

  auto observer = makeObserver(
      [child = observable.getObserver()]() { return **child + 1; });

  EXPECT_EQ(43, **observer);

  folly::Baton<> baton;
  auto waitingObserver = makeObserver([observer, &baton]() {
    *observer;
    baton.post();
    return folly::Unit();
  });
  baton.reset();

  observable.setValue(24);

  EXPECT_TRUE(baton.try_wait_for(std::chrono::seconds{1}));

  EXPECT_EQ(25, **observer);
}

TEST(Observer, MakeObserverDiamond) {
  SimpleObservable<int> observable(42);

  auto observer1 = makeObserver(
      [child = observable.getObserver()]() { return **child + 1; });

  auto observer2 = makeObserver([child = observable.getObserver()]() {
    return std::make_shared<int>(**child + 2);
  });

  auto observer = makeObserver(
      [observer1, observer2]() { return (**observer1) * (**observer2); });

  EXPECT_EQ(43 * 44, *observer.getSnapshot());

  folly::Baton<> baton;
  auto waitingObserver = makeObserver([observer, &baton]() {
    *observer;
    baton.post();
    return folly::Unit();
  });
  baton.reset();

  observable.setValue(24);

  EXPECT_TRUE(baton.try_wait_for(std::chrono::seconds{1}));

  EXPECT_EQ(25 * 26, **observer);
}

TEST(Observer, CreateException) {
  struct ExpectedException {};
  EXPECT_THROW(
      auto observer = makeObserver(
          []() -> std::shared_ptr<int> { throw ExpectedException(); }),
      ExpectedException);

  EXPECT_THROW(
      auto observer =
          makeObserver([]() -> std::shared_ptr<int> { return nullptr; }),
      std::logic_error);
}

TEST(Observer, NullValue) {
  SimpleObservable<int> observable(41);
  auto oddObserver = makeObserver([innerObserver = observable.getObserver()]() {
    auto value = **innerObserver;

    if (value % 2 != 0) {
      return value * 2;
    }

    throw std::logic_error("I prefer odd numbers");
  });

  folly::Baton<> baton;
  auto waitingObserver = makeObserver([oddObserver, &baton]() {
    *oddObserver;
    baton.post();
    return folly::Unit();
  });

  baton.reset();
  EXPECT_EQ(82, **oddObserver);

  observable.setValue(2);

  // Waiting observer shouldn't be updated
  EXPECT_FALSE(baton.try_wait_for(std::chrono::seconds{1}));
  baton.reset();

  EXPECT_EQ(82, **oddObserver);

  observable.setValue(23);

  EXPECT_TRUE(baton.try_wait_for(std::chrono::seconds{1}));

  EXPECT_EQ(46, **oddObserver);
}

TEST(Observer, Cycle) {
  SimpleObservable<int> observable(0);
  auto observer = observable.getObserver();
  folly::Optional<Observer<int>> observerB;

  auto observerA = makeObserver([observer, &observerB]() {
    auto value = **observer;
    if (value == 1) {
      **observerB;
    }
    return value;
  });

  observerB = makeObserver([observerA]() { return **observerA; });

  auto collectObserver = makeObserver([observer, observerA, &observerB]() {
    auto value = **observer;
    auto valueA = **observerA;
    auto valueB = ***observerB;

    if (value == 1) {
      if (valueA == 0) {
        EXPECT_EQ(0, valueB);
      } else {
        EXPECT_EQ(1, valueA);
        EXPECT_EQ(0, valueB);
      }
    } else if (value == 2) {
      EXPECT_EQ(value, valueA);
      EXPECT_TRUE(valueB == 0 || valueB == 2);
    } else {
      EXPECT_EQ(value, valueA);
      EXPECT_EQ(value, valueB);
    }

    return value;
  });

  folly::Baton<> baton;
  auto waitingObserver = makeObserver([collectObserver, &baton]() {
    *collectObserver;
    baton.post();
    return folly::Unit();
  });

  baton.reset();
  EXPECT_EQ(0, **collectObserver);

  for (size_t i = 1; i <= 3; ++i) {
    observable.setValue(i);

    EXPECT_TRUE(baton.try_wait_for(std::chrono::seconds{1}));
    baton.reset();

    EXPECT_EQ(i, **collectObserver);
  }
}

TEST(Observer, Stress) {
  SimpleObservable<int> observable(0);

  auto values = std::make_shared<folly::Synchronized<std::vector<int>>>();

  auto observer = makeObserver([child = observable.getObserver(), values]() {
    auto value = **child * 10;
    values->withWLock([&](std::vector<int>& vals) { vals.push_back(value); });
    return value;
  });

  EXPECT_EQ(0, **observer);
  values->withRLock([](const std::vector<int>& vals) {
    EXPECT_EQ(1, vals.size());
    EXPECT_EQ(0, vals.back());
  });

  constexpr size_t numIters = 10000;

  for (size_t i = 1; i <= numIters; ++i) {
    observable.setValue(i);
  }

  while (**observer != numIters * 10) {
    std::this_thread::yield();
  }

  values->withRLock([numIters = numIters](const std::vector<int>& vals) {
    EXPECT_EQ(numIters * 10, vals.back());
    EXPECT_LT(vals.size(), numIters / 2);

    EXPECT_EQ(0, vals[0]);
    EXPECT_EQ(numIters * 10, vals.back());

    for (auto value : vals) {
      EXPECT_EQ(0, value % 10);
    }

    for (size_t i = 0; i < vals.size() - 1; ++i) {
      EXPECT_LE(vals[i], vals[i + 1]);
    }
  });
}

TEST(Observer, TLObserver) {
  auto createTLObserver = [](int value) {
    return folly::observer::makeTLObserver([=] { return value; });
  };

  auto k =
      std::make_unique<folly::observer::TLObserver<int>>(createTLObserver(42));
  EXPECT_EQ(42, ***k);
  k = std::make_unique<folly::observer::TLObserver<int>>(createTLObserver(41));
  EXPECT_EQ(41, ***k);
}

TEST(Observer, SubscribeCallback) {
  static auto mainThreadId = std::this_thread::get_id();
  static std::function<void()> updatesCob;
  static bool slowGet = false;
  static std::atomic<size_t> getCallsStart{0};
  static std::atomic<size_t> getCallsFinish{0};

  struct Observable {
    ~Observable() {
      EXPECT_EQ(mainThreadId, std::this_thread::get_id());
    }
  };
  struct Traits {
    using element_type = int;
    static std::shared_ptr<const int> get(Observable&) {
      ++getCallsStart;
      if (slowGet) {
        /* sleep override */ std::this_thread::sleep_for(
            std::chrono::seconds{2});
      }
      ++getCallsFinish;
      return std::make_shared<const int>(42);
    }

    static void subscribe(Observable&, std::function<void()> cob) {
      updatesCob = std::move(cob);
    }

    static void unsubscribe(Observable&) {}
  };

  std::thread cobThread;
  {
    auto observer =
        folly::observer::ObserverCreator<Observable, Traits>().getObserver();

    EXPECT_TRUE(updatesCob);
    EXPECT_EQ(2, getCallsStart);
    EXPECT_EQ(2, getCallsFinish);

    updatesCob();
    EXPECT_EQ(3, getCallsStart);
    EXPECT_EQ(3, getCallsFinish);

    slowGet = true;
    cobThread = std::thread([] { updatesCob(); });
    /* sleep override */ std::this_thread::sleep_for(std::chrono::seconds{1});
    EXPECT_EQ(4, getCallsStart);
    EXPECT_EQ(3, getCallsFinish);

    // Observer is destroyed here
  }

  // Make sure that destroying the observer actually joined the updates callback
  EXPECT_EQ(4, getCallsStart);
  EXPECT_EQ(4, getCallsFinish);
  cobThread.join();
}

TEST(Observer, SetCallback) {
  folly::observer::SimpleObservable<int> observable(42);
  auto observer = observable.getObserver();
  folly::Baton<> baton;
  int callbackValue = 0;
  size_t callbackCallsCount = 0;

  auto callbackHandle =
      observer.addCallback([&](folly::observer::Snapshot<int> snapshot) {
        ++callbackCallsCount;
        callbackValue = *snapshot;
        baton.post();
      });
  baton.wait();
  baton.reset();
  EXPECT_EQ(42, callbackValue);
  EXPECT_EQ(1, callbackCallsCount);

  observable.setValue(43);
  baton.wait();
  baton.reset();
  EXPECT_EQ(43, callbackValue);
  EXPECT_EQ(2, callbackCallsCount);

  callbackHandle.cancel();

  observable.setValue(44);
  EXPECT_FALSE(baton.timed_wait(std::chrono::milliseconds{100}));
  EXPECT_EQ(43, callbackValue);
  EXPECT_EQ(2, callbackCallsCount);
}

int makeObserverRecursion(int n) {
  if (n == 0) {
    return 0;
  }
  return **makeObserver([=] { return makeObserverRecursion(n - 1) + 1; });
}

TEST(Observer, NestedMakeObserver) {
  EXPECT_EQ(32, makeObserverRecursion(32));
}
