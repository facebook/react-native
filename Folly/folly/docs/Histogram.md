`folly/Histogram.h`
-------------------

### Classes
***

#### `Histogram`

`Histogram.h` defines a simple histogram class, templated on the type of data
you want to store.  This class is useful for tracking a large stream of data
points, where you want to remember the overall distribution of the data, but do
not need to remember each data point individually.

Each histogram bucket stores the number of data points that fell in the bucket,
as well as the overall sum of the data points in the bucket.  Note that no
overflow checking is performed, so if you have a bucket with a large number of
very large values, it may overflow and cause inaccurate data for this bucket.
As such, the histogram class is not well suited to storing data points with
very large values.  However, it works very well for smaller data points such as
request latencies, request or response sizes, etc.

In addition to providing access to the raw bucket data, the `Histogram` class
also provides methods for estimating percentile values.  This allows you to
estimate the median value (the 50th percentile) and other values such as the
95th or 99th percentiles.

All of the buckets have the same width.  The number of buckets and bucket width
is fixed for the lifetime of the histogram.  As such, you do need to know your
expected data range ahead of time in order to have accurate statistics.  The
histogram does keep one bucket to store all data points that fall below the
histogram minimum, and one bucket for the data points above the maximum.
However, because these buckets don't have a good lower/upper bound, percentile
estimates in these buckets may be inaccurate.

#### `HistogramBuckets`

The `Histogram` class is built on top of `HistogramBuckets`.
`HistogramBuckets` provides an API very similar to `Histogram`, but allows a
user-defined bucket class.  This allows users to implement more complex
histogram types that store more than just the count and sum in each bucket.

When computing percentile estimates `HistogramBuckets` allows user-defined
functions for computing the average value and data count in each bucket.  This
allows you to define more complex buckets which may have multiple different
ways of computing the average value and the count.

For example, one use case could be tracking timeseries data in each bucket.
Each set of timeseries data can have independent data in the bucket, which can
show how the data distribution is changing over time.

### Example Usage
***

Say we have code that sends many requests to remote services, and want to
generate a histogram showing how long the requests take.  The following code
will initialize histogram with 50 buckets, tracking values between 0 and 5000.
(There are 50 buckets since the bucket width is specified as 100.  If the
bucket width is not an even multiple of the histogram range, the last bucket
will simply be shorter than the others.)

``` Cpp
    folly::Histogram<int64_t> latencies(100, 0, 5000);
```

The addValue() method is used to add values to the histogram.  Each time a
request finishes we can add its latency to the histogram:

``` Cpp
    latencies.addValue(now - startTime);
```

You can access each of the histogram buckets to display the overall
distribution.  Note that bucket 0 tracks all data points that were below the
specified histogram minimum, and the last bucket tracks the data points that
were above the maximum.

``` Cpp
    unsigned int numBuckets = latencies.getNumBuckets();
    cout << "Below min: " << latencies.getBucketByIndex(0).count << "\n";
    for (unsigned int n = 1; n < numBuckets - 1; ++n) {
      cout << latencies.getBucketMin(n) << "-" << latencies.getBucketMax(n)
           << ": " << latencies.getBucketByIndex(n).count << "\n";
    }
    cout << "Above max: "
         << latencies.getBucketByIndex(numBuckets - 1).count << "\n";
```

You can also use the `getPercentileEstimate()` method to estimate the value at
the Nth percentile in the distribution.  For example, to estimate the median,
as well as the 95th and 99th percentile values:

``` Cpp
    int64_t median = latencies.getPercentileEstimate(0.5);
    int64_t p95 = latencies.getPercentileEstimate(0.95);
    int64_t p99 = latencies.getPercentileEstimate(0.99);
```

### Thread Safety
***

Note that `Histogram` and `HistogramBuckets` objects are not thread-safe.  If
you wish to access a single `Histogram` from multiple threads, you must perform
your own locking to ensure that multiple threads do not access it at the same
time.
