/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/art/Element.h>
#include <react/components/art/Shape.h>
#include <react/components/art/primitives.h>
#include <react/graphics/Geometry.h>
#include <functional>

#include <memory>

namespace facebook {
namespace react {

/*
 * Simple, cross-platfrom, React-specific implementation of ART Text Element
 */
class Text : public Shape {
 public:
  using Shared = std::shared_ptr<const Text>;
  Text(ARTElement elementType) : Shape(){};
  Text() = default;
  virtual ~Text(){};

  int aligment{0};

  // TODO T64130144: add frame data
  // ARTTextFrameStruct frame{}

#ifdef ANDROID
  folly::dynamic getDynamic() const override;
#endif
};

} // namespace react
} // namespace facebook
