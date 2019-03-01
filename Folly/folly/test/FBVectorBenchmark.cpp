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

#include <folly/Benchmark.h>
#include <folly/FBString.h>
#include <folly/FBVector.h>
#include <folly/Foreach.h>
#include <folly/Random.h>
#include <folly/Traits.h>
#include <folly/portability/GFlags.h>
#include <folly/portability/GTest.h>

#include <list>
#include <memory>
#include <boost/random.hpp>

using namespace std;
using namespace folly;

auto static const seed = randomNumberSeed();
typedef boost::mt19937 RandomT;
static RandomT rng(seed);

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
void Num2String(String& str, Integral /* n */) {
  str.resize(10, '\0');
  sprintf(&str[0], "%ul", 10);
  str.resize(strlen(str.c_str()));
}

std::list<char> RandomList(unsigned int maxSize) {
  std::list<char> lst(random(0u, maxSize));
  std::list<char>::iterator i = lst.begin();
  for (; i != lst.end(); ++i) {
    *i = random('a', 'z');
  }
  return lst;
}

template<class T> T randomObject();

template<> int randomObject<int>() {
  return random(0, 1024);
}

template<> folly::fbstring randomObject<folly::fbstring>() {
  folly::fbstring result;
  randomString(&result);
  return result;
}

#define CONCAT(A, B) CONCAT_HELPER(A, B)
#define CONCAT_HELPER(A, B) A##B
#define BENCHFUN(F) CONCAT(CONCAT(BM_, F), CONCAT(_, VECTOR))
#define TESTFUN(F) TEST(fbvector, CONCAT(F, VECTOR))

typedef vector<int> IntVector;
typedef fbvector<int> IntFBVector;
typedef vector<folly::fbstring> FBStringVector;
typedef fbvector<folly::fbstring> FBStringFBVector;

#define VECTOR IntVector
#include <folly/test/FBVectorTestBenchmarks.cpp.h> // nolint
#undef VECTOR
#define VECTOR IntFBVector
#include <folly/test/FBVectorTestBenchmarks.cpp.h> // nolint
#undef VECTOR
#define VECTOR FBStringVector
#include <folly/test/FBVectorTestBenchmarks.cpp.h> // nolint
#undef VECTOR
#define VECTOR FBStringFBVector
#include <folly/test/FBVectorTestBenchmarks.cpp.h> // nolint
#undef VECTOR

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}
