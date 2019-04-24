/*
 * Copyright 2012-present Facebook, Inc.
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

#include <iostream>

#include <folly/Overload.h>
#include <folly/functional/ApplyTuple.h>
#include <folly/portability/GTest.h>

#include <array>
#include <memory>

namespace {

void func(int a, int b, double c) {
  EXPECT_EQ(a, 1);
  EXPECT_EQ(b, 2);
  EXPECT_EQ(c, 3.0);
}

struct Wat {
  void func(int a, int b, double c) {
    ::func(a, b, c);
  }

  double retVal(int a, double b) {
    return a + b;
  }

  Wat() {}
  Wat(Wat const&) = delete;

  int foo;
};

struct Overloaded {
  int func(int) {
    return 0;
  }
  bool func(bool) {
    return true;
  }
};

struct Func {
  int operator()() const {
    return 1;
  }
};

struct CopyCount {
  CopyCount() {}
  CopyCount(CopyCount const&) {
    std::cout << "copy count copy ctor\n";
  }
};

void anotherFunc(CopyCount const&) {}

std::function<void(int, int, double)> makeFunc() {
  return &func;
}

struct GuardObjBase {
  GuardObjBase(GuardObjBase&&) noexcept {}
  GuardObjBase() {}
  GuardObjBase(GuardObjBase const&) = delete;
  GuardObjBase& operator=(GuardObjBase const&) = delete;
};
typedef GuardObjBase const& Guard;

template <class F, class Tuple>
struct GuardObj : GuardObjBase {
  explicit GuardObj(F&& f, Tuple&& args)
      : f_(std::forward<F>(f)), args_(std::forward<Tuple>(args)) {}
  GuardObj(GuardObj&& g) noexcept
      : GuardObjBase(std::move(g)),
        f_(std::move(g.f_)),
        args_(std::move(g.args_)) {}

  ~GuardObj() {
    folly::apply(f_, args_);
  }

  GuardObj(const GuardObj&) = delete;
  GuardObj& operator=(const GuardObj&) = delete;

 private:
  F f_;
  Tuple args_;
};

template <class F, class... Args>
GuardObj<typename std::decay<F>::type, std::tuple<Args...>> guard(
    F&& f,
    Args&&... args) {
  return GuardObj<typename std::decay<F>::type, std::tuple<Args...>>(
      std::forward<F>(f), std::tuple<Args...>(std::forward<Args>(args)...));
}

struct Mover {
  Mover() {}
  Mover(Mover&&) noexcept {}
  Mover(const Mover&) = delete;
  Mover& operator=(const Mover&) = delete;
};

void move_only_func(Mover&&) {}

} // namespace

TEST(ApplyTuple, Test) {
  auto argsTuple = std::make_tuple(1, 2, 3.0);
  auto func2 = func;
  folly::apply(func2, argsTuple);
  folly::apply(func, argsTuple);
  folly::apply(func, std::make_tuple(1, 2, 3.0));
  folly::apply(makeFunc(), std::make_tuple(1, 2, 3.0));
  folly::apply(makeFunc(), argsTuple);

  std::unique_ptr<Wat> wat(new Wat);
  folly::apply(&Wat::func, std::make_tuple(wat.get(), 1, 2, 3.0));
  auto argsTuple2 = std::make_tuple(wat.get(), 1, 2, 3.0);
  folly::apply(&Wat::func, argsTuple2);

  EXPECT_EQ(
      10.0, folly::apply(&Wat::retVal, std::make_tuple(wat.get(), 1, 9.0)));

  auto test = guard(func, 1, 2, 3.0);
  CopyCount cpy;
  auto test2 = guard(anotherFunc, cpy);
  auto test3 = guard(anotherFunc, std::cref(cpy));

  Overloaded ovl;
  EXPECT_EQ(
      0,
      folly::apply(
          static_cast<int (Overloaded::*)(int)>(&Overloaded::func),
          std::make_tuple(&ovl, 12)));
  EXPECT_EQ(
      /* do not code-mode to EXPECT_TRUE */ true,
      folly::apply(
          static_cast<bool (Overloaded::*)(bool)>(&Overloaded::func),
          std::make_tuple(&ovl, false)));

  int x = folly::apply(std::plus<int>(), std::make_tuple(12, 12));
  EXPECT_EQ(24, x);

  Mover m;
  folly::apply(
      move_only_func, std::forward_as_tuple(std::forward<Mover>(Mover())));
  const auto tuple3 = std::make_tuple(1, 2, 3.0);
  folly::apply(func, tuple3);
}

TEST(ApplyTuple, Mutable) {
  auto argsTuple = std::make_tuple(1, 2, 3.0);

  folly::apply(
      [](int a, int b, double c) mutable { func(a, b, c); }, argsTuple);
}

TEST(ApplyTuple, ConstOverloads) {
  struct ConstOverloaded {
    ConstOverloaded() {}
    int operator()() {
      return 101;
    }
    int operator()() const {
      return 102;
    }
  };

  ConstOverloaded covl;

  // call operator()()
  EXPECT_EQ(folly::apply(covl, std::make_tuple()), 101);
  EXPECT_EQ(folly::apply(std::ref(covl), std::make_tuple()), 101);
  EXPECT_EQ(folly::apply(std::move(covl), std::make_tuple()), 101);

  // call operator()() const
  EXPECT_EQ(
      folly::apply(const_cast<ConstOverloaded const&>(covl), std::make_tuple()),
      102);
  EXPECT_EQ(folly::apply(std::cref(covl), std::make_tuple()), 102);
}

TEST(ApplyTuple, RefOverloads) {
  struct RefOverloaded {
    RefOverloaded() {}
    int operator()() & {
      return 201;
    }
    int operator()() const& {
      return 202;
    }
    int operator()() && {
      return 203;
    }
  };

  RefOverloaded rovl;

  // call operator()() &
  EXPECT_EQ(folly::apply(rovl, std::make_tuple()), 201);
  EXPECT_EQ(folly::apply(std::ref(rovl), std::make_tuple()), 201);

  // call operator()() const &
  EXPECT_EQ(
      folly::apply(const_cast<RefOverloaded const&>(rovl), std::make_tuple()),
      202);
  EXPECT_EQ(folly::apply(std::cref(rovl), std::make_tuple()), 202);

  // call operator()() &&
  EXPECT_EQ(folly::apply(std::move(rovl), std::make_tuple()), 203);
}

struct MemberFunc {
  int x;
  int getX() const {
    return x;
  }
  void setX(int xx) {
    x = xx;
  }
};

TEST(ApplyTuple, MemberFunction) {
  MemberFunc mf;
  mf.x = 123;

  // call getter
  EXPECT_EQ(folly::apply(&MemberFunc::getX, std::make_tuple(&mf)), 123);

  // call setter
  folly::apply(&MemberFunc::setX, std::make_tuple(&mf, 234));
  EXPECT_EQ(mf.x, 234);
  EXPECT_EQ(folly::apply(&MemberFunc::getX, std::make_tuple(&mf)), 234);
}

TEST(ApplyTuple, MemberFunctionWithRefWrapper) {
  MemberFunc mf;
  mf.x = 234;

  EXPECT_EQ(
      folly::apply(&MemberFunc::getX, std::make_tuple(std::ref(mf))), 234);
}

TEST(ApplyTuple, MemberFunctionWithConstPointer) {
  MemberFunc mf;
  mf.x = 234;

  EXPECT_EQ(
      folly::apply(
          &MemberFunc::getX,
          std::make_tuple(const_cast<MemberFunc const*>(&mf))),
      234);
}

TEST(ApplyTuple, MemberFunctionWithSharedPtr) {
  MemberFunc mf;
  mf.x = 234;

  EXPECT_EQ(
      folly::apply(
          &MemberFunc::getX, std::make_tuple(std::make_shared<MemberFunc>(mf))),
      234);
}

TEST(ApplyTuple, MemberFunctionWithUniquePtr) {
  MemberFunc mf;
  mf.x = 234;

  EXPECT_EQ(
      folly::apply(
          &MemberFunc::getX, std::make_tuple(std::make_unique<MemberFunc>(mf))),
      234);
}

TEST(ApplyTuple, Array) {
  folly::apply(func, std::array<int, 3>{{1, 2, 3}});
  folly::apply(func, std::array<double, 3>{{1, 2, 3}});
}

TEST(ApplyTuple, Pair) {
  auto add = [](int x, int y) { return x + y; };

  EXPECT_EQ(folly::apply(add, std::pair<int, int>{1200, 34}), 1234);
}

TEST(ApplyTuple, MultipleTuples) {
  auto add = [](int x, int y, int z) { return x * 100 + y * 10 + z; };

  EXPECT_EQ(123, folly::apply(add, std::make_tuple(1, 2, 3)));
  EXPECT_EQ(
      123,
      folly::apply(
          add, std::tuple_cat(std::make_tuple(1, 2, 3), std::make_tuple())));
  EXPECT_EQ(
      123,
      folly::apply(
          add, std::tuple_cat(std::make_tuple(1, 2), std::make_tuple(3))));
  EXPECT_EQ(
      123,
      folly::apply(
          add, std::tuple_cat(std::make_tuple(1), std::make_tuple(2, 3))));
  EXPECT_EQ(
      123,
      folly::apply(
          add, std::tuple_cat(std::make_tuple(), std::make_tuple(1, 2, 3))));

  EXPECT_EQ(
      123,
      folly::apply(
          add,
          std::tuple_cat(
              std::make_tuple(1, 2, 3), std::make_tuple(), std::make_tuple())));
  EXPECT_EQ(
      123,
      folly::apply(
          add,
          std::tuple_cat(
              std::make_tuple(1), std::make_tuple(2), std::make_tuple(3))));
  EXPECT_EQ(
      123,
      folly::apply(
          add,
          std::tuple_cat(
              std::make_tuple(1), std::make_tuple(), std::make_tuple(2, 3))));
}

TEST(ApplyTuple, UncurryCopyMove) {
  std::string separator = "================================\n";
  auto formatRow = folly::uncurry([=](std::string a, std::string b) {
    // capture separator by copy
    return separator + a + "\n" + b + "\n" + separator;
  });
  auto row = std::make_tuple("hello", "world");
  auto expected = separator + "hello\nworld\n" + separator;
  EXPECT_EQ(expected, formatRow(row));
  auto formatRowCopy = formatRow;
  EXPECT_EQ(expected, formatRowCopy(row));
  auto formatRowMove = std::move(formatRow);
  EXPECT_EQ(expected, formatRowMove(row));

  // capture value moved out from formatRow
  EXPECT_NE(expected, formatRow(row));
}

TEST(ApplyTuple, Uncurry) {
  EXPECT_EQ(42, folly::uncurry([](int x, int y) {
              return x * y;
            })(std::pair<int, int>(6, 7)));
  EXPECT_EQ(42, folly::uncurry([](int&& x, int&& y) {
              return x * y;
            })(std::pair<int&&, int&&>(6, 7)));
  EXPECT_EQ(42, folly::uncurry([](int&& x, int&& y) {
              return x * y;
            })(std::pair<int&&, int&&>(6, 7)));

  std::string long1 = "a long string exceeding small string size";
  std::string long2 = "and here is another one!";
  std::string expected = long1 + long2;

  auto cat = folly::uncurry(
      [](std::string a, std::string b) { return std::move(a) + std::move(b); });

  EXPECT_EQ(expected, cat(std::make_pair(long1, long2)));
  EXPECT_FALSE(long1.empty());
  EXPECT_FALSE(long2.empty());
  EXPECT_EQ(expected, cat(std::tie(long1, long2)));
  EXPECT_FALSE(long1.empty());
  EXPECT_FALSE(long2.empty());
  EXPECT_EQ(
      expected, cat(std::forward_as_tuple(std::move(long1), std::move(long2))));
  EXPECT_TRUE(long1.empty());
  EXPECT_TRUE(long2.empty());
}

TEST(ApplyTuple, UncurryStdFind) {
  std::vector<std::pair<int, int>> v{{1, 9}, {2, 8}, {3, 7}, {4, 6}, {5, 5}};
  EXPECT_EQ(
      3, std::count_if(v.begin(), v.end(), folly::uncurry([](int a, int b) {
                         return b % a == 0;
                       })));
}

namespace {
struct S {
  template <typename... Args>
  explicit S(Args&&... args) : tuple_(std::forward<Args>(args)...) {}

  std::tuple<int, double, std::string> tuple_;
};
} // namespace

TEST(MakeFromTupleTest, make_from_tuple) {
  S expected{42, 1.0, "foobar"};

  // const lvalue ref
  auto s1 = folly::make_from_tuple<S>(expected.tuple_);
  EXPECT_EQ(expected.tuple_, s1.tuple_);

  // rvalue ref
  S sCopy{expected.tuple_};
  auto s2 = folly::make_from_tuple<S>(std::move(sCopy.tuple_));
  EXPECT_EQ(expected.tuple_, s2.tuple_);
  EXPECT_TRUE(std::get<2>(sCopy.tuple_).empty());

  // forward
  std::string str{"foobar"};
  auto s3 =
      folly::make_from_tuple<S>(std::forward_as_tuple(42, 1.0, std::move(str)));
  EXPECT_EQ(expected.tuple_, s3.tuple_);
  EXPECT_TRUE(str.empty());
}

TEST(MakeIndexSequenceFromTuple, Basic) {
  using folly::index_sequence;
  using folly::index_sequence_for_tuple;
  using OneElementTuple = std::tuple<int>;
  using TwoElementTuple = std::tuple<int>;

  EXPECT_TRUE((std::is_same<
               index_sequence_for_tuple<OneElementTuple>,
               index_sequence<0>>::value));
  EXPECT_TRUE((std::is_same<
               index_sequence_for_tuple<const OneElementTuple>,
               index_sequence<0>>::value));

  EXPECT_TRUE((std::is_same<
               index_sequence_for_tuple<TwoElementTuple>,
               index_sequence<0>>::value));
  EXPECT_TRUE((std::is_same<
               index_sequence_for_tuple<const TwoElementTuple>,
               index_sequence<0>>::value));
}

TEST(ApplyResult, Basic) {
  {
    auto f = [](auto) -> int { return {}; };
    EXPECT_TRUE((std::is_same<
                 folly::apply_result_t<decltype(f), std::tuple<int>>,
                 int>{}));
  }

  {
    auto f = folly::overload(
        [](int) {},
        [](double) -> double { return {}; },
        [](int, int) -> int { return {}; });

    EXPECT_TRUE((std::is_same<
                 folly::apply_result_t<decltype(f), std::tuple<int>>,
                 void>::value));
    EXPECT_TRUE((std::is_same<
                 folly::apply_result_t<decltype(f), std::tuple<double>>,
                 double>::value));
    EXPECT_TRUE((std::is_same<
                 folly::apply_result_t<decltype(f), std::tuple<int, int>>,
                 int>::value));
  }
}

TEST(IsApplicable, Basic) {
  {
    auto f = [] {};
    EXPECT_TRUE((folly::is_applicable<decltype(f), std::tuple<>>::value));
    EXPECT_FALSE((folly::is_applicable<decltype(f), std::tuple<int>>::value));
  }
  {
    auto f = folly::overload([](int) {}, [](double) -> double { return {}; });
    EXPECT_TRUE((folly::is_applicable<decltype(f), std::tuple<double>>::value));
    EXPECT_TRUE((folly::is_applicable<decltype(f), std::tuple<int>>::value));
    EXPECT_FALSE((folly::is_applicable<decltype(f), std::tuple<>>::value));
    EXPECT_FALSE(
        (folly::is_applicable<decltype(f), std::tuple<int, double>>::value));
  }
}

TEST(IsNothrowApplicable, Basic) {
  {
    auto f = []() noexcept {};
    EXPECT_TRUE((folly::is_nothrow_applicable<decltype(f), std::tuple<>>{}));
    EXPECT_FALSE(
        (folly::is_nothrow_applicable<decltype(f), std::tuple<int>>{}));
  }
  {
    auto f = folly::overload(
        [](int) noexcept {}, [](double) -> double { return {}; });
    EXPECT_FALSE(
        (folly::is_nothrow_applicable<decltype(f), std::tuple<double>>{}));
    EXPECT_TRUE((folly::is_nothrow_applicable<decltype(f), std::tuple<int>>{}));
    EXPECT_FALSE((folly::is_nothrow_applicable<decltype(f), std::tuple<>>{}));
    EXPECT_FALSE(
        (folly::is_nothrow_applicable<decltype(f), std::tuple<int, double>>::
             value));
  }
}

TEST(IsApplicableR, Basic) {
  {
    auto f = []() -> int { return {}; };
    EXPECT_TRUE((folly::is_applicable_r<double, decltype(f), std::tuple<>>{}));
    EXPECT_FALSE(
        (folly::is_applicable_r<double, decltype(f), std::tuple<int>>{}));
  }
  {
    auto f = folly::overload(
        [](int) noexcept {}, [](double) -> double { return {}; });
    EXPECT_TRUE(
        (folly::is_applicable_r<float, decltype(f), std::tuple<double>>{}));
    EXPECT_TRUE((folly::is_applicable_r<void, decltype(f), std::tuple<int>>{}));
    EXPECT_FALSE((folly::is_applicable_r<void, decltype(f), std::tuple<>>{}));
    EXPECT_FALSE(
        (folly::is_applicable_r<double, decltype(f), std::tuple<int, double>>::
             value));
  }
}

TEST(IsNothrowApplicableR, Basic) {
  {
    auto f = []() noexcept->int {
      return {};
    };
    EXPECT_TRUE(
        (folly::is_nothrow_applicable_r<double, decltype(f), std::tuple<>>{}));
    EXPECT_FALSE(
        (folly::
             is_nothrow_applicable_r<double, decltype(f), std::tuple<int>>{}));
  }
  {
    auto f = folly::overload(
        [](int) noexcept {}, [](double) -> double { return {}; });
    EXPECT_FALSE((
        folly::
            is_nothrow_applicable_r<float, decltype(f), std::tuple<double>>{}));
    EXPECT_TRUE(
        (folly::is_nothrow_applicable_r<void, decltype(f), std::tuple<int>>{}));
    EXPECT_FALSE(
        (folly::is_nothrow_applicable_r<void, decltype(f), std::tuple<>>{}));
    EXPECT_FALSE((folly::is_nothrow_applicable_r<
                  double,
                  decltype(f),
                  std::tuple<int, double>>::value));
  }
}

TEST(ForwardTuple, Basic) {
  auto tuple = std::make_tuple(1, 2.0);

  EXPECT_TRUE((std::is_same<
               decltype(folly::forward_tuple(tuple)),
               std::tuple<int&, double&>>::value));
  EXPECT_EQ(folly::forward_tuple(tuple), tuple);
  EXPECT_TRUE((std::is_same<
               decltype(folly::forward_tuple(folly::as_const(tuple))),
               std::tuple<const int&, const double&>>::value));
  EXPECT_EQ(folly::forward_tuple(folly::as_const(tuple)), tuple);

  EXPECT_TRUE((std::is_same<
               decltype(folly::forward_tuple(std::move(tuple))),
               std::tuple<int&&, double&&>>::value));
  EXPECT_EQ(folly::forward_tuple(std::move(tuple)), tuple);
  EXPECT_TRUE(
      (std::is_same<
          decltype(folly::forward_tuple(std::move(folly::as_const(tuple)))),
          std::tuple<const int&, const double&>>::value));
  EXPECT_EQ(folly::forward_tuple(std::move(folly::as_const(tuple))), tuple);

  auto integer = 1;
  auto floating_point = 2.0;
  auto ref_tuple = std::forward_as_tuple(integer, std::move(floating_point));

  EXPECT_TRUE((std::is_same<
               decltype(folly::forward_tuple(ref_tuple)),
               std::tuple<int&, double&>>::value));

  EXPECT_TRUE((std::is_same<
               decltype(folly::forward_tuple(std::move(ref_tuple))),
               std::tuple<int&, double&&>>::value));

  EXPECT_TRUE((std::is_same<
               decltype(std::tuple_cat(
                   folly::forward_tuple(tuple),
                   folly::forward_tuple(std::move(tuple)))),
               std::tuple<int&, double&, int&&, double&&>>::value));
}
