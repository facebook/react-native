/*
 * Copyright 2011-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#pragma once

#include <folly/io/async/EventBase.h>
#include <folly/portability/Event.h>
#include <map>

namespace folly {

/**
 * A handler to receive notification about POSIX signals.
 *
 * AsyncSignalHandler allows code to process signals from within a EventBase
 * loop.
 *
 * Standard signal handlers interrupt execution of the main thread, and
 * are run while the main thread is paused.  As a result, great care must be
 * taken to avoid race conditions if the signal handler has to access or modify
 * any data used by the main thread.
 *
 * AsyncSignalHandler solves this problem by running the AsyncSignalHandler
 * callback in normal thread of execution, as a EventBase callback.
 *
 * AsyncSignalHandler may only be used in a single thread.  It will only
 * process signals received by the thread where the AsyncSignalHandler is
 * registered.  It is the user's responsibility to ensure that signals are
 * delivered to the desired thread in multi-threaded programs.
 */
class AsyncSignalHandler {
 public:
  /**
   * Create a new AsyncSignalHandler.
   */
  explicit AsyncSignalHandler(EventBase* eventBase);
  virtual ~AsyncSignalHandler();

  /**
   * Attach this AsyncSignalHandler to an EventBase.
   *
   * This should only be called if the AsyncSignalHandler is not currently
   * registered for any signals and is not currently attached to an existing
   * EventBase.
   */
  void attachEventBase(EventBase* eventBase);

  /**
   * Detach this AsyncSignalHandler from its EventBase.
   *
   * This should only be called if the AsyncSignalHandler is not currently
   * registered for any signals.
   */
  void detachEventBase();

  /**
   * Get the EventBase used by this AsyncSignalHandler.
   */
  EventBase* getEventBase() const {
    return eventBase_;
  }

  /**
   * Register to receive callbacks about the specified signal.
   *
   * Once the handler has been registered for a particular signal,
   * signalReceived() will be called each time this thread receives this
   * signal.
   *
   * Throws if an error occurs or if this handler is already
   * registered for this signal.
   */
  void registerSignalHandler(int signum);

  /**
   * Unregister for callbacks about the specified signal.
   *
   * Throws if an error occurs, or if this signal was not registered.
   */
  void unregisterSignalHandler(int signum);

  /**
   * signalReceived() will called to indicate that the specified signal has
   * been received.
   *
   * signalReceived() will always be invoked from the EventBase loop (i.e.,
   * after the main POSIX signal handler has returned control to the EventBase
   * thread).
   */
  virtual void signalReceived(int signum) noexcept = 0;

 private:
  typedef std::map<int, struct event> SignalEventMap;

  // Forbidden copy constructor and assignment operator
  AsyncSignalHandler(AsyncSignalHandler const&);
  AsyncSignalHandler& operator=(AsyncSignalHandler const&);

  static void libeventCallback(libevent_fd_t signum, short events, void* arg);

  EventBase* eventBase_{nullptr};
  SignalEventMap signalEvents_;
};

} // namespace folly
