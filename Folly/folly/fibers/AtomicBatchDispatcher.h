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

#include <memory>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

#include <folly/CPortability.h>
#include <folly/Function.h>
#include <folly/Optional.h>
#include <folly/fibers/detail/AtomicBatchDispatcher.h>
#include <folly/futures/Future.h>
#include <folly/futures/Promise.h>

namespace folly {
namespace fibers {

/**
 * An exception class that gets thrown when the AtomicBatchDispatcher is used
 * incorrectly. This is indicative of a bug in the user code.
 * Examples are, multiple dispatch calls on the same token, trying to get more
 * tokens from the dispatcher after commit has been called, etc.
 */
class FOLLY_EXPORT ABDUsageException : public std::logic_error {
  using std::logic_error::logic_error;
};

/**
 * An exception class that gets set on the promise for dispatched tokens, when
 * the AtomicBatchDispatcher was destroyed before commit was called on it.
 */
class FOLLY_EXPORT ABDCommitNotCalledException : public std::runtime_error {
 public:
  ABDCommitNotCalledException()
      : std::runtime_error(
            "AtomicBatchDispatcher destroyed before commit() was called") {}
};

/**
 * An exception class that gets set on the promise for dispatched tokens, when
 * one or more other tokens in the batch were destroyed before dispatch was
 * called on them.
 * Only here so that the caller can distinguish the real failure cause
 * rather than these subsequently thrown exceptions.
 */
class FOLLY_EXPORT ABDTokenNotDispatchedException : public std::runtime_error {
  using std::runtime_error::runtime_error;
};

/**
 * AtomicBatchDispatcher should be used if you want to process fiber tasks in
 * parallel, but require to synchronize them at some point. The canonical
 * example is to create a database transaction dispatch round. This API notably
 * enforces that all tasks in the batch have reached the synchronization point
 * before the user provided dispatch function is called with all the inputs
 * provided in one function call. It also provides a guarantee that the inputs
 * in the vector of inputs passed to the user provided dispatch function will be
 * in the same order as the order in which the token for the job was issued.
 *
 * Use this when you want all the inputs in the batch to be processed by a
 * single function call to the user provided dispatch function.
 * The user provided dispatch function takes a vector of InputT as input and
 * returns a vector of ResultT.
 * To use an AtomicBatchDispatcher, create it by providing a dispatch function:
 * TO EITHER the constructor of the AtomicBatchDispatcher class
 * (can call reserve method on the dispatcher to reserve space (for number of
 *  inputs expected)),
 * OR the createAtomicBatchDispatcher function in folly::fibers namespace
 *    (optionally specify an initial capacity (for number of inputs expected)).
 * The AtomicBatchDispatcher object created using this call (dispatcher),
 * is the only object that can issue tokens (Token objects) that are used to
 * add an input to the batch. A single Token is issued when the user calls
 * the getToken function on the dispatcher.
 * Token objects cannot be copied (can only be moved). User can call the public
 * dispatch function on the Token providing a single input value. The dispatch
 * function returns a folly::Future<ResultT> value that the user can then wait
 * on to obtain a ResultT value. The ResultT value will only be available once
 * the dispatch function has been called on all the Tokens in the batch and the
 * user has called dispatcher.commit() to indicate no more batched transactions
 * are to be added.
 * User code pertaining to a task can be run between the point where a token for
 * the task has been issued and before calling the dispatch function on the
 * token. Since this code can potentially throw, the token issued for a task
 * should be moved into this processing code in such a way that if an exception
 * is thrown and then handled, the token object for the task is destroyed.
 * The batch query dispatcher will wait until all tokens have either been
 * destroyed or have had the dispatch function called on them. Leaking an
 * issued token will cause the batch dispatch to wait forever to happen.
 *
 * The AtomicBatchDispatcher object is referred to as the dispatcher below.
 *
 * POSSIBLE ERRORS:
 * 1) The dispatcher is destroyed before calling commit on it, for example
 *    because the user forgot to call commit OR an exception was thrown
 *    in user code before the call to commit:
 *    - The future ResultT has an exception of type ABDCommitNotCalledException
 *      set for all tokens that were issued by the dispatcher (once all tokens
 *      are either destroyed or have called dispatch)
 * 2) Calling the dispatch function more than once on the same Token object
 *    (or a moved version of the same Token):
 *    - Subsequent calls to dispatch (after the first one) will throw an
 *      ABDUsageException exception (the batch itself will not have any errors
 *      and will get processed)
 * 3) One/more of the Tokens issued are destroyed before calling dispatch on
 *    it/them:
 *    - The future ResultT has an ABDTokenNotDispatchedException set for all
 *      tokens that were issued by the dispatcher (once all tokens are either
 *      destroyed or have called dispatch)
 * 4) dispatcher.getToken() is called after calling dispatcher.commit()
 *    - the call to getToken() will throw an ABDUsageException exception
 *      (the batch itself will not have any errors and will get processed).
 * 5) All tokens were issued and called dispatch, the user provided batch
 *    dispatch function is called, but that function throws any exception.
 *    - The future ResultT has exception for all tokens that were issued by
 *      the dispatcher. The result will contain the wrapped user exception.
 *
 * EXAMPLE (There are other ways to achieve this, but this is one example):
 * - User creates an AtomicBatchDispatcher on stack
 *     auto dispatcher =
 *         folly::fibers::createAtomicBatchDispatcher(dispatchFunc, count);
 * - User creates "count" number of token objects by calling "getToken" count
 *   number of times
 *     std::vector<Job> jobs;
 *     for (size_t i = 0; i < count; ++i) {
 *       auto token = dispatcher.getToken();
 *       jobs.push_back(Job(std::move(token), singleInputValueToProcess);
 *     }
 * - User calls commit() on the dispatcher to indicate that no new tokens will
 *   be issued for this batch
 *     dispatcher.commit();
 * - Use any single threaded executor that will process the jobs
 * - On each execution (fiber) preprocess a single "Job" that has been moved in
 *   from the original vector "jobs". This way if the preprocessing throws
 *   the Job object being processed is destroyed and so is the token.
 * - On each execution (fiber) call the dispatch on the token
 *     auto future = job.token.dispatch(job.input);
 * - Save the future returned so that eventually you can wait on the results
 *     ResultT result;
 *     try {
 *       result = future.value();
 *       // future.hasValue() is true
 *     } catch (...) {
 *       // future.hasException() is true
 *       <DO WHATEVER YOU WANT IN CASE OF ERROR> }
 *     }
 *
 * NOTES:
 * - AtomicBatchDispatcher is not thread safe.
 * - Works for executors that run tasks on a single thread.
 */
template <typename InputT, typename ResultT>
class AtomicBatchDispatcher {
 private:
  struct DispatchBaton;
  friend struct DispatchBaton;

 public:
  using DispatchFunctionT =
      folly::Function<std::vector<ResultT>(std::vector<InputT>&&)>;

  class Token {
   public:
    explicit Token(std::shared_ptr<DispatchBaton> baton, size_t sequenceNumber);

    Future<ResultT> dispatch(InputT input);

    // Allow moving a Token object
    Token(Token&&) = default;
    Token& operator=(Token&&) = default;

    size_t sequenceNumber() const;

   private:
    // Disallow copying a Token object
    Token(const Token&) = delete;
    Token& operator=(const Token&) = delete;

    std::shared_ptr<DispatchBaton> baton_;
    size_t sequenceNumber_;
  };

  explicit AtomicBatchDispatcher(DispatchFunctionT&& dispatchFunc);

  ~AtomicBatchDispatcher();

  // numEntries is a *hint* about the number of inputs to expect:
  // - It is used purely to reserve space for storing vector of inputs etc.,
  //   so that reeallocation and move copy are reduced / not needed.
  // - It is provided purely for performance reasons
  void reserve(size_t numEntries);

  Token getToken();

  void commit();

  // Allow moving an AtomicBatchDispatcher object
  AtomicBatchDispatcher(AtomicBatchDispatcher&&) = default;
  AtomicBatchDispatcher& operator=(AtomicBatchDispatcher&&) = default;

 private:
  // Disallow copying an AtomicBatchDispatcher object
  AtomicBatchDispatcher(const AtomicBatchDispatcher&) = delete;
  AtomicBatchDispatcher& operator=(const AtomicBatchDispatcher&) = delete;

  size_t numTokensIssued_;
  std::shared_ptr<DispatchBaton> baton_;
};

// initialCapacity is a *hint* about the number of inputs to expect:
// - It is used purely to reserve space for storing vector of inputs etc.,
//   so that reeallocation and move copy are reduced / not needed.
// - It is provided purely for performance reasons
template <typename InputT, typename ResultT>
AtomicBatchDispatcher<InputT, ResultT> createAtomicBatchDispatcher(
    folly::Function<std::vector<ResultT>(std::vector<InputT>&&)> dispatchFunc,
    size_t initialCapacity = 0);

} // namespace fibers
} // namespace folly

#include <folly/fibers/AtomicBatchDispatcher-inl.h>
