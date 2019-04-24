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

//
// Author: eniebler@fb.com

#include <folly/FixedString.h>
#include <folly/portability/GTest.h>

#define FS(x) ::folly::makeFixedString(x)
using namespace folly::string_literals;

TEST(FixedStringExamples, Examples) {
  // Example from the docs:
  using namespace folly;
  constexpr auto hello = makeFixedString("hello"); // a FixedString<5>
  constexpr auto world = makeFixedString("world"); // another FixedString<5>
  constexpr auto hello_world = hello + ' ' + world + '!';
  static_assert(hello_world == "hello world!", "w00t");
  EXPECT_STREQ("hello world!", hello_world.c_str());

  FixedString<10> test{"****"};
  test.replace(1, 2, "!!!!");
  EXPECT_STREQ("*!!!!*", test.c_str());
  static_assert(makeFixedString("****").creplace(1, 2, "!!!!") == "*!!!!*", "");
}

TEST(FixedStringCtorTest, Default) {
  constexpr folly::FixedString<42> s{};
  static_assert(s[0] == '\0', "");
  static_assert(s.size() == 0u, "");

  constexpr auto s2 = s;
  static_assert(s2[0] == '\0', "");
  static_assert(s2.size() == 0u, "");
}

TEST(FixedStringCtorTest, FromLiterals) {
  constexpr folly::FixedString<42> s{"hello world"};
  static_assert(s[0] == 'h', "");
  constexpr folly::FixedString<11> s2{"hello world"};
  static_assert(s2[0] == 'h', "");
  static_assert(s2[10] == 'd', "");
  static_assert(s2[11] == '\0', "");

  // Does not compile, hurray! :-)
  // constexpr char a[1] = {'a'};
  // constexpr folly::FixedString<10> s3(a);
}

TEST(FixedStringCtorTest, FromPtrAndLength) {
  constexpr folly::FixedString<11> s{"hello world", 11};
  static_assert(s[0] == 'h', "");
  static_assert(s[10] == 'd', "");
  static_assert(s[11] == '\0', "");
  static_assert(s.size() == 11u, "");

  constexpr folly::FixedString<5> s2{"hello world", 5};
  static_assert(s2[0] == 'h', "");
  static_assert(s2[4] == 'o', "");
  static_assert(s2[5] == '\0', "");
  static_assert(s2.size() == 5u, "");

  constexpr folly::FixedString<20> s3{"hello world", 5};
  static_assert(s2[0] == 'h', "");
  static_assert(s2[4] == 'o', "");
  static_assert(s2[5] == '\0', "");
  static_assert(s2.size() == 5u, "");

  static_assert("hello" == s3, "");
  static_assert(s3 == "hello", "");
  static_assert(s3 == s2, "");
  static_assert("hell" != s3, "");
  static_assert(s3 != "helloooo", "");
  static_assert(!(s3 != s2), "");
}

TEST(FixedStringCtorTest, FromStringAndOffset) {
  constexpr folly::FixedString<11> s{"hello world"};
  constexpr folly::FixedString<5> s2{s, 6u, npos};
  static_assert(s2 == "world", "");
  constexpr folly::FixedString<0> s3{s, 11u, npos};
  static_assert(s3 == "", "");
  // Out of bounds offset, does not compile
  // constexpr folly::FixedString<0> s4{s, 12};
}

TEST(FixedStringCtorTest, FromStringOffsetAndCount) {
  constexpr folly::FixedString<11> s{"hello world"};
  constexpr folly::FixedString<4> s2{s, 6u, 4u};
  static_assert(s2 == "worl", "");
  constexpr folly::FixedString<5> s3{s, 6u, 5u};
  static_assert(s3 == "world", "");
  // Out of bounds count, does not compile:
  // constexpr folly::FixedString<5> s4{s, 6, 6};
}

TEST(FixedStringCtorTest, FromInitializerList) {
  constexpr folly::FixedString<11> s{
      'h', 'e', 'l', 'l', 'o', ' ', 'w', 'o', 'r', 'l', 'd'};
  static_assert(s == "hello world", "");
  // Out of bounds count, does not compile:
  // constexpr folly::FixedString<10> s{
  //     {'h','e','l','l','o',' ','w','o','r','l','d'}};
}

TEST(FixedStringCtorTest, FromUDL) {
  using namespace folly::literals;
#if defined(__GNUC__)
  constexpr auto x = "hello"_fs;
  static_assert(
      std::is_same<decltype(x), const folly::FixedString<5>>::value, "");
  static_assert(x[0] == 'h', "");
  static_assert(x[1] == 'e', "");
  static_assert(x[2] == 'l', "");
  static_assert(x[3] == 'l', "");
  static_assert(x[4] == 'o', "");
  static_assert(x[5] == '\0', "");
  static_assert(x.size() == 5u, "");
#endif

  constexpr auto y = "goodbye"_fs8;
  static_assert(
      std::is_same<decltype(y), const folly::FixedString<8>>::value, "");
  static_assert(y.size() == 7u, "");
  static_assert(y == "goodbye", "");

  constexpr auto z = "now is the time for all good llamas"_fs64;
  static_assert(
      std::is_same<decltype(z), const folly::FixedString<64>>::value, "");
  static_assert(z.size() == 35u, "");
  static_assert(z == "now is the time for all good llamas", "");
}

TEST(FixedStringConcatTest, FromStringAndLiteral) {
  constexpr folly::FixedString<42> s{"hello world"};
  constexpr auto res = s + "!!!";
  static_assert(res.size() == 14u, "");
  static_assert(res == "hello world!!!", "");
}

TEST(FixedStringConcatTest, FromTwoStrings) {
  constexpr folly::FixedString<42> s{"hello world"};
  constexpr auto res = s + "!!!";
  static_assert(res.size() == 14u, "");
  static_assert(res == "hello world!!!", "");
}

#if FOLLY_USE_CPP14_CONSTEXPR
constexpr folly::FixedString<20> constexpr_swap_test() {
  folly::FixedString<10> tmp1{"hello"}, tmp2{"world!"};
  tmp2.swap(tmp1);
  return tmp1 + tmp2;
}

TEST(FixedStringSwapTest, ConstexprSwap) {
  static_assert(constexpr_swap_test() == "world!hello", "");
}
#endif

TEST(FixedStringSwapTest, RuntimeSwap) {
  folly::FixedString<10> tmp1{"hello"}, tmp2{"world!"};
  tmp2.swap(tmp1);
  EXPECT_STREQ((tmp1 + tmp2).c_str(), "world!hello");
}

#if FOLLY_USE_CPP14_CONSTEXPR
constexpr folly::FixedString<10> constexpr_assign_string_test_1() {
  folly::FixedString<10> tmp1, tmp2{"world!"};
  tmp1 = tmp2;
  return tmp1;
}
constexpr folly::FixedString<10> constexpr_assign_string_test_2() {
  folly::FixedString<10> tmp{"aaaaaaaaaa"};
  tmp.assign("hello"_fs8);
  return tmp;
}
constexpr folly::FixedString<10> constexpr_assign_string_test_3() {
  folly::FixedString<10> tmp{"aaaaaaaaaa"};
  tmp.assign("goodbye"_fs8, 3u, 2u);
  return tmp;
}
constexpr folly::FixedString<10> constexpr_assign_string_test_4() {
  folly::FixedString<10> tmp{"aaaaaaaaaa"};
  tmp.assign("goodbye"_fs8, 3u, npos);
  return tmp;
}

TEST(FixedStringAssignTest, ConstexprAssignString) {
  static_assert(constexpr_assign_string_test_1() == "world!", "");
  static_assert(constexpr_assign_string_test_2() == "hello", "");
  static_assert(constexpr_assign_string_test_3() == "db", "");
  static_assert(constexpr_assign_string_test_4() == "dbye", "");
}
#endif

TEST(FixedStringAssignTest, RuntimeAssignString) {
  folly::FixedString<10> tmp1, tmp2{"world!"};
  tmp1 = tmp2;
  EXPECT_STREQ(tmp1.c_str(), "world!");
  tmp1.assign("goodbye"_fs8);
  EXPECT_STREQ("goodbye", tmp1.c_str());
  tmp1.assign("goodbye"_fs8, 3u, npos);
  EXPECT_STREQ("dbye", tmp1.c_str());
  tmp1.assign("goodbye"_fs8, 3u, 3u);
  EXPECT_STREQ("dby", tmp1.c_str());
}

#if FOLLY_USE_CPP14_CONSTEXPR
constexpr folly::FixedString<10> constexpr_assign_literal_test_1() {
  folly::FixedString<10> tmp{"aaaaaaaaaa"};
  tmp = "hello";
  // Not null-terminated, does not compile:
  // using C = const char[1];
  // tmp = C{'a'};
  return tmp;
}
constexpr folly::FixedString<10> constexpr_assign_literal_test_2() {
  folly::FixedString<10> tmp{"aaaaaaaaaa"};
  tmp.assign("hello");
  return tmp;
}
constexpr folly::FixedString<10> constexpr_assign_literal_test_3() {
  folly::FixedString<10> tmp{"aaaaaaaaaa"};
  tmp.assign("goodbye", 4u);
  return tmp;
}

TEST(FixedStringAssignTest, ConstexprAssignLiteral) {
  static_assert(constexpr_assign_literal_test_1() == "hello", "");
  static_assert(constexpr_assign_literal_test_2() == "hello", "");
  static_assert(constexpr_assign_literal_test_3() == "good", "");
}
#endif

TEST(FixedStringAssignTest, RuntimeAssignLiteral) {
  folly::FixedString<10> tmp{"aaaaaaaaaa"};
  tmp = "hello";
  EXPECT_STREQ("hello", tmp.c_str());
  tmp.assign("goodbye");
  EXPECT_STREQ("goodbye", tmp.c_str());
  tmp.assign("goodbye", 4u);
  EXPECT_STREQ("good", tmp.c_str());
}

TEST(FixedStringIndexTest, Index) {
  constexpr folly::FixedString<11> digits{"0123456789"};
  static_assert(digits[0] == '0', "");
  static_assert(digits[1] == '1', "");
  static_assert(digits[2] == '2', "");
  static_assert(digits[9] == '9', "");
  static_assert(digits[10] == '\0', "");
#ifdef NDEBUG
  // This should be allowed and work in constexpr mode since the internal array
  // is actually big enough and op[] does no parameter validation:
  static_assert(digits[11] == '\0', "");
#endif

  static_assert(digits.at(0) == '0', "");
  static_assert(digits.at(1) == '1', "");
  static_assert(digits.at(2) == '2', "");
  static_assert(digits.at(9) == '9', "");
  static_assert(digits.at(10) == '\0', "");
  EXPECT_THROW(digits.at(11), std::out_of_range);
}

TEST(FixedStringCompareTest, Compare) {
  constexpr folly::FixedString<10> tmp1{"aaaaaaaaaa"};
  constexpr folly::FixedString<12> tmp2{"aaaaaaaaaba"};
  static_assert(-1 == tmp1.compare(tmp2), "");
  static_assert(1 == tmp2.compare(tmp1), "");
  static_assert(0 == tmp2.compare(tmp2), "");
  static_assert(tmp1 < tmp2, "");
  static_assert(tmp1 <= tmp2, "");
  static_assert(tmp2 > tmp1, "");
  static_assert(tmp2 >= tmp1, "");
  static_assert(tmp2 == tmp2, ""); // @nolint
  static_assert(tmp2 <= tmp2, ""); // @nolint
  static_assert(tmp2 >= tmp2, ""); // @nolint
  static_assert(!(tmp2 < tmp2), "");
  static_assert(!(tmp2 > tmp2), "");

  constexpr folly::FixedString<10> tmp3{"aaa"};
  constexpr folly::FixedString<12> tmp4{"aaaa"};
  static_assert(-1 == tmp3.compare(tmp4), "");
  static_assert(1 == tmp4.compare(tmp3), "");
  static_assert(tmp3 < tmp4, "");
  static_assert(tmp3 <= tmp4, "");
  static_assert(tmp4 > tmp3, "");
  static_assert(tmp4 >= tmp3, "");
  static_assert(tmp3 < "aaaa", "");
  static_assert(tmp3 <= "aaaa", "");
  static_assert(!(tmp3 == tmp4), "");
  static_assert(tmp3 != tmp4, "");
  static_assert("aaaa" > tmp3, "");
  static_assert("aaaa" >= tmp3, "");
  static_assert("aaaa" != tmp3, "");
  static_assert("aaa" == tmp3, "");
  static_assert(tmp3 != "aaaa", "");
  static_assert(tmp3 == "aaa", "");
}

TEST(FixedStringCompareTest, CompareStdString) {
  constexpr folly::FixedString<10> tmp1{"aaaaaaaaaa"};
  std::string const tmp2{"aaaaaaaaaba"};
  EXPECT_EQ(-1, tmp1.compare(tmp2));
  // These are specifically testing the operators, and so we can't rely
  // on whever the implementation details of EXPECT_<OP> might be.
  EXPECT_FALSE(tmp1 == tmp2);
  EXPECT_FALSE(tmp2 == tmp1);
  EXPECT_TRUE(tmp1 != tmp2);
  EXPECT_TRUE(tmp2 != tmp1);
  EXPECT_TRUE(tmp1 < tmp2);
  EXPECT_FALSE(tmp2 < tmp1);
  EXPECT_TRUE(tmp1 <= tmp2);
  EXPECT_FALSE(tmp2 <= tmp1);
  EXPECT_FALSE(tmp1 > tmp2);
  EXPECT_TRUE(tmp2 > tmp1);
  EXPECT_FALSE(tmp1 >= tmp2);
  EXPECT_TRUE(tmp2 >= tmp1);
}

#if FOLLY_USE_CPP14_CONSTEXPR
constexpr folly::FixedString<20> constexpr_append_string_test() {
  folly::FixedString<20> a{"hello"}, b{"X world!"};
  a.append(1u, ' ');
  a.append(b, 2u, 5u);
  a.append(b, 7u, 1u);
  return a;
}

TEST(FixedStringAssignTest, ConstexprAppendString) {
  static_assert(constexpr_append_string_test() == "hello world!", "");
}
#endif

TEST(FixedStringAssignTest, RuntimeAppendString) {
  folly::FixedString<20> a{"hello"}, b{"X world!"};
  a.append(1u, ' ');
  a.append(b, 2u, 5u);
  a.append(b, 7u, 1u);
  EXPECT_STREQ("hello world!", a.c_str());
}

#if FOLLY_USE_CPP14_CONSTEXPR
constexpr folly::FixedString<20> constexpr_append_literal_test() {
  folly::FixedString<20> a{"hello"};
  a.append(1u, ' ');
  a.append("X world!" + 2u, 5u);
  a.append("X world!" + 7u);
  return a;
}

TEST(FixedStringAssignTest, ConstexprAppendLiteral) {
  static_assert(constexpr_append_literal_test() == "hello world!", "");
}
#endif

TEST(FixedStringAssignTest, RuntimeAppendLiteral) {
  folly::FixedString<20> a{"hello"};
  a.append(1u, ' ');
  a.append("X world!" + 2u, 5u);
  a.append("X world!" + 7u);
  EXPECT_STREQ("hello world!", a.c_str());
}

TEST(FixedStringCAppendTest, CAppendString) {
  constexpr folly::FixedString<10> a{"hello"}, b{"X world!"};
  constexpr auto tmp1 = a.cappend(' ');
  constexpr auto tmp2 = tmp1.cappend(b, 2u, 5u);
  constexpr auto tmp3 = tmp2.cappend(b, 7u, 1u);
  static_assert(tmp3 == "hello world!", "");
}

TEST(FixedStringCAppendTest, CAppendLiteral) {
  constexpr folly::FixedString<10> a{"hello"};
  constexpr auto tmp1 = a.cappend(' ');
  constexpr auto tmp2 = tmp1.cappend("X world!", 2u, 5u);
  constexpr auto tmp3 = tmp2.cappend("X world!", 7u, 1u);
  static_assert(tmp3 == "hello world!", "");
}

#if FOLLY_USE_CPP14_CONSTEXPR
constexpr folly::FixedString<10> constexpr_replace_string_test() {
  folly::FixedString<10> tmp{"abcdefghij"};
  tmp.replace(1, 5, FS("XX"));
  return tmp;
}

TEST(FixedStringReplaceTest, ConstexprReplaceString) {
  static_assert(constexpr_replace_string_test().size() == 7u, "");
  static_assert(constexpr_replace_string_test() == "aXXghij", "");
}
#endif

TEST(FixedStringReplaceTest, RuntimeReplaceString) {
  folly::FixedString<10> tmp{"abcdefghij"};
  tmp.replace(1, 5, FS("XX"));
  EXPECT_EQ(7u, tmp.size());
  EXPECT_STREQ("aXXghij", tmp.c_str());
}

TEST(FixedStringEraseTest, RuntimeEraseTest) {
  auto x = FS("abcdefghijklmnopqrstuvwxyz"), y = x;
  x.erase(x.size());
  EXPECT_EQ(26u, x.size());
  EXPECT_STREQ(y.c_str(), x.c_str());
  x.erase(25u).erase(24u);
  EXPECT_EQ(24u, x.size());
  EXPECT_STREQ("abcdefghijklmnopqrstuvwx", x.c_str());
  x.erase(1u, x.size() - 2u);
  EXPECT_EQ(2u, x.size());
  EXPECT_STREQ("ax", x.c_str());
}

TEST(FixedStringEraseTest, CEraseTest) {
  constexpr auto x = FS("abcdefghijklmnopqrstuvwxyz"), y = x;
  constexpr auto tmp0 = x.cerase(x.size());
  static_assert(26u == tmp0.size(), "");
  static_assert(y == tmp0, "");
  constexpr auto tmp1 = tmp0.cerase(25u).cerase(24u);
  static_assert(24u == tmp1.size(), "");
  static_assert("abcdefghijklmnopqrstuvwx" == tmp1, "");
  constexpr auto tmp2 = tmp1.cerase(1u, tmp1.size() - 2u);
  static_assert(2u == tmp2.size(), "");
  static_assert("ax" == tmp2, "");
  constexpr auto tmp3 = tmp2.cerase();
  static_assert("" == tmp3, "");
}

TEST(FixedStringFindTest, FindString) {
  constexpr folly::FixedString<10> tmp{"hijdefghij"};
  static_assert(tmp.find(FS("hij")) == 0u, "");
  static_assert(tmp.find(FS("hij"), 1u) == 7u, "");
  static_assert(tmp.find(FS("hijdefghij")) == 0u, "");
  static_assert(tmp.find(FS("")) == 0u, "");
}

TEST(FixedStringFindTest, FindLiteral) {
  constexpr folly::FixedString<10> tmp{"hijdefghij"};
  static_assert(tmp.find("hij") == 0u, "");
  static_assert(tmp.find("hij", 1u) == 7u, "");
  static_assert(tmp.find("hijdefghij") == 0u, "");
}

TEST(FixedStringReverseFindTest, FindChar) {
  constexpr folly::FixedString<16> tmp{"This is a string"};
  static_assert(tmp.find('s') == 3u, "");
  static_assert(tmp.find('s', 9u) == 10u, "");
  static_assert(tmp.find('s', 10u) == 10u, "");
  static_assert(tmp.find('s', 11u) == tmp.npos, "");
}

TEST(FixedStringReverseFindTest, ReverseFindString) {
  constexpr folly::FixedString<16> tmp{"This is a string"};
  static_assert(tmp.rfind(FS("is")) == 5u, "");
  static_assert(tmp.rfind(FS("is"), 4u) == 2u, "");
  static_assert(tmp.rfind(FS("This is a string")) == 0u, "");
  static_assert(tmp.rfind(FS("This is a string!")) == tmp.npos, "");
  static_assert(tmp.rfind(FS("")) == 16u, "");
}

TEST(FixedStringReverseFindTest, ReverseFindLiteral) {
  constexpr folly::FixedString<16> tmp{"This is a string"};
  static_assert(tmp.rfind("is") == 5u, "");
  static_assert(tmp.rfind("is", 4u) == 2u, "");
  static_assert(tmp.rfind("This is a string") == 0u, "");
  static_assert(tmp.rfind("This is a string!") == tmp.npos, "");
  static_assert(tmp.rfind("") == 16u, "");
}

TEST(FixedStringReverseFindTest, ReverseFindChar) {
  constexpr folly::FixedString<16> tmp{"This is a string"};
  static_assert(tmp.rfind('s') == 10u, "");
  static_assert(tmp.rfind('s', 5u) == 3u, "");
  static_assert(tmp.rfind('s', 3u) == 3u, "");
  static_assert(tmp.rfind('s', 2u) == tmp.npos, "");
}

TEST(FixedStringFindFirstOfTest, FindFirstOfString) {
  constexpr folly::FixedString<16> tmp{"This is a string"};
  static_assert(tmp.find_first_of(FS("hi")) == 1u, "");
  static_assert(tmp.find_first_of(FS("xi")) == 2u, "");
  static_assert(tmp.find_first_of(FS("xi"), 6u) == 13u, "");
  static_assert(tmp.find_first_of(FS("xz")) == tmp.npos, "");
  static_assert(FS("a").find_first_of(FS("cba")) == 0u, "");
  static_assert(FS("").find_first_of(FS("cba")) == tmp.npos, "");
  static_assert(FS("a").find_first_of(FS("")) == tmp.npos, "");
  static_assert(FS("").find_first_of(FS("")) == tmp.npos, "");
}

TEST(FixedStringFindFirstOfTest, FindFirstOfLiteral) {
  constexpr folly::FixedString<16> tmp{"This is a string"};
  static_assert(tmp.find_first_of("hi") == 1u, "");
  static_assert(tmp.find_first_of("xi") == 2u, "");
  static_assert(tmp.find_first_of("xi", 6u) == 13u, "");
  static_assert(tmp.find_first_of("xis", 6u, 2u) == 13u, "");
  static_assert(tmp.find_first_of("xz") == tmp.npos, "");
  static_assert(FS("a").find_first_of("cba") == 0u, "");
  static_assert(FS("").find_first_of("cba") == tmp.npos, "");
  static_assert(FS("a").find_first_of("") == tmp.npos, "");
  static_assert(FS("").find_first_of("") == tmp.npos, "");
}

TEST(FixedStringFindFirstOfTest, FindFirstOfChar) {
  constexpr folly::FixedString<16> tmp{"This is a string"};
  static_assert(tmp.find_first_of('h') == 1u, "");
  static_assert(tmp.find_first_of('i') == 2u, "");
  static_assert(tmp.find_first_of('i', 6u) == 13u, "");
  static_assert(tmp.find_first_of('x') == tmp.npos, "");
  static_assert(FS("a").find_first_of('a') == 0u, "");
  static_assert(FS("").find_first_of('a') == tmp.npos, "");
}

TEST(FixedStringFindFirstNotOfTest, FindFirstNotOfString) {
  constexpr folly::FixedString<16> tmp{"This is a string"};
  static_assert(tmp.find_first_not_of(FS("Ti")) == 1u, "");
  static_assert(tmp.find_first_not_of(FS("hT")) == 2u, "");
  static_assert(tmp.find_first_not_of(FS("s atr"), 6u) == 13u, "");
  static_assert(tmp.find_first_not_of(FS("This atrng")) == tmp.npos, "");
  static_assert(FS("a").find_first_not_of(FS("X")) == 0u, "");
  static_assert(FS("").find_first_not_of(FS("cba")) == tmp.npos, "");
  static_assert(FS("a").find_first_not_of(FS("")) == 0u, "");
  static_assert(FS("").find_first_not_of(FS("")) == tmp.npos, "");
}

TEST(FixedStringFindFirstNotOfTest, FindFirstNotOfLiteral) {
  constexpr folly::FixedString<16> tmp{"This is a string"};
  static_assert(tmp.find_first_not_of("Ti") == 1u, "");
  static_assert(tmp.find_first_not_of("hT") == 2u, "");
  static_assert(tmp.find_first_not_of("s atr", 6u) == 13u, "");
  static_assert(tmp.find_first_not_of("This atrng") == tmp.npos, "");
  static_assert(FS("a").find_first_not_of("X") == 0u, "");
  static_assert(FS("").find_first_not_of("cba") == tmp.npos, "");
  static_assert(FS("a").find_first_not_of("") == 0u, "");
  static_assert(FS("").find_first_not_of("") == tmp.npos, "");
}

TEST(FixedStringFindFirstNotOfTest, FindFirstNotOfChar) {
  constexpr folly::FixedString<16> tmp{"This is a string"};
  static_assert(tmp.find_first_not_of('T') == 1u, "");
  static_assert(tmp.find_first_not_of('i') == 0u, "");
  static_assert(tmp.find_first_not_of('x', 6u) == 6u, "");
  static_assert(tmp.find_first_not_of('s', 6u) == 7u, "");
  static_assert(FS("a").find_first_not_of('a') == tmp.npos, "");
  static_assert(FS("").find_first_not_of('a') == tmp.npos, "");
}

TEST(FixedStringFindLastOfTest, FindLastOfString) {
  constexpr folly::FixedString<16> tmp{"This is a string"};
  static_assert(tmp.find_last_of(FS("hi")) == 13u, "");
  static_assert(tmp.find_last_of(FS("xh")) == 1u, "");
  static_assert(tmp.find_last_of(FS("xi"), 6u) == 5u, "");
  static_assert(tmp.find_last_of(FS("xz")) == tmp.npos, "");
  static_assert(FS("a").find_last_of(FS("cba")) == 0u, "");
  static_assert(FS("").find_last_of(FS("cba")) == tmp.npos, "");
  static_assert(FS("a").find_last_of(FS("")) == tmp.npos, "");
  static_assert(FS("").find_last_of(FS("")) == tmp.npos, "");
}

TEST(FixedStringFindLastOfTest, FindLastOfLiteral) {
  constexpr folly::FixedString<16> tmp{"This is a string"};
  static_assert(tmp.find_last_of("hi") == 13u, "");
  static_assert(tmp.find_last_of("xh") == 1u, "");
  static_assert(tmp.find_last_of("xi", 6u) == 5u, "");
  static_assert(tmp.find_last_of("xis", 6u, 2u) == 5u, "");
  static_assert(tmp.find_last_of("xz") == tmp.npos, "");
  static_assert(FS("a").find_last_of("cba") == 0u, "");
  static_assert(FS("").find_last_of("cba") == tmp.npos, "");
  static_assert(FS("a").find_last_of("") == tmp.npos, "");
  static_assert(FS("").find_last_of("") == tmp.npos, "");
}

TEST(FixedStringFindLastOfTest, FindLastOfChar) {
  constexpr folly::FixedString<16> tmp{"This is a string"};
  static_assert(tmp.find_last_of('h') == 1u, "");
  static_assert(tmp.find_last_of('i') == 13u, "");
  static_assert(tmp.find_last_of('i', 6u) == 5u, "");
  static_assert(tmp.find_last_of('x') == tmp.npos, "");
  static_assert(FS("a").find_last_of('a') == 0u, "");
  static_assert(FS("").find_last_of('a') == tmp.npos, "");
}

TEST(FixedStringFindLastNotOfTest, FindLastNotOfString) {
  constexpr folly::FixedString<16> tmp{"This is a string"};
  static_assert(tmp.find_last_not_of(FS("gstrin")) == 9u, "");
  static_assert(tmp.find_last_not_of(FS("hT")) == 15u, "");
  static_assert(tmp.find_last_not_of(FS("s atr"), 6u) == 5u, "");
  static_assert(tmp.find_last_not_of(FS("This atrng")) == tmp.npos, "");
  static_assert(FS("a").find_last_not_of(FS("X")) == 0u, "");
  static_assert(FS("").find_last_not_of(FS("cba")) == tmp.npos, "");
  static_assert(FS("a").find_last_not_of(FS("")) == 0u, "");
  static_assert(FS("").find_last_not_of(FS("")) == tmp.npos, "");
}

TEST(FixedStringFindLastNotOfTest, FindLastNotOfLiteral) {
  constexpr folly::FixedString<16> tmp{"This is a string"};
  static_assert(tmp.find_last_not_of("gstrin") == 9u, "");
  static_assert(tmp.find_last_not_of("hT") == 15u, "");
  static_assert(tmp.find_last_not_of("s atr", 6u) == 5u, "");
  static_assert(tmp.find_last_not_of(" atrs", 6u, 4u) == 6u, "");
  static_assert(tmp.find_last_not_of("This atrng") == tmp.npos, "");
  static_assert(FS("a").find_last_not_of("X") == 0u, "");
  static_assert(FS("").find_last_not_of("cba") == tmp.npos, "");
  static_assert(FS("a").find_last_not_of("") == 0u, "");
  static_assert(FS("").find_last_not_of("") == tmp.npos, "");
}

TEST(FixedStringFindLastNotOfTest, FindLastNotOfChar) {
  constexpr folly::FixedString<16> tmp{"This is a string"};
  static_assert(tmp.find_last_not_of('g') == 14u, "");
  static_assert(tmp.find_last_not_of('i') == 15u, "");
  static_assert(tmp.find_last_not_of('x', 6u) == 6u, "");
  static_assert(tmp.find_last_not_of('s', 6u) == 5u, "");
  static_assert(FS("a").find_last_not_of('a') == tmp.npos, "");
  static_assert(FS("").find_last_not_of('a') == tmp.npos, "");
}

TEST(FixedStringConversionTest, ConversionToStdString) {
  constexpr folly::FixedString<16> tmp{"This is a string"};
  std::string str = tmp;
  EXPECT_STREQ("This is a string", str.c_str());
  str = "another string"_fs16;
  EXPECT_STREQ("another string", str.c_str());
}

#if FOLLY_USE_CPP14_CONSTEXPR
constexpr std::size_t countSpacesReverse(folly::FixedString<50> s) {
  std::size_t count = 0u;
  auto i = s.rbegin();
  for (; i != s.rend(); ++i, --i, i++, i--, i += 1, i -= 1, i += 1) {
    if (' ' == *i) {
      ++count;
    }
  }
  return count;
}

TEST(FixedStringReverseIteratorTest, Cpp14ConstexprReverseIteration) {
  static_assert(3 == countSpacesReverse("This is a string"), "");
}
#endif

TEST(FixedStringReverseIteratorTest, ConstexprReverseIteration) {
  static constexpr auto alpha = FS("abcdefghijklmnopqrstuvwxyz");
  static_assert('a' == alpha.rbegin()[25], "");
  static_assert('a' == *(alpha.rbegin() + 25), "");
  static_assert('c' == *(alpha.rbegin() + 25 - 2), "");
  static_assert((alpha.rend() - 2) == (alpha.rbegin() + 24), "");
}

namespace GCC61971 {
// FixedString runs afoul of GCC #61971 (spurious -Warray-bounds)
// in optimized builds. The following test case triggers it for gcc-4.x.
// Test that FixedString suppresses the warning correctly.
// https://gcc.gnu.org/bugzilla/show_bug.cgi?id=61971
constexpr auto xyz = folly::makeFixedString("xyz");
constexpr auto dot = folly::makeFixedString(".");

template <typename T1>
constexpr auto concatStuff(const T1& component) noexcept {
  return xyz + dot + component;
}
constexpr auto co = folly::makeFixedString("co");

struct S {
  std::string s{concatStuff(co)};
};
} // namespace GCC61971

TEST(FixedStringGCC61971, GCC61971) {
  GCC61971::S s;
  (void)s;
}

#include <folly/Range.h>

TEST(FixedStringConversionTest, ConversionToFollyRange) {
  // The following declaraction is static for compilers that haven't implemented
  // the resolution of:
  // http://www.open-std.org/jtc1/sc22/wg21/docs/cwg_defects.html#1454
  static constexpr folly::FixedString<16> tmp{"This is a string"};
  constexpr folly::StringPiece piece = tmp;
  static_assert(tmp.begin() == piece.begin(), "");
  static_assert(tmp.end() == piece.end(), "");
}
