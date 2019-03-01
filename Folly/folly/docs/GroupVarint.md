`folly/GroupVarint.h`
---------------------

`folly/GroupVarint.h` is an implementation of variable-length encoding for 32-
and 64-bit integers using the Group Varint encoding scheme as described in
Jeff Dean's [WSDM 2009 talk][wsdm] and in [Information Retrieval: Implementing
and Evaluating Search Engines][irbook].

[wsdm]: http://research.google.com/people/jeff/WSDM09-keynote.pdf
[irbook]: http://www.ir.uwaterloo.ca/book/addenda-06-index-compression.html

Briefly, a group of four 32-bit integers is encoded as a sequence of variable
length, between 5 and 17 bytes; the first byte encodes the length (in bytes)
of each integer in the group.  A group of five 64-bit integers is encoded as a
sequence of variable length, between 7 and 42 bytes; the first two bytes
encode the length (in bytes) of each integer in the group.

`GroupVarint.h` defines a few classes:

* `GroupVarint<T>`, where `T` is `uint32_t` or `uint64_t`:

    Basic encoding / decoding interface, mainly aimed at encoding / decoding
    one group at a time.

* `GroupVarintEncoder<T, Output>`, where `T` is `uint32_t` or `uint64_t`,
  and `Output` is a functor that accepts `StringPiece` objects as arguments:

    Streaming encoder: add values one at a time, and they will be
    flushed to the output one group at a time.  Handles the case where
    the last group is incomplete (the number of integers to encode isn't
    a multiple of the group size)

* `GroupVarintDecoder<T>`, where `T` is `uint32_t` or `uint64_t`:

    Streaming decoder: extract values one at a time.  Handles the case where
    the last group is incomplete.

The 32-bit implementation is significantly faster than the 64-bit
implementation; on platforms supporting the SSSE3 instruction set, we
use the PSHUFB instruction to speed up lookup, as described in [SIMD-Based
Decoding of Posting Lists][cikmpaper] (CIKM 2011).

[cikmpaper]: http://www.stepanovpapers.com/CIKM_2011.pdf

For more details, see the header file `folly/GroupVarint.h` and the
associated test file `folly/test/GroupVarintTest.cpp`.
