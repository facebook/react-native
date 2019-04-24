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

#include <stdexcept>

#include <folly/Conv.h>
#include <folly/ExceptionWrapper.h>
#include <folly/portability/GTest.h>

using namespace folly;

class AbstractIntException : public std::exception {
 public:
  virtual int getInt() const = 0;
};

class IntException : public AbstractIntException {
 public:
  explicit IntException(int i) : i_(i), what_(to<std::string>("int == ", i_)) {}

  int getInt() const override {
    return i_;
  }
  const char* what() const noexcept override {
    return what_.c_str();
  }

 private:
  int i_;
  std::string what_;
};

const static std::string kExceptionClassName =
    demangle(typeid(std::exception)).toStdString();
const static std::string kRuntimeErrorClassName =
    demangle(typeid(std::runtime_error)).toStdString();
const static std::string kIntExceptionClassName =
    demangle(typeid(IntException)).toStdString();
const static std::string kIntClassName = demangle(typeid(int)).toStdString();

template <typename T>
T& from_eptr(std::exception_ptr& eptr) {
  try {
    std::rethrow_exception(eptr);
  } catch (T& e) {
    return e;
  } catch (...) {
    throw std::logic_error("impossible");
  }
}

TEST(ExceptionWrapper, nothrow) {
  EXPECT_TRUE(std::is_nothrow_default_constructible<exception_wrapper>::value);
  EXPECT_TRUE(std::is_nothrow_move_constructible<exception_wrapper>::value);
  EXPECT_TRUE(std::is_nothrow_move_assignable<exception_wrapper>::value);
  EXPECT_TRUE(std::is_nothrow_copy_constructible<exception_wrapper>::value);
  EXPECT_TRUE(std::is_nothrow_copy_assignable<exception_wrapper>::value);
}

// Tests that when we call throw_exception, the proper type is thrown (derived)
TEST(ExceptionWrapper, throw_test) {
  std::runtime_error e("payload");
  auto ew = make_exception_wrapper<std::runtime_error>(e);

  std::vector<exception_wrapper> container;
  container.push_back(ew);

  try {
    container[0].throw_exception();
  } catch (std::runtime_error& err) {
    std::string expected = "payload";
    std::string actual = err.what();
    EXPECT_EQ(expected, actual);
  }
}

// Tests that when we call throw_with_nested, we can unnest it later.
TEST(ExceptionWrapper, throw_with_nested) {
  auto ew = make_exception_wrapper<std::runtime_error>("inner");
  try {
    ew.throw_with_nested(std::runtime_error("outer"));
    ADD_FAILURE();
  } catch (std::runtime_error& outer) {
    EXPECT_STREQ(outer.what(), "outer");
    try {
      std::rethrow_if_nested(outer);
      ADD_FAILURE();
    } catch (std::runtime_error& inner) {
      EXPECT_STREQ(inner.what(), "inner");
    }
  }
}

TEST(ExceptionWrapper, members) {
  auto ew = exception_wrapper();
  EXPECT_FALSE(bool(ew));
  EXPECT_EQ(ew.what(), "");
  EXPECT_EQ(ew.class_name(), "");
  ew = make_exception_wrapper<std::runtime_error>("payload");
  EXPECT_TRUE(bool(ew));
  EXPECT_EQ(ew.what(), kRuntimeErrorClassName + ": payload");
  EXPECT_EQ(ew.class_name(), kRuntimeErrorClassName);
}

TEST(ExceptionWrapper, try_and_catch_test) {
  std::string expected = "payload";

  // Catch rightmost matching exception type
  exception_wrapper ew = try_and_catch<std::exception, std::runtime_error>(
      [=]() { throw std::runtime_error(expected); });
  EXPECT_TRUE(bool(ew));
  EXPECT_EQ(ew.what(), kRuntimeErrorClassName + ": payload");
  EXPECT_EQ(ew.class_name(), kRuntimeErrorClassName);
  auto rep = ew.is_compatible_with<std::runtime_error>();
  EXPECT_TRUE(rep);

  // Changing order is like catching in wrong order. Beware of this in your
  // code.
  auto ew2 = try_and_catch<std::runtime_error, std::exception>(
      [=]() { throw std::runtime_error(expected); });
  EXPECT_TRUE(bool(ew2));
  // We are catching a std::exception, not std::runtime_error.
  // But, we can still get the actual type if we want it.
  rep = ew2.is_compatible_with<std::runtime_error>();
  EXPECT_TRUE(rep);

  // Catches even if not rightmost.
  auto ew3 = try_and_catch<std::exception, std::runtime_error>(
      []() { throw std::exception(); });
  EXPECT_TRUE(bool(ew3));
  EXPECT_EQ(ew3.what(), kExceptionClassName + ": std::exception");
  EXPECT_EQ(ew3.class_name(), kExceptionClassName);
  rep = ew3.is_compatible_with<std::runtime_error>();
  EXPECT_FALSE(rep);

  // If does not catch, throws.
  EXPECT_THROW(
      try_and_catch<std::runtime_error>([]() { throw std::exception(); }),
      std::exception);
}

TEST(ExceptionWrapper, with_exception_test) {
  int expected = 23;

  // This works, and doesn't slice.
  exception_wrapper ew = try_and_catch<std::exception, std::runtime_error>(
      [=]() { throw IntException(expected); });
  EXPECT_TRUE(bool(ew));
  EXPECT_EQ(ew.what(), kIntExceptionClassName + ": int == 23");
  EXPECT_EQ(ew.class_name(), kIntExceptionClassName);
  EXPECT_TRUE(ew.with_exception(
      [&](const IntException& ie) { EXPECT_EQ(ie.getInt(), expected); }));

  // I can try_and_catch a non-copyable base class.  This will use
  // std::exception_ptr internally.
  exception_wrapper ew2 = try_and_catch<AbstractIntException>(
      [=]() { throw IntException(expected); });
  EXPECT_TRUE(bool(ew2));
  EXPECT_EQ(ew2.what(), kIntExceptionClassName + ": int == 23");
  EXPECT_EQ(ew2.class_name(), kIntExceptionClassName);
  bool res = ew2.with_exception([&](AbstractIntException& ie) {
    EXPECT_EQ(ie.getInt(), expected);
    EXPECT_TRUE(dynamic_cast<IntException*>(&ie));
  });
  EXPECT_TRUE(res);

  // Test with const this.  If this compiles and does not crash due to
  // infinite loop when it runs, it succeeds.
  const exception_wrapper& cew = ew;
  EXPECT_TRUE(
      cew.with_exception([&](const IntException& /* ie */) { SUCCEED(); }));

  // Test with empty ew.
  exception_wrapper empty_ew;
  EXPECT_FALSE(
      empty_ew.with_exception([&](const std::exception& /* ie */) { FAIL(); }));

  // Testing with const exception_wrapper; sanity check first:
  EXPECT_FALSE(cew.with_exception([&](const std::runtime_error&) {}));
  EXPECT_FALSE(cew.with_exception([&](const int&) {}));
  // This won't even compile.  You can't use a function which takes a
  // non-const reference with a const exception_wrapper.
  /*
  EXPECT_FALSE(cew.with_exception([&](std::runtime_error&) {}));
  EXPECT_FALSE(cew.with_exception([&](int&) {}));
  */
}

TEST(ExceptionWrapper, get_or_make_exception_ptr_test) {
  int expected = 23;

  // This works, and doesn't slice.
  exception_wrapper ew = try_and_catch<std::exception, std::runtime_error>(
      [=]() { throw IntException(expected); });
  std::exception_ptr eptr = ew.to_exception_ptr();
  EXPECT_THROW(std::rethrow_exception(eptr), IntException);

  // I can try_and_catch a non-copyable base class.  This will use
  // std::exception_ptr internally.
  exception_wrapper ew2 = try_and_catch<AbstractIntException>(
      [=]() { throw IntException(expected); });
  eptr = ew2.to_exception_ptr();
  EXPECT_THROW(std::rethrow_exception(eptr), IntException);

  // Test with const this.
  const exception_wrapper& cew = ew;
  eptr = cew.to_exception_ptr();
  EXPECT_THROW(std::rethrow_exception(eptr), IntException);

  // Test with empty ew.
  exception_wrapper empty_ew;
  eptr = empty_ew.to_exception_ptr();
  EXPECT_FALSE(eptr);
}

TEST(ExceptionWrapper, from_exception_ptr_empty) {
  auto ep = std::exception_ptr();
  auto ew = exception_wrapper::from_exception_ptr(ep);
  EXPECT_FALSE(bool(ew));
}

TEST(ExceptionWrapper, from_exception_ptr_exn) {
  auto ep = std::make_exception_ptr(std::runtime_error("foo"));
  auto ew = exception_wrapper::from_exception_ptr(ep);
  EXPECT_TRUE(bool(ew));
  EXPECT_EQ(ep, ew.to_exception_ptr());
  EXPECT_TRUE(ew.is_compatible_with<std::runtime_error>());
}

TEST(ExceptionWrapper, from_exception_ptr_any) {
  auto ep = std::make_exception_ptr<int>(12);
  auto ew = exception_wrapper::from_exception_ptr(ep);
  EXPECT_TRUE(bool(ew));
  EXPECT_EQ(ep, ew.to_exception_ptr());
  EXPECT_TRUE(ew.is_compatible_with<int>());
}

TEST(ExceptionWrapper, with_exception_ptr_empty) {
  auto ew = exception_wrapper(std::exception_ptr());
  EXPECT_EQ(exception_wrapper::none(), ew.type());
  EXPECT_FALSE(bool(ew));
  EXPECT_EQ(nullptr, ew.get_exception());
  EXPECT_EQ(nullptr, ew.get_exception<std::exception>());
  EXPECT_EQ(nullptr, ew.get_exception<int>());
  EXPECT_FALSE(ew.has_exception_ptr());
  EXPECT_EQ(nullptr, ew.to_exception_ptr());
  EXPECT_FALSE(ew.has_exception_ptr());
  EXPECT_EQ("", ew.class_name());
  EXPECT_EQ("", ew.what());
  EXPECT_FALSE(ew.is_compatible_with<std::exception>());
  EXPECT_FALSE(ew.is_compatible_with<int>());
  EXPECT_DEATH(ew.throw_exception(), "empty folly::exception_wrapper");
}

TEST(ExceptionWrapper, with_shared_ptr_test) {
  auto ew = exception_wrapper(std::runtime_error("foo"));
  EXPECT_TRUE(bool(ew));
  EXPECT_EQ(typeid(std::runtime_error), ew.type());
  EXPECT_NE(nullptr, ew.get_exception());
  EXPECT_NE(nullptr, ew.get_exception<std::exception>());
  EXPECT_STREQ("foo", ew.get_exception<std::exception>()->what());
  EXPECT_EQ(nullptr, ew.get_exception<int>());
  EXPECT_FALSE(ew.has_exception_ptr());
  EXPECT_NE(nullptr, ew.to_exception_ptr());
  EXPECT_TRUE(ew.has_exception_ptr());
  EXPECT_EQ(kRuntimeErrorClassName, ew.class_name());
  EXPECT_EQ(kRuntimeErrorClassName + ": foo", ew.what());
  EXPECT_TRUE(ew.is_compatible_with<std::exception>());
  EXPECT_TRUE(ew.is_compatible_with<std::runtime_error>());
  EXPECT_FALSE(ew.is_compatible_with<int>());
  EXPECT_THROW(ew.throw_exception(), std::runtime_error);

  exception_wrapper(std::move(ew));
  EXPECT_FALSE(bool(ew));
  EXPECT_EQ(exception_wrapper::none(), ew.type());
  EXPECT_EQ(nullptr, ew.get_exception());
  EXPECT_EQ(nullptr, ew.get_exception<std::exception>());
  EXPECT_EQ(nullptr, ew.get_exception<int>());
  EXPECT_EQ(nullptr, ew.to_exception_ptr());
  EXPECT_EQ("", ew.class_name());
  EXPECT_EQ("", ew.what());
  EXPECT_FALSE(ew.is_compatible_with<std::exception>());
  EXPECT_FALSE(ew.is_compatible_with<std::runtime_error>());
  EXPECT_FALSE(ew.is_compatible_with<int>());
}

TEST(ExceptionWrapper, with_exception_ptr_exn_test) {
  auto ep = std::make_exception_ptr(std::runtime_error("foo"));
  auto ew = exception_wrapper(ep, from_eptr<std::runtime_error>(ep));
  EXPECT_TRUE(bool(ew));
  EXPECT_EQ(typeid(std::runtime_error), ew.type());
  EXPECT_NE(nullptr, ew.get_exception());
  EXPECT_NE(nullptr, ew.get_exception<std::exception>());
  EXPECT_STREQ("foo", ew.get_exception<std::exception>()->what());
  EXPECT_EQ(nullptr, ew.get_exception<int>());
  EXPECT_TRUE(ew.has_exception_ptr());
  EXPECT_EQ(ep, ew.to_exception_ptr());
  EXPECT_TRUE(ew.has_exception_ptr());
  EXPECT_EQ(kRuntimeErrorClassName, ew.class_name());
  EXPECT_EQ(kRuntimeErrorClassName + ": foo", ew.what());
  EXPECT_TRUE(ew.is_compatible_with<std::exception>());
  EXPECT_TRUE(ew.is_compatible_with<std::runtime_error>());
  EXPECT_FALSE(ew.is_compatible_with<int>());
  EXPECT_THROW(ew.throw_exception(), std::runtime_error);

  exception_wrapper(std::move(ew));
  EXPECT_FALSE(bool(ew));
  EXPECT_EQ(exception_wrapper::none(), ew.type());
  EXPECT_EQ(nullptr, ew.get_exception());
  EXPECT_EQ(nullptr, ew.get_exception<std::exception>());
  EXPECT_EQ(nullptr, ew.get_exception<int>());
  EXPECT_EQ(nullptr, ew.to_exception_ptr());
  EXPECT_EQ("", ew.class_name());
  EXPECT_EQ("", ew.what());
  EXPECT_FALSE(ew.is_compatible_with<std::exception>());
  EXPECT_FALSE(ew.is_compatible_with<std::runtime_error>());
  EXPECT_FALSE(ew.is_compatible_with<int>());
}

TEST(ExceptionWrapper, with_exception_ptr_any_test) {
  auto ep = std::make_exception_ptr<int>(12);
  auto ew = exception_wrapper(ep, from_eptr<int>(ep));
  EXPECT_TRUE(bool(ew));
  EXPECT_EQ(nullptr, ew.get_exception());
  EXPECT_EQ(nullptr, ew.get_exception<std::exception>());
  EXPECT_NE(nullptr, ew.get_exception<int>());
  EXPECT_EQ(12, *ew.get_exception<int>());
  EXPECT_TRUE(ew.has_exception_ptr());
  EXPECT_EQ(ep, ew.to_exception_ptr());
  EXPECT_TRUE(ew.has_exception_ptr());
  EXPECT_EQ(demangle(typeid(int)), ew.class_name());
  EXPECT_EQ(demangle(typeid(int)), ew.what());
  EXPECT_FALSE(ew.is_compatible_with<std::exception>());
  EXPECT_FALSE(ew.is_compatible_with<std::runtime_error>());
  EXPECT_TRUE(ew.is_compatible_with<int>());
  EXPECT_THROW(ew.throw_exception(), int);

  exception_wrapper(std::move(ew));
  EXPECT_FALSE(bool(ew));
  EXPECT_EQ(nullptr, ew.get_exception());
  EXPECT_EQ(nullptr, ew.get_exception<std::exception>());
  EXPECT_EQ(nullptr, ew.get_exception<int>());
  EXPECT_EQ(nullptr, ew.to_exception_ptr());
  EXPECT_FALSE(ew.has_exception_ptr());
  EXPECT_EQ("", ew.class_name());
  EXPECT_EQ("", ew.what());
  EXPECT_FALSE(ew.is_compatible_with<std::exception>());
  EXPECT_FALSE(ew.is_compatible_with<std::runtime_error>());
  EXPECT_FALSE(ew.is_compatible_with<int>());
}

TEST(ExceptionWrapper, with_non_std_exception_test) {
  auto ew = exception_wrapper(folly::in_place, 42);
  EXPECT_TRUE(bool(ew));
  EXPECT_EQ(nullptr, ew.get_exception());
  EXPECT_EQ(nullptr, ew.get_exception<std::exception>());
  EXPECT_NE(nullptr, ew.get_exception<int>());
  EXPECT_EQ(42, *ew.get_exception<int>());
  EXPECT_TRUE(ew.has_exception_ptr());
  EXPECT_EQ(demangle(typeid(int)), ew.class_name());
  EXPECT_EQ(demangle(typeid(int)), ew.what());
  EXPECT_NE(nullptr, ew.to_exception_ptr());
  EXPECT_TRUE(ew.has_exception_ptr());
  EXPECT_EQ(demangle(typeid(int)), ew.class_name());
  EXPECT_EQ(demangle(typeid(int)), ew.what());
  EXPECT_FALSE(ew.is_compatible_with<std::exception>());
  EXPECT_FALSE(ew.is_compatible_with<std::runtime_error>());
  EXPECT_TRUE(ew.is_compatible_with<int>());
  EXPECT_THROW(ew.throw_exception(), int);

  exception_wrapper(std::move(ew));
  EXPECT_FALSE(bool(ew));
  EXPECT_EQ(nullptr, ew.get_exception());
  EXPECT_EQ(nullptr, ew.get_exception<std::exception>());
  EXPECT_EQ(nullptr, ew.get_exception<int>());
  EXPECT_EQ(nullptr, ew.to_exception_ptr());
  EXPECT_FALSE(ew.has_exception_ptr());
  EXPECT_EQ("", ew.class_name());
  EXPECT_EQ("", ew.what());
  EXPECT_FALSE(ew.is_compatible_with<std::exception>());
  EXPECT_FALSE(ew.is_compatible_with<std::runtime_error>());
  EXPECT_FALSE(ew.is_compatible_with<int>());
}

TEST(ExceptionWrapper, with_exception_ptr_any_nil_test) {
  auto ep = std::make_exception_ptr<int>(12);
  auto ew = exception_wrapper(ep); // concrete type is erased
  EXPECT_TRUE(bool(ew));
  EXPECT_EQ(nullptr, ew.get_exception());
  EXPECT_EQ(nullptr, ew.get_exception<std::exception>());
  EXPECT_NE(nullptr, ew.get_exception<int>());
  EXPECT_EQ(12, *ew.get_exception<int>());
  EXPECT_EQ(ep, ew.to_exception_ptr());
  EXPECT_EQ("<unknown exception>", ew.class_name()); // because concrete type is
  // erased
  EXPECT_EQ("<unknown exception>", ew.what());
  EXPECT_FALSE(ew.is_compatible_with<std::exception>());
  EXPECT_FALSE(ew.is_compatible_with<std::runtime_error>());
  EXPECT_TRUE(ew.is_compatible_with<int>());
  EXPECT_THROW(ew.throw_exception(), int);

  exception_wrapper(std::move(ew));
  EXPECT_FALSE(bool(ew));
  EXPECT_EQ(nullptr, ew.get_exception());
  EXPECT_EQ(nullptr, ew.get_exception<std::exception>());
  EXPECT_EQ(nullptr, ew.get_exception<int>());
  EXPECT_EQ(nullptr, ew.to_exception_ptr());
  EXPECT_EQ("", ew.class_name());
  EXPECT_EQ("", ew.what());
  EXPECT_FALSE(ew.is_compatible_with<std::exception>());
  EXPECT_FALSE(ew.is_compatible_with<std::runtime_error>());
  EXPECT_FALSE(ew.is_compatible_with<int>());
}

TEST(ExceptionWrapper, with_exception_deduction) {
  auto ew = make_exception_wrapper<std::runtime_error>("hi");
  EXPECT_TRUE(ew.with_exception([](std::runtime_error&) {}));
  EXPECT_TRUE(ew.with_exception([](std::exception&) {}));
  EXPECT_FALSE(ew.with_exception([](std::logic_error&) {}));
}

TEST(ExceptionWrapper, with_exception_deduction_exn_const) {
  auto ew = make_exception_wrapper<std::runtime_error>("hi");
  EXPECT_TRUE(ew.with_exception([](const std::runtime_error&) {}));
  EXPECT_TRUE(ew.with_exception([](const std::exception&) {}));
  EXPECT_FALSE(ew.with_exception([](const std::logic_error&) {}));
}

TEST(ExceptionWrapper, with_exception_deduction_wrap_const_exn_const) {
  const auto cew = make_exception_wrapper<std::runtime_error>("hi");
  EXPECT_TRUE(cew.with_exception([](const std::runtime_error&) {}));
  EXPECT_TRUE(cew.with_exception([](const std::exception&) {}));
  EXPECT_FALSE(cew.with_exception([](const std::logic_error&) {}));
}

TEST(ExceptionWrapper, with_exception_deduction_returning) {
  auto ew = make_exception_wrapper<std::runtime_error>("hi");
  EXPECT_TRUE(ew.with_exception([](std::runtime_error&) { return 3; }));
  EXPECT_TRUE(ew.with_exception([](std::exception&) { return "hello"; }));
  EXPECT_FALSE(ew.with_exception([](std::logic_error&) { return nullptr; }));
}

namespace {
template <typename T>
T& r_to_l(T v) {
  return std::ref(v);
}
} // namespace

TEST(ExceptionWrapper, with_exception_deduction_functor_lvalue) {
  auto ew = make_exception_wrapper<std::runtime_error>("hi");
  EXPECT_TRUE(ew.with_exception(r_to_l([](std::runtime_error&) {})));
  EXPECT_TRUE(ew.with_exception(r_to_l([](std::exception&) {})));
  EXPECT_FALSE(ew.with_exception(r_to_l([](std::logic_error&) {})));
}

TEST(ExceptionWrapper, non_std_exception_test) {
  int expected = 17;

  exception_wrapper ew =
      try_and_catch<std::exception, int>([=]() { throw expected; });
  EXPECT_TRUE(bool(ew));
  EXPECT_FALSE(ew.is_compatible_with<std::exception>());
  EXPECT_TRUE(ew.is_compatible_with<int>());
  EXPECT_EQ(ew.what(), kIntClassName);
  EXPECT_EQ(ew.class_name(), kIntClassName);
  // non-std::exception types are supported, but the only way to
  // access their value is to explicity rethrow and catch it.
  try {
    ew.throw_exception();
  } catch /* nolint */ (int& i) {
    EXPECT_EQ(i, expected);
  }
}

TEST(ExceptionWrapper, exceptionStr) {
  auto ew = make_exception_wrapper<std::runtime_error>("argh");
  EXPECT_EQ(kRuntimeErrorClassName + ": argh", exceptionStr(ew));
}

TEST(ExceptionWrapper, throwException_noException) {
  exception_wrapper ew;
  ASSERT_DEATH(ew.throw_exception(), "empty folly::exception_wrapper");
}

namespace {
class TestException : public std::exception {};
void testEW(const exception_wrapper& ew) {
  EXPECT_THROW(ew.throw_exception(), TestException);
}
} // namespace

TEST(ExceptionWrapper, implicitConstruction) {
  // Try with both lvalue and rvalue references
  TestException e;
  testEW(e);
  testEW(TestException());
}

namespace {
struct BaseException {
  virtual ~BaseException() {}
};
struct DerivedException : BaseException {};
exception_wrapper testNonStdException() {
  try {
    throw DerivedException{};
  } catch (const BaseException& e) {
    return exception_wrapper{std::current_exception(), e};
  }
}
} // namespace

TEST(ExceptionWrapper, base_derived_non_std_exception_test) {
  auto ew = testNonStdException();
  EXPECT_TRUE(ew.type() == typeid(DerivedException));
  EXPECT_TRUE(ew.with_exception([](const DerivedException&) {}));
}

namespace {
// Cannot be stored within an exception_wrapper
struct BigRuntimeError : std::runtime_error {
  using std::runtime_error::runtime_error;
  char data_[sizeof(exception_wrapper) + 1]{};
};

struct BigNonStdError {
  char data_[sizeof(exception_wrapper) + 1]{};
};
} // namespace

TEST(ExceptionWrapper, handle_std_exception) {
  auto ep = std::make_exception_ptr(std::runtime_error{"hello world"});
  exception_wrapper const ew_eptr(ep, from_eptr<std::runtime_error>(ep));
  exception_wrapper const ew_small(std::runtime_error{"hello world"});
  exception_wrapper const ew_big(BigRuntimeError{"hello world"});

  bool handled = false;
  auto expect_runtime_error_yes_catch_all = [&](const exception_wrapper& ew) {
    ew.handle(
        [](const std::logic_error&) { ADD_FAILURE(); },
        [&](const std::runtime_error&) { handled = true; },
        [](const std::exception&) { ADD_FAILURE(); },
        [](...) { ADD_FAILURE(); });
  };

  expect_runtime_error_yes_catch_all(ew_eptr);
  EXPECT_TRUE(handled);
  handled = false;
  expect_runtime_error_yes_catch_all(ew_small);
  EXPECT_TRUE(handled);
  handled = false;
  expect_runtime_error_yes_catch_all(ew_big);
  EXPECT_TRUE(handled);
  handled = false;

  auto expect_runtime_error_no_catch_all = [&](const exception_wrapper& ew) {
    ew.handle(
        [](const std::logic_error&) { ADD_FAILURE(); },
        [&](const std::runtime_error&) { handled = true; },
        [](const std::exception&) { ADD_FAILURE(); });
  };

  expect_runtime_error_no_catch_all(ew_eptr);
  EXPECT_TRUE(handled);
  handled = false;
  expect_runtime_error_no_catch_all(ew_small);
  EXPECT_TRUE(handled);
  handled = false;
  expect_runtime_error_no_catch_all(ew_big);
  EXPECT_TRUE(handled);
  handled = false;

  auto expect_runtime_error_catch_non_std = [&](const exception_wrapper& ew) {
    ew.handle(
        [](const std::logic_error&) { ADD_FAILURE(); },
        [&](const std::runtime_error&) { handled = true; },
        [](const std::exception&) { ADD_FAILURE(); },
        [](const int&) { ADD_FAILURE(); });
  };

  expect_runtime_error_catch_non_std(ew_eptr);
  EXPECT_TRUE(handled);
  handled = false;
  expect_runtime_error_catch_non_std(ew_small);
  EXPECT_TRUE(handled);
  handled = false;
  expect_runtime_error_catch_non_std(ew_big);
  EXPECT_TRUE(handled);
  handled = false;

  // Test that an exception thrown from one handler is not caught by an
  // outer handler:
  auto expect_runtime_error_rethrow = [&](const exception_wrapper& ew) {
    ew.handle(
        [](const std::logic_error&) { ADD_FAILURE(); },
        [&](const std::runtime_error& e) {
          handled = true;
          throw e;
        },
        [](const std::exception&) { ADD_FAILURE(); });
  };

  EXPECT_THROW(expect_runtime_error_rethrow(ew_eptr), std::runtime_error);
  EXPECT_TRUE(handled);
  handled = false;
  EXPECT_THROW(expect_runtime_error_rethrow(ew_small), std::runtime_error);
  EXPECT_TRUE(handled);
  handled = false;
  EXPECT_THROW(expect_runtime_error_rethrow(ew_big), std::runtime_error);
  EXPECT_TRUE(handled);
}

TEST(ExceptionWrapper, handle_std_exception_unhandled) {
  auto ep = std::make_exception_ptr(std::exception{});
  exception_wrapper const ew_eptr(ep, from_eptr<std::exception>(ep));
  exception_wrapper const ew_small(std::exception{});

  bool handled = false;
  auto expect_runtime_error_yes_catch_all = [&](const exception_wrapper& ew) {
    ew.handle(
        [](const std::logic_error&) { ADD_FAILURE(); },
        [](const std::runtime_error&) { ADD_FAILURE(); },
        [&](...) { handled = true; });
  };

  expect_runtime_error_yes_catch_all(ew_eptr);
  EXPECT_TRUE(handled);
  handled = false;
  expect_runtime_error_yes_catch_all(ew_small);
  EXPECT_TRUE(handled);
}

TEST(ExceptionWrapper, handle_std_exception_propagated) {
  auto ep = std::make_exception_ptr(std::runtime_error{"hello world"});
  exception_wrapper const ew_eptr(ep, from_eptr<std::runtime_error>(ep));
  exception_wrapper const ew_small(std::runtime_error{"hello world"});
  exception_wrapper const ew_big(BigRuntimeError{"hello world"});

  try {
    ew_eptr.handle();
  } catch (const std::runtime_error&) {
    SUCCEED();
  } catch (const std::exception&) {
    ADD_FAILURE();
  }

  try {
    ew_small.handle();
  } catch (const std::runtime_error&) {
    SUCCEED();
  } catch (const std::exception&) {
    ADD_FAILURE();
  }

  try {
    ew_big.handle();
  } catch (const std::runtime_error&) {
    SUCCEED();
  } catch (const std::exception&) {
    ADD_FAILURE();
  }
}

TEST(ExceptionWrapper, handle_non_std_exception_small) {
  auto ep = std::make_exception_ptr(42);
  exception_wrapper const ew_eptr1(ep);
  exception_wrapper const ew_eptr2(ep, from_eptr<int>(ep));
  exception_wrapper const ew_small(folly::in_place, 42);
  bool handled = false;

  auto expect_int_yes_catch_all = [&](const exception_wrapper& ew) {
    ew.handle(
        [](const std::exception&) { ADD_FAILURE(); },
        [&](...) { handled = true; });
  };

  expect_int_yes_catch_all(ew_eptr1);
  EXPECT_TRUE(handled);
  handled = false;
  expect_int_yes_catch_all(ew_eptr2);
  EXPECT_TRUE(handled);
  handled = false;
  expect_int_yes_catch_all(ew_small);
  EXPECT_TRUE(handled);
  handled = false;

  auto expect_int_no_catch_all = [&](const exception_wrapper& ew) {
    ew.handle(
        [](const std::exception&) { ADD_FAILURE(); },
        [&](const int&) { handled = true; });
  };

  expect_int_no_catch_all(ew_eptr1);
  EXPECT_TRUE(handled);
  handled = false;
  expect_int_no_catch_all(ew_eptr2);
  EXPECT_TRUE(handled);
  handled = false;
  expect_int_no_catch_all(ew_small);
  EXPECT_TRUE(handled);
  handled = false;

  auto expect_int_no_catch_all_2 = [&](const exception_wrapper& ew) {
    ew.handle(
        [&](const int&) { handled = true; },
        [](const std::exception&) { ADD_FAILURE(); });
  };

  expect_int_no_catch_all_2(ew_eptr1);
  EXPECT_TRUE(handled);
  handled = false;
  expect_int_no_catch_all_2(ew_eptr2);
  EXPECT_TRUE(handled);
  handled = false;
  expect_int_no_catch_all_2(ew_small);
  EXPECT_TRUE(handled);
}

TEST(ExceptionWrapper, handle_non_std_exception_big) {
  auto ep = std::make_exception_ptr(BigNonStdError{});
  exception_wrapper const ew_eptr1(ep);
  exception_wrapper const ew_eptr2(ep, from_eptr<BigNonStdError>(ep));
  exception_wrapper const ew_big(folly::in_place, BigNonStdError{});
  bool handled = false;

  auto expect_int_yes_catch_all = [&](const exception_wrapper& ew) {
    ew.handle(
        [](const std::exception&) { ADD_FAILURE(); },
        [&](...) { handled = true; });
  };

  expect_int_yes_catch_all(ew_eptr1);
  EXPECT_TRUE(handled);
  handled = false;
  expect_int_yes_catch_all(ew_eptr2);
  EXPECT_TRUE(handled);
  handled = false;
  expect_int_yes_catch_all(ew_big);
  EXPECT_TRUE(handled);
  handled = false;

  auto expect_int_no_catch_all = [&](const exception_wrapper& ew) {
    ew.handle(
        [](const std::exception&) { ADD_FAILURE(); },
        [&](const BigNonStdError&) { handled = true; });
  };

  expect_int_no_catch_all(ew_eptr1);
  EXPECT_TRUE(handled);
  handled = false;
  expect_int_no_catch_all(ew_eptr2);
  EXPECT_TRUE(handled);
  handled = false;
  expect_int_no_catch_all(ew_big);
  EXPECT_TRUE(handled);
  handled = false;

  auto expect_int_no_catch_all_2 = [&](const exception_wrapper& ew) {
    ew.handle(
        [&](const BigNonStdError&) { handled = true; },
        [](const std::exception&) { ADD_FAILURE(); });
  };

  expect_int_no_catch_all_2(ew_eptr1);
  EXPECT_TRUE(handled);
  handled = false;
  expect_int_no_catch_all_2(ew_eptr2);
  EXPECT_TRUE(handled);
  handled = false;
  expect_int_no_catch_all_2(ew_big);
  EXPECT_TRUE(handled);
  handled = false;

  EXPECT_THROW(
      expect_int_no_catch_all_2(exception_wrapper{folly::in_place, 42}), int);
}

TEST(ExceptionWrapper, handle_non_std_exception_rethrow_base_derived) {
  auto ew = testNonStdException();
  bool handled = false;
  EXPECT_THROW(
      ew.handle(
          [&](const DerivedException& e) {
            handled = true;
            throw e;
          },
          [](const BaseException&) { ADD_FAILURE(); }),
      DerivedException);
  EXPECT_TRUE(handled);
  handled = false;
  EXPECT_THROW(
      ew.handle(
          [&](const DerivedException& e) {
            handled = true;
            throw e;
          },
          [](...) { ADD_FAILURE(); }),
      DerivedException);
  EXPECT_TRUE(handled);
}

TEST(ExceptionWrapper, self_swap_test) {
  exception_wrapper ew(std::runtime_error("hello world"));
  folly::swap(ew, ew);
  EXPECT_EQ(kRuntimeErrorClassName + ": hello world", ew.what());
  auto& ew2 = ew;
  ew = std::move(ew2); // should not crash
}
