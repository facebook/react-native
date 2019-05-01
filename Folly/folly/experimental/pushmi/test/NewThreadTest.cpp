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
#include <folly/experimental/pushmi/o/empty.h>
#include <folly/experimental/pushmi/o/just.h>
#include <folly/experimental/pushmi/o/on.h>
#include <folly/experimental/pushmi/o/transform.h>
#include <folly/experimental/pushmi/o/tap.h>
#include <folly/experimental/pushmi/o/via.h>
#include <folly/experimental/pushmi/o/submit.h>
#include <folly/experimental/pushmi/o/extension_operators.h>

#include <folly/experimental/pushmi/new_thread.h>
#include <folly/experimental/pushmi/time_source.h>
#include <folly/experimental/pushmi/strand.h>

using namespace pushmi::aliases;

#if 0
struct countdownsingle {
  countdownsingle(int& c)
      : counter(&c) {}

  int* counter;

  template <class ExecutorRef>
  void operator()(ExecutorRef exec) {
    if (--*counter > 0) {
      exec | op::submit(*this);
    }
  }
};

SCENARIO( "new_thread executor", "[new_thread][sender]" ) {

  GIVEN( "A new_thread time_single_sender" ) {
    auto nt = v::new_thread();
    using NT = decltype(nt);

    auto time = mi::time_source<>{};

    auto tnt = time.make(mi::systemNowF{}, [nt](){ return nt; })();

    WHEN( "blocking submit now" ) {
      auto signals = 0;
      auto start = v::now(tnt);
      auto signaled = start;
      tnt |
        op::transform([](auto tnt){ return tnt | ep::now(); }) |
        op::blocking_submit(
          [&](auto at){
            signaled = at;
            signals += 100; },
          [&](auto e) noexcept {  signals += 1000; },
          [&](){ signals += 10; });

      THEN( "the value and done signals are recorded once and the value signal did not drift much" ) {
        REQUIRE( signals == 110 );
        auto delay = std::chrono::duration_cast<std::chrono::milliseconds>((signaled - start)).count();
        INFO("The delay is " << ::Catch::Detail::stringify(delay));
        REQUIRE( delay < 1000 );
      }
    }

    WHEN( "blocking get now" ) {
      auto start = v::now(tnt);
      auto signaled = tnt |
        op::transform([](auto tnt){
          return v::now(tnt);
        }) |
        op::get<std::chrono::system_clock::time_point>;

      THEN( "the signal did not drift much" ) {
        auto delay = std::chrono::duration_cast<std::chrono::milliseconds>((signaled - start)).count();
        INFO("The delay is " << ::Catch::Detail::stringify(delay));
        REQUIRE( delay < 1000 );
      }
    }

    WHEN( "submissions are ordered in time" ) {
      std::vector<std::string> times;
      std::atomic<int> pushed(0);
      auto push = [&](int time) {
        return v::on_value([&, time](auto) { times.push_back(std::to_string(time)); ++pushed; });
      };
      tnt | op::submit(v::on_value([push](auto tnt) {
        auto now = tnt | ep::now();
        tnt |
            op::submit_after(40ms, push(40)) |
            op::submit_at(now + 10ms, push(10)) |
            op::submit_after(20ms, push(20)) |
            op::submit_at(now + 10ms, push(11));
      }));

      while(pushed.load() < 4) { std::this_thread::sleep_for(10ms); }

      THEN( "the items were pushed in time order not insertion order" ) {
        REQUIRE( times == std::vector<std::string>{"10", "11", "20", "40"});
      }
    }

    WHEN( "now is called" ) {
      bool done = false;
      tnt | ep::now();
      tnt | op::blocking_submit([&](auto tnt) {
        tnt | ep::now();
        done = true;
      });

      THEN( "both calls to now() complete" ) {
        REQUIRE( done == true );
      }
    }

    WHEN( "blocking submit" ) {
      auto signals = 0;
      nt |
        op::transform([](auto){ return 42; }) |
        op::blocking_submit(
          [&](auto){
            signals += 100; },
          [&](auto e) noexcept {  signals += 1000; },
          [&](){ signals += 10; });

      THEN( "the value and done signals are recorded once" ) {
        REQUIRE( signals == 110 );
      }
    }

    WHEN( "blocking get" ) {
      auto v = nt |
        op::transform([](auto){
          return 42;
        }) |
        op::get<int>;

        THEN( "the result is" ) {
          REQUIRE( v == 42 );
        }
    }

    WHEN( "virtual derecursion is triggered" ) {
      int counter = 100'000;
      std::function<void(pushmi::any_executor_ref<> exec)> recurse;
      recurse = [&](pushmi::any_executor_ref<> nt) {
        if (--counter <= 0)
          return;
        nt | op::submit(recurse);
      };
      nt | op::blocking_submit([&](auto nt) { recurse(nt); });

      THEN( "all nested submissions complete" ) {
        REQUIRE( counter == 0 );
      }
    }

    WHEN( "static derecursion is triggered" ) {
      int counter = 100'000;
      countdownsingle single{counter};
      nt | op::blocking_submit(single);
      THEN( "all nested submissions complete" ) {
        REQUIRE( counter == 0 );
      }
    }

    WHEN( "used with on" ) {
      std::vector<std::string> values;
      auto sender = pushmi::make_single_sender([](auto out) {
        ::pushmi::set_value(out, 2.0);
        ::pushmi::set_done(out);
        // ignored
        ::pushmi::set_value(out, 1);
        ::pushmi::set_value(out, std::numeric_limits<int8_t>::min());
        ::pushmi::set_value(out, std::numeric_limits<int8_t>::max());
      });
      sender | op::on([&](){return nt;}) |
        op::blocking_submit(v::on_value([&](auto v) { values.push_back(std::to_string(v)); }));
      THEN( "only the first item was pushed" ) {
        REQUIRE(values == std::vector<std::string>{"2.000000"});
      }
    }

    WHEN( "used with via" ) {
      std::vector<std::string> values;
      auto sender = pushmi::make_single_sender([](auto out) {
        ::pushmi::set_value(out, 2.0);
        ::pushmi::set_done(out);
        // ignored
        ::pushmi::set_value(out, 1);
        ::pushmi::set_value(out, std::numeric_limits<int8_t>::min());
        ::pushmi::set_value(out, std::numeric_limits<int8_t>::max());
      });
      sender | op::via(mi::strands(nt)) |
          op::blocking_submit(v::on_value([&](auto v) { values.push_back(std::to_string(v)); }));
      THEN( "only the first item was pushed" ) {
        REQUIRE(values == std::vector<std::string>{"2.000000"});
      }
    }

    time.join();
  }
}
#endif
