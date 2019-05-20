/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <memory>

#include <react/components/view/ViewEventEmitter.h>
#include <react/core/EventEmitter.h>

namespace facebook {
namespace react {

class PullToRefreshViewEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  void onRefresh() const;
};

} // namespace react
} // namespace facebook
