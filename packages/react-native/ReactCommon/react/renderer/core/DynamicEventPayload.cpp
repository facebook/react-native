/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DynamicEventPayload.h"

#include <jsi/JSIDynamic.h>

namespace facebook::react {

DynamicEventPayload::DynamicEventPayload(folly::dynamic&& payload)
    : payload_(std::move(payload)) {}

jsi::Value DynamicEventPayload::asJSIValue(jsi::Runtime& runtime) const {
  return jsi::valueFromDynamic(runtime, payload_);
}

EventPayloadType DynamicEventPayload::getType() const {
  return EventPayloadType::ValueFactory;
}

std::optional<double> DynamicEventPayload::extractValue(
    const std::vector<std::string>& path) const {
  auto dynamic = payload_;
  for (auto& key : path) {
    auto type = dynamic.type();
    if ((type == folly::dynamic::Type::OBJECT ||
         type == folly::dynamic::Type::ARRAY) &&
        !dynamic.empty()) {
      dynamic = folly::dynamic(dynamic[key]);
    }
  }
  if (dynamic.type() == folly::dynamic::Type::DOUBLE) {
    return dynamic.asDouble();
  } else if (dynamic.type() == folly::dynamic::Type::INT64) {
    return dynamic.asInt();
  }
  return std::nullopt;
}

} // namespace facebook::react
