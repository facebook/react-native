`gdb` scripts
-----------

This directory contains a collection of `gdb` scripts that we have found helpful.
These scripts use the [gdb extension Python API](https://sourceware.org/gdb/current/onlinedocs/gdb/Python.html#Python).

### How to run the scripts

To run the scripts, fire up `gdb` and load a script with `source -v`. Example:

```lang=bash
$ gdb -p 123456
(gdb) source -v ./folly/experimental/gdb/deadlock.py
Type "deadlock" to detect deadlocks.
# At this point, any new commands defined in `deadlock.py` are available.
(gdb) deadlock
Found deadlock!
...
```

### What does each script do?

#### `deadlock.py` - Detect deadlocks

Consider the following program that always deadlocks:

```lang=cpp
void deadlock3() {
  std::mutex m1, m2, m3;
  folly::Baton<> b1, b2, b3;

  auto t1 = std::thread([&m1, &m2, &b1, &b2] {
    std::lock_guard<std::mutex> g1(m1);
    b1.post();
    b2.wait();
    std::lock_guard<std::mutex> g2(m2);
  });

  auto t2 = std::thread([&m3, &m2, &b3, &b2] {
    std::lock_guard<std::mutex> g2(m2);
    b2.post();
    b3.wait();
    std::lock_guard<std::mutex> g3(m3);
  });

  auto t3 = std::thread([&m3, &m1, &b3, &b1] {
    std::lock_guard<std::mutex> g3(m3);
    b3.post();
    b1.wait();
    std::lock_guard<std::mutex> g1(m1);
  });

  t1.join();
  t2.join();
  t3.join();
}
```

The `deadlock.py` script introduces a new `deadlock` command that can help
us identify the threads and mutexes involved with the deadlock.

```lang=bash
$ gdb -p 2174496
(gdb) source -v ./folly/experimental/gdb/deadlock.py
Type "deadlock" to detect deadlocks.
(gdb) deadlock
Found deadlock!
Thread 2 (LWP 2174497) is waiting on mutex (0x00007ffcff42a4c0) held by Thread 3 (LWP 2174498)
Thread 3 (LWP 2174498) is waiting on mutex (0x00007ffcff42a4f0) held by Thread 4 (LWP 2174499)
Thread 4 (LWP 2174499) is waiting on mutex (0x00007ffcff42a490) held by Thread 2 (LWP 2174497)
```

NOTE: This script only works on Linux and requires debug symbols to be installed
for the `pthread` library.
