`folly/FBString.h`
------------------

`fbstring` is a drop-in replacement for `std::string`. The main
benefit of `fbstring` is significantly increased performance on
virtually all important primitives. This is achieved by using a
three-tiered storage strategy and by cooperating with the memory
allocator. In particular, `fbstring` is designed to detect use of
jemalloc and cooperate with it to achieve significant improvements in
speed and memory usage.

`fbstring` supports 32- and 64-bit and little- and big-endian
architectures.

### Storage strategies
***

* Small strings (<= 23 chars) are stored in-situ without memory
  allocation.

* Medium strings (24 - 255 chars) are stored in malloc-allocated
  memory and copied eagerly.

* Large strings (> 255 chars) are stored in malloc-allocated memory and
  copied lazily.

### Implementation highlights
***

* 100% compatible with `std::string`.

* Thread-safe reference counted copy-on-write for strings "large"
  strings (> 255 chars).

* Uses `malloc` instead of allocators.

* Jemalloc-friendly. `fbstring` automatically detects if application
  uses jemalloc and if so, significantly improves allocation
  strategy by using non-standard jemalloc extensions.

* `find()` is implemented using simplified Boyer-Moore
  algorithm. Casual tests indicate a 30x speed improvement over
  `string::find()` for successful searches and a 1.5x speed
  improvement for failed searches.

* Offers conversions to and from `std::string`.
