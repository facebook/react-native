

# things I learned from std::for_each and std::reduce

I wrote an operator called `bulk()` and implemented for_each and reduce in terms of it. I departed from the `bulk_execute()` signature and tried to model the reduce signature on my `bulk` operator. I am not satisfied with the result and would need to invest more to get an abstraction for bulk that I was confident was minimal and efficient.

# Background 

## bulk_execute

The `bulk_execute()` function is intended to be an abstraction that allows efficient implementation of the parallel std algorithms on both CPU and GPU executors.

```cpp
template<class Function, class SharedFactory>
void bulk_execute(Function&& f, size_t n, SharedFactory&& sf) const;
```

A sequential implementation might look like:

```cpp
template<class Function, class SharedFactory>
void bulk_execute(Function&& f, size_t n, SharedFactory&& sf)
{
  auto state = sf();
  for(size_t idx = 0; idx < n; ++idx) {
      f(state, idx);
  }
}
```

The `Function f` already appears to be similar to the accumulate function passed to reduce. It takes the shared state and the index indicating the current value. The SharedFactory is very similar to the initialValue parameter to reduce. The Shape parameter is very similar to the Range parameter to reduce. These similarities motivated me to modify the signature to more explicitly match the reduce pattern.

## bulk operator

```cpp
template<class F, class ShapeBegin, class ShapeEnd, class Target, class IF, class RS>
auto bulk(
    F&& func,
    ShapeBegin sb,
    ShapeEnd se,
    Target&& driver,
    IF&& initFunc,
    RS&& selector);
```

The `bulk` function packages the parameters and returns an adapter function. 

> A Sender is an object with a `submit()` method

> An Adapter is a function that takes a Sender and returns a Sender. Adapters are used for composition.

When called, the Adapter from `bulk()` will package the Adapter parameter with the original parameters and return a Sender. 

> A Receiver is an object that has methods like `value()`, `error()` and `done()`. A Receiver is like a Promise.

The `submit()` method takes a Receiver. When called, the Sender from the bulk Adapter will create a Receiver with the original parameters to `bulk()` and the Receiver parameter. This new Receiver will be passed to `submit()` on the Sender that the bulk Adapter stored in this bulk Sender.

When called, the `value()` method on the bulk Receiver will pass all the packaged parameters to the Target.

> A Target is a function that orchestrates the bulk operation using the parameters. There would be different Target implementations for device, sequential, concurrent execution patterns.

A Target implementation might look like:

```cpp
template<class IF, class RS, class Input, class F, class ShapeBegin, class ShapeEnd, class Out>
void inline_driver(
    IF init,
    RS selector,
    Input input,
    F&& func,
    ShapeBegin sb,
    ShapeEnd se,
    Out out) {
    try {
        auto acc = init(input);
        for (decltype(sb) idx{sb}; idx != se; ++idx){
            func(acc, idx);
        }
        auto result = selector(std::move(acc));
        mi::set_value(out, std::move(result));
    } catch(...) {
        mi::set_error(out, std::current_exception());
    }
    };
```

> ways to improve bulk: 
>  - merge ShapeBegin and ShapeEnd into a Range.
>  - pass out to selector so that it can deliver an error or a success.
>  - initFunc multiple times to have context local state that does not need locking or CAS loop. 
>  - compose the driver implementations from operators rather than each having a bespoke implementation

# for_each

implementing for_each was straight-forward with the interface.

```cpp
template<class ExecutionPolicy, class RandomAccessIterator, class Function>
void for_each(
  ExecutionPolicy&& policy, 
  RandomAccessIterator begin, 
  RandomAccessIterator end, 
  Function f)
{
  operators::just(0) | 
    operators::bulk(
      [f](auto& acc, auto cursor){ f(*cursor); }, 
      begin,
      end, 
      policy, 
      [](auto&& args){ return args; }, 
      [](auto&& acc){ return 0; }) |
    operators::blocking_submit();
}
```

The oddity is that bulk is expecting a shared state value and a value as input and a value result. Since for_each does not have shared state, this is overhead that becomes obvious and disturbing when looking at the naive concurrent driver in the code (there is a CAS loop around the call to the state update function even though the state is not updated here).

# reduce 

implementing reduce took more effort and some of the code in the drivers and parameters to the driver were modified to get reduce working.

```cpp
template<class ExecutionPolicy, class ForwardIt, class T, class BinaryOp>
T reduce(
  ExecutionPolicy&& policy,
  ForwardIt begin, 
  ForwardIt end, 
  T init, 
  BinaryOp binary_op){
    return operators::just(std::move(init)) | 
      operators::bulk(
        [binary_op](auto& acc, auto cursor){ acc = binary_op(acc, *cursor); }, 
        begin,
        end, 
        policy, 
        [](auto&& args){ return args; }, 
        [](auto&& acc){ return acc; }) |
      operators::get<T>;
    }
```

Based on examples that I have been shown, the existing bulk_execute would expect the bulk_execute caller to provide the synchronization for the shared state. In the case of reduce it is important to synchronize when the execution is concurrent and equally important not to synchronize when it is not concurrent. Using if constexpr to implement reduce with and without sync in the parameters to bulk would add a lot of unsafe bespoke work and complication into every algorithm using bulk. In this bulk design the driver owns synchronization instead. 

> NOTE - in any case, if a high-level async library design requires manual lock or lock-free primitive usage for correct behavior, then the design needs to be changed.

I am dissatisfied with the expected perf results from the naive concurrent driver (expectation from looking at the code, will need to measure). For instance, here is the CAS loop over the accumulator function from the naive concurrent driver:

```cpp
  // this indicates to me that bulk is not the right abstraction
  auto old = std::get<4>(*shared_state).load();
  auto step = old;
  do {
    step = old;
    // func(accumulation, idx)
    std::get<3>(*shared_state)(step, idx);
  } while(!std::get<4>(*shared_state).compare_exchange_strong(old, step));
```

This is due to having a single shared_state being shared concurrently. I would much prefer having multiple states that are never used concurrently and then composing them all into one final result.

> creating factor * hardware_concurrency() number of states would allow user controlled granularity (factor) for work stealing. each state would only be used from one `hardware_concurrency` context and thus would have no synchronization when it was modified.

# static_thread_pool

this bonus section is to mention the bulk_execute implementation in the static_thread_pool. The static thread pool is a cool piece of tech. in the bulk_execute method I had two observations.

 1. every index in the range from 0-N is allocated as a task node
 2. this list of nodes is built locally and then inserted in one lock operation

For #1, I expect that there is a desire to reduce the number of task nodes allocated in bulk.

There are multiple ways to achieve #2 on P1055.

one way to achieve this is to add a type that is an executor but just accumulates a local queue. usage would be similar to..

```cpp
auto pool = thread_pool();

auto e = pool.bulk_executor();
my_bulk_generator(e, . . .); // lots of calls to submit
pool.bulk_enqueue(e);
```

# ExecutionPolicy

In building these algorithms I observed that the parallel std algorithms do not really depend on executor, they depend on ExecutionPolicy. GPU and CPU can have different execution policies and it does not affect the implementation or expression of the parallel algorithms (rather than passing an executor around pass an ExecutionPolicy).
