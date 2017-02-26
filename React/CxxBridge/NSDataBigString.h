/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#include <cxxreact/JSBigString.h>

namespace facebook {
namespace react {

class NSDataBigString : public JSBigString {
public:
  // The NSData passed in must be be null-terminated.
  NSDataBigString(NSData *data);

  // The ASCII optimization is not enabled on iOS
  bool isAscii() const override {
    return false;
  }

  const char *c_str() const override {
    return (const char *)[m_data bytes];
  }

  size_t size() const override {
    return m_length;
  }

private:
  NSData *m_data;
  size_t m_length;
};

} }
