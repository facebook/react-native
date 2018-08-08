/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/components/text/RawTextProps.h>
#include <fabric/core/ConcreteShadowNode.h>

namespace facebook {
namespace react {

extern const char RawTextComponentName[];

/*
 * `ShadowNode` for <RawText> component, represents a purely regular string
 * object in React. In a code fragment `<Text>Hello!</Text>`, "Hello!" part
 * is represented as `<RawText text="Hello!"/>`.
 * <RawText> component must not have any children.
 */
using RawTextShadowNode =
  ConcreteShadowNode<
    RawTextComponentName,
    RawTextProps
  >;

} // namespace react
} // namespace facebook
