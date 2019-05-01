# Pushmi
## pushing values around

This library is counterpart to [P1055 - *A Modest Executor Proposal*](http://wg21.link/p1055r0).

*pushmi* is a header-only library that uses git submodules for dependencies (`git clone --recursive`), uses CMake to build, requires compliant C++14 compiler to build and has dependencies on meta and catch2 and some other libraries for testing and examples.

[![godbolt](https://img.shields.io/badge/godbolt-master-brightgreen.svg?style=flat-square)](https://godbolt.org/z/vCUK0M)

*pushmi* is an implementation for prototyping how Futures, Executors can be defined with shared Concepts. These Concepts can be implemented over and over again to solve different problems and make different tradeoffs. User implementations of the Concepts are first-class citizens due to the attention to composition. Composition also enables each implementation of the Concepts to focus on one concern and then be composed to build more complex solutions.

## Build status
Travis-CI: [![Travis Build Status](https://travis-ci.org/facebookresearch/pushmi.svg?branch=master)](https://travis-ci.org/facebookresearch/pushmi)

## Callbacks

*Callbacks* are very familiar though they take many forms. It is precisely the multiplicity of forms that make Callbacks difficult to compose.

A minimal callback might be passed some state. The state might include an error or might only be a result code. Maybe this is delivered as one parameter, or as many parameters. Maybe the Callback is called once, or many or even zero times.

*Promises* provide a stable contract for Callbacks of a single result or error.

## `std::promise<>`

The interface for `std::promise<void>` is fairly straightforward.

```cpp
struct promise<void> {
  void set_value();
  void set_exception(std::exception_ptr);

  future<void> get_future();
};
```

usage is also simple, but a bit convoluted (the promise produces the future, has the result set_ function called, and only then is future::get called to get the result).

```cpp
std::promise<void> p;
auto f = p.get_future();
p.set_value();
// or
// p.set_exception(std::exception_ptr{});
f.get();
```

it is this convolution that creates the race between the producer and consumer that requires expensive internal state to resolve.

## `receiver`

The `receiver` type in the library provides simple ways to construct new implementations of the Receiver concept.

construct a sink type that accepts any value or error type (and aborts on error)

```cpp
receiver<> s;
```

construct new type using one or more lambdas, or with designated initializers, use multiple lambdas to build overload sets

```cpp
// provide done
auto s0 = receiver{on_done{[](){}}};

// provide value
auto s1 = receiver{[](auto v){}};
auto s2 = receiver{on_value{[](int){}, [](auto v){}}};

// these are quite dangerous as they suppress errors

// provide error
auto s3 = receiver{[](auto v){}, [](std::exception_ptr){}, [](){}};
auto s4 = receiver{on_error{[](std::exception_ptr){}}, on_done{[](){}}};
auto s5 = receiver{on_error{[](std::exception_ptr){}, [](auto){}}};
auto s6 = receiver{on_error{[](std::exception_ptr){}}};

```

construct a new type with shared state across the lambdas. very useful for building a filter on top of an existing receiver. The state must be a Receiver, but can be a super-set with additional state for this filter.

```cpp
auto s0 = receiver{receiver{}};

auto s1 = receiver{receiver{}, on_done{
    [](receiver<>& out, std::exception_ptr ep){out | set_done();}}};

auto s2 = receiver{receiver{},
  [](receiver<>& out, auto v){out | set_value(v);};
auto s3 = receiver{receiver{}, on_value{
  [](receiver<>& out, int v){out | set_value(v);},
  [](receiver<>& out, auto v){out | set_value(v);}}};

// these are quite dangerous as they suppress errors
auto s4 = receiver{receiver{},
  [](){}
  [](receiver<>& out, std::exception_ptr ep){out | set_done();},
  [](receiver<>&){out | set_done();}};
auto s5 = receiver{receiver{}, on_error{
  [](receiver<>& out, std::exception_ptr ep){out | set_done();},
  [](receiver<>& out, auto e){out | set_done();}}};

```

construct a type-erased type for a particular T & E (each of which could be a std::variant of supported types). I have a plan to provide operators to collapse values and errors to variant or tuple and then expand from variant or tuple back to their constituent values/errors.

```cpp
auto s0 = any_receiver<std::exception_ptr, int>{receiver{}};
auto s1 = any_receiver<std::exception_ptr, int>{receiver{}};
```

## `single_sender`

The `single_sender` type in the library provides simple ways to construct new implementations of the SingleSender concept.

construct a producer of nothing, aka `never()`

```cpp
single_sender<> sd;
```

construct new type using one or more lambdas, or with designated initializers, use multiple lambdas to build overload sets

```cpp
auto sd0 = single_sender{on_submit{[](auto out){}}};
auto sd1 = single_sender{[](auto out){}};
auto sd2 = single_sender{on_submit{[](receiver<> out){}, [](auto out){}}};

```

construct a new type with shared state across the lambdas. very useful for building a filter on top of an existing single_sender. The state must be a SingleSender, but can be a super-set with additional state for this filter.

```cpp
auto sd0 = single_sender{single_sender{}};

auto sd1 = single_sender{single_sender{}, on_submit{
    [](single_sender<>& in, auto out){in | submit(out);}}};

auto sd2 = single_sender{single_sender{},
    [](single_sender<>& in, auto out){in | submit(out);}};

```

construct a type-erased type for a particular T & E (which could be a std::variant of supported types). I have a plan to provide operators to collapse values and errors to variant or tuple and then expand from variant or tuple back to their constituent values/errors.

```cpp
auto sd0 = any_single_sender<std::exception_ptr, int>{single_sender{}};
auto sd1 = any_single_sender<std::exception_ptr, int>{single_sender{}};
```

## `time_single_sender`

The `time_single_sender` type in the library provides simple ways to construct new implementations of the TimeSingleSender concept.

construct a producer of nothing, aka `never()`

```cpp
time_single_sender<> tsd;
```

construct new type using one or more lambdas, or with designated initializers, use multiple lambdas to build overload sets

```cpp
auto tsd0 = time_single_sender{on_submit{[](auto at, auto out){}}};
auto tsd1 = time_single_sender{[](auto at, auto out){}};
auto tsd2 = time_single_sender{on_submit{[](auto at, receiver<> out){}, [](auto at, auto out){}}};

```

construct a new type with shared state across the lambdas. very useful for building a filter on top of an existing time_single_sender. The state must be a SingleSender, but can be a super-set with additional state for this filter.

```cpp
auto tsd0 = time_single_sender{single_sender{}};

auto tsd1 = time_single_sender{single_sender{}, on_submit{
    [](time_single_sender<>& in, auto at, auto out){in | submit(at, out);}}};

auto tsd2 = time_single_sender{single_sender{},
    [](time_single_sender<>& in, auto at, auto out){in | submit(at, out);}};

```

construct a type-erased type for a particular T & E (which could be a std::variant of supported types). I have a plan to provide operators to collapse values and errors to variant or tuple and then expand from variant or tuple back to their constituent values/errors.

```cpp
auto tsd0 = any_time_single_sender<std::exception_ptr, std::system_clock::time_point, int>{time_single_sender{}};
auto tsd1 = any_time_single_sender<std::exception_ptr, std::system_clock::time_point, int>{time_single_sender{}};
```

## put it all together with some algorithms

[![godbolt](https://img.shields.io/badge/godbolt-master-brightgreen.svg?style=flat-square)](https://godbolt.org/z/vCUK0M)

### Executor

```cpp
auto nt = new_thread();
nt | blocking_submit([](auto nt){
  nt |
    transform([](auto nt){ return 42; }) | submit([](int){}) |
    transform([](int fortyTwo){ return "42"s; }) | submit([](std::string){});
});
```

### Single

```cpp
auto fortyTwo = just(42) |
  transform([](auto v){ return std::to_string(v); }) |
  on(new_thread) |
  via(new_thread) |
  get<std::string>;

just(42) |
    transform([](auto v){ return std::to_string(v); }) |
    on(new_thread) |
    via(new_thread) |
    blocking_submit([](std::string){});
```

### Many

[![godbolt](https://img.shields.io/badge/godbolt-master-brightgreen.svg?style=flat-square)](https://godbolt.org/z/woVAi9)

```cpp
auto values = std::array<int, 5>{4, 20, 7, 3, 8};

auto f = op::from(values) |
    op::submit([&](int){});
```

### FlowMany

[![godbolt](https://img.shields.io/badge/godbolt-master-brightgreen.svg?style=flat-square)](https://godbolt.org/z/woVAi9)

```cpp
auto values = std::array<int, 5>{4, 20, 7, 3, 8};

auto f = op::flow_from(values) |
    op::for_each([&](int){});
```
