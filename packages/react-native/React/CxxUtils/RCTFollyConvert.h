/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#include <folly/dynamic.h>

namespace facebook::react {

[[deprecated(
    "This function is deprecated, please use /ReactCommon/react/utils/platform/ios/react/utils/FollyConvert.h instead")]]
folly::dynamic convertIdToFollyDynamic(id json);
[[deprecated(
    "This function is deprecated, please use /ReactCommon/react/utils/platform/ios/react/utils/FollyConvert.h instead")]]
id convertFollyDynamicToId(const folly::dynamic& dyn);

} // namespace facebook::react
