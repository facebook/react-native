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

namespace folly {
namespace fibers {

/**
 * Schedules several tasks and blocks until all of them are completed.
 * In the process of their successfull completion given callback would be called
 * for each of them with the index of the task and the result it returned (if
 * not void).
 * If any of these n tasks throws an exception, this exception will be
 * re-thrown, but only when all tasks are complete. If several tasks throw
 * exceptions one of them will be re-thrown. Callback won't be called for
 * tasks that throw exception.
 *
 * @param first  Range of tasks to be scheduled
 * @param last
 * @param F      callback to call for each result.
 *               In case of each task returning void it should be callable
 *                  F(size_t id)
 *               otherwise should be callable
 *                  F(size_t id, Result)
 */
template <class InputIterator, class F>
inline void forEach(InputIterator first, InputIterator last, F&& f);
} // namespace fibers
} // namespace folly

#include <folly/fibers/ForEach-inl.h>
