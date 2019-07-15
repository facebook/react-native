/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <functional>
#include <vector>
#include <yoga/YGEnums.h>
#include <yoga/YGMarker.h>

struct YGConfig;
struct YGNode;

namespace facebook {
namespace yoga {

enum LayoutType : int {
  kLayout = 0,
  kMeasure = 1,
  kCachedLayout = 2,
  kCachedMeasure = 3
};

struct Event {
  enum Type {
    NodeAllocation,
    NodeDeallocation,
    NodeLayout,
    LayoutPassStart,
    LayoutPassEnd,
    MeasureCallbackStart,
    MeasureCallbackEnd,
    NodeBaselineStart,
    NodeBaselineEnd,
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
#ifdef YG_ENABLE_EVENTS
    publish(node, E, Data{eventData});
#endif
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

template <>
struct Event::TypedData<Event::LayoutPassStart> {
  void* layoutContext;
};

template <>
struct Event::TypedData<Event::LayoutPassEnd> {
  void* layoutContext;
  YGMarkerLayoutData* layoutData;
};

template <>
struct Event::TypedData<Event::MeasureCallbackEnd> {
  void* layoutContext;
  float width;
  YGMeasureMode widthMeasureMode;
  float height;
  YGMeasureMode heightMeasureMode;
  float measuredWidth;
  float measuredHeight;
};

template <>
struct Event::TypedData<Event::NodeLayout> {
  LayoutType layoutType;
  void* layoutContext;
};

} // namespace yoga
} // namespace facebook
