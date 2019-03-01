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

#include <folly/Benchmark.h>
#include <folly/Range.h>

#include <algorithm>

using namespace std;
using namespace folly;

string lorem_ipsum =
"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam"
"lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam"
"viverra nec consectetur ante hendrerit. Donec et mollis"
"dolor. Praesent et diam eget libero egestas mattis sit amet vitae"
"augue. Nam tincidunt congue enim, ut porta lorem lacinia"
"consectetur. Donec ut libero sed arcu vehicula ultricies a non"
"tortor. Lorem ipsum dolor sit amet, consectetur adipiscing"
"elit. Aenean ut gravida lorem. Ut turpis felis, pulvinar a semper sed,"
"adipiscing id dolor. Pellentesque auctor nisi id magna consequat"
"sagittis. Curabitur dapibus enim sit amet elit pharetra tincidunt"
"feugiat nisl imperdiet. Ut convallis libero in urna ultrices"
"accumsan. Donec sed odio eros. Donec viverra mi quis quam pulvinar at"
"malesuada arcu rhoncus. Cum sociis natoque penatibus et magnis dis"
"parturient montes, nascetur ridiculus mus. In rutrum accumsan"
"ultricies. Mauris vitae nisi at sem facilisis semper ac in est."
"\n"
"Vivamus fermentum semper porta. Nunc diam velit, adipiscing ut"
"tristique vitae, sagittis vel odio. Maecenas convallis ullamcorper"
"ultricies. Curabitur ornare, ligula semper consectetur sagittis, nisi"
"diam iaculis velit, id fringilla sem nunc vel mi. Nam dictum, odio nec"
"pretium volutpat, arcu ante placerat erat, non tristique elit urna et"
"turpis. Quisque mi metus, ornare sit amet fermentum et, tincidunt et"
"orci. Fusce eget orci a orci congue vestibulum. Ut dolor diam,"
"elementum et vestibulum eu, porttitor vel elit. Curabitur venenatis"
"pulvinar tellus gravida ornare. Sed et erat faucibus nunc euismod"
"ultricies ut id justo. Nullam cursus suscipit nisi, et ultrices justo"
"sodales nec. Fusce venenatis facilisis lectus ac semper. Aliquam at"
"massa ipsum. Quisque bibendum purus convallis nulla ultrices"
"ultricies. Nullam aliquam, mi eu aliquam tincidunt, purus velit"
"laoreet tortor, viverra pretium nisi quam vitae mi. Fusce vel volutpat"
"elit. Nam sagittis nisi dui."
"\n"
"Suspendisse lectus leo, consectetur in tempor sit amet, placerat quis"
"neque. Etiam luctus porttitor lorem, sed suscipit est rutrum"
"non. Curabitur lobortis nisl a enim congue semper. Aenean commodo"
"ultrices imperdiet. Vestibulum ut justo vel sapien venenatis"
"tincidunt. Phasellus eget dolor sit amet ipsum dapibus condimentum"
"vitae quis lectus. Aliquam ut massa in turpis dapibus"
"convallis. Praesent elit lacus, vestibulum at malesuada et, ornare et"
"est. Ut augue nunc, sodales ut euismod non, adipiscing vitae"
"orci. Mauris ut placerat justo. Mauris in ultricies enim. Quisque nec"
"est eleifend nulla ultrices egestas quis ut quam. Donec sollicitudin"
"lectus a mauris pulvinar id aliquam urna cursus. Cras quis ligula sem,"
"vel elementum mi. Phasellus non ullamcorper urna."
"\n"
"Class aptent taciti sociosqu ad litora torquent per conubia nostra,"
"per inceptos himenaeos. In euismod ultrices facilisis. Vestibulum"
"porta sapien adipiscing augue congue id pretium lectus molestie. Proin"
"quis dictum nisl. Morbi id quam sapien, sed vestibulum sem. Duis"
"elementum rutrum mauris sed convallis. Proin vestibulum magna"
"mi. Aenean tristique hendrerit magna, ac facilisis nulla hendrerit"
"ut. Sed non tortor sodales quam auctor elementum. Donec hendrerit nunc"
"eget elit pharetra pulvinar. Suspendisse id tempus tortor. Aenean"
"luctus, elit commodo laoreet commodo, justo nisi consequat massa, sed"
"vulputate quam urna quis eros. Donec vel."
"\n";

const string needle = "commodo";

// legacy implementation
struct AsciiCaseInsensitiveLegacy {
  bool operator()(char lhs, char rhs) const {
    return toupper(lhs) == toupper(rhs);
  }
};

template<typename Cmp>
inline void test_operator_on_search(int iters) {
  Cmp cmp;
  int dummy = 0;
  for (int i = 0; i < iters; ++i) {
    dummy += std::search(
      lorem_ipsum.begin(), lorem_ipsum.end(),
      needle.begin(), needle.end(),
      cmp
    ) - lorem_ipsum.begin();
  }
  doNotOptimizeAway(dummy);
}

BENCHMARK(LegacyCaseInsensitiveCheck, iters) {
  test_operator_on_search<AsciiCaseInsensitiveLegacy>(iters);
}

BENCHMARK(CurrentCaseInsensitiveCheck, iters) {
  test_operator_on_search<AsciiCaseInsensitive>(iters);
}

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  if (FLAGS_benchmark) {
    folly::runBenchmarks();
  }
  return 0;
}

/*
============================================================================
folly/test/AsciiCaseInsensitiveBenchmark.cpp    relative  time/iter  iters/s
============================================================================
LegacyCaseInsensitiveCheck                                   9.04us  110.60K
CurrentCaseInsensitiveCheck                                  2.96us  337.59K
============================================================================
*/
