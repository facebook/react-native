/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>

#include <react/core/State.h>

namespace facebook {
namespace react {

/*
 * Concrete and only template implementation of State interface.
 * State wraps an arbitrary data type and provides an interface to initiate a
 * state update transaction. A data object does not need to be copyable but
 * needs to be moveable.
 */
template <typename DataT>
class ConcreteState : public State {
 public:
  using Shared = std::shared_ptr<const ConcreteState>;
  using Data = DataT;

  explicit ConcreteState(
      Data &&data,
      StateCoordinator::Shared const &stateCoordinator)
      : State(stateCoordinator), data_(std::move(data)) {}

  explicit ConcreteState(Data &&data, State const &other)
      : State(other), data_(std::move(data)) {}

  virtual ~ConcreteState() = default;

  /*
   * Returns stored data.
   */
  const Data &getData() const {
    return data_;
  }

  /*
   * Initiate a state update process with given new data and priority.
   * This is a simplified convenience version of the method that receives a
   * function for cases where a new value of data does not depend on an old
   * value.
   */
  void updateState(
      Data &&newData,
      EventPriority priority = EventPriority::SynchronousUnbatched) const {
    updateState(
        [data = std::move(newData)](const Data &oldData) mutable -> Data && {
          return std::move(data);
        });
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
      std::function<Data(const Data &oldData)> callback,
      EventPriority priority = EventPriority::AsynchronousBatched) const {
    stateCoordinator_->dispatchRawState(
        {[stateCoordinator = stateCoordinator_,
          callback = std::move(
              callback)]() -> std::pair<StateTarget, StateData::Shared> {
          auto target = stateCoordinator->getTarget();
          auto oldState = target.getShadowNode().getState();
          auto oldData = std::static_pointer_cast<const ConcreteState>(oldState)
                             ->getData();
          auto newData = std::make_shared<Data>(callback(oldData));
          return {std::move(target), std::move(newData)};
        }},
        priority);
  }

#ifdef ANDROID
  const folly::dynamic getDynamic() const override {
    return data_.getDynamic();
  }

  void updateState(folly::dynamic data) const override {
    updateState(std::move(Data(data)));
  }
#endif

 private:
  DataT data_;
};

} // namespace react
} // namespace facebook
