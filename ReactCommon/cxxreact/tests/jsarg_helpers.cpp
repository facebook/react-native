/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <cxxreact/JsArgumentHelpers.h>

#include <folly/dynamic.h>

#include <gtest/gtest.h>
#include <algorithm>

using namespace std;
using namespace folly;
using namespace facebook::xplat;

#define EXPECT_JSAE(statement, exstr)                                         \
  do {                                                                        \
    try {                                                                     \
      statement;                                                              \
      FAIL() << "Expected JsArgumentException(" << (exstr) << ") not thrown"; \
    } catch (const JsArgumentException &ex) {                                 \
      EXPECT_EQ(ex.what(), std::string(exstr));                               \
    }                                                                         \
  } while (0) // let any other exception escape, gtest will deal.

TEST(JsArgumentHelpersTest, args) {
  const bool aBool = true;
  const int64_t anInt = 17;
  const double aDouble = 3.14;
  const string aString = "word";
  const dynamic anArray = dynamic::array("a", "b", "c");
  const dynamic anObject = dynamic::object("k1", "v1")("k2", "v2");
  const string aNumericString = to<string>(anInt);

  folly::dynamic args = dynamic::array(
      aBool, anInt, aDouble, aString, anArray, anObject, aNumericString);

  EXPECT_EQ(jsArgAsBool(args, 0), aBool);
  EXPECT_EQ(jsArgAsInt(args, 1), anInt);
  EXPECT_EQ(jsArgAsDouble(args, 2), aDouble);
  EXPECT_EQ(jsArgAsString(args, 3), aString);
  EXPECT_EQ(jsArgAsArray(args, 4), anArray);
  EXPECT_EQ(jsArgAsObject(args, 5), anObject);

  // const args
  const folly::dynamic &cargs = args;
  const folly::dynamic &a4 = jsArgAsArray(cargs, 4);
  EXPECT_EQ(a4, anArray);
  EXPECT_EQ(jsArgAsObject(cargs, 5), anObject);

  // helpers returning dynamic should return same object without copying
  EXPECT_EQ(&jsArgAsArray(args, 4), &(args[4]));
  EXPECT_EQ(&jsArgAsArray(cargs, 4), &(args[4]));

  // dynamics returned for mutable args should be mutable.  The test is that
  // this compiles.
  jsArgAsArray(args, 4)[2] = "d";
  jsArgAsArray(args, 4)[2] = "c";
  // These fail to compile due to constness.
  // jsArgAsArray(cargs, 4)[2] = "d";
  // jsArgAsArray(cargs, 4)[2] = "c";

  // ref-qualified member function tests
  EXPECT_EQ(jsArgN(args, 3, &folly::dynamic::getString), aString);
  EXPECT_EQ(jsArg(args[3], &folly::dynamic::getString), aString);

  // conversions
  EXPECT_EQ(jsArgAsDouble(args, 1), anInt * 1.0);
  EXPECT_EQ(jsArgAsString(args, 1), aNumericString);
  EXPECT_EQ(jsArgAsInt(args, 6), anInt);

  // Test exception messages.

  // out_of_range
  EXPECT_JSAE(
      jsArgAsBool(args, 7),
      "JavaScript provided 7 arguments for C++ method which references at least "
      "8 arguments: out of range in dynamic array");
  // Conv range_error (invalid value conversion)
  const std::string exhead = "Could not convert argument 3 to required type: ";
  const std::string extail = ": Invalid leading character: \"word\"";
  try {
    jsArgAsInt(args, 3);
    FAIL() << "Expected JsArgumentException(" << exhead << "..." << extail
           << ") not thrown";
  } catch (const JsArgumentException &ex) {
    const std::string exwhat = ex.what();

    EXPECT_GT(exwhat.size(), exhead.size());
    EXPECT_GT(exwhat.size(), extail.size());

    EXPECT_TRUE(std::equal(exhead.cbegin(), exhead.cend(), exwhat.cbegin()))
        << "JsArgumentException('" << exwhat << "') does not begin with '"
        << exhead << "'";
    EXPECT_TRUE(std::equal(extail.crbegin(), extail.crend(), exwhat.crbegin()))
        << "JsArgumentException('" << exwhat << "') does not end with '"
        << extail << "'";
  }
  // inconvertible types
  EXPECT_JSAE(
      jsArgAsArray(args, 2),
      "Argument 3 of type double is not required type Array");
  EXPECT_JSAE(
      jsArgAsInt(args, 4),
      "Error converting javascript arg 4 to C++: "
      "TypeError: expected dynamic type `int/double/bool/string', but had type `array'");
  // type predicate failure
  EXPECT_JSAE(
      jsArgAsObject(args, 4),
      "Argument 5 of type array is not required type Object");
}
