/*
 * Copyright 2018-present Facebook, Inc.
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
#include <folly/Unicode.h>

#include <initializer_list>
#include <stdexcept>

#include <folly/Range.h>
#include <folly/portability/GTest.h>

using folly::utf8ToCodePoint;

void testValid(std::initializer_list<unsigned char> data, char32_t expected) {
  {
    const unsigned char* p = data.begin();
    const unsigned char* e = data.end();
    EXPECT_EQ(utf8ToCodePoint(p, e, /* skipOnError */ false), expected)
        << folly::StringPiece(
               (const char*)data.begin(), (const char*)data.end());
  }
  {
    const unsigned char* p = data.begin();
    const unsigned char* e = data.end();
    EXPECT_EQ(utf8ToCodePoint(p, e, /* skipOnError */ true), expected)
        << folly::StringPiece(
               (const char*)data.begin(), (const char*)data.end());
  }
}

void testInvalid(std::initializer_list<unsigned char> data) {
  {
    const unsigned char* p = data.begin();
    const unsigned char* e = data.end();
    EXPECT_THROW(
        utf8ToCodePoint(p, e, /* skipOnError */ false), std::runtime_error)
        << folly::StringPiece(
               (const char*)data.begin(), (const char*)data.end());
  }
  {
    const unsigned char* p = data.begin();
    const unsigned char* e = data.end();
    EXPECT_EQ(utf8ToCodePoint(p, e, /* skipOnError */ true), 0xfffd)
        << folly::StringPiece(
               (const char*)data.begin(), (const char*)data.end());
  }
}

TEST(InvalidUtf8ToCodePoint, rfc3629Overlong) {
  // https://tools.ietf.org/html/rfc3629
  // Implementations of the decoding algorithm above MUST protect against
  // decoding invalid sequences.  For instance, a naive implementation may
  // decode the overlong UTF-8 sequence C0 80 into the character U+0000 [...]
  // Decoding invalid sequences may have security consequences or cause other
  // problems.
  testInvalid({0xC0, 0x80});
}

TEST(InvalidUtf8ToCodePoint, rfc3629SurrogatePair) {
  // https://tools.ietf.org/html/rfc3629
  // Implementations of the decoding algorithm above MUST protect against
  // decoding invalid sequences.  For instance, a naive implementation may
  // decode [...] the surrogate pair ED A1 8C ED BE B4 into U+233B4.
  // Decoding invalid sequences may have security consequences or cause other
  // problems.
  testInvalid({0xED, 0xA1, 0x8C, 0xED, 0xBE, 0xB4});
}

TEST(InvalidUtf8ToCodePoint, MarkusKuhnSingleUTF16Surrogates) {
  // https://www.cl.cam.ac.uk/~mgk25/ucs/examples/UTF-8-test.txt
  // 5.1.1  U+D800 = ed a0 80
  // 5.1.2  U+DB7F = ed ad bf
  // 5.1.3  U+DB80 = ed ae 80
  // 5.1.4  U+DBFF = ed af bf
  // 5.1.5  U+DC00 = ed b0 80
  // 5.1.6  U+DF80 = ed be 80
  // 5.1.7  U+DFFF = ed bf bf
  testInvalid({0xed, 0xa0, 0x80});
  testInvalid({0xed, 0xad, 0xbf});
  testInvalid({0xed, 0xae, 0x80});
  testInvalid({0xed, 0xaf, 0xbf});
  testInvalid({0xed, 0xb0, 0x80});
  testInvalid({0xed, 0xbe, 0x80});
  testInvalid({0xed, 0xbf, 0xbf});
}

TEST(InvalidUtf8ToCodePoint, MarkusKuhnPairedUTF16Surrogates) {
  // https://www.cl.cam.ac.uk/~mgk25/ucs/examples/UTF-8-test.txt
  // 5.2.1  U+D800 U+DC00 = ed a0 80 ed b0 80
  // 5.2.2  U+D800 U+DFFF = ed a0 80 ed bf bf
  // 5.2.3  U+DB7F U+DC00 = ed ad bf ed b0 80
  // 5.2.4  U+DB7F U+DFFF = ed ad bf ed bf bf
  // 5.2.5  U+DB80 U+DC00 = ed ae 80 ed b0 80
  // 5.2.6  U+DB80 U+DFFF = ed ae 80 ed bf bf
  // 5.2.7  U+DBFF U+DC00 = ed af bf ed b0 80
  // 5.2.8  U+DBFF U+DFFF = ed af bf ed bf bf
  testInvalid({0xed, 0xa0, 0x80, 0xed, 0xb0, 0x80});
  testInvalid({0xed, 0xa0, 0x80, 0xed, 0xbf, 0xbf});
  testInvalid({0xed, 0xad, 0xbf, 0xed, 0xb0, 0x80});
  testInvalid({0xed, 0xad, 0xbf, 0xed, 0xbf, 0xbf});
  testInvalid({0xed, 0xae, 0x80, 0xed, 0xb0, 0x80});
  testInvalid({0xed, 0xae, 0x80, 0xed, 0xbf, 0xbf});
  testInvalid({0xed, 0xaf, 0xbf, 0xed, 0xb0, 0x80});
  testInvalid({0xed, 0xaf, 0xbf, 0xed, 0xbf, 0xbf});
}

TEST(ValidUtf8ToCodePoint, FourCloverLeaf) {
  testValid({0xF0, 0x9F, 0x8D, 0x80}, 0x1F340); // u8"\U0001F340";
}

TEST(InvalidUtf8ToCodePoint, FourCloverLeafAsSurrogates) {
  testInvalid({0xd8, 0x3c, 0xdf, 0x40}); // u8"\U0001F340";
}

TEST(ValidUtf8ToCodePoint, LastCodePoint) {
  testValid({0xF4, 0x8F, 0xBF, 0xBF}, 0x10FFFF); // u8"\U0010FFFF";
}
