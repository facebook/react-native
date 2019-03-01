`folly/PackedSyncPtr.h`
----------------------

A highly specialized data structure consisting of a pointer, a 1-bit
spin lock, and a 15-bit integral packed into `sizeof(void*)`.

Typical application is for microsharding of many elements within containers.
Because there is no memory overhead, an arbitrarily large number of locks can be
used to minimize lock contention with no memory penalty.  Additionally,
excellent cache performance is obtained by storing the lock inline with the
pointer (no additional cache miss or false sharing).  Finally, because it uses a
simple spinlock mechanism, the cost of aqcuiring an uncontended lock is minimal.

### Usage
***

This is not a "smart" pointer: nothing automagical is going on
here.  Locking is up to the user.  Resource deallocation is up to
the user.  Locks are never acquired or released outside explicit
calls to lock() and unlock().

Change the value of the raw pointer with set(), but you must hold
the lock when calling this function if multiple threads could be
using it.

Here is an example of using a PackedSyncPtr to build a synchronized vector with
no memory overhead - the spinlock and size are stored in the 16 unused bits of
pointer, the rest of which points to the actual data.  See
`folly/small_vector.h` for a complete implementation of this concept.

``` Cpp
    template<typename T>
    class SyncVec {
      PackedSyncPtr<T> base;

     public:
      SyncVec() { base.init(); }

      void push_back(const T& t) {
        base.set(
          static_cast<T*>(realloc(base.get(), (base.extra() + 1) * sizeof(T))));
        base[base.extra()] = t;
        base.setExtra(base.extra() + 1);
      }

      size_t size() const {
        return base.extra();
      }

      void lock() {
        base.lock();
      }

      void unlock() {
        base.unlock();
      }

      T* begin() const {
        return base.get();
      }

      T* end() const {
        return base.get() + base.extra();
      }
    };
```

### Implementation
***

This is using an x64-specific detail about the effective virtual
address space.  Long story short: the upper two bytes of all our
pointers will be zero in reality---and if you have a couple billion
such pointers in core, it makes pretty good sense to try to make
use of that memory.  The exact details can be perused here:

[http://en.wikipedia.org/wiki/X86-64#Canonical_form_addresses](http://en.wikipedia.org/wiki/X86-64#Canonical_form_addresses)
