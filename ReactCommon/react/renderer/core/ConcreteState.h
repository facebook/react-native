/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>

#include <react/debug/react_native_assert.h>
#include <react/renderer/core/State.h>

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
  using Shared = std::shared_ptr<ConcreteState const>;
  using Data = DataT;
  using SharedData = std::shared_ptr<Data const>;

  /*
   * Creates an updated `State` object with given previous one and `data`.
   */
  explicit ConcreteState(SharedData const &data, State const &state)
      : State(data, state) {}

  /*
   * Creates a first-of-its-family `State` object with given `family` and
   * `data`.
   */
  explicit ConcreteState(
      SharedData const &data,
      ShadowNodeFamily::Shared const &family)
      : State(data, family) {}

  virtual ~ConcreteState() = default;

  /*
   * Returns stored data.
   */
  Data const &getData() const {
    return *std::static_pointer_cast<Data const>(data_);
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
        [data{std::move(newData)}](Data const &oldData) -> SharedData {
          return std::make_shared<Data const>(data);
        },
        priority);
  }

  /*
   * Initiate a state update process with a given function (that transforms an
   * old data value to a new one) and priority. The callback function can be
   * called from any thread any moment later.
   * In case of a conflict, the `callback` might be called several times until
   * it succeeded. To cancel the state update operation, the callback needs to
   * return `nullptr`.
   */
  void updateState(
      std::function<StateData::Shared(Data const &oldData)> callback,
      EventPriority priority = EventPriority::AsynchronousBatched) const {
    auto family = family_.lock();

    if (!family) {
      // No more nodes of this family exist anymore,
      // updating state is impossible.
      return;
    }

    auto stateUpdate = StateUpdate{
        family, [=](StateData::Shared const &oldData) -> StateData::Shared {
          react_native_assert(oldData);
          return callback(*std::static_pointer_cast<Data const>(oldData));
        }};

    family->dispatchRawState(std::move(stateUpdate), priority);
  }

#ifdef ANDROID
  folly::dynamic getDynamic() const override {
    return getData().getDynamic();
  }

  void updateState(folly::dynamic data) const override {
    updateState(std::move(Data(getData(), data)));
  }
  MapBuffer getMapBuffer() const override {
    return getData().getMapBuffer();
  }
#endif
};

} // namespace react
} // namespace facebook
