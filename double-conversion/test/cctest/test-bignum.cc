// Copyright 2010 the V8 project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of Google Inc. nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
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

#include <stdlib.h>
#include <string.h>


#include "double-conversion/bignum.h"
#include "cctest.h"
#include "double-conversion/utils.h"

using namespace double_conversion;


static const int kBufferSize = 1024;

static void AssignHexString(Bignum* bignum, const char* str) {
  bignum->AssignHexString(Vector<const char>(str, strlen(str)));
}


static void AssignDecimalString(Bignum* bignum, const char* str) {
  bignum->AssignDecimalString(Vector<const char>(str, strlen(str)));
}


TEST(Assign) {
  char buffer[kBufferSize];
  Bignum bignum;
  Bignum bignum2;
  bignum.AssignUInt16(0);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("0", buffer);
  bignum.AssignUInt16(0xA);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("A", buffer);
  bignum.AssignUInt16(0x20);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("20", buffer);


  bignum.AssignUInt64(0);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("0", buffer);
  bignum.AssignUInt64(0xA);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("A", buffer);
  bignum.AssignUInt64(0x20);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("20", buffer);
  bignum.AssignUInt64(0x100);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("100", buffer);

  // The first real test, since this will not fit into one bigit.
  bignum.AssignUInt64(0x12345678);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("12345678", buffer);

  uint64_t big = UINT64_2PART_C(0xFFFFFFFF, FFFFFFFF);
  bignum.AssignUInt64(big);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFFFFFFFFFFFFFF", buffer);

  big = UINT64_2PART_C(0x12345678, 9ABCDEF0);
  bignum.AssignUInt64(big);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("123456789ABCDEF0", buffer);

  bignum2.AssignBignum(bignum);
  CHECK(bignum2.ToHexString(buffer, kBufferSize));
  CHECK_EQ("123456789ABCDEF0", buffer);

  AssignDecimalString(&bignum, "0");
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("0", buffer);

  AssignDecimalString(&bignum, "1");
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1", buffer);

  AssignDecimalString(&bignum, "1234567890");
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("499602D2", buffer);

  AssignHexString(&bignum, "0");
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("0", buffer);

  AssignHexString(&bignum, "123456789ABCDEF0");
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("123456789ABCDEF0", buffer);
}


TEST(ShiftLeft) {
  char buffer[kBufferSize];
  Bignum bignum;
  AssignHexString(&bignum, "0");
  bignum.ShiftLeft(100);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("0", buffer);

  AssignHexString(&bignum, "1");
  bignum.ShiftLeft(1);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("2", buffer);

  AssignHexString(&bignum, "1");
  bignum.ShiftLeft(4);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10", buffer);

  AssignHexString(&bignum, "1");
  bignum.ShiftLeft(32);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("100000000", buffer);

  AssignHexString(&bignum, "1");
  bignum.ShiftLeft(64);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10000000000000000", buffer);

  AssignHexString(&bignum, "123456789ABCDEF");
  bignum.ShiftLeft(64);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("123456789ABCDEF0000000000000000", buffer);
  bignum.ShiftLeft(1);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("2468ACF13579BDE0000000000000000", buffer);
}


TEST(AddUInt64) {
  char buffer[kBufferSize];
  Bignum bignum;
  AssignHexString(&bignum, "0");
  bignum.AddUInt64(0xA);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("A", buffer);

  AssignHexString(&bignum, "1");
  bignum.AddUInt64(0xA);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("B", buffer);

  AssignHexString(&bignum, "1");
  bignum.AddUInt64(0x100);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("101", buffer);

  AssignHexString(&bignum, "1");
  bignum.AddUInt64(0xFFFF);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10000", buffer);

  AssignHexString(&bignum, "FFFFFFF");
  bignum.AddUInt64(0x1);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10000000", buffer);

  AssignHexString(&bignum, "10000000000000000000000000000000000000000000");
  bignum.AddUInt64(0xFFFF);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1000000000000000000000000000000000000000FFFF", buffer);

  AssignHexString(&bignum, "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
  bignum.AddUInt64(0x1);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("100000000000000000000000000000000000000000000", buffer);

  bignum.AssignUInt16(0x1);
  bignum.ShiftLeft(100);
  bignum.AddUInt64(1);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10000000000000000000000001", buffer);

  bignum.AssignUInt16(0x1);
  bignum.ShiftLeft(100);
  bignum.AddUInt64(0xFFFF);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1000000000000000000000FFFF", buffer);

  AssignHexString(&bignum, "0");
  bignum.AddUInt64(UINT64_2PART_C(0xA, 00000000));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("A00000000", buffer);

  AssignHexString(&bignum, "1");
  bignum.AddUInt64(UINT64_2PART_C(0xA, 00000000));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("A00000001", buffer);

  AssignHexString(&bignum, "1");
  bignum.AddUInt64(UINT64_2PART_C(0x100, 00000000));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10000000001", buffer);

  AssignHexString(&bignum, "1");
  bignum.AddUInt64(UINT64_2PART_C(0xFFFF, 00000000));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFF00000001", buffer);

  AssignHexString(&bignum, "FFFFFFF");
  bignum.AddUInt64(UINT64_2PART_C(0x1, 00000000));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10FFFFFFF", buffer);

  AssignHexString(&bignum, "10000000000000000000000000000000000000000000");
  bignum.AddUInt64(UINT64_2PART_C(0xFFFF, 00000000));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10000000000000000000000000000000FFFF00000000", buffer);

  AssignHexString(&bignum, "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
  bignum.AddUInt64(UINT64_2PART_C(0x1, 00000000));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1000000000000000000000000000000000000FFFFFFFF", buffer);

  bignum.AssignUInt16(0x1);
  bignum.ShiftLeft(100);
  bignum.AddUInt64(UINT64_2PART_C(0x1, 00000000));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10000000000000000100000000", buffer);

  bignum.AssignUInt16(0x1);
  bignum.ShiftLeft(100);
  bignum.AddUInt64(UINT64_2PART_C(0xFFFF, 00000000));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10000000000000FFFF00000000", buffer);
}


TEST(AddBignum) {
  char buffer[kBufferSize];
  Bignum bignum;
  Bignum other;

  AssignHexString(&other, "1");
  AssignHexString(&bignum, "0");
  bignum.AddBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1", buffer);

  AssignHexString(&bignum, "1");
  bignum.AddBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("2", buffer);

  AssignHexString(&bignum, "FFFFFFF");
  bignum.AddBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10000000", buffer);

  AssignHexString(&bignum, "FFFFFFFFFFFFFF");
  bignum.AddBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("100000000000000", buffer);

  AssignHexString(&bignum, "10000000000000000000000000000000000000000000");
  bignum.AddBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10000000000000000000000000000000000000000001", buffer);

  AssignHexString(&other, "1000000000000");

  AssignHexString(&bignum, "1");
  bignum.AddBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1000000000001", buffer);

  AssignHexString(&bignum, "FFFFFFF");
  bignum.AddBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("100000FFFFFFF", buffer);

  AssignHexString(&bignum, "10000000000000000000000000000000000000000000");
  bignum.AddBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10000000000000000000000000000001000000000000", buffer);

  AssignHexString(&bignum, "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
  bignum.AddBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1000000000000000000000000000000FFFFFFFFFFFF", buffer);

  bignum.AssignUInt16(0x1);
  bignum.ShiftLeft(100);
  bignum.AddBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10000000000001000000000000", buffer);

  other.ShiftLeft(64);
  // other == "10000000000000000000000000000"

  bignum.AssignUInt16(0x1);
  bignum.AddBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10000000000000000000000000001", buffer);

  AssignHexString(&bignum, "FFFFFFF");
  bignum.AddBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1000000000000000000000FFFFFFF", buffer);

  AssignHexString(&bignum, "10000000000000000000000000000000000000000000");
  bignum.AddBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10000000000000010000000000000000000000000000", buffer);

  AssignHexString(&bignum, "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
  bignum.AddBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("100000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFF", buffer);

  bignum.AssignUInt16(0x1);
  bignum.ShiftLeft(100);
  bignum.AddBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10010000000000000000000000000", buffer);
}


TEST(SubtractBignum) {
  char buffer[kBufferSize];
  Bignum bignum;
  Bignum other;

  AssignHexString(&bignum, "1");
  AssignHexString(&other, "0");
  bignum.SubtractBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1", buffer);

  AssignHexString(&bignum, "2");
  AssignHexString(&other, "0");
  bignum.SubtractBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("2", buffer);

  AssignHexString(&bignum, "10000000");
  AssignHexString(&other, "1");
  bignum.SubtractBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFFFFF", buffer);

  AssignHexString(&bignum, "100000000000000");
  AssignHexString(&other, "1");
  bignum.SubtractBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFFFFFFFFFFFF", buffer);

  AssignHexString(&bignum, "10000000000000000000000000000000000000000001");
  AssignHexString(&other, "1");
  bignum.SubtractBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10000000000000000000000000000000000000000000", buffer);

  AssignHexString(&bignum, "1000000000001");
  AssignHexString(&other, "1000000000000");
  bignum.SubtractBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1", buffer);

  AssignHexString(&bignum, "100000FFFFFFF");
  AssignHexString(&other, "1000000000000");
  bignum.SubtractBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFFFFF", buffer);

  AssignHexString(&bignum, "10000000000000000000000000000001000000000000");
  AssignHexString(&other, "1000000000000");
  bignum.SubtractBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10000000000000000000000000000000000000000000", buffer);

  AssignHexString(&bignum, "1000000000000000000000000000000FFFFFFFFFFFF");
  AssignHexString(&other, "1000000000000");
  bignum.SubtractBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", buffer);

  bignum.AssignUInt16(0x1);
  bignum.ShiftLeft(100);
  // "10 0000 0000 0000 0000 0000 0000"
  AssignHexString(&other, "1000000000000");
  bignum.SubtractBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFFFFFFFFFFF000000000000", buffer);

  AssignHexString(&other, "1000000000000");
  other.ShiftLeft(48);
  // other == "1000000000000000000000000"

  bignum.AssignUInt16(0x1);
  bignum.ShiftLeft(100);
  // bignum == "10000000000000000000000000"
  bignum.SubtractBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("F000000000000000000000000", buffer);

  other.AssignUInt16(0x1);
  other.ShiftLeft(35);
  // other == "800000000"
  AssignHexString(&bignum, "FFFFFFF");
  bignum.ShiftLeft(60);
  // bignum = FFFFFFF000000000000000
  bignum.SubtractBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFFFFEFFFFFF800000000", buffer);

  AssignHexString(&bignum, "10000000000000000000000000000000000000000000");
  bignum.SubtractBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF800000000", buffer);

  AssignHexString(&bignum, "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
  bignum.SubtractBignum(other);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF7FFFFFFFF", buffer);
}


TEST(MultiplyUInt32) {
  char buffer[kBufferSize];
  Bignum bignum;

  AssignHexString(&bignum, "0");
  bignum.MultiplyByUInt32(0x25);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("0", buffer);

  AssignHexString(&bignum, "2");
  bignum.MultiplyByUInt32(0x5);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("A", buffer);

  AssignHexString(&bignum, "10000000");
  bignum.MultiplyByUInt32(0x9);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("90000000", buffer);

  AssignHexString(&bignum, "100000000000000");
  bignum.MultiplyByUInt32(0xFFFF);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFF00000000000000", buffer);

  AssignHexString(&bignum, "100000000000000");
  bignum.MultiplyByUInt32(0xFFFFFFFF);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFFFFFF00000000000000", buffer);

  AssignHexString(&bignum, "1234567ABCD");
  bignum.MultiplyByUInt32(0xFFF);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("12333335552433", buffer);

  AssignHexString(&bignum, "1234567ABCD");
  bignum.MultiplyByUInt32(0xFFFFFFF);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("12345679998A985433", buffer);

  AssignHexString(&bignum, "FFFFFFFFFFFFFFFF");
  bignum.MultiplyByUInt32(0x2);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1FFFFFFFFFFFFFFFE", buffer);

  AssignHexString(&bignum, "FFFFFFFFFFFFFFFF");
  bignum.MultiplyByUInt32(0x4);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("3FFFFFFFFFFFFFFFC", buffer);

  AssignHexString(&bignum, "FFFFFFFFFFFFFFFF");
  bignum.MultiplyByUInt32(0xF);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("EFFFFFFFFFFFFFFF1", buffer);

  AssignHexString(&bignum, "FFFFFFFFFFFFFFFF");
  bignum.MultiplyByUInt32(0xFFFFFF);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFFFEFFFFFFFFFF000001", buffer);

  bignum.AssignUInt16(0x1);
  bignum.ShiftLeft(100);
  // "10 0000 0000 0000 0000 0000 0000"
  bignum.MultiplyByUInt32(2);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("20000000000000000000000000", buffer);

  bignum.AssignUInt16(0x1);
  bignum.ShiftLeft(100);
  // "10 0000 0000 0000 0000 0000 0000"
  bignum.MultiplyByUInt32(0xF);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("F0000000000000000000000000", buffer);

  bignum.AssignUInt16(0xFFFF);
  bignum.ShiftLeft(100);
  // "FFFF0 0000 0000 0000 0000 0000 0000"
  bignum.MultiplyByUInt32(0xFFFF);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFE00010000000000000000000000000", buffer);

  bignum.AssignUInt16(0xFFFF);
  bignum.ShiftLeft(100);
  // "FFFF0 0000 0000 0000 0000 0000 0000"
  bignum.MultiplyByUInt32(0xFFFFFFFF);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFEFFFF00010000000000000000000000000", buffer);

  bignum.AssignUInt16(0xFFFF);
  bignum.ShiftLeft(100);
  // "FFFF0 0000 0000 0000 0000 0000 0000"
  bignum.MultiplyByUInt32(0xFFFFFFFF);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFEFFFF00010000000000000000000000000", buffer);

  AssignDecimalString(&bignum, "15611230384529777");
  bignum.MultiplyByUInt32(10000000);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("210EDD6D4CDD2580EE80", buffer);
}


TEST(MultiplyUInt64) {
  char buffer[kBufferSize];
  Bignum bignum;

  AssignHexString(&bignum, "0");
  bignum.MultiplyByUInt64(0x25);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("0", buffer);

  AssignHexString(&bignum, "2");
  bignum.MultiplyByUInt64(0x5);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("A", buffer);

  AssignHexString(&bignum, "10000000");
  bignum.MultiplyByUInt64(0x9);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("90000000", buffer);

  AssignHexString(&bignum, "100000000000000");
  bignum.MultiplyByUInt64(0xFFFF);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFF00000000000000", buffer);

  AssignHexString(&bignum, "100000000000000");
  bignum.MultiplyByUInt64(UINT64_2PART_C(0xFFFFFFFF, FFFFFFFF));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFFFFFFFFFFFFFF00000000000000", buffer);

  AssignHexString(&bignum, "1234567ABCD");
  bignum.MultiplyByUInt64(0xFFF);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("12333335552433", buffer);

  AssignHexString(&bignum, "1234567ABCD");
  bignum.MultiplyByUInt64(UINT64_2PART_C(0xFF, FFFFFFFF));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1234567ABCBDCBA985433", buffer);

  AssignHexString(&bignum, "FFFFFFFFFFFFFFFF");
  bignum.MultiplyByUInt64(0x2);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1FFFFFFFFFFFFFFFE", buffer);

  AssignHexString(&bignum, "FFFFFFFFFFFFFFFF");
  bignum.MultiplyByUInt64(0x4);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("3FFFFFFFFFFFFFFFC", buffer);

  AssignHexString(&bignum, "FFFFFFFFFFFFFFFF");
  bignum.MultiplyByUInt64(0xF);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("EFFFFFFFFFFFFFFF1", buffer);

  AssignHexString(&bignum, "FFFFFFFFFFFFFFFF");
  bignum.MultiplyByUInt64(UINT64_2PART_C(0xFFFFFFFF, FFFFFFFF));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFFFFFFFFFFFFFE0000000000000001", buffer);

  bignum.AssignUInt16(0x1);
  bignum.ShiftLeft(100);
  // "10 0000 0000 0000 0000 0000 0000"
  bignum.MultiplyByUInt64(2);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("20000000000000000000000000", buffer);

  bignum.AssignUInt16(0x1);
  bignum.ShiftLeft(100);
  // "10 0000 0000 0000 0000 0000 0000"
  bignum.MultiplyByUInt64(0xF);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("F0000000000000000000000000", buffer);

  bignum.AssignUInt16(0xFFFF);
  bignum.ShiftLeft(100);
  // "FFFF0 0000 0000 0000 0000 0000 0000"
  bignum.MultiplyByUInt64(0xFFFF);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFE00010000000000000000000000000", buffer);

  bignum.AssignUInt16(0xFFFF);
  bignum.ShiftLeft(100);
  // "FFFF0 0000 0000 0000 0000 0000 0000"
  bignum.MultiplyByUInt64(0xFFFFFFFF);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFEFFFF00010000000000000000000000000", buffer);

  bignum.AssignUInt16(0xFFFF);
  bignum.ShiftLeft(100);
  // "FFFF0 0000 0000 0000 0000 0000 0000"
  bignum.MultiplyByUInt64(UINT64_2PART_C(0xFFFFFFFF, FFFFFFFF));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFEFFFFFFFFFFFF00010000000000000000000000000", buffer);

  AssignDecimalString(&bignum, "15611230384529777");
  bignum.MultiplyByUInt64(UINT64_2PART_C(0x8ac72304, 89e80000));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1E10EE4B11D15A7F3DE7F3C7680000", buffer);
}


TEST(MultiplyPowerOfTen) {
  char buffer[kBufferSize];
  Bignum bignum;

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(1);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("3034", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(2);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1E208", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(3);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("12D450", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(4);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("BC4B20", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(5);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("75AEF40", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(6);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("498D5880", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(7);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("2DF857500", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(8);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1CBB369200", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(9);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("11F5021B400", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(10);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("B3921510800", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(11);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("703B4D2A5000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(12);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("4625103A72000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(13);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("2BD72A24874000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(14);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1B667A56D488000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(15);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("11200C7644D50000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(16);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("AB407C9EB0520000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(17);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("6B084DE32E3340000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(18);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("42E530ADFCE0080000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(19);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("29CF3E6CBE0C0500000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(20);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1A218703F6C783200000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(21);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1054F4627A3CB1F400000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(22);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("A3518BD8C65EF38800000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(23);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("6612F7677BFB5835000000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(24);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("3FCBDAA0AD7D17212000000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(25);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("27DF68A46C6E2E74B4000000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(26);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("18EBA166C3C4DD08F08000000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(27);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("F9344E03A5B0A259650000000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(28);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("9BC0B0C2478E6577DF20000000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(29);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("61586E796CB8FF6AEB740000000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(30);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("3CD7450BE3F39FA2D32880000000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(31);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("26068B276E7843C5C3F9500000000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(50);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("149D1B4CFED03B23AB5F4E1196EF45C08000000000000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(100);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("5827249F27165024FBC47DFCA9359BF316332D1B91ACEECF471FBAB06D9B2"
           "0000000000000000000000000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(200);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("64C1F5C06C3816AFBF8DAFD5A3D756365BB0FD020E6F084E759C1F7C99E4F"
           "55B9ACC667CEC477EB958C2AEEB3C6C19BA35A1AD30B35C51EB72040920000"
           "0000000000000000000000000000000000000000000000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(500);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("96741A625EB5D7C91039FEB5C5ACD6D9831EDA5B083D800E6019442C8C8223"
           "3EAFB3501FE2058062221E15121334928880827DEE1EC337A8B26489F3A40A"
           "CB440A2423734472D10BFCE886F41B3AF9F9503013D86D088929CA86EEB4D8"
           "B9C831D0BD53327B994A0326227CFD0ECBF2EB48B02387AAE2D4CCCDF1F1A1"
           "B8CC4F1FA2C56AD40D0E4DAA9C28CDBF0A549098EA13200000000000000000"
           "00000000000000000000000000000000000000000000000000000000000000"
           "0000000000000000000000000000000000000000000000", buffer);

  AssignDecimalString(&bignum, "1234");
  bignum.MultiplyByPowerOfTen(1000);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1258040F99B1CD1CC9819C676D413EA50E4A6A8F114BB0C65418C62D399B81"
           "6361466CA8E095193E1EE97173553597C96673AF67FAFE27A66E7EF2E5EF2E"
           "E3F5F5070CC17FE83BA53D40A66A666A02F9E00B0E11328D2224B8694C7372"
           "F3D536A0AD1985911BD361496F268E8B23112500EAF9B88A9BC67B2AB04D38"
           "7FEFACD00F5AF4F764F9ABC3ABCDE54612DE38CD90CB6647CA389EA0E86B16"
           "BF7A1F34086E05ADBE00BD1673BE00FAC4B34AF1091E8AD50BA675E0381440"
           "EA8E9D93E75D816BAB37C9844B1441C38FC65CF30ABB71B36433AF26DD97BD"
           "ABBA96C03B4919B8F3515B92826B85462833380DC193D79F69D20DD6038C99"
           "6114EF6C446F0BA28CC772ACBA58B81C04F8FFDE7B18C4E5A3ABC51E637FDF"
           "6E37FDFF04C940919390F4FF92000000000000000000000000000000000000"
           "00000000000000000000000000000000000000000000000000000000000000"
           "00000000000000000000000000000000000000000000000000000000000000"
           "00000000000000000000000000000000000000000000000000000000000000"
           "0000000000000000000000000000", buffer);

  Bignum bignum2;
  AssignHexString(&bignum2, "3DA774C07FB5DF54284D09C675A492165B830D5DAAEB2A7501"
                            "DA17CF9DFA1CA2282269F92A25A97314296B717E3DCBB9FE17"
                            "41A842FE2913F540F40796F2381155763502C58B15AF7A7F88"
                            "6F744C9164FF409A28F7FA0C41F89ED79C1BE9F322C8578B97"
                            "841F1CBAA17D901BE1230E3C00E1C643AF32638B5674E01FEA"
                            "96FC90864E621B856A9E1CE56E6EB545B9C2F8F0CC10DDA88D"
                            "CC6D282605F8DB67044F2DFD3695E7BA63877AE16701536AE6"
                            "567C794D0BFE338DFBB42D92D4215AF3BB22BF0A8B283FDDC2"
                            "C667A10958EA6D2");
  CHECK(bignum2.ToHexString(buffer, kBufferSize));
  CHECK_EQ("3DA774C07FB5DF54284D09C675A492165B830D5DAAEB2A7501"
           "DA17CF9DFA1CA2282269F92A25A97314296B717E3DCBB9FE17"
           "41A842FE2913F540F40796F2381155763502C58B15AF7A7F88"
           "6F744C9164FF409A28F7FA0C41F89ED79C1BE9F322C8578B97"
           "841F1CBAA17D901BE1230E3C00E1C643AF32638B5674E01FEA"
           "96FC90864E621B856A9E1CE56E6EB545B9C2F8F0CC10DDA88D"
           "CC6D282605F8DB67044F2DFD3695E7BA63877AE16701536AE6"
           "567C794D0BFE338DFBB42D92D4215AF3BB22BF0A8B283FDDC2"
           "C667A10958EA6D2", buffer);

  bignum.AssignBignum(bignum2);
  bignum.MultiplyByPowerOfTen(1);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("2688A8F84FD1AB949930261C0986DB4DF931E85A8AD2FA8921284EE1C2BC51"
           "E55915823BBA5789E7EC99E326EEE69F543ECE890929DED9AC79489884BE57"
           "630AD569E121BB76ED8DAC8FB545A8AFDADF1F8860599AFC47A93B6346C191"
           "7237F5BD36B73EB29371F4A4EE7A116CB5E8E5808D1BEA4D7F7E3716090C13"
           "F29E5DDA53F0FD513362A2D20F6505314B9419DB967F8A8A89589FC43917C3"
           "BB892062B17CBE421DB0D47E34ACCCE060D422CFF60DCBD0277EE038BD509C"
           "7BC494D8D854F5B76696F927EA99BC00C4A5D7928434", buffer);

  bignum.AssignBignum(bignum2);
  bignum.MultiplyByPowerOfTen(2);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1815699B31E30B3CDFBE17D185F44910BBBF313896C3DC95B4B9314D19B5B32"
           "F57AD71655476B630F3E02DF855502394A74115A5BA2B480BCBCD5F52F6F69D"
           "E6C5622CB5152A54788BD9D14B896DE8CB73B53C3800DDACC9C51E0C38FAE76"
           "2F9964232872F9C2738E7150C4AE3F1B18F70583172706FAEE26DC5A78C77A2"
           "FAA874769E52C01DA5C3499F233ECF3C90293E0FB69695D763DAA3AEDA5535B"
           "43DAEEDF6E9528E84CEE0EC000C3C8495C1F9C89F6218AF4C23765261CD5ADD"
           "0787351992A01E5BB8F2A015807AE7A6BB92A08", buffer);

  bignum.AssignBignum(bignum2);
  bignum.MultiplyByPowerOfTen(5);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("5E13A4863ADEE3E5C9FE8D0A73423D695D62D8450CED15A8C9F368952C6DC3"
           "F0EE7D82F3D1EFB7AF38A3B3920D410AFCAD563C8F5F39116E141A3C5C14B3"
           "58CD73077EA35AAD59F6E24AD98F10D5555ABBFBF33AC361EAF429FD5FBE94"
           "17DA9EF2F2956011F9F93646AA38048A681D984ED88127073443247CCC167C"
           "B354A32206EF5A733E73CF82D795A1AD598493211A6D613C39515E0E0F6304"
           "DCD9C810F3518C7F6A7CB6C81E99E02FCC65E8FDB7B7AE97306CC16A8631CE"
           "0A2AEF6568276BE4C176964A73C153FDE018E34CB4C2F40", buffer);

  bignum.AssignBignum(bignum2);
  bignum.MultiplyByPowerOfTen(10);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("8F8CB8EB51945A7E815809F6121EF2F4E61EF3405CD9432CAD2709749EEAFD"
           "1B81E843F14A3667A7BDCCC9E0BB795F63CDFDB62844AC7438976C885A0116"
           "29607DA54F9C023CC366570B7637ED0F855D931752038A614922D0923E382C"
           "B8E5F6C975672DB76E0DE471937BB9EDB11E28874F1C122D5E1EF38CECE9D0"
           "0723056BCBD4F964192B76830634B1D322B7EB0062F3267E84F5C824343A77"
           "4B7DCEE6DD464F01EBDC8C671BB18BB4EF4300A42474A6C77243F2A12B03BF"
           "0443C38A1C0D2701EDB393135AE0DEC94211F9D4EB51F990800", buffer);

  bignum.AssignBignum(bignum2);
  bignum.MultiplyByPowerOfTen(50);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("107A8BE345E24407372FC1DE442CBA696BC23C4FFD5B4BDFD9E5C39559815"
           "86628CF8472D2D589F2FC2BAD6E0816EC72CBF85CCA663D8A1EC6C51076D8"
           "2D247E6C26811B7EC4D4300FB1F91028DCB7B2C4E7A60C151161AA7E65E79"
           "B40917B12B2B5FBE7745984D4E8EFA31F9AE6062427B068B144A9CB155873"
           "E7C0C9F0115E5AC72DC5A73C4796DB970BF9205AB8C77A6996EB1B417F9D1"
           "6232431E6313C392203601B9C22CC10DDA88DCC6D282605F8DB67044F2DFD"
           "3695E7BA63877AE16701536AE6567C794D0BFE338DFBB42D924CF964BD2C0"
           "F586E03A2FCD35A408000000000000", buffer);

  bignum.AssignBignum(bignum2);
  bignum.MultiplyByPowerOfTen(100);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("46784A90ACD0ED3E7759CC585FB32D36EB6034A6F78D92604E3BAA5ED3D8B"
           "6E60E854439BE448897FB4B7EA5A3D873AA0FCB3CFFD80D0530880E45F511"
           "722A50CE7E058B5A6F5464DB7500E34984EE3202A9441F44FA1554C0CEA96"
           "B438A36F25E7C9D56D71AE2CD313EC37534DA299AC0854FC48591A7CF3171"
           "31265AA4AE62DE32344CE7BEEEF894AE686A2DAAFE5D6D9A10971FFD9C064"
           "5079B209E1048F58B5192D41D84336AC4C8C489EEF00939CFC9D55C122036"
           "01B9C22CC10DDA88DCC6D282605F8DB67044F2DFD3695E7BA3F67B96D3A32"
           "E11FB5561B68744C4035B0800DC166D49D98E3FD1D5BB2000000000000000"
           "0000000000", buffer);

  bignum.AssignBignum(bignum2);
  bignum.MultiplyByPowerOfTen(200);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("508BD351221DF139D72D88CDC0416845A53EE2D0E6B98352509A9AC312F8C"
           "6CB1A144889416201E0B6CE66EA3EBE259B5FD79ECFC1FD77963CE516CC7E"
           "2FE73D4B5B710C19F6BCB092C7A2FD76286543B8DBD2C596DFF2C896720BA"
           "DFF7BC9C366ACEA3A880AEC287C5E6207DF2739B5326FC19D773BD830B109"
           "ED36C7086544BF8FDB9D4B73719C2B5BC2F571A5937EC46876CD428281F6B"
           "F287E1E07F25C1B1D46BC37324FF657A8B2E0071DB83B86123CA34004F406"
           "001082D7945E90C6E8C9A9FEC2B44BE0DDA46E9F52B152E4D1336D2FCFBC9"
           "96E30CA0082256737365158FE36482AA7EB9DAF2AB128F10E7551A3CD5BE6"
           "0A922F3A7D5EED38B634A7EC95BCF7021BA6820A292000000000000000000"
           "00000000000000000000000000000000", buffer);

  bignum.AssignBignum(bignum2);
  bignum.MultiplyByPowerOfTen(500);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("7845F900E475B5086885BAAAE67C8E85185ACFE4633727F82A4B06B5582AC"
           "BE933C53357DA0C98C20C5AC900C4D76A97247DF52B79F48F9E35840FB715"
           "D392CE303E22622B0CF82D9471B398457DD3196F639CEE8BBD2C146873841"
           "F0699E6C41F04FC7A54B48CEB995BEB6F50FE81DE9D87A8D7F849CC523553"
           "7B7BBBC1C7CAAFF6E9650BE03B308C6D31012AEF9580F70D3EE2083ADE126"
           "8940FA7D6308E239775DFD2F8C97FF7EBD525DAFA6512216F7047A62A93DC"
           "38A0165BDC67E250DCC96A0181DE935A70B38704DC71819F02FC5261FF7E1"
           "E5F11907678B0A3E519FF4C10A867B0C26CE02BE6960BA8621A87303C101C"
           "3F88798BB9F7739655946F8B5744E6B1EAF10B0C5621330F0079209033C69"
           "20DE2E2C8D324F0624463735D482BF291926C22A910F5B80FA25170B6B57D"
           "8D5928C7BCA3FE87461275F69BD5A1B83181DAAF43E05FC3C72C4E93111B6"
           "6205EBF49B28FEDFB7E7526CBDA658A332000000000000000000000000000"
           "0000000000000000000000000000000000000000000000000000000000000"
           "0000000000000000000000000000000000000", buffer);
}


TEST(DivideModuloIntBignum) {
  char buffer[kBufferSize];
  Bignum bignum;
  Bignum other;
  Bignum third;

  bignum.AssignUInt16(10);
  other.AssignUInt16(2);
  CHECK_EQ(5, bignum.DivideModuloIntBignum(other));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("0", buffer);

  bignum.AssignUInt16(10);
  bignum.ShiftLeft(500);
  other.AssignUInt16(2);
  other.ShiftLeft(500);
  CHECK_EQ(5, bignum.DivideModuloIntBignum(other));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("0", buffer);

  bignum.AssignUInt16(11);
  other.AssignUInt16(2);
  CHECK_EQ(5, bignum.DivideModuloIntBignum(other));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1", buffer);

  bignum.AssignUInt16(10);
  bignum.ShiftLeft(500);
  other.AssignUInt16(1);
  bignum.AddBignum(other);
  other.AssignUInt16(2);
  other.ShiftLeft(500);
  CHECK_EQ(5, bignum.DivideModuloIntBignum(other));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1", buffer);

  bignum.AssignUInt16(10);
  bignum.ShiftLeft(500);
  other.AssignBignum(bignum);
  bignum.MultiplyByUInt32(0x1234);
  third.AssignUInt16(0xFFF);
  bignum.AddBignum(third);
  CHECK_EQ(0x1234, bignum.DivideModuloIntBignum(other));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFF", buffer);

  bignum.AssignUInt16(10);
  AssignHexString(&other, "1234567890");
  CHECK_EQ(0, bignum.DivideModuloIntBignum(other));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("A", buffer);

  AssignHexString(&bignum, "12345678");
  AssignHexString(&other, "3789012");
  CHECK_EQ(5, bignum.DivideModuloIntBignum(other));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("D9861E", buffer);

  AssignHexString(&bignum, "70000001");
  AssignHexString(&other, "1FFFFFFF");
  CHECK_EQ(3, bignum.DivideModuloIntBignum(other));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10000004", buffer);

  AssignHexString(&bignum, "28000000");
  AssignHexString(&other, "12A05F20");
  CHECK_EQ(2, bignum.DivideModuloIntBignum(other));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("2BF41C0", buffer);

  bignum.AssignUInt16(10);
  bignum.ShiftLeft(500);
  other.AssignBignum(bignum);
  bignum.MultiplyByUInt32(0x1234);
  third.AssignUInt16(0xFFF);
  other.SubtractBignum(third);
  CHECK_EQ(0x1234, bignum.DivideModuloIntBignum(other));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1232DCC", buffer);
  CHECK_EQ(0, bignum.DivideModuloIntBignum(other));
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1232DCC", buffer);
}


TEST(Compare) {
  Bignum bignum1;
  Bignum bignum2;
  bignum1.AssignUInt16(1);
  bignum2.AssignUInt16(1);
  CHECK_EQ(0, Bignum::Compare(bignum1, bignum2));
  CHECK(Bignum::Equal(bignum1, bignum2));
  CHECK(Bignum::LessEqual(bignum1, bignum2));
  CHECK(!Bignum::Less(bignum1, bignum2));

  bignum1.AssignUInt16(0);
  bignum2.AssignUInt16(1);
  CHECK_EQ(-1, Bignum::Compare(bignum1, bignum2));
  CHECK_EQ(+1, Bignum::Compare(bignum2, bignum1));
  CHECK(!Bignum::Equal(bignum1, bignum2));
  CHECK(!Bignum::Equal(bignum2, bignum1));
  CHECK(Bignum::LessEqual(bignum1, bignum2));
  CHECK(!Bignum::LessEqual(bignum2, bignum1));
  CHECK(Bignum::Less(bignum1, bignum2));
  CHECK(!Bignum::Less(bignum2, bignum1));

  AssignHexString(&bignum1, "1234567890ABCDEF12345");
  AssignHexString(&bignum2, "1234567890ABCDEF12345");
  CHECK_EQ(0, Bignum::Compare(bignum1, bignum2));

  AssignHexString(&bignum1, "1234567890ABCDEF12345");
  AssignHexString(&bignum2, "1234567890ABCDEF12346");
  CHECK_EQ(-1, Bignum::Compare(bignum1, bignum2));
  CHECK_EQ(+1, Bignum::Compare(bignum2, bignum1));

  AssignHexString(&bignum1, "1234567890ABCDEF12345");
  bignum1.ShiftLeft(500);
  AssignHexString(&bignum2, "1234567890ABCDEF12345");
  bignum2.ShiftLeft(500);
  CHECK_EQ(0, Bignum::Compare(bignum1, bignum2));

  AssignHexString(&bignum1, "1234567890ABCDEF12345");
  bignum1.ShiftLeft(500);
  AssignHexString(&bignum2, "1234567890ABCDEF12346");
  bignum2.ShiftLeft(500);
  CHECK_EQ(-1, Bignum::Compare(bignum1, bignum2));
  CHECK_EQ(+1, Bignum::Compare(bignum2, bignum1));

  bignum1.AssignUInt16(1);
  bignum1.ShiftLeft(64);
  AssignHexString(&bignum2, "10000000000000000");
  CHECK_EQ(0, Bignum::Compare(bignum1, bignum2));
  CHECK_EQ(0, Bignum::Compare(bignum2, bignum1));

  bignum1.AssignUInt16(1);
  bignum1.ShiftLeft(64);
  AssignHexString(&bignum2, "10000000000000001");
  CHECK_EQ(-1, Bignum::Compare(bignum1, bignum2));
  CHECK_EQ(+1, Bignum::Compare(bignum2, bignum1));

  bignum1.AssignUInt16(1);
  bignum1.ShiftLeft(96);
  AssignHexString(&bignum2, "10000000000000001");
  bignum2.ShiftLeft(32);
  CHECK_EQ(-1, Bignum::Compare(bignum1, bignum2));
  CHECK_EQ(+1, Bignum::Compare(bignum2, bignum1));

  AssignHexString(&bignum1, "FFFFFFFFFFFFFFFF");
  bignum2.AssignUInt16(1);
  bignum2.ShiftLeft(64);
  CHECK_EQ(-1, Bignum::Compare(bignum1, bignum2));
  CHECK_EQ(+1, Bignum::Compare(bignum2, bignum1));

  AssignHexString(&bignum1, "FFFFFFFFFFFFFFFF");
  bignum1.ShiftLeft(32);
  bignum2.AssignUInt16(1);
  bignum2.ShiftLeft(96);
  CHECK_EQ(-1, Bignum::Compare(bignum1, bignum2));
  CHECK_EQ(+1, Bignum::Compare(bignum2, bignum1));

  AssignHexString(&bignum1, "FFFFFFFFFFFFFFFF");
  bignum1.ShiftLeft(32);
  bignum2.AssignUInt16(1);
  bignum2.ShiftLeft(95);
  CHECK_EQ(+1, Bignum::Compare(bignum1, bignum2));
  CHECK_EQ(-1, Bignum::Compare(bignum2, bignum1));

  AssignHexString(&bignum1, "FFFFFFFFFFFFFFFF");
  bignum1.ShiftLeft(32);
  bignum2.AssignUInt16(1);
  bignum2.ShiftLeft(100);
  CHECK_EQ(-1, Bignum::Compare(bignum1, bignum2));
  CHECK_EQ(+1, Bignum::Compare(bignum2, bignum1));

  AssignHexString(&bignum1, "100000000000000");
  bignum2.AssignUInt16(1);
  bignum2.ShiftLeft(14*4);
  CHECK_EQ(0, Bignum::Compare(bignum1, bignum2));
  CHECK_EQ(0, Bignum::Compare(bignum2, bignum1));

  AssignHexString(&bignum1, "100000000000001");
  bignum2.AssignUInt16(1);
  bignum2.ShiftLeft(14*4);
  CHECK_EQ(+1, Bignum::Compare(bignum1, bignum2));
  CHECK_EQ(-1, Bignum::Compare(bignum2, bignum1));

  AssignHexString(&bignum1, "200000000000000");
  bignum2.AssignUInt16(3);
  bignum2.ShiftLeft(14*4);
  CHECK_EQ(-1, Bignum::Compare(bignum1, bignum2));
  CHECK_EQ(+1, Bignum::Compare(bignum2, bignum1));
}


TEST(PlusCompare) {
  Bignum a;
  Bignum b;
  Bignum c;
  a.AssignUInt16(1);
  b.AssignUInt16(0);
  c.AssignUInt16(1);
  CHECK_EQ(0, Bignum::PlusCompare(a, b, c));
  CHECK(Bignum::PlusEqual(a, b, c));
  CHECK(Bignum::PlusLessEqual(a, b, c));
  CHECK(!Bignum::PlusLess(a, b, c));

  a.AssignUInt16(0);
  b.AssignUInt16(0);
  c.AssignUInt16(1);
  CHECK_EQ(-1, Bignum::PlusCompare(a, b, c));
  CHECK_EQ(+1, Bignum::PlusCompare(c, b, a));
  CHECK(!Bignum::PlusEqual(a, b, c));
  CHECK(!Bignum::PlusEqual(c, b, a));
  CHECK(Bignum::PlusLessEqual(a, b, c));
  CHECK(!Bignum::PlusLessEqual(c, b, a));
  CHECK(Bignum::PlusLess(a, b, c));
  CHECK(!Bignum::PlusLess(c, b, a));

  AssignHexString(&a, "1234567890ABCDEF12345");
  b.AssignUInt16(1);
  AssignHexString(&c, "1234567890ABCDEF12345");
  CHECK_EQ(+1, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567890ABCDEF12344");
  b.AssignUInt16(1);
  AssignHexString(&c, "1234567890ABCDEF12345");
  CHECK_EQ(0, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567890");
  a.ShiftLeft(11*4);
  AssignHexString(&b, "ABCDEF12345");
  AssignHexString(&c, "1234567890ABCDEF12345");
  CHECK_EQ(0, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567890");
  a.ShiftLeft(11*4);
  AssignHexString(&b, "ABCDEF12344");
  AssignHexString(&c, "1234567890ABCDEF12345");
  CHECK_EQ(-1, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567890");
  a.ShiftLeft(11*4);
  AssignHexString(&b, "ABCDEF12346");
  AssignHexString(&c, "1234567890ABCDEF12345");
  CHECK_EQ(1, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567891");
  a.ShiftLeft(11*4);
  AssignHexString(&b, "ABCDEF12345");
  AssignHexString(&c, "1234567890ABCDEF12345");
  CHECK_EQ(1, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567889");
  a.ShiftLeft(11*4);
  AssignHexString(&b, "ABCDEF12345");
  AssignHexString(&c, "1234567890ABCDEF12345");
  CHECK_EQ(-1, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567890");
  a.ShiftLeft(11*4 + 32);
  AssignHexString(&b, "ABCDEF12345");
  b.ShiftLeft(32);
  AssignHexString(&c, "1234567890ABCDEF12345");
  c.ShiftLeft(32);
  CHECK_EQ(0, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567890");
  a.ShiftLeft(11*4 + 32);
  AssignHexString(&b, "ABCDEF12344");
  b.ShiftLeft(32);
  AssignHexString(&c, "1234567890ABCDEF12345");
  c.ShiftLeft(32);
  CHECK_EQ(-1, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567890");
  a.ShiftLeft(11*4 + 32);
  AssignHexString(&b, "ABCDEF12346");
  b.ShiftLeft(32);
  AssignHexString(&c, "1234567890ABCDEF12345");
  c.ShiftLeft(32);
  CHECK_EQ(1, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567891");
  a.ShiftLeft(11*4 + 32);
  AssignHexString(&b, "ABCDEF12345");
  b.ShiftLeft(32);
  AssignHexString(&c, "1234567890ABCDEF12345");
  c.ShiftLeft(32);
  CHECK_EQ(1, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567889");
  a.ShiftLeft(11*4 + 32);
  AssignHexString(&b, "ABCDEF12345");
  b.ShiftLeft(32);
  AssignHexString(&c, "1234567890ABCDEF12345");
  c.ShiftLeft(32);
  CHECK_EQ(-1, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567890");
  a.ShiftLeft(11*4 + 32);
  AssignHexString(&b, "ABCDEF12345");
  b.ShiftLeft(32);
  AssignHexString(&c, "1234567890ABCDEF1234500000000");
  CHECK_EQ(0, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567890");
  a.ShiftLeft(11*4 + 32);
  AssignHexString(&b, "ABCDEF12344");
  b.ShiftLeft(32);
  AssignHexString(&c, "1234567890ABCDEF1234500000000");
  CHECK_EQ(-1, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567890");
  a.ShiftLeft(11*4 + 32);
  AssignHexString(&b, "ABCDEF12346");
  b.ShiftLeft(32);
  AssignHexString(&c, "1234567890ABCDEF1234500000000");
  CHECK_EQ(1, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567891");
  a.ShiftLeft(11*4 + 32);
  AssignHexString(&b, "ABCDEF12345");
  b.ShiftLeft(32);
  AssignHexString(&c, "1234567890ABCDEF1234500000000");
  CHECK_EQ(1, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567889");
  a.ShiftLeft(11*4 + 32);
  AssignHexString(&b, "ABCDEF12345");
  b.ShiftLeft(32);
  AssignHexString(&c, "1234567890ABCDEF1234500000000");
  CHECK_EQ(-1, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567890");
  a.ShiftLeft(11*4 + 32);
  AssignHexString(&b, "ABCDEF12345");
  AssignHexString(&c, "123456789000000000ABCDEF12345");
  CHECK_EQ(0, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567890");
  a.ShiftLeft(11*4 + 32);
  AssignHexString(&b, "ABCDEF12346");
  AssignHexString(&c, "123456789000000000ABCDEF12345");
  CHECK_EQ(1, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567890");
  a.ShiftLeft(11*4 + 32);
  AssignHexString(&b, "ABCDEF12344");
  AssignHexString(&c, "123456789000000000ABCDEF12345");
  CHECK_EQ(-1, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567890");
  a.ShiftLeft(11*4 + 32);
  AssignHexString(&b, "ABCDEF12345");
  b.ShiftLeft(16);
  AssignHexString(&c, "12345678900000ABCDEF123450000");
  CHECK_EQ(0, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567890");
  a.ShiftLeft(11*4 + 32);
  AssignHexString(&b, "ABCDEF12344");
  b.ShiftLeft(16);
  AssignHexString(&c, "12345678900000ABCDEF123450000");
  CHECK_EQ(-1, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567890");
  a.ShiftLeft(11*4 + 32);
  AssignHexString(&b, "ABCDEF12345");
  b.ShiftLeft(16);
  AssignHexString(&c, "12345678900000ABCDEF123450001");
  CHECK_EQ(-1, Bignum::PlusCompare(a, b, c));

  AssignHexString(&a, "1234567890");
  a.ShiftLeft(11*4 + 32);
  AssignHexString(&b, "ABCDEF12346");
  b.ShiftLeft(16);
  AssignHexString(&c, "12345678900000ABCDEF123450000");
  CHECK_EQ(+1, Bignum::PlusCompare(a, b, c));
}


TEST(Square) {
  Bignum bignum;
  char buffer[kBufferSize];

  bignum.AssignUInt16(1);
  bignum.Square();
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1", buffer);

  bignum.AssignUInt16(2);
  bignum.Square();
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("4", buffer);

  bignum.AssignUInt16(10);
  bignum.Square();
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("64", buffer);

  AssignHexString(&bignum, "FFFFFFF");
  bignum.Square();
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFFFFE0000001", buffer);

  AssignHexString(&bignum, "FFFFFFFFFFFFFF");
  bignum.Square();
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FFFFFFFFFFFFFE00000000000001", buffer);
}


TEST(AssignPowerUInt16) {
  Bignum bignum;
  char buffer[kBufferSize];

  bignum.AssignPowerUInt16(1, 0);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1", buffer);

  bignum.AssignPowerUInt16(1, 1);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1", buffer);

  bignum.AssignPowerUInt16(1, 2);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1", buffer);

  bignum.AssignPowerUInt16(2, 0);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1", buffer);

  bignum.AssignPowerUInt16(2, 1);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("2", buffer);

  bignum.AssignPowerUInt16(2, 2);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("4", buffer);

  bignum.AssignPowerUInt16(16, 1);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10", buffer);

  bignum.AssignPowerUInt16(16, 2);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("100", buffer);

  bignum.AssignPowerUInt16(16, 5);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("100000", buffer);

  bignum.AssignPowerUInt16(16, 8);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("100000000", buffer);

  bignum.AssignPowerUInt16(16, 16);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10000000000000000", buffer);

  bignum.AssignPowerUInt16(16, 30);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1000000000000000000000000000000", buffer);

  bignum.AssignPowerUInt16(10, 0);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1", buffer);

  bignum.AssignPowerUInt16(10, 1);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("A", buffer);

  bignum.AssignPowerUInt16(10, 2);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("64", buffer);

  bignum.AssignPowerUInt16(10, 5);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("186A0", buffer);

  bignum.AssignPowerUInt16(10, 8);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("5F5E100", buffer);

  bignum.AssignPowerUInt16(10, 16);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("2386F26FC10000", buffer);

  bignum.AssignPowerUInt16(10, 30);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("C9F2C9CD04674EDEA40000000", buffer);

  bignum.AssignPowerUInt16(10, 31);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("7E37BE2022C0914B2680000000", buffer);

  bignum.AssignPowerUInt16(2, 0);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1", buffer);

  bignum.AssignPowerUInt16(2, 100);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("10000000000000000000000000", buffer);

  bignum.AssignPowerUInt16(17, 0);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1", buffer);

  bignum.AssignPowerUInt16(17, 99);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("1942BB9853FAD924A3D4DD92B89B940E0207BEF05DB9C26BC1B757"
           "80BE0C5A2C2990E02A681224F34ED68558CE4C6E33760931",
           buffer);

  bignum.AssignPowerUInt16(0xFFFF, 99);
  CHECK(bignum.ToHexString(buffer, kBufferSize));
  CHECK_EQ("FF9D12F09B886C54E77E7439C7D2DED2D34F669654C0C2B6B8C288250"
           "5A2211D0E3DC9A61831349EAE674B11D56E3049D7BD79DAAD6C9FA2BA"
           "528E3A794299F2EE9146A324DAFE3E88967A0358233B543E233E575B9"
           "DD4E3AA7942146426C328FF55BFD5C45E0901B1629260AF9AE2F310C5"
           "50959FAF305C30116D537D80CF6EBDBC15C5694062AF1AC3D956D0A41"
           "B7E1B79FF11E21D83387A1CE1F5882B31E4B5D8DE415BDBE6854466DF"
           "343362267A7E8833119D31D02E18DB5B0E8F6A64B0ED0D0062FFFF",
           buffer);
}
