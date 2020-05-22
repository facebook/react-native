/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include <react/components/art/ARTElement.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#endif

namespace facebook {
namespace react {

/*
 * State for <ARTSurfaceViewState> component.
 * Represents what to render and how to render.
 */
class ARTSurfaceViewState final {
 public:
  ARTElement::ListOfShared elements{};

#ifdef ANDROID
  ARTSurfaceViewState(ARTElement::ListOfShared const &elements)
      : elements(elements) {}
  ARTSurfaceViewState() = default;
  ARTSurfaceViewState(
      ARTSurfaceViewState const &previousState,
      folly::dynamic const &data) {
    assert(false && "Not supported");
  };
  folly::dynamic getDynamic() const;
#endif
};

} // namespace react
} // namespace facebook
