`folly/AtomicHashmap.h`
----------------------

`folly/AtomicHashmap.h` introduces a synchronized UnorderedAssociativeContainer
implementation designed for extreme performance in heavily multithreaded
environments (about 2-5x faster than tbb::concurrent_hash_map) and good memory
usage properties.  Find and iteration are wait-free, insert has key-level lock
granularity, there is minimal memory overhead, and permanent 32-bit ids can be
used to reference each element.


### Limitations
***

Although it can provide extreme performance, AtomicHashmap has some unique
limitations as well.

* The space for erased elements cannot be reclaimed (they are tombstoned
forever) so it's generally not a good idea to use this if you're erasing things
a lot.

* Only supports 32 or 64 bit keys - this is because they must be atomically
compare-and-swap'ed.

* Growth beyond initialization reduces performance - if you don't know
the approximate number of elements you'll be inserting into the map, you
probably shouldn't use this class.

* Must manage synchronization externally in order to modify values in the map
after insertion.  Lock pools are a common way to do this, or you may
consider using `folly::PackedSyncPtr<T>` as your `ValueT`.

* Must define special reserved key values for empty, erased, and locked
elements.

For a complete list of limitations and departures from the
UnorderedAssociativeContainer concept, see `folly/AtomicHashMap.h`


### Unique Features
***

* `value_type` references remain valid as long as the map itself.  Note this is
not true for most other probing hash maps which will move elements when
rehashing, which is necessary for them to grow.  AtomicHashMap grows by chaining
additional slabs, so elements never need to be moved.

* Unique 32-bit ids can be used to reference elements in the map via
`iterator::getIndex()`.  This can be helpful to save memory in the rest of the
application by replacing 64-bit pointers or keys.

* Iterators are never invalidated.  This means you can iterate through the map
while simultaneously inserting and erasing.  This is particularly useful for
non-blocking map serialization.


### Usage
***

Usage is similar to most maps, although note the conspicuous lack of operator[]
which encourages non thread-safe access patterns.

Below is a synchronized key counter implementation that allows the counter
values to be incremented in parallel with serializing all the values to a
string.

```Cpp
   class Counters {
    private:
     AtomicHashMap<int64_t,int64_t> ahm;

    public:
     explicit Counters(size_t numCounters) : ahm(numCounters) {}

     void increment(int64_t obj_id) {
       auto ret = ahm.insert(make_pair(obj_id, 1));
       if (!ret.second) {
         // obj_id already exists, increment
         NoBarrier_AtomicIncrement(&ret.first->second, 1);
       }
     }

     int64_t getValue(int64_t obj_id) {
       auto ret = ahm.find(obj_id);
       return ret != ahm.end() ? ret->second : 0;
     }

     // Serialize the counters without blocking increments
     string toString() {
       string ret = "{\n";
       ret.reserve(ahm.size() * 32);
       for (const auto& e : ahm) {
         ret += folly::to<string>(
           "  [", e.first, ":", NoBarrier_Load(&e.second), "]\n");
       }
       ret += "}\n";
       return ret;
     }
   };
```

### Implementation
***

AtomicHashMap is a composition of AtomicHashArray submaps, which implement the
meat of the functionality.  Only one AHA is created on initialization, and
additional submaps are appended if the first one gets full.  If the AHM grows,
there will be multiple submaps that must be probed in series to find a given
key.  The more growth, the more submaps will be chained, and the slower it will
get.  If the initial size estimate is good, only one submap will ever be created
and performance will be optimal.

AtomicHashArray is a fixed-size probing hash map (also referred to as an open
addressed hash map) where hash collisions are resolved by checking subsequent
elements.  This means that they can be allocated in slabs as arrays of
value_type elements, have excellent cache performance, and have no memory
overhead from storing pointers.

The algorithm is simple - when inserting, the key is hash-mod'ed to an offset,
and that element-key is atomically compare-and-swap'ed with the locked key
value.  If successful, the value is written and the element-key is unlocked by
setting it to the input key value.  If the compare fails, the next element is
tried until success or the map is full.

Finds are even simpler.  The key is hash-mod'ed to an offset, and the
element-key is examined.  If it is the same as the input key, the reference is
returned, if it's the empty key, failure is returned, otherwise the next key is
tried.  This can be done wait-free without any atomic instructions because the
elements are always in a valid state.

Erase is done by finding the key, then compare-and-swap'ing the element-key with
the reserved erased key value.  If the swap succeeds, return success, otherwise
return failure (the element was erased by a competing thread).  If the key does
not exist, return failure.
