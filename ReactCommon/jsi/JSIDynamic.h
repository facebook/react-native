// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <folly/dynamic.h>
#include <jsi/jsi.h>

namespace facebook {
namespace jsi {

facebook::jsi::Value valueFromDynamic(
  facebook::jsi::Runtime& runtime, const folly::dynamic& dyn);

folly::dynamic dynamicFromValue(facebook::jsi::Runtime& runtime,
                                const facebook::jsi::Value& value);

}
}
