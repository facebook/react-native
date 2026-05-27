/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <react/profiling/TimeSeries.h>

namespace facebook::react {

class TimeSeriesTests : public testing::Test {};

std::ostream& operator<<(std::ostream& os, const TimeSeries& ts) {
  const size_t n = ts.getNumPoints();
  os << "Position: " << ts.position_ << ", ";
  os << "Points: " << ts.getNumPoints() << ", ";
  for (size_t i = 0; i < n; i++) {
    os << "[" << ts.times_[i] << ", " << ts.values_[i] << "] ";
  }
  return os;
}

std::ostream& operator<<(std::ostream& os, const TimeSeries::Range& range) {
  os << " [" << range.idxFrom1 << " " << range.idxTo1 << "] [" << range.idxFrom2
     << " " << range.idxTo2 << "]";
  return os;
}

TEST_F(TimeSeriesTests, basicOperations) {
  TimeSeries ts(5);

  EXPECT_FLOAT_EQ(0.0, ts.getAverage());
  EXPECT_FLOAT_EQ(0.0, ts.getPercentile(75));
  EXPECT_FLOAT_EQ(0.0, ts.getMin());
  EXPECT_FLOAT_EQ(0.0, ts.getMax());

  ts.appendValue(0.0, 3.0);
  EXPECT_FLOAT_EQ(3.0, ts.getValue(0.0));

  ts.appendValue(1.0, 6.0);
  ts.appendValue(3.0, 0.0);
  EXPECT_FLOAT_EQ(6.0, ts.getValue(1.0));

  ts.appendValue(4.0, 10.0);
  ts.appendValue(5.0, 1.0);

  EXPECT_FLOAT_EQ(3.0, ts.getValue(-1.0));
  EXPECT_FLOAT_EQ(3.0, ts.getValue(0.0));
  EXPECT_FLOAT_EQ(6.0, ts.getValue(1.0));
  EXPECT_FLOAT_EQ(0.0, ts.getValue(3.0));
  EXPECT_FLOAT_EQ(10.0, ts.getValue(4.0));
  EXPECT_FLOAT_EQ(1.0, ts.getValue(5.0));
  EXPECT_FLOAT_EQ(1.0, ts.getValue(6.0));

  EXPECT_FLOAT_EQ(4.0, ts.getAverage());
  EXPECT_FLOAT_EQ(3.0, ts.getPercentile(50));
  EXPECT_FLOAT_EQ(0.0, ts.getMin());
  EXPECT_FLOAT_EQ(10.0, ts.getMax());

  ts.appendValue(6.0, 2.0);
  ts.appendValue(10.0, 7.0);

  EXPECT_FLOAT_EQ(10.0, ts.getMaxTime());
  EXPECT_FLOAT_EQ(3.0, ts.getMinTime());

  EXPECT_FLOAT_EQ(0.0, ts.getValue(-1.0));
  EXPECT_FLOAT_EQ(0.0, ts.getValue(2.0));
  EXPECT_FLOAT_EQ(0.0, ts.getValue(3.0));
  EXPECT_FLOAT_EQ(10.0, ts.getValue(4.0));
  EXPECT_FLOAT_EQ(1.0, ts.getValue(5.0));
  EXPECT_FLOAT_EQ(2.0, ts.getValue(6.0));
  EXPECT_FLOAT_EQ(7.0, ts.getValue(10.0));
  EXPECT_FLOAT_EQ(7.0, ts.getValue(20.0));

  ts.appendValue(11.0, -7.0);
  EXPECT_FLOAT_EQ(-7.0, ts.getMin());
  EXPECT_FLOAT_EQ(10.0, ts.getMax());
}

TEST_F(TimeSeriesTests, rangeOperations) {
  TimeSeries ts(5);
  ts.appendValue(0.0, 0.0);
  ts.appendValue(1.0, 1.0);
  ts.appendValue(2.0, 2.0);

  EXPECT_FLOAT_EQ(0.0, ts.getMin(-1.0, 100.0));
  EXPECT_FLOAT_EQ(2.0, ts.getMax(-1.0, 100.0));

  EXPECT_FLOAT_EQ(0.0, ts.getMin(-1.0, 1.5));
  EXPECT_FLOAT_EQ(1.0, ts.getMax(-1.0, 1.5));

  EXPECT_FLOAT_EQ(1.0, ts.getMin(0.5, 1.5));
  EXPECT_FLOAT_EQ(1.0, ts.getMax(-1.0, 1.5));
  EXPECT_FLOAT_EQ(1.0, ts.getMax(1.0, 1.5));

  EXPECT_FLOAT_EQ(1.5, ts.getAverage(0.5, 2.0));
  EXPECT_FLOAT_EQ(1.5, ts.getAverage(0.5, 3.0));

  ts.appendValue(3.0, 3.0);
  ts.appendValue(4.0, 4.0);
  ts.appendValue(5.0, 5.0);
  ts.appendValue(6.0, 6.0);

  // Current circular buffer layout should be: 5 6 | 2 3 4
  // Cover corner cases by sampling different ranges
  EXPECT_EQ(1, ts.getCount(6.0, 6.0));
  EXPECT_EQ(2, ts.getCount(4.5, 6.0));
  EXPECT_EQ(5, ts.getCount(0.0, 6.0));
  EXPECT_EQ(5, ts.getCount(0.0, 7.0));
  EXPECT_EQ(2, ts.getCount(3.5, 5.0));
  EXPECT_EQ(0, ts.getCount(7.0, 8.0));
  EXPECT_EQ(2, ts.getCount(4.5, 7.0));
  EXPECT_EQ(2, ts.getCount(3.5, 5.5));

  EXPECT_FLOAT_EQ(2.0, ts.getMin(0.0, 2.0));
  EXPECT_FLOAT_EQ(2.0, ts.getMin(0.0, 2.5));
  EXPECT_FLOAT_EQ(0.0, ts.getMin(0.0, 1.0));
  EXPECT_FLOAT_EQ(0.0, ts.getMin(100.0, 101.0));
  EXPECT_FLOAT_EQ(0.0, ts.getAverage(0.0, 1.0));

  EXPECT_FLOAT_EQ(4.0, ts.getMin(3.5, 5.5));
  EXPECT_FLOAT_EQ(5.0, ts.getMax(3.5, 5.5));
  EXPECT_FLOAT_EQ(4.5, ts.getAverage(3.5, 5.5));

  EXPECT_FLOAT_EQ(3.0, ts.getMin(2.5, 4.5));
  EXPECT_FLOAT_EQ(4.0, ts.getMax(2.5, 4.5));
  EXPECT_FLOAT_EQ(3.5, ts.getAverage(2.5, 4.5));

  EXPECT_FLOAT_EQ(6.0, ts.getMin(5.5, 7.5));
  EXPECT_FLOAT_EQ(6.0, ts.getMax(5.5, 7.5));
  EXPECT_FLOAT_EQ(6.0, ts.getAverage(5.5, 7.5));

  EXPECT_FLOAT_EQ(5.0, ts.getMin(4.5, 7.5));
  EXPECT_FLOAT_EQ(6.0, ts.getMax(4.5, 7.5));
  EXPECT_FLOAT_EQ(5.5, ts.getAverage(4.5, 7.5));
}

TEST_F(TimeSeriesTests, accumulateOperations) {
  TimeSeries ts(5);
  ts.accumulateValue(1.0, 2.0, 1.0);

  EXPECT_EQ(2, ts.getNumPoints());

  EXPECT_FLOAT_EQ(1.0, ts.timeAtIndex(0));
  EXPECT_FLOAT_EQ(2.0, ts.timeAtIndex(1));

  EXPECT_FLOAT_EQ(0.0, ts.valueAtIndex(0));
  EXPECT_FLOAT_EQ(1.0, ts.valueAtIndex(1));

  ts.appendValue(3.0, 2.0);

  ts.accumulateValue(1.5, 4.5, 3.0);
  EXPECT_EQ(4, ts.getNumPoints());

  EXPECT_FLOAT_EQ(0.0, ts.valueAtIndex(0));
  EXPECT_FLOAT_EQ(1.5, ts.valueAtIndex(1));
  EXPECT_FLOAT_EQ(3.0, ts.valueAtIndex(2));
  EXPECT_FLOAT_EQ(1.5, ts.valueAtIndex(3));

  EXPECT_FLOAT_EQ(1.0, ts.timeAtIndex(0));
  EXPECT_FLOAT_EQ(2.0, ts.timeAtIndex(1));
  EXPECT_FLOAT_EQ(3.0, ts.timeAtIndex(2));
  EXPECT_FLOAT_EQ(4.5, ts.timeAtIndex(3));

  ts.accumulateValue(2.0, 3.5, 1.5);

  EXPECT_EQ(4, ts.getNumPoints());

  EXPECT_FLOAT_EQ(0.0, ts.valueAtIndex(0));
  EXPECT_FLOAT_EQ(1.5, ts.valueAtIndex(1));
  EXPECT_FLOAT_EQ(4.0, ts.valueAtIndex(2));
  EXPECT_FLOAT_EQ(2.0, ts.valueAtIndex(3));

  EXPECT_FLOAT_EQ(1.0, ts.timeAtIndex(0));
  EXPECT_FLOAT_EQ(2.0, ts.timeAtIndex(1));
  EXPECT_FLOAT_EQ(3.0, ts.timeAtIndex(2));
  EXPECT_FLOAT_EQ(4.5, ts.timeAtIndex(3));

  ts.appendValue(5.0, 0.0);
  ts.appendValue(5.5, 0.0);
  ts.appendValue(6.0, 0.0);

  EXPECT_EQ(5, ts.getNumPoints());

  ts.accumulateValue(4.0, 7.0, 6.0);
  EXPECT_EQ(5, ts.getNumPoints());

  EXPECT_EQ(3, ts.findHistoryPointIndex(4.0, TimeSeries::Bound::Upper));

  EXPECT_FLOAT_EQ(3.0, ts.valueAtIndex(0));
  EXPECT_FLOAT_EQ(1.0, ts.valueAtIndex(1));
  EXPECT_FLOAT_EQ(1.0, ts.valueAtIndex(2));
  EXPECT_FLOAT_EQ(1.0, ts.valueAtIndex(3));
  EXPECT_FLOAT_EQ(2.0, ts.valueAtIndex(4));

  EXPECT_FLOAT_EQ(4.5, ts.timeAtIndex(0));
  EXPECT_FLOAT_EQ(5.0, ts.timeAtIndex(1));
  EXPECT_FLOAT_EQ(5.5, ts.timeAtIndex(2));
  EXPECT_FLOAT_EQ(6.0, ts.timeAtIndex(3));
  EXPECT_FLOAT_EQ(7.0, ts.timeAtIndex(4));
}

} // namespace facebook::react
