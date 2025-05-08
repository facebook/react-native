/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TimeSeries.h"

#include <algorithm>
#include <numeric>

namespace facebook::react {

TimeSeries::TimeSeries(int capacity) {
  setCapacity(capacity);
}

bool TimeSeries::operator==(const TimeSeries& rhs) const {
  const int n = getNumPoints();
  if (n != rhs.getNumPoints()) {
    return false;
  }

  for (int i = 0; i < n; i++) {
    if (timeAtIndex(i) != rhs.timeAtIndex(i) ||
        valueAtIndex(i) != rhs.valueAtIndex(i)) {
      return false;
    }
  }
  return true;
}

void TimeSeries::setCapacity(int capacity) {
  // Could have preserved the data, but don't bother for now
  times_ = std::vector<double>();
  times_.reserve(capacity);

  values_ = std::vector<double>();
  values_.reserve(capacity);
}

void TimeSeries::reset() {
  times_ = {};
  values_ = {};
  position_ = 0;
}

int TimeSeries::findHistoryPointIndex(double t, TimeSeries::Bound bound) const {
  if (times_.empty()) {
    return -1;
  }
  if (t >= times_[0]) {
    auto it = (bound == Bound::Lower)
        ? std::lower_bound(times_.begin(), times_.begin() + position_, t)
        : std::upper_bound(times_.begin(), times_.begin() + position_, t);
    return std::min(
        static_cast<int>(it - times_.begin()), static_cast<int>(position_ - 1));
  } else if (position_ < times_.size()) {
    auto it = (bound == Bound::Lower)
        ? std::lower_bound(times_.begin() + position_, times_.end(), t)
        : std::upper_bound(times_.begin() + position_, times_.end(), t);
    return static_cast<int>(it - times_.begin());
  } else {
    return 0;
  }
}

TimeSeries::Range TimeSeries::findHistoryPointRange(
    double timeFrom,
    double timeTo) const {
  Range res;
  if (times_.empty() || timeTo < timeFrom) {
    return res;
  }
  const int position = static_cast<int>(position_);
  const int numPoints = static_cast<int>(times_.size());

  // index of time point greater or equal to timeFrom
  int idxL = findHistoryPointIndex(timeFrom, Bound::Lower);
  if (idxL == position - 1 && times_[idxL] < timeFrom) {
    idxL++;
  }

  // index of time point lower or equal to timeTo
  int idxR = findHistoryPointIndex(timeTo, Bound::Upper);
  if (idxR < numPoints && times_[idxR] <= timeTo) {
    idxR++;
  }

  const bool fullRange = timeFrom <= getMinTime() && timeTo >= getMaxTime();
  if (fullRange) {
    if (position < numPoints) {
      res.idxFrom1 = position;
      res.idxTo1 = numPoints;
      res.idxFrom2 = 0;
      res.idxTo2 = position;
    } else {
      res.idxFrom1 = 0;
      res.idxTo1 = numPoints;
      res.idxFrom2 = 0;
      res.idxTo2 = 0;
    }
  } else if (idxL >= numPoints) {
    res.idxFrom1 = 0;
    res.idxTo1 = idxR;
    res.idxFrom2 = 0;
    res.idxTo2 = 0;
  } else if (idxL > idxR) {
    res.idxFrom1 = idxL;
    res.idxTo1 = numPoints;
    res.idxFrom2 = 0;
    res.idxTo2 = idxR;
  } else {
    res.idxFrom1 = idxL;
    res.idxTo1 = idxR;
    res.idxFrom2 = 0;
    res.idxTo2 = 0;
  }

  return res;
}

TimeSeries::Range TimeSeries::wholeRange() const {
  Range res;
  const int position = static_cast<int>(position_);
  const int numPoints = static_cast<int>(times_.size());

  if (position >= numPoints) {
    res.idxFrom1 = 0;
    res.idxTo1 = position;
    res.idxFrom2 = 0;
    res.idxTo2 = 0;
  } else {
    res.idxFrom1 = position;
    res.idxTo1 = numPoints;
    res.idxFrom2 = 0;
    res.idxTo2 = position;
  }
  return res;
}

void TimeSeries::appendValue(double t, double value) {
  if (getMaxTime() > t) {
    // ignore old values
    return;
  }
  if (!times_.empty() && getMaxTime() == t) {
    values_[values_.size() - 1] = value;
  } else if (times_.size() < times_.capacity()) {
    times_.push_back(t);
    values_.push_back(value);
    position_ = times_.size();
  } else {
    position_ = position_ % times_.size();
    times_[position_] = t;
    values_[position_] = value;
    position_++;
  }
}

void TimeSeries::accumulateValue(double timeFrom, double timeTo, double value) {
  if (timeTo - timeFrom <= 0.0) {
    return;
  }

  if (getNumPoints() == 0 || timeFrom >= getMaxTime()) {
    appendValue(timeFrom, 0.0);
    appendValue(timeTo, value);
    return;
  }

  double curTime = timeFrom;
  const int n = getNumPoints();
  int curPoint =
      (findHistoryPointIndex(timeFrom, Bound::Upper) + n - position_) % n;

  while (curPoint < n && timeAtIndex(curPoint) < timeTo) {
    const double t = timeAtIndex(curPoint);
    valueAtIndex(curPoint) += value * (t - curTime) / (timeTo - timeFrom);
    curTime = t;
    curPoint++;
  }

  if (curTime < timeTo) {
    const double dVal = value * (timeTo - curTime) / (timeTo - timeFrom);
    if (curPoint == n) {
      appendValue(timeTo, dVal);
    } else {
      valueAtIndex(curPoint) += dVal;
    }
  }
}

double TimeSeries::getPercentile(
    unsigned int percentile,
    const TimeSeries::Range& range) const {
  if (range.isEmpty()) {
    return 0.0f;
  }
  std::vector<double> values(range.size());
  std::copy(
      values_.begin() + range.idxFrom1,
      values_.begin() + range.idxTo1,
      values.begin());
  std::copy(
      values_.begin() + range.idxFrom2,
      values_.begin() + range.idxTo2,
      values.begin() + (range.idxTo1 - range.idxFrom1));

  const size_t k = percentile * values.size() / 100;
  std::nth_element(values.begin(), values.begin() + k, values.end());
  return *(values.begin() + k);
}

double TimeSeries::getSum(const TimeSeries::Range& range) const {
  if (range.isEmpty()) {
    return 0.0f;
  }
  double sum = std::accumulate(
      values_.begin() + range.idxFrom1, values_.begin() + range.idxTo1, 0.0);
  sum = std::accumulate(
      values_.begin() + range.idxFrom2, values_.begin() + range.idxTo2, sum);
  return sum;
}

double TimeSeries::getAverage(const TimeSeries::Range& range) const {
  if (range.isEmpty()) {
    return 0.0f;
  }
  return getSum(range) / range.size();
}

double TimeSeries::getMax(const TimeSeries::Range& range) const {
  if (range.isEmpty()) {
    return 0.0f;
  }
  const double v1 = *std::max_element(
      values_.begin() + range.idxFrom1, values_.begin() + range.idxTo1);
  const double v2 = range.isContinuous()
      ? v1
      : *std::max_element(
            values_.begin() + range.idxFrom2, values_.begin() + range.idxTo2);
  return std::max(v1, v2);
}

double TimeSeries::getMin(const TimeSeries::Range& range) const {
  if (range.isEmpty()) {
    return 0.0f;
  }
  const double v1 = *std::min_element(
      values_.begin() + range.idxFrom1, values_.begin() + range.idxTo1);
  const double v2 = range.isContinuous()
      ? v1
      : *std::min_element(
            values_.begin() + range.idxFrom2, values_.begin() + range.idxTo2);
  return std::min(v1, v2);
}

double TimeSeries::getPercentile(unsigned int percentile) const {
  return getPercentile(percentile, wholeRange());
}

double TimeSeries::getPercentile(
    unsigned int percentile,
    double timeFrom,
    double timeTo) const {
  return getPercentile(percentile, findHistoryPointRange(timeFrom, timeTo));
}

double TimeSeries::getAverage() const {
  return getAverage(wholeRange());
}

double TimeSeries::getAverage(double timeFrom, double timeTo) const {
  return getAverage(findHistoryPointRange(timeFrom, timeTo));
}

double TimeSeries::getMax() const {
  return getMax(wholeRange());
}

double TimeSeries::getMax(double timeFrom, double timeTo) const {
  return getMax(findHistoryPointRange(timeFrom, timeTo));
}

double TimeSeries::getMin() const {
  return getMin(wholeRange());
}

double TimeSeries::getMin(double timeFrom, double timeTo) const {
  return getMin(findHistoryPointRange(timeFrom, timeTo));
}

double TimeSeries::getSum() const {
  return getSum(wholeRange());
}

double TimeSeries::getSum(double timeFrom, double timeTo) const {
  return getSum(findHistoryPointRange(timeFrom, timeTo));
}

int TimeSeries::getCount(double timeFrom, double timeTo) const {
  return findHistoryPointRange(timeFrom, timeTo).size();
}

double TimeSeries::getMaxTime() const {
  if (times_.empty()) {
    return 0.0;
  }
  return times_[position_ - 1];
}

double TimeSeries::getMinTime() const {
  if (times_.empty()) {
    return 0.0;
  }
  return times_[position_ % times_.size()];
}

double TimeSeries::getValue(double t) const {
  if (times_.empty()) {
    return 0.0;
  }
  int pidx = findHistoryPointIndex(t);
  pidx = std::min(std::max(pidx, 0), static_cast<int>(times_.size() - 1));
  return values_[pidx];
}

} // namespace facebook::react
