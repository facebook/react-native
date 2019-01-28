/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
 * and ensuring that event dispatching happens on propper threads.
 */
class EventBeat {
 public:
  virtual ~EventBeat() = default;

  using BeatCallback = std::function<void(jsi::Runtime &runtime)>;
  using FailCallback = std::function<void()>;

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
  void setBeatCallback(const BeatCallback &beatCallback);

  /*
   * Sets the fail callback function.
   * Called in case if the beat cannot be performed anymore because of
   * some external circumstances (e.g. execution thread is beling destructed).
   * The callback can be called on any thread.
   */
  void setFailCallback(const FailCallback &failCallback);

  /*
   * Should be used by sublasses to send a beat.
   * Receiver might ignore the call if a beat was not requested.
   */
  void beat(jsi::Runtime &runtime) const;

 protected:
  BeatCallback beatCallback_;
  FailCallback failCallback_;
  mutable std::atomic<bool> isRequested_{false};
};

using EventBeatFactory = std::function<std::unique_ptr<EventBeat>()>;

} // namespace react
} // namespace facebook
