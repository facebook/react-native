/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RootProps.h"

#include <react/renderer/components/view/YogaLayoutableShadowNode.h>
#include <react/renderer/components/view/conversions.h>

namespace facebook {
namespace react {

// Note that a default/empty context may be passed here from RootShadowNode.
// If that's a problem and the context is necesary here, refactor RootShadowNode
// first.
RootProps::RootProps(
    const PropsParserContext &context,
    RootProps const &sourceProps,
    RawProps const &rawProps)
    : ViewProps(context, sourceProps, rawProps) {}

// Note that a default/empty context may be passed here from RootShadowNode.
// If that's a problem and the context is necesary here, refactor RootShadowNode
// first.
RootProps::RootProps(
    const PropsParserContext &context,
    RootProps const &sourceProps,
    LayoutConstraints const &layoutConstraints,
    LayoutContext const &layoutContext)
    : ViewProps(),
      layoutConstraints(layoutConstraints),
      layoutContext(layoutContext){};

} // namespace react
} // namespace facebook
