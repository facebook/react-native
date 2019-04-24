/*
 * Copyright 2013-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <vector>

#include <folly/Benchmark.h>
#include <folly/io/Cursor.h>
#include <folly/io/IOBuf.h>
#include <folly/portability/GFlags.h>

using folly::IOBuf;
using std::unique_ptr;
using namespace folly::io;
using namespace std;

size_t buf_size = 0;
size_t num_bufs = 0;

BENCHMARK(reserveBenchmark, iters) {
  while (iters--) {
    unique_ptr<IOBuf> iobuf1(IOBuf::create(buf_size));
    iobuf1->append(buf_size);
    for (size_t bufs = num_bufs; bufs > 1; bufs--) {
      iobuf1->reserve(0, buf_size);
      iobuf1->append(buf_size);
    }
  }
}

BENCHMARK(chainBenchmark, iters) {
  while (iters--) {
    unique_ptr<IOBuf> iobuf1(IOBuf::create(buf_size));
    iobuf1->append(buf_size);
    for (size_t bufs = num_bufs; bufs > 1; bufs--) {
      unique_ptr<IOBuf> iobufNext(IOBuf::create(buf_size));
      iobuf1->prependChain(std::move(iobufNext));
    }
  }
}

vector<unique_ptr<IOBuf>> bufPool;
inline unique_ptr<IOBuf> poolGetIOBuf() {
  if (bufPool.size() > 0) {
    unique_ptr<IOBuf> ret = std::move(bufPool.back());
    bufPool.pop_back();
    return ret;
  } else {
    unique_ptr<IOBuf> iobuf(IOBuf::create(buf_size));
    iobuf->append(buf_size);
    return iobuf;
  }
}

inline void poolPutIOBuf(unique_ptr<IOBuf>&& buf) {
  unique_ptr<IOBuf> head = std::move(buf);
  while (head) {
    unique_ptr<IOBuf> next = head->pop();
    bufPool.push_back(std::move(head));
    head = std::move(next);
  }
}

BENCHMARK(poolBenchmark, iters) {
  while (iters--) {
    unique_ptr<IOBuf> head = poolGetIOBuf();
    for (size_t bufs = num_bufs; bufs > 1; bufs--) {
      unique_ptr<IOBuf> iobufNext = poolGetIOBuf();
      head->prependChain(std::move(iobufNext));
    }
    // cleanup
    poolPutIOBuf(std::move(head));
  }
}

void setNumbers(size_t size, size_t num) {
  buf_size = size;
  num_bufs = num;
  bufPool.clear();

  printf("\nBuffer size: %zu, number of buffers: %zu\n\n", size, num);
}

/*
------------------------------------------------------------------------------
reserveBenchmark                       100000  9.186 ms  91.86 ns  10.38 M
chainBenchmark                         100000  59.44 ms  594.4 ns  1.604 M
poolBenchmark                          100000  15.87 ms  158.7 ns   6.01 M

Buffer size: 100, number of buffers: 10

Benchmark                               Iters   Total t    t/iter iter/sec
------------------------------------------------------------------------------
reserveBenchmark                       100000     62 ms    620 ns  1.538 M
chainBenchmark                         100000  59.48 ms  594.8 ns  1.603 M
poolBenchmark                          100000  16.07 ms  160.7 ns  5.933 M

Buffer size: 2048, number of buffers: 10

Benchmark                               Iters   Total t    t/iter iter/sec
------------------------------------------------------------------------------
reserveBenchmark                       100000  148.4 ms  1.484 us  658.2 k
chainBenchmark                         100000  140.9 ms  1.409 us    693 k
poolBenchmark                          100000  16.73 ms  167.3 ns    5.7 M

Buffer size: 10000, number of buffers: 10

Benchmark                               Iters   Total t    t/iter iter/sec
------------------------------------------------------------------------------
reserveBenchmark                       100000    234 ms   2.34 us  417.3 k
chainBenchmark                         100000  142.3 ms  1.423 us  686.1 k
poolBenchmark                          100000  16.78 ms  167.8 ns  5.684 M

Buffer size: 100000, number of buffers: 10

Benchmark                               Iters   Total t    t/iter iter/sec
------------------------------------------------------------------------------
reserveBenchmark                       100000  186.5 ms  1.865 us  523.5 k
chainBenchmark                         100000  360.5 ms  3.605 us  270.9 k
poolBenchmark                          100000  16.52 ms  165.2 ns  5.772 M

Buffer size: 1000000, number of buffers: 10

Benchmark                               Iters   Total t    t/iter iter/sec
------------------------------------------------------------------------------
reserveBenchmark                          156  2.084 s   13.36 ms  74.84
chainBenchmark                          30082  2.001 s    66.5 us  14.68 k
poolBenchmark                          100000  18.18 ms  181.8 ns  5.244 M


Buffer size: 10, number of buffers: 20

Benchmark                               Iters   Total t    t/iter iter/sec
------------------------------------------------------------------------------
reserveBenchmark                       100000  12.54 ms  125.4 ns  7.603 M
chainBenchmark                         100000  118.6 ms  1.186 us  823.2 k
poolBenchmark                          100000   32.2 ms    322 ns  2.962 M
*/
int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);

  setNumbers(10, 10);
  folly::runBenchmarks();
  setNumbers(100, 10);
  folly::runBenchmarks();
  setNumbers(2048, 10);
  folly::runBenchmarks();
  setNumbers(10000, 10);
  folly::runBenchmarks();
  setNumbers(100000, 10);
  folly::runBenchmarks();
  setNumbers(1000000, 10);
  folly::runBenchmarks();

  setNumbers(10, 20);
  folly::runBenchmarks();

  return 0;
}
