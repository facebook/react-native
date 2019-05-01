/*
 * Copyright 2013-present Facebook, Inc.
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

#include <folly/stats/TDigest.h>

#include <chrono>
#include <random>

#include <folly/portability/GTest.h>

using namespace folly;

/*
 * Tests run at a reasonable speed with these settings, but it is good to
 * occasionally test with kNumRandomRuns = 3000 and kNumSamples = 50000
 */
const int32_t kNumSamples = 3000;
const int32_t kNumRandomRuns = 10;
const int32_t kSeed = 0;

TEST(TDigest, Basic) {
  TDigest digest(100);

  std::vector<double> values;
  for (int i = 1; i <= 100; ++i) {
    values.push_back(i);
  }

  digest = digest.merge(values);

  EXPECT_EQ(100, digest.count());
  EXPECT_EQ(5050, digest.sum());
  EXPECT_EQ(50.5, digest.mean());
  EXPECT_EQ(1, digest.min());
  EXPECT_EQ(100, digest.max());

  EXPECT_EQ(1, digest.estimateQuantile(0.001));
  EXPECT_EQ(2.0 - 0.5, digest.estimateQuantile(0.01));
  EXPECT_EQ(50.375, digest.estimateQuantile(0.5));
  EXPECT_EQ(100.0 - 0.5, digest.estimateQuantile(0.99));
  EXPECT_EQ(100, digest.estimateQuantile(0.999));
}

TEST(TDigest, Merge) {
  TDigest digest(100);

  std::vector<double> values;
  for (int i = 1; i <= 100; ++i) {
    values.push_back(i);
  }
  digest = digest.merge(values);

  values.clear();
  for (int i = 101; i <= 200; ++i) {
    values.push_back(i);
  }
  digest = digest.merge(values);

  EXPECT_EQ(200, digest.count());
  EXPECT_EQ(20100, digest.sum());
  EXPECT_EQ(100.5, digest.mean());
  EXPECT_EQ(1, digest.min());
  EXPECT_EQ(200, digest.max());

  EXPECT_EQ(1, digest.estimateQuantile(0.001));
  EXPECT_EQ(4.0 - 1.5, digest.estimateQuantile(0.01));
  EXPECT_EQ(100.25, digest.estimateQuantile(0.5));
  EXPECT_EQ(200.0 - 1.5, digest.estimateQuantile(0.99));
  EXPECT_EQ(200, digest.estimateQuantile(0.999));
}

TEST(TDigest, MergeSmall) {
  TDigest digest(100);

  std::vector<double> values;
  values.push_back(1);

  digest = digest.merge(values);

  EXPECT_EQ(1, digest.count());
  EXPECT_EQ(1, digest.sum());
  EXPECT_EQ(1, digest.mean());
  EXPECT_EQ(1, digest.min());
  EXPECT_EQ(1, digest.max());

  EXPECT_EQ(1.0, digest.estimateQuantile(0.001));
  EXPECT_EQ(1.0, digest.estimateQuantile(0.01));
  EXPECT_EQ(1.0, digest.estimateQuantile(0.5));
  EXPECT_EQ(1.0, digest.estimateQuantile(0.99));
  EXPECT_EQ(1.0, digest.estimateQuantile(0.999));
}

TEST(TDigest, MergeLarge) {
  TDigest digest(100);

  std::vector<double> values;
  for (int i = 1; i <= 1000; ++i) {
    values.push_back(i);
  }
  digest = digest.merge(values);

  EXPECT_EQ(1000, digest.count());
  EXPECT_EQ(500500, digest.sum());
  EXPECT_EQ(500.5, digest.mean());
  EXPECT_EQ(1, digest.min());
  EXPECT_EQ(1000, digest.max());

  EXPECT_EQ(1.5, digest.estimateQuantile(0.001));
  EXPECT_EQ(10.5, digest.estimateQuantile(0.01));
  EXPECT_EQ(500.25, digest.estimateQuantile(0.5));
  EXPECT_EQ(990.25, digest.estimateQuantile(0.99));
  EXPECT_EQ(999.5, digest.estimateQuantile(0.999));
}

TEST(TDigest, MergeLargeAsDigests) {
  std::vector<TDigest> digests;
  TDigest digest(100);

  std::vector<double> values;
  for (int i = 1; i <= 1000; ++i) {
    values.push_back(i);
  }
  // Ensure that the values do not monotonically increase across digests.
  std::shuffle(
      values.begin(), values.end(), std::mt19937(std::random_device()()));
  for (int i = 0; i < 10; ++i) {
    std::vector<double> unsorted_values(
        values.begin() + (i * 100), values.begin() + (i + 1) * 100);
    digests.push_back(digest.merge(unsorted_values));
  }

  digest = TDigest::merge(digests);

  EXPECT_EQ(1000, digest.count());
  EXPECT_EQ(500500, digest.sum());
  EXPECT_EQ(500.5, digest.mean());
  EXPECT_EQ(1, digest.min());
  EXPECT_EQ(1000, digest.max());

  EXPECT_EQ(1.5, digest.estimateQuantile(0.001));
  EXPECT_EQ(10.5, digest.estimateQuantile(0.01));
  EXPECT_EQ(990.25, digest.estimateQuantile(0.99));
  EXPECT_EQ(999.5, digest.estimateQuantile(0.999));
}

TEST(TDigest, NegativeValues) {
  std::vector<TDigest> digests;
  TDigest digest(100);

  std::vector<double> values;
  for (int i = 1; i <= 100; ++i) {
    values.push_back(i);
    values.push_back(-i);
  }

  digest = digest.merge(values);

  EXPECT_EQ(200, digest.count());
  EXPECT_EQ(0, digest.sum());
  EXPECT_EQ(0, digest.mean());
  EXPECT_EQ(-100, digest.min());
  EXPECT_EQ(100, digest.max());

  EXPECT_EQ(-100, digest.estimateQuantile(0.0));
  EXPECT_EQ(-100, digest.estimateQuantile(0.001));
  EXPECT_EQ(-98.5, digest.estimateQuantile(0.01));
  EXPECT_EQ(98.5, digest.estimateQuantile(0.99));
  EXPECT_EQ(100, digest.estimateQuantile(0.999));
  EXPECT_EQ(100, digest.estimateQuantile(1.0));
}

TEST(TDigest, NegativeValuesMergeDigests) {
  std::vector<TDigest> digests;
  TDigest digest(100);

  std::vector<double> values;
  std::vector<double> negativeValues;
  for (int i = 1; i <= 100; ++i) {
    values.push_back(i);
    negativeValues.push_back(-i);
  }

  auto digest1 = digest.merge(values);
  auto digest2 = digest.merge(negativeValues);

  std::array<TDigest, 2> a{{digest1, digest2}};

  digest = TDigest::merge(a);

  EXPECT_EQ(200, digest.count());
  EXPECT_EQ(0, digest.sum());
  EXPECT_EQ(0, digest.mean());
  EXPECT_EQ(-100, digest.min());
  EXPECT_EQ(100, digest.max());

  EXPECT_EQ(-100, digest.estimateQuantile(0.0));
  EXPECT_EQ(-100, digest.estimateQuantile(0.001));
  EXPECT_EQ(-98.5, digest.estimateQuantile(0.01));
  EXPECT_EQ(98.5, digest.estimateQuantile(0.99));
  EXPECT_EQ(100, digest.estimateQuantile(0.999));
  EXPECT_EQ(100, digest.estimateQuantile(1.0));
}

TEST(TDigest, ConstructFromCentroids) {
  std::vector<TDigest::Centroid> centroids{};

  TDigest digest(100);
  std::vector<double> values;
  for (int i = 1; i <= 100; ++i) {
    values.push_back(i);
  }
  auto digest1 = digest.merge(values);

  size_t centroid_count = digest1.getCentroids().size();

  TDigest digest2(
      digest1.getCentroids(),
      digest1.sum(),
      digest1.count(),
      digest1.max(),
      digest1.min(),
      100);

  EXPECT_EQ(digest1.sum(), digest2.sum());
  EXPECT_EQ(digest1.count(), digest2.count());
  EXPECT_EQ(digest1.min(), digest2.min());
  EXPECT_EQ(digest1.max(), digest2.max());
  EXPECT_EQ(digest1.getCentroids().size(), digest2.getCentroids().size());

  TDigest digest3(
      digest1.getCentroids(),
      digest1.sum(),
      digest1.count(),
      digest1.max(),
      digest1.min(),
      centroid_count - 1);
  EXPECT_EQ(digest1.sum(), digest3.sum());
  EXPECT_EQ(digest1.count(), digest3.count());
  EXPECT_EQ(digest1.min(), digest3.min());
  EXPECT_EQ(digest1.max(), digest3.max());
  EXPECT_NE(digest1.getCentroids().size(), digest3.getCentroids().size());
}

TEST(TDigest, LargeOutlierTest) {
  folly::TDigest digest(100);

  std::vector<double> values;
  for (double i = 0; i < 19; ++i) {
    values.push_back(i);
  }
  values.push_back(1000000);

  std::sort(values.begin(), values.end());
  digest = digest.merge(values);
  EXPECT_LT(
      (int64_t)digest.estimateQuantile(0.5),
      (int64_t)digest.estimateQuantile(0.90));
}

TEST(TDigest, FloatingPointSortedTest) {
  // When combining centroids, floating point accuracy can lead to us building
  // and unsorted digest if we are not careful. This tests that we are properly
  // sorting the digest.
  double val = 1.4;
  TDigest digest1(100);
  std::vector<double> values1;
  for (int i = 1; i <= 100; ++i) {
    values1.push_back(val);
  }
  digest1 = digest1.merge(values1);

  TDigest digest2(100);
  std::vector<double> values2;
  for (int i = 1; i <= 100; ++i) {
    values2.push_back(val);
  }
  digest2 = digest2.merge(values2);

  std::array<TDigest, 2> a{{digest1, digest2}};
  auto mergeDigest1 = TDigest::merge(a);

  TDigest digest3(100);
  std::vector<double> values3;
  for (int i = 1; i <= 100; ++i) {
    values3.push_back(val);
  }
  digest3 = digest2.merge(values3);
  std::array<TDigest, 2> b{{digest3, mergeDigest1}};
  auto mergeDigest2 = TDigest::merge(b);

  auto centroids = mergeDigest2.getCentroids();
  EXPECT_EQ(std::is_sorted(centroids.begin(), centroids.end()), true);
}

class DistributionTest
    : public ::testing::TestWithParam<
          std::tuple<std::pair<bool, size_t>, double, bool>> {};

TEST_P(DistributionTest, ReasonableError) {
  std::pair<bool, size_t> underlyingDistribution;
  bool logarithmic;
  size_t modes;
  double quantile;
  double reasonableError = 0;
  bool digestMerge;

  std::tie(underlyingDistribution, quantile, digestMerge) = GetParam();

  std::tie(logarithmic, modes) = underlyingDistribution;
  if (quantile == 0.001 || quantile == 0.999) {
    reasonableError = 0.001;
  } else if (quantile == 0.01 || quantile == 0.99) {
    reasonableError = 0.01;
  } else if (quantile == 0.25 || quantile == 0.5 || quantile == 0.75) {
    reasonableError = 0.04;
  }

  std::vector<double> errors;

  std::default_random_engine generator;
  generator.seed(kSeed);
  for (size_t iter = 0; iter < kNumRandomRuns; ++iter) {
    TDigest digest(100);

    std::vector<double> values;

    if (logarithmic) {
      std::lognormal_distribution<double> distribution(0.0, 1.0);

      for (size_t i = 0; i < kNumSamples; ++i) {
        auto mode = (int)distribution(generator) % modes;
        values.push_back(distribution(generator) + 100.0 * mode);
      }
    } else {
      std::uniform_int_distribution<int> distributionPicker(0, modes - 1);

      std::vector<std::normal_distribution<double>> distributions;
      for (size_t i = 0; i < modes; ++i) {
        distributions.emplace_back(100.0 * (i + 1), 25);
      }

      for (size_t i = 0; i < kNumSamples; ++i) {
        auto distributionIdx = distributionPicker(generator);
        values.push_back(distributions[distributionIdx](generator));
      }
    }

    std::vector<TDigest> digests;
    for (size_t i = 0; i < kNumSamples / 1000; ++i) {
      folly::Range<const double*> r(values, i * 1000, 1000);
      if (digestMerge) {
        digests.push_back(digest.merge(r));
      } else {
        digest = digest.merge(r);
      }
    }

    std::sort(values.begin(), values.end());

    if (digestMerge) {
      digest = TDigest::merge(digests);
    }

    double est = digest.estimateQuantile(quantile);
    auto it = std::lower_bound(values.begin(), values.end(), est);
    int32_t actualRank = std::distance(values.begin(), it);
    double actualQuantile = ((double)actualRank) / kNumSamples;
    errors.push_back(actualQuantile - quantile);
  }

  double sum = 0.0;

  for (auto error : errors) {
    sum += error;
  }

  double mean = sum / kNumRandomRuns;

  double numerator = 0.0;
  for (auto error : errors) {
    numerator += pow(error - mean, 2);
  }

  double stddev = std::sqrt(numerator / (kNumRandomRuns - 1));

  EXPECT_GE(reasonableError, stddev);
}

INSTANTIATE_TEST_CASE_P(
    ReasonableErrors,
    DistributionTest,
    ::testing::Combine(
        ::testing::Values(
            std::make_pair(true, 1),
            std::make_pair(true, 3),
            std::make_pair(false, 1),
            std::make_pair(false, 10)),
        ::testing::Values(0.001, 0.01, 0.25, 0.50, 0.75, 0.99, 0.999),
        ::testing::Bool()));
