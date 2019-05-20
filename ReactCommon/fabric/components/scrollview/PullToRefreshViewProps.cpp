/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PullToRefreshViewProps.h"

#include <react/core/propsConversions.h>
#include <react/graphics/conversions.h>

namespace facebook {
namespace react {

PullToRefreshViewProps::PullToRefreshViewProps(
    PullToRefreshViewProps const &sourceProps,
    RawProps const &rawProps)
    : ViewProps(sourceProps, rawProps),
      refreshing(
          convertRawProp(rawProps, "refreshing", sourceProps.refreshing)),
      tintColor(convertRawProp(rawProps, "tintColor", sourceProps.tintColor)),
      title(convertRawProp(rawProps, "title", sourceProps.title)),
      titleColor(
          convertRawProp(rawProps, "titleColor", sourceProps.titleColor)) {}

} // namespace react
} // namespace facebook
