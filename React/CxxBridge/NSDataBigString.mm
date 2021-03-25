/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "NSDataBigString.h"

namespace facebook {
namespace react {

NSDataBigString::NSDataBigString(NSData *data)
{
  m_length = [data length];
  m_data = data;
}

}
}
