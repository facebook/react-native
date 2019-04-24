/*
 * Copyright 2011-present Facebook, Inc.
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

/**
 * This file is supposed to be included from within
 * FBVectorBenchmark. Do not use otherwise.
 */

BENCHMARK(BENCHFUN(zzInitRNG)) {
  srand(seed);
}

BENCHMARK(BENCHFUN(defaultCtor), iters) {
  FOR_EACH_RANGE (i, 0, iters) {
    VECTOR v;
    doNotOptimizeAway(&v);
  }
}

void BENCHFUN(sizeCtor)(int iters, int size) {
  FOR_EACH_RANGE (i, 0, iters) {
    VECTOR v(size);
    doNotOptimizeAway(&v);
  }
}
BENCHMARK_PARAM(BENCHFUN(sizeCtor), 16)
BENCHMARK_PARAM(BENCHFUN(sizeCtor), 128)
BENCHMARK_PARAM(BENCHFUN(sizeCtor), 1024)

void BENCHFUN(fillCtor)(int iters, int size) {
  FOR_EACH_RANGE (i, 0, iters) {
    VECTOR v(size_t(size), randomObject<VECTOR::value_type>());
    doNotOptimizeAway(&v);
  }
}
BENCHMARK_PARAM(BENCHFUN(fillCtor), 16)
BENCHMARK_PARAM(BENCHFUN(fillCtor), 128)
BENCHMARK_PARAM(BENCHFUN(fillCtor), 1024)

#ifndef SKIP_RESERVE
void BENCHFUN(reserve)(int iters, int size) {
  auto const obj = randomObject<VECTOR::value_type>();
  FOR_EACH_RANGE (i, 0, iters) {
    VECTOR v(random(0U, 1U), obj);
    v.reserve(size);
  }
}
BENCHMARK_PARAM(BENCHFUN(reserve), 16)
BENCHMARK_PARAM(BENCHFUN(reserve), 128)
BENCHMARK_PARAM(BENCHFUN(reserve), 1024)
#endif

void BENCHFUN(insertFront)(int iters, int initialSize) {
  BenchmarkSuspender braces;
  auto const obj = randomObject<VECTOR::value_type>();
  VECTOR v(initialSize, obj);
  braces.dismissing([&]() {
    FOR_EACH_RANGE (i, 0, iters) { v.insert(v.begin(), obj); }
  });
}

BENCHMARK_PARAM(BENCHFUN(insertFront), 16)
BENCHMARK_PARAM(BENCHFUN(insertFront), 128)
BENCHMARK_PARAM(BENCHFUN(insertFront), 1024)
BENCHMARK_PARAM(BENCHFUN(insertFront), 10240)
BENCHMARK_PARAM(BENCHFUN(insertFront), 102400)
BENCHMARK_PARAM(BENCHFUN(insertFront), 1024000)

void BENCHFUN(pushBack)(int iters, int initialSize) {
  BenchmarkSuspender braces;
  auto const obj = randomObject<VECTOR::value_type>();
  VECTOR v(initialSize, obj);
  braces.dismissing([&]() {
    FOR_EACH_RANGE (i, 0, iters) { v.push_back(obj); }
  });
}

BENCHMARK_PARAM(BENCHFUN(pushBack), 16)
BENCHMARK_PARAM(BENCHFUN(pushBack), 128)
BENCHMARK_PARAM(BENCHFUN(pushBack), 1024)
BENCHMARK_PARAM(BENCHFUN(pushBack), 10240)
BENCHMARK_PARAM(BENCHFUN(pushBack), 102400)
BENCHMARK_PARAM(BENCHFUN(pushBack), 1024000)
