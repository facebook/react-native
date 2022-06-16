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

namespace facebook {
namespace react {

class Props;

using SharedProps = std::shared_ptr<Props const>;

/*
 * Represents the most generic props object.
 */
class Props : public virtual Sealable, public virtual DebugStringConvertible {
 public:
  using Shared = std::shared_ptr<Props const>;

  Props() = default;
  Props(
      const PropsParserContext &context,
      const Props &sourceProps,
      RawProps const &rawProps,
      bool shouldSetRawProps = true);
  virtual ~Props() = default;

  static bool enablePropIteratorSetter;

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
      const PropsParserContext &context,
      RawPropsPropNameHash hash,
      const char *propName,
      RawValue const &value);

  std::string nativeId;

  /*
   * Special value that represents generation number of `Props` object, which
   * increases when the object was constructed with some source `Props` object.
   * Default props objects (that was constructed using default constructor) have
   * revision equals `0`.
   * The value might be used for optimization purposes.
   */
  int const revision{0};

#ifdef ANDROID
  folly::dynamic rawProps = folly::dynamic::object();
#endif
};

} // namespace react
} // namespace facebook
