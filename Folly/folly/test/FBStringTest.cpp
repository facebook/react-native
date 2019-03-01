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

//
// Author: andrei.alexandrescu@fb.com

#include <folly/FBString.h>

#include <atomic>
#include <cstdlib>

#include <iomanip>
#include <list>
#include <sstream>
#include <boost/algorithm/string.hpp>
#include <boost/random.hpp>

#include <folly/Foreach.h>
#include <folly/Portability.h>
#include <folly/Random.h>
#include <folly/Conv.h>
#include <folly/portability/GTest.h>

using namespace std;
using namespace folly;

namespace {

static const int seed = folly::randomNumberSeed();
typedef boost::mt19937 RandomT;
static RandomT rng(seed);
static const size_t maxString = 100;
static const bool avoidAliasing = true;

template <class Integral1, class Integral2>
Integral2 random(Integral1 low, Integral2 up) {
  boost::uniform_int<> range(low, up);
  return range(rng);
}

template <class String>
void randomString(String* toFill, unsigned int maxSize = 1000) {
  assert(toFill);
  toFill->resize(random(0, maxSize));
  FOR_EACH (i, *toFill) {
    *i = random('a', 'z');
  }
}

template <class String, class Integral>
void Num2String(String& str, Integral n) {

  std::string tmp = folly::to<std::string>(n);
  str = String(tmp.begin(), tmp.end());
}

std::list<char> RandomList(unsigned int maxSize) {
  std::list<char> lst(random(0u, maxSize));
  std::list<char>::iterator i = lst.begin();
  for (; i != lst.end(); ++i) {
    *i = random('a', 'z');
 }
  return lst;
}
}

////////////////////////////////////////////////////////////////////////////////
// Tests begin here
////////////////////////////////////////////////////////////////////////////////

template <class String> void clause11_21_4_2_a(String & test) {
  test.String::~String();
  new(&test) String();
}
template <class String> void clause11_21_4_2_b(String & test) {
  String test2(test);
  assert(test2 == test);
}
template <class String> void clause11_21_4_2_c(String & test) {
  // Test move constructor. There is a more specialized test, see
  // TEST(FBString, testMoveCtor)
  String donor(test);
  String test2(std::move(donor));
  EXPECT_EQ(test2, test);
  // Technically not required, but all implementations that actually
  // support move will move large strings. Make a guess for 128 as the
  // maximum small string optimization that's reasonable.
  EXPECT_LE(donor.size(), 128);
}
template <class String> void clause11_21_4_2_d(String & test) {
  // Copy constructor with position and length
  const size_t pos = random(0, test.size());
  String s(test, pos, random(0, 9)
           ? random(0, (size_t)(test.size() - pos))
           : String::npos); // test for npos, too, in 10% of the cases
  test = s;
}
template <class String> void clause11_21_4_2_e(String & test) {
  // Constructor from char*, size_t
  const size_t
    pos = random(0, test.size()),
    n = random(0, test.size() - pos);
  String before(test.data(), test.size());
  String s(test.c_str() + pos, n);
  String after(test.data(), test.size());
  EXPECT_EQ(before, after);
  test.swap(s);
}
template <class String> void clause11_21_4_2_f(String & test) {
  // Constructor from char*
  const size_t pos = random(0, test.size());
  String before(test.data(), test.size());
  String s(test.c_str() + pos);
  String after(test.data(), test.size());
  EXPECT_EQ(before, after);
  test.swap(s);
}
template <class String> void clause11_21_4_2_g(String & test) {
  // Constructor from size_t, char
  const size_t n = random(0, test.size());
  const auto c = test.front();
  test = String(n, c);
}
template <class String> void clause11_21_4_2_h(String & test) {
  // Constructors from various iterator pairs
  // Constructor from char*, char*
  String s1(test.begin(), test.end());
  EXPECT_EQ(test, s1);
  String s2(test.data(), test.data() + test.size());
  EXPECT_EQ(test, s2);
  // Constructor from other iterators
  std::list<char> lst;
  for (auto c : test) lst.push_back(c);
  String s3(lst.begin(), lst.end());
  EXPECT_EQ(test, s3);
  // Constructor from wchar_t iterators
  std::list<wchar_t> lst1;
  for (auto c : test) lst1.push_back(c);
  String s4(lst1.begin(), lst1.end());
  EXPECT_EQ(test, s4);
  // Constructor from wchar_t pointers
  wchar_t t[20];
  t[0] = 'a';
  t[1] = 'b';
  fbstring s5(t, t + 2);;
  EXPECT_EQ("ab", s5);
}
template <class String> void clause11_21_4_2_i(String & test) {
  // From initializer_list<char>
  std::initializer_list<typename String::value_type>
    il = { 'h', 'e', 'l', 'l', 'o' };
  String s(il);
  test.swap(s);
}
template <class String> void clause11_21_4_2_j(String & test) {
  // Assignment from const String&
  auto size = random(0, 2000);
  String s(size, '\0');
  EXPECT_EQ(s.size(), size);
  FOR_EACH_RANGE (i, 0, s.size()) {
    s[i] = random('a', 'z');
  }
  test = s;
}
template <class String> void clause11_21_4_2_k(String & test) {
  // Assignment from String&&
  auto size = random(0, 2000);
  String s(size, '\0');
  EXPECT_EQ(s.size(), size);
  FOR_EACH_RANGE (i, 0, s.size()) {
    s[i] = random('a', 'z');
  }
  test = std::move(s);
  if (typeid(String) == typeid(fbstring)) {
    EXPECT_LE(s.size(), 128);
  }
}
template <class String> void clause11_21_4_2_l(String & test) {
  // Assignment from char*
  String s(random(0, 1000), '\0');
  size_t i = 0;
  for (; i != s.size(); ++i) {
    s[i] = random('a', 'z');
  }
  test = s.c_str();
}
template <class String> void clause11_21_4_2_lprime(String & test) {
  // Aliased assign
  const size_t pos = random(0, test.size());
  if (avoidAliasing) {
    test = String(test.c_str() + pos);
  } else {
    test = test.c_str() + pos;
  }
}
template <class String> void clause11_21_4_2_m(String & test) {
  // Assignment from char
  test = random('a', 'z');
}
template <class String> void clause11_21_4_2_n(String & test) {
  // Assignment from initializer_list<char>
  initializer_list<typename String::value_type>
    il = { 'h', 'e', 'l', 'l', 'o' };
  test = il;
}

template <class String> void clause11_21_4_3(String & test) {
  // Iterators. The code below should leave test unchanged
  EXPECT_EQ(test.size(), test.end() - test.begin());
  EXPECT_EQ(test.size(), test.rend() - test.rbegin());
  EXPECT_EQ(test.size(), test.cend() - test.cbegin());
  EXPECT_EQ(test.size(), test.crend() - test.crbegin());

  auto s = test.size();
  test.resize(test.end() - test.begin());
  EXPECT_EQ(s, test.size());
  test.resize(test.rend() - test.rbegin());
  EXPECT_EQ(s, test.size());
}

template <class String> void clause11_21_4_4(String & test) {
  // exercise capacity, size, max_size
  EXPECT_EQ(test.size(), test.length());
  EXPECT_LE(test.size(), test.max_size());
  EXPECT_LE(test.capacity(), test.max_size());
  EXPECT_LE(test.size(), test.capacity());

  // exercise shrink_to_fit. Nonbinding request so we can't really do
  // much beyond calling it.
  auto copy = test;
  copy.reserve(copy.capacity() * 3);
  copy.shrink_to_fit();
  EXPECT_EQ(copy, test);

  // exercise empty
  string empty("empty");
  string notempty("not empty");
  if (test.empty()) test = String(empty.begin(), empty.end());
  else test = String(notempty.begin(), notempty.end());
}

template <class String> void clause11_21_4_5(String & test) {
  // exercise element access
  if (!test.empty()) {
    EXPECT_EQ(test[0], test.front());
    EXPECT_EQ(test[test.size() - 1], test.back());
    auto const i = random(0, test.size() - 1);
    EXPECT_EQ(test[i], test.at(i));
    test = test[i];
  }
}

template <class String> void clause11_21_4_6_1(String & test) {
  // 21.3.5 modifiers (+=)
  String test1;
  randomString(&test1);
  assert(test1.size() == char_traits
      <typename String::value_type>::length(test1.c_str()));
  auto len = test.size();
  test += test1;
  EXPECT_EQ(test.size(), test1.size() + len);
  FOR_EACH_RANGE (i, 0, test1.size()) {
    EXPECT_EQ(test[len + i], test1[i]);
  }
  // aliasing modifiers
  String test2 = test;
  auto dt = test2.data();
  auto sz = test.c_str();
  len = test.size();
  EXPECT_EQ(memcmp(sz, dt, len), 0);
  String copy(test.data(), test.size());
  EXPECT_EQ(char_traits
      <typename String::value_type>::length(test.c_str()), len);
  test += test;
  //test.append(test);
  EXPECT_EQ(test.size(), 2 * len);
  EXPECT_EQ(char_traits
      <typename String::value_type>::length(test.c_str()), 2 * len);
  FOR_EACH_RANGE (i, 0, len) {
    EXPECT_EQ(test[i], copy[i]);
    EXPECT_EQ(test[i], test[len + i]);
  }
  len = test.size();
  EXPECT_EQ(char_traits
      <typename String::value_type>::length(test.c_str()), len);
  // more aliasing
  auto const pos = random(0, test.size());
  EXPECT_EQ(char_traits
      <typename String::value_type>::length(test.c_str() + pos), len - pos);
  if (avoidAliasing) {
    String addMe(test.c_str() + pos);
    EXPECT_EQ(addMe.size(), len - pos);
    test += addMe;
  } else {
    test += test.c_str() + pos;
  }
  EXPECT_EQ(test.size(), 2 * len - pos);
  // single char
  len = test.size();
  test += random('a', 'z');
  EXPECT_EQ(test.size(), len + 1);
  // initializer_list
  initializer_list<typename String::value_type> il { 'a', 'b', 'c' };
  test += il;
}

template <class String> void clause11_21_4_6_2(String & test) {
  // 21.3.5 modifiers (append, push_back)
  String s;

  // Test with a small string first
  char c = random('a', 'z');
  s.push_back(c);
  EXPECT_EQ(s[s.size() - 1], c);
  EXPECT_EQ(s.size(), 1);
  s.resize(s.size() - 1);

  randomString(&s, maxString);
  test.append(s);
  randomString(&s, maxString);
  test.append(s, random(0, s.size()), random(0, maxString));
  randomString(&s, maxString);
  test.append(s.c_str(), random(0, s.size()));
  randomString(&s, maxString);
  test.append(s.c_str());
  test.append(random(0, maxString), random('a', 'z'));
  std::list<char> lst(RandomList(maxString));
  test.append(lst.begin(), lst.end());
  c = random('a', 'z');
  test.push_back(c);
  EXPECT_EQ(test[test.size() - 1], c);
  // initializer_list
  initializer_list<typename String::value_type> il { 'a', 'b', 'c' };
  test.append(il);
}

template <class String> void clause11_21_4_6_3_a(String & test) {
  // assign
  String s;
  randomString(&s);
  test.assign(s);
  EXPECT_EQ(test, s);
  // move assign
  test.assign(std::move(s));
  if (typeid(String) == typeid(fbstring)) {
    EXPECT_LE(s.size(), 128);
  }
}

template <class String> void clause11_21_4_6_3_b(String & test) {
  // assign
  String s;
  randomString(&s, maxString);
  test.assign(s, random(0, s.size()), random(0, maxString));
}

template <class String> void clause11_21_4_6_3_c(String & test) {
  // assign
  String s;
  randomString(&s, maxString);
  test.assign(s.c_str(), random(0, s.size()));
}

template <class String> void clause11_21_4_6_3_d(String & test) {
  // assign
  String s;
  randomString(&s, maxString);
  test.assign(s.c_str());
}

template <class String> void clause11_21_4_6_3_e(String & test) {
  // assign
  String s;
  randomString(&s, maxString);
  test.assign(random(0, maxString), random('a', 'z'));
}

template <class String> void clause11_21_4_6_3_f(String & test) {
  // assign from bidirectional iterator
  std::list<char> lst(RandomList(maxString));
  test.assign(lst.begin(), lst.end());
}

template <class String> void clause11_21_4_6_3_g(String & test) {
  // assign from aliased source
  test.assign(test);
}

template <class String> void clause11_21_4_6_3_h(String & test) {
  // assign from aliased source
  test.assign(test, random(0, test.size()), random(0, maxString));
}

template <class String> void clause11_21_4_6_3_i(String & test) {
  // assign from aliased source
  test.assign(test.c_str(), random(0, test.size()));
}

template <class String> void clause11_21_4_6_3_j(String & test) {
  // assign from aliased source
  test.assign(test.c_str());
}

template <class String> void clause11_21_4_6_3_k(String & test) {
  // assign from initializer_list
  initializer_list<typename String::value_type> il { 'a', 'b', 'c' };
  test.assign(il);
}

template <class String> void clause11_21_4_6_4(String & test) {
  // insert
  String s;
  randomString(&s, maxString);
  test.insert(random(0, test.size()), s);
  randomString(&s, maxString);
  test.insert(random(0, test.size()),
              s, random(0, s.size()),
              random(0, maxString));
  randomString(&s, maxString);
  test.insert(random(0, test.size()),
              s.c_str(), random(0, s.size()));
  randomString(&s, maxString);
  test.insert(random(0, test.size()), s.c_str());
  test.insert(random(0, test.size()),
              random(0, maxString), random('a', 'z'));
  typename String::size_type pos = random(0, test.size());
  typename String::iterator res =
    test.insert(test.begin() + pos, random('a', 'z'));
  EXPECT_EQ(res - test.begin(), pos);
  std::list<char> lst(RandomList(maxString));
  pos = random(0, test.size());
  // Uncomment below to see a bug in gcc
  /*res = */test.insert(test.begin() + pos, lst.begin(), lst.end());
  // insert from initializer_list
  initializer_list<typename String::value_type> il { 'a', 'b', 'c' };
  pos = random(0, test.size());
  // Uncomment below to see a bug in gcc
  /*res = */test.insert(test.begin() + pos, il);

  // Test with actual input iterators
  stringstream ss;
  ss << "hello cruel world";
  auto i = istream_iterator<char>(ss);
  test.insert(test.begin(), i, istream_iterator<char>());
}

template <class String> void clause11_21_4_6_5(String & test) {
  // erase and pop_back
  if (!test.empty()) {
    test.erase(random(0, test.size()), random(0, maxString));
  }
  if (!test.empty()) {
    // TODO: is erase(end()) allowed?
    test.erase(test.begin() + random(0, test.size() - 1));
  }
  if (!test.empty()) {
    auto const i = test.begin() + random(0, test.size());
    if (i != test.end()) {
      test.erase(i, i + random(0, size_t(test.end() - i)));
    }
  }
  if (!test.empty()) {
    // Can't test pop_back with std::string, doesn't support it yet.
    //test.pop_back();
  }
}

template <class String> void clause11_21_4_6_6(String & test) {
  auto pos = random(0, test.size());
  if (avoidAliasing) {
    test.replace(pos, random(0, test.size() - pos),
                 String(test));
  } else {
    test.replace(pos, random(0, test.size() - pos), test);
  }
  pos = random(0, test.size());
  String s;
  randomString(&s, maxString);
  test.replace(pos, pos + random(0, test.size() - pos), s);
  auto pos1 = random(0, test.size());
  auto pos2 = random(0, test.size());
  if (avoidAliasing) {
    test.replace(pos1, pos1 + random(0, test.size() - pos1),
                 String(test),
                 pos2, pos2 + random(0, test.size() - pos2));
  } else {
    test.replace(pos1, pos1 + random(0, test.size() - pos1),
                 test, pos2, pos2 + random(0, test.size() - pos2));
  }
  pos1 = random(0, test.size());
  String str;
  randomString(&str, maxString);
  pos2 = random(0, str.size());
  test.replace(pos1, pos1 + random(0, test.size() - pos1),
               str, pos2, pos2 + random(0, str.size() - pos2));
  pos = random(0, test.size());
  if (avoidAliasing) {
    test.replace(pos, random(0, test.size() - pos),
                 String(test).c_str(), test.size());
  } else {
    test.replace(pos, random(0, test.size() - pos),
                 test.c_str(), test.size());
  }
  pos = random(0, test.size());
  randomString(&str, maxString);
  test.replace(pos, pos + random(0, test.size() - pos),
               str.c_str(), str.size());
  pos = random(0, test.size());
  randomString(&str, maxString);
  test.replace(pos, pos + random(0, test.size() - pos),
               str.c_str());
  pos = random(0, test.size());
  test.replace(pos, random(0, test.size() - pos),
               random(0, maxString), random('a', 'z'));
  pos = random(0, test.size());
  if (avoidAliasing) {
    auto newString = String(test);
    test.replace(
      test.begin() + pos,
      test.begin() + pos + random(0, test.size() - pos),
      newString);
  } else {
    test.replace(
      test.begin() + pos,
      test.begin() + pos + random(0, test.size() - pos),
      test);
  }
  pos = random(0, test.size());
  if (avoidAliasing) {
    auto newString = String(test);
    test.replace(
      test.begin() + pos,
      test.begin() + pos + random(0, test.size() - pos),
      newString.c_str(),
      test.size() - random(0, test.size()));
  } else {
    test.replace(
      test.begin() + pos,
      test.begin() + pos + random(0, test.size() - pos),
      test.c_str(),
      test.size() - random(0, test.size()));
  }
  pos = random(0, test.size());
  auto const n = random(0, test.size() - pos);
  typename String::iterator b = test.begin();
  String str1;
  randomString(&str1, maxString);
  const String & str3 = str1;
  const typename String::value_type* ss = str3.c_str();
  test.replace(
    b + pos,
    b + pos + n,
    ss);
  pos = random(0, test.size());
  test.replace(
    test.begin() + pos,
    test.begin() + pos + random(0, test.size() - pos),
    random(0, maxString), random('a', 'z'));
}

template <class String> void clause11_21_4_6_7(String & test) {
  std::vector<typename String::value_type>
    vec(random(0, maxString));
  if (vec.empty()) {
    return;
  }
  test.copy(vec.data(), vec.size(), random(0, test.size()));
}

template <class String> void clause11_21_4_6_8(String & test) {
  String s;
  randomString(&s, maxString);
  s.swap(test);
}

template <class String> void clause11_21_4_7_1(String & test) {
  // 21.3.6 string operations
  // exercise c_str() and data()
  assert(test.c_str() == test.data());
  // exercise get_allocator()
  String s;
  randomString(&s, maxString);
  DCHECK(test.get_allocator() == s.get_allocator());
}

template <class String> void clause11_21_4_7_2_a(String & test) {
  String str = test.substr(
    random(0, test.size()),
    random(0, test.size()));
  Num2String(test, test.find(str, random(0, test.size())));
}

template <class String> void clause11_21_4_7_2_a1(String & test) {
  String str = String(test).substr(
    random(0, test.size()),
    random(0, test.size()));
  Num2String(test, test.find(str, random(0, test.size())));
}

template <class String> void clause11_21_4_7_2_a2(String & test) {
  auto const& cTest = test;
  String str = cTest.substr(
    random(0, test.size()),
    random(0, test.size()));
  Num2String(test, test.find(str, random(0, test.size())));
}

template <class String> void clause11_21_4_7_2_b(String & test) {
  auto from = random(0, test.size());
  auto length = random(0, test.size() - from);
  String str = test.substr(from, length);
  Num2String(test, test.find(str.c_str(),
                             random(0, test.size()),
                             random(0, str.size())));
}

template <class String> void clause11_21_4_7_2_b1(String & test) {
  auto from = random(0, test.size());
  auto length = random(0, test.size() - from);
  String str = String(test).substr(from, length);
  Num2String(test, test.find(str.c_str(),
                             random(0, test.size()),
                             random(0, str.size())));
}

template <class String> void clause11_21_4_7_2_b2(String & test) {
  auto from = random(0, test.size());
  auto length = random(0, test.size() - from);
  const auto& cTest = test;
  String str = cTest.substr(from, length);
  Num2String(test, test.find(str.c_str(),
                             random(0, test.size()),
                             random(0, str.size())));
}

template <class String> void clause11_21_4_7_2_c(String & test) {
  String str = test.substr(
    random(0, test.size()),
    random(0, test.size()));
  Num2String(test, test.find(str.c_str(),
                             random(0, test.size())));
}

template <class String> void clause11_21_4_7_2_c1(String & test) {
  String str = String(test).substr(
    random(0, test.size()),
    random(0, test.size()));
  Num2String(test, test.find(str.c_str(),
                             random(0, test.size())));
}

template <class String> void clause11_21_4_7_2_c2(String & test) {
  const auto& cTest = test;
  String str = cTest.substr(
    random(0, test.size()),
    random(0, test.size()));
  Num2String(test, test.find(str.c_str(),
                             random(0, test.size())));
}

template <class String> void clause11_21_4_7_2_d(String & test) {
  Num2String(test, test.find(
               random('a', 'z'),
               random(0, test.size())));
}

template <class String> void clause11_21_4_7_3_a(String & test) {
  String str = test.substr(
    random(0, test.size()),
    random(0, test.size()));
  Num2String(test, test.rfind(str, random(0, test.size())));
}

template <class String> void clause11_21_4_7_3_b(String & test) {
  String str = test.substr(
    random(0, test.size()),
    random(0, test.size()));
  Num2String(test, test.rfind(str.c_str(),
                              random(0, test.size()),
                              random(0, str.size())));
}

template <class String> void clause11_21_4_7_3_c(String & test) {
  String str = test.substr(
    random(0, test.size()),
    random(0, test.size()));
  Num2String(test, test.rfind(str.c_str(),
                              random(0, test.size())));
}

template <class String> void clause11_21_4_7_3_d(String & test) {
  Num2String(test, test.rfind(
               random('a', 'z'),
               random(0, test.size())));
}

template <class String> void clause11_21_4_7_4_a(String & test) {
  String str;
  randomString(&str, maxString);
  Num2String(test, test.find_first_of(str,
                                      random(0, test.size())));
}

template <class String> void clause11_21_4_7_4_b(String & test) {
  String str;
  randomString(&str, maxString);
  Num2String(test, test.find_first_of(str.c_str(),
                                      random(0, test.size()),
                                      random(0, str.size())));
}

template <class String> void clause11_21_4_7_4_c(String & test) {
  String str;
  randomString(&str, maxString);
  Num2String(test, test.find_first_of(str.c_str(),
                                      random(0, test.size())));
}

template <class String> void clause11_21_4_7_4_d(String & test) {
  Num2String(test, test.find_first_of(
               random('a', 'z'),
               random(0, test.size())));
}

template <class String> void clause11_21_4_7_5_a(String & test) {
  String str;
  randomString(&str, maxString);
  Num2String(test, test.find_last_of(str,
                                     random(0, test.size())));
}

template <class String> void clause11_21_4_7_5_b(String & test) {
  String str;
  randomString(&str, maxString);
  Num2String(test, test.find_last_of(str.c_str(),
                                     random(0, test.size()),
                                     random(0, str.size())));
}

template <class String> void clause11_21_4_7_5_c(String & test) {
  String str;
  randomString(&str, maxString);
  Num2String(test, test.find_last_of(str.c_str(),
                                     random(0, test.size())));
}

template <class String> void clause11_21_4_7_5_d(String & test) {
  Num2String(test, test.find_last_of(
               random('a', 'z'),
               random(0, test.size())));
}

template <class String> void clause11_21_4_7_6_a(String & test) {
  String str;
  randomString(&str, maxString);
  Num2String(test, test.find_first_not_of(str,
                                          random(0, test.size())));
}

template <class String> void clause11_21_4_7_6_b(String & test) {
  String str;
  randomString(&str, maxString);
  Num2String(test, test.find_first_not_of(str.c_str(),
                                          random(0, test.size()),
                                          random(0, str.size())));
}

template <class String> void clause11_21_4_7_6_c(String & test) {
  String str;
  randomString(&str, maxString);
  Num2String(test, test.find_first_not_of(str.c_str(),
                                          random(0, test.size())));
}

template <class String> void clause11_21_4_7_6_d(String & test) {
  Num2String(test, test.find_first_not_of(
               random('a', 'z'),
               random(0, test.size())));
}

template <class String> void clause11_21_4_7_7_a(String & test) {
  String str;
  randomString(&str, maxString);
  Num2String(test, test.find_last_not_of(str,
                                         random(0, test.size())));
}

template <class String> void clause11_21_4_7_7_b(String & test) {
  String str;
  randomString(&str, maxString);
  Num2String(test, test.find_last_not_of(str.c_str(),
                                         random(0, test.size()),
                                         random(0, str.size())));
}

template <class String> void clause11_21_4_7_7_c(String & test) {
  String str;
  randomString(&str, maxString);
  Num2String(test, test.find_last_not_of(str.c_str(),
                                         random(0, test.size())));
}

template <class String> void clause11_21_4_7_7_d(String & test) {
  Num2String(test, test.find_last_not_of(
               random('a', 'z'),
               random(0, test.size())));
}

template <class String> void clause11_21_4_7_8(String & test) {
  test = test.substr(random(0, test.size()), random(0, test.size()));
}

template <class String> void clause11_21_4_7_9_a(String & test) {
  String s;
  randomString(&s, maxString);
  int tristate = test.compare(s);
  if (tristate > 0) tristate = 1;
  else if (tristate < 0) tristate = 2;
  Num2String(test, tristate);
}

template <class String> void clause11_21_4_7_9_b(String & test) {
  String s;
  randomString(&s, maxString);
  int tristate = test.compare(
    random(0, test.size()),
    random(0, test.size()),
    s);
  if (tristate > 0) tristate = 1;
  else if (tristate < 0) tristate = 2;
  Num2String(test, tristate);
}

template <class String> void clause11_21_4_7_9_c(String & test) {
  String str;
  randomString(&str, maxString);
  int tristate = test.compare(
    random(0, test.size()),
    random(0, test.size()),
    str,
    random(0, str.size()),
    random(0, str.size()));
  if (tristate > 0) tristate = 1;
  else if (tristate < 0) tristate = 2;
  Num2String(test, tristate);
}

template <class String> void clause11_21_4_7_9_d(String & test) {
  String s;
  randomString(&s, maxString);
  int tristate = test.compare(s.c_str());
  if (tristate > 0) tristate = 1;
  else if (tristate < 0) tristate = 2;
                Num2String(test, tristate);
}

template <class String> void clause11_21_4_7_9_e(String & test) {
  String str;
  randomString(&str, maxString);
  int tristate = test.compare(
    random(0, test.size()),
    random(0, test.size()),
    str.c_str(),
    random(0, str.size()));
  if (tristate > 0) tristate = 1;
  else if (tristate < 0) tristate = 2;
  Num2String(test, tristate);
}

template <class String> void clause11_21_4_8_1_a(String & test) {
  String s1;
  randomString(&s1, maxString);
  String s2;
  randomString(&s2, maxString);
  test = s1 + s2;
}

template <class String> void clause11_21_4_8_1_b(String & test) {
  String s1;
  randomString(&s1, maxString);
  String s2;
  randomString(&s2, maxString);
  test = move(s1) + s2;
}

template <class String> void clause11_21_4_8_1_c(String & test) {
  String s1;
  randomString(&s1, maxString);
  String s2;
  randomString(&s2, maxString);
  test = s1 + move(s2);
}

template <class String> void clause11_21_4_8_1_d(String & test) {
  String s1;
  randomString(&s1, maxString);
  String s2;
  randomString(&s2, maxString);
  test = move(s1) + move(s2);
}

template <class String> void clause11_21_4_8_1_e(String & test) {
  String s;
  randomString(&s, maxString);
  String s1;
  randomString(&s1, maxString);
  test = s.c_str() + s1;
}

template <class String> void clause11_21_4_8_1_f(String & test) {
  String s;
  randomString(&s, maxString);
  String s1;
  randomString(&s1, maxString);
  test = s.c_str() + move(s1);
}

template <class String> void clause11_21_4_8_1_g(String & test) {
  String s;
  randomString(&s, maxString);
  test = typename String::value_type(random('a', 'z')) + s;
}

template <class String> void clause11_21_4_8_1_h(String & test) {
  String s;
  randomString(&s, maxString);
  test = typename String::value_type(random('a', 'z')) + move(s);
}

template <class String> void clause11_21_4_8_1_i(String & test) {
  String s;
  randomString(&s, maxString);
  String s1;
  randomString(&s1, maxString);
  test = s + s1.c_str();
}

template <class String> void clause11_21_4_8_1_j(String & test) {
  String s;
  randomString(&s, maxString);
  String s1;
  randomString(&s1, maxString);
  test = move(s) + s1.c_str();
}

template <class String> void clause11_21_4_8_1_k(String & test) {
  String s;
  randomString(&s, maxString);
  test = s + typename String::value_type(random('a', 'z'));
}

template <class String> void clause11_21_4_8_1_l(String & test) {
  String s;
  randomString(&s, maxString);
  String s1;
  randomString(&s1, maxString);
  test = move(s) + s1.c_str();
}

// Numbering here is from C++11
template <class String> void clause11_21_4_8_9_a(String & test) {
  basic_stringstream<typename String::value_type> stst(test.c_str());
  String str;
  while (stst) {
    stst >> str;
    test += str + test;
  }
}

TEST(FBString, testAllClauses) {
  EXPECT_TRUE(1) << "Starting with seed: " << seed;
  std::string r;
  folly::fbstring c;
#if FOLLY_HAVE_WCHAR_SUPPORT
  std::wstring wr;
  folly::basic_fbstring<wchar_t> wc;
#endif
  int count = 0;

  auto l = [&](const char * const clause,
               void(*f_string)(std::string&),
               void(*f_fbstring)(folly::fbstring&),
               void(*f_wfbstring)(folly::basic_fbstring<wchar_t>&)) {
    do {
      if (1) {} else EXPECT_TRUE(1) << "Testing clause " << clause;
      randomString(&r);
      c = r;
      EXPECT_EQ(c, r);
#if FOLLY_HAVE_WCHAR_SUPPORT
      wr = std::wstring(r.begin(), r.end());
      wc = folly::basic_fbstring<wchar_t>(wr.c_str());
#endif
      auto localSeed = seed + count;
      rng = RandomT(localSeed);
      f_string(r);
      rng = RandomT(localSeed);
      f_fbstring(c);
      EXPECT_EQ(r, c)
        << "Lengths: " << r.size() << " vs. " << c.size()
        << "\nReference: '" << r << "'"
        << "\nActual:    '" << c.data()[0] << "'";
#if FOLLY_HAVE_WCHAR_SUPPORT
      rng = RandomT(localSeed);
      f_wfbstring(wc);
      int wret = wcslen(wc.c_str());
      auto mbv = std::vector<char>(wret + 1);
      auto mb = mbv.data();
      int ret = wcstombs(mb, wc.c_str(), wret + 1);
      if (ret == wret) mb[wret] = '\0';
      const char *mc = c.c_str();
      std::string one(mb);
      std::string two(mc);
      EXPECT_EQ(one, two);
#endif
    } while (++count % 100 != 0);
  };

#define TEST_CLAUSE(x) \
  l(#x, \
    clause11_##x<std::string>, \
    clause11_##x<folly::fbstring>, \
    clause11_##x<folly::basic_fbstring<wchar_t>>);

  TEST_CLAUSE(21_4_2_a);
  TEST_CLAUSE(21_4_2_b);
  TEST_CLAUSE(21_4_2_c);
  TEST_CLAUSE(21_4_2_d);
  TEST_CLAUSE(21_4_2_e);
  TEST_CLAUSE(21_4_2_f);
  TEST_CLAUSE(21_4_2_g);
  TEST_CLAUSE(21_4_2_h);
  TEST_CLAUSE(21_4_2_i);
  TEST_CLAUSE(21_4_2_j);
  TEST_CLAUSE(21_4_2_k);
  TEST_CLAUSE(21_4_2_l);
  TEST_CLAUSE(21_4_2_lprime);
  TEST_CLAUSE(21_4_2_m);
  TEST_CLAUSE(21_4_2_n);
  TEST_CLAUSE(21_4_3);
  TEST_CLAUSE(21_4_4);
  TEST_CLAUSE(21_4_5);
  TEST_CLAUSE(21_4_6_1);
  TEST_CLAUSE(21_4_6_2);
  TEST_CLAUSE(21_4_6_3_a);
  TEST_CLAUSE(21_4_6_3_b);
  TEST_CLAUSE(21_4_6_3_c);
  TEST_CLAUSE(21_4_6_3_d);
  TEST_CLAUSE(21_4_6_3_e);
  TEST_CLAUSE(21_4_6_3_f);
  TEST_CLAUSE(21_4_6_3_g);
  TEST_CLAUSE(21_4_6_3_h);
  TEST_CLAUSE(21_4_6_3_i);
  TEST_CLAUSE(21_4_6_3_j);
  TEST_CLAUSE(21_4_6_3_k);
  TEST_CLAUSE(21_4_6_4);
  TEST_CLAUSE(21_4_6_5);
  TEST_CLAUSE(21_4_6_6);
  TEST_CLAUSE(21_4_6_7);
  TEST_CLAUSE(21_4_6_8);
  TEST_CLAUSE(21_4_7_1);

  TEST_CLAUSE(21_4_7_2_a);
  TEST_CLAUSE(21_4_7_2_a1);
  TEST_CLAUSE(21_4_7_2_a2);
  TEST_CLAUSE(21_4_7_2_b);
  TEST_CLAUSE(21_4_7_2_b1);
  TEST_CLAUSE(21_4_7_2_b2);
  TEST_CLAUSE(21_4_7_2_c);
  TEST_CLAUSE(21_4_7_2_c1);
  TEST_CLAUSE(21_4_7_2_c2);
  TEST_CLAUSE(21_4_7_2_d);
  TEST_CLAUSE(21_4_7_3_a);
  TEST_CLAUSE(21_4_7_3_b);
  TEST_CLAUSE(21_4_7_3_c);
  TEST_CLAUSE(21_4_7_3_d);
  TEST_CLAUSE(21_4_7_4_a);
  TEST_CLAUSE(21_4_7_4_b);
  TEST_CLAUSE(21_4_7_4_c);
  TEST_CLAUSE(21_4_7_4_d);
  TEST_CLAUSE(21_4_7_5_a);
  TEST_CLAUSE(21_4_7_5_b);
  TEST_CLAUSE(21_4_7_5_c);
  TEST_CLAUSE(21_4_7_5_d);
  TEST_CLAUSE(21_4_7_6_a);
  TEST_CLAUSE(21_4_7_6_b);
  TEST_CLAUSE(21_4_7_6_c);
  TEST_CLAUSE(21_4_7_6_d);
  TEST_CLAUSE(21_4_7_7_a);
  TEST_CLAUSE(21_4_7_7_b);
  TEST_CLAUSE(21_4_7_7_c);
  TEST_CLAUSE(21_4_7_7_d);
  TEST_CLAUSE(21_4_7_8);
  TEST_CLAUSE(21_4_7_9_a);
  TEST_CLAUSE(21_4_7_9_b);
  TEST_CLAUSE(21_4_7_9_c);
  TEST_CLAUSE(21_4_7_9_d);
  TEST_CLAUSE(21_4_7_9_e);
  TEST_CLAUSE(21_4_8_1_a);
  TEST_CLAUSE(21_4_8_1_b);
  TEST_CLAUSE(21_4_8_1_c);
  TEST_CLAUSE(21_4_8_1_d);
  TEST_CLAUSE(21_4_8_1_e);
  TEST_CLAUSE(21_4_8_1_f);
  TEST_CLAUSE(21_4_8_1_g);
  TEST_CLAUSE(21_4_8_1_h);
  TEST_CLAUSE(21_4_8_1_i);
  TEST_CLAUSE(21_4_8_1_j);
  TEST_CLAUSE(21_4_8_1_k);
  TEST_CLAUSE(21_4_8_1_l);
  TEST_CLAUSE(21_4_8_9_a);
}

TEST(FBString, testGetline) {
  string s1 = "\
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras accumsan \n\
elit ut urna consectetur in sagittis mi auctor. Nulla facilisi. In nec \n\
dolor leo, vitae imperdiet neque. Donec ut erat mauris, a faucibus \n\
elit. Integer consectetur gravida augue, sit amet mattis mauris auctor \n\
sed. Morbi congue libero eu nunc sodales adipiscing. In lectus nunc, \n\
vulputate a fringilla at, venenatis quis justo. Proin eu velit \n\
nibh. Maecenas vitae tellus eros. Pellentesque habitant morbi \n\
tristique senectus et netus et malesuada fames ac turpis \n\
egestas. Vivamus faucibus feugiat consequat. Donec fermentum neque sit \n\
amet ligula suscipit porta. Phasellus facilisis felis in purus luctus \n\
quis posuere leo tempor. Nam nunc purus, luctus a pharetra ut, \n\
placerat at dui. Donec imperdiet, diam quis convallis pulvinar, dui \n\
est commodo lorem, ut tincidunt diam nibh et nibh. Maecenas nec velit \n\
massa, ut accumsan magna. Donec imperdiet tempor nisi et \n\
laoreet. Phasellus lectus quam, ultricies ut tincidunt in, dignissim \n\
id eros. Mauris vulputate tortor nec neque pellentesque sagittis quis \n\
sed nisl. In diam lacus, lobortis ut posuere nec, ornare id quam.";

  vector<fbstring> v;
  boost::split(v, s1, boost::is_any_of("\n"));
  {
    istringstream input(s1);
    fbstring line;
    FOR_EACH (i, v) {
      EXPECT_TRUE(!getline(input, line).fail());
      EXPECT_EQ(line, *i);
    }
  }
}

TEST(FBString, testMoveCtor) {
  // Move constructor. Make sure we allocate a large string, so the
  // small string optimization doesn't kick in.
  auto size = random(100, 2000);
  fbstring s(size, 'a');
  fbstring test = std::move(s);
  EXPECT_TRUE(s.empty());
  EXPECT_EQ(size, test.size());
}

TEST(FBString, testMoveAssign) {
  // Move constructor. Make sure we allocate a large string, so the
  // small string optimization doesn't kick in.
  auto size = random(100, 2000);
  fbstring s(size, 'a');
  fbstring test;
  test = std::move(s);
  EXPECT_TRUE(s.empty());
  EXPECT_EQ(size, test.size());
}

TEST(FBString, testMoveOperatorPlusLhs) {
  // Make sure we allocate a large string, so the
  // small string optimization doesn't kick in.
  auto size1 = random(100, 2000);
  auto size2 = random(100, 2000);
  fbstring s1(size1, 'a');
  fbstring s2(size2, 'b');
  fbstring test;
  test = std::move(s1) + s2;
  EXPECT_TRUE(s1.empty());
  EXPECT_EQ(size1 + size2, test.size());
}

TEST(FBString, testMoveOperatorPlusRhs) {
  // Make sure we allocate a large string, so the
  // small string optimization doesn't kick in.
  auto size1 = random(100, 2000);
  auto size2 = random(100, 2000);
  fbstring s1(size1, 'a');
  fbstring s2(size2, 'b');
  fbstring test;
  test = s1 + std::move(s2);
  EXPECT_EQ(size1 + size2, test.size());
}

// The GNU C++ standard library throws an std::logic_error when an std::string
// is constructed with a null pointer. Verify that we mirror this behavior.
//
// N.B. We behave this way even if the C++ library being used is something
//      other than libstdc++. Someday if we deem it important to present
//      identical undefined behavior for other platforms, we can re-visit this.
TEST(FBString, testConstructionFromLiteralZero) {
  EXPECT_THROW(fbstring s(0), std::logic_error);
}

TEST(FBString, testFixedBugs) {
  { // D479397
    fbstring str(1337, 'f');
    fbstring cp = str;
    cp.clear();
    cp.c_str();
    EXPECT_EQ(str.front(), 'f');
  }
  { // D481173
    fbstring str(1337, 'f');
    for (int i = 0; i < 2; ++i) {
      fbstring cp = str;
      cp[1] = 'b';
      EXPECT_EQ(cp.c_str()[cp.size()], '\0');
      cp.push_back('?');
    }
  }
  { // D580267
    {
      fbstring str(1337, 'f');
      fbstring cp = str;
      cp.push_back('f');
    }
    {
      fbstring str(1337, 'f');
      fbstring cp = str;
      cp += "bb";
    }
  }
  { // D661622
    folly::basic_fbstring<wchar_t> s;
    EXPECT_EQ(0, s.size());
  }
  { // D785057
    fbstring str(1337, 'f');
    std::swap(str, str);
    EXPECT_EQ(1337, str.size());
  }
  { // D1012196, --allocator=malloc
    fbstring str(128, 'f');
    str.clear();  // Empty medium string.
    fbstring copy(str);  // Medium string of 0 capacity.
    copy.push_back('b');
    EXPECT_GE(copy.capacity(), 1);
  }
  { // D2813713
    fbstring s1("a");
    s1.reserve(8); // Trigger the optimized code path.
    auto test1 = '\0' + std::move(s1);
    EXPECT_EQ(2, test1.size());

    fbstring s2(1, '\0');
    s2.reserve(8);
    auto test2 = "a" + std::move(s2);
    EXPECT_EQ(2, test2.size());
  }
  { // D3698862
    EXPECT_EQ(fbstring().find(fbstring(), 4), fbstring::npos);
  }
  if (usingJEMalloc()) { // D4355440
    fbstring str(1337, 'f');
    str.reserve(3840);
    EXPECT_NE(str.capacity(), 3840);

    struct {
      std::atomic<size_t> refCount_;
    } dummyRefCounted;
    EXPECT_EQ(
        str.capacity(),
        goodMallocSize(3840) - sizeof(dummyRefCounted) - sizeof(char));
  }
}

TEST(FBString, findWithNpos) {
  fbstring fbstr("localhost:80");
  EXPECT_EQ(fbstring::npos, fbstr.find(":", fbstring::npos));
}

TEST(FBString, testHash) {
  fbstring a;
  fbstring b;
  a.push_back(0);
  a.push_back(1);
  b.push_back(0);
  b.push_back(2);
  std::hash<fbstring> hashfunc;
  EXPECT_NE(hashfunc(a), hashfunc(b));
}

#if FOLLY_HAVE_WCHAR_SUPPORT
TEST(FBString, testHashChar16) {
  using u16fbstring = folly::basic_fbstring<char16_t>;
  u16fbstring a;
  u16fbstring b;
  a.push_back(0);
  a.push_back(1);
  b.push_back(0);
  b.push_back(2);
  std::hash<u16fbstring> hashfunc;
  EXPECT_NE(hashfunc(a), hashfunc(b));
}
#endif

TEST(FBString, testFrontBack) {
  fbstring str("hello");
  EXPECT_EQ(str.front(), 'h');
  EXPECT_EQ(str.back(), 'o');
  str.front() = 'H';
  EXPECT_EQ(str.front(), 'H');
  str.back() = 'O';
  EXPECT_EQ(str.back(), 'O');
  EXPECT_EQ(str, "HellO");
}

TEST(FBString, noexcept) {
  EXPECT_TRUE(noexcept(fbstring()));
  fbstring x;
  EXPECT_FALSE(noexcept(fbstring(x)));
  EXPECT_TRUE(noexcept(fbstring(std::move(x))));
  fbstring y;
  EXPECT_FALSE(noexcept(y = x));
  EXPECT_TRUE(noexcept(y = std::move(x)));
}

TEST(FBString, iomanip) {
  stringstream ss;
  fbstring fbstr("Hello");

  ss << setw(6) << fbstr;
  EXPECT_EQ(ss.str(), " Hello");
  ss.str("");

  ss << left << setw(6) << fbstr;
  EXPECT_EQ(ss.str(), "Hello ");
  ss.str("");

  ss << right << setw(6) << fbstr;
  EXPECT_EQ(ss.str(), " Hello");
  ss.str("");

  ss << setw(4) << fbstr;
  EXPECT_EQ(ss.str(), "Hello");
  ss.str("");

  ss << setfill('^') << setw(6) << fbstr;
  EXPECT_EQ(ss.str(), "^Hello");
  ss.str("");
}

TEST(FBString, rvalueIterators) {
  // you cannot take &* of a move-iterator, so use that for testing
  fbstring s = "base";
  fbstring r = "hello";
  r.replace(r.begin(), r.end(),
      make_move_iterator(s.begin()), make_move_iterator(s.end()));
  EXPECT_EQ("base", r);

  // The following test is probably not required by the standard.
  // i.e. this could be in the realm of undefined behavior.
  fbstring b = "123abcXYZ";
  auto ait = b.begin() + 3;
  auto Xit = b.begin() + 6;
  b.replace(ait, b.end(), b.begin(), Xit);
  EXPECT_EQ("123123abc", b); // if things go wrong, you'd get "123123123"
}

TEST(FBString, moveTerminator) {
  // The source of a move must remain in a valid state
  fbstring s(100, 'x'); // too big to be in-situ
  fbstring k;
  k = std::move(s);

  EXPECT_EQ(0, s.size());
  EXPECT_EQ('\0', *s.c_str());
}

namespace {
/*
 * t8968589: Clang 3.7 refused to compile w/ certain constructors (specifically
 * those that were "explicit" and had a defaulted parameter, if they were used
 * in structs which were default-initialized).  Exercise these just to ensure
 * they compile.
 *
 * In diff D2632953 the old constructor:
 *   explicit basic_fbstring(const A& a = A()) noexcept;
 *
 * was split into these two, as a workaround:
 *   basic_fbstring() noexcept;
 *   explicit basic_fbstring(const A& a) noexcept;
 */

struct TestStructDefaultAllocator {
  folly::basic_fbstring<char> stringMember;
};

template <class A>
struct TestStructWithAllocator {
  folly::basic_fbstring<char, std::char_traits<char>, A> stringMember;
};

std::atomic<size_t> allocatorConstructedCount(0);
struct TestStructStringAllocator : std::allocator<char> {
  TestStructStringAllocator() {
    ++ allocatorConstructedCount;
  }
};

}  // anon namespace

TEST(FBStringCtorTest, DefaultInitStructDefaultAlloc) {
  TestStructDefaultAllocator t1 { };
  EXPECT_TRUE(t1.stringMember.empty());
}

TEST(FBStringCtorTest, DefaultInitStructAlloc) {
  EXPECT_EQ(allocatorConstructedCount.load(), 0);
  TestStructWithAllocator<TestStructStringAllocator> t2;
  EXPECT_TRUE(t2.stringMember.empty());
  EXPECT_EQ(allocatorConstructedCount.load(), 1);
}

TEST(FBStringCtorTest, NullZeroConstruction) {
  char* p = nullptr;
  int n = 0;
  folly::fbstring f(p, n);
  EXPECT_EQ(f.size(), 0);
}
