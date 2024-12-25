/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>

#include <react/debug/react_native_assert.h>
#include <react/renderer/core/State.h>

#ifdef ANDROID
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook::react {

/*
 * Concrete and only template implementation of State interface.
 * State wraps an arbitrary data type and provides an interface to initiate a
 * state update transaction. A data object does not need to be copyable but
 * needs to be moveable.
 */
template <typename DataT, bool usesMapBufferForStateData = false>
class ConcreteState : public State {
 public:
  using Shared = std::shared_ptr<const ConcreteState>;
  using Data = DataT;
  using SharedData = std::shared_ptr<const Data>;

  /*
   * Creates an updated `State` object with given previous one and `data`.
   */
  explicit ConcreteState(const SharedData& data, const State& previousState)
      : State(data, previousState) {}

  /*
   * Creates a first-of-its-family `State` object with given `family` and
   * `data`.
   */
  explicit ConcreteState(
      const SharedData& data,
      const ShadowNodeFamily::Shared& family)
      : State(data, family) {}

  ~ConcreteState() override = default;

  /*
   * Returns stored data.
   */
  const Data& getData() const {
    return *static_cast<const Data*>(data_.get());
  }

  /*
   * Initiate a state update process with given new data and priority.
   * This is a simplified convenience version of the method that receives a
   * function for cases where a new value of data does not depend on an old
   * value.
   */
  void updateState(Data&& newData) const {
    updateState([data{std::move(newData)}](const Data& oldData) -> SharedData {
      return std::make_shared<const Data>(data);
    });
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
      std::function<StateData::Shared(const Data& oldData)> callback) const {
    auto family = family_.lock();

    if (!family) {
      // No more nodes of this family exist anymore,
      // updating state is impossible.
      return;
    }

    auto stateUpdate = StateUpdate{
        family, [=](const StateData::Shared& oldData) -> StateData::Shared {
          react_native_assert(oldData);
          return callback(*static_cast<const Data*>(oldData.get()));
        }};

    family->dispatchRawState(std::move(stateUpdate));
  }

#ifdef ANDROID
  folly::dynamic getDynamic() const override {
    return getData().getDynamic();
  }

  void updateState(folly::dynamic&& data) const override {
    updateState(Data(getData(), std::move(data)));
  }

  MapBuffer getMapBuffer() const override {
    if constexpr (usesMapBufferForStateData) {
      return getData().getMapBuffer();
    } else {
      return MapBufferBuilder::EMPTY();
    }
  }
#endif
};

} // namespace facebook::react
