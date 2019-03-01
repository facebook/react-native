`folly/Benchmark.h`
-----------------

`folly/Benchmark.h` provides a simple framework for writing and
executing benchmarks. Currently the framework targets only
single-threaded testing (though you can internally use fork-join
parallelism and measure total run time).

To use this library, you need to be using gcc 4.6 or later. Include
`folly/Benchmark.h` and make sure `folly/benchmark.cpp` is part of the
build (either directly or packaged with a library).

### Overview
***

Using `folly/Benchmark.h` is very simple. Here's an example:

``` Cpp
    #include <folly/Benchmark.h>
    #include <folly/Foreach.h>
    #include <vector>
    using namespace std;
    using namespace folly;
    BENCHMARK(insertFrontVector) {
      // Let's insert 100 elements at the front of a vector
      vector<int> v;
      FOR_EACH_RANGE (i, 0, 100) {
        v.insert(v.begin(), i);
      }
    }
    BENCHMARK(insertBackVector) {
      // Let's insert 100 elements at the back of a vector
      vector<int> v;
      FOR_EACH_RANGE (i, 0, 100) {
        v.insert(v.end(), i);
      }
    }
    int main() {
      runBenchmarks();
    }
```

Compiling and running this code produces to the standard output:

```
    ===============================================================================
    test.cpp                                              relative ns/iter  iters/s
    ===============================================================================
    insertFrontVector                                                3.84K  260.38K
    insertBackVector                                                 1.61K  622.75K
    ===============================================================================
```

Let's worry about the empty column "relative" later. The table
contains, for each benchmark, the time spent per call and the converse
number of calls per second. Numbers are represented in metric notation
(K for thousands, M for millions etc). As expected, in this example
the second function is much faster (fewer ns/iter and more iters/s).

The macro `BENCHMARK` introduces a function and also adds it to an
internal array containing all benchmarks in the system. The defined
function takes no arguments and returns `void`.

The framework calls the function many times to collect statistics
about it. Sometimes the function itself would want to do that
iteration---for example how about inserting `n` elements instead of
100 elements? To do the iteration internally, use `BENCHMARK` with two
parameters. The second parameter is the number of iterations and is
passed by the framework down to the function. The type of the count is
implicitly `unsigned`. Consider a slightly reworked example:

``` Cpp
    #include <folly/Benchmark.h>
    #include <folly/Foreach.h>
    #include <vector>
    using namespace std;
    using namespace folly;
    BENCHMARK(insertFrontVector, n) {
      vector<int> v;
      FOR_EACH_RANGE (i, 0, n) {
        v.insert(v.begin(), i);
      }
    }
    BENCHMARK(insertBackVector, n) {
      vector<int> v;
      FOR_EACH_RANGE (i, 0, n) {
        v.insert(v.end(), i);
      }
    }
    int main() {
      runBenchmarks();
    }
```

The produced numbers are substantially different:

```
    ===============================================================================
    Benchmark                                             relative ns/iter  iters/s
    ===============================================================================
    insertFrontVector                                               39.92    25.05M
    insertBackVector                                                 3.46   288.89M
    ===============================================================================
```

Now the numbers indicate the speed of one single insertion because the
framework assumed the user-defined function used internal iteration
(which it does). So inserting at the back of a vector is more than 10
times faster than inserting at the front! Speaking of comparisons...

### Baselines
***

Choosing one or more good baselines is a crucial activity in any
measurement. Without a baseline there is little information to derive
from the sheer numbers. If, for example, you do experimentation with
algorithms, a good baseline is often an established approach (e.g. the
built-in `std::sort` for sorting). Essentially all experimental
numbers should be compared against some baseline.

To support baseline-driven measurements, `folly/Benchmark.h` defines
`BENCHMARK_RELATIVE`, which works much like `BENCHMARK`, except it
considers the most recent lexically-ocurring `BENCHMARK` a baseline,
and fills the "relative" column. Say, for example, we want to use
front insertion for a vector as a baseline and see how back insertion
compares with it:

``` Cpp
    #include <folly/Benchmark.h>
    #include <folly/Foreach.h>
    #include <vector>
    using namespace std;
    using namespace folly;
    BENCHMARK(insertFrontVector, n) {
      vector<int> v;
      FOR_EACH_RANGE (i, 0, n) {
        v.insert(v.begin(), i);
      }
    }
    BENCHMARK_RELATIVE(insertBackVector, n) {
      vector<int> v;
      FOR_EACH_RANGE (i, 0, n) {
        v.insert(v.end(), i);
      }
    }
    int main() {
      runBenchmarks();
    }
```

This program prints something like:

```
    ===============================================================================
    Benchmark                                             relative ns/iter  iters/s
    ===============================================================================
    insertFrontVector                                               42.65    23.45M
    insertBackVector                                     1208.24%    3.53   283.30M
    ===============================================================================
```

showing the 1208.24% relative speed advantage of inserting at the back
compared to front. The scale is chosen in such a way that 100% means
identical speed, numbers smaller than 100% indicate the benchmark is
slower than the baseline, and numbers greater than 100% indicate the
benchmark is faster. For example, if you see 42% that means the speed
of the benchmark is 0.42 of the baseline speed. If you see 123%, it
means the benchmark is 23% or 1.23 times faster.

To close the current benchmark group and start another, simply use
`BENCHMARK` again.

### Ars Gratia Artis
***

If you want to draw a horizontal line of dashes (e.g. at the end of a
group or for whatever reason), use `BENCHMARK_DRAW_LINE()`. The line
fulfills a purely aesthetic role; it doesn't interact with
measurements in any way.

``` Cpp
    BENCHMARK(foo) {
      Foo foo;
      foo.doSomething();
    }

    BENCHMARK_DRAW_LINE();

    BENCHMARK(bar) {
      Bar bar;
      bar.doSomething();
    }
```

### Suspending a benchmark
***

Sometimes benchmarking code must do some preparation work that is
physically inside the benchmark function, but should not take part to
its time budget. To temporarily suspend the benchmark, use the
pseudo-statement `BENCHMARK_SUSPEND` as follows:

``` Cpp
    BENCHMARK(insertBackVector, n) {
      vector<int> v;
      BENCHMARK_SUSPEND {
        v.reserve(n);
      }
      FOR_EACH_RANGE (i, 0, n) {
        v.insert(v.end(), i);
      }
    }
```

The preallocation effected with `v.reserve(n)` will not count toward
the total run time of the benchmark.

Only the main thread should call `BENCHMARK_SUSPEND` (and of course it
should not call it while other threads are doing actual work). This is
because the timer is application-global.

If the scope introduced by `BENCHMARK_SUSPEND` is not desired, you may
want to "manually" use the `BenchmarkSuspender` type. Constructing
such an object suspends time measurement, and destroying it resumes
the measurement. If you want to resume time measurement before the
destructor, call `dismiss` against the `BenchmarkSuspender`
object. The previous example could have been written like this:

``` Cpp
    BENCHMARK(insertBackVector, n) {
      BenchmarkSuspender braces;
      vector<int> v;
      v.reserve(n);
      braces.dismiss();
      FOR_EACH_RANGE (i, 0, n) {
        v.insert(v.end(), i);
      }
    }
```

### `doNotOptimizeAway`
***

Finally, the small utility function `doNotOptimizeAway` prevents
compiler optimizations that may interfere with benchmarking . Call
doNotOptimizeAway(var) against variables that you use for
benchmarking but otherwise are useless. The compiler tends to do a
good job at eliminating unused variables, and this function fools it
into thinking a variable is in fact needed. Example:

``` Cpp
    BENCHMARK(fpOps, n) {
      double d = 1;
      FOR_EACH_RANGE (i, 1, n) {
        d += i;
        d -= i;
        d *= i;
        d /= i;
      }
      doNotOptimizeAway(d);
    }
```

### A look under the hood
***

`folly/Benchmark.h` has a simple, systematic approach to collecting
timings.

First, it organizes measurements in several large epochs, and takes
the minimum over all epochs. Taking the minimum gives the closest
result to the real runtime. Benchmark timings are not a regular random
variable that fluctuates around an average. Instead, the real time
we're looking for is one to which there's a variety of additive noise
(i.e. there is no noise that could actually shorten the benchmark time
below its real value). In theory, taking an infinite amount of samples
and keeping the minimum is the actual time that needs
measuring. That's why the accuracy of benchmarking increases with the
number of epochs.

Clearly, in real functioning there will also be noise and a variety of
effects caused by the running context. But the noise during the
benchmark (straight setup, simple looping) is a poor model for the
noise in the real application. So taking the minimum across several
epochs is the most informative result.

Inside each epoch, the function measured is iterated an increasing
number of times until the total runtime is large enough to make noise
negligible. At that point the time is collected, and the time per
iteration is computed. As mentioned, the minimum time per iteration
over all epochs is the final result.

The timer function used is `clock_gettime` with the `CLOCK_REALTIME`
clock id. Note that you must use a recent Linux kernel (2.6.38 or
newer), otherwise the resolution of `CLOCK_REALTIME` is inadequate.
