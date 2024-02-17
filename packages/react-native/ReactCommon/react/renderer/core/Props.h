/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>

#include <react/renderer/core/PropsMacros.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/core/Sealable.h>
#include <react/renderer/debug/DebugStringConvertible.h>

#ifdef ANDROID
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook::react {

/*
 * Represents the most generic props object.
 */
class Props : public virtual Sealable, public virtual DebugStringConvertible {
 public:
  using Shared = std::shared_ptr<const Props>;

  Props() = default;
  Props(
      const PropsParserContext& context,
      const Props& sourceProps,
      const RawProps& rawProps);
  virtual ~Props() = default;

  Props(const Props& other) = delete;
  Props& operator=(const Props& other) = delete;

  /**
   * Set a prop value via iteration (see enableIterator above).
   * If setProp is defined for a particular props struct, it /must/
   * be called every time setProp is called on the hierarchy.
   * For example, ViewProps overrides setProp and so ViewProps must
   * explicitly call Props::setProp every time ViewProps::setProp is
   * called. This is because a single prop from JS can be reused
   * multiple times for different values in the hierarchy. For example, if
   * ViewProps uses "propX", Props may also use "propX".
   */
  void setProp(
      const PropsParserContext& context,
      RawPropsPropNameHash hash,
      const char* propName,
      const RawValue& value);

  std::string nativeId;

#ifdef ANDROID
  folly::dynamic rawProps = folly::dynamic::object();
#endif

 protected:
  /** Initialize member variables of Props instance */
  void initialize(
      const PropsParserContext& context,
      const Props& sourceProps,
      const RawProps& rawProps);
};

} // namespace facebook::react
