/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#pragma once

#include "AnimatedNode.h"

#include <vector>

namespace facebook::react {

using ValueListenerCallback = std::function<void(double)>;

class ValueAnimatedNode : public AnimatedNode {
 public:
  ValueAnimatedNode(
      Tag tag,
      const folly::dynamic& config,
      const std::shared_ptr<NativeAnimatedNodesManager>& manager);
  double value();
  double rawValue();
  bool setRawValue(double value);
  double offset();
  bool setOffset(double offset);
  void flattenOffset();
  void extractOffset();
  void setValueListener(ValueListenerCallback&& callback);

  virtual bool isColorValue() {
    return isColorValue_;
  }

 protected:
  bool isColorValue_{false};

 private:
  void onValueUpdate();

  double value_{0.0};
  double offset_{0.0};
  ValueListenerCallback valueListener_{};
};

class OperatorAnimatedNode : public ValueAnimatedNode {
 public:
  OperatorAnimatedNode(
      Tag tag,
      const folly::dynamic& config,
      const std::shared_ptr<NativeAnimatedNodesManager>& manager);

 protected:
  std::vector<Tag> inputNodes_{};
};

} // namespace facebook::react
