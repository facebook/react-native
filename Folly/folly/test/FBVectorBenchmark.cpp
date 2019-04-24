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

//
// Author: andrei.alexandrescu@fb.com

#include <deque>
#include <list>
#include <memory>
#include <string>

#include <boost/random.hpp>

#include <folly/FBVector.h>
#include <folly/Traits.h>
#include <folly/container/Foreach.h>
#include <folly/portability/GFlags.h>
#include <folly/small_vector.h>
#include <folly/test/FBVectorTestUtil.h>

using namespace std;
using namespace folly;
using namespace folly::test::detail;

using IntVector = vector<int>;
using IntFBVector = fbvector<int>;
using IntList = list<int>;
using IntDeque = deque<int>;
using IntSmallVector = small_vector<int>;

using StringVector = vector<std::string>;
using StringFBVector = fbvector<std::string>;
using StringList = list<std::string>;
using StringDeque = deque<std::string>;
using StringSmallVector = small_vector<std::string>;

using FBStringVector = vector<folly::fbstring>;
using FBStringFBVector = fbvector<folly::fbstring>;

#define VECTOR IntVector
#include <folly/test/FBVectorBenchmarks.cpp.h> // nolint
#undef VECTOR
#define VECTOR IntFBVector
#include <folly/test/FBVectorBenchmarks.cpp.h> // nolint
#undef VECTOR
#define VECTOR IntSmallVector
#include <folly/test/FBVectorBenchmarks.cpp.h> // nolint
#undef VECTOR
#define VECTOR IntList
#define SKIP_RESERVE
#include <folly/test/FBVectorBenchmarks.cpp.h> // nolint
#undef SKIP_RESERVE
#undef VECTOR
#define VECTOR IntDeque
#define SKIP_RESERVE
#include <folly/test/FBVectorBenchmarks.cpp.h> // nolint
#undef SKIP_RESERVE
#undef VECTOR

#define VECTOR StringVector
#include <folly/test/FBVectorBenchmarks.cpp.h> // nolint
#undef VECTOR
#define VECTOR StringFBVector
#include <folly/test/FBVectorBenchmarks.cpp.h> // nolint
#undef VECTOR
#define VECTOR StringSmallVector
#include <folly/test/FBVectorBenchmarks.cpp.h> // nolint
#undef VECTOR
#define VECTOR StringList
#define SKIP_RESERVE
#include <folly/test/FBVectorBenchmarks.cpp.h> // nolint
#undef SKIP_RESERVE
#undef VECTOR
#define VECTOR StringDeque
#define SKIP_RESERVE
#include <folly/test/FBVectorBenchmarks.cpp.h> // nolint
#undef SKIP_RESERVE
#undef VECTOR

#define VECTOR FBStringVector
#include <folly/test/FBVectorBenchmarks.cpp.h> // nolint
#undef VECTOR
#define VECTOR FBStringFBVector
#include <folly/test/FBVectorBenchmarks.cpp.h> // nolint
#undef VECTOR

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  gflags::SetCommandLineOptionWithMode(
      "bm_max_iters", "1000000", gflags::SET_FLAG_IF_DEFAULT);
  gflags::SetCommandLineOptionWithMode(
      "bm_min_iters", "100000", gflags::SET_FLAG_IF_DEFAULT);
  gflags::SetCommandLineOptionWithMode(
      "bm_max_secs", "1", gflags::SET_FLAG_IF_DEFAULT);

  folly::runBenchmarks();
  return 0;
}

// clang-format off
/*
============================================================================
buck-out/opt/gen/folly/test/fbvector_benchmark#gcc-5-glibc-2.23,private-headers/folly/test/FBVectorBenchmarks.cpp.hrelative  time/iter  iters/s
============================================================================
BM_zzInitRNG_IntVector                                       1.05us  951.24K
BM_defaultCtor_IntVector                                     1.31ns  765.93M
BM_sizeCtor_IntVector(16)                                   19.33ns   51.73M
BM_sizeCtor_IntVector(128)                                  42.11ns   23.75M
BM_sizeCtor_IntVector(1024)                                 60.90ns   16.42M
BM_fillCtor_IntVector(16)                                   30.67ns   32.61M
BM_fillCtor_IntVector(128)                                  41.22ns   24.26M
BM_fillCtor_IntVector(1024)                                133.70ns    7.48M
BM_reserve_IntVector(16)                                    40.27ns   24.83M
BM_reserve_IntVector(128)                                   40.20ns   24.88M
BM_reserve_IntVector(1024)                                  40.17ns   24.90M
BM_insertFront_IntVector(16)                                 7.90us  126.52K
BM_insertFront_IntVector(128)                                8.12us  123.09K
BM_insertFront_IntVector(1024)                               8.30us  120.46K
BM_insertFront_IntVector(10240)                             10.14us   98.67K
BM_insertFront_IntVector(102400)                            30.71us   32.56K
BM_insertFront_IntVector(1024000)                          220.69us    4.53K
BM_pushBack_IntVector(16)                                  776.38ps    1.29G
BM_pushBack_IntVector(128)                                 775.89ps    1.29G
BM_pushBack_IntVector(1024)                                742.50ps    1.35G
BM_pushBack_IntVector(10240)                               787.75ps    1.27G
BM_pushBack_IntVector(102400)                              714.07ps    1.40G
BM_pushBack_IntVector(1024000)                               3.15ns  317.26M
BM_zzInitRNG_IntFBVector                                     1.17us  853.35K
BM_defaultCtor_IntFBVector                                 989.76ps    1.01G
BM_sizeCtor_IntFBVector(16)                                 27.19ns   36.78M
BM_sizeCtor_IntFBVector(128)                                46.73ns   21.40M
BM_sizeCtor_IntFBVector(1024)                               69.03ns   14.49M
BM_fillCtor_IntFBVector(16)                                 35.97ns   27.80M
BM_fillCtor_IntFBVector(128)                                55.11ns   18.15M
BM_fillCtor_IntFBVector(1024)                              147.89ns    6.76M
BM_reserve_IntFBVector(16)                                  54.18ns   18.46M
BM_reserve_IntFBVector(128)                                 54.24ns   18.44M
BM_reserve_IntFBVector(1024)                                54.24ns   18.44M
BM_insertFront_IntFBVector(16)                               8.41us  118.86K
BM_insertFront_IntFBVector(128)                              8.45us  118.41K
BM_insertFront_IntFBVector(1024)                             8.56us  116.80K
BM_insertFront_IntFBVector(10240)                           10.72us   93.32K
BM_insertFront_IntFBVector(102400)                          30.83us   32.43K
BM_insertFront_IntFBVector(1024000)                        217.31us    4.60K
BM_pushBack_IntFBVector(16)                                  2.05ns  488.26M
BM_pushBack_IntFBVector(128)                                 1.99ns  503.65M
BM_pushBack_IntFBVector(1024)                                2.16ns  462.50M
BM_pushBack_IntFBVector(10240)                               2.13ns  468.48M
BM_pushBack_IntFBVector(102400)                              1.93ns  517.23M
BM_pushBack_IntFBVector(1024000)                             1.89ns  529.29M
BM_zzInitRNG_IntSmallVector                                  1.17us  855.04K
BM_defaultCtor_IntSmallVector                              698.82ps    1.43G
BM_sizeCtor_IntSmallVector(16)                              37.59ns   26.60M
BM_sizeCtor_IntSmallVector(128)                             85.90ns   11.64M
BM_sizeCtor_IntSmallVector(1024)                           401.37ns    2.49M
BM_fillCtor_IntSmallVector(16)                              48.22ns   20.74M
BM_fillCtor_IntSmallVector(128)                             99.99ns   10.00M
BM_fillCtor_IntSmallVector(1024)                           458.71ns    2.18M
BM_reserve_IntSmallVector(16)                               44.30ns   22.57M
BM_reserve_IntSmallVector(128)                              44.29ns   22.58M
BM_reserve_IntSmallVector(1024)                             45.15ns   22.15M
BM_insertFront_IntSmallVector(16)                            8.40us  119.11K
BM_insertFront_IntSmallVector(128)                           7.74us  129.25K
BM_insertFront_IntSmallVector(1024)                          8.17us  122.47K
BM_insertFront_IntSmallVector(10240)                        10.17us   98.34K
BM_insertFront_IntSmallVector(102400)                       29.60us   33.79K
BM_insertFront_IntSmallVector(1024000)                     208.82us    4.79K
BM_pushBack_IntSmallVector(16)                               2.92ns  342.66M
BM_pushBack_IntSmallVector(128)                              2.91ns  343.36M
BM_pushBack_IntSmallVector(1024)                             2.76ns  362.74M
BM_pushBack_IntSmallVector(10240)                            2.71ns  369.18M
BM_pushBack_IntSmallVector(102400)                           3.04ns  329.36M
BM_pushBack_IntSmallVector(1024000)                          4.90ns  204.21M
BM_zzInitRNG_IntList                                         1.04us  958.67K
BM_defaultCtor_IntList                                     911.25ps    1.10G
BM_sizeCtor_IntList(16)                                    264.10ns    3.79M
BM_sizeCtor_IntList(128)                                     2.08us  481.87K
BM_sizeCtor_IntList(1024)                                   35.52us   28.15K
BM_fillCtor_IntList(16)                                    269.86ns    3.71M
BM_fillCtor_IntList(128)                                     2.12us  470.70K
BM_fillCtor_IntList(1024)                                   46.59us   21.47K
BM_insertFront_IntList(16)                                  18.88ns   52.95M
BM_insertFront_IntList(128)                                 19.67ns   50.85M
BM_insertFront_IntList(1024)                                18.79ns   53.22M
BM_insertFront_IntList(10240)                               20.47ns   48.85M
BM_insertFront_IntList(102400)                              17.43ns   57.37M
BM_insertFront_IntList(1024000)                             17.65ns   56.65M
BM_pushBack_IntList(16)                                     20.45ns   48.89M
BM_pushBack_IntList(128)                                    21.54ns   46.42M
BM_pushBack_IntList(1024)                                   20.14ns   49.64M
BM_pushBack_IntList(10240)                                  21.21ns   47.15M
BM_pushBack_IntList(102400)                                 18.53ns   53.98M
BM_pushBack_IntList(1024000)                                22.16ns   45.12M
BM_zzInitRNG_IntDeque                                        1.14us  879.33K
BM_defaultCtor_IntDeque                                     33.14ns   30.18M
BM_sizeCtor_IntDeque(16)                                    44.34ns   22.56M
BM_sizeCtor_IntDeque(128)                                   81.28ns   12.30M
BM_sizeCtor_IntDeque(1024)                                 338.93ns    2.95M
BM_fillCtor_IntDeque(16)                                    52.18ns   19.16M
BM_fillCtor_IntDeque(128)                                   76.01ns   13.16M
BM_fillCtor_IntDeque(1024)                                 329.99ns    3.03M
BM_insertFront_IntDeque(16)                                  2.56ns  390.51M
BM_insertFront_IntDeque(128)                                 2.48ns  403.57M
BM_insertFront_IntDeque(1024)                                2.31ns  432.60M
BM_insertFront_IntDeque(10240)                               2.30ns  434.90M
BM_insertFront_IntDeque(102400)                              2.32ns  431.00M
BM_insertFront_IntDeque(1024000)                             2.36ns  423.26M
BM_pushBack_IntDeque(16)                                   935.50ps    1.07G
BM_pushBack_IntDeque(128)                                  935.72ps    1.07G
BM_pushBack_IntDeque(1024)                                 942.23ps    1.06G
BM_pushBack_IntDeque(10240)                                934.27ps    1.07G
BM_pushBack_IntDeque(102400)                               947.61ps    1.06G
BM_pushBack_IntDeque(1024000)                              993.47ps    1.01G
BM_zzInitRNG_StringVector                                    1.03us  966.54K
BM_defaultCtor_StringVector                                911.27ps    1.10G
BM_sizeCtor_StringVector(16)                                35.94ns   27.83M
BM_sizeCtor_StringVector(128)                              233.07ns    4.29M
BM_sizeCtor_StringVector(1024)                               1.83us  546.61K
BM_fillCtor_StringVector(16)                                10.30us   97.07K
BM_fillCtor_StringVector(128)                               21.56us   46.37K
BM_fillCtor_StringVector(1024)                             128.63us    7.77K
BM_reserve_StringVector(16)                                 45.76ns   21.85M
BM_reserve_StringVector(128)                                60.52ns   16.52M
BM_reserve_StringVector(1024)                               59.59ns   16.78M
BM_insertFront_StringVector(16)                            124.99us    8.00K
BM_insertFront_StringVector(128)                           120.57us    8.29K
BM_insertFront_StringVector(1024)                          126.47us    7.91K
BM_insertFront_StringVector(10240)                         153.43us    6.52K
BM_insertFront_StringVector(102400)                        380.73us    2.63K
BM_insertFront_StringVector(1024000)                         3.96ms   252.31
BM_pushBack_StringVector(16)                                40.16ns   24.90M
BM_pushBack_StringVector(128)                               41.94ns   23.85M
BM_pushBack_StringVector(1024)                              36.92ns   27.08M
BM_pushBack_StringVector(10240)                             18.19ns   54.99M
BM_pushBack_StringVector(102400)                            41.21ns   24.27M
BM_pushBack_StringVector(1024000)                          234.95ns    4.26M
BM_zzInitRNG_StringFBVector                                  1.05us  956.06K
BM_defaultCtor_StringFBVector                              911.25ps    1.10G
BM_sizeCtor_StringFBVector(16)                              38.40ns   26.04M
BM_sizeCtor_StringFBVector(128)                            202.10ns    4.95M
BM_sizeCtor_StringFBVector(1024)                             1.68us  593.56K
BM_fillCtor_StringFBVector(16)                               6.65us  150.29K
BM_fillCtor_StringFBVector(128)                             14.76us   67.76K
BM_fillCtor_StringFBVector(1024)                           117.60us    8.50K
BM_reserve_StringFBVector(16)                               60.40ns   16.56M
BM_reserve_StringFBVector(128)                              62.28ns   16.06M
BM_reserve_StringFBVector(1024)                             66.76ns   14.98M
BM_insertFront_StringFBVector(16)                          126.51us    7.90K
BM_insertFront_StringFBVector(128)                         121.29us    8.24K
BM_insertFront_StringFBVector(1024)                        129.81us    7.70K
BM_insertFront_StringFBVector(10240)                       148.77us    6.72K
BM_insertFront_StringFBVector(102400)                      380.46us    2.63K
BM_insertFront_StringFBVector(1024000)                       3.73ms   268.02
BM_pushBack_StringFBVector(16)                              11.89ns   84.13M
BM_pushBack_StringFBVector(128)                             20.32ns   49.20M
BM_pushBack_StringFBVector(1024)                            47.91ns   20.87M
BM_pushBack_StringFBVector(10240)                           39.74ns   25.16M
BM_pushBack_StringFBVector(102400)                          36.86ns   27.13M
BM_pushBack_StringFBVector(1024000)                        285.22ns    3.51M
BM_zzInitRNG_StringSmallVector                               1.04us  965.73K
BM_defaultCtor_StringSmallVector                           607.54ps    1.65G
BM_sizeCtor_StringSmallVector(16)                           44.30ns   22.57M
BM_sizeCtor_StringSmallVector(128)                         234.40ns    4.27M
BM_sizeCtor_StringSmallVector(1024)                          1.96us  510.33K
BM_fillCtor_StringSmallVector(16)                            6.12us  163.46K
BM_fillCtor_StringSmallVector(128)                          18.65us   53.63K
BM_fillCtor_StringSmallVector(1024)                        132.36us    7.56K
BM_reserve_StringSmallVector(16)                            43.86ns   22.80M
BM_reserve_StringSmallVector(128)                           51.03ns   19.60M
BM_reserve_StringSmallVector(1024)                          48.61ns   20.57M
BM_insertFront_StringSmallVector(16)                       127.32us    7.85K
BM_insertFront_StringSmallVector(128)                      118.93us    8.41K
BM_insertFront_StringSmallVector(1024)                     130.04us    7.69K
BM_insertFront_StringSmallVector(10240)                    143.89us    6.95K
BM_insertFront_StringSmallVector(102400)                   386.40us    2.59K
BM_insertFront_StringSmallVector(1024000)                    3.74ms   267.73
BM_pushBack_StringSmallVector(16)                           50.77ns   19.70M
BM_pushBack_StringSmallVector(128)                          44.12ns   22.67M
BM_pushBack_StringSmallVector(1024)                         45.62ns   21.92M
BM_pushBack_StringSmallVector(10240)                        69.06ns   14.48M
BM_pushBack_StringSmallVector(102400)                      139.62ns    7.16M
BM_pushBack_StringSmallVector(1024000)                     445.65ns    2.24M
BM_zzInitRNG_StringList                                      1.17us  854.00K
BM_defaultCtor_StringList                                  911.39ps    1.10G
BM_sizeCtor_StringList(16)                                 309.90ns    3.23M
BM_sizeCtor_StringList(128)                                  3.18us  314.57K
BM_sizeCtor_StringList(1024)                                41.72us   23.97K
BM_fillCtor_StringList(16)                                   7.12us  140.54K
BM_fillCtor_StringList(128)                                 19.22us   52.04K
BM_fillCtor_StringList(1024)                               160.20us    6.24K
BM_insertFront_StringList(16)                               27.71ns   36.09M
BM_insertFront_StringList(128)                              51.34ns   19.48M
BM_insertFront_StringList(1024)                             55.53ns   18.01M
BM_insertFront_StringList(10240)                            24.62ns   40.62M
BM_insertFront_StringList(102400)                           25.63ns   39.02M
BM_insertFront_StringList(1024000)                         341.85ns    2.93M
BM_pushBack_StringList(16)                                  28.69ns   34.85M
BM_pushBack_StringList(128)                                 29.11ns   34.36M
BM_pushBack_StringList(1024)                                33.28ns   30.05M
BM_pushBack_StringList(10240)                               26.47ns   37.78M
BM_pushBack_StringList(102400)                              48.51ns   20.62M
BM_pushBack_StringList(1024000)                             75.97ns   13.16M
BM_zzInitRNG_StringDeque                                     1.17us  852.21K
BM_defaultCtor_StringDeque                                  39.44ns   25.36M
BM_sizeCtor_StringDeque(16)                                 88.29ns   11.33M
BM_sizeCtor_StringDeque(128)                               444.53ns    2.25M
BM_sizeCtor_StringDeque(1024)                                6.20us  161.17K
BM_fillCtor_StringDeque(16)                                  6.82us  146.73K
BM_fillCtor_StringDeque(128)                                16.95us   58.99K
BM_fillCtor_StringDeque(1024)                              121.97us    8.20K
BM_insertFront_StringDeque(16)                              10.75ns   92.98M
BM_insertFront_StringDeque(128)                             40.83ns   24.49M
BM_insertFront_StringDeque(1024)                            10.26ns   97.43M
BM_insertFront_StringDeque(10240)                           37.85ns   26.42M
BM_insertFront_StringDeque(102400)                          34.75ns   28.78M
BM_insertFront_StringDeque(1024000)                         39.31ns   25.44M
BM_pushBack_StringDeque(16)                                 11.32ns   88.31M
BM_pushBack_StringDeque(128)                                11.93ns   83.80M
BM_pushBack_StringDeque(1024)                               10.41ns   96.02M
BM_pushBack_StringDeque(10240)                               9.83ns  101.72M
BM_pushBack_StringDeque(102400)                             64.98ns   15.39M
BM_pushBack_StringDeque(1024000)                            33.45ns   29.89M
BM_zzInitRNG_FBStringVector                                  1.17us  855.50K
BM_defaultCtor_FBStringVector                              989.77ps    1.01G
BM_sizeCtor_FBStringVector(16)                              35.38ns   28.26M
BM_sizeCtor_FBStringVector(128)                            180.30ns    5.55M
BM_sizeCtor_FBStringVector(1024)                             1.21us  823.15K
BM_fillCtor_FBStringVector(16)                               6.42us  155.85K
BM_fillCtor_FBStringVector(128)                              8.90us  112.32K
BM_fillCtor_FBStringVector(1024)                            36.57us   27.35K
BM_reserve_FBStringVector(16)                               50.12ns   19.95M
BM_reserve_FBStringVector(128)                              50.09ns   19.96M
BM_reserve_FBStringVector(1024)                             53.58ns   18.66M
BM_insertFront_FBStringVector(16)                          105.90us    9.44K
BM_insertFront_FBStringVector(128)                         102.06us    9.80K
BM_insertFront_FBStringVector(1024)                        103.67us    9.65K
BM_insertFront_FBStringVector(10240)                       122.63us    8.15K
BM_insertFront_FBStringVector(102400)                      312.48us    3.20K
BM_insertFront_FBStringVector(1024000)                       2.30ms   434.80
BM_pushBack_FBStringVector(16)                              10.18ns   98.26M
BM_pushBack_FBStringVector(128)                             10.13ns   98.75M
BM_pushBack_FBStringVector(1024)                            10.14ns   98.62M
BM_pushBack_FBStringVector(10240)                           11.60ns   86.19M
BM_pushBack_FBStringVector(102400)                           8.47ns  118.02M
BM_pushBack_FBStringVector(1024000)                         88.01ns   11.36M
BM_zzInitRNG_FBStringFBVector                                1.03us  971.03K
BM_defaultCtor_FBStringFBVector                            911.25ps    1.10G
BM_sizeCtor_FBStringFBVector(16)                            33.53ns   29.82M
BM_sizeCtor_FBStringFBVector(128)                          135.17ns    7.40M
BM_sizeCtor_FBStringFBVector(1024)                         951.05ns    1.05M
BM_fillCtor_FBStringFBVector(16)                             5.71us  175.27K
BM_fillCtor_FBStringFBVector(128)                            8.11us  123.37K
BM_fillCtor_FBStringFBVector(1024)                          37.95us   26.35K
BM_reserve_FBStringFBVector(16)                             54.53ns   18.34M
BM_reserve_FBStringFBVector(128)                            51.41ns   19.45M
BM_reserve_FBStringFBVector(1024)                           55.52ns   18.01M
BM_insertFront_FBStringFBVector(16)                         58.80us   17.01K
BM_insertFront_FBStringFBVector(128)                        58.45us   17.11K
BM_insertFront_FBStringFBVector(1024)                       59.08us   16.93K
BM_insertFront_FBStringFBVector(10240)                      69.85us   14.32K
BM_insertFront_FBStringFBVector(102400)                    176.99us    5.65K
BM_insertFront_FBStringFBVector(1024000)                     4.07ms   245.84
BM_pushBack_FBStringFBVector(16)                             4.19ns  238.39M
BM_pushBack_FBStringFBVector(128)                            3.76ns  265.90M
BM_pushBack_FBStringFBVector(1024)                           4.68ns  213.66M
BM_pushBack_FBStringFBVector(10240)                          3.24ns  309.08M
BM_pushBack_FBStringFBVector(102400)                         3.17ns  315.07M
BM_pushBack_FBStringFBVector(1024000)                       25.88ns   38.65M
============================================================================
*/
// clang-format on
