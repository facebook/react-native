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

#pragma once

#include <folly/stats/MultiLevelTimeSeries.h>
#include <glog/logging.h>

namespace folly {

template <typename VT, typename CT>
MultiLevelTimeSeries<VT, CT>::MultiLevelTimeSeries(
    size_t nBuckets,
    size_t nLevels,
    const Duration levelDurations[])
    : cachedTime_(), cachedSum_(0), cachedCount_(0) {
  CHECK_GT(nLevels, 0u);
  CHECK(levelDurations);

  levels_.reserve(nLevels);
  for (size_t i = 0; i < nLevels; ++i) {
    if (levelDurations[i] == Duration(0)) {
      CHECK_EQ(i, nLevels - 1);
    } else if (i > 0) {
      CHECK(levelDurations[i - 1] < levelDurations[i]);
    }
    levels_.emplace_back(nBuckets, levelDurations[i]);
  }
}

template <typename VT, typename CT>
MultiLevelTimeSeries<VT, CT>::MultiLevelTimeSeries(
    size_t nBuckets,
    std::initializer_list<Duration> durations)
    : cachedTime_(), cachedSum_(0), cachedCount_(0) {
  CHECK_GT(durations.size(), 0u);

  levels_.reserve(durations.size());
  size_t i = 0;
  Duration prev{0};
  for (auto dur : durations) {
    if (dur == Duration(0)) {
      CHECK_EQ(i, durations.size() - 1);
    } else if (i > 0) {
      CHECK(prev < dur);
    }
    levels_.emplace_back(nBuckets, dur);
    prev = dur;
    i++;
  }
}

template <typename VT, typename CT>
void MultiLevelTimeSeries<VT, CT>::addValue(
    TimePoint now,
    const ValueType& val) {
  addValueAggregated(now, val, 1);
}

template <typename VT, typename CT>
void MultiLevelTimeSeries<VT, CT>::addValue(
    TimePoint now,
    const ValueType& val,
    uint64_t times) {
  addValueAggregated(now, val * ValueType(times), times);
}

template <typename VT, typename CT>
void MultiLevelTimeSeries<VT, CT>::addValueAggregated(
    TimePoint now,
    const ValueType& total,
    uint64_t nsamples) {
  if (cachedTime_ != now) {
    flush();
    cachedTime_ = now;
  }
  cachedSum_ += total;
  cachedCount_ += nsamples;
}

template <typename VT, typename CT>
void MultiLevelTimeSeries<VT, CT>::update(TimePoint now) {
  flush();
  for (size_t i = 0; i < levels_.size(); ++i) {
    levels_[i].update(now);
  }
}

template <typename VT, typename CT>
void MultiLevelTimeSeries<VT, CT>::flush() {
  // update all the underlying levels
  if (cachedCount_ > 0) {
    for (size_t i = 0; i < levels_.size(); ++i) {
      levels_[i].addValueAggregated(cachedTime_, cachedSum_, cachedCount_);
    }
    cachedCount_ = 0;
    cachedSum_ = 0;
  }
}

template <typename VT, typename CT>
void MultiLevelTimeSeries<VT, CT>::clear() {
  for (auto& level : levels_) {
    level.clear();
  }

  cachedTime_ = TimePoint();
  cachedSum_ = 0;
  cachedCount_ = 0;
}

} // namespace folly
