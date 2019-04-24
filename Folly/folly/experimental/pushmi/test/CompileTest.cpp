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
#include <folly/experimental/pushmi/o/submit.h>

using namespace pushmi::aliases;

using namespace std::literals;

#if __cpp_deduction_guides >= 201703
#define MAKE(x) x MAKE_
#define MAKE_(...) {__VA_ARGS__}
#else
#define MAKE(x) make_ ## x
#endif


void receiver_0_test() {
  auto out0 = pushmi::MAKE(receiver)();
  static_assert(mi::Receiver<decltype(out0)>, "out0 not a receiver");
  auto out1 = pushmi::MAKE(receiver)(pushmi::ignoreVF{});
  static_assert(mi::Receiver<decltype(out1)>, "out1 not a receiver");
  auto out2 = pushmi::MAKE(receiver)(pushmi::ignoreVF{}, pushmi::abortEF{});
  static_assert(mi::Receiver<decltype(out2)>, "out2 not a receiver");
  auto out3 = pushmi::MAKE(receiver)(pushmi::ignoreVF{}, pushmi::abortEF{}, pushmi::ignoreDF{});
  static_assert(mi::Receiver<decltype(out3)>, "out3 not a receiver");
  auto out4 = pushmi::MAKE(receiver)([](auto e) noexcept{ e.get(); });
  static_assert(mi::Receiver<decltype(out4)>, "out4 not a receiver");
  auto out5 = pushmi::MAKE(receiver)(
      pushmi::on_value(
        []() { }
      ));
  static_assert(mi::Receiver<decltype(out5)>, "out5 not a receiver");
  auto out6 = pushmi::MAKE(receiver)(
      pushmi::on_error(
        [](std::exception_ptr) noexcept {},
        [](auto e) noexcept { e.get(); }
      ));
  static_assert(mi::Receiver<decltype(out6)>, "out6 not a receiver");
  auto out7 = pushmi::MAKE(receiver)(
      pushmi::on_done([]() {  }));
  static_assert(mi::Receiver<decltype(out7)>, "out7 not a receiver");

  using Out0 = decltype(out0);

  auto proxy0 = pushmi::MAKE(receiver)(out0);
  static_assert(mi::Receiver<decltype(proxy0)>, "proxy0 not a receiver");
  auto proxy1 = pushmi::MAKE(receiver)(out0, pushmi::passDVF{});
  static_assert(mi::Receiver<decltype(proxy1)>, "proxy1 not a receiver");
  auto proxy2 = pushmi::MAKE(receiver)(out0, pushmi::passDVF{}, pushmi::on_error(pushmi::passDEF{}));
  static_assert(mi::Receiver<decltype(proxy2)>, "proxy2 not a receiver");
  auto proxy3 = pushmi::MAKE(receiver)(
      out0, pushmi::passDVF{}, pushmi::passDEF{}, pushmi::passDDF{});
  static_assert(mi::Receiver<decltype(proxy3)>, "proxy3 not a receiver");
  auto proxy4 = pushmi::MAKE(receiver)(out0, [](Out0&){}, pushmi::on_error([](Out0& d, auto e)noexcept {
    d.error(e);
  }));
  static_assert(mi::Receiver<decltype(proxy4)>, "proxy4 not a receiver");
  auto proxy5 = pushmi::MAKE(receiver)(
      out0,
      pushmi::on_value(
        [](Out0&) { }
      ));
  static_assert(mi::Receiver<decltype(proxy5)>, "proxy5 not a receiver");
  auto proxy6 = pushmi::MAKE(receiver)(
      out0,
      pushmi::on_error(
        [](Out0&, std::exception_ptr) noexcept{},
        [](Out0&, auto e) noexcept{ e.get(); }
      ));
  static_assert(mi::Receiver<decltype(proxy6)>, "proxy6 not a receiver");
  auto proxy7 = pushmi::MAKE(receiver)(
      out0,
      pushmi::on_done([](Out0&) { }));
  static_assert(mi::Receiver<decltype(proxy7)>, "proxy7 not a receiver");

  std::promise<void> p0;
  auto promise0 = pushmi::MAKE(receiver)(std::move(p0));
  promise0.done();

  std::promise<void> p1;

  auto any0 = pushmi::any_receiver<>(std::move(p1));
  auto any1 = pushmi::any_receiver<>(std::move(promise0));
  auto any2 = pushmi::any_receiver<>(out0);
  auto any3 = pushmi::any_receiver<>(proxy0);
}

void receiver_1_test(){
  auto out0 = pushmi::MAKE(receiver)();
  static_assert(mi::Receiver<decltype(out0)>, "out0 not a receiver");
  auto out1 = pushmi::MAKE(receiver)(pushmi::ignoreVF{});
  static_assert(mi::Receiver<decltype(out1)>, "out1 not a receiver");
  auto out2 = pushmi::MAKE(receiver)(pushmi::ignoreVF{}, pushmi::abortEF{});
  static_assert(mi::Receiver<decltype(out2)>, "out2 not a receiver");
  auto out3 =
      pushmi::MAKE(receiver)(pushmi::ignoreVF{}, pushmi::abortEF{}, pushmi::ignoreDF{});
  static_assert(mi::Receiver<decltype(out3)>, "out3 not a receiver");
  auto out4 = pushmi::MAKE(receiver)([](auto v) { v.get(); });
  static_assert(mi::Receiver<decltype(out4)>, "out4 not a receiver");
  auto out5 = pushmi::MAKE(receiver)(
      pushmi::on_value([](auto v) { v.get(); }, [](int) {}),
      pushmi::on_error(
        [](std::exception_ptr) noexcept {},
        [](auto e)noexcept { e.get(); }
      ));
  static_assert(mi::Receiver<decltype(out5)>, "out5 not a receiver");
  auto out6 = pushmi::MAKE(receiver)(
      pushmi::on_error(
        [](std::exception_ptr) noexcept {},
        [](auto e) noexcept { e.get(); }
      ));
  static_assert(mi::Receiver<decltype(out6)>, "out6 not a receiver");
  auto out7 = pushmi::MAKE(receiver)(
      pushmi::on_done([]() {  }));
  static_assert(mi::Receiver<decltype(out7)>, "out7 not a receiver");

  using Out0 = decltype(out0);

  auto proxy0 = pushmi::MAKE(receiver)(out0);
  static_assert(mi::Receiver<decltype(proxy0)>, "proxy0 not a receiver");
  auto proxy1 = pushmi::MAKE(receiver)(out0, pushmi::passDVF{});
  static_assert(mi::Receiver<decltype(proxy1)>, "proxy1 not a receiver");
  auto proxy2 = pushmi::MAKE(receiver)(out0, pushmi::passDVF{}, pushmi::on_error(pushmi::passDEF{}));
  static_assert(mi::Receiver<decltype(proxy2)>, "proxy2 not a receiver");
  auto proxy3 = pushmi::MAKE(receiver)(
      out0, pushmi::passDVF{}, pushmi::passDEF{}, pushmi::passDDF{});
  static_assert(mi::Receiver<decltype(proxy3)>, "proxy3 not a receiver");
  auto proxy4 = pushmi::MAKE(receiver)(out0, [](auto d, auto v) {
    pushmi::set_value(d, v.get());
  });
  static_assert(mi::Receiver<decltype(proxy4)>, "proxy4 not a receiver");
  auto proxy5 = pushmi::MAKE(receiver)(
      out0,
      pushmi::on_value([](Out0&, auto v) { v.get(); }, [](Out0&, int) {}),
      pushmi::on_error(
        [](Out0&, std::exception_ptr) noexcept {},
        [](Out0&, auto e) noexcept { e.get(); }
      ));
  static_assert(mi::Receiver<decltype(proxy5)>, "proxy5 not a receiver");
  auto proxy6 = pushmi::MAKE(receiver)(
      out0,
      pushmi::on_error(
        [](Out0&, std::exception_ptr) noexcept {},
        [](Out0&, auto e) noexcept { e.get(); }
      ));
  static_assert(mi::Receiver<decltype(proxy6)>, "proxy6 not a receiver");
  auto proxy7 = pushmi::MAKE(receiver)(
      out0,
      pushmi::on_done([](Out0&) { }));
  static_assert(mi::Receiver<decltype(proxy7)>, "proxy7 not a receiver");

  std::promise<int> p0;
  auto promise0 = pushmi::MAKE(receiver)(std::move(p0));
  promise0.value(0);

  std::promise<int> p1;

  auto any0 = pushmi::any_receiver<std::exception_ptr, int>(std::move(p1));
  auto any1 = pushmi::any_receiver<std::exception_ptr, int>(std::move(promise0));
  auto any2 = pushmi::any_receiver<std::exception_ptr, int>(out0);
  auto any3 = pushmi::any_receiver<std::exception_ptr, int>(proxy0);
}

void receiver_n_test() {
  auto out0 = pushmi::MAKE(receiver)();
  static_assert(mi::Receiver<decltype(out0)>, "out0 not a receiver");
  auto out1 = pushmi::MAKE(receiver)(pushmi::ignoreNF{});
  static_assert(mi::Receiver<decltype(out1)>, "out1 not a receiver");
  auto out2 = pushmi::MAKE(receiver)(pushmi::ignoreNF{}, pushmi::abortEF{});
  static_assert(mi::Receiver<decltype(out2)>, "out2 not a receiver");
  auto out3 =
      pushmi::MAKE(receiver)(pushmi::ignoreNF{}, pushmi::abortEF{}, pushmi::ignoreDF{});
  static_assert(mi::Receiver<decltype(out3)>, "out3 not a receiver");
  auto out4 = pushmi::MAKE(receiver)([](auto v) { v.get(); });
  static_assert(mi::Receiver<decltype(out4)>, "out4 not a receiver");
  auto out5 = pushmi::MAKE(receiver)(
      pushmi::on_value([](auto v) { v.get(); }, [](int) {}),
      pushmi::on_error(
        [](std::exception_ptr) noexcept {},
        [](auto e)noexcept { e.get(); }
      ));
  static_assert(mi::Receiver<decltype(out5)>, "out5 not a receiver");
  auto out6 = pushmi::MAKE(receiver)(
      pushmi::on_error(
        [](std::exception_ptr) noexcept {},
        [](auto e) noexcept { e.get(); }
      ));
  static_assert(mi::Receiver<decltype(out6)>, "out6 not a receiver");
  auto out7 = pushmi::MAKE(receiver)(
      pushmi::on_done([]() {  }));
  static_assert(mi::Receiver<decltype(out7)>, "out7 not a receiver");

  using Out0 = decltype(out0);

  auto proxy0 = pushmi::MAKE(receiver)(out0);
  static_assert(mi::Receiver<decltype(proxy0)>, "proxy0 not a receiver");
  auto proxy1 = pushmi::MAKE(receiver)(out0, pushmi::passDVF{});
  static_assert(mi::Receiver<decltype(proxy1)>, "proxy1 not a receiver");
  auto proxy2 = pushmi::MAKE(receiver)(out0, pushmi::passDVF{}, pushmi::on_error(pushmi::passDEF{}));
  static_assert(mi::Receiver<decltype(proxy2)>, "proxy2 not a receiver");
  auto proxy3 = pushmi::MAKE(receiver)(
      out0, pushmi::passDVF{}, pushmi::passDEF{}, pushmi::passDDF{});
  static_assert(mi::Receiver<decltype(proxy3)>, "proxy3 not a receiver");
  auto proxy4 = pushmi::MAKE(receiver)(out0, [](auto d, auto v) {
    pushmi::set_value(d, v.get());
  });
  static_assert(mi::Receiver<decltype(proxy4)>, "proxy4 not a receiver");
  auto proxy5 = pushmi::MAKE(receiver)(
      out0,
      pushmi::on_value([](Out0&, auto v) { v.get(); }, [](Out0&, int) {}),
      pushmi::on_error(
        [](Out0&, std::exception_ptr) noexcept {},
        [](Out0&, auto e) noexcept { e.get(); }
      ));
  static_assert(mi::Receiver<decltype(proxy5)>, "proxy5 not a receiver");
  auto proxy6 = pushmi::MAKE(receiver)(
      out0,
      pushmi::on_error(
        [](Out0&, std::exception_ptr) noexcept {},
        [](Out0&, auto e) noexcept { e.get(); }
      ));
  static_assert(mi::Receiver<decltype(proxy6)>, "proxy6 not a receiver");
  auto proxy7 = pushmi::MAKE(receiver)(
      out0,
      pushmi::on_done([](Out0&) { }));
  static_assert(mi::Receiver<decltype(proxy7)>, "proxy7 not a receiver");

  auto any0 = pushmi::any_receiver<std::exception_ptr, int>(out0);
  auto any1 = pushmi::any_receiver<std::exception_ptr, int>(proxy0);
}

void single_sender_test(){
  auto in0 = pushmi::MAKE(single_sender)();
  static_assert(mi::Sender<decltype(in0)>, "in0 not a sender");
  auto in1 = pushmi::MAKE(single_sender)(pushmi::ignoreSF{});
  static_assert(mi::Sender<decltype(in1)>, "in1 not a sender");
  auto in2 = pushmi::MAKE(single_sender)(pushmi::ignoreSF{}, pushmi::trampolineEXF{});
  static_assert(mi::Sender<decltype(in2)>, "in2 not a sender");
  auto in3 = pushmi::MAKE(single_sender)([&](auto out){
    in0.submit(pushmi::MAKE(receiver)(std::move(out),
      pushmi::on_value([](auto d, int v){ pushmi::set_value(d, v); })
    ));
  }, [](){ return pushmi::trampoline(); });
  static_assert(mi::Sender<decltype(in3)>, "in3 not a sender");

  std::promise<int> p0;
  auto promise0 = pushmi::MAKE(receiver)(std::move(p0));
  in0 | ep::submit(std::move(promise0));

  auto out0 = pushmi::MAKE(receiver)();
  auto out1 = pushmi::MAKE(receiver)(out0, pushmi::on_value([](auto d, int v){
    pushmi::set_value(d, v);
  }));
  in3.submit(out1);

  auto any0 = pushmi::any_single_sender<std::exception_ptr, int>(in0);

  static_assert(pushmi::Executor<pushmi::executor_t<decltype(in0)>>, "sender has invalid executor");
}

void many_sender_test(){
  auto in0 = pushmi::MAKE(many_sender)();
  static_assert(mi::Sender<decltype(in0)>, "in0 not a sender");
  auto in1 = pushmi::MAKE(many_sender)(pushmi::ignoreSF{});
  static_assert(mi::Sender<decltype(in1)>, "in1 not a sender");
  auto in2 = pushmi::MAKE(many_sender)(pushmi::ignoreSF{}, pushmi::trampolineEXF{});
  static_assert(mi::Sender<decltype(in2)>, "in2 not a sender");
  auto in3 = pushmi::MAKE(many_sender)([&](auto out){
    in0.submit(pushmi::MAKE(receiver)(std::move(out),
      pushmi::on_value([](auto d, int v){ pushmi::set_value(d, v); })
    ));
  }, [](){ return pushmi::trampoline(); });
  static_assert(mi::Sender<decltype(in3)>, "in3 not a sender");

  auto out0 = pushmi::MAKE(receiver)();
  auto out1 = pushmi::MAKE(receiver)(out0, pushmi::on_value([](auto d, int v){
    pushmi::set_value(d, v);
  }));
  in3.submit(out1);

  auto any0 = pushmi::any_many_sender<std::exception_ptr, int>(in0);

  static_assert(pushmi::Executor<pushmi::executor_t<decltype(in0)>>, "sender has invalid executor");
}

void constrained_single_sender_test(){
  auto in0 = pushmi::MAKE(constrained_single_sender)();
  static_assert(mi::Sender<decltype(in0)>, "in0 not a sender");
  auto in1 = pushmi::MAKE(constrained_single_sender)(pushmi::ignoreSF{});
  static_assert(mi::Sender<decltype(in1)>, "in1 not a sender");
  auto in2 = pushmi::MAKE(constrained_single_sender)(pushmi::ignoreSF{}, pushmi::inlineConstrainedEXF{}, pushmi::priorityZeroF{});
  static_assert(mi::Sender<decltype(in2)>, "in2 not a sender");
  auto in3 = pushmi::MAKE(constrained_single_sender)([&](auto c, auto out){
    in0.submit(c, pushmi::MAKE(receiver)(std::move(out),
      pushmi::on_value([](auto d, int v){ pushmi::set_value(d, v); })
    ));
  }, [](){ return pushmi::inline_constrained_executor(); }, [](){ return 0; });
  static_assert(mi::Sender<decltype(in3)>, "in3 not a sender");
  auto in4 = pushmi::MAKE(constrained_single_sender)(pushmi::ignoreSF{}, pushmi::inlineConstrainedEXF{});
  static_assert(mi::Sender<decltype(in4)>, "in4 not a sender");

  std::promise<int> p0;
  auto promise0 = pushmi::MAKE(receiver)(std::move(p0));
  in0.submit(in0.top(), std::move(promise0));

  auto out0 = pushmi::MAKE(receiver)();
  auto out1 = pushmi::MAKE(receiver)(out0, pushmi::on_value([](auto d, int v){
    pushmi::set_value(d, v);
  }));
  in3.submit(in0.top(), out1);

  auto any0 = pushmi::any_constrained_single_sender<std::exception_ptr, std::ptrdiff_t, int>(in0);

  static_assert(pushmi::Executor<pushmi::executor_t<decltype(in0)>>, "sender has invalid executor");

  in3 | op::submit();
  in3 | op::blocking_submit();
}

void time_single_sender_test(){
  auto in0 = pushmi::MAKE(time_single_sender)();
  static_assert(mi::Sender<decltype(in0)>, "in0 not a sender");
  auto in1 = pushmi::MAKE(time_single_sender)(pushmi::ignoreSF{});
  static_assert(mi::Sender<decltype(in1)>, "in1 not a sender");
  auto in2 = pushmi::MAKE(time_single_sender)(pushmi::ignoreSF{}, pushmi::inlineTimeEXF{}, pushmi::systemNowF{});
  static_assert(mi::Sender<decltype(in2)>, "in2 not a sender");
  auto in3 = pushmi::MAKE(time_single_sender)([&](auto tp, auto out){
    in0.submit(tp, pushmi::MAKE(receiver)(std::move(out),
      pushmi::on_value([](auto d, int v){ pushmi::set_value(d, v); })
    ));
  }, [](){ return pushmi::inline_time_executor(); }, [](){ return std::chrono::system_clock::now(); });
  static_assert(mi::Sender<decltype(in3)>, "in3 not a sender");
  auto in4 = pushmi::MAKE(time_single_sender)(pushmi::ignoreSF{}, pushmi::inlineTimeEXF{});
  static_assert(mi::Sender<decltype(in4)>, "in4 not a sender");

  std::promise<int> p0;
  auto promise0 = pushmi::MAKE(receiver)(std::move(p0));
  in0.submit(in0.top(), std::move(promise0));

  auto out0 = pushmi::MAKE(receiver)();
  auto out1 = pushmi::MAKE(receiver)(out0, pushmi::on_value([](auto d, int v){
    pushmi::set_value(d, v);
  }));
  in3.submit(in0.top(), out1);

  auto any0 = pushmi::any_time_single_sender<std::exception_ptr, std::chrono::system_clock::time_point, int>(in0);

  static_assert(pushmi::Executor<pushmi::executor_t<decltype(in0)>>, "sender has invalid executor");

  in3 | op::submit();
  in3 | op::blocking_submit();
  in3 | op::submit_at(in3.top() + 1s);
  in3 | op::submit_after(1s);
}

void flow_receiver_1_test() {
  auto out0 = pushmi::MAKE(flow_receiver)();
  static_assert(mi::Receiver<decltype(out0)>, "out0 not a receiver");
  auto out1 = pushmi::MAKE(flow_receiver)(pushmi::ignoreVF{});
  static_assert(mi::Receiver<decltype(out1)>, "out1 not a receiver");
  auto out2 = pushmi::MAKE(flow_receiver)(pushmi::ignoreVF{}, pushmi::abortEF{});
  static_assert(mi::Receiver<decltype(out2)>, "out2 not a receiver");
  auto out3 =
      pushmi::MAKE(flow_receiver)(
        pushmi::ignoreVF{},
        pushmi::abortEF{},
        pushmi::ignoreDF{});
  static_assert(mi::Receiver<decltype(out3)>, "out3 not a receiver");
  auto out4 = pushmi::MAKE(flow_receiver)([](auto v) { v.get(); });
  static_assert(mi::Receiver<decltype(out4)>, "out4 not a receiver");
  auto out5 = pushmi::MAKE(flow_receiver)(
      pushmi::on_value([](auto v) { v.get(); }, [](int) {}),
      pushmi::on_error(
        [](std::exception_ptr) noexcept{},
        [](auto e) noexcept { e.get(); }
      ));
  static_assert(mi::Receiver<decltype(out5)>, "out5 not a receiver");
  auto out6 = pushmi::MAKE(flow_receiver)(
      pushmi::on_error(
        [](std::exception_ptr) noexcept {},
        [](auto e) noexcept{ e.get(); }
      ));
  static_assert(mi::Receiver<decltype(out6)>, "out6 not a receiver");
  auto out7 = pushmi::MAKE(flow_receiver)(
      pushmi::on_done([]() {  }));
  static_assert(mi::Receiver<decltype(out7)>, "out7 not a receiver");

  auto out8 =
      pushmi::MAKE(flow_receiver)(
        pushmi::ignoreVF{},
        pushmi::abortEF{},
        pushmi::ignoreDF{},
        pushmi::ignoreStrtF{});
  static_assert(mi::Receiver<decltype(out8)>, "out8 not a receiver");

  using Out0 = decltype(out0);

  auto proxy0 = pushmi::MAKE(flow_receiver)(out0);
  static_assert(mi::Receiver<decltype(proxy0)>, "proxy0 not a receiver");
  auto proxy1 = pushmi::MAKE(flow_receiver)(out0, pushmi::passDVF{});
  static_assert(mi::Receiver<decltype(proxy1)>, "proxy1 not a receiver");
  auto proxy2 = pushmi::MAKE(flow_receiver)(out0, pushmi::passDVF{}, pushmi::passDEF{});
  static_assert(mi::Receiver<decltype(proxy2)>, "proxy2 not a receiver");
  auto proxy3 = pushmi::MAKE(flow_receiver)(
      out0, pushmi::passDVF{}, pushmi::passDEF{}, pushmi::passDDF{});
  static_assert(mi::Receiver<decltype(proxy3)>, "proxy3 not a receiver");
  auto proxy4 = pushmi::MAKE(flow_receiver)(out0, [](auto d, auto v) {
    pushmi::set_value(d, v.get());
  });
  static_assert(mi::Receiver<decltype(proxy4)>, "proxy4 not a receiver");
  auto proxy5 = pushmi::MAKE(flow_receiver)(
      out0,
      pushmi::on_value([](Out0&, auto v) { v.get(); }, [](Out0&, int) {}),
      pushmi::on_error(
        [](Out0&, std::exception_ptr) noexcept {},
        [](Out0&, auto e) noexcept { e.get(); }
      ));
  static_assert(mi::Receiver<decltype(proxy5)>, "proxy5 not a receiver");
  auto proxy6 = pushmi::MAKE(flow_receiver)(
      out0,
      pushmi::on_error(
        [](Out0&, std::exception_ptr) noexcept {},
        [](Out0&, auto e) noexcept { e.get(); }
      ));
  static_assert(mi::Receiver<decltype(proxy6)>, "proxy6 not a receiver");
  auto proxy7 = pushmi::MAKE(flow_receiver)(
      out0,
      pushmi::on_done([](Out0&) { }));
  static_assert(mi::Receiver<decltype(proxy7)>, "proxy7 not a receiver");

  auto proxy8 = pushmi::MAKE(flow_receiver)(out0,
    pushmi::passDVF{},
    pushmi::passDEF{},
    pushmi::passDDF{});
  static_assert(mi::Receiver<decltype(proxy8)>, "proxy8 not a receiver");

  auto any2 = pushmi::any_flow_receiver<std::exception_ptr, std::ptrdiff_t, std::exception_ptr, int>(out0);
  auto any3 = pushmi::any_flow_receiver<std::exception_ptr, std::ptrdiff_t, std::exception_ptr, int>(proxy0);
}

void flow_receiver_n_test() {
  auto out0 = pushmi::MAKE(flow_receiver)();
  static_assert(mi::Receiver<decltype(out0)>, "out0 not a receiver");
  auto out1 = pushmi::MAKE(flow_receiver)(pushmi::ignoreVF{});
  static_assert(mi::Receiver<decltype(out1)>, "out1 not a receiver");
  auto out2 = pushmi::MAKE(flow_receiver)(pushmi::ignoreVF{}, pushmi::abortEF{});
  static_assert(mi::Receiver<decltype(out2)>, "out2 not a receiver");
  auto out3 =
      pushmi::MAKE(flow_receiver)(
        pushmi::ignoreVF{},
        pushmi::abortEF{},
        pushmi::ignoreDF{});
  static_assert(mi::Receiver<decltype(out3)>, "out3 not a receiver");
  auto out4 = pushmi::MAKE(flow_receiver)([](auto v) { v.get(); });
  static_assert(mi::Receiver<decltype(out4)>, "out4 not a receiver");
  auto out5 = pushmi::MAKE(flow_receiver)(
      pushmi::on_value([](auto v) { v.get(); }, [](int) {}),
      pushmi::on_error(
        [](std::exception_ptr) noexcept{},
        [](auto e) noexcept { e.get(); }
      ));
  static_assert(mi::Receiver<decltype(out5)>, "out5 not a receiver");
  auto out6 = pushmi::MAKE(flow_receiver)(
      pushmi::on_error(
        [](std::exception_ptr) noexcept {},
        [](auto e) noexcept{ e.get(); }
      ));
  static_assert(mi::Receiver<decltype(out6)>, "out6 not a receiver");
  auto out7 = pushmi::MAKE(flow_receiver)(
      pushmi::on_done([]() {  }));
  static_assert(mi::Receiver<decltype(out7)>, "out7 not a receiver");

  auto out8 =
      pushmi::MAKE(flow_receiver)(
        pushmi::ignoreVF{},
        pushmi::abortEF{},
        pushmi::ignoreDF{},
        pushmi::ignoreStrtF{});
  static_assert(mi::Receiver<decltype(out8)>, "out8 not a receiver");

  using Out0 = decltype(out0);

  auto proxy0 = pushmi::MAKE(flow_receiver)(out0);
  static_assert(mi::Receiver<decltype(proxy0)>, "proxy0 not a receiver");
  auto proxy1 = pushmi::MAKE(flow_receiver)(out0, pushmi::passDVF{});
  static_assert(mi::Receiver<decltype(proxy1)>, "proxy1 not a receiver");
  auto proxy2 = pushmi::MAKE(flow_receiver)(out0, pushmi::passDVF{}, pushmi::passDEF{});
  static_assert(mi::Receiver<decltype(proxy2)>, "proxy2 not a receiver");
  auto proxy3 = pushmi::MAKE(flow_receiver)(
      out0, pushmi::passDVF{}, pushmi::passDEF{}, pushmi::passDDF{});
  static_assert(mi::Receiver<decltype(proxy3)>, "proxy3 not a receiver");
  auto proxy4 = pushmi::MAKE(flow_receiver)(out0, [](auto d, auto v) {
    pushmi::set_value(d, v.get());
  });
  static_assert(mi::Receiver<decltype(proxy4)>, "proxy4 not a receiver");
  auto proxy5 = pushmi::MAKE(flow_receiver)(
      out0,
      pushmi::on_value([](Out0&, auto v) { v.get(); }, [](Out0&, int) {}),
      pushmi::on_error(
        [](Out0&, std::exception_ptr) noexcept {},
        [](Out0&, auto e) noexcept { e.get(); }
      ));
  static_assert(mi::Receiver<decltype(proxy5)>, "proxy5 not a receiver");
  auto proxy6 = pushmi::MAKE(flow_receiver)(
      out0,
      pushmi::on_error(
        [](Out0&, std::exception_ptr) noexcept {},
        [](Out0&, auto e) noexcept { e.get(); }
      ));
  static_assert(mi::Receiver<decltype(proxy6)>, "proxy6 not a receiver");
  auto proxy7 = pushmi::MAKE(flow_receiver)(
      out0,
      pushmi::on_done([](Out0&) { }));
  static_assert(mi::Receiver<decltype(proxy7)>, "proxy7 not a receiver");

  auto proxy8 = pushmi::MAKE(flow_receiver)(out0,
    pushmi::passDVF{},
    pushmi::passDEF{},
    pushmi::passDDF{});
  static_assert(mi::Receiver<decltype(proxy8)>, "proxy8 not a receiver");

  auto any2 = pushmi::any_flow_receiver<std::exception_ptr, std::ptrdiff_t, std::exception_ptr, int>(out0);
  auto any3 = pushmi::any_flow_receiver<std::exception_ptr, std::ptrdiff_t, std::exception_ptr, int>(proxy0);
}

void flow_single_sender_test(){
  auto in0 = pushmi::MAKE(flow_single_sender)();
  static_assert(mi::Sender<decltype(in0)>, "in0 not a sender");
  auto in1 = pushmi::MAKE(flow_single_sender)(pushmi::ignoreSF{});
  static_assert(mi::Sender<decltype(in1)>, "in1 not a sender");
  auto in2 = pushmi::MAKE(flow_single_sender)(pushmi::ignoreSF{}, pushmi::trampolineEXF{});
  static_assert(mi::Sender<decltype(in2)>, "in2 not a sender");
  auto in3 = pushmi::MAKE(flow_single_sender)([&](auto out){
    in0.submit(pushmi::MAKE(flow_receiver)(std::move(out),
      pushmi::on_value([](auto d, int v){ pushmi::set_value(d, v); })
    ));
  }, [](){ return pushmi::trampoline(); });
  static_assert(mi::Sender<decltype(in3)>, "in3 not a sender");

  auto out0 = pushmi::MAKE(flow_receiver)();
  auto out1 = pushmi::MAKE(flow_receiver)(out0, pushmi::on_value([](auto d, int v){
    pushmi::set_value(d, v);
  }));
  in3.submit(out1);

  auto any0 = pushmi::any_flow_single_sender<std::exception_ptr, std::exception_ptr, int>(in0);

  static_assert(pushmi::Executor<pushmi::executor_t<decltype(in0)>>, "sender has invalid executor");
}

void flow_many_sender_test(){
  auto in0 = pushmi::MAKE(flow_many_sender)();
  static_assert(mi::Sender<decltype(in0)>, "in0 not a sender");
  auto in1 = pushmi::MAKE(flow_many_sender)(pushmi::ignoreSF{});
  static_assert(mi::Sender<decltype(in1)>, "in1 not a sender");
  auto in2 = pushmi::MAKE(flow_many_sender)(pushmi::ignoreSF{}, pushmi::trampolineEXF{});
  static_assert(mi::Sender<decltype(in2)>, "in2 not a sender");
  auto in3 = pushmi::MAKE(flow_many_sender)([&](auto out){
    in0.submit(pushmi::MAKE(flow_receiver)(std::move(out),
      pushmi::on_value([](auto d, int v){ pushmi::set_value(d, v); })
    ));
  }, [](){ return pushmi::trampoline(); });
  static_assert(mi::Sender<decltype(in3)>, "in3 not a sender");

  auto out0 = pushmi::MAKE(flow_receiver)();
  auto out1 = pushmi::MAKE(flow_receiver)(out0, pushmi::on_value([](auto d, int v){
    pushmi::set_value(d, v);
  }));
  in3.submit(out1);

  auto any0 = pushmi::any_flow_many_sender<std::exception_ptr, std::ptrdiff_t, std::exception_ptr, int>(in0);

  static_assert(pushmi::Executor<pushmi::executor_t<decltype(in0)>>, "sender has invalid executor");
}
