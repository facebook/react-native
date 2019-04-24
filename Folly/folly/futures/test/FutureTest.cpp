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

#include <folly/futures/Future.h>
#include <folly/Executor.h>
#include <folly/Memory.h>
#include <folly/Unit.h>
#include <folly/dynamic.h>
#include <folly/executors/ManualExecutor.h>
#include <folly/portability/GTest.h>
#include <folly/synchronization/Baton.h>

#include <algorithm>
#include <atomic>
#include <memory>
#include <numeric>
#include <queue>
#include <string>
#include <thread>
#include <type_traits>

using namespace folly;

#define EXPECT_TYPE(x, T) EXPECT_TRUE((std::is_same<decltype(x), T>::value))

typedef FutureException eggs_t;
static eggs_t eggs("eggs");

// Future

TEST(Future, makeEmpty) {
  auto f = Future<int>::makeEmpty();
  EXPECT_THROW(f.isReady(), FutureInvalid);
}

TEST(Future, futureDefaultCtor) {
  Future<Unit>();
}

TEST(Future, futureToUnit) {
  Future<Unit> fu = makeFuture(42).unit();
  fu.value();
  EXPECT_TRUE(makeFuture<int>(eggs).unit().hasException());
}

TEST(Future, voidFutureToUnit) {
  Future<Unit> fu = makeFuture().unit();
  fu.value();
  EXPECT_TRUE(makeFuture<Unit>(eggs).unit().hasException());
}

TEST(Future, unitFutureToUnitIdentity) {
  Future<Unit> fu = makeFuture(Unit{}).unit();
  fu.value();
  EXPECT_TRUE(makeFuture<Unit>(eggs).unit().hasException());
}

TEST(Future, toUnitWhileInProgress) {
  Promise<int> p;
  Future<Unit> fu = p.getFuture().unit();
  EXPECT_FALSE(fu.isReady());
  p.setValue(42);
  EXPECT_TRUE(fu.isReady());
}

TEST(Future, makeFutureWithUnit) {
  int count = 0;
  Future<Unit> fu = makeFutureWith([&] { count++; });
  EXPECT_EQ(1, count);
}

TEST(Future, getRequiresOnlyMoveCtor) {
  struct MoveCtorOnly {
    explicit MoveCtorOnly(int id) : id_(id) {}
    MoveCtorOnly(const MoveCtorOnly&) = delete;
    MoveCtorOnly(MoveCtorOnly&&) = default;
    void operator=(MoveCtorOnly const&) = delete;
    void operator=(MoveCtorOnly&&) = delete;
    int id_;
  };
  {
    auto f = makeFuture<MoveCtorOnly>(MoveCtorOnly(42));
    EXPECT_TRUE(f.valid());
    EXPECT_TRUE(f.isReady());
    auto v = std::move(f).get();
    EXPECT_EQ(v.id_, 42);
  }
  {
    auto f = makeFuture<MoveCtorOnly>(MoveCtorOnly(42));
    EXPECT_TRUE(f.valid());
    EXPECT_TRUE(f.isReady());
    auto v = std::move(f).get();
    EXPECT_EQ(v.id_, 42);
  }
  {
    auto f = makeFuture<MoveCtorOnly>(MoveCtorOnly(42));
    EXPECT_TRUE(f.valid());
    EXPECT_TRUE(f.isReady());
    auto v = std::move(f).get(std::chrono::milliseconds(10));
    EXPECT_EQ(v.id_, 42);
  }
  {
    auto f = makeFuture<MoveCtorOnly>(MoveCtorOnly(42));
    EXPECT_TRUE(f.valid());
    EXPECT_TRUE(f.isReady());
    auto v = std::move(f).get(std::chrono::milliseconds(10));
    EXPECT_EQ(v.id_, 42);
  }
}

namespace {
auto makeValid() {
  auto valid = makeFuture<int>(42);
  EXPECT_TRUE(valid.valid());
  return valid;
}
auto makeInvalid() {
  auto invalid = Future<int>::makeEmpty();
  EXPECT_FALSE(invalid.valid());
  return invalid;
}
} // namespace

TEST(Future, ctorPostconditionValid) {
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
  DOIT(Future<int>(42));
  DOIT(Future<int>{42});
  DOIT(Future<Unit>());
  DOIT(Future<Unit>{});
  DOIT(makeFuture());
  DOIT(makeFuture(Unit{}));
  DOIT(makeFuture<Unit>(Unit{}));
  DOIT(makeFuture(42));
  DOIT(makeFuture<int>(42));
  DOIT(makeFuture<int>(except));
  DOIT(makeFuture<int>(ewrap));
  DOIT(makeFuture(Try<int>(42)));
  DOIT(makeFuture<int>(Try<int>(42)));
  DOIT(makeFuture<int>(Try<int>(ewrap)));

#undef DOIT
}

TEST(Future, ctorPostconditionInvalid) {
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
  DOIT(Future<int>::makeEmpty());

#undef DOIT
}

TEST(Future, lacksPreconditionValid) {
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

TEST(Future, hasPreconditionValid) {
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
  DOIT(std::move(f).get());
  DOIT(std::move(f).get(std::chrono::milliseconds(10)));
  DOIT(f.getTry());
  DOIT(f.hasValue());
  DOIT(f.hasException());
  DOIT(f.value());
  DOIT(f.poll());
  DOIT(std::move(f).then());
  DOIT(std::move(f).then([](auto&&) {}));

#undef DOIT
}

TEST(Future, hasPostconditionValid) {
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
  DOIT(swallow(f.getTry()));
  DOIT(swallow(f.poll()));
  DOIT(f.raise(std::logic_error("foo")));
  DOIT(f.cancel());
  DOIT(swallow(f.getTry()));
  DOIT(f.wait());
  DOIT(std::move(f.wait()));

#undef DOIT
}

TEST(Future, hasPostconditionInvalid) {
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
  DOIT(makeValid(), swallow(std::move(f).wait()));
  DOIT(makeValid(), swallow(std::move(f.wait())));
  DOIT(makeValid(), swallow(std::move(f).get()));
  DOIT(makeValid(), swallow(std::move(f).get(std::chrono::milliseconds(10))));
  DOIT(makeValid(), swallow(std::move(f).semi()));

#undef DOIT
}

namespace {
Future<int> onErrorHelperEggs(const eggs_t&) {
  return makeFuture(10);
}
Future<int> onErrorHelperGeneric(const std::exception&) {
  return makeFuture(20);
}
Future<int> onErrorHelperWrapper(folly::exception_wrapper&&) {
  return makeFuture(30);
}
} // namespace

TEST(Future, onError) {
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
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](eggs_t& /* e */) { flag(); });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](eggs_t& /* e */) {
                   flag();
                   return makeFuture();
                 });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  // By value
  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](eggs_t /* e */) { flag(); });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](eggs_t /* e */) {
                   flag();
                   return makeFuture();
                 });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  // Polymorphic
  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](std::exception& /* e */) { flag(); });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](std::exception& /* e */) {
                   flag();
                   return makeFuture();
                 });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  // Non-exceptions
  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw - 1; })
                 .onError([&](int /* e */) { flag(); });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw - 1; })
                 .onError([&](int /* e */) {
                   flag();
                   return makeFuture();
                 });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  // Mutable lambda
  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](eggs_t& /* e */) mutable { flag(); });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](eggs_t& /* e */) mutable {
                   flag();
                   return makeFuture();
                 });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  // Function pointer
  {
    auto f = makeFuture()
                 .thenValue([](auto &&) -> int { throw eggs; })
                 .onError(onErrorHelperEggs)
                 .onError(onErrorHelperGeneric);
    EXPECT_EQ(10, f.value());
  }
  {
    auto f =
        makeFuture()
            .thenValue([](auto &&) -> int { throw std::runtime_error("test"); })
            .onError(onErrorHelperEggs)
            .onError(onErrorHelperGeneric);
    EXPECT_EQ(20, f.value());
  }
  {
    auto f =
        makeFuture()
            .thenValue([](auto &&) -> int { throw std::runtime_error("test"); })
            .onError(onErrorHelperEggs);
    EXPECT_THROW(f.value(), std::runtime_error);
  }
  {
    auto f = makeFuture()
                 .thenValue([](auto &&) -> int { throw eggs; })
                 .thenError<eggs_t>(onErrorHelperEggs)
                 .thenError<std::exception>(onErrorHelperGeneric);
    EXPECT_EQ(10, f.value());
  }
  {
    auto f =
        makeFuture()
            .thenValue([](auto &&) -> int { throw std::runtime_error("test"); })
            .thenError<eggs_t>(onErrorHelperEggs)
            .thenError(onErrorHelperWrapper);
    EXPECT_EQ(30, f.value());
  }
  {
    auto f =
        makeFuture()
            .thenValue([](auto &&) -> int { throw std::runtime_error("test"); })
            .thenError<eggs_t>(onErrorHelperEggs);
    EXPECT_THROW(f.value(), std::runtime_error);
  }

  // No throw
  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { return 42; })
                 .onError([&](eggs_t& /* e */) {
                   flag();
                   return -1;
                 });
    EXPECT_NO_FLAG();
    EXPECT_EQ(42, f.value());
  }

  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { return 42; })
                 .onError([&](eggs_t& /* e */) {
                   flag();
                   return makeFuture<int>(-1);
                 });
    EXPECT_NO_FLAG();
    EXPECT_EQ(42, f.value());
  }

  // Catch different exception
  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](std::runtime_error& /* e */) { flag(); });
    EXPECT_NO_FLAG();
    EXPECT_THROW(f.value(), eggs_t);
  }

  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](std::runtime_error& /* e */) {
                   flag();
                   return makeFuture();
                 });
    EXPECT_NO_FLAG();
    EXPECT_THROW(f.value(), eggs_t);
  }

  // Returned value propagates
  {
    auto f = makeFuture()
                 .thenValue([](auto &&) -> int { throw eggs; })
                 .onError([&](eggs_t& /* e */) { return 42; });
    EXPECT_EQ(42, f.value());
  }

  // Returned future propagates
  {
    auto f = makeFuture()
                 .thenValue([](auto &&) -> int { throw eggs; })
                 .onError([&](eggs_t& /* e */) { return makeFuture<int>(42); });
    EXPECT_EQ(42, f.value());
  }

  // Throw in callback
  {
    auto f = makeFuture()
                 .thenValue([](auto &&) -> int { throw eggs; })
                 .onError([&](eggs_t& e) -> int { throw e; });
    EXPECT_THROW(f.value(), eggs_t);
  }

  {
    auto f = makeFuture()
                 .thenValue([](auto &&) -> int { throw eggs; })
                 .onError([&](eggs_t& e) -> Future<int> { throw e; });
    EXPECT_THROW(f.value(), eggs_t);
  }

  // exception_wrapper, return Future<T>
  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](exception_wrapper /* e */) {
                   flag();
                   return makeFuture();
                 });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  // exception_wrapper, return Future<T> but throw
  {
    auto f = makeFuture()
                 .thenValue([](auto &&) -> int { throw eggs; })
                 .onError([&](exception_wrapper /* e */) -> Future<int> {
                   flag();
                   throw eggs;
                 });
    EXPECT_FLAG();
    EXPECT_THROW(f.value(), eggs_t);
  }

  // exception_wrapper, return T
  {
    auto f = makeFuture()
                 .thenValue([](auto &&) -> int { throw eggs; })
                 .onError([&](exception_wrapper /* e */) {
                   flag();
                   return -1;
                 });
    EXPECT_FLAG();
    EXPECT_EQ(-1, f.value());
  }

  // exception_wrapper, return T but throw
  {
    auto f = makeFuture()
                 .thenValue([](auto &&) -> int { throw eggs; })
                 .onError([&](exception_wrapper /* e */) -> int {
                   flag();
                   throw eggs;
                 });
    EXPECT_FLAG();
    EXPECT_THROW(f.value(), eggs_t);
  }

  // const exception_wrapper&
  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](const exception_wrapper& /* e */) {
                   flag();
                   return makeFuture();
                 });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }
#undef EXPECT_FLAG
#undef EXPECT_NO_FLAG
}

TEST(Future, thenError) {
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
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .thenError<eggs_t>([&](const eggs_t& /* e */) { flag(); });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  // By auto reference
  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .thenError<eggs_t>([&](auto const& /* e */) { flag(); });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](eggs_t& /* e */) {
                   flag();
                   return makeFuture();
                 });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  // By value
  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](eggs_t /* e */) { flag(); });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](eggs_t /* e */) {
                   flag();
                   return makeFuture();
                 });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  // Polymorphic
  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](std::exception& /* e */) { flag(); });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](std::exception& /* e */) {
                   flag();
                   return makeFuture();
                 });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  // Non-exceptions
  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw - 1; })
                 .onError([&](int /* e */) { flag(); });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw - 1; })
                 .onError([&](int /* e */) {
                   flag();
                   return makeFuture();
                 });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  // Mutable lambda
  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](eggs_t& /* e */) mutable { flag(); });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](eggs_t& /* e */) mutable {
                   flag();
                   return makeFuture();
                 });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  // Function pointer
  {
    auto f = makeFuture()
                 .thenValue([](auto &&) -> int { throw eggs; })
                 .onError(onErrorHelperEggs)
                 .onError(onErrorHelperGeneric);
    EXPECT_EQ(10, f.value());
  }
  {
    auto f =
        makeFuture()
            .thenValue([](auto &&) -> int { throw std::runtime_error("test"); })
            .onError(onErrorHelperEggs)
            .onError(onErrorHelperGeneric);
    EXPECT_EQ(20, f.value());
  }
  {
    auto f =
        makeFuture()
            .thenValue([](auto &&) -> int { throw std::runtime_error("test"); })
            .onError(onErrorHelperEggs);
    EXPECT_THROW(f.value(), std::runtime_error);
  }

  // No throw
  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { return 42; })
                 .onError([&](eggs_t& /* e */) {
                   flag();
                   return -1;
                 });
    EXPECT_NO_FLAG();
    EXPECT_EQ(42, f.value());
  }

  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { return 42; })
                 .onError([&](eggs_t& /* e */) {
                   flag();
                   return makeFuture<int>(-1);
                 });
    EXPECT_NO_FLAG();
    EXPECT_EQ(42, f.value());
  }

  // Catch different exception
  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](std::runtime_error& /* e */) { flag(); });
    EXPECT_NO_FLAG();
    EXPECT_THROW(f.value(), eggs_t);
  }

  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](std::runtime_error& /* e */) {
                   flag();
                   return makeFuture();
                 });
    EXPECT_NO_FLAG();
    EXPECT_THROW(f.value(), eggs_t);
  }

  // Returned value propagates
  {
    auto f = makeFuture()
                 .thenValue([](auto &&) -> int { throw eggs; })
                 .onError([&](eggs_t& /* e */) { return 42; });
    EXPECT_EQ(42, f.value());
  }

  // Returned future propagates
  {
    auto f = makeFuture()
                 .thenValue([](auto &&) -> int { throw eggs; })
                 .onError([&](eggs_t& /* e */) { return makeFuture<int>(42); });
    EXPECT_EQ(42, f.value());
  }

  // Throw in callback
  {
    auto f = makeFuture()
                 .thenValue([](auto &&) -> int { throw eggs; })
                 .onError([&](eggs_t& e) -> int { throw e; });
    EXPECT_THROW(f.value(), eggs_t);
  }

  {
    auto f = makeFuture()
                 .thenValue([](auto &&) -> int { throw eggs; })
                 .onError([&](eggs_t& e) -> Future<int> { throw e; });
    EXPECT_THROW(f.value(), eggs_t);
  }

  // exception_wrapper, return Future<T>
  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](exception_wrapper /* e */) {
                   flag();
                   return makeFuture();
                 });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }

  // exception_wrapper, return Future<T> but throw
  {
    auto f = makeFuture()
                 .thenValue([](auto &&) -> int { throw eggs; })
                 .onError([&](exception_wrapper /* e */) -> Future<int> {
                   flag();
                   throw eggs;
                 });
    EXPECT_FLAG();
    EXPECT_THROW(f.value(), eggs_t);
  }

  // exception_wrapper, return T
  {
    auto f = makeFuture()
                 .thenValue([](auto &&) -> int { throw eggs; })
                 .onError([&](exception_wrapper /* e */) {
                   flag();
                   return -1;
                 });
    EXPECT_FLAG();
    EXPECT_EQ(-1, f.value());
  }

  // exception_wrapper, return T but throw
  {
    auto f = makeFuture()
                 .thenValue([](auto &&) -> int { throw eggs; })
                 .onError([&](exception_wrapper /* e */) -> int {
                   flag();
                   throw eggs;
                 });
    EXPECT_FLAG();
    EXPECT_THROW(f.value(), eggs_t);
  }

  // const exception_wrapper&
  {
    auto f = makeFuture()
                 .thenValue([](auto&&) { throw eggs; })
                 .onError([&](const exception_wrapper& /* e */) {
                   flag();
                   return makeFuture();
                 });
    EXPECT_FLAG();
    EXPECT_NO_THROW(f.value());
  }
#undef EXPECT_FLAG
#undef EXPECT_NO_FLAG
}

TEST(Future, special) {
  EXPECT_FALSE(std::is_copy_constructible<Future<int>>::value);
  EXPECT_FALSE(std::is_copy_assignable<Future<int>>::value);
  EXPECT_TRUE(std::is_move_constructible<Future<int>>::value);
  EXPECT_TRUE(std::is_move_assignable<Future<int>>::value);
}

TEST(Future, then) {
  auto f =
      makeFuture<std::string>("0")
          .thenValue([](auto&&) { return makeFuture<std::string>("1"); })
          .then(
              [](Try<std::string>&& t) { return makeFuture(t.value() + ";2"); })
          .then([](const Try<std::string>&& t) {
            return makeFuture(t.value() + ";3");
          })
          .then([](const Try<std::string>& t) {
            return makeFuture(t.value() + ";4");
          })
          .then([](Try<std::string> t) { return makeFuture(t.value() + ";5"); })
          .then([](const Try<std::string> t) {
            return makeFuture(t.value() + ";6");
          })
          .then([](std::string&& s) { return makeFuture(s + ";7"); })
          .then([](const std::string&& s) { return makeFuture(s + ";8"); })
          .then([](const std::string& s) { return makeFuture(s + ";9"); })
          .then([](std::string s) { return makeFuture(s + ";10"); })
          .then([](const std::string s) { return makeFuture(s + ";11"); });
  EXPECT_EQ(f.value(), "1;2;3;4;5;6;7;8;9;10;11");
}

static folly::Future<std::string> doWorkStaticTry(Try<std::string>&& t) {
  return makeFuture(t.value() + ";7");
}

TEST(Future, thenTrythenValue) {
  auto f =
      makeFuture()
          .thenTry([](auto&&) { return makeFuture<std::string>("1"); })
          .thenTry(
              [](Try<std::string>&& t) { return makeFuture(t.value() + ";2"); })
          .thenTry([](const Try<std::string>&& t) {
            return makeFuture(t.value() + ";3");
          })
          .thenTry([](const Try<std::string>& t) {
            return makeFuture(t.value() + ";4");
          })
          .thenTry(
              [](Try<std::string> t) { return makeFuture(t.value() + ";5"); })
          .thenTry([](const Try<std::string> t) {
            return makeFuture(t.value() + ";6");
          })
          .thenTry(doWorkStaticTry)
          .thenValue([](std::string&& s) { return makeFuture(s + ";8"); })
          .thenValue([](const std::string&& s) { return makeFuture(s + ";9"); })
          .thenValue([](const std::string& s) { return makeFuture(s + ";10"); })
          .thenValue([](std::string s) { return makeFuture(s + ";11"); })
          .thenValue([](const std::string s) { return makeFuture(s + ";12"); });
  EXPECT_EQ(f.value(), "1;2;3;4;5;6;7;8;9;10;11;12");
}

TEST(Future, thenTry) {
  bool flag = false;

  makeFuture<int>(42).then([&](Try<int>&& t) {
    flag = true;
    EXPECT_EQ(42, t.value());
  });
  EXPECT_TRUE(flag);
  flag = false;

  makeFuture<int>(42)
      .then([](Try<int>&& t) { return t.value(); })
      .then([&](Try<int>&& t) {
        flag = true;
        EXPECT_EQ(42, t.value());
      });
  EXPECT_TRUE(flag);
  flag = false;

  makeFuture().then([&](Try<Unit>&& t) {
    flag = true;
    t.value();
  });
  EXPECT_TRUE(flag);
  flag = false;

  Promise<Unit> p;
  auto f = p.getFuture().then([&](Try<Unit>&& /* t */) { flag = true; });
  EXPECT_FALSE(flag);
  EXPECT_FALSE(f.isReady());
  p.setValue();
  EXPECT_TRUE(flag);
  EXPECT_TRUE(f.isReady());
}

TEST(Future, thenValue) {
  bool flag = false;
  makeFuture<int>(42).then([&](int i) {
    EXPECT_EQ(42, i);
    flag = true;
  });
  EXPECT_TRUE(flag);
  flag = false;

  makeFuture<int>(42).then([](int i) { return i; }).then([&](int i) {
    flag = true;
    EXPECT_EQ(42, i);
  });
  EXPECT_TRUE(flag);
  flag = false;

  makeFuture().thenValue([&](auto&&) { flag = true; });
  EXPECT_TRUE(flag);
  flag = false;

  auto f = makeFuture<int>(eggs).thenValue([&](int /* i */) {});
  EXPECT_THROW(f.value(), eggs_t);

  f = makeFuture<Unit>(eggs).thenValue([&](auto&&) {});
  EXPECT_THROW(f.value(), eggs_t);
}

TEST(Future, thenValueFuture) {
  bool flag = false;
  makeFuture<int>(42)
      .then([](int i) { return makeFuture<int>(std::move(i)); })
      .then([&](Try<int>&& t) {
        flag = true;
        EXPECT_EQ(42, t.value());
      });
  EXPECT_TRUE(flag);
  flag = false;

  makeFuture()
      .thenValue([](auto&&) { return makeFuture(); })
      .then([&](Try<Unit>&& /* t */) { flag = true; });
  EXPECT_TRUE(flag);
  flag = false;
}

static std::string doWorkStatic(Try<std::string>&& t) {
  return t.value() + ";static";
}

static std::string doWorkStaticValue(std::string&& t) {
  return t + ";value";
}

TEST(Future, thenFunction) {
  struct Worker {
    std::string doWork(Try<std::string>&& t) {
      return t.value() + ";class";
    }
    static std::string doWorkStatic(Try<std::string>&& t) {
      return t.value() + ";class-static";
    }
  } w;

  auto f = makeFuture<std::string>("start")
               .then(doWorkStatic)
               .then(Worker::doWorkStatic)
               .then(&Worker::doWork, &w)
               .then(doWorkStaticValue)
               .thenValue(doWorkStaticValue);

  EXPECT_EQ(f.value(), "start;static;class-static;class;value;value");
}

static Future<std::string> doWorkStaticFuture(Try<std::string>&& t) {
  return makeFuture(t.value() + ";static");
}

TEST(Future, thenFunctionFuture) {
  struct Worker {
    Future<std::string> doWorkFuture(Try<std::string>&& t) {
      return makeFuture(t.value() + ";class");
    }
    static Future<std::string> doWorkStaticFuture(Try<std::string>&& t) {
      return makeFuture(t.value() + ";class-static");
    }
  } w;

  auto f = makeFuture<std::string>("start")
               .then(doWorkStaticFuture)
               .then(Worker::doWorkStaticFuture)
               .then(&Worker::doWorkFuture, &w);

  EXPECT_EQ(f.value(), "start;static;class-static;class");
}

TEST(Future, thenStdFunction) {
  {
    std::function<int(folly::Unit)> fn = [](folly::Unit) { return 42; };
    auto f = makeFuture().then(std::move(fn));
    EXPECT_EQ(f.value(), 42);
  }
  {
    std::function<int(int)> fn = [](int i) { return i + 23; };
    auto f = makeFuture(19).then(std::move(fn));
    EXPECT_EQ(f.value(), 42);
  }
  {
    std::function<int(int)> fn = [](int i) { return i + 23; };
    auto f = makeFuture(19).thenValue(std::move(fn));
    EXPECT_EQ(f.value(), 42);
  }
  {
    std::function<int(Try<int>)> fn = [](Try<int> t) { return t.value() + 2; };
    auto f = makeFuture(1).then(std::move(fn));
    EXPECT_EQ(f.value(), 3);
  }
  {
    bool flag = false;
    std::function<void(folly::Unit)> fn = [&flag](folly::Unit) { flag = true; };
    auto f = makeFuture().then(std::move(fn));
    EXPECT_TRUE(f.isReady());
    EXPECT_TRUE(flag);
  }
}

TEST(Future, thenBind) {
  auto l = [](folly::Unit) { return makeFuture("bind"); };
  auto b = std::bind(l, std::placeholders::_1);
  auto f = makeFuture().thenValue(std::move(b));
  EXPECT_EQ(f.value(), "bind");
}

TEST(Future, thenBindTry) {
  auto l = [](Try<std::string>&& t) { return makeFuture(t.value() + ";bind"); };
  auto b = std::bind(l, std::placeholders::_1);
  auto f = makeFuture<std::string>("start").then(std::move(b));

  EXPECT_EQ(f.value(), "start;bind");
}

TEST(Future, value) {
  auto f = makeFuture(std::make_unique<int>(42));
  auto up = std::move(f.value());
  EXPECT_EQ(42, *up);

  EXPECT_THROW(makeFuture<int>(eggs).value(), eggs_t);
}

TEST(Future, isReady) {
  Promise<int> p;
  auto f = p.getFuture();
  EXPECT_FALSE(f.isReady());
  p.setValue(42);
  EXPECT_TRUE(f.isReady());
}

TEST(Future, futureNotReady) {
  Promise<int> p;
  Future<int> f = p.getFuture();
  EXPECT_THROW(f.value(), eggs_t);
}

TEST(Future, hasException) {
  EXPECT_TRUE(makeFuture<int>(eggs).getTry().hasException());
  EXPECT_FALSE(makeFuture(42).getTry().hasException());
}

TEST(Future, hasValue) {
  EXPECT_TRUE(makeFuture(42).getTry().hasValue());
  EXPECT_FALSE(makeFuture<int>(eggs).getTry().hasValue());
}

TEST(Future, makeFuture) {
  EXPECT_TYPE(makeFuture(42), Future<int>);
  EXPECT_EQ(42, makeFuture(42).value());

  EXPECT_TYPE(makeFuture<float>(42), Future<float>);
  EXPECT_EQ(42, makeFuture<float>(42).value());

  auto fun = [] { return 42; };
  EXPECT_TYPE(makeFutureWith(fun), Future<int>);
  EXPECT_EQ(42, makeFutureWith(fun).value());

  auto funf = [] { return makeFuture<int>(43); };
  EXPECT_TYPE(makeFutureWith(funf), Future<int>);
  EXPECT_EQ(43, makeFutureWith(funf).value());

  auto failfun = []() -> int { throw eggs; };
  EXPECT_TYPE(makeFutureWith(failfun), Future<int>);
  EXPECT_NO_THROW(makeFutureWith(failfun));
  EXPECT_THROW(makeFutureWith(failfun).value(), eggs_t);

  auto failfunf = []() -> Future<int> { throw eggs; };
  EXPECT_TYPE(makeFutureWith(failfunf), Future<int>);
  EXPECT_NO_THROW(makeFutureWith(failfunf));
  EXPECT_THROW(makeFutureWith(failfunf).value(), eggs_t);

  EXPECT_TYPE(makeFuture(), Future<Unit>);
}

TEST(Future, finish) {
  auto x = std::make_shared<int>(0);

  Promise<int> p;
  auto f = p.getFuture().then([x](Try<int>&& t) { *x = t.value(); });

  // The callback hasn't executed
  EXPECT_EQ(0, *x);

  // The callback has a reference to x
  EXPECT_EQ(2, x.use_count());

  p.setValue(42);

  // the callback has executed
  EXPECT_EQ(42, *x);

  // the callback has been destructed
  // and has released its reference to x
  EXPECT_EQ(1, x.use_count());
}

TEST(Future, finishBigLambda) {
  auto x = std::make_shared<int>(0);

  // bulk_data, to be captured in the lambda passed to Future::then.
  // This is meant to force that the lambda can't be stored inside
  // the Future object.
  std::array<char, sizeof(futures::detail::Core<int>)> bulk_data = {{0}};

  // suppress gcc warning about bulk_data not being used
  EXPECT_EQ(bulk_data[0], 0);

  Promise<int> p;
  auto f = p.getFuture().then([x, bulk_data](Try<int>&& t) {
    (void)bulk_data;
    *x = t.value();
  });

  // The callback hasn't executed
  EXPECT_EQ(0, *x);

  // The callback has a reference to x
  EXPECT_EQ(2, x.use_count());

  p.setValue(42);

  // the callback has executed
  EXPECT_EQ(42, *x);

  // the callback has been destructed
  // and has released its reference to x
  EXPECT_EQ(1, x.use_count());
}

TEST(Future, unwrap) {
  Promise<int> a;
  Promise<int> b;

  auto fa = a.getFuture();
  auto fb = b.getFuture();

  bool flag1 = false;
  bool flag2 = false;

  // do a, then do b, and get the result of a + b.
  Future<int> f = std::move(fa).then([&](Try<int>&& ta) {
    auto va = ta.value();
    flag1 = true;
    return std::move(fb).then([va, &flag2](Try<int>&& tb) {
      flag2 = true;
      return va + tb.value();
    });
  });

  EXPECT_FALSE(flag1);
  EXPECT_FALSE(flag2);
  EXPECT_FALSE(f.isReady());

  a.setValue(3);
  EXPECT_TRUE(flag1);
  EXPECT_FALSE(flag2);
  EXPECT_FALSE(f.isReady());

  b.setValue(4);
  EXPECT_TRUE(flag1);
  EXPECT_TRUE(flag2);
  EXPECT_EQ(7, f.value());
}

TEST(Future, throwCaughtInImmediateThen) {
  // Neither of these should throw "Promise already satisfied"
  makeFuture().then([=](Try<Unit> &&) -> int { throw std::exception(); });
  makeFuture().then(
      [=](Try<Unit> &&) -> Future<int> { throw std::exception(); });
}

TEST(Future, throwIfFailed) {
  makeFuture<Unit>(eggs).then(
      [=](Try<Unit>&& t) { EXPECT_THROW(t.throwIfFailed(), eggs_t); });
  makeFuture().then([=](Try<Unit>&& t) { EXPECT_NO_THROW(t.throwIfFailed()); });

  makeFuture<int>(eggs).then(
      [=](Try<int>&& t) { EXPECT_THROW(t.throwIfFailed(), eggs_t); });
  makeFuture<int>(42).then(
      [=](Try<int>&& t) { EXPECT_NO_THROW(t.throwIfFailed()); });
}

TEST(Future, getFutureAfterSetValue) {
  Promise<int> p;
  p.setValue(42);
  EXPECT_EQ(42, p.getFuture().value());
}

TEST(Future, getFutureAfterSetException) {
  Promise<Unit> p;
  p.setWith([]() -> void { throw std::logic_error("foo"); });
  EXPECT_THROW(p.getFuture().value(), std::logic_error);
}

TEST(Future, detachRace) {
  // Task #5438209
  // This test is designed to detect a race that was in Core::detachOne()
  // where detached_ was incremented and then tested, and that
  // allowed a race where both Promise and Future would think they were the
  // second and both try to delete. This showed up at scale but was very
  // difficult to reliably repro in a test. As it is, this only fails about
  // once in every 1,000 executions. Doing this 1,000 times is going to make a
  // slow test so I won't do that but if it ever fails, take it seriously, and
  // run the test binary with "--gtest_repeat=10000 --gtest_filter=*detachRace"
  // (Don't forget to enable ASAN)
  auto p = std::make_unique<Promise<bool>>();
  auto f = std::make_unique<Future<bool>>(p->getFuture());
  folly::Baton<> baton;
  std::thread t1([&] {
    baton.post();
    p.reset();
  });
  baton.wait();
  f.reset();
  t1.join();
}

// Test of handling of a circular dependency. It's never recommended
// to have one because of possible memory leaks. Here we test that
// we can handle freeing of the Future while it is running.
TEST(Future, CircularDependencySharedPtrSelfReset) {
  Promise<int64_t> promise;
  auto ptr = std::make_shared<Future<int64_t>>(promise.getFuture());

  std::move(*ptr).thenTry([ptr](folly::Try<int64_t>&& /* uid */) mutable {
    EXPECT_EQ(1, ptr.use_count());

    // Leaving no references to ourselves.
    ptr.reset();
    EXPECT_EQ(0, ptr.use_count());
  });

  EXPECT_EQ(2, ptr.use_count());

  ptr.reset();

  promise.setValue(1);
}

TEST(Future, Constructor) {
  auto f1 = []() -> Future<int> { return Future<int>(3); }();
  EXPECT_EQ(f1.value(), 3);
  auto f2 = []() -> Future<Unit> { return Future<Unit>(); }();
  EXPECT_NO_THROW(f2.value());
}

TEST(Future, ImplicitConstructor) {
  auto f1 = []() -> Future<int> { return 3; }();
  EXPECT_EQ(f1.value(), 3);
  // Unfortunately, the C++ standard does not allow the
  // following implicit conversion to work:
  // auto f2 = []() -> Future<Unit> { }();
}

TEST(Future, InPlaceConstructor) {
  auto f = Future<std::pair<int, double>>(in_place, 5, 3.2);
  EXPECT_EQ(5, f.value().first);
}

TEST(Future, thenDynamic) {
  // folly::dynamic has a constructor that takes any T, this test makes
  // sure that we call the then lambda with folly::dynamic and not
  // Try<folly::dynamic> because that then fails to compile
  Promise<folly::dynamic> p;
  Future<folly::dynamic> f = p.getFuture().then(
      [](const folly::dynamic& d) { return folly::dynamic(d.asInt() + 3); });
  p.setValue(2);
  EXPECT_EQ(std::move(f).get(), 5);
}

TEST(Future, RequestContext) {
  class NewThreadExecutor : public Executor {
   public:
    ~NewThreadExecutor() override {
      std::for_each(v_.begin(), v_.end(), [](std::thread& t) { t.join(); });
    }
    void add(Func f) override {
      if (throwsOnAdd_) {
        throw std::exception();
      }
      v_.emplace_back(std::move(f));
    }
    void addWithPriority(Func f, int8_t /* prio */) override {
      add(std::move(f));
    }
    uint8_t getNumPriorities() const override {
      return numPriorities_;
    }

    void setHandlesPriorities() {
      numPriorities_ = 2;
    }
    void setThrowsOnAdd() {
      throwsOnAdd_ = true;
    }

   private:
    std::vector<std::thread> v_;
    uint8_t numPriorities_ = 1;
    bool throwsOnAdd_ = false;
  };

  struct MyRequestData : RequestData {
    MyRequestData(bool value_ = false) : value(value_) {}

    bool hasCallback() override {
      return false;
    }

    bool value;
  };

  Promise<int> p1, p2;
  NewThreadExecutor e;
  {
    folly::RequestContextScopeGuard rctx;
    RequestContext::get()->setContextData(
        "key", std::make_unique<MyRequestData>(true));
    auto checker = [](int lineno) {
      return [lineno](Try<int>&& /* t */) {
        auto d = static_cast<MyRequestData*>(
            RequestContext::get()->getContextData("key"));
        EXPECT_TRUE(d && d->value) << "on line " << lineno;
      };
    };

    makeFuture(1).via(&e).then(checker(__LINE__));

    e.setHandlesPriorities();
    makeFuture(2).via(&e).then(checker(__LINE__));

    p1.getFuture().then(checker(__LINE__));

    e.setThrowsOnAdd();
    p2.getFuture().via(&e).then(checker(__LINE__));
  }
  // Assert that no RequestContext is set
  EXPECT_FALSE(RequestContext::saveContext());
  p1.setValue(3);
  p2.setValue(4);
}

TEST(Future, makeFutureNoThrow) {
  makeFuture().value();
}

TEST(Future, invokeCallbackReturningValueAsRvalue) {
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
  EXPECT_EQ(101, makeFuture<int>(100).then(foo).value());
  EXPECT_EQ(202, makeFuture<int>(200).then(cfoo).value());
  EXPECT_EQ(303, makeFuture<int>(300).then(Foo()).value());
}

TEST(Future, invokeCallbackReturningFutureAsRvalue) {
  struct Foo {
    Future<int> operator()(int x) & {
      return x + 1;
    }
    Future<int> operator()(int x) const& {
      return x + 2;
    }
    Future<int> operator()(int x) && {
      return x + 3;
    }
  };

  Foo foo;
  Foo const cfoo;

  // The continuation will be forward-constructed - copied if given as & and
  // moved if given as && - everywhere construction is required.
  // The continuation will be invoked with the same cvref as it is passed.
  EXPECT_EQ(101, makeFuture<int>(100).then(foo).value());
  EXPECT_EQ(202, makeFuture<int>(200).then(cfoo).value());
  EXPECT_EQ(303, makeFuture<int>(300).then(Foo()).value());

  EXPECT_EQ(101, makeFuture<int>(100).thenValue(foo).value());
  EXPECT_EQ(202, makeFuture<int>(200).thenValue(cfoo).value());
  EXPECT_EQ(303, makeFuture<int>(300).thenValue(Foo()).value());
}

TEST(Future, futureWithinCtxCleanedUpWhenTaskFinishedInTime) {
  // Used to track the use_count of callbackInput even outside of its scope
  std::weak_ptr<int> target;
  {
    Promise<std::shared_ptr<int>> promise;
    auto input = std::make_shared<int>(1);
    auto longEnough = std::chrono::milliseconds(1000);

    promise.getFuture()
        .within(longEnough)
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

TEST(Future, futureWithinNoValueReferenceWhenTimeOut) {
  Promise<std::shared_ptr<int>> promise;
  auto veryShort = std::chrono::milliseconds(1);

  promise.getFuture().within(veryShort).then(
      [](folly::Try<std::shared_ptr<int>>&& callbackInput) {
        // Timeout is fired. Verify callbackInput is not referenced
        EXPECT_EQ(0, callbackInput.value().use_count());
      });
}

TEST(Future, makePromiseContract) {
  class ManualExecutor : public Executor {
   private:
    std::queue<Func> queue_;

   public:
    void add(Func f) override {
      queue_.push(std::move(f));
    }
    void drain() {
      while (!queue_.empty()) {
        auto f = std::move(queue_.front());
        queue_.pop();
        f();
      }
    }
  };

  ManualExecutor e;
  auto c = makePromiseContract<int>(&e);
  c.second = std::move(c.second).then([](int _) { return _ + 1; });
  EXPECT_FALSE(c.second.isReady());
  c.first.setValue(3);
  EXPECT_FALSE(c.second.isReady());
  e.drain();
  ASSERT_TRUE(c.second.isReady());
  EXPECT_EQ(4, std::move(c.second).get());
}

Future<int> call(int depth) {
  return makeFuture(depth == 0 ? 42 : 0);
}

Future<int> recursion(Executor* executor, int depth) {
  return call(depth).then(executor, [=](int result) {
    if (result) {
      return folly::makeFuture(result);
    }

    return recursion(executor, depth - 1);
  });
}

TEST(Future, ThenRecursion) {
  ManualExecutor executor;

  EXPECT_EQ(42, recursion(&executor, 100000).getVia(&executor));
}
