`folly/dynamic.h`
-----------------

`folly/dynamic.h` provides a runtime dynamically typed value for
C++, similar to the way languages with runtime type systems work
(e.g. Python). It can hold types from a predetermined set of types
(ints, bools, arrays of other dynamics, etc), similar to something like
`boost::variant`, but the syntax is intended to be a little more like
using the native type directly.

To use `dynamic`, you need to be using gcc 4.6 or later. You'll want to
include `folly/dynamic.h` (or perhaps also `folly/json.h`).

### Overview
***

Here are some code samples to get started (assumes a `using
folly::dynamic;` was used):

``` Cpp
    dynamic twelve = 12; // creates a dynamic that holds an integer
    dynamic str = "string"; // yep, this one is an fbstring

    // A few other types.
    dynamic nul = nullptr;
    dynamic boolean = false;

    // Arrays can be initialized with dynamic::array.
    dynamic array = dynamic::array("array ", "of ", 4, " elements");
    assert(array.size() == 4);
    dynamic emptyArray = dynamic::array;
    assert(emptyArray.empty());

    // Maps from dynamics to dynamics are called objects.  The
    // dynamic::object constant is how you make an empty map from dynamics
    // to dynamics.
    dynamic map = dynamic::object;
    map["something"] = 12;
    map["another_something"] = map["something"] * 2;

    // Dynamic objects may be intialized this way
    dynamic map2 = dynamic::object("something", 12)("another_something", 24);
```

### Runtime Type Checking and Conversions
***

Any operation on a dynamic requires checking at runtime that the
type is compatible with the operation. If it isn't, you'll get a
`folly::TypeError`. Other exceptions can also be thrown if
you try to do something impossible (e.g. if you put a very large
64-bit integer in and try to read it out as a double).

More examples should hopefully clarify this:

``` Cpp
    dynamic dint = 42;

    dynamic str = "foo";
    dynamic anotherStr = str + "something"; // fine
    dynamic thisThrows = str + dint; // TypeError is raised
```

Explicit type conversions can be requested for some of the basic types:

``` Cpp
    dynamic dint = 12345678;
    dynamic doub = dint.asDouble(); // doub will hold 12345678.0
    dynamic str = dint.asString(); // str == "12345678"

    dynamic hugeInt = std::numeric_limits<int64_t>::max();
    dynamic hugeDoub = hugeInt.asDouble();  // throws a folly/Conv.h error,
                                            // since it can't fit in a double
```

For more complicated conversions, see [DynamicConverter](DynamicConverter.md).

### Iteration and Lookup
***

You can iterate over dynamic arrays as you would over any C++ sequence container.

``` Cpp
    dynamic array = dynamic::array(2, 3, "foo");

    for (auto& val : array) {
      doSomethingWith(val);
    }
```

You can iterate over dynamic maps by calling `items()`, `keys()`,
`values()`, which behave similarly to the homonymous methods of Python
dictionaries.

``` Cpp
    dynamic obj = dynamic::object(2, 3)("hello", "world")("x", 4);

    for (auto& pair : obj.items()) {
      // Key is pair.first, value is pair.second
      processKey(pair.first);
      processValue(pair.second);
    }

    for (auto& key : obj.keys()) {
      processKey(key);
    }

    for (auto& value : obj.values()) {
      processValue(value);
    }
```

You can find an element by key in a dynamic map using the `find()` method,
which returns an iterator compatible with `items()`:

``` Cpp
    dynamic obj = dynamic::object(2, 3)("hello", "world")("x", 4);

    auto pos = obj.find("hello");
    // pos->first is "hello"
    // pos->second is "world"

    auto pos = obj.find("no_such_key");
    // pos == obj.items().end()
```


### Use for JSON
***

The original motivation for implementing this type was to try to
make dealing with json documents in C++ almost as easy as it is
in languages with dynamic type systems (php or javascript, etc).
The reader can judge whether we're anywhere near that goal, but
here's what it looks like:

``` Cpp
    // Parsing JSON strings and using them.
    std::string jsonDocument = R"({"key":12,"key2":[false, null, true, "yay"]})";
    dynamic parsed = folly::parseJson(jsonDocument);
    assert(parsed["key"] == 12);
    assert(parsed["key2"][0] == false);
    assert(parsed["key2"][1] == nullptr);

    // Building the same document programatically.
    dynamic sonOfAJ = dynamic::object
      ("key", 12)
      ("key2", dynamic::array(false, nullptr, true, "yay"));

    // Printing.  (See also folly::toPrettyJson)
    auto str = folly::toJson(sonOfAJ);
    assert(jsonDocument.compare(str) == 0);
```

### Performance
***

Dynamic typing is more expensive than static typing, even when
you do it in C++. ;)

However, some effort has been made to keep `folly::dynamic` and
the json (de)serialization at least reasonably performant for
common cases. The heap is only used for arrays and objects, and
move construction is fully supported. String formatting
internally also uses the highly performant `folly::to<>` (see
`folly/Conv.h`).

A trade off to keep in mind though, is that
`sizeof(folly::dynamic)` is 64 bytes. You probably don't want to
use it if you need to allocate large numbers of them (prefer
static types, etc).

### Some Design Rationale
***

**Q. Why doesn't a dynamic string support begin(), end(), and operator[]?**

The value_type of a dynamic iterator is `dynamic`, and `operator[]`
(or the `at()` function) has to return a reference to a dynamic.  If
we wanted this to work for strings, this would mean we'd have to
support dynamics with a character type, and moreover that the internal
representation of strings would be such that we can hand out
references to dynamic as accessors on individual characters.  There
are a lot of potential efficiency drawbacks with this, and it seems
like a feature that is not needed too often in practice.

**Q. Isn't this just a poor imitation of the C# language feature?**

Pretty much.
