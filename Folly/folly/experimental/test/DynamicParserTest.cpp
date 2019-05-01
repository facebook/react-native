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
/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */
#include <folly/experimental/DynamicParser.h>
#include <folly/Optional.h>
#include <folly/experimental/TestUtil.h>
#include <folly/portability/GTest.h>

using namespace folly;

// NB Auto-conversions are exercised by all the tests, there's not a great
// reason to test all of them explicitly, since any uncaught bugs will fail
// at compile-time.

// See setAllowNonStringKeyErrors() -- most of the tests below presume that
// all keys in releaseErrors() are coerced to string.
void checkMaybeCoercedKeys(bool coerce, dynamic good_k, dynamic missing_k) {
  dynamic d = dynamic::object(good_k, 7);
  DynamicParser p(DynamicParser::OnError::RECORD, &d);
  p.setAllowNonStringKeyErrors(!coerce);
  auto coerce_fn = [coerce](dynamic k) -> dynamic {
    return coerce ? k.asString() : k;
  };

  // Key and value errors have different code paths, so exercise both.
  p.required(missing_k, [&]() {});
  p.required(good_k, [&]() { throw std::runtime_error("failsauce"); });
  auto errors = p.releaseErrors();

  auto parse_error = errors.at("nested").at(coerce_fn(good_k));
  EXPECT_EQ(d.at(good_k), parse_error.at("value"));
  EXPECT_PCRE_MATCH(".*failsauce.*", parse_error.at("error").getString());

  auto key_error = errors.at("key_errors").at(coerce_fn(missing_k));
  EXPECT_PCRE_MATCH(".*Couldn't find key .* in .*", key_error.getString());

  // clang-format off
  EXPECT_EQ(dynamic(dynamic::object
    ("nested", dynamic::object(coerce_fn(good_k), parse_error))
    ("key_errors", dynamic::object(coerce_fn(missing_k), key_error))
    ("value", d)
  ), errors);
  // clang-format on
}

void checkCoercedAndUncoercedKeys(dynamic good_k, dynamic missing_k) {
  checkMaybeCoercedKeys(true, good_k, missing_k);
  checkMaybeCoercedKeys(false, good_k, missing_k);
}

TEST(TestDynamicParser, CoercedAndUncoercedKeys) {
  // Check that both key errors and value errors are reported via
  checkCoercedAndUncoercedKeys("a", "b");
  checkCoercedAndUncoercedKeys(7, 5);
  checkCoercedAndUncoercedKeys(0.7, 0.5);
  checkCoercedAndUncoercedKeys(true, false);
}

TEST(TestDynamicParser, OnErrorThrowSuccess) {
  auto d = dynamic::array(dynamic::object("int", 5));
  DynamicParser p(DynamicParser::OnError::THROW, &d);
  folly::Optional<int64_t> i;
  p.required(0, [&]() { p.optional("int", [&](int64_t v) { i = v; }); });
  // With THROW, releaseErrors() isn't useful -- it's either empty or throws.
  EXPECT_EQ(dynamic(dynamic::object()), p.releaseErrors());
  EXPECT_EQ((int64_t)5, i);
}

TEST(TestDynamicParser, OnErrorThrowError) {
  auto d = dynamic::array(dynamic::object("int", "fail"));
  DynamicParser p(DynamicParser::OnError::THROW, &d);
  try {
    // Force the exception to bubble up through a couple levels of nesting.
    p.required(0, [&]() { p.optional("int", [&](int64_t) {}); });
    FAIL() << "Should have thrown";
  } catch (const DynamicParserParseError& ex) {
    auto error = ex.error();
    const auto& message =
        error.at("nested").at("0").at("nested").at("int").at("error");
    EXPECT_PCRE_MATCH(".*Invalid leading.*", message.getString());
    EXPECT_PCRE_MATCH(
        "DynamicParserParseError: .*Invalid leading.*", ex.what());
    // clang-format off
    EXPECT_EQ(dynamic(dynamic::object
      ("nested", dynamic::object
        ("0", dynamic::object
          ("nested", dynamic::object
            ("int", dynamic::object
              ("error", message)("value", "fail")))))), error);
    // clang-format on
    EXPECT_THROW(p.releaseErrors(), DynamicParserLogicError)
        << "THROW releases the first error eagerly, and throws";
  }
}

// Errors & exceptions are best tested separately, but squeezing all the
// features into one test is good for exercising nesting.
TEST(TestDynamicParser, AllParserFeaturesSuccess) {
  // Input
  auto d = dynamic::array(
      dynamic::object("a", 7)("b", 9)("c", 13.3),
      5,
      dynamic::array("x", "y", 1, "z"),
      dynamic::object("int", 7)("false", 0)("true", true)("str", "s"),
      dynamic::object("bools", dynamic::array(false, true, 0, 1)));
  // Outputs, in the same order as the inputs.
  std::map<std::string, double> doubles;
  folly::Optional<int64_t> outer_int;
  std::vector<std::string> strings;
  folly::Optional<int64_t> inner_int;
  folly::Optional<bool> inner_false;
  folly::Optional<bool> inner_true;
  folly::Optional<std::string> inner_str;
  std::vector<bool> bools;
  // Parse and verify some invariants
  DynamicParser p(DynamicParser::OnError::RECORD, &d);
  EXPECT_EQ(d, p.value());
  p.required(0, [&](const dynamic& v) {
    EXPECT_EQ(0, p.key().getInt());
    EXPECT_EQ(v, p.value());
    p.objectItems([&](const std::string& k, double v2) {
      EXPECT_EQ(k, p.key().getString());
      EXPECT_EQ(v2, p.value().asDouble());
      doubles.emplace(k, v2);
    });
  });
  p.required(1, [&](int64_t k, int64_t v) {
    EXPECT_EQ(1, k);
    EXPECT_EQ(1, p.key().getInt());
    EXPECT_EQ(5, p.value().getInt());
    outer_int = v;
  });
  p.optional(2, [&](const dynamic& v) {
    EXPECT_EQ(2, p.key().getInt());
    EXPECT_EQ(v, p.value());
    p.arrayItems([&](int64_t k, const std::string& v2) {
      EXPECT_EQ(strings.size(), k);
      EXPECT_EQ(k, p.key().getInt());
      EXPECT_EQ(v2, p.value().asString());
      strings.emplace_back(v2);
    });
  });
  p.required(3, [&](const dynamic& v) {
    EXPECT_EQ(3, p.key().getInt());
    EXPECT_EQ(v, p.value());
    p.optional("int", [&](const std::string& k, int64_t v2) {
      EXPECT_EQ("int", p.key().getString());
      EXPECT_EQ(k, p.key().getString());
      EXPECT_EQ(v2, p.value().getInt());
      inner_int = v2;
    });
    p.required("false", [&](const std::string& k, bool v2) {
      EXPECT_EQ("false", p.key().getString());
      EXPECT_EQ(k, p.key().getString());
      EXPECT_EQ(v2, p.value().asBool());
      inner_false = v2;
    });
    p.required("true", [&](const std::string& k, bool v2) {
      EXPECT_EQ("true", p.key().getString());
      EXPECT_EQ(k, p.key().getString());
      EXPECT_EQ(v2, p.value().getBool());
      inner_true = v2;
    });
    p.required("str", [&](const std::string& k, const std::string& v2) {
      EXPECT_EQ("str", p.key().getString());
      EXPECT_EQ(k, p.key().getString());
      EXPECT_EQ(v2, p.value().getString());
      inner_str = v2;
    });
    p.optional("not set", [&](bool) { FAIL() << "No key 'not set'"; });
  });
  p.required(4, [&](const dynamic& v) {
    EXPECT_EQ(4, p.key().getInt());
    EXPECT_EQ(v, p.value());
    p.optional("bools", [&](const std::string& k, const dynamic& v2) {
      EXPECT_EQ(std::string("bools"), k);
      EXPECT_EQ(k, p.key().getString());
      EXPECT_EQ(v2, p.value());
      p.arrayItems([&](int64_t k2, bool v3) {
        EXPECT_EQ(bools.size(), k2);
        EXPECT_EQ(k2, p.key().getInt());
        EXPECT_EQ(v3, p.value().asBool());
        bools.push_back(v3);
      });
    });
  });
  p.optional(5, [&](int64_t) { FAIL() << "Index 5 does not exist"; });
  // Confirm the parse
  EXPECT_EQ(dynamic(dynamic::object()), p.releaseErrors());
  EXPECT_EQ((decltype(doubles){{"a", 7.}, {"b", 9.}, {"c", 13.3}}), doubles);
  EXPECT_EQ((int64_t)5, outer_int);
  EXPECT_EQ((decltype(strings){"x", "y", "1", "z"}), strings);
  EXPECT_EQ((int64_t)7, inner_int);
  EXPECT_FALSE(inner_false.value());
  EXPECT_TRUE(inner_true.value());
  EXPECT_EQ(std::string("s"), inner_str);
  EXPECT_EQ(std::string("s"), inner_str);
  EXPECT_EQ((decltype(bools){false, true, false, true}), bools);
}

// We can hit multiple key lookup errors, but only one parse error.
template <typename Fn>
void checkXYKeyErrorsAndParseError(
    const dynamic& d,
    Fn fn,
    std::string key_re,
    std::string parse_re) {
  DynamicParser p(DynamicParser::OnError::RECORD, &d);
  fn(p);
  auto errors = p.releaseErrors();
  auto x_key_msg = errors.at("key_errors").at("x");
  EXPECT_PCRE_MATCH(key_re, x_key_msg.getString());
  auto y_key_msg = errors.at("key_errors").at("y");
  EXPECT_PCRE_MATCH(key_re, y_key_msg.getString());
  auto parse_msg = errors.at("error");
  EXPECT_PCRE_MATCH(parse_re, parse_msg.getString());
  // clang-format off
  EXPECT_EQ(dynamic(dynamic::object
    ("key_errors", dynamic::object("x", x_key_msg)("y", y_key_msg))
    ("error", parse_msg)
    ("value", d)), errors);
  // clang-format on
}

// Exercise key errors for optional / required, and outer parse errors for
// arrayItems / objectItems.
TEST(TestDynamicParser, TestKeyAndParseErrors) {
  checkXYKeyErrorsAndParseError(
      dynamic::object(),
      [&](DynamicParser& p) {
        p.required("x", [&]() {}); // key
        p.required("y", [&]() {}); // key
        p.arrayItems([&]() {}); // parse
      },
      "Couldn't find key (x|y) .*",
      "^TypeError: .*");
  checkXYKeyErrorsAndParseError(
      dynamic::array(),
      [&](DynamicParser& p) {
        p.optional("x", [&]() {}); // key
        p.optional("y", [&]() {}); // key
        p.objectItems([&]() {}); // parse
      },
      "^TypeError: .*",
      "^TypeError: .*");
}

// TestKeyAndParseErrors covered required/optional key errors, so only parse
// errors remain.
TEST(TestDynamicParser, TestRequiredOptionalParseErrors) {
  dynamic d = dynamic::object("x", dynamic::array())("y", "z")("z", 1);
  DynamicParser p(DynamicParser::OnError::RECORD, &d);
  p.required("x", [&](bool) {});
  p.required("y", [&](int64_t) {});
  p.required("z", [&](int64_t) { throw std::runtime_error("CUSTOM"); });
  auto errors = p.releaseErrors();
  auto get_expected_error_fn = [&](const dynamic& k, std::string pcre) {
    auto error = errors.at("nested").at(k);
    EXPECT_EQ(d.at(k), error.at("value"));
    EXPECT_PCRE_MATCH(pcre, error.at("error").getString());
    return dynamic::object("value", d.at(k))("error", error.at("error"));
  };
  // clang-format off
  EXPECT_EQ(dynamic(dynamic::object("nested", dynamic::object
    ("x", get_expected_error_fn("x", "TypeError: .* but had type `array'"))
    ("y", get_expected_error_fn("y", ".*Invalid leading character.*"))
    ("z", get_expected_error_fn("z", "CUSTOM")))), errors);
  // clang-format on
}

template <typename Fn>
void checkItemParseError(
    // real_k can differ from err_k, which is typically coerced to string
    dynamic d,
    Fn fn,
    dynamic real_k,
    dynamic err_k,
    std::string re) {
  DynamicParser p(DynamicParser::OnError::RECORD, &d);
  fn(p);
  auto errors = p.releaseErrors();
  auto error = errors.at("nested").at(err_k);
  EXPECT_EQ(d.at(real_k), error.at("value"));
  EXPECT_PCRE_MATCH(re, error.at("error").getString());
  // clang-format off
  EXPECT_EQ(dynamic(dynamic::object("nested", dynamic::object(
    err_k, dynamic::object("value", d.at(real_k))("error", error.at("error"))
  ))), errors);
  // clang-format on
}

// TestKeyAndParseErrors covered outer parse errors for {object,array}Items,
// which are the only high-level API cases uncovered by
// TestKeyAndParseErrors and TestRequiredOptionalParseErrors.
TEST(TestDynamicParser, TestItemParseErrors) {
  checkItemParseError(
      dynamic::object("string", dynamic::array("not", "actually")),
      [&](DynamicParser& p) {
        p.objectItems([&](const std::string&, const std::string&) {});
      },
      "string",
      "string",
      "TypeError: .* but had type `array'");
  checkItemParseError(
      dynamic::array("this is not a bool"),
      [&](DynamicParser& p) { p.arrayItems([&](int64_t, bool) {}); },
      0,
      "0",
      ".*Non-whitespace.*");
}

// The goal is to exercise the sub-error materialization logic pretty well
TEST(TestDynamicParser, TestErrorNesting) {
  // clang-format off
  dynamic d = dynamic::object
    ("x", dynamic::array(
      dynamic::object("y", dynamic::object("z", "non-object"))
    ))
    ("k", false);
  // clang-format on
  DynamicParser p(DynamicParser::OnError::RECORD, &d);
  // Start with a couple of successful nests, building up unmaterialized
  // error objects.
  p.required("x", [&]() {
    p.arrayItems([&]() {
      p.optional("y", [&]() {
        // First, a key error
        p.required("not a key", []() {});
        // Nest again more to test partially materialized errors.
        p.objectItems([&]() { p.optional("akey", []() {}); });
        throw std::runtime_error("custom parse error");
      });
      // Key error inside fully materialized errors
      p.required("also not a key", []() {});
      throw std::runtime_error("another parse error");
    });
  });
  p.required("non-key", []() {}); // Top-level key error
  p.optional("k", [&](int64_t, bool) {}); // Non-int key for good measure
  auto errors = p.releaseErrors();

  auto& base = errors.at("nested").at("x").at("nested").at("0");
  auto inner_key_err =
      base.at("nested").at("y").at("key_errors").at("not a key");
  auto innermost_key_err = base.at("nested")
                               .at("y")
                               .at("nested")
                               .at("z")
                               .at("key_errors")
                               .at("akey");
  auto outer_key_err = base.at("key_errors").at("also not a key");
  auto root_key_err = errors.at("key_errors").at("non-key");
  auto k_parse_err = errors.at("nested").at("k").at("error");

  // clang-format off
  EXPECT_EQ(dynamic(dynamic::object
    ("nested", dynamic::object
        ("x", dynamic::object("nested", dynamic::object("0", dynamic::object
          ("nested", dynamic::object("y", dynamic::object
            ("nested", dynamic::object("z", dynamic::object
              ("key_errors", dynamic::object("akey", innermost_key_err))
              ("value", "non-object")
            ))
            ("key_errors", dynamic::object("not a key", inner_key_err))
            ("error", "custom parse error")
            ("value", dynamic::object("z", "non-object"))
          ))
          ("key_errors", dynamic::object("also not a key", outer_key_err))
          ("error", "another parse error")
          ("value", dynamic::object("y", dynamic::object("z", "non-object")))
        )))
        ("k", dynamic::object("error", k_parse_err)("value", false)))
    ("key_errors", dynamic::object("non-key", root_key_err))
    ("value", d)
  ), errors);
  // clang-format on
}

TEST(TestDynamicParser, TestRecordThrowOnDoubleParseErrors) {
  dynamic d = nullptr;
  DynamicParser p(DynamicParser::OnError::RECORD, &d);
  p.arrayItems([&]() {});
  try {
    p.objectItems([&]() {});
    FAIL() << "Should throw on double-parsing a value with an error";
  } catch (const DynamicParserLogicError& ex) {
    EXPECT_PCRE_MATCH(".*Overwriting error: TypeError: .*", ex.what());
  }
}

TEST(TestDynamicParser, TestRecordThrowOnChangingValue) {
  dynamic d = nullptr;
  DynamicParser p(DynamicParser::OnError::RECORD, &d);
  p.required("x", [&]() {}); // Key error sets "value"
  d = 5;
  try {
    p.objectItems([&]() {}); // Will detect the changed value
    FAIL() << "Should throw on second error with a changing value";
  } catch (const DynamicParserLogicError& ex) {
    EXPECT_PCRE_MATCH(
        // Accept 0 or null since folly used to mis-print null as 0.
        ".*Overwriting value: (0|null) with 5 for error TypeError: .*",
        ex.what());
  }
}

TEST(TestDynamicParser, TestThrowOnReleaseWhileParsing) {
  auto d = dynamic::array(1);
  DynamicParser p(DynamicParser::OnError::RECORD, &d);
  EXPECT_THROW(
      p.arrayItems([&]() { p.releaseErrors(); }), DynamicParserLogicError);
}

TEST(TestDynamicParser, TestThrowOnReleaseTwice) {
  dynamic d = nullptr;
  DynamicParser p(DynamicParser::OnError::RECORD, &d);
  p.releaseErrors();
  EXPECT_THROW(p.releaseErrors(), DynamicParserLogicError);
}

TEST(TestDynamicParser, TestThrowOnNullValue) {
  dynamic d = nullptr;
  DynamicParser p(DynamicParser::OnError::RECORD, &d);
  p.releaseErrors();
  EXPECT_THROW(p.value(), DynamicParserLogicError);
}

TEST(TestDynamicParser, TestThrowOnKeyOutsideCallback) {
  dynamic d = nullptr;
  DynamicParser p(DynamicParser::OnError::RECORD, &d);
  EXPECT_THROW(p.key(), DynamicParserLogicError);
}
