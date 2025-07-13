/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ModalHostViewUtils.h"
#import <Foundation/Foundation.h>
#import <React/RCTUtils.h>

namespace facebook::react {

Size ModalHostViewScreenSize(void)
{
  CGSize screenSize = RCTScreenSize();
  return {screenSize.width, screenSize.height};
}

} // namespace facebook::react
