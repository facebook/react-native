`folly/ProducerConsumerQueue.h`
-------------------------------

The `folly::ProducerConsumerQueue` class is a one-producer
one-consumer queue with very low synchronization overhead.

The queue must be created with a fixed maximum size (and allocates
that many cells of sizeof(T)), and it provides just a few simple
operations:

 * `read`: Attempt to read the value at the front to the queue into a variable,
           returns `false` iff queue was empty.
 * `write`: Emplace a value at the end of the queue, returns `false` iff the
            queue was full.
 * `frontPtr`: Retrieve a pointer to the item at the front of the queue, or
               `nullptr` if it is empty.
 * `popFront`: Remove the item from the front of the queue (queue must not be
               empty).
 * `isEmpty`: Check if the queue is empty.
 * `isFull`: Check if the queue is full.
 * `sizeGuess`: Returns the number of entries in the queue. Because of the
                way we coordinate threads, this guess could be slightly wrong
                when called by the producer/consumer thread, and it could be
                wildly inaccurate if called from any other threads. Hence,
                only call from producer/consumer threads!

All of these operations are wait-free.  The read operations (including
`frontPtr` and `popFront`) and write operations must only be called by the
reader and writer thread, respectively. `isFull`, `isEmpty`, and `sizeGuess`
may be called by either thread, but the return values from `read`, `write`, or
`frontPtr` are sufficient for most cases.

`write` may fail if the queue is full, and `read` may fail if the queue is
empty, so in many situations it is important to choose the queue size such that
the queue filling  or staying empty for long is unlikely.

### Example
***

A toy example that doesn't really do anything useful:

``` Cpp
    folly::ProducerConsumerQueue<folly::fbstring> queue{size};

    std::thread reader([&queue] {
      for (;;) {
        folly::fbstring str;
        while (!queue.read(str)) {
          //spin until we get a value
          continue;
        }

        sink(str);
      }
    });

    // producer thread:
    for (;;) {
      folly::fbstring str = source();
      while (!queue.write(str)) {
        //spin until the queue has room
        continue;
      }
    }
```

Alternatively, the consumer may be written as follows to use the 'front' value
in place, thus avoiding moves or copies:

``` Cpp
    std::thread reader([&queue] {
      for (;;) {
        folly::fbstring* pval;
        do {
          pval = queue.frontPtr();
        } while (!pval); // spin until we get a value;

        sink(*pval);
        queue.popFront();
      }
    });
```
