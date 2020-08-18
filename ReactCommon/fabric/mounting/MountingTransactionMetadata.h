/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/mounting/MountingTelemetry.h>
#include <react/mounting/MountingTransaction.h>

namespace facebook {
namespace react {

/*
 * Contains all (meta)information related to a MountingTransaction except a list
 * of mutation instructions.
 * The class is meant to be used when a consumer should not have access to all
 * information about the transaction (incapsulation) but still needs to observe
 * it to produce some side-effects.
 */
class MountingTransactionMetadata final {
 public:
  SurfaceId surfaceId;
  MountingTransaction::Number number;
  MountingTelemetry telemetry;
};

} // namespace react
} // namespace facebook
