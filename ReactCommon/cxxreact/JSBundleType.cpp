// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "JSBundleType.h"

#include <folly/Bits.h>

namespace facebook {
namespace react {

static uint32_t constexpr RAMBundleMagicNumber = 0xFB0BD1E5;
static uint32_t constexpr BCBundleMagicNumber  = 0x6D657300;

ScriptTag parseTypeFromHeader(const BundleHeader& header) {
  switch (folly::Endian::little(header.magic)) {
  case RAMBundleMagicNumber:
    return ScriptTag::RAMBundle;
  case BCBundleMagicNumber:
    return ScriptTag::BCBundle;
  default:
    return ScriptTag::String;
  }
}

const char *stringForScriptTag(const ScriptTag& tag) {
  switch (tag) {
    case ScriptTag::String:
      return "String";
    case ScriptTag::RAMBundle:
      return "RAM Bundle";
    case ScriptTag::BCBundle:
      return "BC Bundle";
  }
  return "";
}

}  // namespace react
}  // namespace facebook
