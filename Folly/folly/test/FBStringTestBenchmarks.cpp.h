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
 * FBStringTest. Do not use otherwise.
 *
 * override-include-guard
 */

void BENCHFUN(initRNG)(size_t /* iters */, size_t) {
  srand(seed);
}
BENCHMARK_PARAM(BENCHFUN(initRNG), 0)

void BENCHFUN(defaultCtor)(size_t iters, size_t) {
  FOR_EACH_RANGE (i, 0, iters) {
    STRING s[4096];
    doNotOptimizeAway(&s);
  }
}
BENCHMARK_PARAM(BENCHFUN(defaultCtor), 0)

void BENCHFUN(copyCtor)(size_t iters, size_t arg) {
  STRING s;
  BENCHMARK_SUSPEND {
    randomString(&s, arg);
  }
  FOR_EACH_RANGE (i, 0, iters) {
    STRING s1 = s;
    doNotOptimizeAway(&s1);
  }
}
BENCHMARK_PARAM(BENCHFUN(copyCtor), 32768)

void BENCHFUN(ctorFromArray)(size_t iters, size_t arg) {
  STRING s;
  BENCHMARK_SUSPEND {
    randomString(&s, arg);
    if (s.empty()) {
      s = "This is rare.";
    }
  }
  FOR_EACH_RANGE (i, 0, iters) {
    STRING s1(s.data(), s.size());
    doNotOptimizeAway(&s1);
  }
}
BENCHMARK_PARAM(BENCHFUN(ctorFromArray), 32768)

void BENCHFUN(ctorFromTwoPointers)(size_t iters, size_t arg) {
  /* library-local */ static STRING s;
  BENCHMARK_SUSPEND {
    if (s.size() < arg) {
      s.resize(arg);
    }
  }
  FOR_EACH_RANGE (i, 0, iters) {
    STRING s1(s.begin(), s.end());
    doNotOptimizeAway(&s1);
  }
}
BENCHMARK_PARAM(BENCHFUN(ctorFromTwoPointers), 0)
BENCHMARK_PARAM(BENCHFUN(ctorFromTwoPointers), 7)
BENCHMARK_PARAM(BENCHFUN(ctorFromTwoPointers), 15)
BENCHMARK_PARAM(BENCHFUN(ctorFromTwoPointers), 23)
BENCHMARK_PARAM(BENCHFUN(ctorFromTwoPointers), 24)

void BENCHFUN(ctorFromChar)(size_t iters, size_t arg) {
  FOR_EACH_RANGE (i, 0, iters) {
    STRING s1('a', arg);
    doNotOptimizeAway(&s1);
  }
}
BENCHMARK_PARAM(BENCHFUN(ctorFromChar), 1048576)

void BENCHFUN(assignmentOp)(size_t iters, size_t arg) {
  STRING s;
  BENCHMARK_SUSPEND {
    randomString(&s, arg);
  }
  FOR_EACH_RANGE (i, 0, iters) {
    STRING s1;
    BENCHMARK_SUSPEND {
      randomString(&s1, arg);
      doNotOptimizeAway(&s1);
    }
    s1 = s;
  }
}
BENCHMARK_PARAM(BENCHFUN(assignmentOp), 256)

void BENCHFUN(assignmentFill)(size_t iters, size_t) {
  STRING s;
  FOR_EACH_RANGE (i, 0, iters) {
    s = static_cast<char>(i);
    doNotOptimizeAway(&s);
  }
}
BENCHMARK_PARAM(BENCHFUN(assignmentFill), 0)

void BENCHFUN(resize)(size_t iters, size_t arg) {
  STRING s;
  FOR_EACH_RANGE (i, 0, iters) {
    s.resize(random(0, arg));
    doNotOptimizeAway(&s);
  }
}
BENCHMARK_PARAM(BENCHFUN(resize), 524288)

void BENCHFUN(findSuccessful)(size_t iters, size_t /* arg */) {
  size_t pos, len;
  STRING s;

  BENCHMARK_SUSPEND {
    // Text courtesy (ahem) of
    // http://www.psychologytoday.com/blog/career-transitions/200906/
    // the-dreaded-writing-sample
    s = "\
Even if you've mastered the art of the cover letter and the resume, \
another part of the job search process can trip up an otherwise \
qualified candidate: the writing sample.\n\
\n\
Strong writing and communication skills are highly sought after by \
most employers. Whether crafting short emails or lengthy annual \
reports, many workers use their writing skills every day. And for an \
employer seeking proof behind that ubiquitous candidate \
phrase,\"excellent communication skills\", a required writing sample \
is invaluable.\n\
\n\
Writing samples need the same care and attention given to cover \
letters and resumes. Candidates with otherwise impeccable credentials \
are routinely eliminated by a poorly chosen writing sample. Notice I \
said \"poorly chosen\" not \"poorly written.\" Because that's the rub: \
a writing sample not only reveals the individual's writing skills, it \
also offers a peek into what they consider important or relevant for \
the position. If you miss that mark with your writing sample, don't \
expect to get a call for an interview.";

    pos = random(0, s.size());
    len = random(0, s.size() - pos);
  }
  FOR_EACH_RANGE (i, 0, iters) {
    doNotOptimizeAway(s.find(s.data(), pos, len));
  }
}
BENCHMARK_PARAM(BENCHFUN(findSuccessful), 524288)

void BENCHFUN(findUnsuccessful)(size_t iters, size_t /* arg */) {
  STRING s, s1;

  BENCHMARK_SUSPEND {
    s = "\
Even if you've mastered the art of the cover letter and the resume, \
another part of the job search process can trip up an otherwise \
qualified candidate: the writing sample.\n\
\n\
Strong writing and communication skills are highly sought after by \
most employers. Whether crafting short emails or lengthy annual \
reports, many workers use their writing skills every day. And for an \
employer seeking proof behind that ubiquitous candidate \
phrase,\"excellent communication skills\", a required writing sample \
is invaluable.\n\
\n\
Writing samples need the same care and attention given to cover \
letters and resumes. Candidates with otherwise impeccable credentials \
are routinely eliminated by a poorly chosen writing sample. Notice I \
said \"poorly chosen\" not \"poorly written.\" Because that's the rub: \
a writing sample not only reveals the individual's writing skills, it \
also offers a peek into what they consider important or relevant for \
the position. If you miss that mark with your writing sample, don't \
expect to get a call for an interview.";

    s1 = "So how do you tackle that writing sample request?";
  }

  FOR_EACH_RANGE (i, 0, iters) { doNotOptimizeAway(s.find(s1)); }
}
BENCHMARK_PARAM(BENCHFUN(findUnsuccessful), 524288)

void BENCHFUN(equality)(size_t iters, size_t arg) {
  std::vector<STRING> haystack(arg);

  BENCHMARK_SUSPEND {
    for (auto& hay : haystack) {
      randomBinaryString(&hay, 1024);
    }
  }

  FOR_EACH_RANGE (i, 0, iters) {
    STRING needle;
    randomBinaryString(&needle, 1024);
    doNotOptimizeAway(std::find(haystack.begin(), haystack.end(), needle));
  }
}
BENCHMARK_PARAM(BENCHFUN(equality), 65536)

void BENCHFUN(replace)(size_t iters, size_t arg) {
  STRING s;
  BENCHMARK_SUSPEND {
    randomString(&s, arg);
  }
  FOR_EACH_RANGE (i, 0, iters) {
    BenchmarkSuspender susp;
    doNotOptimizeAway(&s);
    auto const pos = random(0, s.size());
    auto toRemove = random(0, s.size() - pos);
    auto toInsert = random(0, arg);
    STRING s1;
    randomString(&s1, toInsert);
    susp.dismiss();

    s.replace(pos, toRemove, s1);
  }
}
BENCHMARK_PARAM(BENCHFUN(replace), 256)

void BENCHFUN(push_back)(size_t iters, size_t arg) {
  FOR_EACH_RANGE (i, 0, iters) {
    STRING s;
    FOR_EACH_RANGE (j, 0, arg) { s += ' '; }
  }
}
BENCHMARK_PARAM(BENCHFUN(push_back), 1)
BENCHMARK_PARAM(BENCHFUN(push_back), 23)
BENCHMARK_PARAM(BENCHFUN(push_back), 127)
BENCHMARK_PARAM(BENCHFUN(push_back), 1024)

void BENCHFUN(short_append)(size_t iters, size_t arg) {
  FOR_EACH_RANGE (i, 0, iters) {
    STRING s;
    FOR_EACH_RANGE (j, 0, arg) { s += "012"; }
  }
}
BENCHMARK_PARAM(BENCHFUN(short_append), 23)
BENCHMARK_PARAM(BENCHFUN(short_append), 1024)

void BENCHFUN(getline)(size_t iters, size_t arg) {
  string lines;

  BENCHMARK_SUSPEND {
    string line;
    FOR_EACH_RANGE (i, 0, 512) {
      randomString(&line, arg);
      lines += line;
      lines += '\n';
    }
  }

  STRING line;
  while (iters) {
    std::istringstream is(lines);
    while (iters && getline(is, line)) {
      folly::doNotOptimizeAway(line.size());
      iters--;
    }
  }
}
BENCHMARK_PARAM(BENCHFUN(getline), 23)
BENCHMARK_PARAM(BENCHFUN(getline), 1000)
