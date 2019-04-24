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

#include <folly/experimental/pushmi/inline.h>
#include <folly/experimental/pushmi/trampoline.h>

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

SCENARIO( "trampoline executor", "[trampoline][sender]" ) {

  GIVEN( "A trampoline single_sender" ) {
    auto tr = v::trampoline();
    using TR = decltype(tr);

    WHEN( "submit" ) {
      auto signals = 0;
      tr |
        op::transform([](auto){ return 42; }) |
        op::submit(
          [&](auto){
            signals += 100; },
          [&](auto e) noexcept { signals += 1000; },
          [&](){ signals += 10; });

      THEN( "the value and done signals are each recorded once" ) {
        REQUIRE( signals == 110 );
      }
    }

    WHEN( "blocking get" ) {
      auto v = tr |
        op::transform([](auto){ return 42; }) |
        op::get<int>;

      THEN( "the result is" ) {
        REQUIRE( v == 42 );
      }
    }

    WHEN( "virtual derecursion is triggered" ) {
      int counter = 100'000;
      std::function<void(pushmi::any_executor_ref<> exec)> recurse;
      recurse = [&](pushmi::any_executor_ref<> tr) {
        if (--counter <= 0)
          return;
        tr | op::submit(recurse);
      };
      tr | op::submit([&](auto exec) { recurse(exec); });

      THEN( "all nested submissions complete" ) {
        REQUIRE( counter == 0 );
      }
    }

    WHEN( "static derecursion is triggered" ) {
      int counter = 100'000;
      countdownsingle single{counter};
      tr | op::submit(single);
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
      auto inlineon = sender | op::on([&](){return mi::inline_executor();});
      inlineon |
          op::submit(v::on_value([&](auto v) { values.push_back(std::to_string(v)); }));
      THEN( "only the first item was pushed" ) {
        REQUIRE(values == std::vector<std::string>{"2.000000"});
      }
      THEN( "executor was not changed by on" ) {
        REQUIRE(std::is_same<mi::executor_t<decltype(sender)>, mi::executor_t<decltype(inlineon)>>::value);
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
      auto inlinevia = sender | op::via([&](){return mi::inline_executor();});
      inlinevia |
          op::submit(v::on_value([&](auto v) { values.push_back(std::to_string(v)); }));
      THEN( "only the first item was pushed" ) {
        REQUIRE(values == std::vector<std::string>{"2.000000"});
      }
      THEN( "executor was changed by via" ) {
        REQUIRE(!std::is_same<mi::executor_t<decltype(sender)>, mi::executor_t<decltype(inlinevia)>>::value);
      }
    }
  }
}
#endif
