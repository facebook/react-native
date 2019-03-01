`folly/Format.h`
----------------

`folly/Format.h` provides a fast, powerful, type-safe, flexible facility
for formatting text, using a specification language similar to Python's
[str.format](http://docs.python.org/library/string.html#formatstrings).
By default, it can format strings, numbers (integral and floating point),
and dynamically-typed `folly::dynamic` objects, and can extract values from
random-access containers and string-keyed maps.  In many cases, `format` is
faster than `sprintf` as well as being fully type-safe.

To use `format`, you need to be using gcc 4.6 or later.  You'll want to include
`folly/Format.h`.

### Overview
***

Here are some code samples to get started:

``` Cpp
using folly::format;
using folly::sformat;
using folly::vformat;
using folly::svformat;

// Objects produced by format() can be streamed without creating
// an intermediary string; {} yields the next argument using default
// formatting.
std::cout << format("The answers are {} and {}", 23, 42);
// => "The answers are 23 and 42"

// If you just want the string, though, you're covered.
std::string result = sformat("The answers are {} and {}", 23, 42);
// => "The answers are 23 and 42"

// To insert a literal '{' or '}', just double it.
std::cout << format("{} {{}} {{{}}}", 23, 42);
// => "23 {} {42}"

// Arguments can be referenced out of order, even multiple times
std::cout << format("The answers are {1}, {0}, and {1} again", 23, 42);
// => "The answers are 42, 23, and 42 again"

// It's perfectly fine to not reference all arguments
std::cout << format("The only answer is {1}", 23, 42);
// => "The only answer is 42"

// Values can be extracted from indexable containers
// (random-access sequences and integral-keyed maps), and also from
// string-keyed maps
std::vector<int> v {23, 42};
std::map<std::string, std::string> m { {"what", "answer"} };
std::cout << format("The only {1[what]} is {0[1]}", v, m);
// => "The only answer is 42"

// If you only have one container argument, vformat makes the syntax simpler
std::map<std::string, std::string> m { {"what", "answer"}, {"value", "42"} };
std::cout << vformat("The only {what} is {value}", m);
// => "The only answer is 42"
// same as
std::cout << format("The only {0[what]} is {0[value]}", m);
// => "The only answer is 42"
// And if you just want the string,
std::string result = svformat("The only {what} is {value}", m);
// => "The only answer is 42"
std::string result = sformat("The only {0[what]} is {0[value]}", m);
// => "The only answer is 42"

// {} works for vformat too
std::vector<int> v {42, 23};
std::cout << vformat("{} {}", v);
// => "42 23"

// format and vformat work with pairs and tuples
std::tuple<int, std::string, int> t {42, "hello", 23};
std::cout << vformat("{0} {2} {1}", t);
// => "42 23 hello"

// Format supports width, alignment, arbitrary fill, and various
// format specifiers, with meanings similar to printf
// "X<10": fill with 'X', left-align ('<'), width 10
std::cout << format("{:X<10} {}", "hello", "world");
// => "helloXXXXX world"

// Field width may be a runtime value rather than part of the format string
int x = 6;
std::cout << format("{:-^*}", x, "hi");
// => "--hi--"

// Explicit arguments work with dynamic field width, as long as indexes are
// given for both the value and the field width.
std::cout << format("{2:+^*0}",
9, "unused", 456); // => "+++456+++"

// Format supports printf-style format specifiers
std::cout << format("{0:05d} decimal = {0:04x} hex", 42);
// => "00042 decimal = 002a hex"

// Formatter objects may be written to a string using folly::to or
// folly::toAppend (see folly/Conv.h), or by calling their appendTo(),
// str(), and fbstr() methods
std::string s = format("The only answer is {}", 42).str();
std::cout << s;
// => "The only answer is 42"
```


### Format string syntax
***

Format string (`format`):
`"{" [arg_index] ["[" key "]"] [":" format_spec] "}"`

- `arg_index`: index of argument to format; default = next argument.  Note
  that a format string may have either default argument indexes or
  non-default argument indexes, but not both (to avoid confusion).
- `key`: if the argument is a container (C-style array or pointer,
  `std::array`, vector, deque, map), you may use this
  to select the element to format; works with random-access sequences and
  integer- and string-keyed maps.  Multiple level keys work as well, with
  components separated with "."; for example, given
  `map<string, map<string, string>> m`, `{[foo.bar]}` selects
  `m["foo"]["bar"]`.
- `format_spec`: format specification, see below

Format string (`vformat`):
`"{" [ key ] [":" format_spec] "}"`

- `key`: select the argument to format from the container argument;
  works with random-access sequences and integer- and string-keyed maps.
  Multiple level keys work as well, with components separated with "."; for
  example, given `map<string, map<string, string>> m`, `{foo.bar}` selects
  `m["foo"]["bar"]`.
- `format_spec`: format specification, see below

Format specification:
`[[fill] align] [sign] ["#"] ["0"] [width] [","] ["." precision] ["."] [type]`

- `fill` (may only be specified if `align` is also specified): pad with this
  character ('` `' (space) or '`0`' (zero) might be useful; space is default)
- `align`: one of '`<`', '`>`', '`=`', '`^`':
    - '`<`': left-align (default for most objects)
    - '`>`': right-align (default for numbers)
    - '`=`': pad after sign, but before significant digits; used to print
            `-0000120`; only valid for numbers
    - '`^`': center
- `sign`: one of '`+`', '`-`', ' ' (space) (only valid for numbers)
    - '`+`': output '`+`' if positive or zero, '`-`' if negative
    - '`-`': output '`-`' if negative, nothing otherwise (default)
    - '` `' (space): output '` `' (space) if positive or zero, '`-`' if negative
- '`#`': output base prefix (`0` for octal, `0b` or `0B` for binary, `0x` or
  `0X` for hexadecimal; only valid for integers)
- '`0`': 0-pad after sign, same as specifying "`0=`" as the `fill` and
  `align` parameters (only valid for numbers)
- `width`: minimum field width. May be '`*`' to indicate that the field width
  is given by an argument. Defaults to the next argument (preceding the value
  to be formatted) but an explicit argument index may be given following the
  '`*`'. Not supported in `vformat()`.
- '`,`' (comma): output comma as thousands' separator (only valid for integers,
  and only for decimal output)
- `precision` (not allowed for integers):
    - for floating point values, number of digits after decimal point ('`f`' or
      '`F`' presentation) or number of significant digits ('`g`' or '`G`')
    - for others, maximum field size (truncate subsequent characters)
- '`.`' (when used after precision or in lieu of precison): Forces a trailing
  decimal point to make it clear this is a floating point value.
- `type`: presentation format, see below

Presentation formats:

- Strings (`folly::StringPiece`, `std::string`, `folly::fbstring`,
  `const char*`):
    - '`s`' (default)
- Integers:
    - '`b`': output in binary (base 2) ("`0b`" prefix if '`#`' specified)
    - '`B`': output in binary (base 2) ("`0B`" prefix if '`#`' specified)
    - '`c`': output as a character (cast to `char`)
    - '`d`': output in decimal (base 10) (default)
    - '`o`': output in octal (base 8)
    - '`O`': output in octal (base 8) (same as '`o`')
    - '`x`': output in hexadecimal (base 16) (lower-case digits above 9)
    - '`X`': output in hexadecimal (base 16) (upper-case digits above 9)
    - '`n`': locale-aware output (currently same as '`d`')
- `bool`:
    - default: output "`true`" or "`false`" as strings
    - integer presentations allowed as well
- `char`:
    - same as other integers, but default is '`c`' instead of '`d`'
- Floating point (`float`, `double`; `long double` is not implemented):
    - '`e`': scientific notation using '`e`' as exponent character
    - '`E`': scientific notation using '`E`' as exponent character
    - '`f`': fixed point
    - '`F`': fixed point (same as '`f`')
    - '`g`': general; use either '`f`' or '`e`' depending on magnitude (default)
    - '`G`': general; use either '`f`' or '`E`' depending on magnitude
    - '`n`': locale-aware version of '`g`' (currently same as '`g`')
    - '`%`': percentage: multiply by 100 then display as '`f`'


### Extension
***

You can extend `format` for your own class by providing a specialization for
`folly::FormatValue`.  See `folly/Format.h` and `folly/FormatArg.h` for
details, and the existing specialization for `folly::dynamic` in
`folly/dynamic-inl.h` for an implementation example.
