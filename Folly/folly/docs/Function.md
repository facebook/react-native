`folly/Function.h`
------------------

`folly::Function` is a polymorphic function wrapper that is not copyable and does not require the wrapped function to be copy constructible. It is similar to `std::function`, but different with respect to some interesting features.

There are some limitations in `std::function` that `folly::Function` tries to avoid. `std::function` is copy-constructible and requires that the callable that it wraps is copy-constructible as well, which is a constraint that is often inconvenient. In most cases when using a `std::function` you don't make use of its copy-constructibility, so you might sometimes feel like you get back very little in return for a noticeable restriction.

This restriction becomes apparent when trying to use a lambda capturing a `unique_ptr` (or any non-copyable type) as a callback for a folly::Future.
``` Cpp
std::unique_ptr<Foo> foo_ptr = new Foo;

some_future.then(
    [foo_ptr = std::move(foo_ptr)] mutable
    (int x)
    { foo_ptr->setX(x); }
);
```
This piece of code did not compile before `folly::Future` started using `folly::Function` instead of `std::function` to store the callback. Because the lambda captures something non-copyable (the `unique_ptr`), it is not copyable itself. And `std::function` can only store copyable callables.

The implementation of folly::Future did not make use of the copy-constructibility of `std::function` at any point. There was no benefit from the fact that the `std::function` is copy-constructible, but the fact that it can only wrap copy-constructible callables posed a restriction.

A workaround was available: `folly::MoveWrapper`, which wraps an object that may be non-copyable and implements copy operations by moving the embedded object. Using a `folly::MoveWrapper`, you can capture non-copyable objects in a lambda, and the lambda itself is still copyable and may be wrapped in a `std::function`. It is a pragmatic solution for the above problem, but you have to be a little careful. The problem is that you can’t use a `MoveWrapper` anywhere where copy operations are assumed to behave like actual copy operations. Also, a `folly::MoveWrapper<std::unique_ptr<T>>` essentially behaves like `auto_ptr<T>`. Ask yourself whether you’d want to use lots of `auto_ptr`s in your codebase. And the original question still persists: we very often don’t benefit from copy-constructibility of `std::function`, so why do we have to live with this restriction? I.e. why do we have to use `MoveWrapper`?

`folly::Function` is an actual solution to this problem, as it can wrap non-copyable callables, at the cost of not being copy-constructible, which more often than not is not a relevant restriction. `folly::Future` now uses `folly::Function` to store callbacks, so the good news is: the code example from the top of this note is becoming a perfectly valid way to use future callbacks. The code compiles and behaves as you would expect.

Here are more details about `folly::Function`: much like `std::function`, it wraps an arbitrary object that can be invoked like a given function type. E.g. a `folly::Function<int(std::string, double)>` can wrap any callable object that returns an `int` (or something that is convertible to an `int`) when invoked with a `std::string` and a `double` argument. The function type is a template parameter of `folly::Function`, but the specific type of the callable is not. Also, like most implementations of `std::function`, `folly::Function` will store small callable objects in-place whereas larger callables will be stored on the heap. (Unlike `std::function`, you can set the size of the in-place storage as a template parameter of `folly::Function`.)

Other than copyability, there is one more significant difference between `std::function` and `folly::Function`, and it concerns const-correctness. `std::function` does not enforce const-correctness: it allows you to store mutable callables (i.e. callables that may change their inner state when executed, such as a mutable lambda) and call them in a const context (i.e. when you only have access to a const reference to the `std::function` object). For example:
``` Cpp
class FooBar {
 public:
  void call_func() const {
    func_();
  }
 private:
  std::function<void()> func_;
};
```
The `call_func` member function is declared const. However, when it calls `func_()`, it may change the inner state of `func_`, and thereby the inner state of the `FooBar` object. Inside the `FooBar` class, `func_` is like a non-const method that is callable from const methods.

Some people consider `std::function` in the standard broken with respect to this. (Paper N4348 explains this problem in more detail.) It also lists possible ways to fix the problem. `folly::Function`, however, goes a different way: you have to declare whether you want to store a const function, in which case you can invoke any reference (const or non-const) of the `folly::Function`, or a non-const (mutable) function, in which case you need a non-const reference to the `folly::Function` to be able to invoke it. In the above example, let’s say that `func_` stores a const function, which makes it okay that it gets invoked from `call_func` (a const method). Instead of `std::function`, you could use `folly::Function<void() const>` for the `func_` member.

Const-ness is part of a function type. To illustrate:
``` Cpp
class Foo {
 public:
  int operator()() { return 1; }
  int operator()(char const*) { return 2; }
  int operator()(int) { return 3; }
  int operator()(int) const { return 4; }
  int operator()(int, int) const { return 5; }
};
```
You can overload methods multiple times using different argument signatures. Const-ness is part of that signature, so even for the same set of argument types you can overload a const and a non-const version. It’s not even particularly unusual to do that. Take for instance the `begin()` method of STL container types: `begin()` returns an `iterator`, `begin() const` returns a `const_iterator`. `folly::Function` allows you to select a specific overload easily:
``` Cpp
folly::Function<int()> uf1 = Foo();
// uf1() returns 1
folly::Function<int(char const*)> uf2 = Foo();
// uf2() returns 2
folly::Function<int(int)> uf3 = Foo();
// uf3() returns 3
folly::Function<int(int) const> uf4 = Foo();
// uf4() returns 4
folly::Function<int(int, int) const> uf5 = Foo();
// uf5() returns 5
```
If `cfoo` is a const-reference to a `Foo` object, `cfoo(int)` returns 4. If `foo` is a non-const reference to a `Foo` object, `foo(int)` returns 3. Normal const-to-non-const conversion behaviour applies: if you call `foo(int, int)` it will return 5: a non-const reference will invoke the const method if no non-const method is defined. Which leads to the following behaviour:
``` Cpp
folly::Function<int(int, int)> uf5nc = Foo();
// uf5nc() returns 5
```
If you are wondering if the introduction of const function types means that you have to change lots of normal function types to const function types if you want to use `folly::Function`: not really, or at least not as much as you might think. There are only two reasons to use a `folly::Function` with a const function type:
* a callable object defines both const and non-const `operator()` and you explicitly want to select the const one
* you need to invoke a `folly::Function` from a const context (i.e. you only have a const reference to the `folly::Function`)

In practice, you will not need the const variant very often. Adding const to a function type adds a restriction for the callable: it must not change its inner state when invoked. If you don’t care whether it does or not, don’t worry about const!

A `folly::Function<R(Args...) const>` can be converted into a `folly::Function<R(Args...)>`: either way the stored callable will not change its inner state when invoked. The former type expresses and guarantees that, the latter does not. When you get rid of the const, the selected function stays the same:
``` Cpp
folly::Function<int(int)> uf4nc = std::move(uf4);
// uf4nc() returns 4, not 3!
```
If you want to go the other way, you are talking about a (potentially dangerous) const cast: a callable that may or may not change its inner state is declared as one that guarantees not to do that. Proceed at your own risk! This conversion does not happen implicitly, though:
``` Cpp
folly::Function<int() const> uf1c = folly::constCastFunction(std::move(uf1));
// uf1c() returns 1
```
Admittedly, seeing const function types as template parameters is unfamiliar. As far as I am aware it happens nowhere in the standard library. But it is the most consistent way to deal with the issue of const-correctness here. Const qualifiers are part of a function type, as a matter of fact. If you require a const-qualified function to be wrapped in a `folly::Function`, just declare it as that! More often than not you will find that you do not need the const qualifier. While writing the `folly::Function` implementation, a good set of unit tests had existed before the const function types got introduced. Not a single of those unit tests had to be changed: they all compiled and passed after the introduction of const function types. Obviously new ones were added to test the const-correctness. But in your day-to-day use of `folly::Function` you won’t have to worry about const very often.
