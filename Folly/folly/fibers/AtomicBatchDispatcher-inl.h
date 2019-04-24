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
namespace folly {
namespace fibers {

template <typename InputT, typename ResultT>
struct AtomicBatchDispatcher<InputT, ResultT>::DispatchBaton {
  DispatchBaton(DispatchFunctionT&& dispatchFunction)
      : expectedCount_(0), dispatchFunction_(std::move(dispatchFunction)) {}

  ~DispatchBaton() {
    fulfillPromises();
  }

  void reserve(size_t numEntries) {
    optEntries_.reserve(numEntries);
  }

  void setExceptionWrapper(folly::exception_wrapper&& exWrapper) {
    exceptionWrapper_ = std::move(exWrapper);
  }

  void setExpectedCount(size_t expectedCount) {
    assert(expectedCount_ == 0 || !"expectedCount_ being set more than once");
    expectedCount_ = expectedCount;
    optEntries_.resize(expectedCount_);
  }

  Future<ResultT> getFutureResult(InputT&& input, size_t sequenceNumber) {
    if (sequenceNumber >= optEntries_.size()) {
      optEntries_.resize(sequenceNumber + 1);
    }
    folly::Optional<Entry>& optEntry = optEntries_[sequenceNumber];
    assert(!optEntry || !"Multiple inputs have the same token sequence number");
    optEntry = Entry(std::move(input));
    return optEntry->promise.getFuture();
  }

 private:
  void setExceptionResults(const folly::exception_wrapper& exceptionWrapper) {
    for (auto& optEntry : optEntries_) {
      if (optEntry) {
        optEntry->promise.setException(exceptionWrapper);
      }
    }
  }

  void setExceptionResults(std::exception_ptr eptr) {
    auto exceptionWrapper = exception_wrapper(eptr);
    return setExceptionResults(exceptionWrapper);
  }

  template <typename TException>
  void setExceptionResults(
      const TException& ex,
      std::exception_ptr eptr = std::exception_ptr()) {
    auto exceptionWrapper =
        eptr ? exception_wrapper(eptr, ex) : exception_wrapper(ex);
    return setExceptionResults(exceptionWrapper);
  }

  void fulfillPromises() {
    try {
      // If an error message is set, set all promises to exception with message
      if (exceptionWrapper_) {
        return setExceptionResults(exceptionWrapper_);
      }

      // Validate entries count same as expectedCount_
      assert(
          optEntries_.size() == expectedCount_ ||
          !"Entries vector did not have expected size");
      std::vector<size_t> vecTokensNotDispatched;
      for (size_t i = 0; i < expectedCount_; ++i) {
        if (!optEntries_[i]) {
          vecTokensNotDispatched.push_back(i);
        }
      }
      if (!vecTokensNotDispatched.empty()) {
        return setExceptionResults(ABDTokenNotDispatchedException(
            detail::createABDTokenNotDispatchedExMsg(vecTokensNotDispatched)));
      }

      // Create the inputs vector
      std::vector<InputT> inputs;
      inputs.reserve(expectedCount_);
      for (auto& optEntry : optEntries_) {
        inputs.emplace_back(std::move(optEntry->input));
      }

      // Call the user provided batch dispatch function to get all results
      // and make sure that we have the expected number of results returned
      auto results = dispatchFunction_(std::move(inputs));
      if (results.size() != expectedCount_) {
        return setExceptionResults(
            ABDUsageException(detail::createUnexpectedNumResultsABDUsageExMsg(
                expectedCount_, results.size())));
      }

      // Fulfill the promises with the results from the batch dispatch
      for (size_t i = 0; i < expectedCount_; ++i) {
        optEntries_[i]->promise.setValue(std::move(results[i]));
      }
    } catch (const std::exception& ex) {
      // Set exceptions thrown when executing the user provided dispatch func
      return setExceptionResults(ex, std::current_exception());
    } catch (...) {
      // Set exceptions thrown when executing the user provided dispatch func
      return setExceptionResults(std::current_exception());
    }
  }

  struct Entry {
    InputT input;
    folly::Promise<ResultT> promise;

    Entry(Entry&& other) noexcept
        : input(std::move(other.input)), promise(std::move(other.promise)) {}

    Entry& operator=(Entry&& other) noexcept {
      input = std::move(other.input);
      promise = std::move(other.promise);
      return *this;
    }

    explicit Entry(InputT&& input_) : input(std::move(input_)) {}
  };

  size_t expectedCount_;
  DispatchFunctionT dispatchFunction_;
  std::vector<folly::Optional<Entry>> optEntries_;
  folly::exception_wrapper exceptionWrapper_;
};

template <typename InputT, typename ResultT>
AtomicBatchDispatcher<InputT, ResultT>::Token::Token(
    std::shared_ptr<DispatchBaton> baton,
    size_t sequenceNumber)
    : baton_(std::move(baton)), sequenceNumber_(sequenceNumber) {}

template <typename InputT, typename ResultT>
size_t AtomicBatchDispatcher<InputT, ResultT>::Token::sequenceNumber() const {
  return sequenceNumber_;
}

template <typename InputT, typename ResultT>
Future<ResultT> AtomicBatchDispatcher<InputT, ResultT>::Token::dispatch(
    InputT input) {
  auto baton = std::move(baton_);
  if (!baton) {
    throw ABDUsageException(
        "Dispatch called more than once on the same Token object");
  }
  return baton->getFutureResult(std::move(input), sequenceNumber_);
}

template <typename InputT, typename ResultT>
AtomicBatchDispatcher<InputT, ResultT>::AtomicBatchDispatcher(
    DispatchFunctionT&& dispatchFunc)
    : numTokensIssued_(0),
      baton_(std::make_shared<DispatchBaton>(std::move(dispatchFunc))) {}

template <typename InputT, typename ResultT>
AtomicBatchDispatcher<InputT, ResultT>::~AtomicBatchDispatcher() {
  if (baton_) {
    // Set error here rather than throw because we do not want to throw from
    // the destructor of AtomicBatchDispatcher
    baton_->setExceptionWrapper(
        folly::make_exception_wrapper<ABDCommitNotCalledException>());
    commit();
  }
}

template <typename InputT, typename ResultT>
void AtomicBatchDispatcher<InputT, ResultT>::reserve(size_t numEntries) {
  if (!baton_) {
    throw ABDUsageException("Cannot call reserve(....) after calling commit()");
  }
  baton_->reserve(numEntries);
}

template <typename InputT, typename ResultT>
auto AtomicBatchDispatcher<InputT, ResultT>::getToken() -> Token {
  if (!baton_) {
    throw ABDUsageException("Cannot issue more tokens after calling commit()");
  }
  return Token(baton_, numTokensIssued_++);
}

template <typename InputT, typename ResultT>
void AtomicBatchDispatcher<InputT, ResultT>::commit() {
  auto baton = std::move(baton_);
  if (!baton) {
    throw ABDUsageException(
        "Cannot call commit() more than once on the same dispatcher");
  }
  baton->setExpectedCount(numTokensIssued_);
}

template <typename InputT, typename ResultT>
AtomicBatchDispatcher<InputT, ResultT> createAtomicBatchDispatcher(
    folly::Function<std::vector<ResultT>(std::vector<InputT>&&)> dispatchFunc,
    size_t initialCapacity) {
  auto abd = AtomicBatchDispatcher<InputT, ResultT>(std::move(dispatchFunc));
  if (initialCapacity) {
    abd.reserve(initialCapacity);
  }
  return abd;
}

} // namespace fibers
} // namespace folly
