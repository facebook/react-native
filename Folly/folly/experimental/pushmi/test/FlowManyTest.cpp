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

#include <array>

#include <type_traits>

#include <chrono>
using namespace std::literals;

#include <folly/experimental/pushmi/flow_many_sender.h>
#include <folly/experimental/pushmi/o/submit.h>
#include <folly/experimental/pushmi/o/from.h>
#include <folly/experimental/pushmi/o/for_each.h>

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

SCENARIO("flow many immediate cancellation", "[flowmany][flow][sender]") {
  int signals = 0;

  GIVEN("A flow many sender") {
    auto f = mi::MAKE(flow_many_sender)([&](auto out) {

      using Out = decltype(out);
      struct Data : mi::receiver<> {
        explicit Data(Out out) : out(std::move(out)), stop(false) {}
        Out out;
        bool stop;
      };

      auto up = mi::MAKE(receiver)(
          Data{std::move(out)},
          [&](auto& data, auto requested) {
            signals += 1000000;
            if (requested < 1) {return;}
            // check boolean to select signal
            if (!data.stop) {
              ::mi::set_value(data.out, 42);
            }
            ::mi::set_done(data.out);
          },
          [&](auto& data, auto e) noexcept {
            signals += 100000;
            data.stop = true;
            ::mi::set_done(data.out);
          },
          [&](auto& data) {
            signals += 10000;
            data.stop = true;
            ::mi::set_done(data.out);
          });

      // pass reference for cancellation.
      ::mi::set_starting(up.data().out, std::move(up));
    });

    WHEN("submit is applied and cancels the producer") {
      f |
          op::submit(mi::MAKE(flow_receiver)(
              mi::on_value([&](int) { signals += 100; }),
              mi::on_error([&](auto) noexcept { signals += 1000; }),
              mi::on_done([&]() { signals += 1; }),
              // immediately stop producer
              mi::on_starting([&](auto up) {
                signals += 10;
                ::mi::set_done(up);
              })));

      THEN(
          "the starting, up.done and out.done signals are each recorded once") {
        REQUIRE(signals == 10011);
      }
    }

    WHEN("submit is applied and cancels the producer late") {
      f |
          op::submit(mi::MAKE(flow_receiver)(
              mi::on_value([&](int) { signals += 100; }),
              mi::on_error([&](auto) noexcept { signals += 1000; }),
              mi::on_done([&]() { signals += 1; }),
              // do not stop producer before it is scheduled to run
              mi::on_starting([&](auto up) {
                signals += 10;
                ::mi::set_value(up, 1);
              })));

      THEN(
          "the starting, up.value, value and done signals are each recorded once") {
        REQUIRE(signals == 1000111);
      }
    }

  }
}

SCENARIO("flow many cancellation new thread", "[flowmany][flow][sender]") {
  auto nt = mi::new_thread();
  using NT = decltype(nt);
  auto time = mi::time_source<>{};
  auto tnt = time.make(mi::systemNowF{}, [nt](){ return nt; })();
  using TNT = decltype(tnt);
  auto tcncl = time.make(mi::systemNowF{}, [nt](){ return nt; })();
  std::atomic<int> signals{0};
  auto at = mi::now(tnt) + 200ms;

  GIVEN("A flow many sender") {
    auto f = mi::MAKE(flow_many_sender)([&](auto out) {
      using Out = decltype(out);

      // boolean cancellation
      struct producer {
        producer(Out out, TNT tnt, bool s) : out(std::move(out)), tnt(std::move(tnt)), stop(s) {}
        Out out;
        TNT tnt;
        std::atomic<bool> stop;
      };
      auto p = std::make_shared<producer>(std::move(out), tnt, false);

      struct Data : mi::receiver<> {
        explicit Data(std::shared_ptr<producer> p) : p(std::move(p)) {}
        std::shared_ptr<producer> p;
      };

      auto up = mi::MAKE(receiver)(
          Data{p},
          [&at, &signals](auto& data, auto requested) {
            signals += 1000000;
            if (requested < 1) {return;}
            // submit work to happen later
            data.p->tnt |
                op::submit_at(
                    at,
                    [p = data.p](auto)  {
                      // check boolean to select signal
                      if (!p->stop) {
                        ::mi::set_value(p->out, 42);
                      }
                      ::mi::set_done(p->out);
                    });
          },
          [&signals](auto& data, auto e) noexcept {
            signals += 100000;
            data.p->stop.store(true);
            data.p->tnt | op::submit([p = data.p](auto)  {
              ::mi::set_done(p->out);
            });
          },
          [&signals](auto& data) {
            signals += 10000;
            data.p->stop.store(true);
            data.p->tnt | op::submit([p = data.p](auto)  {
              ::mi::set_done(p->out);
            });
          });

      tnt |
          op::submit([p, up = std::move(up)](auto tnt) mutable {
            // pass reference for cancellation.
            ::mi::set_starting(p->out, std::move(up));
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
                mi::set_value(up, 1);
                tcncl |
                    op::submit_at(
                        at - 100ms, [up = std::move(up)](auto) mutable {
                          ::mi::set_done(up);
                        });
              }));
      }

      // make sure that the completion signal arrives
      std::this_thread::sleep_for(200ms);

      THEN(
          "the starting, up.done and out.done signals are each recorded once") {
        REQUIRE(signals == 1010011);
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
                mi::set_value(up, 1);
                tcncl |
                    op::submit_at(
                        at + 100ms, [up = std::move(up)](auto) mutable {
                          ::mi::set_done(up);
                        });
              }));
      }

      std::this_thread::sleep_for(200ms);

      THEN(
          "the starting, up.done and out.value signals are each recorded once") {
        REQUIRE(signals == 1010111);
      }
    }

    WHEN("submit is applied and cancels the producer at the same time") {
      // count known results
      int total = 0;
      int cancellostrace = 0; // 1010111
      int cancelled = 0; // 1010011

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
                  mi::set_value(up, 1);
                  tcncl | op::submit_at(at, [up = std::move(up)](auto) mutable {
                    ::mi::set_done(up);
                  });
                }));
        }

        // make sure any cancellation signal has completed
        std::this_thread::sleep_for(200ms);

        // accumulate known signals
        ++total;
        cancellostrace += signals == 1010111;
        cancelled += signals == 1010011;

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

SCENARIO("flow many from", "[flow][sender][for_each]") {
  GIVEN("A flow many sender of 5 values") {
    auto v = std::array<int, 5>{0, 1, 2, 3, 4};
    auto f = op::flow_from(v);

    WHEN("for_each is applied") {
      int actual = 0;
      f | op::for_each(mi::MAKE(receiver)([&](int){++actual;}));

      THEN("all the values are sent once") {
        REQUIRE(actual == 5);
      }
    }
  }
}
#endif
