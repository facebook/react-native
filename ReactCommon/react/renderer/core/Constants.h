/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook {
namespace react {

struct Constants {
  /*
      Flag controlling props forwarding when shadow node is cloned on Android.
      Has no effect on iOS.
  */
  static void setPropsForwardingEnabled(bool propsForwardingEnabled);
  static bool getPropsForwardingEnabled();
};

} // namespace react
} // namespace facebook
