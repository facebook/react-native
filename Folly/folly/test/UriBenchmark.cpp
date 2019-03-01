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

#include <folly/Uri.h>

#include <folly/Benchmark.h>
#include <folly/init/Init.h>

using namespace folly;

/**
 * Result of benchmark varies by the complexity of query.
 * ============================================================================
 * folly/test/UriTest.cpp                          relative  time/iter  iters/s
 * ============================================================================
 * init_uri_simple                                              4.88us  204.80K
 * init_uri_simple_with_query_parsing                          22.46us   44.52K
 * init_uri_complex                                             5.92us  168.85K
 * init_uri_complex_with_query_parsing                         48.70us   20.53K
 * ============================================================================
 */
BENCHMARK(init_uri_simple, iters) {
  const fbstring s("http://localhost?&key1=foo&key2=&key3&=bar&=bar=&");
  for (size_t i = 0; i < iters; ++i) {
    Uri u(s);
  }
}

BENCHMARK(init_uri_simple_with_query_parsing, iters) {
  const fbstring s("http://localhost?&key1=foo&key2=&key3&=bar&=bar=&");
  for (size_t i = 0; i < iters; ++i) {
    Uri u(s);
    u.getQueryParams();
  }
}

BENCHMARK(init_uri_complex, iters) {
  const fbstring s(
      "https://mock.example.com/farm/track.php?TmOxQUDF=uSmTS_VwhjKnh_JME&DI"
      "h=fbbN&GRsoIm=bGshjaUqavZxQai&UMT=36k18N4dn21&3U=CD8o4A4497W152j6m0V%14"
      "%57&Hy=t%05mpr.80JUZ7ne_%23zS8DcA%0qc_%291ymamz096%11Zfb3r%09ZqPD%311ZX"
      "tqJd600ot&5U96U-Rh-VZ=-D_6-9xKYj%1gW6b43s1B9-j21P0oUW5-t46G4kgt&ezgj=mcW"
      "TTQ.c&Oh=%2PblUfuC%7C997048884827569%03xnyJ%2L1pi7irBioQ6D4r7nNHNdo6v7Y%"
      "84aurnSJ%2wCFePHMlGZmIHGfCe7392_lImWsSvN&sBeNN=Nf%80yOE%6X10M64F4gG197aX"
      "R2B4g2533x235A0i4e%57%58uWB%04Erw.60&VMS4=Ek_%02GC0Pkx%6Ov_%207WICUz007%"
      "04nYX8N%46zzpv%999h&KGmBt988y=q4P57C-Dh-Nz-x_7-5oPxz%1gz3N03t6c7-R67N4DT"
      "Y6-f98W1&Lts&%02dOty%8eEYEnLz4yexQQLnL4MGU2JFn3OcmXcatBcabZgBdDdy67hdgW"
      "tYn4");
  for (size_t i = 0; i < iters; ++i) {
    Uri u(s);
  }
}

BENCHMARK(init_uri_complex_with_query_parsing, iters) {
  const fbstring s(
      "https://mock.example.com/farm/track.php?TmOxQUDF=uSmTS_VwhjKnh_JME&DI"
      "h=fbbN&GRsoIm=bGshjaUqavZxQai&UMT=36k18N4dn21&3U=CD8o4A4497W152j6m0V%14"
      "%57&Hy=t%05mpr.80JUZ7ne_%23zS8DcA%0qc_%291ymamz096%11Zfb3r%09ZqPD%311ZX"
      "tqJd600ot&5U96U-Rh-VZ=-D_6-9xKYj%1gW6b43s1B9-j21P0oUW5-t46G4kgt&ezgj=mcW"
      "TTQ.c&Oh=%2PblUfuC%7C997048884827569%03xnyJ%2L1pi7irBioQ6D4r7nNHNdo6v7Y%"
      "84aurnSJ%2wCFePHMlGZmIHGfCe7392_lImWsSvN&sBeNN=Nf%80yOE%6X10M64F4gG197aX"
      "R2B4g2533x235A0i4e%57%58uWB%04Erw.60&VMS4=Ek_%02GC0Pkx%6Ov_%207WICUz007%"
      "04nYX8N%46zzpv%999h&KGmBt988y=q4P57C-Dh-Nz-x_7-5oPxz%1gz3N03t6c7-R67N4DT"
      "Y6-f98W1&Lts&%02dOty%8eEYEnLz4yexQQLnL4MGU2JFn3OcmXcatBcabZgBdDdy67hdgW"
      "tYn4");
  for (size_t i = 0; i < iters; ++i) {
    Uri u(s);
    u.getQueryParams();
  }
}

int main(int argc, char** argv) {
  folly::init(&argc, &argv);
  folly::runBenchmarks();
  return 0;
}
