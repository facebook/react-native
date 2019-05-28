/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <functional>
#include <vector>

struct YGConfig;
struct YGNode;

namespace facebook {
namespace yoga {

struct Event {
  enum Type {
    NodeAllocation,
    NodeDeallocation,
    NodeLayout,
    LayoutPassStart,
    LayoutPassEnd
  };
  class Data;
  using Subscriber = void(const YGNode&, Type, Data);
  using Subscribers = std::vector<std::function<Subscriber>>;

  template <Type E>
  struct TypedData {};

  class Data {
    const void* data_;

  public:
    template <Type E>
    Data(const TypedData<E>& data) : data_{&data} {}

    template <Type E>
    const TypedData<E>& get() const {
      return *static_cast<const TypedData<E>*>(data_);
    };
  };

  static void reset();

  static void subscribe(std::function<Subscriber>&& subscriber);

  template <Type E>
  static void publish(const YGNode& node, const TypedData<E>& eventData = {}) {
    publish(node, E, Data{eventData});
  }

  template <Type E>
  static void publish(const YGNode* node, const TypedData<E>& eventData = {}) {
    publish<E>(*node, eventData);
  }

private:
  static void publish(const YGNode&, Type, const Data&);
};

template <>
struct Event::TypedData<Event::NodeAllocation> {
  YGConfig* config;
};

template <>
struct Event::TypedData<Event::NodeDeallocation> {
  YGConfig* config;
};

} // namespace yoga
} // namespace facebook
