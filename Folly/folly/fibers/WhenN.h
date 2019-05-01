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

#include <iterator>
#include <memory>
#include <type_traits>
#include <utility>
#include <vector>

#include <folly/functional/Invoke.h>

namespace folly {
namespace fibers {

/**
 * Schedules several tasks and blocks until n of these tasks are completed.
 * If any of these n tasks throws an exception, this exception will be
 * re-thrown, but only when n tasks are complete. If several tasks throw
 * exceptions one of them will be re-thrown.
 *
 * @param first Range of tasks to be scheduled
 * @param last
 * @param n Number of tasks to wait for
 *
 * @return vector of pairs (task index, return value of task)
 */
template <class InputIterator>
typename std::vector<
    typename std::enable_if<
        !std::is_same<
            invoke_result_t<
                typename std::iterator_traits<InputIterator>::value_type>,
            void>::value,
        typename std::pair<
            size_t,
            invoke_result_t<
                typename std::iterator_traits<InputIterator>::value_type>>>::
        type> inline collectN(InputIterator first, InputIterator last, size_t n);

/**
 * collectN specialization for functions returning void
 *
 * @param first Range of tasks to be scheduled
 * @param last
 * @param n Number of tasks to wait for
 *
 * @return vector of completed task indices
 */
template <class InputIterator>
typename std::enable_if<
    std::is_same<
        invoke_result_t<
            typename std::iterator_traits<InputIterator>::value_type>,
        void>::value,
    std::vector<size_t>>::
    type inline collectN(InputIterator first, InputIterator last, size_t n);

/**
 * Schedules several tasks and blocks until all of these tasks are completed.
 * If any of the tasks throws an exception, this exception will be re-thrown,
 * but only when all the tasks are complete. If several tasks throw exceptions
 * one of them will be re-thrown.
 *
 * @param first Range of tasks to be scheduled
 * @param last
 *
 * @return vector of values returned by tasks
 */
template <class InputIterator>
typename std::vector<
    typename std::enable_if<
        !std::is_same<
            invoke_result_t<
                typename std::iterator_traits<InputIterator>::value_type>,
            void>::value,
        invoke_result_t<
            typename std::iterator_traits<InputIterator>::value_type>>::
        type> inline collectAll(InputIterator first, InputIterator last);

/**
 * collectAll specialization for functions returning void
 *
 * @param first Range of tasks to be scheduled
 * @param last
 */
template <class InputIterator>
typename std::enable_if<
    std::is_same<
        invoke_result_t<
            typename std::iterator_traits<InputIterator>::value_type>,
        void>::value,
    void>::type inline collectAll(InputIterator first, InputIterator last);

/**
 * Schedules several tasks and blocks until one of them is completed.
 * If this task throws an exception, this exception will be re-thrown.
 * Exceptions thrown by all other tasks will be ignored.
 *
 * @param first Range of tasks to be scheduled
 * @param last
 *
 * @return pair of index of the first completed task and its return value
 */
template <class InputIterator>
typename std::enable_if<
    !std::is_same<
        invoke_result_t<
            typename std::iterator_traits<InputIterator>::value_type>,
        void>::value,
    typename std::pair<
        size_t,
        invoke_result_t<
            typename std::iterator_traits<InputIterator>::value_type>>>::
    type inline collectAny(InputIterator first, InputIterator last);

/**
 * WhenAny specialization for functions returning void.
 *
 * @param first Range of tasks to be scheduled
 * @param last
 *
 * @return index of the first completed task
 */
template <class InputIterator>
typename std::enable_if<
    std::is_same<
        invoke_result_t<
            typename std::iterator_traits<InputIterator>::value_type>,
        void>::value,
    size_t>::type inline collectAny(InputIterator first, InputIterator last);
} // namespace fibers
} // namespace folly

#include <folly/fibers/WhenN-inl.h>
