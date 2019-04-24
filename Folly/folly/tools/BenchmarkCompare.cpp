/*
 * Copyright 2017-present Facebook, Inc.
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

#include <folly/Benchmark.h>
#include <folly/FileUtil.h>
#include <folly/init/Init.h>
#include <folly/json.h>

using namespace std;

namespace folly {

vector<detail::BenchmarkResult> resultsFromFile(const std::string& filename) {
  string content;
  readFile(filename.c_str(), content);
  vector<detail::BenchmarkResult> ret;
  benchmarkResultsFromDynamic(parseJson(content), ret);
  return ret;
}

void compareBenchmarkResults(const std::string& base, const std::string& test) {
  printResultComparison(resultsFromFile(base), resultsFromFile(test));
}

} // namespace folly

int main(int argc, char** argv) {
  folly::init(&argc, &argv);
  CHECK_GT(argc, 2);
  folly::compareBenchmarkResults(argv[1], argv[2]);
  return 0;
}
