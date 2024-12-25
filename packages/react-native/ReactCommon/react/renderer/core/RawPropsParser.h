/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/RawPropsKey.h>
#include <react/renderer/core/RawPropsKeyMap.h>
#include <react/renderer/core/RawPropsPrimitives.h>
#include <react/renderer/core/RawValue.h>

namespace facebook::react {

/*
 * Specialized (to a particular type of Props) parser that provides the most
 * efficient access to `RawProps` content.
 */
class RawPropsParser final {
 public:
  /*
   * Default constructor.
   * To be used by `ConcreteComponentDescriptor` only.
   * If `useRawPropsJsiValue` is `true`, the parser will use `jsi::Value`
   * directly for RawValues instead of converting them to `folly::dynamic`.
   */
  RawPropsParser(
      bool useRawPropsJsiValue = ReactNativeFeatureFlags::useRawPropsJsiValue())
      : useRawPropsJsiValue_(useRawPropsJsiValue){};

  /*
   * To be used by `ConcreteComponentDescriptor` only.
   */
  template <typename PropsT>
  void prepare() noexcept {
    static_assert(
        std::is_base_of<Props, PropsT>::value,
        "PropsT must be a descendant of Props");
    RawProps emptyRawProps{};

    // Create a stub parser context.
    // Since this prepares the parser by passing in
    // empty props, no prop parsers should actually reference the
    // ContextContainer or SurfaceId here.
    ContextContainer contextContainer{};
    PropsParserContext parserContext{-1, contextContainer};

    emptyRawProps.parse(*this);
    PropsT(parserContext, {}, emptyRawProps);
    postPrepare();
  }

 private:
  friend class ComponentDescriptor;
  template <class ShadowNodeT>
  friend class ConcreteComponentDescriptor;
  friend class RawProps;
  bool useRawPropsJsiValue_{false};

  /*
   * To be used by `RawProps` only.
   */
  void preparse(const RawProps& rawProps) const noexcept;

  /*
   * Non-generic part of `prepare`.
   */
  void postPrepare() noexcept;

  /*
   * To be used by `RawProps` only.
   */
  const RawValue* at(const RawProps& rawProps, const RawPropsKey& key)
      const noexcept;

  mutable std::vector<RawPropsKey> keys_{};
  mutable RawPropsKeyMap nameToIndex_{};
  mutable bool ready_{false};
};

} // namespace facebook::react
