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
#define FOLLY_GEN_PARALLELMAP_H_

#include <folly/gen/Core.h>

namespace folly {
namespace gen {

namespace detail {

template <class Predicate>
class PMap;

} // namespace detail

/**
 * Run `pred` in parallel in nThreads. Results are returned in the
 * same order in which they were retrieved from the source generator
 * (similar to map).
 *
 * NOTE: Only `pred` is run from separate threads; the source
 *       generator and the rest of the pipeline is executed in the
 *       caller thread.
 */
template <class Predicate, class PMap = detail::PMap<Predicate>>
PMap pmap(Predicate pred = Predicate(), size_t nThreads = 0) {
  return PMap(std::move(pred), nThreads);
}
} // namespace gen
} // namespace folly

#include <folly/gen/ParallelMap-inl.h>
