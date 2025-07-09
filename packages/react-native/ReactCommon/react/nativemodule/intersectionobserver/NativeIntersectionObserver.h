/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <react/renderer/bridging/bridging.h>
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
        // rootShadowNode
        std::optional<std::shared_ptr<const ShadowNode>>,
        // targetShadowNode
        std::shared_ptr<const ShadowNode>,
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
        RectAsTuple,
        // isIntersectingAboveThresholds
        bool,
        // time
        HighResTimeStamp>;

template <>
struct Bridging<NativeIntersectionObserverEntry>
    : NativeIntersectionObserverNativeIntersectionObserverEntryBridging<
          NativeIntersectionObserverEntry> {};

class NativeIntersectionObserver
    : public NativeIntersectionObserverCxxSpec<NativeIntersectionObserver> {
 public:
  NativeIntersectionObserver(std::shared_ptr<CallInvoker> jsInvoker);

  // TODO(T223605846): Remove legacy observe method
  [[deprecated("Please use observeV2")]]
  void observe(
      jsi::Runtime& runtime,
      NativeIntersectionObserverObserveOptions options);

  // TODO(T223605846): Remove legacy unobserve method
  [[deprecated("Please use unobserveV2")]]
  void unobserve(
      jsi::Runtime& runtime,
      IntersectionObserverObserverId intersectionObserverId,
      std::shared_ptr<const ShadowNode> targetShadowNode);

  jsi::Object observeV2(
      jsi::Runtime& runtime,
      NativeIntersectionObserverObserveOptions options);

  void unobserveV2(
      jsi::Runtime& runtime,
      IntersectionObserverObserverId intersectionObserverId,
      jsi::Object targetToken);

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
      const IntersectionObserverEntry& entry,
      jsi::Runtime& runtime);
};

} // namespace facebook::react
