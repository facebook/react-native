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
#include <folly/Executor.h>
#include <folly/Memory.h>
#include <folly/Unit.h>
#include <folly/dynamic.h>
#include <folly/executors/ManualExecutor.h>
#include <folly/futures/Future.h>
#include <folly/io/async/EventBase.h>
#include <folly/portability/GTest.h>
#include <folly/synchronization/Baton.h>

#include <algorithm>
#include <atomic>
#include <future>
#include <memory>
#include <numeric>
#include <string>
#include <thread>
#include <type_traits>

using namespace folly;

#define EXPECT_TYPE(x, T) EXPECT_TRUE((std::is_same<decltype(x), T>::value))

typedef FutureException eggs_t;
static eggs_t eggs("eggs");

// Future

TEST(SemiFuture, makeEmpty) {
  auto f = SemiFuture<int>::makeEmpty();
  EXPECT_THROW(f.isReady(), FutureInvalid);
}

TEST(SemiFuture, futureDefaultCtor) {
  SemiFuture<Unit>();
}

TEST(SemiFuture, makeSemiFutureWithUnit) {
  int count = 0;
  SemiFuture<Unit> fu = makeSemiFutureWith([&] { count++; });
  EXPECT_EQ(1, count);
}

namespace {
auto makeValid() {
  auto valid = makeSemiFuture<int>(42);
  EXPECT_TRUE(valid.valid());
  return valid;
}
auto makeInvalid() {
  auto invalid = SemiFuture<int>::makeEmpty();
  EXPECT_FALSE(invalid.valid());
  return invalid;
}
} // namespace

TEST(SemiFuture, ctorPostconditionValid) {
  // Ctors/factories that promise valid -- postcondition: valid()

#define DOIT(CREATION_EXPR)    \
  do {                         \
    auto f1 = (CREATION_EXPR); \
    EXPECT_TRUE(f1.valid());   \
    auto f2 = std::move(f1);   \
    EXPECT_FALSE(f1.valid());  \
    EXPECT_TRUE(f2.valid());   \
  } while (false)

  auto const except = std::logic_error("foo");
  auto const ewrap = folly::exception_wrapper(except);

  DOIT(makeValid());
  DOIT(SemiFuture<int>(42));
  DOIT(SemiFuture<int>{42});
  DOIT(SemiFuture<Unit>());
  DOIT(SemiFuture<Unit>{});
  DOIT(makeSemiFuture());
  DOIT(makeSemiFuture(Unit{}));
  DOIT(makeSemiFuture<Unit>(Unit{}));
  DOIT(makeSemiFuture(42));
  DOIT(makeSemiFuture<int>(42));
  DOIT(makeSemiFuture<int>(except));
  DOIT(makeSemiFuture<int>(ewrap));
  DOIT(makeSemiFuture(Try<int>(42)));
  DOIT(makeSemiFuture<int>(Try<int>(42)));
  DOIT(makeSemiFuture<int>(Try<int>(ewrap)));

#undef DOIT
}

TEST(SemiFuture, ctorPostconditionInvalid) {
  // Ctors/factories that promise invalid -- postcondition: !valid()

#define DOIT(CREATION_EXPR)    \
  do {                         \
    auto f1 = (CREATION_EXPR); \
    EXPECT_FALSE(f1.valid());  \
    auto f2 = std::move(f1);   \
    EXPECT_FALSE(f1.valid());  \
    EXPECT_FALSE(f2.valid());  \
  } while (false)

  DOIT(makeInvalid());
  DOIT(SemiFuture<int>::makeEmpty());

#undef DOIT
}

TEST(SemiFuture, lacksPreconditionValid) {
  // Ops that don't throw FutureInvalid if !valid() --
  // without precondition: valid()

#define DOIT(STMT)         \
  do {                     \
    auto f = makeValid();  \
    { STMT; }              \
    copy(std::move(f));    \
    EXPECT_NO_THROW(STMT); \
  } while (false)

  // .valid() itself
  DOIT(f.valid());

  // move-ctor - move-copy to local, copy(), pass-by-move-value
  DOIT(auto other = std::move(f));
  DOIT(copy(std::move(f)));
  DOIT(([](auto) {})(std::move(f)));

  // move-assignment into either {valid | invalid}
  DOIT({
    auto other = makeValid();
    other = std::move(f);
  });
  DOIT({
    auto other = makeInvalid();
    other = std::move(f);
  });

#undef DOIT
}

TEST(SemiFuture, hasPreconditionValid) {
  // Ops that require validity; precondition: valid();
  // throw FutureInvalid if !valid()

#define DOIT(STMT)                     \
  do {                                 \
    auto f = makeValid();              \
    EXPECT_NO_THROW(STMT);             \
    copy(std::move(f));                \
    EXPECT_THROW(STMT, FutureInvalid); \
  } while (false)

  DOIT(f.isReady());
  DOIT(f.result());
  DOIT(std::move(f).getTry());
  DOIT(f.hasValue());
  DOIT(f.hasException());
  DOIT(f.value());

#undef DOIT
}

TEST(SemiFuture, hasPostconditionValid) {
  // Ops that preserve validity -- postcondition: valid()

#define DOIT(STMT)          \
  do {                      \
    auto f = makeValid();   \
    EXPECT_NO_THROW(STMT);  \
    EXPECT_TRUE(f.valid()); \
  } while (false)

  auto const swallow = [](auto) {};

  DOIT(swallow(f.valid())); // f.valid() itself preserves validity
  DOIT(swallow(f.isReady()));
  DOIT(swallow(f.hasValue()));
  DOIT(swallow(f.hasException()));
  DOIT(swallow(f.value()));
  DOIT(swallow(f.poll()));
  DOIT(f.raise(std::logic_error("foo")));
  DOIT(f.cancel());
  DOIT(f.wait());
  DOIT(std::move(f.wait()));

#undef DOIT
}

TEST(SemiFuture, hasPostconditionInvalid) {
  // Ops that consume *this -- postcondition: !valid()

#define DOIT(CTOR, STMT)     \
  do {                       \
    auto f = (CTOR);         \
    EXPECT_NO_THROW(STMT);   \
    EXPECT_FALSE(f.valid()); \
  } while (false)

  // move-ctor of {valid|invalid}
  DOIT(makeValid(), { auto other{std::move(f)}; });
  DOIT(makeInvalid(), { auto other{std::move(f)}; });

  // move-assignment of {valid|invalid} into {valid|invalid}
  DOIT(makeValid(), {
    auto other = makeValid();
    other = std::move(f);
  });
  DOIT(makeValid(), {
    auto other = makeInvalid();
    other = std::move(f);
  });
  DOIT(makeInvalid(), {
    auto other = makeValid();
    other = std::move(f);
  });
  DOIT(makeInvalid(), {
    auto other = makeInvalid();
    other = std::move(f);
  });

  // pass-by-value of {valid|invalid}
  DOIT(makeValid(), {
    auto const byval = [](auto) {};
    byval(std::move(f));
  });
  DOIT(makeInvalid(), {
    auto const byval = [](auto) {};
    byval(std::move(f));
  });

  // other consuming ops
  auto const swallow = [](auto) {};
  DOIT(makeValid(), swallow(std::move(f).get()));
  DOIT(makeValid(), swallow(std::move(f).getTry()));
  DOIT(makeValid(), swallow(std::move(f).wait()));
  DOIT(makeValid(), swallow(std::move(f.wait())));

#undef DOIT
}

namespace {
int onErrorHelperEggs(const eggs_t&) {
  return 10;
}
int onErrorHelperGeneric(const folly::exception_wrapper&) {
  return 20;
}
} // namespace

TEST(SemiFuture, special) {
  EXPECT_FALSE(std::is_copy_constructible<SemiFuture<int>>::value);
  EXPECT_FALSE(std::is_copy_assignable<SemiFuture<int>>::value);
  EXPECT_TRUE(std::is_move_constructible<SemiFuture<int>>::value);
  EXPECT_TRUE(std::is_move_assignable<SemiFuture<int>>::value);
}

TEST(SemiFuture, value) {
  auto f = makeSemiFuture(std::make_unique<int>(42));
  auto up = std::move(f.value());
  EXPECT_EQ(42, *up);

  EXPECT_THROW(makeSemiFuture<int>(eggs).value(), eggs_t);

  EXPECT_TYPE(std::declval<SemiFuture<int>&>().value(), int&);
  EXPECT_TYPE(std::declval<SemiFuture<int> const&>().value(), int const&);
  EXPECT_TYPE(std::declval<SemiFuture<int>&&>().value(), int&&);
  EXPECT_TYPE(std::declval<SemiFuture<int> const&&>().value(), int const&&);
}

TEST(SemiFuture, hasException) {
  EXPECT_TRUE(makeSemiFuture<int>(eggs).getTry().hasException());
  EXPECT_FALSE(makeSemiFuture(42).getTry().hasException());
}

TEST(SemiFuture, hasValue) {
  EXPECT_TRUE(makeSemiFuture(42).getTry().hasValue());
  EXPECT_FALSE(makeSemiFuture<int>(eggs).getTry().hasValue());
}

TEST(SemiFuture, makeSemiFuture) {
  EXPECT_TYPE(makeSemiFuture(42), SemiFuture<int>);
  EXPECT_EQ(42, makeSemiFuture(42).value());

  EXPECT_TYPE(makeSemiFuture<float>(42), SemiFuture<float>);
  EXPECT_EQ(42, makeSemiFuture<float>(42).value());

  auto fun = [] { return 42; };
  EXPECT_TYPE(makeSemiFutureWith(fun), SemiFuture<int>);
  EXPECT_EQ(42, makeSemiFutureWith(fun).value());

  auto funf = [] { return makeSemiFuture<int>(43); };
  EXPECT_TYPE(makeSemiFutureWith(funf), SemiFuture<int>);
  EXPECT_EQ(43, makeSemiFutureWith(funf).value());

  auto failfun = []() -> int { throw eggs; };
  EXPECT_TYPE(makeSemiFutureWith(failfun), SemiFuture<int>);
  EXPECT_NO_THROW(makeSemiFutureWith(failfun));
  EXPECT_THROW(makeSemiFutureWith(failfun).value(), eggs_t);

  auto failfunf = []() -> SemiFuture<int> { throw eggs; };
  EXPECT_TYPE(makeSemiFutureWith(failfunf), SemiFuture<int>);
  EXPECT_NO_THROW(makeSemiFutureWith(failfunf));
  EXPECT_THROW(makeSemiFutureWith(failfunf).value(), eggs_t);

  auto futurefun = [] { return makeFuture<int>(44); };
  EXPECT_TYPE(makeSemiFutureWith(futurefun), SemiFuture<int>);
  EXPECT_EQ(44, makeSemiFutureWith(futurefun).value());

  EXPECT_TYPE(makeSemiFuture(), SemiFuture<Unit>);
}

TEST(SemiFuture, Constructor) {
  auto f1 = []() -> SemiFuture<int> { return SemiFuture<int>(3); }();
  EXPECT_EQ(f1.value(), 3);
  auto f2 = []() -> SemiFuture<Unit> { return SemiFuture<Unit>(); }();
  EXPECT_NO_THROW(f2.value());
}

TEST(SemiFuture, ImplicitConstructor) {
  auto f1 = []() -> SemiFuture<int> { return 3; }();
  EXPECT_EQ(f1.value(), 3);
}

TEST(SemiFuture, InPlaceConstructor) {
  auto f = SemiFuture<std::pair<int, double>>(in_place, 5, 3.2);
  EXPECT_EQ(5, f.value().first);
}

TEST(SemiFuture, makeSemiFutureNoThrow) {
  makeSemiFuture().value();
}

TEST(SemiFuture, ViaThrowOnNull) {
  EXPECT_THROW(makeSemiFuture().via(nullptr), FutureNoExecutor);
}

TEST(SemiFuture, ConstructSemiFutureFromEmptyFuture) {
  auto f = SemiFuture<int>{Future<int>::makeEmpty()};
  EXPECT_THROW(f.isReady(), FutureInvalid);
}

TEST(SemiFuture, ConstructSemiFutureFromFutureDefaultCtor) {
  SemiFuture<Unit>(Future<Unit>{});
}

TEST(SemiFuture, MakeSemiFutureFromFutureWithUnit) {
  int count = 0;
  SemiFuture<Unit> fu = SemiFuture<Unit>{makeFutureWith([&] { count++; })};
  EXPECT_EQ(1, count);
}

TEST(SemiFuture, MakeSemiFutureFromFutureWithValue) {
  auto f =
      SemiFuture<std::unique_ptr<int>>{makeFuture(std::make_unique<int>(42))};
  auto up = std::move(f.value());
  EXPECT_EQ(42, *up);
}

TEST(SemiFuture, MakeSemiFutureFromReadyFuture) {
  Promise<int> p;
  auto f = p.getSemiFuture();
  EXPECT_FALSE(f.isReady());
  p.setValue(42);
  EXPECT_TRUE(f.isReady());
}

TEST(SemiFuture, MakeSemiFutureFromNotReadyFuture) {
  Promise<int> p;
  auto f = p.getSemiFuture();
  EXPECT_THROW(f.value(), eggs_t);
}

TEST(SemiFuture, MakeFutureFromSemiFuture) {
  folly::EventBase e;
  Promise<int> p;
  std::atomic<int> result{0};
  auto f = p.getSemiFuture();
  auto future = std::move(f).via(&e).then([&](int value) {
    result = value;
    return value;
  });
  e.loopOnce();
  EXPECT_EQ(result, 0);
  EXPECT_FALSE(future.isReady());
  p.setValue(42);
  e.loopOnce();
  EXPECT_TRUE(future.isReady());
  ASSERT_EQ(future.value(), 42);
  ASSERT_EQ(result, 42);
}

TEST(SemiFuture, MakeFutureFromSemiFutureReturnFuture) {
  folly::EventBase e;
  Promise<int> p;
  int result{0};
  auto f = p.getSemiFuture();
  auto future = std::move(f).via(&e).then([&](int value) {
    result = value;
    return folly::makeFuture(std::move(value));
  });
  e.loopOnce();
  EXPECT_EQ(result, 0);
  EXPECT_FALSE(future.isReady());
  p.setValue(42);
  e.loopOnce();
  EXPECT_TRUE(future.isReady());
  ASSERT_EQ(future.value(), 42);
  ASSERT_EQ(result, 42);
}

TEST(SemiFuture, MakeFutureFromSemiFutureReturnSemiFuture) {
  folly::EventBase e;
  Promise<int> p;
  int result{0};
  auto f = p.getSemiFuture();
  auto future = std::move(f)
                    .via(&e)
                    .then([&](int value) {
                      result = value;
                      return folly::makeSemiFuture(std::move(value));
                    })
                    .then([&](int value) {
                      return folly::makeSemiFuture(std::move(value));
                    });
  e.loopOnce();
  EXPECT_EQ(result, 0);
  EXPECT_FALSE(future.isReady());
  p.setValue(42);
  e.loopOnce();
  e.loopOnce();
  EXPECT_TRUE(future.isReady());
  ASSERT_EQ(future.value(), 42);
  ASSERT_EQ(result, 42);
}

TEST(SemiFuture, MakeFutureFromSemiFutureLValue) {
  folly::EventBase e;
  Promise<int> p;
  std::atomic<int> result{0};
  auto f = p.getSemiFuture();
  auto future = std::move(f).via(&e).then([&](int value) {
    result = value;
    return value;
  });
  e.loopOnce();
  EXPECT_EQ(result, 0);
  EXPECT_FALSE(future.isReady());
  p.setValue(42);
  e.loopOnce();
  EXPECT_TRUE(future.isReady());
  ASSERT_EQ(future.value(), 42);
  ASSERT_EQ(result, 42);
}

TEST(SemiFuture, SimpleGet) {
  EventBase e2;
  Promise<int> p;
  auto sf = p.getSemiFuture();
  p.setValue(3);
  auto v = std::move(sf).get();
  ASSERT_EQ(v, 3);
}

TEST(SemiFuture, SimpleGetTry) {
  EventBase e2;
  Promise<int> p;
  auto sf = p.getSemiFuture();
  p.setValue(3);
  auto v = std::move(sf).getTry();
  ASSERT_EQ(v.value(), 3);
}

TEST(SemiFuture, SimpleTimedGet) {
  Promise<folly::Unit> p;
  auto sf = p.getSemiFuture();
  EXPECT_THROW(
      std::move(sf).get(std::chrono::milliseconds(100)), FutureTimeout);
}

TEST(SemiFuture, SimpleTimedGetViaFromSemiFuture) {
  TimedDrivableExecutor e2;
  Promise<folly::Unit> p;
  auto sf = p.getSemiFuture();
  EXPECT_THROW(
      std::move(sf).via(&e2).getVia(&e2, std::chrono::milliseconds(100)),
      FutureTimeout);
}

TEST(SemiFuture, SimpleTimedGetTry) {
  Promise<folly::Unit> p;
  auto sf = p.getSemiFuture();
  EXPECT_THROW(
      std::move(sf).getTry(std::chrono::milliseconds(100)), FutureTimeout);
}

TEST(SemiFuture, SimpleTimedGetTryViaFromSemiFuture) {
  TimedDrivableExecutor e2;
  Promise<folly::Unit> p;
  auto sf = p.getSemiFuture();
  EXPECT_THROW(
      std::move(sf).via(&e2).getTryVia(&e2, std::chrono::milliseconds(100)),
      FutureTimeout);
}

TEST(SemiFuture, SimpleValue) {
  Promise<int> p;
  auto sf = p.getSemiFuture();
  p.setValue(3);
  auto v = std::move(sf).value();
  ASSERT_EQ(v, 3);
}

TEST(SemiFuture, SimpleValueThrow) {
  Promise<folly::Unit> p;
  auto sf = p.getSemiFuture();
  EXPECT_THROW(std::move(sf).value(), FutureNotReady);
}

TEST(SemiFuture, SimpleResult) {
  EventBase e2;
  Promise<int> p;
  auto sf = p.getSemiFuture();
  p.setValue(3);
  auto v = std::move(sf).result();
  ASSERT_EQ(v.value(), 3);
}

TEST(SemiFuture, SimpleResultThrow) {
  EventBase e2;
  Promise<folly::Unit> p;
  auto sf = p.getSemiFuture();
  EXPECT_THROW(std::move(sf).result(), FutureNotReady);
}

TEST(SemiFuture, SimpleDefer) {
  std::atomic<int> innerResult{0};
  Promise<folly::Unit> p;
  auto f = p.getSemiFuture().toUnsafeFuture();
  auto sf = std::move(f).semi().defer([&](auto&&) { innerResult = 17; });
  p.setValue();
  // Run "F" here inline in the calling thread
  std::move(sf).get();
  ASSERT_EQ(innerResult, 17);
}

TEST(SemiFuture, DeferWithDelayedSetValue) {
  EventBase e2;
  Promise<folly::Unit> p;
  auto f = p.getSemiFuture().toUnsafeFuture();
  auto sf = std::move(f).semi().defer([&](auto&&) { return 17; });

  // Start thread and have it blocking in the semifuture before we satisfy the
  // promise
  auto resultF =
      std::async(std::launch::async, [&]() { return std::move(sf).get(); });

  // Check that future is not already satisfied before setting the promise
  // Async task should be blocked on sf.
  ASSERT_EQ(
      resultF.wait_for(std::chrono::milliseconds(100)),
      std::future_status::timeout);
  p.setValue();
  ASSERT_EQ(resultF.get(), 17);
}

TEST(SemiFuture, DeferWithViaAndDelayedSetValue) {
  EventBase e2;
  Promise<folly::Unit> p;
  auto f = p.getSemiFuture().toUnsafeFuture();
  auto sf = std::move(f).semi().defer([&](auto&&) { return 17; }).via(&e2);
  // Start thread and have it blocking in the semifuture before we satisfy the
  // promise.
  auto resultF =
      std::async(std::launch::async, [&]() { return std::move(sf).get(); });
  std::thread t([&]() { e2.loopForever(); });
  // Check that future is not already satisfied before setting the promise
  // Async task should be blocked on sf.
  ASSERT_EQ(
      resultF.wait_for(std::chrono::milliseconds(100)),
      std::future_status::timeout);
  p.setValue();
  e2.terminateLoopSoon();
  t.join();
  ASSERT_EQ(resultF.get(), 17);
}

TEST(SemiFuture, DeferWithGetTimedGet) {
  std::atomic<int> innerResult{0};
  Promise<folly::Unit> p;
  auto f = p.getSemiFuture().toUnsafeFuture();
  auto sf = std::move(f).semi().defer([&](auto&&) { innerResult = 17; });
  EXPECT_THROW(
      std::move(sf).get(std::chrono::milliseconds(100)), FutureTimeout);
  ASSERT_EQ(innerResult, 0);
}

TEST(SemiFuture, DeferWithVia) {
  std::atomic<int> innerResult{0};
  EventBase e2;
  Promise<folly::Unit> p;
  auto f = p.getSemiFuture().toUnsafeFuture();
  auto sf = std::move(f).semi().defer([&](auto&&) { innerResult = 17; });
  // Run "F" here inline in the calling thread
  auto tf = std::move(sf).via(&e2);
  p.setValue();
  tf.getVia(&e2);
  ASSERT_EQ(innerResult, 17);
}

TEST(SemiFuture, ChainingDefertoThen) {
  std::atomic<int> innerResult{0};
  std::atomic<int> result{0};
  EventBase e2;
  Promise<folly::Unit> p;
  auto f = p.getSemiFuture().toUnsafeFuture();
  auto sf = std::move(f).semi().defer([&](auto&&) { innerResult = 17; });
  // Run "F" here inline in a task running on the eventbase
  auto tf = std::move(sf).via(&e2).thenValue([&](auto&&) { result = 42; });
  p.setValue();
  tf.getVia(&e2);
  ASSERT_EQ(innerResult, 17);
  ASSERT_EQ(result, 42);
}

TEST(SemiFuture, SimpleDeferWithValue) {
  std::atomic<int> innerResult{0};
  Promise<int> p;
  auto f = p.getSemiFuture().toUnsafeFuture();
  auto sf = std::move(f).semi().deferValue([&](int a) { innerResult = a; });
  p.setValue(7);
  // Run "F" here inline in the calling thread
  std::move(sf).get();
  ASSERT_EQ(innerResult, 7);
}

namespace {
int deferValueHelper(int a) {
  return a;
}

} // namespace
TEST(SemiFuture, SimpleDeferWithValueFunctionReference) {
  Promise<int> p;
  auto f = p.getSemiFuture().toUnsafeFuture();
  auto sf = std::move(f).semi().deferValue(deferValueHelper);
  p.setValue(7);
  // Run "F" here inline in the calling thread
  ASSERT_EQ(std::move(sf).get(), 7);
}

TEST(SemiFuture, ChainingDefertoThenWithValue) {
  std::atomic<int> innerResult{0};
  std::atomic<int> result{0};
  EventBase e2;
  Promise<int> p;
  auto f = p.getSemiFuture().toUnsafeFuture();
  auto sf = std::move(f).semi().deferValue([&](int a) {
    innerResult = a;
    return a;
  });
  // Run "F" here inline in a task running on the eventbase
  auto tf = std::move(sf).via(&e2).then([&](int a) { result = a; });
  p.setValue(7);
  tf.getVia(&e2);
  ASSERT_EQ(innerResult, 7);
  ASSERT_EQ(result, 7);
}

TEST(SemiFuture, MakeSemiFutureFromFutureWithTry) {
  Promise<int> p;
  auto f = p.getSemiFuture().toUnsafeFuture();
  auto sf = std::move(f).semi().defer([&](Try<int> t) {
    if (auto err = t.tryGetExceptionObject<std::logic_error>()) {
      return Try<std::string>(err->what());
    }
    return Try<std::string>(
        make_exception_wrapper<std::logic_error>("Exception"));
  });
  p.setException(make_exception_wrapper<std::logic_error>("Try"));
  auto tryResult = std::move(sf).get();
  ASSERT_EQ(tryResult.value(), "Try");
}

namespace {
[[noreturn]] void deferHelper(folly::Try<folly::Unit>&&) {
  throw eggs;
}
} // namespace

TEST(SemiFuture, DeferWithinContinuation) {
  std::atomic<int> innerResult{0};
  std::atomic<int> result{0};
  EventBase e2;
  Promise<int> p;
  Promise<int> p2;
  auto f = p.getSemiFuture().via(&e2);
  auto resultF = std::move(f).then([&, p3 = std::move(p2)](int outer) mutable {
    result = outer;
    return makeSemiFuture<int>(std::move(outer))
        .deferValue([&, p4 = std::move(p3)](int inner) mutable {
          innerResult = inner;
          p4.setValue(inner);
          return inner;
        });
  });
  p.setValue(7);
  auto r = resultF.getVia(&e2);
  ASSERT_EQ(r, 7);
  ASSERT_EQ(innerResult, 7);
  ASSERT_EQ(result, 7);
}

TEST(SemiFuture, onError) {
  bool theFlag = false;
  auto flag = [&] { theFlag = true; };
#define EXPECT_FLAG()     \
  do {                    \
    EXPECT_TRUE(theFlag); \
    theFlag = false;      \
  } while (0);

#define EXPECT_NO_FLAG()   \
  do {                     \
    EXPECT_FALSE(theFlag); \
    theFlag = false;       \
  } while (0);

  // By reference
  {
    auto f = makeSemiFuture()
                 .defer([](auto&&) { throw eggs; })
                 .deferError<eggs_t>([&](eggs_t const& /* e */) { flag(); });
    EXPECT_NO_THROW(std::move(f).get());
    EXPECT_FLAG();
  }

  {
    auto f = makeSemiFuture()
                 .defer(deferHelper)
                 .deferError<eggs_t>([&](eggs_t const& /* e */) { flag(); });
    EXPECT_NO_THROW(std::move(f).get());
    EXPECT_FLAG();
  }

  // By auto reference
  {
    auto f = makeSemiFuture()
                 .defer([](auto&&) { throw eggs; })
                 .deferError<eggs_t>([&](auto& /* e */) { flag(); });
    EXPECT_NO_THROW(std::move(f).get());
    EXPECT_FLAG();
  }

  // By value
  {
    auto f = makeSemiFuture()
                 .defer([](auto&&) { throw eggs; })
                 .deferError<eggs_t>([&](eggs_t /* e */) { flag(); });
    EXPECT_NO_THROW(std::move(f).get());
    EXPECT_FLAG();
  }

  // auto value
  {
    auto f = makeSemiFuture()
                 .defer([](auto&&) { throw eggs; })
                 .deferError<eggs_t>([&](auto /* e */) { flag(); });
    EXPECT_NO_THROW(std::move(f).get());
    EXPECT_FLAG();
  }

  // Polymorphic
  {
    auto f =
        makeSemiFuture()
            .defer([](auto&&) { throw eggs; })
            .deferError<std::exception>([&](auto const& /* e */) { flag(); });
    EXPECT_NO_THROW(std::move(f).get());
    EXPECT_FLAG();
  }

  // Non-exceptions
  {
    auto f = makeSemiFuture()
                 .defer([](auto&&) { throw - 1; })
                 .deferError<int>([&](auto /* e */) { flag(); });
    EXPECT_NO_THROW(std::move(f).get());
    EXPECT_FLAG();
  }

  // Mutable lambda
  {
    auto f =
        makeSemiFuture()
            .defer([](auto&&) { throw eggs; })
            .deferError<eggs_t>([&](auto const& /* e */) mutable { flag(); });
    EXPECT_NO_THROW(std::move(f).get());
    EXPECT_FLAG();
  }

  // Function pointer
  {
    auto f = makeSemiFuture()
                 .defer([](auto &&) -> int { throw eggs; })
                 .deferError<eggs_t>(onErrorHelperEggs)
                 .deferError(onErrorHelperGeneric);
    EXPECT_EQ(10, std::move(f).get());
  }
  {
    auto f =
        makeSemiFuture()
            .defer([](auto &&) -> int { throw std::runtime_error("test"); })
            .deferError<eggs_t>(onErrorHelperEggs)
            .deferError(onErrorHelperGeneric);
    EXPECT_EQ(20, std::move(f).get());
  }
  {
    auto f =
        makeSemiFuture()
            .defer([](auto &&) -> int { throw std::runtime_error("test"); })
            .deferError<eggs_t>(onErrorHelperEggs);
    EXPECT_THROW(std::move(f).get(), std::runtime_error);
  }

  // No throw
  {
    auto f = makeSemiFuture()
                 .defer([](auto&&) { return 42; })
                 .deferError<eggs_t>([&](auto& /* e */) {
                   flag();
                   return -1;
                 });
    EXPECT_NO_FLAG();
    EXPECT_EQ(42, std::move(f).get());
    EXPECT_NO_FLAG();
  }

  // Catch different exception
  {
    auto f = makeSemiFuture()
                 .defer([](auto&&) { throw eggs; })
                 .deferError<std::runtime_error>(
                     [&](auto const& /* e */) { flag(); });
    EXPECT_THROW(std::move(f).get(), eggs_t);
    EXPECT_NO_FLAG();
  }

  // Returned value propagates
  {
    auto f = makeSemiFuture()
                 .defer([](auto &&) -> int { throw eggs; })
                 .deferError<eggs_t>([&](auto const& /* e */) { return 42; });
    EXPECT_EQ(42, std::move(f).get());
  }

  // Throw in callback
  {
    auto f = makeSemiFuture()
                 .defer([](auto &&) -> int { throw eggs; })
                 .deferError<eggs_t>([&](auto const& e) -> int { throw e; });
    EXPECT_THROW(std::move(f).get(), eggs_t);
  }

  // exception_wrapper, return T
  {
    auto f = makeSemiFuture()
                 .defer([](auto &&) -> int { throw eggs; })
                 .deferError([&](exception_wrapper /* e */) {
                   flag();
                   return -1;
                 });
    EXPECT_EQ(-1, std::move(f).get());
    EXPECT_FLAG();
  }

  // exception_wrapper, return T but throw
  {
    auto f = makeSemiFuture()
                 .defer([](auto &&) -> int { throw eggs; })
                 .deferError([&](exception_wrapper /* e */) -> int {
                   flag();
                   throw eggs;
                 });
    EXPECT_THROW(std::move(f).get(), eggs_t);
    EXPECT_FLAG();
  }

  // const exception_wrapper&
  {
    auto f = makeSemiFuture()
                 .defer([](auto&&) { throw eggs; })
                 .deferError([&](const exception_wrapper& /* e */) { flag(); });
    EXPECT_NO_THROW(std::move(f).get());
    EXPECT_FLAG();
  }
}

TEST(SemiFuture, makePromiseContract) {
  auto c = makePromiseContract<int>();
  c.first.setValue(3);
  c.second = std::move(c.second).deferValue([](int _) { return _ + 1; });
  EXPECT_EQ(4, std::move(c.second).get());
}

TEST(SemiFuture, invokeCallbackWithOriginalCVRef) {
  struct Foo {
    int operator()(int x) & {
      return x + 1;
    }
    int operator()(int x) const& {
      return x + 2;
    }
    int operator()(int x) && {
      return x + 3;
    }
  };

  Foo foo;
  Foo const cfoo;

  // The continuation will be forward-constructed - copied if given as & and
  // moved if given as && - everywhere construction is required.
  // The continuation will be invoked with the same cvref as it is passed.
  EXPECT_EQ(101, makeSemiFuture<int>(100).deferValue(foo).wait().value());
  EXPECT_EQ(202, makeSemiFuture<int>(200).deferValue(cfoo).wait().value());
  EXPECT_EQ(303, makeSemiFuture<int>(300).deferValue(Foo()).wait().value());
}

TEST(SemiFuture, semiFutureWithinCtxCleanedUpWhenTaskFinishedInTime) {
  // Used to track the use_count of callbackInput even outside of its scope
  std::weak_ptr<int> target;
  {
    Promise<std::shared_ptr<int>> promise;
    auto input = std::make_shared<int>(1);
    auto longEnough = std::chrono::milliseconds(1000);

    promise.getSemiFuture()
        .within(longEnough)
        .toUnsafeFuture()
        .then([&target](
                  folly::Try<std::shared_ptr<int>>&& callbackInput) mutable {
          target = callbackInput.value();
        });
    promise.setValue(input);
  }
  // After promise's life cycle is finished, make sure no one is holding the
  // input anymore, in other words, ctx should have been cleaned up.
  EXPECT_EQ(0, target.use_count());
}

TEST(SemiFuture, semiFutureWithinNoValueReferenceWhenTimeOut) {
  Promise<std::shared_ptr<int>> promise;
  auto veryShort = std::chrono::milliseconds(1);

  promise.getSemiFuture().within(veryShort).toUnsafeFuture().then(
      [](folly::Try<std::shared_ptr<int>>&& callbackInput) {
        // Timeout is fired. Verify callbackInput is not referenced
        EXPECT_EQ(0, callbackInput.value().use_count());
      });
}

TEST(SemiFuture, collectAllSemiFutureDeferredWork) {
  {
    Promise<int> promise1;
    Promise<int> promise2;

    auto future = collectAllSemiFuture(
        promise1.getSemiFuture().deferValue([](int x) { return x * 2; }),
        promise2.getSemiFuture().deferValue([](int x) { return x * 2; }));

    promise1.setValue(1);
    promise2.setValue(2);

    auto result = std::move(future).getTry(std::chrono::milliseconds{100});

    EXPECT_TRUE(result.hasValue());

    EXPECT_EQ(2, *std::get<0>(*result));
    EXPECT_EQ(4, *std::get<1>(*result));
  }

  {
    Promise<int> promise1;
    Promise<int> promise2;

    auto future = collectAllSemiFuture(
        promise1.getSemiFuture().deferValue([](int x) { return x * 2; }),
        promise2.getSemiFuture().deferValue([](int x) { return x * 2; }));

    promise1.setValue(1);
    promise2.setValue(2);

    ManualExecutor executor;

    auto value = std::move(future).via(&executor).getVia(&executor);

    EXPECT_EQ(2, *std::get<0>(value));
    EXPECT_EQ(4, *std::get<1>(value));
  }

  {
    Promise<int> promise1;
    Promise<int> promise2;

    std::vector<SemiFuture<int>> futures;
    futures.push_back(
        promise1.getSemiFuture().deferValue([](int x) { return x * 2; }));
    futures.push_back(
        promise2.getSemiFuture().deferValue([](int x) { return x * 2; }));

    auto future = collectAllSemiFuture(futures);

    promise1.setValue(1);
    promise2.setValue(2);

    EXPECT_TRUE(future.wait().isReady());

    auto value = std::move(future).get();
    EXPECT_EQ(2, *value[0]);
    EXPECT_EQ(4, *value[1]);
  }

  {
    bool deferredDestroyed = false;

    {
      Promise<int> promise;
      auto guard = makeGuard([&] { deferredDestroyed = true; });
      collectAllSemiFuture(promise.getSemiFuture().deferValue(
          [guard = std::move(guard)](int x) { return x; }));
    }

    EXPECT_TRUE(deferredDestroyed);
  }
}

TEST(SemiFuture, DeferWithNestedSemiFuture) {
  auto start = std::chrono::steady_clock::now();
  auto future = futures::sleep(std::chrono::milliseconds{100})
                    .semi()
                    .deferValue([](auto&&) {
                      return futures::sleep(std::chrono::milliseconds{200});
                    });
  future.wait();
  EXPECT_TRUE(future.hasValue());
  EXPECT_GE(
      std::chrono::steady_clock::now() - start, std::chrono::milliseconds{300});
}
