/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "NSDataBigString.h"

namespace facebook::react {

NSDataBigString::NSDataBigString(NSData *data)
{
  m_data = data;
  m_length = [m_data length];
}

} // namespace facebook::react
