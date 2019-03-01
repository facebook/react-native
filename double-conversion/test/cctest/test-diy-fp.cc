// Copyright 2006-2008 the V8 project authors. All rights reserved.

#include <stdlib.h>

#include "cctest.h"
#include "double-conversion/diy-fp.h"
#include "double-conversion/utils.h"


using namespace double_conversion;


TEST(Subtract) {
  DiyFp diy_fp1 = DiyFp(3, 0);
  DiyFp diy_fp2 = DiyFp(1, 0);
  DiyFp diff = DiyFp::Minus(diy_fp1, diy_fp2);

  CHECK(2 == diff.f());  // NOLINT
  CHECK_EQ(0, diff.e());
  diy_fp1.Subtract(diy_fp2);
  CHECK(2 == diy_fp1.f());  // NOLINT
  CHECK_EQ(0, diy_fp1.e());
}


TEST(Multiply) {
  DiyFp diy_fp1 = DiyFp(3, 0);
  DiyFp diy_fp2 = DiyFp(2, 0);
  DiyFp product = DiyFp::Times(diy_fp1, diy_fp2);

  CHECK(0 == product.f());  // NOLINT
  CHECK_EQ(64, product.e());
  diy_fp1.Multiply(diy_fp2);
  CHECK(0 == diy_fp1.f());  // NOLINT
  CHECK_EQ(64, diy_fp1.e());

  diy_fp1 = DiyFp(UINT64_2PART_C(0x80000000, 00000000), 11);
  diy_fp2 = DiyFp(2, 13);
  product = DiyFp::Times(diy_fp1, diy_fp2);
  CHECK(1 == product.f());  // NOLINT
  CHECK_EQ(11 + 13 + 64, product.e());

  // Test rounding.
  diy_fp1 = DiyFp(UINT64_2PART_C(0x80000000, 00000001), 11);
  diy_fp2 = DiyFp(1, 13);
  product = DiyFp::Times(diy_fp1, diy_fp2);
  CHECK(1 == product.f());  // NOLINT
  CHECK_EQ(11 + 13 + 64, product.e());

  diy_fp1 = DiyFp(UINT64_2PART_C(0x7fffffff, ffffffff), 11);
  diy_fp2 = DiyFp(1, 13);
  product = DiyFp::Times(diy_fp1, diy_fp2);
  CHECK(0 == product.f());  // NOLINT
  CHECK_EQ(11 + 13 + 64, product.e());

  // Halfway cases are allowed to round either way. So don't check for it.

  // Big numbers.
  diy_fp1 = DiyFp(UINT64_2PART_C(0xFFFFFFFF, FFFFFFFF), 11);
  diy_fp2 = DiyFp(UINT64_2PART_C(0xFFFFFFFF, FFFFFFFF), 13);
  // 128bit result: 0xfffffffffffffffe0000000000000001
  product = DiyFp::Times(diy_fp1, diy_fp2);
  CHECK(UINT64_2PART_C(0xFFFFFFFF, FFFFFFFe) == product.f());
  CHECK_EQ(11 + 13 + 64, product.e());
}
