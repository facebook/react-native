`folly/small_vector.h`
----------------------

`folly::small_vector<T,Int=1,...>` is a sequence container that
implements small buffer optimization. It behaves similarly to
std::vector, except until a certain number of elements are reserved it
does not use the heap.

Like standard vector, it is guaranteed to use contiguous memory.  (So,
after it spills to the heap all the elements live in the heap buffer.)

Simple usage example:

``` Cpp
    small_vector<int,2> vec;
    vec.push_back(0); // Stored in-place on stack
    vec.push_back(1); // Still on the stack
    vec.push_back(2); // Switches to heap buffer.
```

### Details
***

This class is useful in either of following cases:

* Short-lived stack vectors with few elements (or maybe with a
  usually-known number of elements), if you want to avoid malloc.

* If the vector(s) are usually under a known size and lookups are very
  common, you'll save an extra cache miss in the common case when the
  data is kept in-place.

* You have billions of these vectors and don't want to waste space on
  `std::vector`'s capacity tracking.  This vector lets `malloc` track our
  allocation capacity.  (Note that this slows down the
  insertion/reallocation code paths significantly; if you need those
  to be fast you should use `fbvector`.)

The last two cases were the main motivation for implementing it.

There are also a couple of flags you can pass into this class
template to customize its behavior.  You can provide them in any
order after the in-place count.  They are all in the `namespace
small_vector_policy`.

* `NoHeap` - Avoid the heap entirely.  (Throws `std::length_error` if
  you would've spilled out of the in-place allocation.)

* `<Any integral type>` - customizes the amount of space we spend on
  tracking the size of the vector.

A couple more examples:

``` Cpp
    // With space for 32 in situ unique pointers, and only using a
    // 4-byte size_type.
    small_vector<std::unique_ptr<int>, 32, uint32_t> v;

    // A inline vector of up to 256 ints which will not use the heap.
    small_vector<int, 256, NoHeap> v;

    // Same as the above, but making the size_type smaller too.
    small_vector<int, 256, NoHeap, uint16_t> v;
```
