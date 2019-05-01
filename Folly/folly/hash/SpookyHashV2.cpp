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

// Spooky Hash
// A 128-bit noncryptographic hash, for checksums and table lookup
// By Bob Jenkins.  Public domain.
//   Oct 31 2010: published framework, disclaimer ShortHash isn't right
//   Nov 7 2010: disabled ShortHash
//   Oct 31 2011: replace End, ShortMix, ShortEnd, enable ShortHash again
//   April 10 2012: buffer overflow on platforms without unaligned reads
//   July 12 2012: was passing out variables in final to in/out in short
//   July 30 2012: I reintroduced the buffer overflow
//   August 5 2012: SpookyV2: d = should be d += in short hash, and remove
//                  extra mix from long hash

#include <folly/hash/SpookyHashV2.h>

#include <folly/CppAttributes.h>
#include <folly/Portability.h>

#include <cstring>

namespace folly {
namespace hash {

// clang-format off

//
// short hash ... it could be used on any message,
// but it's used by Spooky just for short messages.
//
void SpookyHashV2::Short(
    const void *message,
    size_t length,
    uint64_t *hash1,
    uint64_t *hash2)
{
    uint64_t buf[2*sc_numVars];
    union
    {
        const uint8_t *p8;
        uint32_t *p32;
        uint64_t *p64;
        size_t i;
    } u;

    u.p8 = (const uint8_t *)message;

    if (!kHasUnalignedAccess && (u.i & 0x7))
    {
        memcpy(buf, message, length);
        u.p64 = buf;
    }

    size_t remainder = length%32;
    uint64_t a=*hash1;
    uint64_t b=*hash2;
    uint64_t c=sc_const;
    uint64_t d=sc_const;

    if (length > 15)
    {
        const uint64_t *end = u.p64 + (length/32)*4;

        // handle all complete sets of 32 bytes
        for (; u.p64 < end; u.p64 += 4)
        {
            c += u.p64[0];
            d += u.p64[1];
            ShortMix(a,b,c,d);
            a += u.p64[2];
            b += u.p64[3];
        }

        //Handle the case of 16+ remaining bytes.
        if (remainder >= 16)
        {
            c += u.p64[0];
            d += u.p64[1];
            ShortMix(a,b,c,d);
            u.p64 += 2;
            remainder -= 16;
        }
    }

    // Handle the last 0..15 bytes, and its length
    d += ((uint64_t)length) << 56;
    switch (remainder)
    {
    case 15:
        d += ((uint64_t)u.p8[14]) << 48;
        FOLLY_FALLTHROUGH;
    case 14:
        d += ((uint64_t)u.p8[13]) << 40;
        FOLLY_FALLTHROUGH;
    case 13:
        d += ((uint64_t)u.p8[12]) << 32;
        FOLLY_FALLTHROUGH;
    case 12:
        d += u.p32[2];
        c += u.p64[0];
        break;
    case 11:
        d += ((uint64_t)u.p8[10]) << 16;
        FOLLY_FALLTHROUGH;
    case 10:
        d += ((uint64_t)u.p8[9]) << 8;
        FOLLY_FALLTHROUGH;
    case 9:
        d += (uint64_t)u.p8[8];
        FOLLY_FALLTHROUGH;
    case 8:
        c += u.p64[0];
        break;
    case 7:
        c += ((uint64_t)u.p8[6]) << 48;
        FOLLY_FALLTHROUGH;
    case 6:
        c += ((uint64_t)u.p8[5]) << 40;
        FOLLY_FALLTHROUGH;
    case 5:
        c += ((uint64_t)u.p8[4]) << 32;
        FOLLY_FALLTHROUGH;
    case 4:
        c += u.p32[0];
        break;
    case 3:
        c += ((uint64_t)u.p8[2]) << 16;
        FOLLY_FALLTHROUGH;
    case 2:
        c += ((uint64_t)u.p8[1]) << 8;
        FOLLY_FALLTHROUGH;
    case 1:
        c += (uint64_t)u.p8[0];
        break;
    case 0:
        c += sc_const;
        d += sc_const;
    }
    ShortEnd(a,b,c,d);
    *hash1 = a;
    *hash2 = b;
}




// do the whole hash in one call
void SpookyHashV2::Hash128(
    const void *message,
    size_t length,
    uint64_t *hash1,
    uint64_t *hash2)
{
    if (length < sc_bufSize)
    {
        Short(message, length, hash1, hash2);
        return;
    }

    uint64_t h0,h1,h2,h3,h4,h5,h6,h7,h8,h9,h10,h11;
    uint64_t buf[sc_numVars];
    uint64_t *end;
    union
    {
        const uint8_t *p8;
        uint64_t *p64;
        size_t i;
    } u;
    size_t remainder;

    h0=h3=h6=h9  = *hash1;
    h1=h4=h7=h10 = *hash2;
    h2=h5=h8=h11 = sc_const;

    u.p8 = (const uint8_t *)message;
    end = u.p64 + (length/sc_blockSize)*sc_numVars;

    // handle all whole sc_blockSize blocks of bytes
    if (kHasUnalignedAccess || ((u.i & 0x7) == 0))
    {
        while (u.p64 < end)
        {
            Mix(u.p64, h0,h1,h2,h3,h4,h5,h6,h7,h8,h9,h10,h11);
            u.p64 += sc_numVars;
        }
    }
    else
    {
        while (u.p64 < end)
        {
            memcpy(buf, u.p64, sc_blockSize);
            Mix(buf, h0,h1,h2,h3,h4,h5,h6,h7,h8,h9,h10,h11);
            u.p64 += sc_numVars;
        }
    }

    // handle the last partial block of sc_blockSize bytes
    remainder = (length - ((const uint8_t *)end-(const uint8_t *)message));
    memcpy(buf, end, remainder);
    memset(((uint8_t *)buf)+remainder, 0, sc_blockSize-remainder);
    ((uint8_t*)buf)[sc_blockSize - 1] = uint8_t(remainder);

    // do some final mixing
    End(buf, h0,h1,h2,h3,h4,h5,h6,h7,h8,h9,h10,h11);
    *hash1 = h0;
    *hash2 = h1;
}



// init spooky state
void SpookyHashV2::Init(uint64_t seed1, uint64_t seed2)
{
    m_length = 0;
    m_remainder = 0;
    m_state[0] = seed1;
    m_state[1] = seed2;
}


// add a message fragment to the state
void SpookyHashV2::Update(const void *message, size_t length)
{
    uint64_t h0,h1,h2,h3,h4,h5,h6,h7,h8,h9,h10,h11;
    size_t newLength = length + m_remainder;
    uint8_t  remainder;
    union
    {
        const uint8_t *p8;
        uint64_t *p64;
        size_t i;
    } u;
    const uint64_t *end;

    // Is this message fragment too short?  If it is, stuff it away.
    if (newLength < sc_bufSize)
    {
        memcpy(&((uint8_t *)m_data)[m_remainder], message, length);
        m_length = length + m_length;
        m_remainder = (uint8_t)newLength;
        return;
    }

    // init the variables
    if (m_length < sc_bufSize)
    {
        h0=h3=h6=h9  = m_state[0];
        h1=h4=h7=h10 = m_state[1];
        h2=h5=h8=h11 = sc_const;
    }
    else
    {
        h0 = m_state[0];
        h1 = m_state[1];
        h2 = m_state[2];
        h3 = m_state[3];
        h4 = m_state[4];
        h5 = m_state[5];
        h6 = m_state[6];
        h7 = m_state[7];
        h8 = m_state[8];
        h9 = m_state[9];
        h10 = m_state[10];
        h11 = m_state[11];
    }
    m_length = length + m_length;

    // if we've got anything stuffed away, use it now
    if (m_remainder)
    {
        uint8_t prefix = sc_bufSize-m_remainder;
        memcpy(&(((uint8_t *)m_data)[m_remainder]), message, prefix);
        u.p64 = m_data;
        Mix(u.p64, h0,h1,h2,h3,h4,h5,h6,h7,h8,h9,h10,h11);
        Mix(&u.p64[sc_numVars], h0,h1,h2,h3,h4,h5,h6,h7,h8,h9,h10,h11);
        u.p8 = ((const uint8_t *)message) + prefix;
        length -= prefix;
    }
    else
    {
        u.p8 = (const uint8_t *)message;
    }

    // handle all whole blocks of sc_blockSize bytes
    end = u.p64 + (length/sc_blockSize)*sc_numVars;
    remainder = (uint8_t)(length-((const uint8_t *)end-u.p8));
    if (kHasUnalignedAccess || (u.i & 0x7) == 0)
    {
        while (u.p64 < end)
        {
            Mix(u.p64, h0,h1,h2,h3,h4,h5,h6,h7,h8,h9,h10,h11);
            u.p64 += sc_numVars;
        }
    }
    else
    {
        while (u.p64 < end)
        {
            memcpy(m_data, u.p8, sc_blockSize);
            Mix(m_data, h0,h1,h2,h3,h4,h5,h6,h7,h8,h9,h10,h11);
            u.p64 += sc_numVars;
        }
    }

    // stuff away the last few bytes
    m_remainder = remainder;
    memcpy(m_data, end, remainder);

    // stuff away the variables
    m_state[0] = h0;
    m_state[1] = h1;
    m_state[2] = h2;
    m_state[3] = h3;
    m_state[4] = h4;
    m_state[5] = h5;
    m_state[6] = h6;
    m_state[7] = h7;
    m_state[8] = h8;
    m_state[9] = h9;
    m_state[10] = h10;
    m_state[11] = h11;
}


// report the hash for the concatenation of all message fragments so far
void SpookyHashV2::Final(uint64_t *hash1, uint64_t *hash2) const
{
    // init the variables
    if (m_length < sc_bufSize)
    {
        *hash1 = m_state[0];
        *hash2 = m_state[1];
        Short( m_data, m_length, hash1, hash2);
        return;
    }

    uint64_t buf[2*sc_numVars];
    memcpy(buf, m_data, sizeof(buf));
    uint64_t *data = buf;
    uint8_t remainder = m_remainder;

    uint64_t h0 = m_state[0];
    uint64_t h1 = m_state[1];
    uint64_t h2 = m_state[2];
    uint64_t h3 = m_state[3];
    uint64_t h4 = m_state[4];
    uint64_t h5 = m_state[5];
    uint64_t h6 = m_state[6];
    uint64_t h7 = m_state[7];
    uint64_t h8 = m_state[8];
    uint64_t h9 = m_state[9];
    uint64_t h10 = m_state[10];
    uint64_t h11 = m_state[11];

    if (remainder >= sc_blockSize)
    {
        // m_data can contain two blocks; handle any whole first block
        Mix(data, h0,h1,h2,h3,h4,h5,h6,h7,h8,h9,h10,h11);
        data += sc_numVars;
        remainder -= sc_blockSize;
    }

    // mix in the last partial block, and the length mod sc_blockSize
    memset(&((uint8_t *)data)[remainder], 0, (sc_blockSize-remainder));

    ((uint8_t *)data)[sc_blockSize-1] = remainder;

    // do some final mixing
    End(data, h0,h1,h2,h3,h4,h5,h6,h7,h8,h9,h10,h11);

    *hash1 = h0;
    *hash2 = h1;
}

// clang-format on

} // namespace hash
} // namespace folly
