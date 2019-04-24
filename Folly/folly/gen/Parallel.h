/*
 * Copyright 2014-present Facebook, Inc.
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
#define FOLLY_GEN_PARALLEL_H_

#include <mutex>

#include <folly/gen/Base.h>

namespace folly {
namespace gen {
namespace detail {

template <class Ops>
class Parallel;

template <class Sink>
class Sub;

template <class Iterator>
class ChunkedRangeSource;

} // namespace detail

/**
 * chunked() - For producing values from a container in slices.
 *
 * Especially for use with 'parallel()', chunked can be used to process values
 * from a persistent container in chunks larger than one value at a time. The
 * values produced are generators for slices of the input container. */
template <
    class Container,
    class Iterator = typename Container::const_iterator,
    class Chunked = detail::ChunkedRangeSource<Iterator>>
Chunked chunked(const Container& container, int chunkSize = 256) {
  return Chunked(chunkSize, folly::range(container.begin(), container.end()));
}

template <
    class Container,
    class Iterator = typename Container::iterator,
    class Chunked = detail::ChunkedRangeSource<Iterator>>
Chunked chunked(Container& container, int chunkSize = 256) {
  return Chunked(chunkSize, folly::range(container.begin(), container.end()));
}

/**
 * parallel - A parallelization operator.
 *
 * 'parallel(ops)' can be used with any generator to process a segment
 * of the pipeline in parallel. Multiple threads are used to apply the
 * operations ('ops') to the input sequence, with the resulting sequence
 * interleaved to be processed on the client thread.
 *
 *   auto scoredResults
 *     = from(ids)
 *     | parallel(map(fetchObj) | filter(isValid) | map(scoreObj))
 *     | as<vector>();
 *
 * Operators specified for parallel execution must yield sequences, not just
 * individual values. If a sink function such as 'count' is desired, it must be
 * wrapped in 'sub' to produce a subcount, since any such aggregation must be
 * re-aggregated.
 *
 *   auto matches
 *     = from(docs)
 *     | parallel(filter(expensiveTest) | sub(count))
 *     | sum;
 *
 * Here, each thread counts its portion of the result, then the sub-counts are
 * summed up to produce the total count.
 */
template <class Ops, class Parallel = detail::Parallel<Ops>>
Parallel parallel(Ops ops, size_t threads = 0) {
  return Parallel(std::move(ops), threads);
}

/**
 * sub - For sub-summarization of a sequence.
 *
 * 'sub' can be used to apply a sink function to a generator, but wrap the
 * single value in another generator. Note that the sink is eagerly evaluated on
 * the input sequence.
 *
 *   auto sum = from(list) | sub(count) | first;
 *
 * This is primarily used with 'parallel', as noted above.
 */
template <class Sink, class Sub = detail::Sub<Sink>>
Sub sub(Sink sink) {
  return Sub(std::move(sink));
}
} // namespace gen
} // namespace folly

#include <folly/gen/Parallel-inl.h>
