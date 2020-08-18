/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <jsi/jsi.h>

namespace facebook {
namespace react {

/*
 * `EventTarget` represents storage of a weak instance handle object with some
 * information about the possibility of retaining that strongly on demand.
 * Note: Retaining an `EventTarget` does *not* guarantee that actual event
 * target (a JavaScript object) is retaining and/or valid in JavaScript realm.
 * The `EventTarget` retains an `instanceHandle` value in `unsafe-unretained`
 * manner.
 * All `EventTarget` instances must be deallocated before
 * stopping JavaScript machine.
 */
class EventTarget {
 public:
  /*
   * We have to repeat `Tag` type definition here because `events` module does
   * not depend on `core` module (and should not).
   */
  using Tag = int32_t;

  /*
   * Constructs an EventTarget from a weak instance handler and a tag.
   */
  EventTarget(jsi::Runtime &runtime, const jsi::Value &instanceHandle, Tag tag);

  /*
   * Sets the `enabled` flag that allows creating a strong instance handle from
   * a weak one.
   */
  void setEnabled(bool enabled) const;

  /*
   * Retains an instance handler by creating a strong reference to it.
   * If the EventTarget is disabled, does nothing.
   */
  void retain(jsi::Runtime &runtime) const;

  /*
   * Releases the instance handler by nulling a strong reference to it.
   */
  void release(jsi::Runtime &runtime) const;

  /*
   * Creates and returns the `instanceHandle`.
   * Returns `null` if the `instanceHandle` is not retained at this moment.
   */
  jsi::Value getInstanceHandle(jsi::Runtime &runtime) const;

  /*
   * Deprecated. Do not use.
   */
  Tag getTag() const;

 private:
  mutable bool enabled_{false}; // Protected by `EventEmitter::DispatchMutex()`.
  mutable jsi::WeakObject weakInstanceHandle_; // Protected by `jsi::Runtime &`.
  mutable jsi::Value strongInstanceHandle_; // Protected by `jsi::Runtime &`.
  Tag tag_;
};

using SharedEventTarget = std::shared_ptr<const EventTarget>;

} // namespace react
} // namespace facebook
