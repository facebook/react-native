`folly/Poly.h`
-------------------------------

`Poly` is a class template that makes it relatively easy to define a
type-erasing polymorphic object wrapper.

### Type-erasure
***

`std::function` is one example of a type-erasing polymorphic object wrapper;
`folly::exception_wrapper` is another. Type-erasure is often used as an
alternative to dynamic polymorphism via inheritance-based virtual dispatch.
The distinguishing characteristic of type-erasing wrappers are:

* **Duck typing:** Types do not need to inherit from an abstract base
    class in order to be assignable to a type-erasing wrapper; they merely
    need to satisfy a particular interface.
* **Value semantics:** Type-erasing wrappers are objects that can be
    passed around _by value_. This is in contrast to abstract base classes
    which must be passed by reference or by pointer or else suffer from
    _slicing_, which causes them to lose their polymorphic behaviors.
    Reference semantics make it difficult to reason locally about code.
* **Automatic memory management:** When dealing with inheritance-based
    dynamic polymorphism, it is often necessary to allocate and manage
    objects on the heap. This leads to a proliferation of `shared_ptr`s and
    `unique_ptr`s in APIs, complicating their point-of-use. APIs that take
    type-erasing wrappers, on the other hand, can often store small objects
    in-situ, with no dynamic allocation. The memory management, if any, is
    handled for you, and leads to cleaner APIs: consumers of your API don't
    need to pass `shared_ptr<AbstractBase>`; they can simply pass any object
    that satisfies the interface you require. (`std::function` is a
    particularly compelling example of this benefit. Far worse would be an
    inheritance-based callable solution like
    `shared_ptr<ICallable<void(int)>>`. )

### Examples: Defining a type-erasing function wrapper with `folly::Poly`
***

Defining a polymorphic wrapper with `Poly` is a matter of defining two
things:

* An *interface*, consisting of public member functions, and
* A *mapping* from a concrete type to a set of member function bindings.

Below is a simple example program that defines a `drawable` wrapper for any type
that provides a `draw` member function. (The details will be explained later.)

``` Cpp
    // This example is an adaptation of one found in Louis Dionne's dyno library.
    #include <folly/Poly.h>
    #include <iostream>

    struct IDrawable {
      // Define the interface of something that can be drawn:
      template <class Base> struct Interface : Base {
        void draw(std::ostream& out) const { folly::poly_call<0>(*this, out);}
      };
      // Define how concrete types can fulfill that interface (in C++17):
      template <class T> using Members = folly::PolyMembers<&T::draw>;
    };

    // Define an object that can hold anything that can be drawn:
    using drawable = folly::Poly<IDrawable>;

    struct Square {
      void draw(std::ostream& out) const { out << "Square\n"; }
    };

    struct Circle {
      void draw(std::ostream& out) const { out << "Circle\n"; }
    };

    void f(drawable const& d) {
      d.draw(std::cout);
    }

    int main() {
      f(Square{}); // prints Square
      f(Circle{}); // prints Circle
    }
```

The above program prints:

```
    Square
    Circle
```

Here is another (heavily commented) example of a simple implementation of a
`std::function`-like polymorphic wrapper. Its interface has only a single
member function: `operator()`

``` Cpp
    // An interface for a callable object of a particular signature, Fun
    // (most interfaces don't need to be templates, FWIW).
    template <class Fun>
    struct IFunction;

    template <class R, class... As>
    struct IFunction<R(As...)> {
      // An interface is defined as a nested class template called
      // Interface that takes a single template parameter, Base, from
      // which it inherits.
      template <class Base>
      struct Interface : Base {
        // The Interface has public member functions. These become the
        // public interface of the resulting Poly instantiation.
        // (Implementation note: Poly<IFunction<Sig>> will publicly
        // inherit from this struct, which is what gives it the right
        // member functions.)
        R operator()(As... as) const {
          // The definition of each member function in your interface will
          // always consist of a single line dispatching to folly::poly_call<N>.
          // The "N" corresponds to the N-th member function in the
          // list of member function bindings, Members, defined below.
          // The first argument will always be *this, and the rest of the
          // arguments should simply forward (if necessary) the member
          // function's arguments.
          return static_cast<R>(
              folly::poly_call<0>(*this, std::forward<As>(as)...));
        }
      };
      // The "Members" alias template is a comma-separated list of bound
      // member functions for a given concrete type "T". The
      // "FOLLY_POLY_MEMBERS" macro accepts a comma-separated list, and the
      // (optional) "FOLLY_POLY_MEMBER" macro lets you disambiguate overloads
      // by explicitly specifying the function signature the target member
      // function should have. In this case, we require "T" to have a
      // function call operator with the signature `R(As...) const`.
      //
      // If you are using a C++17-compatible compiler, you can do away with
      // the macros and write this as:
      //
      //   template <class T>
      //   using Members =
      //       folly::PolyMembers<folly::sig<R(As...) const>(&T::operator())>;
      //
      // And since `folly::sig` is only needed for disambiguation in case of
      // overloads, if you are not concerned about objects with overloaded
      // function call operators, it could be further simplified to:
      //
      //   template <class T>
      //   using Members = folly::PolyMembers<&T::operator()>;
      //
      template <class T>
      using Members = FOLLY_POLY_MEMBERS(
          FOLLY_POLY_MEMBER(R(As...) const, &T::operator()));
    };

    // Now that we have defined the interface, we can pass it to Poly to
    // create our type-erasing wrapper:
    template <class Fun>
    using Function = Poly<IFunction<Fun>>;
```

Given the above definition of `Function`, users can now initialize instances
of (say) `Function<int(int, int)>` with function objects like
`std::plus<int>` and `std::multiplies<int>`, as below:

``` Cpp
    Function<int(int, int)> fun = std::plus<int>{};
    assert(5 == fun(2, 3));
    fun = std::multiplies<int>{};
    assert(6 = fun(2, 3));
```

### Defining an interface with C++17
***

With C++17, defining an interface to be used with `Poly` is fairly
straightforward. As in the `Function` example above, there is a struct with
a nested `Interface` class template and a nested `Members` alias template.
No macros are needed with C++17.

Imagine we were defining something like a Java-style iterator. If we are
using a C++17 compiler, our interface would look something like this:

``` Cpp
    template <class Value>
    struct IJavaIterator {
      template <class Base>
      struct Interface : Base {
        bool Done() const { return folly::poly_call<0>(*this); }
        Value Current() const { return folly::poly_call<1>(*this); }
        void Next() { folly::poly_call<2>(*this); }
      };
      // NOTE: This works in C++17 only:
      template <class T>
      using Members = folly::PolyMembers<&T::Done, &T::Current, &T::Next>;
    };

    template <class Value>
    using JavaIterator = Poly<IJavaIterator<Value>>;
```

Given the above definition, `JavaIterator<int>` can be used to hold instances
of any type that has `Done`, `Current`, and `Next` member functions with the
correct (or compatible) signatures.

The presence of overloaded member functions complicates this picture. Often,
property members are faked in C++ with `const` and non-`const` member
function overloads, like in the interface specified below:

``` Cpp
    struct IIntProperty {
      template <class Base>
      struct Interface : Base {
        int Value() const { return folly::poly_call<0>(*this); }
        void Value(int i) { folly::poly_call<1>(*this, i); }
      };
      // NOTE: This works in C++17 only:
      template <class T>
      using Members = folly::PolyMembers<
        folly::sig<int() const>(&T::Value),
        folly::sig<void(int)>(&T::Value)>;
    };

    using IntProperty = Poly<IIntProperty>;
```

Now, any object that has `Value` members of compatible signatures can be
assigned to instances of `IntProperty` object. Note how `folly::sig` is used
to disambiguate the overloads of `&T::Value`.

### Defining an interface with C++14
***

In C++14, the nice syntax above doesn't work, so we have to resort to macros.
The two examples above would look like this:

``` Cpp
    template <class Value>
    struct IJavaIterator {
      template <class Base>
      struct Interface : Base {
        bool Done() const { return folly::poly_call<0>(*this); }
        Value Current() const { return folly::poly_call<1>(*this); }
        void Next() { folly::poly_call<2>(*this); }
      };
      // NOTE: This works in C++14 and C++17:
      template <class T>
      using Members = FOLLY_POLY_MEMBERS(&T::Done, &T::Current, &T::Next);
    };

    template <class Value>
    using JavaIterator = Poly<IJavaIterator<Value>>;
```

and

``` Cpp
    struct IIntProperty {
      template <class Base>
      struct Interface : Base {
        int Value() const { return folly::poly_call<0>(*this); }
        void Value(int i) { return folly::poly_call<1>(*this, i); }
      };
      // NOTE: This works in C++14 and C++17:
      template <class T>
      using Members = FOLLY_POLY_MEMBERS(
        FOLLY_POLY_MEMBER(int() const, &T::Value),
        FOLLY_POLY_MEMBER(void(int), &T::Value));
    };

    using IntProperty = Poly<IIntProperty>;
```

### Extending interfaces
***

One typical advantage of inheritance-based solutions to runtime polymorphism
is that one polymorphic interface could extend another through inheritance.
The same can be accomplished with type-erasing polymorphic wrappers. In
the `Poly` library, you can use `folly::PolyExtends` to say that one interface
extends another.

``` Cpp
    struct IFoo {
      template <class Base>
      struct Interface : Base {
        void Foo() const { return folly::poly_call<0>(*this); }
      };
      template <class T>
      using Members = FOLLY_POLY_MEMBERS(&T::Foo);
    };

    // The IFooBar interface extends the IFoo interface
    struct IFooBar : PolyExtends<IFoo> {
      template <class Base>
      struct Interface : Base {
        void Bar() const { return folly::poly_call<0>(*this); }
      };
      template <class T>
      using Members = FOLLY_POLY_MEMBERS(&T::Bar);
    };

    using FooBar = Poly<IFooBar>;
```

Given the above definition, instances of type `FooBar` have both `Foo()` and
`Bar()` member functions.

The sensible conversions exist between a wrapped derived type and a wrapped
base type. For instance, assuming `IDerived` extends `IBase` with `PolyExtends`:

``` Cpp
    Poly<IDerived> derived = ...;
    Poly<IBase> base = derived; // This conversion is OK.
```

As you would expect, there is no conversion in the other direction, and at
present there is no `Poly` equivalent to `dynamic_cast`.

### Type-erasing polymorphic reference wrappers
***

Sometimes you don't need to own a copy of an object; a reference will do. For
that you can use `Poly` to capture a _reference_ to an object satisfying an
interface rather than the whole object itself. The syntax is intuitive.

``` Cpp
    int i = 42;

    // Capture a mutable reference to an object of any IRegular type:
    Poly<IRegular &> intRef = i;

    assert(42 == folly::poly_cast<int>(intRef));
    // Assert that we captured the address of "i":
    assert(&i == &folly::poly_cast<int>(intRef));
```

A reference-like `Poly` has a different interface than a value-like `Poly`.
Rather than calling member functions with the `obj.fun()` syntax, you would
use the `obj->fun()` syntax. This is for the sake of `const`-correctness.
For example, consider the code below:

``` Cpp
    struct IFoo {
      template <class Base>
      struct Interface {
        void Foo() { folly::poly_call<0>(*this); }
      };
      template <class T>
      using Members = folly::PolyMembers<&T::Foo>;
    };

    struct SomeFoo {
      void Foo() { std::printf("SomeFoo::Foo\n"); }
    };

    SomeFoo foo;
    Poly<IFoo &> const anyFoo = foo;
    anyFoo->Foo(); // prints "SomeFoo::Foo"
```

Notice in the above code that the `Foo` member function is non-`const`.
Notice also that the `anyFoo` object is `const`. However, since it has
captured a non-`const` reference to the `foo` object, it should still be
possible to dispatch to the non-`const` `Foo` member function. When
instantiated with a reference type, `Poly` has an overloaded `operator->`
member that returns a pointer to the `IFoo` interface with the correct
`const`-ness, which makes this work.

The same mechanism also prevents users from calling non-`const` member
functions on `Poly` objects that have captured `const` references, which
would violate `const`-correctness.

Sensible conversions exist between non-reference and reference `Poly`s. For
instance:

``` Cpp
    Poly<IRegular> value = 42;
    Poly<IRegular &> mutable_ref = value;
    Poly<IRegular const &> const_ref = mutable_ref;

    assert(&poly_cast<int>(value) == &poly_cast<int>(mutable_ref));
    assert(&poly_cast<int>(value) == &poly_cast<int>(const_ref));
```

### Non-member functions (C++17)
***

If you wanted to write the interface `ILogicallyNegatable`, which captures
all types that can be negated with unary `operator!`, you could do it
as we've shown above, by binding `&T::operator!` in the nested `Members`
alias template, but that has the problem that it won't work for types that
have defined unary `operator!` as a free function. To handle this case,
the `Poly` library lets you use a free function instead of a member function
when creating a binding.

With C++17 you may use a lambda to create a binding, as shown in the example
below:

``` Cpp
    struct ILogicallyNegatable {
      template <class Base>
      struct Interface : Base {
        bool operator!() const { return folly::poly_call<0>(*this); }
      };
      template <class T>
      using Members = folly::PolyMembers<
        +[](T const& t) -> decltype(bool(!t)) { return bool(!t); }>;
    };
```

This requires some explanation. The unary `operator+` in front of the lambda
is necessary! It causes the lambda to decay to a C-style function pointer,
which is one of the types that `folly::PolyMembers` accepts. The `decltype` in
the lambda return type is also necessary. Through the magic of SFINAE, it
will cause `Poly<ILogicallyNegatable>` to reject any types that don't support
unary `operator!`.

If you are using a free function to create a binding, the first parameter is
implicitly the `this` parameter. It will receive the type-erased object.

### Non-member functions (C++14)
***

If you are using a C++14 compiler, the definition of `ILogicallyNegatable`
above will fail because lambdas are not `constexpr`. We can get the same
effect by writing the lambda as a named free function, as show below:

``` Cpp
    struct ILogicallyNegatable {
      template <class Base>
      struct Interface : Base {
        bool operator!() const { return folly::poly_call<0>(*this); }
      };
      template <class T>
      static auto negate(T const& t)
        -> decltype(bool(!t)) { return bool(!t); }
      template <class T>
      using Members = FOLLY_POLY_MEMBERS(&negate<T>);
    };
```

As with the example that uses the lambda in the preceding section, the first
parameter is implicitly the `this` parameter. It will receive the type-erased
object.

### Multi-dispatch
***

What if you want to create an `IAddable` interface for things that can be
added? Adding requires _two_ objects, both of which are type-erased. This
interface requires dispatching on both objects, doing the addition only
if the types are the same. For this we make use of the `PolySelf` template
alias to define an interface that takes more than one object of the the
erased type.

``` Cpp
    struct IAddable {
      template <class Base>
      struct Interface : Base {
        friend PolySelf<Base>
        operator+(PolySelf<Base> const& a, PolySelf<Base> const& b) const {
          return folly::poly_call<0>(a, b);
        }
      };
      template <class T>
      using Members = folly::PolyMembers<
        +[](T const& a, T const& b) -> decltype(a + b) { return a + b; }>;
    };
```

Given the above definition of `IAddable` we would be able to do the following:

``` Cpp
    Poly<IAddable> a = 2, b = 3;
    Poly<IAddable> c = a + b;
    assert(poly_cast<int>(c) == 5);
```

If `a` and `b` stored objects of different types, a `BadPolyCast` exception
would be thrown.

### Move-only types
***

If you want to store move-only types, then your interface should extend the
`poly::IMoveOnly` interface.

### Implementation notes
***

`Poly` will store "small" objects in an internal buffer, avoiding the cost of
of dynamic allocations. At present, this size is not configurable; it is
pegged at the size of two `double`s.

`Poly` objects are always nothrow movable. If you store an object in one that
has a potentially throwing move constructor, the object will be stored on the
heap, even if it could fit in the internal storage of the `Poly` object.
(So be sure to give your objects nothrow move constructors!)

`Poly` implements type-erasure in a manner very similar to how the compiler
accomplishes virtual dispatch. Every `Poly` object contains a pointer to a
table of function pointers. Member function calls involve a double-
indirection: once through the v-pointer, and other indirect function call
through the function pointer.
