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
// SpookyHash: a 128-bit noncryptographic hash function
// By Bob Jenkins, public domain

#ifndef __STDC_FORMAT_MACROS
#define __STDC_FORMAT_MACROS 1
#endif

#include <folly/SpookyHashV2.h>
#include <folly/portability/GTest.h>
#include <folly/portability/Time.h>

#include <cinttypes>
#include <cstdio>
#include <cstddef>
#include <cstring>
#include <cstdlib>

#include <glog/logging.h>

using namespace ::folly::hash;

static bool failed = false;

static uint64_t GetClockTickCount() {
  timespec ts;
  clock_gettime(CLOCK_REALTIME, &ts);
  return ts.tv_sec * 1000 + ts.tv_nsec / 1000000;  // milliseconds
}

class Random
{
public:
    inline uint64_t Value()
    {
        uint64_t e = m_a - Rot64(m_b, 23);
        m_a = m_b ^ Rot64(m_c, 16);
        m_b = m_c + Rot64(m_d, 11);
        m_c = m_d + e;
        m_d = e + m_a;
        return m_d;
    }

    inline void Init( uint64_t seed)
    {
        m_a = 0xdeadbeef;
        m_b = m_c = m_d = seed;
        for (int i=0; i<20; ++i)
            (void)Value();
    }

private:
    static inline uint64_t Rot64(uint64_t x, int k)
    {
        return (x << k) | (x >> (64-(k)));
    }

    uint64_t m_a;
    uint64_t m_b;
    uint64_t m_c;
    uint64_t m_d;
};

// fastest conceivable hash function (for comparison)
static void Add(const void *data, size_t length,
                uint64_t *hash1, uint64_t *hash2)
{
    uint64_t *p64 = (uint64_t *)data;
    uint64_t *end = p64 + length/8;
    uint64_t hash = *hash1 + *hash2;
    while (p64 < end)
    {
      hash += *p64;
      ++p64;
    }
    *hash1 = hash;
    *hash2 = hash;
}

#define BUFSIZE (512)
void TestResults()
{
    printf("\ntesting results ...\n");
    static const uint64_t expected[BUFSIZE] = {
      0x6bf50919,0x70de1d26,0xa2b37298,0x35bc5fbf,
      0x8223b279,0x5bcb315e,0x53fe88a1,0xf9f1a233,
      0xee193982,0x54f86f29,0xc8772d36,0x9ed60886,
      0x5f23d1da,0x1ed9f474,0xf2ef0c89,0x83ec01f9,
      0xf274736c,0x7e9ac0df,0xc7aed250,0xb1015811,
      0xe23470f5,0x48ac20c4,0xe2ab3cd5,0x608f8363,
      0xd0639e68,0xc4e8e7ab,0x863c7c5b,0x4ea63579,
      0x99ae8622,0x170c658b,0x149ba493,0x027bca7c,
      0xe5cfc8b6,0xce01d9d7,0x11103330,0x5d1f5ed4,
      0xca720ecb,0xef408aec,0x733b90ec,0x855737a6,
      0x9856c65f,0x647411f7,0x50777c74,0xf0f1a8b7,
      0x9d7e55a5,0xc68dd371,0xfc1af2cc,0x75728d0a,
      0x390e5fdc,0xf389b84c,0xfb0ccf23,0xc95bad0e,
      0x5b1cb85a,0x6bdae14f,0x6deb4626,0x93047034,
      0x6f3266c6,0xf529c3bd,0x396322e7,0x3777d042,
      0x1cd6a5a2,0x197b402e,0xc28d0d2b,0x09c1afb4,

      0x069c8bb7,0x6f9d4e1e,0xd2621b5c,0xea68108d,
      0x8660cb8f,0xd61e6de6,0x7fba15c7,0xaacfaa97,
      0xdb381902,0x4ea22649,0x5d414a1e,0xc3fc5984,
      0xa0fc9e10,0x347dc51c,0x37545fb6,0x8c84b26b,
      0xf57efa5d,0x56afaf16,0xb6e1eb94,0x9218536a,
      0xe3cc4967,0xd3275ef4,0xea63536e,0x6086e499,
      0xaccadce7,0xb0290d82,0x4ebfd0d6,0x46ccc185,
      0x2eeb10d3,0x474e3c8c,0x23c84aee,0x3abae1cb,
      0x1499b81a,0xa2993951,0xeed176ad,0xdfcfe84c,
      0xde4a961f,0x4af13fe6,0xe0069c42,0xc14de8f5,
      0x6e02ce8f,0x90d19f7f,0xbca4a484,0xd4efdd63,
      0x780fd504,0xe80310e3,0x03abbc12,0x90023849,
      0xd6f6fb84,0xd6b354c5,0x5b8575f0,0x758f14e4,
      0x450de862,0x90704afb,0x47209a33,0xf226b726,
      0xf858dab8,0x7c0d6de9,0xb05ce777,0xee5ff2d4,
      0x7acb6d5c,0x2d663f85,0x41c72a91,0x82356bf2,

      0x94e948ec,0xd358d448,0xeca7814d,0x78cd7950,
      0xd6097277,0x97782a5d,0xf43fc6f4,0x105f0a38,
      0x9e170082,0x4bfe566b,0x4371d25f,0xef25a364,
      0x698eb672,0x74f850e4,0x4678ff99,0x4a290dc6,
      0x3918f07c,0x32c7d9cd,0x9f28e0af,0x0d3c5a86,
      0x7bfc8a45,0xddf0c7e1,0xdeacb86b,0x970b3c5c,
      0x5e29e199,0xea28346d,0x6b59e71b,0xf8a8a46a,
      0x862f6ce4,0x3ccb740b,0x08761e9e,0xbfa01e5f,
      0xf17cfa14,0x2dbf99fb,0x7a0be420,0x06137517,
      0xe020b266,0xd25bfc61,0xff10ed00,0x42e6be8b,
      0x029ef587,0x683b26e0,0xb08afc70,0x7c1fd59e,
      0xbaae9a70,0x98c8c801,0xb6e35a26,0x57083971,
      0x90a6a680,0x1b44169e,0x1dce237c,0x518e0a59,
      0xccb11358,0x7b8175fb,0xb8fe701a,0x10d259bb,
      0xe806ce10,0x9212be79,0x4604ae7b,0x7fa22a84,
      0xe715b13a,0x0394c3b2,0x11efbbae,0xe13d9e19,

      0x77e012bd,0x2d05114c,0xaecf2ddd,0xb2a2b4aa,
      0xb9429546,0x55dce815,0xc89138f8,0x46dcae20,
      0x1f6f7162,0x0c557ebc,0x5b996932,0xafbbe7e2,
      0xd2bd5f62,0xff475b9f,0x9cec7108,0xeaddcffb,
      0x5d751aef,0xf68f7bdf,0xf3f4e246,0x00983fcd,
      0x00bc82bb,0xbf5fd3e7,0xe80c7e2c,0x187d8b1f,
      0xefafb9a7,0x8f27a148,0x5c9606a9,0xf2d2be3e,
      0xe992d13a,0xe4bcd152,0xce40b436,0x63d6a1fc,
      0xdc1455c4,0x64641e39,0xd83010c9,0x2d535ae0,
      0x5b748f3e,0xf9a9146b,0x80f10294,0x2859acd4,
      0x5fc846da,0x56d190e9,0x82167225,0x98e4daba,
      0xbf7865f3,0x00da7ae4,0x9b7cd126,0x644172f8,
      0xde40c78f,0xe8803efc,0xdd331a2b,0x48485c3c,
      0x4ed01ddc,0x9c0b2d9e,0xb1c6e9d7,0xd797d43c,
      0x274101ff,0x3bf7e127,0x91ebbc56,0x7ffeb321,
      0x4d42096f,0xd6e9456a,0x0bade318,0x2f40ee0b,

      0x38cebf03,0x0cbc2e72,0xbf03e704,0x7b3e7a9a,
      0x8e985acd,0x90917617,0x413895f8,0xf11dde04,
      0xc66f8244,0xe5648174,0x6c420271,0x2469d463,
      0x2540b033,0xdc788e7b,0xe4140ded,0x0990630a,
      0xa54abed4,0x6e124829,0xd940155a,0x1c8836f6,
      0x38fda06c,0x5207ab69,0xf8be9342,0x774882a8,
      0x56fc0d7e,0x53a99d6e,0x8241f634,0x9490954d,
      0x447130aa,0x8cc4a81f,0x0868ec83,0xc22c642d,
      0x47880140,0xfbff3bec,0x0f531f41,0xf845a667,
      0x08c15fb7,0x1996cd81,0x86579103,0xe21dd863,
      0x513d7f97,0x3984a1f1,0xdfcdc5f4,0x97766a5e,
      0x37e2b1da,0x41441f3f,0xabd9ddba,0x23b755a9,
      0xda937945,0x103e650e,0x3eef7c8f,0x2760ff8d,
      0x2493a4cd,0x1d671225,0x3bf4bd4c,0xed6e1728,
      0xc70e9e30,0x4e05e529,0x928d5aa6,0x164d0220,
      0xb5184306,0x4bd7efb3,0x63830f11,0xf3a1526c,

      0xf1545450,0xd41d5df5,0x25a5060d,0x77b368da,
      0x4fe33c7e,0xeae09021,0xfdb053c4,0x2930f18d,
      0xd37109ff,0x8511a781,0xc7e7cdd7,0x6aeabc45,
      0xebbeaeaa,0x9a0c4f11,0xda252cbb,0x5b248f41,
      0x5223b5eb,0xe32ab782,0x8e6a1c97,0x11d3f454,
      0x3e05bd16,0x0059001d,0xce13ac97,0xf83b2b4c,
      0x71db5c9a,0xdc8655a6,0x9e98597b,0x3fcae0a2,
      0x75e63ccd,0x076c72df,0x4754c6ad,0x26b5627b,
      0xd818c697,0x998d5f3d,0xe94fc7b2,0x1f49ad1a,
      0xca7ff4ea,0x9fe72c05,0xfbd0cbbf,0xb0388ceb,
      0xb76031e3,0xd0f53973,0xfb17907c,0xa4c4c10f,
      0x9f2d8af9,0xca0e56b0,0xb0d9b689,0xfcbf37a3,
      0xfede8f7d,0xf836511c,0x744003fc,0x89eba576,
      0xcfdcf6a6,0xc2007f52,0xaaaf683f,0x62d2f9ca,
      0xc996f77f,0x77a7b5b3,0x8ba7d0a4,0xef6a0819,
      0xa0d903c0,0x01b27431,0x58fffd4c,0x4827f45c,

      0x44eb5634,0xae70edfc,0x591c740b,0x478bf338,
      0x2f3b513b,0x67bf518e,0x6fef4a0c,0x1e0b6917,
      0x5ac0edc5,0x2e328498,0x077de7d5,0x5726020b,
      0x2aeda888,0x45b637ca,0xcf60858d,0x3dc91ae2,
      0x3e6d5294,0xe6900d39,0x0f634c71,0x827a5fa4,
      0xc713994b,0x1c363494,0x3d43b615,0xe5fe7d15,
      0xf6ada4f2,0x472099d5,0x04360d39,0x7f2a71d0,
      0x88a4f5ff,0x2c28fac5,0x4cd64801,0xfd78dd33,
      0xc9bdd233,0x21e266cc,0x9bbf419d,0xcbf7d81d,
      0x80f15f96,0x04242657,0x53fb0f66,0xded11e46,
      0xf2fdba97,0x8d45c9f1,0x4eeae802,0x17003659,
      0xb9db81a7,0xe734b1b2,0x9503c54e,0xb7c77c3e,
      0x271dd0ab,0xd8b906b5,0x0d540ec6,0xf03b86e0,
      0x0fdb7d18,0x95e261af,0xad9ec04e,0x381f4a64,
      0xfec798d7,0x09ea20be,0x0ef4ca57,0x1e6195bb,
      0xfd0da78b,0xcea1653b,0x157d9777,0xf04af50f,

      0xad7baa23,0xd181714a,0x9bbdab78,0x6c7d1577,
      0x645eb1e7,0xa0648264,0x35839ca6,0x2287ef45,
      0x32a64ca3,0x26111f6f,0x64814946,0xb0cddaf1,
      0x4351c59e,0x1b30471c,0xb970788a,0x30e9f597,
      0xd7e58df1,0xc6d2b953,0xf5f37cf4,0x3d7c419e,
      0xf91ecb2d,0x9c87fd5d,0xb22384ce,0x8c7ac51c,
      0x62c96801,0x57e54091,0x964536fe,0x13d3b189,
      0x4afd1580,0xeba62239,0xb82ea667,0xae18d43a,
      0xbef04402,0x1942534f,0xc54bf260,0x3c8267f5,
      0xa1020ddd,0x112fcc8a,0xde596266,0xe91d0856,
      0xf300c914,0xed84478e,0x5b65009e,0x4764da16,
      0xaf8e07a2,0x4088dc2c,0x9a0cad41,0x2c3f179b,
      0xa67b83f7,0xf27eab09,0xdbe10e28,0xf04c911f,
      0xd1169f87,0x8e1e4976,0x17f57744,0xe4f5a33f,
      0x27c2e04b,0x0b7523bd,0x07305776,0xc6be7503,
      0x918fa7c9,0xaf2e2cd9,0x82046f8e,0xcc1c8250
    };

    uint8_t buf[BUFSIZE];
    uint32_t saw[BUFSIZE];
    for (int i=0; i<BUFSIZE; ++i)
    {
        buf[i] = i+128;
        saw[i] = SpookyHashV2::Hash32(buf, i, 0);
        if (saw[i] != expected[i])
        {
            printf("%3d: saw 0x%.8x, expected 0x%.8" PRIx64 "\n", i, saw[i],
                   expected[i]);
            failed = true;
        }
    }
}
#undef BUFSIZE


#define NUMBUF (1<<10)
#define BUFSIZE (1<<20)
void DoTimingBig(int seed)
{
    printf("\ntesting time to hash 2^^30 bytes ...\n");

    char *buf[NUMBUF];
    for (int i=0; i<NUMBUF; ++i)
    {
        buf[i] = (char *)malloc(BUFSIZE);
        memset(buf[i], (char)seed, BUFSIZE);
    }

    uint64_t a = GetClockTickCount();
    uint64_t hash1 = seed;
    uint64_t hash2 = seed;
    for (uint64_t i=0; i<NUMBUF; ++i)
    {
        SpookyHashV2::Hash128(buf[i], BUFSIZE, &hash1, &hash2);
    }
    uint64_t z = GetClockTickCount();
    printf("SpookyHashV2::Hash128, uncached: time is "
           "%4" PRId64 " milliseconds\n", z-a);

    a = GetClockTickCount();
    for (uint64_t i=0; i<NUMBUF; ++i)
    {
        Add(buf[i], BUFSIZE, &hash1, &hash2);
    }
    z = GetClockTickCount();
    printf("Addition           , uncached: time is %4" PRId64 " milliseconds\n",
           z-a);

    a = GetClockTickCount();
    for (uint64_t i=0; i<NUMBUF*BUFSIZE/1024; ++i)
    {
        SpookyHashV2::Hash128(buf[0], 1024, &hash1, &hash2);
    }
    z = GetClockTickCount();
    printf("SpookyHashV2::Hash128,   cached: time is "
           "%4" PRId64 " milliseconds\n", z-a);

    a = GetClockTickCount();
    for (uint64_t i=0; i<NUMBUF*BUFSIZE/1024; ++i)
    {
        Add(buf[0], 1024, &hash1, &hash2);
    }
    z = GetClockTickCount();
    printf("Addition           ,   cached: time is %4" PRId64 " milliseconds\n",
           z-a);

    for (int i=0; i<NUMBUF; ++i)
    {
        free(buf[i]);
        buf[i] = 0;
    }
}
#undef NUMBUF
#undef BUFSIZE


#define BUFSIZE (1<<14)
#define NUMITER 10000000
void DoTimingSmall(int seed)
{
    printf("\ntesting timing of hashing up to %d cached aligned bytes %d "
           "times ...\n", BUFSIZE, NUMITER);

    uint64_t buf[BUFSIZE/8];
    for (int i=0; i<BUFSIZE/8; ++i)
    {
        buf[i] = i+seed;
    }

    for (int i=1; i <= BUFSIZE; i <<= 1)
    {
        uint64_t a = GetClockTickCount();
        uint64_t hash1 = seed;
        uint64_t hash2 = seed+i;
        for (int j=0; j<NUMITER; ++j)
        {
            SpookyHashV2::Hash128((char *)buf, i, &hash1, &hash2);
        }
        uint64_t z = GetClockTickCount();
        printf("%d bytes: hash is %.16" PRIx64 " %.16" PRIx64 ", "
               "time is %" PRId64 "\n", i, hash1, hash2, z-a);
    }
}
#undef BUFSIZE

#define BUFSIZE 1024
void TestAlignment()
{
    printf("\ntesting alignment ...\n");

    char buf[BUFSIZE];
    uint64_t hash[8];
    for (int i=0; i<BUFSIZE-16; ++i)
    {
        for (int j=0; j<8; ++j)
        {
            buf[j] = (char)i+j;
            for (int k=1; k<=i; ++k)
            {
                buf[j+k] = k;
            }
            buf[j+i+1] = (char)i+j;
            hash[j] = SpookyHashV2::Hash64((const void *)(buf+j+1), i, 0);
        }
        for (int j=1; j<8; ++j)
        {
            if (hash[0] != hash[j])
            {
                printf("alignment problems: %d %d\n", i, j);
                failed = true;
            }
        }
    }
}
#undef BUFSIZE

// test that all deltas of one or two input bits affect all output bits
#define BUFSIZE 256
#define TRIES 50
#define MEASURES 6
void TestDeltas(int seed)
{
    printf("\nall 1 or 2 bit input deltas get %d tries to flip every output "
           "bit ...\n", TRIES);

    Random random;
    random.Init((uint64_t)seed);

    // for messages 0..BUFSIZE-1 bytes
    for (int h=0; h<BUFSIZE; ++h)
    {
        int maxk = 0;
        // first bit to set
        for (int i=0; i<h*8; ++i)
        {
            // second bit to set, or don't have a second bit
            for (int j=0; j<=i; ++j)
            {
                uint64_t measure[MEASURES][2];
                uint64_t counter[MEASURES][2];
                for (int l=0; l<2; ++l)
                {
                    for (int m=0; m<MEASURES; ++m)
                    {
                        counter[m][l] = 0;
                    }
                }

                // try to hit every output bit TRIES times
                int k;
                for (k=0; k<TRIES; ++k)
                {
                    uint8_t buf1[BUFSIZE];
                    uint8_t buf2[BUFSIZE];
                    int done = 1;
                    for (int l=0; l<h; ++l)
                    {
                        buf1[l] = buf2[l] = random.Value();
                    }
                    buf1[i/8] ^= (1 << (i%8));
                    if (j != i)
                    {
                        buf1[j/8] ^= (1 << (j%8));
                    }
                    SpookyHashV2::Hash128(buf1, h,
                            &measure[0][0], &measure[0][1]);
                    SpookyHashV2::Hash128(buf2, h,
                            &measure[1][0], &measure[1][1]);
                    for (int l=0; l<2; ++l) {
                        measure[2][l] = measure[0][l] ^ measure[1][l];
                        measure[3][l] = ~(measure[0][l] ^ measure[1][l]);
                        measure[4][l] = measure[0][l] - measure[1][l];
                        measure[4][l] ^= (measure[4][l]>>1);
                        measure[5][l] = measure[0][l] + measure[1][l];
                        measure[5][l] ^= (measure[4][l]>>1);
                    }
                    for (int l=0; l<2; ++l)
                    {
                        for (int m=0; m<MEASURES; ++m)
                        {
                            counter[m][l] |= measure[m][l];
                            if (~counter[m][l]) done = 0;
                        }
                    }
                    if (done) break;
                }
                if (k == TRIES)
                {
                    printf("failed %d %d %d\n", h, i, j);
                    failed = true;
                }
                else if (k > maxk)
                {
                    maxk = k;
                }
            }
        }
        printf("passed for buffer size %d  max %d\n", h, maxk);
    }
}
#undef BUFSIZE
#undef TRIES
#undef MEASURES


// test that hashing pieces has the same behavior as hashing the whole
#define BUFSIZE 1024
void TestPieces()
{
    printf("\ntesting pieces ...\n");
    char buf[BUFSIZE];
    for (int i=0; i<BUFSIZE; ++i)
    {
        buf[i] = i;
    }
    for (int i=0; i<BUFSIZE; ++i)
    {
        uint64_t a,b,c,d,seed1=1,seed2=2;
        SpookyHashV2 state;

        // all as one call
        a = seed1;
        b = seed2;
        SpookyHashV2::Hash128(buf, i, &a, &b);

        // all as one piece
        c = 0xdeadbeefdeadbeef;
        d = 0xbaceba11baceba11;
        state.Init(seed1, seed2);
        state.Update(buf, i);
        state.Final(&c, &d);

        if (a != c)
        {
            printf("wrong a %d: %.16" PRIx64 " %.16" PRIx64 "\n", i, a,c);
            failed = true;
        }
        if (b != d)
        {
            printf("wrong b %d: %.16" PRIx64 " %.16" PRIx64 "\n", i, b,d);
            failed = true;
        }

        // all possible two consecutive pieces
        for (int j=0; j<i; ++j)
        {
            c = seed1;
            d = seed2;
            state.Init(c, d);
            state.Update(&buf[0], j);
            state.Update(&buf[j], i-j);
            state.Final(&c, &d);
            if (a != c)
            {
                printf("wrong a %d %d: %.16" PRIx64 " %.16" PRIx64 "\n",
                       j, i, a,c);
                failed = true;
            }
            if (b != d)
            {
                printf("wrong b %d %d: %.16" PRIx64 " %.16" PRIx64 "\n",
                       j, i, b,d);
                failed = true;
            }
        }
    }
}
#undef BUFSIZE

TEST(SpookyHashV2, Main) {
    TestResults();
    TestAlignment();
    TestPieces();
    DoTimingBig(1);
    // tudorb@fb.com: Commented out slow tests
#if 0
    DoTimingSmall(argc);
    TestDeltas(argc);
#endif
    CHECK_EQ(failed, 0);
}
