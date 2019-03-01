`folly/SmallLocks.h`
--------------------

This module is currently x64 only.

This header defines two very small mutex types.  These are useful in
highly memory-constrained environments where contention is unlikely.
The purpose of these is to allow fine-grained locking in massive data
structures where memory is at a premium.  Often, each record may have
a spare bit or byte lying around, so sometimes these can be tacked on
with no additional memory cost.

There are two types exported from this header.  `MicroSpinLock` is a
single byte lock, and `PicoSpinLock` can be wrapped around an
integer to use a single bit as a lock.  Why do we have both?
Because you can't use x64 `bts` on a single byte, so
`sizeof(MicroSpinLock)` is smaller than `sizeof(PicoSpinLock)` can
be, giving it some use cases.

Both the locks in this header model the C++11 Lockable concept.  So
you can use `std::lock_guard` or `std::unique_lock` to lock them in an
RAII way if you want.

Additional information is in the header.
