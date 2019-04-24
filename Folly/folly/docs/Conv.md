`folly/Conv.h`
-------------

`folly/Conv.h` is a one-stop-shop for converting values across
types. Its main features are simplicity of the API (only the
names `to` and `toAppend` must be memorized), speed
(folly is significantly faster, sometimes by an order of magnitude,
than comparable APIs), and correctness.

### Synopsis
***

All examples below are assume to have included `folly/Conv.h`
and issued `using namespace folly;` You will need:

``` Cpp
    // To format as text and append to a string, use toAppend.
    fbstring str;
    toAppend(2.5, &str);
    CHECK_EQ(str, "2.5");

    // Multiple arguments are okay, too. Just put the pointer to string at the end.
    toAppend(" is ", 2, " point ", 5, &str);
    CHECK_EQ(str, "2.5 is 2 point 5");

    // You don't need to use fbstring (although it's much faster for conversions and in general).
    std::string stdStr;
    toAppend("Pi is about ", 22.0 / 7, &stdStr);
    // In general, just use to<TargetType>(sourceValue). It returns its result by value.
    stdStr = to<std::string>("Variadic ", "arguments also accepted.");

    // to<fbstring> is 2.5x faster than to<std::string> for typical workloads.
    str = to<fbstring>("Variadic ", "arguments also accepted.");
```

### Integral-to-integral conversion
***

Using `to<Target>(value)` to convert one integral type to another
will behave as follows:

* If the target type can accommodate all possible values of the
  source value, the value is implicitly converted. No further
  action is taken. Example:

``` Cpp
        short x;
        unsigned short y;
        ...
        auto a = to<int>(x); // zero overhead conversion
        auto b = to<int>(y); // zero overhead conversion
```

* Otherwise, `to` inserts bounds checks and throws
  `std::range_error` if the target type cannot accommodate the
  source value. Example:

``` Cpp
    short x;
    unsigned short y;
    long z;
    ...
    x = 123;
    auto a = to<unsigned short>(x); // fine
    x = -1;
    a = to<unsigned short>(x); // THROWS
    z = 2000000000;
    auto b = to<int>(z); // fine
    z += 1000000000;
    b = to<int>(z); // THROWS
    auto b = to<unsigned int>(z); // fine
```

### Anything-to-string conversion
***

As mentioned, there are two primitives for converting anything to
string: `to` and `toAppend`. They support the same set of source
types, literally by definition (`to` is implemented in terms of
`toAppend` for all types). The call `toAppend(value, &str)`
formats and appends `value` to `str` whereas
`to<StringType>(value)` formats `value` as a `StringType` and
returns the result by value. Currently, the supported
`StringType`s are `std::string` and `fbstring`

Both `toAppend` and `to` with a string type as a target support
variadic arguments. Each argument is converted in turn. For
`toAppend` the last argument in a variadic list must be the
address of a supported string type (no need to specify the string
type as a template argument).

#### Integral-to-string conversion

Nothing special here - integrals are converted to strings in
decimal format, with a '-' prefix for negative values. Example:

``` Cpp
    auto a = to<fbstring>(123);
    assert(a == "123");
    a = to<fbstring>(-456);
    assert(a == "-456");
```

The conversion implementation is aggressively optimized. It
converts two digits at a time assisted by fixed-size tables.
Converting a `long` to an `fbstring` is 3.6x faster than using
`boost::lexical_cast` and 2.5x faster than using `sprintf` even
though the latter is used in conjunction with a stack-allocated
constant-size buffer.

Note that converting integral types to `fbstring` has a
particular advantage compared to converting to `std::string`
No integral type (<= 64 bits) has more than 20 decimal digits
including sign. Since `fbstring` employs the small string
optimization for up to 23 characters, converting an integral
to `fbstring` is guaranteed to not allocate memory, resulting
in significant speed and memory locality gains. Benchmarks
reveal a 2x gain on a typical workload.

#### `char` to string conversion

Although `char` is technically an integral type, most of the time
you want the string representation of `'a'` to be `"a"`, not `96`
That's why `folly/Conv.h` handles `char` as a special case that
does the expected thing. Note that `signed char` and `unsigned
char` are still considered integral types.


#### Floating point to string conversion

`folly/Conv.h` uses [V8's double conversion](http://code.google.com/p/double-conversion/)
routines. They are accurate and fast; on typical workloads,
`to<fbstring>(doubleValue)` is 1.9x faster than `sprintf` and
5.5x faster than `boost::lexical_cast` (It is also 1.3x faster
than `to<std::string>(doubleValue)`

#### `const char*` to string conversion

For completeness, `folly/Conv.h` supports `const char*` including
i.e. string literals. The "conversion" consists, of course, of
the string itself. Example:

``` Cpp
    auto s = to<fbstring>("Hello, world");
    assert(s == "Hello, world");
```

#### Anything from string conversion (i.e. parsing)
***

`folly/Conv.h` includes three kinds of parsing routines:

* `to<Type>(const char* begin, const char* end)` rigidly
  converts the range [begin, end) to `Type` These routines have
  drastic restrictions (e.g. allow no leading or trailing
  whitespace) and are intended as an efficient back-end for more
  tolerant routines.
* `to<Type>(stringy)` converts `stringy` to `Type` Value
  `stringy` may be of type `const char*`, `StringPiece`,
  `std::string`, or `fbstring` (Technically, the requirement is
  that `stringy` implicitly converts to a `StringPiece`
* `to<Type>(&stringPiece)` parses with progress information:
  given `stringPiece` of type `StringPiece` it parses as much
  as possible from it as type `Type` and alters `stringPiece`
  to remove the munched characters. This is easiest clarified
  by an example:

``` Cpp
    fbstring s = " 1234 angels on a pin";
    StringPiece pc(s);
    auto x = to<int>(&pc);
    assert(x == 1234);
    assert(pc == " angels on a pin";
```

Note how the routine ate the leading space but not the trailing one.

#### Parsing integral types

Parsing integral types is unremarkable - decimal format is
expected, optional `'+'` or `'-'` sign for signed types, but no
optional `'+'` is allowed for unsigned types. The one remarkable
element is speed - parsing typical `long` values is 6x faster than
`sscanf`. `folly/Conv.h` uses aggressive loop unrolling and
table-assisted SIMD-style code arrangement that avoids integral
division (slow) and data dependencies across operations
(ILP-unfriendly). Example:

``` Cpp
    fbstring str = "  12345  ";
    assert(to<int>(str) == 12345);
    str = "  12345six seven eight";
    StringPiece pc(str);
    assert(to<int>(&pc) == 12345);
    assert(str == "six seven eight");
```

#### Parsing floating-point types

`folly/Conv.h` uses, again, [V8's double-conversion](http://code.google.com/p/double-conversion/)
routines as back-end. The speed is 3x faster than `sscanf` and
1.7x faster than in-home routines such as `parse<double>` But
the more important detail is accuracy - even if you do code a
routine that works faster than `to<double>` chances are it is
incorrect and will fail in a variety of corner cases. Using
`to<double>` is strongly recommended.

Note that if the string "NaN" (with any capitalization) is passed to
`to<double>` then `NaN` is returned, which can be tested for as follows:

``` Cpp
    fbstring str = "nan"; // "NaN", "NAN", etc.
    double d = to<double>(str);
    if (std::isnan(d)) {
      // string was a valid representation of the double value NaN
    }
```

Note that passing "-NaN" (with any capitalization) to `to<double>` also returns
`NaN`.

Note that if the strings "inf" or "infinity" (with any capitalization) are
passed to `to<double>` then `infinity` is returned, which can be tested for
as follows:

``` Cpp
    fbstring str = "inf"; // "Inf", "INF", "infinity", "Infinity", etc.
    double d = to<double>(str);
    if (std::isinf(d)) {
      // string was a valid representation of one of the double values +Infinity
      // or -Infinity
    }
```

Note that passing "-inf" or "-infinity" (with any capitalization) to
`to<double>` returns `-infinity` rather than `+infinity`. The sign of the
`infinity` can be tested for as follows:

``` Cpp
    fbstring str = "-inf"; // or "inf", "-Infinity", "+Infinity", etc.
    double d = to<double>(str);
    if (d == std::numeric_limits<double>::infinity()) {
      // string was a valid representation of the double value +Infinity
    } else if (d == -std::numeric_limits<double>::infinity()) {
      // string was a valid representation of the double value -Infinity
    }
```

Note that if an unparseable string is passed to `to<double>` then an exception
is thrown, rather than `NaN` being returned.  This can be tested for as follows:

``` Cpp
    fbstring str = "not-a-double"; // Or "1.1.1", "", "$500.00", etc.
    double d;
    try {
      d = to<double>(str);
    } catch (const std::range_error &) {
      // string could not be parsed
    }
```

Note that the empty string (`""`) is an unparseable value, and will cause
`to<double>` to throw an exception.

#### Non-throwing interfaces

`tryTo<T>` is the non-throwing variant of `to<T>`. It returns
an `Expected<T, ConversionCode>`. You can think of `Expected`
as like an `Optional<T>`, but if the conversion failed, `Expected`
stores an error code instead of a `T`.

`tryTo<T>` has similar performance as `to<T>` when the
conversion is successful. On the error path, you can expect
`tryTo<T>` to be roughly three orders of magnitude faster than
the throwing `to<T>` and to completely avoid any lock contention
arising from stack unwinding.

Here is how to use non-throwing conversions:

``` Cpp
    auto t1 = tryTo<int>(str);
    if (t1.hasValue()) {
      use(t1.value());
    }
```

`Expected` has a composability feature to make the above pattern simpler.

``` Cpp
    tryTo<int>(str).then([](int i) { use(i); });
```
