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

/*
 * This file contains explicit instantiations of stats template types.
 *
 * This allows most users to avoid having to include the template definition
 * header files.
 */

#include <folly/stats/BucketedTimeSeries.h>
#include <folly/stats/BucketedTimeSeries-defs.h>

#include <folly/stats/Histogram.h>
#include <folly/stats/Histogram-defs.h>

#include <folly/stats/MultiLevelTimeSeries.h>
#include <folly/stats/MultiLevelTimeSeries-defs.h>

#include <folly/stats/TimeseriesHistogram.h>
#include <folly/stats/TimeseriesHistogram-defs.h>

namespace folly {

template class BucketedTimeSeries<int64_t>;
template class Histogram<int64_t>;
template class detail::HistogramBuckets<int64_t, Histogram<int64_t>::Bucket>;
template class MultiLevelTimeSeries<int64_t>;
template class TimeseriesHistogram<int64_t>;

// Histogram::getPercentileBucketIdx(), Histogram::getPercentileEstimate()
// and Histogram::computeTotalCount()
// are implemented using template methods.  Instantiate the default versions of
// these methods too, so anyone using them won't also need to explicitly
// include Histogram-defs.h
template size_t detail::HistogramBuckets<int64_t, Histogram<int64_t>::Bucket>::
    getPercentileBucketIdx<Histogram<int64_t>::CountFromBucket>(
        double pct,
        Histogram<int64_t>::CountFromBucket countFromBucket,
        double* lowPct,
        double* highPct) const;
template int64_t detail::HistogramBuckets<int64_t, Histogram<int64_t>::Bucket>
  ::getPercentileEstimate<Histogram<int64_t>::CountFromBucket,
                          Histogram<int64_t>::AvgFromBucket>(
    double pct,
    Histogram<int64_t>::CountFromBucket countFromBucket,
    Histogram<int64_t>::AvgFromBucket avgFromBucket) const;
template uint64_t detail::HistogramBuckets<int64_t, Histogram<int64_t>::Bucket>
  ::computeTotalCount<Histogram<int64_t>::CountFromBucket>(
    Histogram<int64_t>::CountFromBucket countFromBucket) const;

} // folly
