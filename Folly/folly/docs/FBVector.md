`folly/FBVector.h`
------------------

Simply replacing `std::vector` with `folly::fbvector` (after
having included the `folly/FBVector.h` header file) will
improve the performance of your C++ code using vectors with
common coding patterns. The improvements are always non-negative,
almost always measurable, frequently significant, sometimes
dramatic, and occasionally spectacular.

### Sample
***

    folly::fbvector<int> numbers({0, 1, 2, 3});
    numbers.reserve(10);
    for (int i = 4; i < 10; i++) {
      numbers.push_back(i * 2);
    }
    assert(numbers[6] == 12);

### Motivation
***

`std::vector` is the stalwart abstraction many use for
dynamically-allocated arrays in C++. It is also the best known
and most used of all containers. It may therefore seem a
surprise that `std::vector` leaves important - and sometimes
vital - efficiency opportunities on the table. This document
explains how our own drop-in abstraction `fbvector` improves key
performance aspects of `std::vector`. Refer to
folly/test/FBVectorTest.cpp for a few benchmarks.

### Memory Handling
***

It is well known that `std::vector` grows exponentially (at a
constant factor) in order to avoid quadratic growth performance.
The trick is choosing a good factor. Any factor greater than 1
ensures O(1) amortized append complexity towards infinity. But a
factor that's too small (say, 1.1) causes frequent vector reallocation, and
one that's too large (say, 3 or 4) forces the vector to consume much more
memory than needed.

The initial HP implementation by Stepanov used a
growth factor of 2; i.e., whenever you'd `push_back` into a vector
without there being room, it would double the current capacity. This
was not a good choice: it can be mathematically proven that a growth factor of
2 is rigorously the <i>worst</i> possible because it never allows the vector 
to reuse any of its previously-allocated memory. Despite other compilers
reducing the growth factor to 1.5, gcc has staunchly maintained its factor of
2. This makes `std::vector` cache- unfriendly and memory manager unfriendly.

To see why that's the case, consider a large vector of capacity C.
When there's a request to grow the vector, the vector
(assuming no in-place resizing, see the appropriate section in
this document) will allocate a chunk of memory next to its current chunk,
copy its existing data to the new chunk, and then deallocate the old chunk.
So now we have a chunk of size C followed by a chunk of size k * C. Continuing
this process we'll then have a chunk of size k * k * C to the right and so on.
That leads to a series of the form (using ^^ for power):

    C, C*k,  C*k^^2, C*k^^3, ...

If we choose k = 2 we know that every element in the series will
be strictly larger than the sum of all previous ones because of
the remarkable equality:

    1 + 2^^1 + 2^^2 + 2^^3... + 2^^n = 2^^(n+1) - 1

This means that any new chunk requested will be larger
than all previously used chunks combined, so the vector must
crawl forward in memory; it can't move back to its deallocated chunks.
But any number smaller than 2 guarantees that you'll at some point be 
able to reuse the previous chunks. For instance, choosing 1.5 as the factor
allows memory reuse after 4 reallocations; 1.45 allows memory reuse after 3
reallocations; and 1.3 allows reuse after only 2 reallocations.

Of course, the above makes a number of simplifying assumptions
about how the memory allocator works, but definitely you don't
want to choose the theoretically absolute worst growth factor.
`fbvector` uses a growth factor of 1.5. That does not impede good
performance at small sizes because of the way `fbvector`
cooperates with jemalloc (below).

### The jemalloc Connection
***

Virtually all modern allocators allocate memory in fixed-size
quanta that are chosen to minimize management overhead while at
the same time offering good coverage at low slack. For example, an
allocator may choose blocks of doubling size (32, 64, 128,
<t_co>, ...) up to 4096, and then blocks of size multiples of a
page up until 1MB, and then 512KB increments and so on.

As discussed above, `std::vector` also needs to (re)allocate in
quanta. The next quantum is usually defined in terms of the
current size times the infamous growth constant. Because of this
setup, `std::vector` has some slack memory at the end much like
an allocated block has some slack memory at the end.

It doesn't take a rocket surgeon to figure out that an allocator-
aware `std::vector` would be a marriage made in heaven: the
vector could directly request blocks of "perfect" size from the
allocator so there would be virtually no slack in the allocator.
Also, the entire growth strategy could be adjusted to work
perfectly with allocator's own block growth strategy. That's
exactly what `fbvector` does - it automatically detects the use
of jemalloc and adjusts its reallocation strategy accordingly.

But wait, there's more. Many memory allocators do not support in-
place reallocation, although most of them could. This comes from
the now notorious design of `realloc()` to opaquely perform
either in-place reallocation or an allocate-memcpy-deallocate
cycle. Such lack of control subsequently forced all clib-based
allocator designs to avoid in-place reallocation, and that
includes C++'s `new` and `std::allocator`. This is a major loss of
efficiency because an in-place reallocation, being very cheap,
may mean a much less aggressive growth strategy. In turn that
means less slack memory and faster reallocations.

### Object Relocation
***

One particularly sensitive topic about handling C++ values is
that they are all conservatively considered <i>non-
relocatable</i>. In contrast, a relocatable value would preserve
its invariant even if its bits were moved arbitrarily in memory.
For example, an `int32` is relocatable because moving its 4 bytes
would preserve its actual value, so the address of that value
does not "matter" to its integrity.

C++'s assumption of non-relocatable values hurts everybody for
the benefit of a few questionable designs. The issue is that
moving a C++ object "by the book" entails (a) creating a new copy
from the existing value; (b) destroying the old value. This is
quite vexing and violates common sense; consider this
hypothetical conversation between Captain Picard and an
incredulous alien:

Incredulous Alien: "So, this teleporter, how does it work?"<br>
Picard: "It beams people and arbitrary matter from one place to
another."<br> Incredulous Alien: "Hmmm... is it safe?"<br>
Picard: "Yes, but earlier models were a hassle. They'd clone the
person to another location. Then the teleporting chief would have
to shoot the original. Ask O'Brien, he was an intern during those
times. A bloody mess, that's what it was."

Only a tiny minority of objects are genuinely non-relocatable:

* Objects that use internal pointers, e.g.:

    class Ew {
      char buffer[1024];
      char * pointerInsideBuffer;
    public:
      Ew() : pointerInsideBuffer(buffer) {}
      ...
    }

* Objects that need to update "observers" that store pointers to them.

The first class of designs can always be redone at small or no
cost in efficiency. The second class of objects should not be
values in the first place - they should be allocated with `new`
and manipulated using (smart) pointers. It is highly unusual for
a value to have observers that alias pointers to it.

Relocatable objects are of high interest to `std::vector` because
such knowledge makes insertion into the vector and vector
reallocation considerably faster: instead of going to Picard's
copy-destroy cycle, relocatable objects can be moved around
simply by using `memcpy` or `memmove`. This optimization can
yield arbitrarily high wins in efficiency; for example, it
transforms `vector< vector<double> >` or `vector< hash_map<int,
string> >` from risky liabilities into highly workable
compositions.

In order to allow fast relocation without risk, `fbvector` uses a
trait `folly::IsRelocatable` defined in `"folly/Traits.h"`. By default,
`folly::IsRelocatable::value` conservatively yields false. If
you know that your type `Widget` is in fact relocatable, go right
after `Widget`'s definition and write this:

    // at global namespace level
    namespace folly {
      struct IsRelocatable<Widget> : boost::true_type {};
    }

If you don't do this, `fbvector<Widget>` will fail to compile
with a `static_assert`.

### Miscellaneous
***

`fbvector` uses a careful implementation all around to make
sure it doesn't lose efficiency through the cracks. Some future
directions may be in improving raw memory copying (`memcpy` is
not an intrinsic in gcc and does not work terribly well for
large chunks) and in furthering the collaboration with
jemalloc. Have fun!
