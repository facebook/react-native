/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/BaseViewProps.h>

namespace facebook::react {
using ViewProps = BaseViewProps;
using SharedViewProps = std::shared_ptr<ViewProps const>;
} // namespace facebook::react
