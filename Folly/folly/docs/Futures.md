# Futures

### Futures is a framework for expressing asynchronous code in C++ using the Promise/Future pattern.

# Overview

Folly Futures is an async C++ framework inspired by [Twitter's Futures](https://twitter.github.io/finagle/guide/Futures.html) implementation in Scala (see also [Future.scala](https://github.com/twitter/util/blob/master/util-core/src/main/scala/com/twitter/util/Future.scala), [Promise.scala](https://github.com/twitter/util/blob/master/util-core/src/main/scala/com/twitter/util/Promise.scala), and friends), and loosely builds upon the existing but anemic Futures code found in the C++11 standard ([std::future](http://en.cppreference.com/w/cpp/thread/future)) and [boost::future](http://www.boost.org/doc/libs/1_53_0/doc/html/thread/synchronization.html#thread.synchronization.futures) (especially >= 1.53.0). Although inspired by the C++11 std::future interface, it is not a drop-in replacement because some ideas don't translate well enough to maintain API compatibility.

The primary difference from std::future is that you can attach callbacks to Futures (with `thenValue` or `thenTry`), under the control of an executor to manage where work runs, which enables sequential and parallel composition of Futures for cleaner asynchronous code.

# Brief Synopsis

```
#include <folly/futures/Future.h>
#include <folly/executors/ThreadedExecutor.h>
using namespace folly;
using namespace std;

void foo(int x) {
  // do something with x
  cout << "foo(" << x << ")" << endl;
}

// ...
  folly::ThreadedExecutor executor;
  cout << "making Promise" << endl;
  Promise<int> p;
  Future<int> f = p.getSemiFuture().via(&executor);
  auto f2 = move(f).thenValue(foo);
  cout << "Future chain made" << endl;

// ... now perhaps in another event callback

  cout << "fulfilling Promise" << endl;
  p.setValue(42);
  move(f2).get();
  cout << "Promise fulfilled" << endl;
```

This would print:

```
making Promise
Future chain made
fulfilling Promise
foo(42)
Promise fulfilled
```

## Blog Post

In addition to this document, there is [a blog post on code.facebook.com (June
2015)](https://code.facebook.com/posts/1661982097368498/futures-for-c-11-at-facebook/).

# Brief guide
This brief guide covers the basics. For a more in-depth coverage skip to the appropriate section.

Let's begin with an example using an imaginary simplified Memcache client interface:

```
using std::string;
class MemcacheClient {
 public:
  struct GetReply {
    enum class Result {
      FOUND,
      NOT_FOUND,
      SERVER_ERROR,
    };

    Result result;
    // The value when result is FOUND,
    // The error message when result is SERVER_ERROR or CLIENT_ERROR
    // undefined otherwise
    string value;
  };

  GetReply get(string key);
};
```

This API is synchronous, i.e. when you call `get()` you have to wait for the result. This is very simple, but unfortunately it is also very easy to write very slow code using synchronous APIs.

Now, consider this traditional asynchronous signature for the same operation:

```
int async_get(string key, std::function<void(GetReply)> callback);
```

When you call `async_get()`, your asynchronous operation begins and when it finishes your callback will be called with the result. Very performant code can be written with an API like this, but for nontrivial applications the code devolves into a special kind of spaghetti code affectionately referred to as "callback hell".

The Future-based API looks like this:

```
SemiFuture<GetReply> future_get(string key);
```

A `SemiFuture<GetReply>` or `Future<GetReply>` is a placeholder for the `GetReply` that we will eventually get. For most of the descriptive text below, Future can refer to either `folly::SemiFuture` or `folly::Future` as the former is a safe subset of the latter. A Future usually starts life out "unfulfilled", or incomplete, i.e.:

```
fut.isReady() == false
fut.value()  // will throw an exception because the Future is not ready
```

At some point in the future, the `Future` will have been fulfilled, and we can access its value.

```
fut.isReady() == true
GetReply& reply = fut.value();
```

Futures support exceptions. If the asynchronous producer fails with an exception, your Future may represent an exception instead of a value. In that case:

```
fut.isReady() == true
fut.value() // will rethrow the exception
```

Just what is exceptional depends on the API. In our example we have chosen not to raise exceptions for `SERVER_ERROR`, but represent this explicitly in the `GetReply` object. On the other hand, an astute Memcache veteran would notice that we left `CLIENT_ERROR` out of `GetReply::Result`, and perhaps a `CLIENT_ERROR` would have been raised as an exception, because `CLIENT_ERROR` means there's a bug in the library and this would be truly exceptional. These decisions are judgement calls by the API designer. The important thing is that exceptional conditions (including and especially spurious exceptions that nobody expects) get captured and can be handled higher up the "stack".

So far we have described a way to initiate an asynchronous operation via an API that returns a Future, and then sometime later after it is fulfilled, we get its value. This is slightly more useful than a synchronous API, but it's not yet ideal. There are two more very important pieces to the puzzle.

First, we can aggregate Futures, to define a new Future that completes after some or all of the aggregated Futures complete. Consider two examples: fetching a batch of requests and waiting for all of them, and fetching a group of requests and waiting for only one of them.

```
MemcacheClient mc;

vector<SemiFuture<GetReply>> futs;
for (auto& key : keys) {
  futs.push_back(mc.future_get(key));
}
auto all = collectAll(futs.begin(), futs.end());

vector<SemiFuture<GetReply>> futs;
for (auto& key : keys) {
  futs.push_back(mc.future_get(key));
}
auto any = collectAny(futs.begin(), futs.end());
```

`all` and `any` are Futures (for the exact type and usage see the header files). They will be complete when all/one of futs are complete, respectively. (There is also `collectN()` for when you need some.)

Second, we can associate a Future with an executor. An executor specifies where work will run, and we detail this more later. In summary, given an executor we can convert a `SemiFuture` to a `Future` with an executor, or a `Future` on one executor to a `Future` on another executor.

For example:

```
folly::ThreadedExecutor executor;
SemiFuture<GetReply> semiFut = mc.future_get("foo");
Future<GetReply> fut1 = std::move(semiFut).via(&executor);
```

Once an executor is attached, a `Future` allows continuations to be attached and chained together monadically. An example will clarify:

```
SemiFuture<GetReply> semiFut = mc.future_get("foo");
Future<GetReply> fut1 = std::move(semiFut).via(&executor);

Future<string> fut2 = std::move(fut1).thenValue(
  [](GetReply reply) {
    if (reply.result == MemcacheClient::GetReply::Result::FOUND)
      return reply.value;
    throw SomeException("No value");
  });

Future<Unit> fut3 = std::move(fut2)
  .thenValue([](string str) {
    cout << str << endl;
  })
  .thenTry([](folly::Try<string> strTry) {
    cout << strTry.value() << endl;
  })
  .thenError<std::exception>([](std::exception const& e) {
    cerr << e.what() << endl;
  });
```

That example is a little contrived but the idea is that you can transform a result from one type to another, potentially in a chain, and unhandled errors propagate. Of course, the intermediate variables are optional.

Using `.thenValue` or `.thenTry` to add callbacks is idiomatic. It brings all the code into one place, which avoids callback hell. `.thenValue` appends a continuation that takes `T&&` for some `Future<T>` and an error bypasses the callback and is passed to the next, `thenTry` takes a callback taking `folly::Try<T>` which encapsulates both value and exception. `thenError<ExceptionType>` will bypass a value and only run if there is an exception, the `ExceptionType` template parameter allows filtering by exception type; `ExceptionType` is optional and if not passed the function will be parameterised with a `folly::exception_wrapper`.

Up to this point we have skirted around the matter of waiting for Futures. You may never need to wait for a Future, because your code is event-driven and all follow-up action happens in a then-block. But if want to have a batch workflow, where you initiate a batch of asynchronous operations and then wait for them all to finish at a synchronization point, then you will want to wait for a Future. Futures have a blocking method called `wait()` that does exactly that and optionally takes a timeout.

Futures are partially threadsafe. A Promise or Future can migrate between threads as long as there's a full memory barrier of some sort. `Future::thenValue` and `Promise::setValue` (and all variants that boil down to those two calls) can be called from different threads. **But**, be warned that you might be surprised about which thread your callback executes on. Let's consider an example, where we take a future straight from a promise, without going via the safer SemiFuture, and where we therefore have a `Future` that does not carry an executor. This is in general something to avoid.

```
// Thread A
Promise<Unit> p;
auto f = p.getFuture();

// Thread B
std::move(f).thenValue(x).thenValue(y).thenTry(z);

// Thread A
p.setValue();
```

This is legal and technically threadsafe. However, it is important to realize that you do not know in which thread `x`, `y`, and/or `z` will execute. Maybe they will execute in Thread A when `p.setValue()` is called. Or, maybe they will execute in Thread B when `f.thenValue` is called. Or, maybe `x` will execute in Thread A, but `y` and/or `z` will execute in Thread B. There's a race between `setValue` and `then`—whichever runs last will execute the callback. The only guarantee is that one of them will run the callback.

For safety, `.via` should be preferred. We can chain `.via` operations to give very strong control over where callbacks run:

```
std::move(aFuture)
  .thenValue(x)
  .via(e1).thenValue(y1).thenValue(y2)
  .via(e2).thenValue(z);
```

`x` will execute in the context of the executor associated with `aFuture`. `y1` and `y2` will execute in the context of `e1`, and `z` will execute in the context of `e2`. If after `z` you want to get back to the original context, you need to get there with a call to `via` passing the original executor. Another way to express this is using an overload of `then` that takes an Executor:

```
std::move(aFuture)
  .thenValue(x)
  .thenValue(e1, y1, y2)
  .thenValue(e2, z);
```

Either way, there is no ambiguity about which executor will run `y1`, `y2`, or `z`.

You can still have a race after `via` if you break it into multiple statements, e.g. in this counterexample:

```
f2 = std::move(f).via(e1).thenValue(y1).thenValue(y2); // nothing racy here
std::move(f2).thenValue(y3); // racy
```

# You make me Promises, Promises

If you are wrapping an asynchronous operation, or providing an asynchronous API to users, then you will want to make `Promise`s. Every Future has a corresponding Promise (except Futures that spring into existence already completed, with `makeFuture()`). Promises are simple: you make one, you extract the Future, and you fulfill it with a value or an exception. Example:

```
Promise<int> p;
SemiFuture<int> f = p.getSemiFuture();

f.isReady() == false

p.setValue(42);

f.isReady() == true
f.value() == 42
```

and an exception example:

```
Promise<int> p;
SemiFuture<int> f = p.getSemiFuture();

f.isReady() == false

p.setException(std::runtime_error("Fail"));

f.isReady() == true
f.value() // throws the exception
```

It's good practice to use setWith which takes a function and automatically captures exceptions, e.g.

```
Promise<int> p;
p.setWith([]{
  try {
    // do stuff that may throw
    return 42;
  } catch (MySpecialException const& e) {
    // handle it
    return 7;
  }
  // Any exceptions that we didn't catch, will be caught for us
});
```
