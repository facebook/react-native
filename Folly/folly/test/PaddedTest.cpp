/*
 * Copyright 2017 Facebook, Inc.
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

#include <folly/Padded.h>

#include <glog/logging.h>

#include <folly/portability/GTest.h>

using namespace folly;

TEST(NodeTest, Padding) {
  typedef padded::Node<int32_t, 64> IntNode;
  EXPECT_EQ(16, IntNode::kElementCount);
  EXPECT_EQ(0, IntNode::kPaddingBytes);
  EXPECT_EQ(alignof(int32_t), alignof(IntNode));
  EXPECT_EQ(64, sizeof(IntNode));
  EXPECT_EQ(0, IntNode::nodeCount(0));
  EXPECT_EQ(0, IntNode::paddedByteSize(0));
  EXPECT_EQ(0, IntNode::unpaddedByteSize(0));
  EXPECT_EQ(1, IntNode::nodeCount(1));
  EXPECT_EQ(64, IntNode::paddedByteSize(1));
  EXPECT_EQ(4, IntNode::unpaddedByteSize(1));
  EXPECT_EQ(1, IntNode::nodeCount(16));
  EXPECT_EQ(64, IntNode::paddedByteSize(16));
  EXPECT_EQ(64, IntNode::unpaddedByteSize(16));
  EXPECT_EQ(2, IntNode::nodeCount(17));
  EXPECT_EQ(128, IntNode::paddedByteSize(17));
  EXPECT_EQ(68, IntNode::unpaddedByteSize(17));
  EXPECT_EQ(128, IntNode::paddedByteSize(32));
  EXPECT_EQ(128, IntNode::unpaddedByteSize(32));
  EXPECT_EQ(3, IntNode::nodeCount(33));
  EXPECT_EQ(192, IntNode::paddedByteSize(33));
  EXPECT_EQ(132, IntNode::unpaddedByteSize(33));

  struct SevenBytes {
    char c[7];
  };
  EXPECT_EQ(1, alignof(SevenBytes));
  typedef padded::Node<SevenBytes, 64> SevenByteNode;
  EXPECT_EQ(9, SevenByteNode::kElementCount);  // 64 / 7
  EXPECT_EQ(1, SevenByteNode::kPaddingBytes);  // 64 % 7
  EXPECT_EQ(1, alignof(SevenByteNode));
  EXPECT_EQ(64, sizeof(SevenByteNode));
  EXPECT_EQ(0, SevenByteNode::nodeCount(0));
  EXPECT_EQ(0, SevenByteNode::paddedByteSize(0));
  EXPECT_EQ(0, SevenByteNode::unpaddedByteSize(0));
  EXPECT_EQ(1, SevenByteNode::nodeCount(1));
  EXPECT_EQ(64, SevenByteNode::paddedByteSize(1));
  EXPECT_EQ(7, SevenByteNode::unpaddedByteSize(1));
  EXPECT_EQ(1, SevenByteNode::nodeCount(9));
  EXPECT_EQ(64, SevenByteNode::paddedByteSize(9));
  EXPECT_EQ(63, SevenByteNode::unpaddedByteSize(9));
  EXPECT_EQ(2, SevenByteNode::nodeCount(10));
  EXPECT_EQ(128, SevenByteNode::paddedByteSize(10));
  EXPECT_EQ(71, SevenByteNode::unpaddedByteSize(10));
  EXPECT_EQ(2, SevenByteNode::nodeCount(18));
  EXPECT_EQ(128, SevenByteNode::paddedByteSize(18));
  EXPECT_EQ(127, SevenByteNode::unpaddedByteSize(18));
  EXPECT_EQ(3, SevenByteNode::nodeCount(19));
  EXPECT_EQ(192, SevenByteNode::paddedByteSize(19));
  EXPECT_EQ(135, SevenByteNode::unpaddedByteSize(19));
}

class IntPaddedTestBase : public ::testing::Test {
 protected:
  typedef padded::Node<uint32_t, 64> IntNode;
  typedef std::vector<IntNode> IntNodeVec;
  IntNodeVec v_;
  int n_;
};

class IntPaddedConstTest : public IntPaddedTestBase {
 protected:
  void SetUp() override {
    v_.resize(4);
    n_ = 0;
    for (int i = 0; i < 4; i++) {
      for (size_t j = 0; j < IntNode::kElementCount; ++j, ++n_) {
        v_[i].data()[j] = n_;
      }
    }
  }
};

TEST_F(IntPaddedConstTest, Iteration) {
  int k = 0;
  for (auto it = padded::cbegin(v_); it != padded::cend(v_); ++it, ++k) {
    EXPECT_EQ(k, *it);
  }
  EXPECT_EQ(n_, k);
}

TEST_F(IntPaddedConstTest, Arithmetic) {
  EXPECT_EQ(64, padded::cend(v_) - padded::cbegin(v_));
  // Play around block boundaries
  auto it = padded::cbegin(v_);
  EXPECT_EQ(0, *it);
  {
    auto i2 = it;
    EXPECT_EQ(0, i2 - it);
    i2 += 1;
    EXPECT_EQ(1, *i2);
    EXPECT_EQ(1, i2 - it);
    EXPECT_EQ(-1, it - i2);
  }
  it += 15;
  EXPECT_EQ(15, *it);
  {
    auto i2 = it;
    i2 += 1;
    EXPECT_EQ(16, *i2);
    EXPECT_EQ(1, i2 - it);
    EXPECT_EQ(-1, it - i2);
  }
  ++it;
  EXPECT_EQ(16, *it);
  {
    auto i2 = it;
    i2 -= 1;
    EXPECT_EQ(15, *i2);
    EXPECT_EQ(-1, i2 - it);
    EXPECT_EQ(1, it - i2);
  }
  --it;
  EXPECT_EQ(15, *it);
  {
    auto i2 = it;
    i2 -= 1;
    EXPECT_EQ(14, *i2);
    EXPECT_EQ(-1, i2 - it);
    EXPECT_EQ(1, it - i2);
  }
}

class IntPaddedNonConstTest : public IntPaddedTestBase {
};

TEST_F(IntPaddedNonConstTest, Iteration) {
  v_.resize(4);
  n_ = 64;

  int k = 0;
  for (auto it = padded::begin(v_); it != padded::end(v_); ++it, ++k) {
    *it = k;
  }
  EXPECT_EQ(n_, k);

  k = 0;
  for (int i = 0; i < 4; i++) {
    for (size_t j = 0; j < IntNode::kElementCount; ++j, ++k) {
      EXPECT_EQ(k, v_[i].data()[j]);
    }
  }
}

class StructPaddedTestBase : public ::testing::Test {
 protected:
  struct Point {
    uint8_t x;
    uint8_t y;
    uint8_t z;
  };
  typedef padded::Node<Point, 64> PointNode;
  typedef std::vector<PointNode> PointNodeVec;
  PointNodeVec v_;
  int n_;
};

class StructPaddedConstTest : public StructPaddedTestBase {
 protected:
  void SetUp() override {
    v_.resize(4);
    n_ = 0;
    for (int i = 0; i < 4; i++) {
      for (size_t j = 0; j < PointNode::kElementCount; ++j, ++n_) {
        auto& point = v_[i].data()[j];
        point.x = n_;
        point.y = n_ + 1;
        point.z = n_ + 2;
      }
    }
  }
};

TEST_F(StructPaddedConstTest, Iteration) {
  int k = 0;
  for (auto it = padded::cbegin(v_); it != padded::cend(v_); ++it, ++k) {
    EXPECT_EQ(k, it->x);
    EXPECT_EQ(k + 1, it->y);
    EXPECT_EQ(k + 2, it->z);
  }
  EXPECT_EQ(n_, k);
}

class IntAdaptorTest : public IntPaddedConstTest {
 protected:
  typedef padded::Adaptor<IntNodeVec> IntAdaptor;
  IntAdaptor a_;
};

TEST_F(IntAdaptorTest, Simple) {
  for (int i = 0; i < n_; ++i) {
    EXPECT_EQ((i == 0), a_.empty());
    EXPECT_EQ(i, a_.size());
    a_.push_back(i);
  }
  EXPECT_EQ(n_, a_.size());

  int k = 0;
  for (auto it = a_.begin(); it != a_.end(); ++it, ++k) {
    EXPECT_EQ(k, a_[k]);
    EXPECT_EQ(k, *it);
  }
  EXPECT_EQ(n_, k);

  auto p = a_.move();
  EXPECT_TRUE(a_.empty());
  EXPECT_EQ(16, p.second);
  EXPECT_TRUE(v_ == p.first);
}

TEST_F(IntAdaptorTest, ResizeConstructor) {
  IntAdaptor a(n_, 42);
  EXPECT_EQ(n_, a.size());
  for (int i = 0; i < n_; ++i) {
    EXPECT_EQ(42, a[i]);
  }
}

TEST_F(IntAdaptorTest, SimpleEmplaceBack) {
  for (int i = 0; i < n_; ++i) {
    EXPECT_EQ((i == 0), a_.empty());
    EXPECT_EQ(i, a_.size());
    a_.emplace_back(i);
  }
  EXPECT_EQ(n_, a_.size());

  int k = 0;
  for (auto it = a_.begin(); it != a_.end(); ++it, ++k) {
    EXPECT_EQ(k, a_[k]);
    EXPECT_EQ(k, *it);
  }
  EXPECT_EQ(n_, k);

  auto p = a_.move();
  EXPECT_TRUE(a_.empty());
  EXPECT_EQ(16, p.second);
  EXPECT_TRUE(v_ == p.first);
}
