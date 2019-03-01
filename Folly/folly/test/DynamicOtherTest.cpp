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

#include <folly/dynamic.h>

#include <folly/gen/Base.h>
#include <folly/json.h>
#include <folly/portability/GFlags.h>
#include <folly/portability/GTest.h>

#include <iostream>

using folly::dynamic;
using folly::TypeError;

TEST(Dynamic, ArrayGenerator) {
  // Make sure arrays can be used with folly::gen.
  using namespace folly::gen;
  dynamic arr = dynamic::array(1, 2, 3, 4);
  EXPECT_EQ(from(arr) | take(3) | member(&dynamic::asInt) | sum, 6);
}

TEST(Dynamic, StringPtrs) {
  dynamic str = "12.0";
  dynamic num = 12.0;
  dynamic nullStr = folly::parseJson("\"foo\\u0000bar\"");

  EXPECT_EQ(0, strcmp(str.c_str(), "12.0"));
  EXPECT_EQ(0, strncmp(str.data(), "12.0", str.asString().length()));
  EXPECT_EQ(str.stringPiece(), "12.0");

  EXPECT_THROW(num.c_str(), TypeError);
  EXPECT_THROW(num.data(), TypeError);
  EXPECT_THROW(num.stringPiece(), TypeError);

  EXPECT_EQ(nullStr.stringPiece(), folly::StringPiece("foo\0bar", 7));

  nullStr.getString()[3] = '|';
  EXPECT_EQ(nullStr.stringPiece(), "foo|bar");
}

TEST(Dynamic, Getters) {
  dynamic dStr = folly::parseJson("\"foo\\u0000bar\"");
  dynamic dInt = 1;
  dynamic dDouble = 0.5;
  dynamic dBool = true;

  EXPECT_EQ(dStr.getString(), std::string("foo\0bar", 7));
  EXPECT_EQ(dInt.getInt(), 1);
  EXPECT_EQ(dDouble.getDouble(), 0.5);
  EXPECT_EQ(dBool.getBool(), true);

  dStr.getString()[3] = '|';
  EXPECT_EQ(dStr.getString(), "foo|bar");

  dInt.getInt() = 2;
  EXPECT_EQ(dInt.getInt(), 2);

  dDouble.getDouble() = 0.7;
  EXPECT_EQ(dDouble.getDouble(), 0.7);

  dBool.getBool() = false;
  EXPECT_EQ(dBool.getBool(), false);

  EXPECT_THROW(dStr.getInt(), TypeError);
  EXPECT_THROW(dStr.getDouble(), TypeError);
  EXPECT_THROW(dStr.getBool(), TypeError);

  EXPECT_THROW(dInt.getString(), TypeError);
  EXPECT_THROW(dInt.getDouble(), TypeError);
  EXPECT_THROW(dInt.getBool(), TypeError);

  EXPECT_THROW(dDouble.getString(), TypeError);
  EXPECT_THROW(dDouble.getInt(), TypeError);
  EXPECT_THROW(dDouble.getBool(), TypeError);

  EXPECT_THROW(dBool.getString(), TypeError);
  EXPECT_THROW(dBool.getInt(), TypeError);
  EXPECT_THROW(dBool.getDouble(), TypeError);
}

TEST(Dynamic, FormattedIO) {
  std::ostringstream out;
  dynamic doubl = 123.33;
  dynamic dint = 12;
  out << "0x" << std::hex << ++dint << ' ' << std::setprecision(1)
      << doubl << '\n';
  EXPECT_EQ(out.str(), "0xd 1e+02\n");

  out.str("");
  dynamic arrr = dynamic::array(1, 2, 3);
  out << arrr;
  EXPECT_EQ(out.str(), "[1,2,3]");

  out.str("");
  dynamic objy = dynamic::object("a", 12);
  out << objy;
  EXPECT_EQ(out.str(), R"({"a":12})");

  out.str("");
  dynamic objy2 = dynamic::array(objy,
                                 dynamic::object(12, "str"),
                                 dynamic::object(true, false));
  out << objy2;
  EXPECT_EQ(out.str(), R"([{"a":12},{12:"str"},{true:false}])");
}

int main(int argc, char** argv) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  return RUN_ALL_TESTS();
}
