/*
 * Copyright 2018-present Facebook, Inc.
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

#include <type_traits>

#include <chrono>
using namespace std::literals;

#include <folly/experimental/pushmi/flow_single_sender.h>
#include <folly/experimental/pushmi/o/submit.h>

#include <folly/experimental/pushmi/entangle.h>
#include <folly/experimental/pushmi/new_thread.h>
#include <folly/experimental/pushmi/time_source.h>
#include <folly/experimental/pushmi/trampoline.h>

using namespace pushmi::aliases;

#if 0

#if __cpp_deduction_guides >= 201703
#define MAKE(x) x MAKE_
#define MAKE_(...) \
  { __VA_ARGS__ }
#else
#define MAKE(x) make_##x
#endif

SCENARIO("flow single immediate cancellation", "[flow][sender]") {
  int signals = 0;

  GIVEN("A flow single sender") {
    auto f = mi::MAKE(flow_single_sender)([&](auto out) {
      // boolean cancellation
      bool stop = false;
      auto set_stop = [](auto& stop) {
        if (!!stop) {
          *stop = true;
        }
      };
      auto tokens = mi::shared_entangle(stop, set_stop);

      using Stopper = decltype(tokens.second);
      struct Data : mi::receiver<> {
        explicit Data(Stopper stopper) : stopper(std::move(stopper)) {}
        Stopper stopper;
      };
      auto up = mi::MAKE(receiver)(
          Data{std::move(tokens.second)},
          [&](auto& data, auto e) noexcept {
            signals += 100000;
            auto both = lock_both(data.stopper);
            (*(both.first))(both.second);
          },
          mi::on_done([&](auto& data) {
            signals += 10000;
            auto both = lock_both(data.stopper);
            (*(both.first))(both.second);
          }));

      // pass reference for cancellation.
      ::mi::set_starting(out, std::move(up));

      // check boolean to select signal
      auto both = lock_both(tokens.first);
      if (!!both.first && !*(both.first)) {
        ::mi::set_value(out, 42);
      } else {
        // cancellation is not an error
        ::mi::set_done(out);
      }
    });

    WHEN("submit is applied and cancels the producer") {
      f |
          op::submit(
              mi::on_value([&](int) { signals += 100; }),
              mi::on_error([&](auto) noexcept { signals += 1000; }),
              mi::on_done([&]() { signals += 1; }),
              // immediately stop producer
              mi::on_starting([&](auto up) {
                signals += 10;
                ::mi::set_done(up);
              }));

      THEN(
          "the starting, up.done and out.done signals are each recorded once") {
        REQUIRE(signals == 10011);
      }
    }

    WHEN("submit is applied and cancels the producer late") {
      f |
          op::submit(
              mi::on_value([&](int) { signals += 100; }),
              mi::on_error([&](auto) noexcept { signals += 1000; }),
              mi::on_done([&]() { signals += 1; }),
              // do not stop producer before it is scheduled to run
              mi::on_starting([&](auto up) { signals += 10; }));

      THEN(
          "the starting and out.value signals are each recorded once") {
        REQUIRE(signals == 110);
      }
    }
  }
}

SCENARIO("flow single shared cancellation new thread", "[flow][sender]") {
  auto nt = mi::new_thread();
  using NT = decltype(nt);
  auto time = mi::time_source<>{};
  auto tnt = time.make(mi::systemNowF{}, [nt](){ return nt; })();
  auto tcncl = time.make(mi::systemNowF{}, [nt](){ return nt; })();
  std::atomic<int> signals{0};
  auto at = mi::now(tnt) + 200ms;

  GIVEN("A flow single sender") {
    auto f = mi::MAKE(flow_single_sender)([&](auto out) {
      // boolean cancellation
      bool stop = false;
      auto set_stop = [](auto& stop) {
        if (!!stop) {
          *stop = true;
        }
      };
      auto tokens = mi::shared_entangle(stop, set_stop);

      using Stopper = decltype(tokens.second);
      struct Data : mi::receiver<> {
        explicit Data(Stopper stopper) : stopper(std::move(stopper)) {}
        Stopper stopper;
      };
      auto up = mi::MAKE(receiver)(
          Data{std::move(tokens.second)},
          [&](auto& data, auto e) noexcept {
            signals += 100000;
            auto both = lock_both(data.stopper);
            (*(both.first))(both.second);
          },
          mi::on_done([&](auto& data) {
            signals += 10000;
            auto both = lock_both(data.stopper);
            (*(both.first))(both.second);
          }));

      // make all the signals come from the same thread
      tnt |
          op::submit([stoppee = std::move(tokens.first),
                      up = std::move(up),
                      out = std::move(out),
                      at](auto tnt) mutable {
            // pass reference for cancellation.
            ::mi::set_starting(out, std::move(up));

            // submit work to happen later
            tnt |
                op::submit_at(
                    at,
                    [stoppee = std::move(stoppee),
                     out = std::move(out)](auto) mutable {
                      // check boolean to select signal
                      auto both = lock_both(stoppee);
                      if (!!both.first && !*(both.first)) {
                        ::mi::set_value(out, 42);
                        ::mi::set_done(out);
                      } else {
                        // cancellation is not an error
                        ::mi::set_done(out);
                      }
                    });
          });
    });

    WHEN("submit is applied and cancels the producer early") {
      {
      f |
          op::blocking_submit(
              mi::on_value([&](int) { signals += 100; }),
              mi::on_error([&](auto) noexcept { signals += 1000; }),
              mi::on_done([&]() { signals += 1; }),
              // stop producer before it is scheduled to run
              mi::on_starting([&](auto up) {
                signals += 10;
                tcncl |
                    op::submit_at(
                        at - 50ms, [up = std::move(up)](auto) mutable {
                          ::mi::set_done(up);
                        });
              }));
      }

      // make sure that the completion signal arrives
      std::this_thread::sleep_for(100ms);

      THEN(
          "the starting, up.done and out.done signals are each recorded once") {
        REQUIRE(signals == 10011);
      }
    }

    WHEN("submit is applied and cancels the producer late") {
      {
      f |
          op::blocking_submit(
              mi::on_value([&](int) { signals += 100; }),
              mi::on_error([&](auto) noexcept { signals += 1000; }),
              mi::on_done([&]() { signals += 1; }),
              // do not stop producer before it is scheduled to run
              mi::on_starting([&](auto up) {
                signals += 10;
                tcncl |
                    op::submit_at(
                        at + 50ms, [up = std::move(up)](auto) mutable {
                          ::mi::set_done(up);
                        });
              }));
      }

      std::this_thread::sleep_for(100ms);

      THEN(
          "the starting, up.done, out.value and out.done signals are each recorded once") {
        REQUIRE(signals == 10111);
      }
    }

    WHEN("submit is applied and cancels the producer at the same time") {
      // count known results
      int total = 0;
      int cancellostrace = 0; // 10111
      int cancelled = 0; // 10011

      for (;;) {
        signals = 0;
        // set completion time to be in 100ms
        at = mi::now(tnt) + 100ms;
        {
        f |
            op::blocking_submit(
                mi::on_value([&](int) { signals += 100; }),
                mi::on_error([&](auto) noexcept { signals += 1000; }),
                mi::on_done([&]() { signals += 1; }),
                // stop producer at the same time that it is scheduled to run
                mi::on_starting([&](auto up) {
                  signals += 10;
                  tcncl | op::submit_at(at, [up = std::move(up)](auto) mutable {
                    ::mi::set_done(up);
                  });
                }));
        }

        // make sure any cancellation signal has completed
        std::this_thread::sleep_for(100ms);

        // accumulate known signals
        ++total;
        cancellostrace += signals == 10111;
        cancelled += signals == 10011;

        if (total != cancellostrace + cancelled) {
          // display the unrecognized signals recorded
          REQUIRE(signals == -1);
        }
        if (total >= 100) {
          // too long, abort and show the signals distribution
          WARN(
              "total " << total << ", cancel-lost-race " << cancellostrace
                       << ", cancelled " << cancelled);
          break;
        }
        if (cancellostrace > 4 && cancelled > 4) {
          // yay all known outcomes were observed!
          break;
        }
        // try again
        continue;
      }
    }

    time.join();
  }
}

SCENARIO("flow single entangled cancellation new thread", "[flow][sender]") {
  auto nt = mi::new_thread();
  using NT = decltype(nt);
  auto time = mi::time_source<>{};
  auto tnt = time.make(mi::systemNowF{}, [nt](){ return nt; })();
  auto tcncl = time.make(mi::systemNowF{}, [nt](){ return nt; })();
  std::atomic<int> signals{0};
  auto at = mi::now(tnt) + 200ms;

  GIVEN("A flow single sender") {
    auto f = mi::MAKE(flow_single_sender)([&](auto out) {
      // boolean cancellation
      bool stop = false;
      auto set_stop = [](auto& stop) {
        if (!!stop) {
          *stop = true;
        }
      };
      auto tokens = mi::entangle(stop, set_stop);

      using Stopper = decltype(tokens.second);
      struct Data : mi::receiver<> {
        explicit Data(Stopper stopper) : stopper(std::move(stopper)) {}
        Stopper stopper;
      };
      auto up = mi::MAKE(receiver)(
          Data{std::move(tokens.second)},
          [&](auto& data, auto e) noexcept {
            signals += 100000;
            auto both = lock_both(data.stopper);
            (*(both.first))(both.second);
          },
          mi::on_done([&](auto& data) {
            signals += 10000;
            auto both = lock_both(data.stopper);
            (*(both.first))(both.second);
          }));

      // make all the signals come from the same thread
      tnt |
          op::submit([stoppee = std::move(tokens.first),
                      up = std::move(up),
                      out = std::move(out),
                      at](auto tnt) mutable {
            // pass reference for cancellation.
            ::mi::set_starting(out, std::move(up));

            // submit work to happen later
            tnt |
                op::submit_at(
                    at,
                    [stoppee = std::move(stoppee),
                     out = std::move(out)](auto) mutable {
                      // check boolean to select signal
                      auto both = lock_both(stoppee);
                      if (!!both.first && !*(both.first)) {
                        ::mi::set_value(out, 42);
                        ::mi::set_done(out);
                      } else {
                        // cancellation is not an error
                        ::mi::set_done(out);
                      }
                    });
          });
    });

    WHEN("submit is applied and cancels the producer early") {
      {
      f |
          op::blocking_submit(
              mi::on_value([&](int) { signals += 100; }),
              mi::on_error([&](auto) noexcept { signals += 1000; }),
              mi::on_done([&]() { signals += 1; }),
              // stop producer before it is scheduled to run
              mi::on_starting([&](auto up) {
                signals += 10;
                tcncl |
                    op::submit_at(
                        at - 50ms, [up = std::move(up)](auto) mutable {
                          ::mi::set_done(up);
                        });
              }));
      }

      // make sure that the completion signal arrives
      std::this_thread::sleep_for(100ms);

      THEN(
          "the starting, up.done and out.done signals are each recorded once") {
        REQUIRE(signals == 10011);
      }
    }

    WHEN("submit is applied and cancels the producer late") {
      {
      f |
          op::blocking_submit(
              mi::on_value([&](int) { signals += 100; }),
              mi::on_error([&](auto) noexcept { signals += 1000; }),
              mi::on_done([&]() { signals += 1; }),
              // do not stop producer before it is scheduled to run
              mi::on_starting([&](auto up) {
                signals += 10;
                tcncl |
                    op::submit_at(
                        at + 50ms, [up = std::move(up)](auto) mutable {
                          ::mi::set_done(up);
                        });
              }));
      }

      std::this_thread::sleep_for(100ms);

      THEN(
          "the starting, up.done, out.value and out.done signals are each recorded once") {
        REQUIRE(signals == 10111);
      }
    }

    WHEN("submit is applied and cancels the producer at the same time") {
      // count known results
      int total = 0;
      int cancellostrace = 0; // 10111
      int cancelled = 0; // 10011

      for (;;) {
        signals = 0;
        // set completion time to be in 100ms
        at = mi::now(tnt) + 100ms;
        {
        f |
            op::blocking_submit(
                mi::on_value([&](int) { signals += 100; }),
                mi::on_error([&](auto) noexcept { signals += 1000; }),
                mi::on_done([&]() { signals += 1; }),
                // stop producer at the same time that it is scheduled to run
                mi::on_starting([&](auto up) {
                  signals += 10;
                  tcncl | op::submit_at(at, [up = std::move(up)](auto) mutable {
                    ::mi::set_done(up);
                  });
                }));
        }

        // make sure any cancellation signal has completed
        std::this_thread::sleep_for(200ms);

        // accumulate known signals
        ++total;
        cancellostrace += signals == 10111;
        cancelled += signals == 10011;

        if (total != cancellostrace + cancelled) {
          // display the unrecognized signals recorded
          REQUIRE(signals == -1);
        }
        if (total >= 100) {
          // too long, abort and show the signals distribution
          WARN(
              "total " << total << ", cancel-lost-race " << cancellostrace
                       << ", cancelled " << cancelled);
          break;
        }
        if (cancellostrace > 4 && cancelled > 4) {
          // yay all known outcomes were observed!
          break;
        }
        // try again
        continue;
      }
    }

    time.join();
  }
}
#endif
