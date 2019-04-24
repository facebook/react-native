/*
 * Copyright 2016-present Facebook, Inc.
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

#include <folly/Function.h>
#include <folly/futures/Future.h>
#include <folly/futures/Promise.h>
#include <exception>
#include <memory>
#include <stdexcept>
#include <vector>

namespace folly {
namespace fibers {

/**
 * BatchDispatcher is useful for batching values while doing I/O.
 * For example, if you are launching multiple tasks which take a
 * single id and each task fetches from database, you can use BatchDispatcher
 * to batch those ids and do a single query requesting all those ids.
 *
 * To use this, create a BatchDispatcher with a dispatch function
 * which consumes a vector of values and returns a vector of results
 * in the same order. Add values to BatchDispatcher using add function,
 * which returns a future to the result set in your dispatch function.
 *
 * Implementation Logic:
 *  - using FiberManager as executor example, user creates a
 *    thread_local BatchDispatcher, on which user calls add(value).
 *  - add(value) adds the value in a vector and also schedules a new
 *    task(BatchDispatchFunction) which will read the vector of values and call
 *    user's DispatchFunction() on it.
 *  - assuming the executor queues all the task and runs them in order of their
 *    creation time, then BatchDispatcher will run later than all the tasks
 *    already created. Depending on this, all the values were added in these
 *    tasks would be picked up by BatchDispatchFunction()
 *
 * Example:
 *  - User schedules Task1, Task2, Task3 each of them calls BatchDispatch.add()
 *    with id1, id2, id3 respectively.
 *  - Executor's state {Task1, Task2, Task3}, BatchDispatchers state {}
 *  - After Task1 calls BatchDispatcher.add():
 *    Executor's state {Task2, Task3, BatchDispatchFunction},
 *    BatchDispatcher's state {id1}
 *  - After Task2 calls BatchDispatcher.add():
 *    Executor's state {Task3, BatchDispatchFunction},
 *    BatchDispatcher's state {id1, id2}
 *  - After Task3 calls BatchDispatcher.add():
 *    Executor's state {BatchDispatchFunction},
 *    BatchDispatcher's state {id1, id2, id3}
 *  - Now BatchDispatcher calls user's Dispatch function with {id1, id2, id3}
 *
 * Note:
 *  - This only works with executors which runs
 *    the tasks in order of their schedule time.
 *  - BatchDispatcher is not thread safe.
 */
template <typename ValueT, typename ResultT, typename ExecutorT>
class BatchDispatcher {
 public:
  using ValueBatchT = std::vector<ValueT>;
  using ResultBatchT = std::vector<ResultT>;
  using PromiseBatchT = std::vector<folly::Promise<ResultT>>;
  using DispatchFunctionT = folly::Function<ResultBatchT(ValueBatchT&&)>;

  BatchDispatcher(ExecutorT& executor, DispatchFunctionT dispatchFunc)
      : executor_(executor),
        state_(new DispatchState(std::move(dispatchFunc))) {}

  Future<ResultT> add(ValueT value) {
    if (state_->values.empty()) {
      executor_.add([state = state_]() { dispatchFunctionWrapper(*state); });
    }

    folly::Promise<ResultT> resultPromise;
    auto resultFuture = resultPromise.getFuture();

    state_->values.emplace_back(std::move(value));
    state_->promises.emplace_back(std::move(resultPromise));

    return resultFuture;
  }

 private:
  struct DispatchState {
    explicit DispatchState(DispatchFunctionT&& dispatchFunction)
        : dispatchFunc(std::move(dispatchFunction)) {}

    DispatchFunctionT dispatchFunc;
    ValueBatchT values;
    PromiseBatchT promises;
  };

  static void dispatchFunctionWrapper(DispatchState& state) {
    ValueBatchT values;
    PromiseBatchT promises;
    state.values.swap(values);
    state.promises.swap(promises);

    try {
      auto results = state.dispatchFunc(std::move(values));
      if (results.size() != promises.size()) {
        throw std::logic_error(
            "Unexpected number of results returned from dispatch function");
      }

      for (size_t i = 0; i < promises.size(); i++) {
        promises[i].setValue(std::move(results[i]));
      }
    } catch (const std::exception& ex) {
      for (size_t i = 0; i < promises.size(); i++) {
        promises[i].setException(
            exception_wrapper(std::current_exception(), ex));
      }
    } catch (...) {
      for (size_t i = 0; i < promises.size(); i++) {
        promises[i].setException(exception_wrapper(std::current_exception()));
      }
    }
  }

  ExecutorT& executor_;
  std::shared_ptr<DispatchState> state_;
};
} // namespace fibers
} // namespace folly
