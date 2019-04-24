/*
 * Copyright 2015-present Facebook, Inc.
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

#include <random>

#include <folly/Benchmark.h>
#include <folly/Fingerprint.h>
#include <folly/Format.h>
#include <folly/detail/SlowFingerprint.h>

using namespace std;
using namespace folly;
using folly::detail::SlowFingerprint;

namespace {
constexpr int kMaxIds = 64 << 10; // 64Ki
constexpr int kMaxTerms = 64 << 10;

// Globals are generally bad, but this is a benchmark, so there.
uint64_t ids[kMaxIds];

std::string terms[kMaxTerms];

void initialize() {
  std::mt19937 rng;
  for (int i = 0; i < kMaxIds; i++) {
    ids[i] = (((uint64_t)rng()) << 32) | rng();
  }
  // Use randomly generated words.  These numbers are out of my hat and
  // probably wrong.
  // word length = uniformly distributed between 1 and 10
  // charset = 0x20 - 0x7f
  std::uniform_int_distribution<size_t> term_len(1, 10);
  std::uniform_int_distribution<uint16_t> term_char(0x20, 0x7f);
  for (int i = 0; i < kMaxTerms; i++) {
    std::string& term = terms[i];
    int len = term_len(rng);
    term.reserve(len);
    for (int j = 0; j < len; j++) {
      term.append(1, (char)term_char(rng));
    }
  }
}

template <class FP>
void fingerprintIds(int num_iterations, int num_ids) {
  for (int iter = 0; iter < num_iterations; iter++) {
    FP fp;
    for (int i = 0; i < num_ids; i++) {
      fp.update64(ids[i]);
    }
    // GOTCHA: if we don't actually call write(), compiler optimizes
    // away the inner loop!
    uint64_t out;
    fp.write(&out);
    VLOG(1) << out;
  }
}

template <class FP>
void fingerprintTerms(int num_iterations, int num_terms) {
  for (int iter = 0; iter < num_iterations; iter++) {
    FP fp;
    for (int i = 0; i < num_terms; i++) {
      fp.update(terms[i]);
    }
    // GOTCHA: if we don't actually call write(), compiler optimizes
    // away the inner loop!
    uint64_t out;
    fp.write(&out);
    VLOG(1) << out;
  }
}

void fastFingerprintIds64(int num_iterations, int num_ids) {
  fingerprintIds<Fingerprint<64>>(num_iterations, num_ids);
}

void slowFingerprintIds64(int num_iterations, int num_ids) {
  fingerprintIds<SlowFingerprint<64>>(num_iterations, num_ids);
}

void fastFingerprintIds96(int num_iterations, int num_ids) {
  fingerprintIds<Fingerprint<96>>(num_iterations, num_ids);
}

void fastFingerprintIds128(int num_iterations, int num_ids) {
  fingerprintIds<Fingerprint<128>>(num_iterations, num_ids);
}

void fastFingerprintTerms64(int num_iterations, int num_ids) {
  fingerprintTerms<Fingerprint<64>>(num_iterations, num_ids);
}

void slowFingerprintTerms64(int num_iterations, int num_ids) {
  fingerprintTerms<SlowFingerprint<64>>(num_iterations, num_ids);
}

void fastFingerprintTerms96(int num_iterations, int num_ids) {
  fingerprintTerms<Fingerprint<96>>(num_iterations, num_ids);
}

void fastFingerprintTerms128(int num_iterations, int num_ids) {
  fingerprintTerms<Fingerprint<128>>(num_iterations, num_ids);
}

} // namespace

// Only benchmark one size of slowFingerprint; it's significantly slower
// than fastFingeprint (as you can see for 64 bits) and it just slows down
// the benchmark without providing any useful data.

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
#define BM(name, min, max)                                             \
  for (size_t i = min; i <= max; i *= 2) {                             \
    addBenchmark(                                                      \
        __FILE__, sformat("{}_{}", #name, i).c_str(), [=](int iters) { \
          name(iters, i);                                              \
          return iters;                                                \
        });                                                            \
  }
  BM(fastFingerprintIds64, 1, kMaxIds)
  BM(slowFingerprintIds64, 1, kMaxIds)
  BM(fastFingerprintIds96, 1, kMaxIds)
  BM(fastFingerprintIds128, 1, kMaxIds)
  BM(fastFingerprintTerms64, 1, kMaxTerms)
  BM(slowFingerprintTerms64, 1, kMaxTerms)
  BM(fastFingerprintTerms96, 1, kMaxTerms)
  BM(fastFingerprintTerms128, 1, kMaxTerms)
#undef BM

  initialize();
  runBenchmarks();
  return 0;
}
