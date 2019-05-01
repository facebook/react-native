/*
 * Copyright 2015-present Facebook, Inc.
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
#include <folly/portability/GTest.h>

#include <memory>

using namespace folly;
using std::string;

using std::unique_ptr;
typedef FutureException eggs_t;
static eggs_t eggs("eggs");

TEST(Promise, makeEmpty) {
  auto p = Promise<int>::makeEmpty();
  EXPECT_TRUE(p.isFulfilled());
}

TEST(Promise, special) {
  EXPECT_FALSE(std::is_copy_constructible<Promise<int>>::value);
  EXPECT_FALSE(std::is_copy_assignable<Promise<int>>::value);
  EXPECT_TRUE(std::is_move_constructible<Promise<int>>::value);
  EXPECT_TRUE(std::is_move_assignable<Promise<int>>::value);
}

TEST(Promise, getSemiFuture) {
  Promise<int> p;
  SemiFuture<int> f = p.getSemiFuture();
  EXPECT_FALSE(f.isReady());
}

TEST(Promise, getFuture) {
  Promise<int> p;
  Future<int> f = p.getFuture();
  EXPECT_FALSE(f.isReady());
}

TEST(Promise, setValueUnit) {
  Promise<Unit> p;
  p.setValue();
}

namespace {
auto makeValid() {
  auto valid = Promise<int>();
  EXPECT_TRUE(valid.valid());
  return valid;
}
auto makeInvalid() {
  auto invalid = Promise<int>::makeEmpty();
  EXPECT_FALSE(invalid.valid());
  return invalid;
}
} // namespace

TEST(Promise, ctorPostconditionValid) {
  // Ctors/factories that promise valid -- postcondition: valid()

#define DOIT(CREATION_EXPR)    \
  do {                         \
    auto p1 = (CREATION_EXPR); \
    EXPECT_TRUE(p1.valid());   \
    auto p2 = std::move(p1);   \
    EXPECT_FALSE(p1.valid());  \
    EXPECT_TRUE(p2.valid());   \
  } while (false)

  DOIT(makeValid());
  DOIT(Promise<int>());
  DOIT(Promise<int>{});
  DOIT(Promise<Unit>());
  DOIT(Promise<Unit>{});

#undef DOIT
}

TEST(Promise, ctorPostconditionInvalid) {
  // Ctors/factories that promise invalid -- postcondition: !valid()

#define DOIT(CREATION_EXPR)    \
  do {                         \
    auto p1 = (CREATION_EXPR); \
    EXPECT_FALSE(p1.valid());  \
    auto p2 = std::move(p1);   \
    EXPECT_FALSE(p1.valid());  \
    EXPECT_FALSE(p2.valid());  \
  } while (false)

  DOIT(makeInvalid());
  DOIT(Promise<int>::makeEmpty());

#undef DOIT
}

TEST(Promise, lacksPreconditionValid) {
  // Ops that don't throw PromiseInvalid if !valid() --
  // without precondition: valid()

#define DOIT(STMT)         \
  do {                     \
    auto p = makeValid();  \
    { STMT; }              \
    copy(std::move(p));    \
    EXPECT_NO_THROW(STMT); \
  } while (false)

  // misc methods that don't require isValid()
  DOIT(p.valid());
  DOIT(p.isFulfilled());

  // move-ctor - move-copy to local, copy(), pass-by-move-value
  DOIT(auto other = std::move(p));
  DOIT(copy(std::move(p)));
  DOIT(([](auto) {})(std::move(p)));

  // move-assignment into either {valid | invalid}
  DOIT({
    auto other = makeValid();
    other = std::move(p);
  });
  DOIT({
    auto other = makeInvalid();
    other = std::move(p);
  });

#undef DOIT
}

TEST(Promise, hasPreconditionValid) {
  // Ops that require validity; precondition: valid();
  // throw PromiseInvalid if !valid()

#define DOIT(STMT)                      \
  do {                                  \
    auto p = makeValid();               \
    EXPECT_NO_THROW(STMT);              \
    copy(std::move(p));                 \
    EXPECT_THROW(STMT, PromiseInvalid); \
  } while (false)

  auto const except = std::logic_error("foo");
  auto const ewrap = folly::exception_wrapper(except);

  DOIT(p.getSemiFuture());
  DOIT(p.getFuture());
  DOIT(p.setException(except));
  DOIT(p.setException(ewrap));
  DOIT(p.setInterruptHandler([](auto&) {}));
  DOIT(p.setValue(42));
  DOIT(p.setTry(Try<int>(42)));
  DOIT(p.setTry(Try<int>(ewrap)));
  DOIT(p.setWith([] { return 42; }));

#undef DOIT
}

TEST(Promise, hasPostconditionValid) {
  // Ops that preserve validity -- postcondition: valid()

#define DOIT(STMT)          \
  do {                      \
    auto p = makeValid();   \
    EXPECT_NO_THROW(STMT);  \
    EXPECT_TRUE(p.valid()); \
  } while (false)

  auto const swallow = [](auto) {};

  DOIT(swallow(p.valid())); // p.valid() itself preserves validity
  DOIT(swallow(p.isFulfilled()));

#undef DOIT
}

TEST(Promise, hasPostconditionInvalid) {
  // Ops that consume *this -- postcondition: !valid()

#define DOIT(CTOR, STMT)     \
  do {                       \
    auto p = (CTOR);         \
    EXPECT_NO_THROW(STMT);   \
    EXPECT_FALSE(p.valid()); \
  } while (false)

  // move-ctor of {valid|invalid}
  DOIT(makeValid(), { auto other{std::move(p)}; });
  DOIT(makeInvalid(), { auto other{std::move(p)}; });

  // move-assignment of {valid|invalid} into {valid|invalid}
  DOIT(makeValid(), {
    auto other = makeValid();
    other = std::move(p);
  });
  DOIT(makeValid(), {
    auto other = makeInvalid();
    other = std::move(p);
  });
  DOIT(makeInvalid(), {
    auto other = makeValid();
    other = std::move(p);
  });
  DOIT(makeInvalid(), {
    auto other = makeInvalid();
    other = std::move(p);
  });

  // pass-by-value of {valid|invalid}
  DOIT(makeValid(), {
    auto const byval = [](auto) {};
    byval(std::move(p));
  });
  DOIT(makeInvalid(), {
    auto const byval = [](auto) {};
    byval(std::move(p));
  });

#undef DOIT
}

TEST(Promise, setValueSemiFuture) {
  Promise<int> fund;
  auto ffund = fund.getSemiFuture();
  fund.setValue(42);
  EXPECT_EQ(42, ffund.value());

  struct Foo {
    string name;
    int value;
  };

  Promise<Foo> pod;
  auto fpod = pod.getSemiFuture();
  Foo f = {"the answer", 42};
  pod.setValue(f);
  Foo f2 = fpod.value();
  EXPECT_EQ(f.name, f2.name);
  EXPECT_EQ(f.value, f2.value);

  pod = Promise<Foo>();
  fpod = pod.getSemiFuture();
  pod.setValue(std::move(f2));
  Foo f3 = fpod.value();
  EXPECT_EQ(f.name, f3.name);
  EXPECT_EQ(f.value, f3.value);

  Promise<unique_ptr<int>> mov;
  auto fmov = mov.getSemiFuture();
  mov.setValue(std::make_unique<int>(42));
  unique_ptr<int> ptr = std::move(fmov.value());
  EXPECT_EQ(42, *ptr);

  Promise<Unit> v;
  auto fv = v.getSemiFuture();
  v.setValue();
  EXPECT_TRUE(fv.isReady());
}

TEST(Promise, setValue) {
  Promise<int> fund;
  auto ffund = fund.getFuture();
  fund.setValue(42);
  EXPECT_EQ(42, ffund.value());

  struct Foo {
    string name;
    int value;
  };

  Promise<Foo> pod;
  auto fpod = pod.getFuture();
  Foo f = {"the answer", 42};
  pod.setValue(f);
  Foo f2 = fpod.value();
  EXPECT_EQ(f.name, f2.name);
  EXPECT_EQ(f.value, f2.value);

  pod = Promise<Foo>();
  fpod = pod.getFuture();
  pod.setValue(std::move(f2));
  Foo f3 = fpod.value();
  EXPECT_EQ(f.name, f3.name);
  EXPECT_EQ(f.value, f3.value);

  Promise<unique_ptr<int>> mov;
  auto fmov = mov.getFuture();
  mov.setValue(std::make_unique<int>(42));
  unique_ptr<int> ptr = std::move(fmov.value());
  EXPECT_EQ(42, *ptr);

  Promise<Unit> v;
  auto fv = v.getFuture();
  v.setValue();
  EXPECT_TRUE(fv.isReady());
}

TEST(Promise, setException) {
  {
    Promise<Unit> p;
    auto f = p.getFuture();
    p.setException(eggs);
    EXPECT_THROW(f.value(), eggs_t);
  }
  {
    Promise<Unit> p;
    auto f = p.getFuture();
    p.setException(exception_wrapper(eggs));
    EXPECT_THROW(f.value(), eggs_t);
  }
}

TEST(Promise, setWith) {
  {
    Promise<int> p;
    auto f = p.getFuture();
    p.setWith([] { return 42; });
    EXPECT_EQ(42, f.value());
  }
  {
    Promise<int> p;
    auto f = p.getFuture();
    p.setWith([]() -> int { throw eggs; });
    EXPECT_THROW(f.value(), eggs_t);
  }
}

TEST(Promise, isFulfilled) {
  Promise<int> p;

  EXPECT_FALSE(p.isFulfilled());
  p.setValue(42);
  EXPECT_TRUE(p.isFulfilled());
}

TEST(Promise, isFulfilledWithFuture) {
  Promise<int> p;
  auto f = p.getFuture(); // so core_ will become null

  EXPECT_FALSE(p.isFulfilled());
  p.setValue(42); // after here
  EXPECT_TRUE(p.isFulfilled());
}

TEST(Promise, brokenOnDelete) {
  auto p = std::make_unique<Promise<int>>();
  auto f = p->getFuture();

  EXPECT_FALSE(f.isReady());

  p.reset();

  EXPECT_TRUE(f.isReady());

  auto t = f.getTry();

  EXPECT_TRUE(t.hasException<BrokenPromise>());
}

TEST(Promise, brokenPromiseHasTypeInfo) {
  auto pInt = std::make_unique<Promise<int>>();
  auto fInt = pInt->getFuture();

  auto pFloat = std::make_unique<Promise<float>>();
  auto fFloat = pFloat->getFuture();

  pInt.reset();
  pFloat.reset();

  auto whatInt = fInt.getTry().exception().what();
  auto whatFloat = fFloat.getTry().exception().what();

  EXPECT_NE(whatInt, whatFloat);
}
