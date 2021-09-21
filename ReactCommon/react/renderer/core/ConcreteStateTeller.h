/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/optional.h>
#include <glog/logging.h>
#include <react/renderer/core/ConcreteState.h>

namespace facebook {
namespace react {

/*
 * Wrapper for `ConreteState` class designed to make interactions with
 * ConcreteState easier.
 */
template <typename ConcreteStateT>
class ConcreteStateTeller {
 public:
  using Data = typename ConcreteStateT::Data;

  /*
   * Sets backing `ConcreteState` on which all the methods will be called.
   * Can be called from any thread.
   */
  void setConcreteState(State::Shared const &state) {
    std::lock_guard<std::mutex> lock(mutex_);
    concreteState_ = std::static_pointer_cast<ConcreteStateT const>(state);
  }

  /*
   * Removes reference to `ConcreteState` previously set in `setConcreteState`.
   * Can be called from any thread.
   */
  void invalidate() {
    std::lock_guard<std::mutex> lock(mutex_);
    concreteState_ = nullptr;
  }

  /*
   * Returns data if state isn't nullptr.
   * Can be called from any thread.
   */
  better::optional<Data> getData() const {
    std::lock_guard<std::mutex> lock(mutex_);
    if (concreteState_) {
      return concreteState_->getData();
    } else {
      return {};
    }
  }

  /*
   * Returns true if backing state isn't nullptr, false otherwise.
   * Can be called from any thread.
   */
  bool isValid() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return concreteState_ != nullptr;
  }

  /*
   * Initiate a state update process with given new data and priority.
   * This is a simplified convenience version of the method that receives a
   * function for cases where a new value of data does not depend on an old
   * value.
   */
  void updateState(
      Data &&newData,
      EventPriority priority = EventPriority::AsynchronousUnbatched) const {
    updateState(
        [data = std::move(newData)](Data const &oldData) -> Data {
          return std::move(data);
        },
        priority);
  }

  /*
   * Initiate a state update process with a given function (that transforms an
   * old data value to a new one) and priority. The update function can be
   * called from any thread any moment later. The function can be called only
   * once or not called at all (in the case where the node was already unmounted
   * and updating makes no sense). The state update operation might fail in case
   * of conflict.
   */
  void updateState(
      std::function<Data(Data const &oldData)> callback,
      EventPriority priority = EventPriority::AsynchronousBatched) const {
    std::shared_ptr<ConcreteStateT const> concreteState;
    {
      std::lock_guard<std::mutex> lock(mutex_);
      if (!concreteState_) {
        return;
      }
      concreteState = concreteState_;
    }

    concreteState->updateState(
        callback,
        [=]() {
          updateStateRetryIfNecesarry_(concreteState, callback, priority, 1);
        },
        priority);
  }

 private:
  /*
   * Protected by `mutex_`.
   */
  std::shared_ptr<ConcreteStateT const> concreteState_;

  /*
   * Protects `concreteState_`.
   */
  std::mutex mutable mutex_;

  void updateStateRetryIfNecesarry_(
      std::shared_ptr<ConcreteStateT const> concreteState,
      std::function<Data(Data const &oldData)> callback,
      EventPriority priority,
      int retryCount) const {
    {
      std::lock_guard<std::mutex> lock(mutex_);

      if (concreteState != concreteState_) {
        LOG(WARNING) << "ConcreteState_ changed while retrying";
        return;
      }
    }

    if (retryCount > 60) {
      LOG(ERROR) << "Exceeded 60 retries";
      assert(false);
      return;
    }

    concreteState->updateState(
        callback,
        [=] {
          updateStateRetryIfNecesarry_(
              concreteState, callback, priority, retryCount + 1);
        },
        priority);
  }
};

} // namespace react
} // namespace facebook
