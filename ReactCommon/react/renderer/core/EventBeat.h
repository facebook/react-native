/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>
#include <atomic>
#include <functional>
#include <memory>

namespace facebook {
namespace react {

/*
 * Event Beat serves two interleaving purposes: synchronization of event queues
 * and ensuring that event dispatching happens on proper threads.
 */
class EventBeat {
 public:
  /*
   * The concept of `Owner`
   * The purpose of `EventBeat` is handling an asynchronous callback to itself
   * which is being delivered on some different thread. That brings a challenge
   * of ensuring that the `EventBeat` object stays valid during the timeframe of
   * callback execution. The concept of Owner helps with that. The owner is a
   * shared pointer that retains (probably indirectly) the `EventBeat` object.
   * To ensure the correctness of the call, `EventBeat` retains the owner
   * (practically creating a retain cycle) during executing the callback. In
   * case if the pointer to the owner already null, `EventBeat` skips executing
   * the callback. It's impossible to retain itself directly or refer to the
   * shared pointer to itself from a constructor. `OwnerBox` is designed to work
   * around this issue; it allows to store the pointer later, right after the
   * creation of some other object that owns an `EventBeat`.
   */
  using Owner = std::weak_ptr<void const>;
  struct OwnerBox {
    Owner owner;
  };
  using SharedOwnerBox = std::shared_ptr<OwnerBox>;

  using Factory =
      std::function<std::unique_ptr<EventBeat>(SharedOwnerBox const &ownerBox)>;

  using BeatCallback = std::function<void(jsi::Runtime &runtime)>;

  EventBeat(SharedOwnerBox ownerBox);

  virtual ~EventBeat() = default;

  /*
   * Communicates to the Beat that a consumer is waiting for the coming beat.
   * A consumer must request coming beat after the previous beat happened
   * to receive a next coming one.
   */
  virtual void request() const;

  /*
   * Induces the next beat to happen as soon as possible. If the method
   * is called on the proper thread, the beat must happen synchronously.
   * Subclasses might override this method to implement specific
   * out-of-turn beat scheduling.
   * Some types of Event Beats do not support inducing, hence the default
   * implementation does nothing.
   * Receiver might ignore the call if a beat was not requested.
   */
  virtual void induce() const;

  /*
   * Sets the beat callback function.
   * The callback is must be called on the proper thread.
   */
  void setBeatCallback(BeatCallback beatCallback);

 protected:
  /*
   * Should be used by sublasses to send a beat.
   * Receiver might ignore the call if a beat was not requested.
   */
  void beat(jsi::Runtime &runtime) const;

  BeatCallback beatCallback_;
  SharedOwnerBox ownerBox_;
  mutable std::atomic<bool> isRequested_{false};
};

} // namespace react
} // namespace facebook
