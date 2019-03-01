// Copyright 2006-2008 the V8 project authors. All rights reserved.

#include <stdlib.h>

#include "double-conversion/bignum.h"
#include "cctest.h"
#include "double-conversion/diy-fp.h"
#include "double-conversion/ieee.h"
#include "double-conversion/strtod.h"
#include "double-conversion/utils.h"

using namespace double_conversion;

static Vector<const char> StringToVector(const char* str) {
  return Vector<const char>(str, strlen(str));
}


static double StrtodChar(const char* str, int exponent) {
  return Strtod(StringToVector(str), exponent);
}


static float StrtofChar(const char* str, int exponent) {
  return Strtof(StringToVector(str), exponent);
}


TEST(Strtod) {
  Vector<const char> vector;

  vector = StringToVector("0");
  CHECK_EQ(0.0, Strtod(vector, 1));
  CHECK_EQ(0.0, Strtod(vector, 2));
  CHECK_EQ(0.0, Strtod(vector, -2));
  CHECK_EQ(0.0, Strtod(vector, -999));
  CHECK_EQ(0.0, Strtod(vector, +999));

  vector = StringToVector("1");
  CHECK_EQ(1.0, Strtod(vector, 0));
  CHECK_EQ(10.0, Strtod(vector, 1));
  CHECK_EQ(100.0, Strtod(vector, 2));
  CHECK_EQ(1e20, Strtod(vector, 20));
  CHECK_EQ(1e22, Strtod(vector, 22));
  CHECK_EQ(1e23, Strtod(vector, 23));
  CHECK_EQ(1e35, Strtod(vector, 35));
  CHECK_EQ(1e36, Strtod(vector, 36));
  CHECK_EQ(1e37, Strtod(vector, 37));
  CHECK_EQ(1e-1, Strtod(vector, -1));
  CHECK_EQ(1e-2, Strtod(vector, -2));
  CHECK_EQ(1e-5, Strtod(vector, -5));
  CHECK_EQ(1e-20, Strtod(vector, -20));
  CHECK_EQ(1e-22, Strtod(vector, -22));
  CHECK_EQ(1e-23, Strtod(vector, -23));
  CHECK_EQ(1e-25, Strtod(vector, -25));
  CHECK_EQ(1e-39, Strtod(vector, -39));

  vector = StringToVector("2");
  CHECK_EQ(2.0, Strtod(vector, 0));
  CHECK_EQ(20.0, Strtod(vector, 1));
  CHECK_EQ(200.0, Strtod(vector, 2));
  CHECK_EQ(2e20, Strtod(vector, 20));
  CHECK_EQ(2e22, Strtod(vector, 22));
  CHECK_EQ(2e23, Strtod(vector, 23));
  CHECK_EQ(2e35, Strtod(vector, 35));
  CHECK_EQ(2e36, Strtod(vector, 36));
  CHECK_EQ(2e37, Strtod(vector, 37));
  CHECK_EQ(2e-1, Strtod(vector, -1));
  CHECK_EQ(2e-2, Strtod(vector, -2));
  CHECK_EQ(2e-5, Strtod(vector, -5));
  CHECK_EQ(2e-20, Strtod(vector, -20));
  CHECK_EQ(2e-22, Strtod(vector, -22));
  CHECK_EQ(2e-23, Strtod(vector, -23));
  CHECK_EQ(2e-25, Strtod(vector, -25));
  CHECK_EQ(2e-39, Strtod(vector, -39));

  vector = StringToVector("9");
  CHECK_EQ(9.0, Strtod(vector, 0));
  CHECK_EQ(90.0, Strtod(vector, 1));
  CHECK_EQ(900.0, Strtod(vector, 2));
  CHECK_EQ(9e20, Strtod(vector, 20));
  CHECK_EQ(9e22, Strtod(vector, 22));
  CHECK_EQ(9e23, Strtod(vector, 23));
  CHECK_EQ(9e35, Strtod(vector, 35));
  CHECK_EQ(9e36, Strtod(vector, 36));
  CHECK_EQ(9e37, Strtod(vector, 37));
  CHECK_EQ(9e-1, Strtod(vector, -1));
  CHECK_EQ(9e-2, Strtod(vector, -2));
  CHECK_EQ(9e-5, Strtod(vector, -5));
  CHECK_EQ(9e-20, Strtod(vector, -20));
  CHECK_EQ(9e-22, Strtod(vector, -22));
  CHECK_EQ(9e-23, Strtod(vector, -23));
  CHECK_EQ(9e-25, Strtod(vector, -25));
  CHECK_EQ(9e-39, Strtod(vector, -39));

  vector = StringToVector("12345");
  CHECK_EQ(12345.0, Strtod(vector, 0));
  CHECK_EQ(123450.0, Strtod(vector, 1));
  CHECK_EQ(1234500.0, Strtod(vector, 2));
  CHECK_EQ(12345e20, Strtod(vector, 20));
  CHECK_EQ(12345e22, Strtod(vector, 22));
  CHECK_EQ(12345e23, Strtod(vector, 23));
  CHECK_EQ(12345e30, Strtod(vector, 30));
  CHECK_EQ(12345e31, Strtod(vector, 31));
  CHECK_EQ(12345e32, Strtod(vector, 32));
  CHECK_EQ(12345e35, Strtod(vector, 35));
  CHECK_EQ(12345e36, Strtod(vector, 36));
  CHECK_EQ(12345e37, Strtod(vector, 37));
  CHECK_EQ(12345e-1, Strtod(vector, -1));
  CHECK_EQ(12345e-2, Strtod(vector, -2));
  CHECK_EQ(12345e-5, Strtod(vector, -5));
  CHECK_EQ(12345e-20, Strtod(vector, -20));
  CHECK_EQ(12345e-22, Strtod(vector, -22));
  CHECK_EQ(12345e-23, Strtod(vector, -23));
  CHECK_EQ(12345e-25, Strtod(vector, -25));
  CHECK_EQ(12345e-39, Strtod(vector, -39));

  vector = StringToVector("12345678901234");
  CHECK_EQ(12345678901234.0, Strtod(vector, 0));
  CHECK_EQ(123456789012340.0, Strtod(vector, 1));
  CHECK_EQ(1234567890123400.0, Strtod(vector, 2));
  CHECK_EQ(12345678901234e20, Strtod(vector, 20));
  CHECK_EQ(12345678901234e22, Strtod(vector, 22));
  CHECK_EQ(12345678901234e23, Strtod(vector, 23));
  CHECK_EQ(12345678901234e30, Strtod(vector, 30));
  CHECK_EQ(12345678901234e31, Strtod(vector, 31));
  CHECK_EQ(12345678901234e32, Strtod(vector, 32));
  CHECK_EQ(12345678901234e35, Strtod(vector, 35));
  CHECK_EQ(12345678901234e36, Strtod(vector, 36));
  CHECK_EQ(12345678901234e37, Strtod(vector, 37));
  CHECK_EQ(12345678901234e-1, Strtod(vector, -1));
  CHECK_EQ(12345678901234e-2, Strtod(vector, -2));
  CHECK_EQ(12345678901234e-5, Strtod(vector, -5));
  CHECK_EQ(12345678901234e-20, Strtod(vector, -20));
  CHECK_EQ(12345678901234e-22, Strtod(vector, -22));
  CHECK_EQ(12345678901234e-23, Strtod(vector, -23));
  CHECK_EQ(12345678901234e-25, Strtod(vector, -25));
  CHECK_EQ(12345678901234e-39, Strtod(vector, -39));

  vector = StringToVector("123456789012345");
  CHECK_EQ(123456789012345.0, Strtod(vector, 0));
  CHECK_EQ(1234567890123450.0, Strtod(vector, 1));
  CHECK_EQ(12345678901234500.0, Strtod(vector, 2));
  CHECK_EQ(123456789012345e20, Strtod(vector, 20));
  CHECK_EQ(123456789012345e22, Strtod(vector, 22));
  CHECK_EQ(123456789012345e23, Strtod(vector, 23));
  CHECK_EQ(123456789012345e35, Strtod(vector, 35));
  CHECK_EQ(123456789012345e36, Strtod(vector, 36));
  CHECK_EQ(123456789012345e37, Strtod(vector, 37));
  CHECK_EQ(123456789012345e39, Strtod(vector, 39));
  CHECK_EQ(123456789012345e-1, Strtod(vector, -1));
  CHECK_EQ(123456789012345e-2, Strtod(vector, -2));
  CHECK_EQ(123456789012345e-5, Strtod(vector, -5));
  CHECK_EQ(123456789012345e-20, Strtod(vector, -20));
  CHECK_EQ(123456789012345e-22, Strtod(vector, -22));
  CHECK_EQ(123456789012345e-23, Strtod(vector, -23));
  CHECK_EQ(123456789012345e-25, Strtod(vector, -25));
  CHECK_EQ(123456789012345e-39, Strtod(vector, -39));

  CHECK_EQ(0.0, StrtodChar("0", 12345));
  CHECK_EQ(0.0, StrtodChar("", 1324));
  CHECK_EQ(0.0, StrtodChar("000000000", 123));
  CHECK_EQ(0.0, StrtodChar("2", -324));
  CHECK_EQ(4e-324, StrtodChar("3", -324));
  // It would be more readable to put non-zero literals on the left side (i.e.
  //   CHECK_EQ(1e-325, StrtodChar("1", -325))), but then Gcc complains that
  // they are truncated to zero.
  CHECK_EQ(0.0, StrtodChar("1", -325));
  CHECK_EQ(0.0, StrtodChar("1", -325));
  CHECK_EQ(0.0, StrtodChar("20000", -328));
  CHECK_EQ(40000e-328, StrtodChar("30000", -328));
  CHECK_EQ(0.0, StrtodChar("10000", -329));
  CHECK_EQ(0.0, StrtodChar("90000", -329));
  CHECK_EQ(0.0, StrtodChar("000000001", -325));
  CHECK_EQ(0.0, StrtodChar("000000001", -325));
  CHECK_EQ(0.0, StrtodChar("0000000020000", -328));
  CHECK_EQ(40000e-328, StrtodChar("00000030000", -328));
  CHECK_EQ(0.0, StrtodChar("0000000010000", -329));
  CHECK_EQ(0.0, StrtodChar("0000000090000", -329));

  // It would be more readable to put the literals (and not Double::Infinity())
  // on the left side (i.e. CHECK_EQ(1e309, StrtodChar("1", 309))), but then Gcc
  // complains that the floating constant exceeds range of 'double'.
  CHECK_EQ(Double::Infinity(), StrtodChar("1", 309));
  CHECK_EQ(1e308, StrtodChar("1", 308));
  CHECK_EQ(1234e305, StrtodChar("1234", 305));
  CHECK_EQ(1234e304, StrtodChar("1234", 304));
  CHECK_EQ(Double::Infinity(), StrtodChar("18", 307));
  CHECK_EQ(17e307, StrtodChar("17", 307));
  CHECK_EQ(Double::Infinity(), StrtodChar("0000001", 309));
  CHECK_EQ(1e308, StrtodChar("00000001", 308));
  CHECK_EQ(1234e305, StrtodChar("00000001234", 305));
  CHECK_EQ(1234e304, StrtodChar("000000001234", 304));
  CHECK_EQ(Double::Infinity(), StrtodChar("0000000018", 307));
  CHECK_EQ(17e307, StrtodChar("0000000017", 307));
  CHECK_EQ(Double::Infinity(), StrtodChar("1000000", 303));
  CHECK_EQ(1e308, StrtodChar("100000", 303));
  CHECK_EQ(1234e305, StrtodChar("123400000", 300));
  CHECK_EQ(1234e304, StrtodChar("123400000", 299));
  CHECK_EQ(Double::Infinity(), StrtodChar("180000000", 300));
  CHECK_EQ(17e307, StrtodChar("170000000", 300));
  CHECK_EQ(Double::Infinity(), StrtodChar("00000001000000", 303));
  CHECK_EQ(1e308, StrtodChar("000000000000100000", 303));
  CHECK_EQ(1234e305, StrtodChar("00000000123400000", 300));
  CHECK_EQ(1234e304, StrtodChar("0000000123400000", 299));
  CHECK_EQ(Double::Infinity(), StrtodChar("00000000180000000", 300));
  CHECK_EQ(17e307, StrtodChar("00000000170000000", 300));
  CHECK_EQ(1.7976931348623157E+308, StrtodChar("17976931348623157", 292));
  CHECK_EQ(1.7976931348623158E+308, StrtodChar("17976931348623158", 292));
  CHECK_EQ(Double::Infinity(), StrtodChar("17976931348623159", 292));

  // The following number is the result of 89255.0/1e-22. Both floating-point
  // numbers can be accurately represented with doubles. However on Linux,x86
  // the floating-point stack is set to 80bits and the double-rounding
  // introduces an error.
  CHECK_EQ(89255e-22, StrtodChar("89255", -22));

  // Some random values.
  CHECK_EQ(358416272e-33, StrtodChar("358416272", -33));
  CHECK_EQ(104110013277974872254e-225,
           StrtodChar("104110013277974872254", -225));

  CHECK_EQ(123456789e108, StrtodChar("123456789", 108));
  CHECK_EQ(123456789e109, StrtodChar("123456789", 109));
  CHECK_EQ(123456789e110, StrtodChar("123456789", 110));
  CHECK_EQ(123456789e111, StrtodChar("123456789", 111));
  CHECK_EQ(123456789e112, StrtodChar("123456789", 112));
  CHECK_EQ(123456789e113, StrtodChar("123456789", 113));
  CHECK_EQ(123456789e114, StrtodChar("123456789", 114));
  CHECK_EQ(123456789e115, StrtodChar("123456789", 115));

  CHECK_EQ(1234567890123456789012345e108,
           StrtodChar("1234567890123456789012345", 108));
  CHECK_EQ(1234567890123456789012345e109,
           StrtodChar("1234567890123456789012345", 109));
  CHECK_EQ(1234567890123456789012345e110,
           StrtodChar("1234567890123456789012345", 110));
  CHECK_EQ(1234567890123456789012345e111,
           StrtodChar("1234567890123456789012345", 111));
  CHECK_EQ(1234567890123456789012345e112,
           StrtodChar("1234567890123456789012345", 112));
  CHECK_EQ(1234567890123456789012345e113,
           StrtodChar("1234567890123456789012345", 113));
  CHECK_EQ(1234567890123456789012345e114,
           StrtodChar("1234567890123456789012345", 114));
  CHECK_EQ(1234567890123456789012345e115,
           StrtodChar("1234567890123456789012345", 115));

  CHECK_EQ(1234567890123456789052345e108,
           StrtodChar("1234567890123456789052345", 108));
  CHECK_EQ(1234567890123456789052345e109,
           StrtodChar("1234567890123456789052345", 109));
  CHECK_EQ(1234567890123456789052345e110,
           StrtodChar("1234567890123456789052345", 110));
  CHECK_EQ(1234567890123456789052345e111,
           StrtodChar("1234567890123456789052345", 111));
  CHECK_EQ(1234567890123456789052345e112,
           StrtodChar("1234567890123456789052345", 112));
  CHECK_EQ(1234567890123456789052345e113,
           StrtodChar("1234567890123456789052345", 113));
  CHECK_EQ(1234567890123456789052345e114,
           StrtodChar("1234567890123456789052345", 114));
  CHECK_EQ(1234567890123456789052345e115,
           StrtodChar("1234567890123456789052345", 115));

  CHECK_EQ(5.445618932859895e-255,
           StrtodChar("5445618932859895362967233318697132813618813095743952975"
                      "4392982234069699615600475529427176366709107287468930197"
                      "8628345413991790019316974825934906752493984055268219809"
                      "5012176093045431437495773903922425632551857520884625114"
                      "6241265881735209066709685420744388526014389929047617597"
                      "0302268848374508109029268898695825171158085457567481507"
                      "4162979705098246243690189880319928315307816832576838178"
                      "2563074014542859888710209237525873301724479666744537857"
                      "9026553346649664045621387124193095870305991178772256504"
                      "4368663670643970181259143319016472430928902201239474588"
                      "1392338901353291306607057623202353588698746085415097902"
                      "6640064319118728664842287477491068264828851624402189317"
                      "2769161449825765517353755844373640588822904791244190695"
                      "2998382932630754670573838138825217065450843010498555058"
                      "88186560731", -1035));

  // Boundary cases. Boundaries themselves should round to even.
  //
  // 0x1FFFFFFFFFFFF * 2^3 = 72057594037927928
  //                   next: 72057594037927936
  //               boundary: 72057594037927932  should round up.
  CHECK_EQ(72057594037927928.0, StrtodChar("72057594037927928", 0));
  CHECK_EQ(72057594037927936.0, StrtodChar("72057594037927936", 0));
  CHECK_EQ(72057594037927936.0, StrtodChar("72057594037927932", 0));
  CHECK_EQ(72057594037927928.0, StrtodChar("7205759403792793199999", -5));
  CHECK_EQ(72057594037927936.0, StrtodChar("7205759403792793200001", -5));

  // 0x1FFFFFFFFFFFF * 2^10 = 9223372036854774784
  //                    next: 9223372036854775808
  //                boundary: 9223372036854775296 should round up.
  CHECK_EQ(9223372036854774784.0, StrtodChar("9223372036854774784", 0));
  CHECK_EQ(9223372036854775808.0, StrtodChar("9223372036854775808", 0));
  CHECK_EQ(9223372036854775808.0, StrtodChar("9223372036854775296", 0));
  CHECK_EQ(9223372036854774784.0, StrtodChar("922337203685477529599999", -5));
  CHECK_EQ(9223372036854775808.0, StrtodChar("922337203685477529600001", -5));

  // 0x1FFFFFFFFFFFF * 2^50 = 10141204801825834086073718800384
  //                    next: 10141204801825835211973625643008
  //                boundary: 10141204801825834649023672221696 should round up.
  CHECK_EQ(10141204801825834086073718800384.0,
           StrtodChar("10141204801825834086073718800384", 0));
  CHECK_EQ(10141204801825835211973625643008.0,
           StrtodChar("10141204801825835211973625643008", 0));
  CHECK_EQ(10141204801825835211973625643008.0,
           StrtodChar("10141204801825834649023672221696", 0));
  CHECK_EQ(10141204801825834086073718800384.0,
           StrtodChar("1014120480182583464902367222169599999", -5));
  CHECK_EQ(10141204801825835211973625643008.0,
           StrtodChar("1014120480182583464902367222169600001", -5));

  // 0x1FFFFFFFFFFFF * 2^99 = 5708990770823838890407843763683279797179383808
  //                    next: 5708990770823839524233143877797980545530986496
  //                boundary: 5708990770823839207320493820740630171355185152
  // The boundary should round up.
  CHECK_EQ(5708990770823838890407843763683279797179383808.0,
           StrtodChar("5708990770823838890407843763683279797179383808", 0));
  CHECK_EQ(5708990770823839524233143877797980545530986496.0,
           StrtodChar("5708990770823839524233143877797980545530986496", 0));
  CHECK_EQ(5708990770823839524233143877797980545530986496.0,
           StrtodChar("5708990770823839207320493820740630171355185152", 0));
  CHECK_EQ(5708990770823838890407843763683279797179383808.0,
           StrtodChar("5708990770823839207320493820740630171355185151999", -3));
  CHECK_EQ(5708990770823839524233143877797980545530986496.0,
           StrtodChar("5708990770823839207320493820740630171355185152001", -3));

  // The following test-cases got some public attention in early 2011 when they
  // sent Java and PHP into an infinite loop.
  CHECK_EQ(2.225073858507201e-308, StrtodChar("22250738585072011", -324));
  CHECK_EQ(2.22507385850720138309e-308,
           StrtodChar("22250738585072011360574097967091319759348195463516456480"
                      "23426109724822222021076945516529523908135087914149158913"
                      "03962110687008643869459464552765720740782062174337998814"
                      "10632673292535522868813721490129811224514518898490572223"
                      "07285255133155755015914397476397983411801999323962548289"
                      "01710708185069063066665599493827577257201576306269066333"
                      "26475653000092458883164330377797918696120494973903778297"
                      "04905051080609940730262937128958950003583799967207254304"
                      "36028407889577179615094551674824347103070260914462157228"
                      "98802581825451803257070188608721131280795122334262883686"
                      "22321503775666622503982534335974568884423900265498198385"
                      "48794829220689472168983109969836584681402285424333066033"
                      "98508864458040010349339704275671864433837704860378616227"
                      "71738545623065874679014086723327636718751", -1076));
}


TEST(Strtof) {
  Vector<const char> vector;

  vector = StringToVector("0");
  CHECK_EQ(0.0f, Strtof(vector, 1));
  CHECK_EQ(0.0f, Strtof(vector, 2));
  CHECK_EQ(0.0f, Strtof(vector, -2));
  CHECK_EQ(0.0f, Strtof(vector, -999));
  CHECK_EQ(0.0f, Strtof(vector, +999));

  vector = StringToVector("1");
  CHECK_EQ(1.0f, Strtof(vector, 0));
  CHECK_EQ(10.0f, Strtof(vector, 1));
  CHECK_EQ(100.0f, Strtof(vector, 2));
  CHECK_EQ(1e20f, Strtof(vector, 20));
  CHECK_EQ(1e22f, Strtof(vector, 22));
  CHECK_EQ(1e23f, Strtof(vector, 23));
  CHECK_EQ(1e35f, Strtof(vector, 35));
  CHECK_EQ(1e36f, Strtof(vector, 36));
  CHECK_EQ(1e37f, Strtof(vector, 37));
  CHECK_EQ(1e-1f, Strtof(vector, -1));
  CHECK_EQ(1e-2f, Strtof(vector, -2));
  CHECK_EQ(1e-5f, Strtof(vector, -5));
  CHECK_EQ(1e-20f, Strtof(vector, -20));
  CHECK_EQ(1e-22f, Strtof(vector, -22));
  CHECK_EQ(1e-23f, Strtof(vector, -23));
  CHECK_EQ(1e-25f, Strtof(vector, -25));
  CHECK_EQ(1e-39f, Strtof(vector, -39));

  vector = StringToVector("2");
  CHECK_EQ(2.0f, Strtof(vector, 0));
  CHECK_EQ(20.0f, Strtof(vector, 1));
  CHECK_EQ(200.0f, Strtof(vector, 2));
  CHECK_EQ(2e20f, Strtof(vector, 20));
  CHECK_EQ(2e22f, Strtof(vector, 22));
  CHECK_EQ(2e23f, Strtof(vector, 23));
  CHECK_EQ(2e35f, Strtof(vector, 35));
  CHECK_EQ(2e36f, Strtof(vector, 36));
  CHECK_EQ(2e37f, Strtof(vector, 37));
  CHECK_EQ(2e-1f, Strtof(vector, -1));
  CHECK_EQ(2e-2f, Strtof(vector, -2));
  CHECK_EQ(2e-5f, Strtof(vector, -5));
  CHECK_EQ(2e-20f, Strtof(vector, -20));
  CHECK_EQ(2e-22f, Strtof(vector, -22));
  CHECK_EQ(2e-23f, Strtof(vector, -23));
  CHECK_EQ(2e-25f, Strtof(vector, -25));
  CHECK_EQ(2e-39f, Strtof(vector, -39));

  vector = StringToVector("9");
  CHECK_EQ(9.0f, Strtof(vector, 0));
  CHECK_EQ(90.0f, Strtof(vector, 1));
  CHECK_EQ(900.0f, Strtof(vector, 2));
  CHECK_EQ(9e20f, Strtof(vector, 20));
  CHECK_EQ(9e22f, Strtof(vector, 22));
  CHECK_EQ(9e23f, Strtof(vector, 23));
  CHECK_EQ(9e35f, Strtof(vector, 35));
  CHECK_EQ(9e36f, Strtof(vector, 36));
  CHECK_EQ(9e37f, Strtof(vector, 37));
  CHECK_EQ(9e-1f, Strtof(vector, -1));
  CHECK_EQ(9e-2f, Strtof(vector, -2));
  CHECK_EQ(9e-5f, Strtof(vector, -5));
  CHECK_EQ(9e-20f, Strtof(vector, -20));
  CHECK_EQ(9e-22f, Strtof(vector, -22));
  CHECK_EQ(9e-23f, Strtof(vector, -23));
  CHECK_EQ(9e-25f, Strtof(vector, -25));
  CHECK_EQ(9e-39f, Strtof(vector, -39));

  vector = StringToVector("12345");
  CHECK_EQ(12345.0f, Strtof(vector, 0));
  CHECK_EQ(123450.0f, Strtof(vector, 1));
  CHECK_EQ(1234500.0f, Strtof(vector, 2));
  CHECK_EQ(12345e20f, Strtof(vector, 20));
  CHECK_EQ(12345e22f, Strtof(vector, 22));
  CHECK_EQ(12345e23f, Strtof(vector, 23));
  CHECK_EQ(12345e30f, Strtof(vector, 30));
  CHECK_EQ(12345e31f, Strtof(vector, 31));
  CHECK_EQ(12345e32f, Strtof(vector, 32));
  CHECK_EQ(12345e-1f, Strtof(vector, -1));
  CHECK_EQ(12345e-2f, Strtof(vector, -2));
  CHECK_EQ(12345e-5f, Strtof(vector, -5));
  CHECK_EQ(12345e-20f, Strtof(vector, -20));
  CHECK_EQ(12345e-22f, Strtof(vector, -22));
  CHECK_EQ(12345e-23f, Strtof(vector, -23));
  CHECK_EQ(12345e-25f, Strtof(vector, -25));
  CHECK_EQ(12345e-39f, Strtof(vector, -39));

  vector = StringToVector("12345678901234");
  CHECK_EQ(12345678901234.0f, Strtof(vector, 0));
  CHECK_EQ(123456789012340.0f, Strtof(vector, 1));
  CHECK_EQ(1234567890123400.0f, Strtof(vector, 2));
  CHECK_EQ(12345678901234e20f, Strtof(vector, 20));
  CHECK_EQ(12345678901234e22f, Strtof(vector, 22));
  CHECK_EQ(12345678901234e23f, Strtof(vector, 23));
  CHECK_EQ(12345678901234e-1f, Strtof(vector, -1));
  CHECK_EQ(12345678901234e-2f, Strtof(vector, -2));
  CHECK_EQ(12345678901234e-5f, Strtof(vector, -5));
  CHECK_EQ(12345678901234e-20f, Strtof(vector, -20));
  CHECK_EQ(12345678901234e-22f, Strtof(vector, -22));
  CHECK_EQ(12345678901234e-23f, Strtof(vector, -23));
  CHECK_EQ(12345678901234e-25f, Strtof(vector, -25));
  CHECK_EQ(12345678901234e-39f, Strtof(vector, -39));

  vector = StringToVector("123456789012345");
  CHECK_EQ(123456789012345.0f, Strtof(vector, 0));
  CHECK_EQ(1234567890123450.0f, Strtof(vector, 1));
  CHECK_EQ(12345678901234500.0f, Strtof(vector, 2));
  CHECK_EQ(123456789012345e20f, Strtof(vector, 20));
  CHECK_EQ(123456789012345e22f, Strtof(vector, 22));
  CHECK_EQ(123456789012345e23f, Strtof(vector, 23));
  CHECK_EQ(123456789012345e-1f, Strtof(vector, -1));
  CHECK_EQ(123456789012345e-2f, Strtof(vector, -2));
  CHECK_EQ(123456789012345e-5f, Strtof(vector, -5));
  CHECK_EQ(123456789012345e-20f, Strtof(vector, -20));
  CHECK_EQ(123456789012345e-22f, Strtof(vector, -22));
  CHECK_EQ(123456789012345e-23f, Strtof(vector, -23));
  CHECK_EQ(123456789012345e-25f, Strtof(vector, -25));
  CHECK_EQ(123456789012345e-39f, Strtof(vector, -39));

  CHECK_EQ(0.0f, StrtofChar("0", 12345));
  CHECK_EQ(0.0f, StrtofChar("", 1324));
  CHECK_EQ(0.0f, StrtofChar("000000000", 123));
  CHECK_EQ(0.0f, StrtofChar("2", -324));
  CHECK_EQ(1e-45f, StrtofChar("1", -45));
  // It would be more readable to put non-zero literals on the left side (i.e.
  //   CHECK_EQ(1e-46, StrtofChar("1", -45))), but then Gcc complains that
  // they are truncated to zero.
  CHECK_EQ(0.0f, StrtofChar("1", -46));
  CHECK_EQ(0.0f, StrtofChar("1", -47));
  CHECK_EQ(1e-45f, StrtofChar("1", -45));
  CHECK_EQ(1e-45f, StrtofChar("8", -46));
  CHECK_EQ(0.0f, StrtofChar("200000", -51));
  CHECK_EQ(100000e-50f, StrtofChar("100000", -50));
  CHECK_EQ(0.0f, StrtofChar("100000", -51));
  CHECK_EQ(0.0f, StrtofChar("900000", -52));
  CHECK_EQ(0.0f, StrtofChar("000000001", -47));
  CHECK_EQ(0.0f, StrtofChar("000000001", -47));
  CHECK_EQ(0.0f, StrtofChar("00000000200000", -51));
  CHECK_EQ(800000e-50f, StrtofChar("000000800000", -50));
  CHECK_EQ(0.0f, StrtofChar("00000000100000", -51));
  CHECK_EQ(1e-45f, StrtofChar("00000000900000", -51));

  // It would be more readable to put the literals (and not Double::Infinity())
  // on the left side (i.e. CHECK_EQ(3e38, StrtofChar("3", 38))), but then Gcc
  // complains that the floating constant exceeds range of 'double'.
  CHECK_EQ(Single::Infinity(), StrtofChar("3", 39));
  CHECK_EQ(3e38f, StrtofChar("3", 38));
  CHECK_EQ(3401e35f, StrtofChar("3401", 35));
  CHECK_EQ(3401e34f, StrtofChar("3401", 34));
  CHECK_EQ(Single::Infinity(), StrtofChar("3410", 35));
  CHECK_EQ(34e37f, StrtofChar("34", 37));
  CHECK_EQ(Single::Infinity(), StrtofChar("0000001", 39));
  CHECK_EQ(3401e35f, StrtofChar("0000003401", 35));
  CHECK_EQ(3401e34f, StrtofChar("0000003401", 34));
  CHECK_EQ(Single::Infinity(), StrtofChar("0000003410", 35));
  CHECK_EQ(34e37f, StrtofChar("00000034", 37));
  CHECK_EQ(1e38f, StrtofChar("100000", 33));
  CHECK_EQ(3401e35f, StrtofChar("340100000", 30));
  CHECK_EQ(3401e34f, StrtofChar("340100000", 29));
  CHECK_EQ(Single::Infinity(), StrtofChar("341000000", 30));
  CHECK_EQ(34e37f, StrtofChar("3400000", 32));
  CHECK_EQ(1e38f, StrtofChar("00000100000", 33));
  CHECK_EQ(3401e35f, StrtofChar("00000340100000", 30));
  CHECK_EQ(3401e34f, StrtofChar("00000340100000", 29));
  CHECK_EQ(Single::Infinity(), StrtofChar("00000341000000", 30));
  CHECK_EQ(34e37f, StrtofChar("000003400000", 32));
  CHECK_EQ(3.4028234e+38f, StrtofChar("34028235676", 28));
  CHECK_EQ(3.4028234e+38f, StrtofChar("34028235677", 28));
  CHECK_EQ(Single::Infinity(), StrtofChar("34028235678", 28));

  // The following number is the result of 89255.0/1e-22. Both floating-point
  // numbers can be accurately represented with doubles. However on Linux,x86
  // the floating-point stack is set to 80bits and the double-rounding
  // introduces an error.
  CHECK_EQ(89255e-22f, StrtofChar("89255", -22));

  // Boundary cases. Boundaries themselves should round to even.
  //
  // 0x4f012334 = 2166567936
  //      next:   2166568192
  //  boundary:   2166568064 should round down.
  CHECK_EQ(2166567936.0f, StrtofChar("2166567936", 0));
  CHECK_EQ(2166568192.0f, StrtofChar("2166568192", 0));
  CHECK_EQ(2166567936.0f, StrtofChar("2166568064", 0));
  CHECK_EQ(2166567936.0f, StrtofChar("216656806399999", -5));
  CHECK_EQ(2166568192.0f, StrtofChar("216656806400001", -5));
  // Verify that we don't double round.
  // Get the boundary of the boundary.
  CHECK_EQ(2.1665680640000002384185791015625e9, 2166568064.0);
  // Visual Studio gets this wrong and believes that these two numbers are the
  // same doubles. We want to test our conversion and not the compiler. We
  // therefore disable the check.
#ifndef _MSC_VER
  CHECK(2.16656806400000023841857910156251e9 != 2166568064.0);
#endif
  CHECK_EQ(2166568192.0f, StrtofChar("21665680640000002384185791015625", -22));

  // 0x4fffffff = 8589934080
  //      next:   8589934592
  //  boundary:   8589934336 should round up.
  CHECK_EQ(8589934080.0f, StrtofChar("8589934080", 0));
  CHECK_EQ(8589934592.0f, StrtofChar("8589934592", 0));
  CHECK_EQ(8589934592.0f, StrtofChar("8589934336", 0));
  CHECK_EQ(8589934080.0f, StrtofChar("858993433599999", -5));
  CHECK_EQ(8589934592.0f, StrtofChar("858993433600001", -5));
  // Verify that we don't double round.
  // Get the boundary of the boundary.
  // Visual Studio gets this wrong. To avoid failing tests because of a broken
  // compiler we disable the following two tests. They were only testing the
  // compiler. The real test is still active.
#ifndef _MSC_VER
  CHECK_EQ(8.589934335999999523162841796875e+09, 8589934336.0);
  CHECK(8.5899343359999995231628417968749e+09 != 8589934336.0);
#endif
  CHECK_EQ(8589934080.0f, StrtofChar("8589934335999999523162841796875", -21));

  // 0x4f000000 = 2147483648
  //      next:   2147483904
  //  boundary:   2147483776 should round down.
  CHECK_EQ(2147483648.0f, StrtofChar("2147483648", 0));
  CHECK_EQ(2147483904.0f, StrtofChar("2147483904", 0));
  CHECK_EQ(2147483648.0f, StrtofChar("2147483776", 0));
  CHECK_EQ(2147483648.0f, StrtofChar("214748377599999", -5));
  CHECK_EQ(2147483904.0f, StrtofChar("214748377600001", -5));

}


static int CompareBignumToDiyFp(const Bignum& bignum_digits,
                                int bignum_exponent,
                                DiyFp diy_fp) {
  Bignum bignum;
  bignum.AssignBignum(bignum_digits);
  Bignum other;
  other.AssignUInt64(diy_fp.f());
  if (bignum_exponent >= 0) {
    bignum.MultiplyByPowerOfTen(bignum_exponent);
  } else {
    other.MultiplyByPowerOfTen(-bignum_exponent);
  }
  if (diy_fp.e() >= 0) {
    other.ShiftLeft(diy_fp.e());
  } else {
    bignum.ShiftLeft(-diy_fp.e());
  }
  return Bignum::Compare(bignum, other);
}


static bool CheckDouble(Vector<const char> buffer,
                        int exponent,
                        double to_check) {
  DiyFp lower_boundary;
  DiyFp upper_boundary;
  Bignum input_digits;
  input_digits.AssignDecimalString(buffer);
  if (to_check == 0.0) {
    const double kMinDouble = 4e-324;
    // Check that the buffer*10^exponent < (0 + kMinDouble)/2.
    Double d(kMinDouble);
    d.NormalizedBoundaries(&lower_boundary, &upper_boundary);
    return CompareBignumToDiyFp(input_digits, exponent, lower_boundary) <= 0;
  }
  if (to_check == Double::Infinity()) {
    const double kMaxDouble = 1.7976931348623157e308;
    // Check that the buffer*10^exponent >= boundary between kMaxDouble and inf.
    Double d(kMaxDouble);
    d.NormalizedBoundaries(&lower_boundary, &upper_boundary);
    return CompareBignumToDiyFp(input_digits, exponent, upper_boundary) >= 0;
  }
  Double d(to_check);
  d.NormalizedBoundaries(&lower_boundary, &upper_boundary);
  if ((d.Significand() & 1) == 0) {
    return CompareBignumToDiyFp(input_digits, exponent, lower_boundary) >= 0 &&
        CompareBignumToDiyFp(input_digits, exponent, upper_boundary) <= 0;
  } else {
    return CompareBignumToDiyFp(input_digits, exponent, lower_boundary) > 0 &&
        CompareBignumToDiyFp(input_digits, exponent, upper_boundary) < 0;
  }
}


// Copied from v8.cc and adapted to make the function deterministic.
static uint32_t DeterministicRandom() {
  // Random number generator using George Marsaglia's MWC algorithm.
  static uint32_t hi = 0;
  static uint32_t lo = 0;

  // Initialization values don't have any special meaning. (They are the result
  // of two calls to random().)
  if (hi == 0) hi = 0xbfe166e7;
  if (lo == 0) lo = 0x64d1c3c9;

  // Mix the bits.
  hi = 36969 * (hi & 0xFFFF) + (hi >> 16);
  lo = 18273 * (lo & 0xFFFF) + (lo >> 16);
  return (hi << 16) + (lo & 0xFFFF);
}


static const int kBufferSize = 1024;
static const int kShortStrtodRandomCount = 2;
static const int kLargeStrtodRandomCount = 2;

TEST(RandomStrtod) {
  char buffer[kBufferSize];
  for (int length = 1; length < 15; length++) {
    for (int i = 0; i < kShortStrtodRandomCount; ++i) {
      int pos = 0;
      for (int j = 0; j < length; ++j) {
        buffer[pos++] = DeterministicRandom() % 10 + '0';
      }
      int exponent = DeterministicRandom() % (25*2 + 1) - 25 - length;
      buffer[pos] = '\0';
      Vector<const char> vector(buffer, pos);
      double strtod_result = Strtod(vector, exponent);
      CHECK(CheckDouble(vector, exponent, strtod_result));
    }
  }
  for (int length = 15; length < 800; length += 2) {
    for (int i = 0; i < kLargeStrtodRandomCount; ++i) {
      int pos = 0;
      for (int j = 0; j < length; ++j) {
        buffer[pos++] = DeterministicRandom() % 10 + '0';
      }
      int exponent = DeterministicRandom() % (308*2 + 1) - 308 - length;
      buffer[pos] = '\0';
      Vector<const char> vector(buffer, pos);
      double strtod_result = Strtod(vector, exponent);
      CHECK(CheckDouble(vector, exponent, strtod_result));
    }
  }
}


static bool CheckFloat(Vector<const char> buffer,
                        int exponent,
                        float to_check) {
  DiyFp lower_boundary;
  DiyFp upper_boundary;
  Bignum input_digits;
  input_digits.AssignDecimalString(buffer);
  if (to_check == 0.0) {
    const float kMinFloat = 1e-45f;
    // Check that the buffer*10^exponent < (0 + kMinFloat)/2.
    Single s(kMinFloat);
    s.NormalizedBoundaries(&lower_boundary, &upper_boundary);
    return CompareBignumToDiyFp(input_digits, exponent, lower_boundary) <= 0;
  }
  if (to_check == static_cast<float>(Double::Infinity())) {
    const float kMaxFloat = 3.4028234e38f;
    // Check that the buffer*10^exponent >= boundary between kMaxFloat and inf.
    Single s(kMaxFloat);
    s.NormalizedBoundaries(&lower_boundary, &upper_boundary);
    return CompareBignumToDiyFp(input_digits, exponent, upper_boundary) >= 0;
  }
  Single s(to_check);
  s.NormalizedBoundaries(&lower_boundary, &upper_boundary);
  if ((s.Significand() & 1) == 0) {
    return CompareBignumToDiyFp(input_digits, exponent, lower_boundary) >= 0 &&
        CompareBignumToDiyFp(input_digits, exponent, upper_boundary) <= 0;
  } else {
    return CompareBignumToDiyFp(input_digits, exponent, lower_boundary) > 0 &&
        CompareBignumToDiyFp(input_digits, exponent, upper_boundary) < 0;
  }
}


static const int kShortStrtofRandomCount = 2;
static const int kLargeStrtofRandomCount = 2;

TEST(RandomStrtof) {
  char buffer[kBufferSize];
  for (int length = 1; length < 15; length++) {
    for (int i = 0; i < kShortStrtofRandomCount; ++i) {
      int pos = 0;
      for (int j = 0; j < length; ++j) {
        buffer[pos++] = DeterministicRandom() % 10 + '0';
      }
      int exponent = DeterministicRandom() % (5*2 + 1) - 5 - length;
      buffer[pos] = '\0';
      Vector<const char> vector(buffer, pos);
      float strtof_result = Strtof(vector, exponent);
      CHECK(CheckFloat(vector, exponent, strtof_result));
    }
  }
  for (int length = 15; length < 800; length += 2) {
    for (int i = 0; i < kLargeStrtofRandomCount; ++i) {
      int pos = 0;
      for (int j = 0; j < length; ++j) {
        buffer[pos++] = DeterministicRandom() % 10 + '0';
      }
      int exponent = DeterministicRandom() % (38*2 + 1) - 38 - length;
      buffer[pos] = '\0';
      Vector<const char> vector(buffer, pos);
      float strtof_result = Strtof(vector, exponent);
      CHECK(CheckFloat(vector, exponent, strtof_result));
    }
  }
}
