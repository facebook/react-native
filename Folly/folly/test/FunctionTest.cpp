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

#include <array>
#include <cstdarg>

#include <folly/Function.h>

#include <folly/Memory.h>
#include <folly/portability/GTest.h>

using folly::Function;

namespace {
int func_int_int_add_25(int x) {
  return x + 25;
}
int func_int_int_add_111(int x) {
  return x + 111;
}
float floatMult(float a, float b) {
  return a * b;
}

template <class T, size_t S>
struct Functor {
  std::array<T, S> data = {{0}};

  // Two operator() with different argument types.
  // The InvokeReference tests use both
  T const& operator()(size_t index) const {
    return data[index];
  }
  T operator()(size_t index, T const& value) {
    T oldvalue = data[index];
    data[index] = value;
    return oldvalue;
  }
};

template <typename Ret, typename... Args>
void deduceArgs(Function<Ret(Args...)>) {}

struct CallableButNotCopyable {
  CallableButNotCopyable() {}
  CallableButNotCopyable(CallableButNotCopyable const&) = delete;
  CallableButNotCopyable(CallableButNotCopyable&&) = delete;
  CallableButNotCopyable& operator=(CallableButNotCopyable const&) = delete;
  CallableButNotCopyable& operator=(CallableButNotCopyable&&) = delete;
  template <class... Args>
  void operator()(Args&&...) const {}
};

} // namespace

// TEST =====================================================================
// Test constructibility and non-constructibility for some tricky conversions
static_assert(
    !std::is_assignable<Function<void()>, CallableButNotCopyable>::value,
    "");
static_assert(
    !std::is_constructible<Function<void()>, CallableButNotCopyable&>::value,
    "");
static_assert(
    !std::is_constructible<Function<void() const>, CallableButNotCopyable>::
        value,
    "");
static_assert(
    !std::is_constructible<Function<void() const>, CallableButNotCopyable&>::
        value,
    "");

static_assert(
    !std::is_assignable<Function<void()>, CallableButNotCopyable>::value,
    "");
static_assert(
    !std::is_assignable<Function<void()>, CallableButNotCopyable&>::value,
    "");
static_assert(
    !std::is_assignable<Function<void() const>, CallableButNotCopyable>::value,
    "");
static_assert(
    !std::is_assignable<Function<void() const>, CallableButNotCopyable&>::value,
    "");

static_assert(
    std::is_constructible<Function<int(int)>, Function<int(int) const>>::value,
    "");
static_assert(
    !std::is_constructible<Function<int(int) const>, Function<int(int)>>::value,
    "");
static_assert(
    std::is_constructible<Function<int(short)>, Function<short(int) const>>::
        value,
    "");
static_assert(
    !std::is_constructible<Function<int(short) const>, Function<short(int)>>::
        value,
    "");
static_assert(
    !std::is_constructible<Function<int(int)>, Function<int(int) const>&>::
        value,
    "");
static_assert(
    !std::is_constructible<Function<int(int) const>, Function<int(int)>&>::
        value,
    "");
static_assert(
    !std::is_constructible<Function<int(short)>, Function<short(int) const>&>::
        value,
    "");
static_assert(
    !std::is_constructible<Function<int(short) const>, Function<short(int)>&>::
        value,
    "");

static_assert(
    std::is_assignable<Function<int(int)>, Function<int(int) const>>::value,
    "");
static_assert(
    !std::is_assignable<Function<int(int) const>, Function<int(int)>>::value,
    "");
static_assert(
    std::is_assignable<Function<int(short)>, Function<short(int) const>>::value,
    "");
static_assert(
    !std::is_assignable<Function<int(short) const>, Function<short(int)>>::
        value,
    "");
static_assert(
    !std::is_assignable<Function<int(int)>, Function<int(int) const>&>::value,
    "");
static_assert(
    !std::is_assignable<Function<int(int) const>, Function<int(int)>&>::value,
    "");
static_assert(
    !std::is_assignable<Function<int(short)>, Function<short(int) const>&>::
        value,
    "");
static_assert(
    !std::is_assignable<Function<int(short) const>, Function<short(int)>&>::
        value,
    "");

static_assert(
    std::is_nothrow_constructible<
        Function<int(int)>,
        Function<int(int) const>>::value,
    "");
static_assert(
    !std::is_nothrow_constructible<
        Function<int(short)>,
        Function<short(int) const>>::value,
    "");
static_assert(
    std::is_nothrow_assignable<Function<int(int)>, Function<int(int) const>>::
        value,
    "");
static_assert(
    !std::is_nothrow_assignable<
        Function<int(short)>,
        Function<short(int) const>>::value,
    "");

static_assert(
    !std::is_constructible<Function<int const&()>, int (*)()>::value,
    "");

static_assert(
    !std::is_constructible<Function<int const&() const>, int (*)()>::value,
    "");

#if FOLLY_HAVE_NOEXCEPT_FUNCTION_TYPE
static_assert(
    !std::is_constructible<Function<int const&() noexcept>, int (*)()>::value,
    "");

static_assert(
    !std::is_constructible<Function<int const&() const noexcept>, int (*)()>::
        value,
    "");
#endif

// TEST =====================================================================
// InvokeFunctor & InvokeReference

TEST(Function, InvokeFunctor) {
  Functor<int, 100> func;
  static_assert(
      sizeof(func) > sizeof(Function<int(size_t)>),
      "sizeof(Function) is much larger than expected");
  func(5, 123);

  Function<int(size_t) const> getter = std::move(func);

  // Function will allocate memory on the heap to store the functor object
  EXPECT_TRUE(getter.hasAllocatedMemory());

  EXPECT_EQ(123, getter(5));
}

TEST(Function, InvokeReference) {
  Functor<int, 10> func;
  func(5, 123);

  // Have Functions for getter and setter, both referencing the same funtor
  Function<int(size_t) const> getter = std::ref(func);
  Function<int(size_t, int)> setter = std::ref(func);

  EXPECT_EQ(123, getter(5));
  EXPECT_EQ(123, setter(5, 456));
  EXPECT_EQ(456, setter(5, 567));
  EXPECT_EQ(567, getter(5));
}

// TEST =====================================================================
// Emptiness

TEST(Function, Emptiness_T) {
  Function<int(int)> f;
  EXPECT_EQ(f, nullptr);
  EXPECT_EQ(nullptr, f);
  EXPECT_FALSE(f);
  EXPECT_THROW(f(98), std::bad_function_call);

  Function<int(int)> g([](int x) { return x + 1; });
  EXPECT_NE(g, nullptr);
  EXPECT_NE(nullptr, g);
  // Explicitly convert to bool to work around
  // https://github.com/google/googletest/issues/429
  EXPECT_TRUE(bool(g));
  EXPECT_EQ(100, g(99));

  Function<int(int)> h(&func_int_int_add_25);
  EXPECT_NE(h, nullptr);
  EXPECT_NE(nullptr, h);
  EXPECT_TRUE(bool(h));
  EXPECT_EQ(125, h(100));

  h = {};
  EXPECT_EQ(h, nullptr);
  EXPECT_EQ(nullptr, h);
  EXPECT_FALSE(h);
  EXPECT_THROW(h(101), std::bad_function_call);

  Function<int(int)> i{Function<int(int)>{}};
  EXPECT_EQ(i, nullptr);
  EXPECT_EQ(nullptr, i);
  EXPECT_FALSE(i);
  EXPECT_THROW(i(107), std::bad_function_call);
}

// TEST =====================================================================
// Swap

template <bool UseSwapMethod>
void swap_test() {
  Function<int(int)> mf1(func_int_int_add_25);
  Function<int(int)> mf2(func_int_int_add_111);

  EXPECT_EQ(125, mf1(100));
  EXPECT_EQ(211, mf2(100));

  if (UseSwapMethod) {
    mf1.swap(mf2);
  } else {
    swap(mf1, mf2);
  }

  EXPECT_EQ(125, mf2(100));
  EXPECT_EQ(211, mf1(100));

  Function<int(int)> mf3(nullptr);
  EXPECT_EQ(mf3, nullptr);

  if (UseSwapMethod) {
    mf1.swap(mf3);
  } else {
    swap(mf1, mf3);
  }

  EXPECT_EQ(211, mf3(100));
  EXPECT_EQ(nullptr, mf1);

  Function<int(int)> mf4([](int x) { return x + 222; });
  EXPECT_EQ(322, mf4(100));

  if (UseSwapMethod) {
    mf4.swap(mf3);
  } else {
    swap(mf4, mf3);
  }
  EXPECT_EQ(211, mf4(100));
  EXPECT_EQ(322, mf3(100));

  if (UseSwapMethod) {
    mf3.swap(mf1);
  } else {
    swap(mf3, mf1);
  }
  EXPECT_EQ(nullptr, mf3);
  EXPECT_EQ(322, mf1(100));
}
TEST(Function, SwapMethod) {
  swap_test<true>();
}
TEST(Function, SwapFunction) {
  swap_test<false>();
}

// TEST =====================================================================
// Bind

TEST(Function, Bind) {
  Function<float(float, float)> fnc = floatMult;
  auto task = std::bind(std::move(fnc), 2.f, 4.f);
  EXPECT_THROW(fnc(0, 0), std::bad_function_call);
  EXPECT_EQ(8, task());
  auto task2(std::move(task));
  EXPECT_THROW(task(), std::bad_function_call);
  EXPECT_EQ(8, task2());
}

// TEST =====================================================================
// NonCopyableLambda

TEST(Function, NonCopyableLambda) {
  auto unique_ptr_int = std::make_unique<int>(900);
  EXPECT_EQ(900, *unique_ptr_int);

  struct {
    char data[64];
  } fooData = {{0}};
  (void)fooData; // suppress gcc warning about fooData not being used

  auto functor = std::bind(
      [fooData](std::unique_ptr<int>& up) mutable {
        (void)fooData;
        return ++*up;
      },
      std::move(unique_ptr_int));

  EXPECT_EQ(901, functor());

  Function<int(void)> func = std::move(functor);
  EXPECT_TRUE(func.hasAllocatedMemory());

  EXPECT_EQ(902, func());
}

// TEST =====================================================================
// OverloadedFunctor

TEST(Function, OverloadedFunctor) {
  struct OverloadedFunctor {
    // variant 1
    int operator()(int x) {
      return 100 + 1 * x;
    }

    // variant 2 (const-overload of v1)
    int operator()(int x) const {
      return 100 + 2 * x;
    }

    // variant 3
    int operator()(int x, int) {
      return 100 + 3 * x;
    }

    // variant 4 (const-overload of v3)
    int operator()(int x, int) const {
      return 100 + 4 * x;
    }

    // variant 5 (non-const, has no const-overload)
    int operator()(int x, char const*) {
      return 100 + 5 * x;
    }

    // variant 6 (const only)
    int operator()(int x, std::vector<int> const&) const {
      return 100 + 6 * x;
    }
  };
  OverloadedFunctor of;

  Function<int(int)> variant1 = of;
  EXPECT_EQ(100 + 1 * 15, variant1(15));

  Function<int(int) const> variant2 = of;
  EXPECT_EQ(100 + 2 * 16, variant2(16));

  Function<int(int, int)> variant3 = of;
  EXPECT_EQ(100 + 3 * 17, variant3(17, 0));

  Function<int(int, int) const> variant4 = of;
  EXPECT_EQ(100 + 4 * 18, variant4(18, 0));

  Function<int(int, char const*)> variant5 = of;
  EXPECT_EQ(100 + 5 * 19, variant5(19, "foo"));

  Function<int(int, std::vector<int> const&)> variant6 = of;
  EXPECT_EQ(100 + 6 * 20, variant6(20, {}));
  EXPECT_EQ(100 + 6 * 20, variant6(20, {1, 2, 3}));

  Function<int(int, std::vector<int> const&) const> variant6const = of;
  EXPECT_EQ(100 + 6 * 21, variant6const(21, {}));

  // Cast const-functions to non-const and the other way around: if the functor
  // has both const and non-const operator()s for a given parameter signature,
  // constructing a Function must select one of them, depending on
  // whether the function type template parameter is const-qualified or not.
  // When the const-ness is later changed (by moving the
  // Function<R(Args...)const> into a Function<R(Args...)> or by
  // calling the folly::constCastFunction which moves it into a
  // Function<R(Args...)const>), the Function must still execute
  // the initially selected function.

  auto variant1_const = folly::constCastFunction(std::move(variant1));
  EXPECT_THROW(variant1(0), std::bad_function_call);
  EXPECT_EQ(100 + 1 * 22, variant1_const(22));

  Function<int(int)> variant2_nonconst = std::move(variant2);
  EXPECT_THROW(variant2(0), std::bad_function_call);
  EXPECT_EQ(100 + 2 * 23, variant2_nonconst(23));

  auto variant3_const = folly::constCastFunction(std::move(variant3));
  EXPECT_THROW(variant3(0, 0), std::bad_function_call);
  EXPECT_EQ(100 + 3 * 24, variant3_const(24, 0));

  Function<int(int, int)> variant4_nonconst = std::move(variant4);
  EXPECT_THROW(variant4(0, 0), std::bad_function_call);
  EXPECT_EQ(100 + 4 * 25, variant4_nonconst(25, 0));

  auto variant5_const = folly::constCastFunction(std::move(variant5));
  EXPECT_THROW(variant5(0, ""), std::bad_function_call);
  EXPECT_EQ(100 + 5 * 26, variant5_const(26, "foo"));

  auto variant6_const = folly::constCastFunction(std::move(variant6));
  EXPECT_THROW(variant6(0, {}), std::bad_function_call);
  EXPECT_EQ(100 + 6 * 27, variant6_const(27, {}));

  Function<int(int, std::vector<int> const&)> variant6const_nonconst =
      std::move(variant6const);
  EXPECT_THROW(variant6const(0, {}), std::bad_function_call);
  EXPECT_EQ(100 + 6 * 28, variant6const_nonconst(28, {}));
}

// TEST =====================================================================
// Lambda

TEST(Function, Lambda) {
  // Non-mutable lambdas: can be stored in a non-const...
  Function<int(int)> func = [](int x) { return 1000 + x; };
  EXPECT_EQ(1001, func(1));

  // ...as well as in a const Function
  Function<int(int) const> func_const = [](int x) { return 2000 + x; };
  EXPECT_EQ(2001, func_const(1));

  // Mutable lambda: can only be stored in a const Function:
  int number = 3000;
  Function<int()> func_mutable = [number]() mutable { return ++number; };
  EXPECT_EQ(3001, func_mutable());
  EXPECT_EQ(3002, func_mutable());

  // test after const-casting

  Function<int(int) const> func_made_const =
      folly::constCastFunction(std::move(func));
  EXPECT_EQ(1002, func_made_const(2));
  EXPECT_THROW(func(0), std::bad_function_call);

  Function<int(int)> func_const_made_nonconst = std::move(func_const);
  EXPECT_EQ(2002, func_const_made_nonconst(2));
  EXPECT_THROW(func_const(0), std::bad_function_call);

  Function<int() const> func_mutable_made_const =
      folly::constCastFunction(std::move(func_mutable));
  EXPECT_EQ(3003, func_mutable_made_const());
  EXPECT_EQ(3004, func_mutable_made_const());
  EXPECT_THROW(func_mutable(), std::bad_function_call);
}

// TEST =====================================================================
// DataMember & MemberFunction

struct MemberFunc {
  int x;
  int getX() const {
    return x;
  }
  void setX(int xx) {
    x = xx;
  }
};

TEST(Function, DataMember) {
  MemberFunc mf;
  MemberFunc const& cmf = mf;
  mf.x = 123;

  Function<int(MemberFunc const*)> data_getter1 = &MemberFunc::x;
  EXPECT_EQ(123, data_getter1(&cmf));
  Function<int(MemberFunc*)> data_getter2 = &MemberFunc::x;
  EXPECT_EQ(123, data_getter2(&mf));
  Function<int(MemberFunc const&)> data_getter3 = &MemberFunc::x;
  EXPECT_EQ(123, data_getter3(cmf));
  Function<int(MemberFunc&)> data_getter4 = &MemberFunc::x;
  EXPECT_EQ(123, data_getter4(mf));
}

TEST(Function, MemberFunction) {
  MemberFunc mf;
  MemberFunc const& cmf = mf;
  mf.x = 123;

  Function<int(MemberFunc const*)> getter1 = &MemberFunc::getX;
  EXPECT_EQ(123, getter1(&cmf));
  Function<int(MemberFunc*)> getter2 = &MemberFunc::getX;
  EXPECT_EQ(123, getter2(&mf));
  Function<int(MemberFunc const&)> getter3 = &MemberFunc::getX;
  EXPECT_EQ(123, getter3(cmf));
  Function<int(MemberFunc&)> getter4 = &MemberFunc::getX;
  EXPECT_EQ(123, getter4(mf));

  Function<void(MemberFunc*, int)> setter1 = &MemberFunc::setX;
  setter1(&mf, 234);
  EXPECT_EQ(234, mf.x);

  Function<void(MemberFunc&, int)> setter2 = &MemberFunc::setX;
  setter2(mf, 345);
  EXPECT_EQ(345, mf.x);
}

// TEST =====================================================================
// CaptureCopyMoveCount & ParameterCopyMoveCount

class CopyMoveTracker {
 public:
  struct ConstructorTag {};

  CopyMoveTracker() = delete;
  explicit CopyMoveTracker(ConstructorTag)
      : data_(std::make_shared<std::pair<size_t, size_t>>(0, 0)) {}

  CopyMoveTracker(CopyMoveTracker const& o) noexcept : data_(o.data_) {
    ++data_->first;
  }
  CopyMoveTracker& operator=(CopyMoveTracker const& o) noexcept {
    data_ = o.data_;
    ++data_->first;
    return *this;
  }

  CopyMoveTracker(CopyMoveTracker&& o) noexcept : data_(o.data_) {
    ++data_->second;
  }
  CopyMoveTracker& operator=(CopyMoveTracker&& o) noexcept {
    data_ = o.data_;
    ++data_->second;
    return *this;
  }

  size_t copyCount() const {
    return data_->first;
  }
  size_t moveCount() const {
    return data_->second;
  }
  size_t refCount() const {
    return data_.use_count();
  }
  void resetCounters() {
    data_->first = data_->second = 0;
  }

 private:
  // copy, move
  std::shared_ptr<std::pair<size_t, size_t>> data_;
};

TEST(Function, CaptureCopyMoveCount) {
  // This test checks that no unnecessary copies/moves are made.

  CopyMoveTracker cmt(CopyMoveTracker::ConstructorTag{});
  EXPECT_EQ(0, cmt.copyCount());
  EXPECT_EQ(0, cmt.moveCount());
  EXPECT_EQ(1, cmt.refCount());

  // Move into lambda, move lambda into Function
  auto lambda1 = [cmt = std::move(cmt)]() { return cmt.moveCount(); };
  Function<size_t(void)> uf1 = std::move(lambda1);

  // Max copies: 0. Max copy+moves: 2.
  EXPECT_LE(cmt.moveCount() + cmt.copyCount(), 3);
  EXPECT_LE(cmt.copyCount(), 0);

  cmt.resetCounters();

  // Move into lambda, copy lambda into Function
  auto lambda2 = [cmt = std::move(cmt)]() { return cmt.moveCount(); };
  Function<size_t(void)> uf2 = lambda2;

  // Max copies: 1. Max copy+moves: 2.
  EXPECT_LE(cmt.moveCount() + cmt.copyCount(), 3);
  EXPECT_LE(cmt.copyCount(), 1);

  // Invoking Function must not make copies/moves of the callable
  cmt.resetCounters();
  uf1();
  uf2();
  EXPECT_EQ(0, cmt.copyCount());
  EXPECT_EQ(0, cmt.moveCount());
}

TEST(Function, ParameterCopyMoveCount) {
  // This test checks that no unnecessary copies/moves are made.

  CopyMoveTracker cmt(CopyMoveTracker::ConstructorTag{});
  EXPECT_EQ(0, cmt.copyCount());
  EXPECT_EQ(0, cmt.moveCount());
  EXPECT_EQ(1, cmt.refCount());

  // pass by value
  Function<size_t(CopyMoveTracker)> uf1 = [](CopyMoveTracker c) {
    return c.moveCount();
  };

  cmt.resetCounters();
  uf1(cmt);
  // Max copies: 1. Max copy+moves: 2.
  EXPECT_LE(cmt.moveCount() + cmt.copyCount(), 2);
  EXPECT_LE(cmt.copyCount(), 1);

  cmt.resetCounters();
  uf1(std::move(cmt));
  // Max copies: 1. Max copy+moves: 2.
  EXPECT_LE(cmt.moveCount() + cmt.copyCount(), 2);
  EXPECT_LE(cmt.copyCount(), 0);

  // pass by reference
  Function<size_t(CopyMoveTracker&)> uf2 = [](CopyMoveTracker& c) {
    return c.moveCount();
  };

  cmt.resetCounters();
  uf2(cmt);
  // Max copies: 0. Max copy+moves: 0.
  EXPECT_LE(cmt.moveCount() + cmt.copyCount(), 0);
  EXPECT_LE(cmt.copyCount(), 0);

  // pass by const reference
  Function<size_t(CopyMoveTracker const&)> uf3 = [](CopyMoveTracker const& c) {
    return c.moveCount();
  };

  cmt.resetCounters();
  uf3(cmt);
  // Max copies: 0. Max copy+moves: 0.
  EXPECT_LE(cmt.moveCount() + cmt.copyCount(), 0);
  EXPECT_LE(cmt.copyCount(), 0);

  // pass by rvalue reference
  Function<size_t(CopyMoveTracker &&)> uf4 = [](CopyMoveTracker&& c) {
    return c.moveCount();
  };

  cmt.resetCounters();
  uf4(std::move(cmt));
  // Max copies: 0. Max copy+moves: 0.
  EXPECT_LE(cmt.moveCount() + cmt.copyCount(), 0);
  EXPECT_LE(cmt.copyCount(), 0);
}

// TEST =====================================================================
// VariadicTemplate & VariadicArguments

struct VariadicTemplateSum {
  int operator()() const {
    return 0;
  }
  template <class... Args>
  int operator()(int x, Args... args) const {
    return x + (*this)(args...);
  }
};

TEST(Function, VariadicTemplate) {
  Function<int(int)> uf1 = VariadicTemplateSum();
  Function<int(int, int)> uf2 = VariadicTemplateSum();
  Function<int(int, int, int)> uf3 = VariadicTemplateSum();

  EXPECT_EQ(66, uf1(66));
  EXPECT_EQ(99, uf2(55, 44));
  EXPECT_EQ(66, uf3(33, 22, 11));
}

struct VariadicArgumentsSum {
  int operator()(int count, ...) const {
    int result = 0;
    va_list args;
    va_start(args, count);
    for (int i = 0; i < count; ++i) {
      result += va_arg(args, int);
    }
    va_end(args);
    return result;
  }
};

TEST(Function, VariadicArguments) {
  Function<int(int)> uf1 = VariadicArgumentsSum();
  Function<int(int, int)> uf2 = VariadicArgumentsSum();
  Function<int(int, int, int)> uf3 = VariadicArgumentsSum();

  EXPECT_EQ(0, uf1(0));
  EXPECT_EQ(66, uf2(1, 66));
  EXPECT_EQ(99, uf3(2, 55, 44));
}

// TEST =====================================================================
// SafeCaptureByReference

// A function can use Function const& as a parameter to signal that it
// is safe to pass a lambda that captures local variables by reference.
// It is safe because we know the function called can only invoke the
// Function until it returns. It can't store a copy of the Function
// (because it's not copyable), and it can't move the Function somewhere
// else (because it gets only a const&).

template <typename T>
void for_each(
    T const& range,
    Function<void(typename T::value_type const&) const> const& func) {
  for (auto const& elem : range) {
    func(elem);
  }
}

TEST(Function, SafeCaptureByReference) {
  std::vector<int> const vec = {20, 30, 40, 2, 3, 4, 200, 300, 400};

  int sum = 0;

  // for_each's second parameter is of type Function<...> const&.
  // Hence we know we can safely pass it a lambda that references local
  // variables. There is no way the reference to x will be stored anywhere.
  for_each<std::vector<int>>(vec, [&sum](int x) { sum += x; });

  // gcc versions before 4.9 cannot deduce the type T in the above call
  // to for_each. Modern compiler versions can compile the following line:
  //   for_each(vec, [&sum](int x) { sum += x; });

  EXPECT_EQ(999, sum);
}

// TEST =====================================================================
// IgnoreReturnValue

TEST(Function, IgnoreReturnValue) {
  int x = 95;

  // Assign a lambda that return int to a folly::Function that returns void.
  Function<void()> f = [&]() -> int { return ++x; };

  EXPECT_EQ(95, x);
  f();
  EXPECT_EQ(96, x);

  Function<int()> g = [&]() -> int { return ++x; };
  Function<void()> cg = std::move(g);

  EXPECT_EQ(96, x);
  cg();
  EXPECT_EQ(97, x);
}

// TEST =====================================================================
// ReturnConvertible, ConvertReturnType

TEST(Function, ReturnConvertible) {
  struct CBase {
    int x;
  };
  struct CDerived : CBase {};

  Function<double()> f1 = []() -> int { return 5; };
  EXPECT_EQ(5.0, f1());

  Function<int()> f2 = []() -> double { return 5.2; };
  EXPECT_EQ(5, f2());

  CDerived derived;
  derived.x = 55;

  Function<CBase const&()> f3 = [&]() -> CDerived const& { return derived; };
  EXPECT_EQ(55, f3().x);

  Function<CBase const&()> f4 = [&]() -> CDerived& { return derived; };
  EXPECT_EQ(55, f4().x);

  Function<CBase&()> f5 = [&]() -> CDerived& { return derived; };
  EXPECT_EQ(55, f5().x);

  Function<CBase const*()> f6 = [&]() -> CDerived const* { return &derived; };
  EXPECT_EQ(f6()->x, 55);

  Function<CBase const*()> f7 = [&]() -> CDerived* { return &derived; };
  EXPECT_EQ(55, f7()->x);

  Function<CBase*()> f8 = [&]() -> CDerived* { return &derived; };
  EXPECT_EQ(55, f8()->x);

  Function<CBase()> f9 = [&]() -> CDerived {
    auto d = derived;
    d.x = 66;
    return d;
  };
  EXPECT_EQ(66, f9().x);
}

TEST(Function, ConvertReturnType) {
  struct CBase {
    int x;
  };
  struct CDerived : CBase {};

  Function<int()> f1 = []() -> int { return 5; };
  Function<double()> cf1 = std::move(f1);
  EXPECT_EQ(5.0, cf1());
  Function<int()> ccf1 = std::move(cf1);
  EXPECT_EQ(5, ccf1());

  Function<double()> f2 = []() -> double { return 5.2; };
  Function<int()> cf2 = std::move(f2);
  EXPECT_EQ(5, cf2());
  Function<double()> ccf2 = std::move(cf2);
  EXPECT_EQ(5.0, ccf2());

  CDerived derived;
  derived.x = 55;

  Function<CDerived const&()> f3 = [&]() -> CDerived const& { return derived; };
  Function<CBase const&()> cf3 = std::move(f3);
  EXPECT_EQ(55, cf3().x);

  Function<CDerived&()> f4 = [&]() -> CDerived& { return derived; };
  Function<CBase const&()> cf4 = std::move(f4);
  EXPECT_EQ(55, cf4().x);

  Function<CDerived&()> f5 = [&]() -> CDerived& { return derived; };
  Function<CBase&()> cf5 = std::move(f5);
  EXPECT_EQ(55, cf5().x);

  Function<CDerived const*()> f6 = [&]() -> CDerived const* {
    return &derived;
  };
  Function<CBase const*()> cf6 = std::move(f6);
  EXPECT_EQ(55, cf6()->x);

  Function<CDerived const*()> f7 = [&]() -> CDerived* { return &derived; };
  Function<CBase const*()> cf7 = std::move(f7);
  EXPECT_EQ(55, cf7()->x);

  Function<CDerived*()> f8 = [&]() -> CDerived* { return &derived; };
  Function<CBase*()> cf8 = std::move(f8);
  EXPECT_EQ(55, cf8()->x);

  Function<CDerived()> f9 = [&]() -> CDerived {
    auto d = derived;
    d.x = 66;
    return d;
  };
  Function<CBase()> cf9 = std::move(f9);
  EXPECT_EQ(66, cf9().x);
}

// TEST =====================================================================
// asStdFunction_*

TEST(Function, asStdFunction_void) {
  int i = 0;
  folly::Function<void()> f = [&] { ++i; };
  auto sf = std::move(f).asStdFunction();
  static_assert(
      std::is_same<decltype(sf), std::function<void()>>::value,
      "std::function has wrong type");
  sf();
  EXPECT_EQ(1, i);
}

TEST(Function, asStdFunction_void_const) {
  int i = 0;
  folly::Function<void() const> f = [&] { ++i; };
  auto sf = std::move(f).asStdFunction();
  static_assert(
      std::is_same<decltype(sf), std::function<void()>>::value,
      "std::function has wrong type");
  sf();
  EXPECT_EQ(1, i);
}

TEST(Function, asStdFunction_return) {
  int i = 0;
  folly::Function<int()> f = [&] {
    ++i;
    return 42;
  };
  auto sf = std::move(f).asStdFunction();
  static_assert(
      std::is_same<decltype(sf), std::function<int()>>::value,
      "std::function has wrong type");
  EXPECT_EQ(42, sf());
  EXPECT_EQ(1, i);
}

TEST(Function, asStdFunction_return_const) {
  int i = 0;
  folly::Function<int() const> f = [&] {
    ++i;
    return 42;
  };
  auto sf = std::move(f).asStdFunction();
  static_assert(
      std::is_same<decltype(sf), std::function<int()>>::value,
      "std::function has wrong type");
  EXPECT_EQ(42, sf());
  EXPECT_EQ(1, i);
}

TEST(Function, asStdFunction_args) {
  int i = 0;
  folly::Function<void(int, int)> f = [&](int x, int y) {
    ++i;
    return x + y;
  };
  auto sf = std::move(f).asStdFunction();
  static_assert(
      std::is_same<decltype(sf), std::function<void(int, int)>>::value,
      "std::function has wrong type");
  sf(42, 42);
  EXPECT_EQ(1, i);
}

TEST(Function, asStdFunction_args_const) {
  int i = 0;
  folly::Function<void(int, int) const> f = [&](int x, int y) {
    ++i;
    return x + y;
  };
  auto sf = std::move(f).asStdFunction();
  static_assert(
      std::is_same<decltype(sf), std::function<void(int, int)>>::value,
      "std::function has wrong type");
  sf(42, 42);
  EXPECT_EQ(1, i);
}

// TEST =====================================================================
// asSharedProxy_*

TEST(Function, asSharedProxy_void) {
  int i = 0;
  folly::Function<void()> f = [&i] { ++i; };
  auto sp = std::move(f).asSharedProxy();
  auto spcopy = sp;
  sp();
  EXPECT_EQ(1, i);
  spcopy();
  EXPECT_EQ(2, i);
}

TEST(Function, asSharedProxy_void_const) {
  int i = 0;
  folly::Function<void() const> f = [&i] { ++i; };
  auto sp = std::move(f).asSharedProxy();
  auto spcopy = sp;
  sp();
  EXPECT_EQ(1, i);
  spcopy();
  EXPECT_EQ(2, i);
}

TEST(Function, asSharedProxy_return) {
  folly::Function<int()> f = [i = 0]() mutable {
    ++i;
    return i;
  };
  auto sp = std::move(f).asSharedProxy();
  auto spcopy = sp;
  EXPECT_EQ(1, sp());
  EXPECT_EQ(2, spcopy());
}

TEST(Function, asSharedProxy_return_const) {
  int i = 0;
  folly::Function<int() const> f = [&i] {
    ++i;
    return i;
  };
  auto sp = std::move(f).asSharedProxy();
  auto spcopy = sp;
  EXPECT_EQ(1, sp());
  EXPECT_EQ(2, spcopy());
}

TEST(Function, asSharedProxy_args) {
  int i = 0;
  folly::Function<int(int, int)> f = [&](int x, int y) mutable {
    ++i;
    return x + y * 2;
  };
  auto sp = std::move(f).asSharedProxy();
  auto spcopy = sp;
  EXPECT_EQ(120, sp(100, 10));
  EXPECT_EQ(1, i);
  EXPECT_EQ(120, spcopy(100, 10));
  EXPECT_EQ(2, i);
}

TEST(Function, asSharedProxy_args_const) {
  int i = 0;
  folly::Function<int(int, int) const> f = [&i](int x, int y) {
    ++i;
    return x * 100 + y * 10 + i;
  };
  auto sp = std::move(f).asSharedProxy();
  auto spcopy = sp;
  EXPECT_EQ(561, sp(5, 6));
  EXPECT_EQ(562, spcopy(5, 6));
}

TEST(Function, NoAllocatedMemoryAfterMove) {
  Functor<int, 100> foo;

  Function<int(size_t)> func = foo;
  EXPECT_TRUE(func.hasAllocatedMemory());

  Function<int(size_t)> func2 = std::move(func);
  EXPECT_TRUE(func2.hasAllocatedMemory());
  EXPECT_FALSE(func.hasAllocatedMemory());
}

TEST(Function, ConstCastEmbedded) {
  int x = 0;
  auto functor = [&x]() { ++x; };

  Function<void() const> func(functor);
  EXPECT_FALSE(func.hasAllocatedMemory());

  Function<void()> func2(std::move(func));
  EXPECT_FALSE(func2.hasAllocatedMemory());
}

TEST(Function, EmptyAfterConstCast) {
  Function<int(size_t)> func;
  EXPECT_FALSE(func);

  Function<int(size_t) const> func2 = constCastFunction(std::move(func));
  EXPECT_FALSE(func2);
}

TEST(Function, SelfStdSwap) {
  Function<int()> f = [] { return 42; };
  f.swap(f);
  EXPECT_TRUE(bool(f));
  EXPECT_EQ(42, f());
  std::swap(f, f);
  EXPECT_TRUE(bool(f));
  EXPECT_EQ(42, f());
  folly::swap(f, f);
  EXPECT_TRUE(bool(f));
  EXPECT_EQ(42, f());
}

TEST(Function, SelfMove) {
  Function<int()> f = [] { return 42; };
  Function<int()>& g = f;
  f = std::move(g); // shouldn't crash!
  (void)bool(f); // valid but unspecified state
  f = [] { return 43; };
  EXPECT_TRUE(bool(f));
  EXPECT_EQ(43, f());
}

TEST(Function, SelfMove2) {
  int alive{0};
  struct arg {
    int* ptr_;
    explicit arg(int* ptr) noexcept : ptr_(ptr) {
      ++*ptr_;
    }
    arg(arg&& o) noexcept : ptr_(o.ptr_) {
      ++*ptr_;
    }
    arg& operator=(arg&&) = delete;
    ~arg() {
      --*ptr_;
    }
  };
  EXPECT_EQ(0, alive);
  Function<int()> f = [myarg = arg{&alive}] { return 42; };
  EXPECT_EQ(1, alive);
  Function<int()>& g = f;
  f = std::move(g);
  EXPECT_FALSE(bool(f)) << "self-assign is self-destruct";
  EXPECT_EQ(0, alive) << "self-asign is self-destruct";
  f = [] { return 43; };
  EXPECT_EQ(0, alive) << "sanity check against double-destruction";
  EXPECT_TRUE(bool(f));
  EXPECT_EQ(43, f());
}

TEST(Function, DeducableArguments) {
  deduceArgs(Function<void()>{[] {}});
  deduceArgs(Function<void(int, float)>{[](int, float) {}});
  deduceArgs(Function<int(int, float)>{[](int i, float) { return i; }});
}

TEST(Function, CtorWithCopy) {
  struct X {
    X() {}
    X(X const&) noexcept(true) {}
    X& operator=(X const&) = default;
  };
  struct Y {
    Y() {}
    Y(Y const&) noexcept(false) {}
    Y(Y&&) noexcept(true) {}
    Y& operator=(Y&&) = default;
    Y& operator=(Y const&) = default;
  };
  auto lx = [x = X()] {};
  auto ly = [y = Y()] {};
  EXPECT_TRUE(noexcept(Function<void()>(lx)));
  EXPECT_FALSE(noexcept(Function<void()>(ly)));
}

TEST(Function, Bug_T23346238) {
  const Function<void()> nullfun;
}
