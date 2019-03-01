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

#include <cstdlib>
#include <list>
#include <fstream>
#include <sstream>

#include <boost/random.hpp>

#include <folly/Benchmark.h>
#include <folly/Foreach.h>
#include <folly/Random.h>
#include <folly/portability/GFlags.h>

using namespace std;
using namespace folly;

static const int seed = folly::randomNumberSeed();
typedef boost::mt19937 RandomT;
static RandomT rng(seed);

template <class Integral1, class Integral2>
Integral2 random(Integral1 low, Integral2 up) {
  boost::uniform_int<> range(low, up);
  return range(rng);
}

template <class String>
void randomString(String* toFill, size_t size = 1000) {
  assert(toFill);
  toFill->resize(size);
  FOR_EACH (i, *toFill) {
    *i = random('a', 'z');
  }
}

template <class String>
void randomBinaryString(String* toFill, size_t size = 1000) {
  assert(toFill);
  toFill->resize(size);
  FOR_EACH (i, *toFill) {
    *i = random('0', '1');
  }
}

template <class String, class Integral>
void Num2String(String& str, Integral n) {
  str.resize(30, '\0');
  sprintf(&str[0], "%lu", static_cast<unsigned long>(n));
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

#define CONCAT(A, B) CONCAT_HELPER(A, B)
#define CONCAT_HELPER(A, B) A##B
#define BENCHFUN(F) CONCAT(CONCAT(BM_, F), CONCAT(_, STRING))

#define STRING string
#include <folly/test/FBStringTestBenchmarks.cpp.h> // nolint
#undef STRING
#define STRING fbstring
#include <folly/test/FBStringTestBenchmarks.cpp.h> // nolint
#undef STRING

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}

/*
malloc

BENCHFUN(defaultCtor)                  100000  1.426 s   14.26 us  68.47 k
BM_copyCtor_string/32k                 100000  63.48 ms  634.8 ns  1.502 M
BM_ctorFromArray_string/32k            100000  303.3 ms  3.033 us  321.9 k
BM_ctorFromChar_string/1M              100000  9.915 ms  99.15 ns  9.619 M
BM_assignmentOp_string/256             100000  69.09 ms  690.9 ns   1.38 M
BENCHFUN(assignmentFill)               100000  1.775 ms  17.75 ns  53.73 M
BM_resize_string/512k                  100000  1.667 s   16.67 us  58.58 k
BM_findSuccessful_string/512k          100000  287.3 ms  2.873 us  339.9 k
BM_findUnsuccessful_string/512k        100000  320.3 ms  3.203 us  304.9 k
BM_replace_string/256                  100000  69.68 ms  696.8 ns  1.369 M
BM_push_back_string/1k                 100000  433.1 ms  4.331 us  225.5 k

BENCHFUN(defaultCtor)                  100000  1.086 s   10.86 us  89.91 k
BM_copyCtor_fbstring/32k               100000  4.218 ms  42.18 ns  22.61 M
BM_ctorFromArray_fbstring/32k          100000  145.2 ms  1.452 us  672.7 k
BM_ctorFromChar_fbstring/1M            100000   9.21 ms   92.1 ns  10.35 M
BM_assignmentOp_fbstring/256           100000  61.95 ms  619.5 ns   1.54 M
BENCHFUN(assignmentFill)               100000   1.41 ms   14.1 ns  67.64 M
BM_resize_fbstring/512k                100000  1.668 s   16.68 us  58.56 k
BM_findSuccessful_fbstring/512k        100000   20.6 ms    206 ns  4.629 M
BM_findUnsuccessful_fbstring/512k      100000  141.3 ms  1.413 us  691.1 k
BM_replace_fbstring/256                100000  77.12 ms  771.2 ns  1.237 M
BM_push_back_fbstring/1k               100000  1.745 s   17.45 us  55.95 k

jemalloc

BENCHFUN(defaultCtor)                  100000  1.426 s   14.26 us   68.5 k
BM_copyCtor_string/32k                 100000  275.7 ms  2.757 us  354.2 k
BM_ctorFromArray_string/32k            100000    270 ms    2.7 us  361.7 k
BM_ctorFromChar_string/1M              100000  10.36 ms  103.6 ns  9.206 M
BM_assignmentOp_string/256             100000  70.44 ms  704.3 ns  1.354 M
BENCHFUN(assignmentFill)               100000  1.766 ms  17.66 ns     54 M
BM_resize_string/512k                  100000  1.675 s   16.75 us  58.29 k
BM_findSuccessful_string/512k          100000  90.89 ms  908.9 ns  1.049 M
BM_findUnsuccessful_string/512k        100000  315.1 ms  3.151 us  309.9 k
BM_replace_string/256                  100000  71.14 ms  711.4 ns  1.341 M
BM_push_back_string/1k                 100000  425.1 ms  4.251 us  229.7 k

BENCHFUN(defaultCtor)                  100000  1.082 s   10.82 us  90.23 k
BM_copyCtor_fbstring/32k               100000  4.213 ms  42.13 ns  22.64 M
BM_ctorFromArray_fbstring/32k          100000  113.2 ms  1.132 us    863 k
BM_ctorFromChar_fbstring/1M            100000  9.162 ms  91.62 ns  10.41 M
BM_assignmentOp_fbstring/256           100000  61.34 ms  613.4 ns  1.555 M
BENCHFUN(assignmentFill)               100000  1.408 ms  14.08 ns  67.73 M
BM_resize_fbstring/512k                100000  1.671 s   16.71 us  58.43 k
BM_findSuccessful_fbstring/512k        100000  8.723 ms  87.23 ns  10.93 M
BM_findUnsuccessful_fbstring/512k      100000  141.3 ms  1.413 us  691.2 k
BM_replace_fbstring/256                100000  77.83 ms  778.3 ns  1.225 M
BM_push_back_fbstring/1k               100000  1.744 s   17.44 us  55.99 k
*/
