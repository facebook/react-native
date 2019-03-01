// Copyright (c) 2003, Google Inc.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

#include "config.h"

#ifdef HAVE_USING_OPERATOR

#include <functional>
#include <iostream>
#include <map>
#include <ostream>
#include <string>
#include <vector>

#ifdef __GNUC__
// C++0x isn't enabled by default in GCC and libc++ does not have
// non-standard ext/* and tr1/unordered_*.
# if defined(_LIBCPP_VERSION)
#  ifndef GLOG_STL_LOGGING_FOR_UNORDERED
#  define GLOG_STL_LOGGING_FOR_UNORDERED
#  endif
# else
#  ifndef GLOG_STL_LOGGING_FOR_EXT_HASH
#  define GLOG_STL_LOGGING_FOR_EXT_HASH
#  endif
#  ifndef GLOG_STL_LOGGING_FOR_EXT_SLIST
#  define GLOG_STL_LOGGING_FOR_EXT_SLIST
#  endif
#  ifndef GLOG_STL_LOGGING_FOR_TR1_UNORDERED
#  define GLOG_STL_LOGGING_FOR_TR1_UNORDERED
#  endif
# endif
#endif

#include "glog/logging.h"
#include "glog/stl_logging.h"
#include "googletest.h"

using namespace std;
#ifdef GLOG_STL_LOGGING_FOR_EXT_HASH
using namespace __gnu_cxx;
#endif

struct user_hash {
  size_t operator()(int x) const { return x; }
};

void TestSTLLogging() {
  {
    // Test a sequence.
    vector<int> v;
    v.push_back(10);
    v.push_back(20);
    v.push_back(30);
    ostringstream ss;
    ss << v;
    EXPECT_EQ(ss.str(), "10 20 30");
    vector<int> copied_v(v);
    CHECK_EQ(v, copied_v);  // This must compile.
  }

  {
    // Test a sorted pair associative container.
    map< int, string > m;
    m[20] = "twenty";
    m[10] = "ten";
    m[30] = "thirty";
    ostringstream ss;
    ss << m;
    EXPECT_EQ(ss.str(), "(10, ten) (20, twenty) (30, thirty)");
    map< int, string > copied_m(m);
    CHECK_EQ(m, copied_m);  // This must compile.
  }

#ifdef GLOG_STL_LOGGING_FOR_EXT_HASH
  {
    // Test a hashed simple associative container.
    hash_set<int> hs;
    hs.insert(10);
    hs.insert(20);
    hs.insert(30);
    ostringstream ss;
    ss << hs;
    EXPECT_EQ(ss.str(), "10 20 30");
    hash_set<int> copied_hs(hs);
    CHECK_EQ(hs, copied_hs);  // This must compile.
  }
#endif

#ifdef GLOG_STL_LOGGING_FOR_EXT_HASH
  {
    // Test a hashed pair associative container.
    hash_map<int, string> hm;
    hm[10] = "ten";
    hm[20] = "twenty";
    hm[30] = "thirty";
    ostringstream ss;
    ss << hm;
    EXPECT_EQ(ss.str(), "(10, ten) (20, twenty) (30, thirty)");
    hash_map<int, string> copied_hm(hm);
    CHECK_EQ(hm, copied_hm);  // this must compile
  }
#endif

  {
    // Test a long sequence.
    vector<int> v;
    string expected;
    for (int i = 0; i < 100; i++) {
      v.push_back(i);
      if (i > 0) expected += ' ';
      char buf[256];
      sprintf(buf, "%d", i);
      expected += buf;
    }
    v.push_back(100);
    expected += " ...";
    ostringstream ss;
    ss << v;
    CHECK_EQ(ss.str(), expected.c_str());
  }

  {
    // Test a sorted pair associative container.
    // Use a non-default comparison functor.
    map< int, string, greater<int> > m;
    m[20] = "twenty";
    m[10] = "ten";
    m[30] = "thirty";
    ostringstream ss;
    ss << m;
    EXPECT_EQ(ss.str(), "(30, thirty) (20, twenty) (10, ten)");
    map< int, string, greater<int> > copied_m(m);
    CHECK_EQ(m, copied_m);  // This must compile.
  }

#ifdef GLOG_STL_LOGGING_FOR_EXT_HASH
  {
    // Test a hashed simple associative container.
    // Use a user defined hash function.
    hash_set<int, user_hash> hs;
    hs.insert(10);
    hs.insert(20);
    hs.insert(30);
    ostringstream ss;
    ss << hs;
    EXPECT_EQ(ss.str(), "10 20 30");
    hash_set<int, user_hash> copied_hs(hs);
    CHECK_EQ(hs, copied_hs);  // This must compile.
  }
#endif
}

int main(int, char**) {
  TestSTLLogging();
  std::cout << "PASS\n";
  return 0;
}

#else

#include <iostream>

int main(int, char**) {
  std::cout << "We don't support stl_logging for this compiler.\n"
            << "(we need compiler support of 'using ::operator<<' "
            << "for this feature.)\n";
  return 0;
}

#endif  // HAVE_USING_OPERATOR
