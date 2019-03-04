/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>

#include <react/core/ReactPrimitives.h>
#include <react/core/Sealable.h>
#include <react/debug/DebugStringConvertible.h>

namespace facebook {
namespace react {

class Props;

using SharedProps = std::shared_ptr<const Props>;

/*
 * Represents the most generic props object.
 */
class Props : public virtual Sealable, public virtual DebugStringConvertible {
 public:
  Props() = default;
  Props(const Props &sourceProps, const RawProps &rawProps);
  virtual ~Props() = default;

  const std::string nativeId;

  /*
   * Special value that represents generation number of `Props` object, which
   * increases when the object was constructed with some source `Props` object.
   * Default props objects (that was constructed using default constructor) have
   * revision equals `0`.
   * The value might be used for optimization purposes.
   */
  const int revision{0};

#ifdef ANDROID
  const folly::dynamic rawProps = folly::dynamic::object();
#endif
};

} // namespace react
} // namespace facebook
