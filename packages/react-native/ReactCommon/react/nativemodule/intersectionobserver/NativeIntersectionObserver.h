/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <react/renderer/observers/intersection/IntersectionObserverManager.h>
#include <optional>
#include <tuple>
#include <vector>

namespace facebook::react {

using NativeIntersectionObserverIntersectionObserverId = int32_t;
using RectAsTuple = std::tuple<Float, Float, Float, Float>;

using NativeIntersectionObserverObserveOptions =
    NativeIntersectionObserverNativeIntersectionObserverObserveOptions<
        // intersectionObserverId
        NativeIntersectionObserverIntersectionObserverId,
        // targetShadowNode
        jsi::Object,
        // thresholds
        std::vector<Float>,
        // rootThresholds
        std::optional<std::vector<Float>>>;

template <>
struct Bridging<NativeIntersectionObserverObserveOptions>
    : NativeIntersectionObserverNativeIntersectionObserverObserveOptionsBridging<
          NativeIntersectionObserverObserveOptions> {};

using NativeIntersectionObserverEntry =
    NativeIntersectionObserverNativeIntersectionObserverEntry<
        // intersectionObserverId
        NativeIntersectionObserverIntersectionObserverId,
        // targetInstanceHandle
        jsi::Value,
        // targetRect
        RectAsTuple,
        // rootRect
        RectAsTuple,
        // intersectionRect
        std::optional<RectAsTuple>,
        // isIntersectingAboveThresholds
        bool,
        // time
        double>;

template <>
struct Bridging<NativeIntersectionObserverEntry>
    : NativeIntersectionObserverNativeIntersectionObserverEntryBridging<
          NativeIntersectionObserverEntry> {};

class NativeIntersectionObserver
    : public NativeIntersectionObserverCxxSpec<NativeIntersectionObserver> {
 public:
  NativeIntersectionObserver(std::shared_ptr<CallInvoker> jsInvoker);

  void observe(
      jsi::Runtime& runtime,
      NativeIntersectionObserverObserveOptions options);

  void unobserve(
      jsi::Runtime& runtime,
      IntersectionObserverObserverId intersectionObserverId,
      jsi::Object targetShadowNode);

  void connect(
      jsi::Runtime& runtime,
      AsyncCallback<> notifyIntersectionObserversCallback);

  void disconnect(jsi::Runtime& runtime);

  std::vector<NativeIntersectionObserverEntry> takeRecords(
      jsi::Runtime& runtime);

 private:
  IntersectionObserverManager intersectionObserverManager_{};

  static UIManager& getUIManagerFromRuntime(jsi::Runtime& runtime);
  static NativeIntersectionObserverEntry convertToNativeModuleEntry(
      IntersectionObserverEntry entry,
      jsi::Runtime& runtime);
};

} // namespace facebook::react
