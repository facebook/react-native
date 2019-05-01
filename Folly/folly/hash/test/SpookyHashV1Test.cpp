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
// SpookyHash: a 128-bit noncryptographic hash function
// By Bob Jenkins, public domain

#ifndef __STDC_FORMAT_MACROS
#define __STDC_FORMAT_MACROS 1
#endif

#include <folly/hash/SpookyHashV1.h>

#include <cinttypes>
#include <cstddef>
#include <cstdio>
#include <cstdlib>
#include <cstring>

#include <glog/logging.h>

#include <folly/portability/GTest.h>
#include <folly/portability/Time.h>

using namespace ::folly::hash;

// clang-format off

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
        for (int i = 0; i < 20; ++i) {
          (void)Value();
        }
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
    static const uint32_t expected[BUFSIZE] = {
        0xa24295ec, 0xfe3a05ce, 0x257fd8ef, 0x3acd5217,
        0xfdccf85c, 0xc7b5f143, 0x3b0c3ff0, 0x5220f13c,
        0xa6426724, 0x4d5426b4, 0x43e76b26, 0x051bc437,
        0xd8f28a02, 0x23ccc30e, 0x811d1a2d, 0x039128d4,
        0x9cd96a73, 0x216e6a8d, 0x97293fe8, 0xe4fc6d09,
        0x1ad34423, 0x9722d7e4, 0x5a6fdeca, 0x3c94a7e1,
        0x81a9a876, 0xae3f7c0e, 0x624b50ee, 0x875e5771,
        0x0095ab74, 0x1a7333fb, 0x056a4221, 0xa38351fa,

        0x73f575f1, 0x8fded05b, 0x9097138f, 0xbd74620c,
        0x62d3f5f2, 0x07b78bd0, 0xbafdd81e, 0x0638f2ff,
        0x1f6e3aeb, 0xa7786473, 0x71700e1d, 0x6b4625ab,
        0xf02867e1, 0xb2b2408f, 0x9ce21ce5, 0xa62baaaf,
        0x26720461, 0x434813ee, 0x33bc0f14, 0xaaab098a,
        0x750af488, 0xc31bf476, 0x9cecbf26, 0x94793cf3,
        0xe1a27584, 0xe80c4880, 0x1299f748, 0x25e55ed2,
        0x405e3feb, 0x109e2412, 0x3e55f94f, 0x59575864,

        0x365c869d, 0xc9852e6a, 0x12c30c62, 0x47f5b286,
        0xb47e488d, 0xa6667571, 0x78220d67, 0xa49e30b9,
        0x2005ef88, 0xf6d3816d, 0x6926834b, 0xe6116805,
        0x694777aa, 0x464af25b, 0x0e0e2d27, 0x0ea92eae,
        0x602c2ca9, 0x1d1d79c5, 0x6364f280, 0x939ee1a4,
        0x3b851bd8, 0x5bb6f19f, 0x80b9ed54, 0x3496a9f1,
        0xdf815033, 0x91612339, 0x14c516d6, 0xa3f0a804,
        0x5e78e975, 0xf408bcd9, 0x63d525ed, 0xa1e459c3,

        0xfde303af, 0x049fc17f, 0xe7ed4489, 0xfaeefdb6,
        0x2b1b2fa8, 0xc67579a6, 0x5505882e, 0xe3e1c7cb,
        0xed53bf30, 0x9e628351, 0x8fa12113, 0x7500c30f,
        0xde1bee00, 0xf1fefe06, 0xdc759c00, 0x4c75e5ab,
        0xf889b069, 0x695bf8ae, 0x47d6600f, 0xd2a84f87,
        0xa0ca82a9, 0x8d2b750c, 0xe03d8cd7, 0x581fea33,
        0x969b0460, 0x36c7b7de, 0x74b3fd20, 0x2bb8bde6,
        0x13b20dec, 0xa2dcee89, 0xca36229d, 0x06fdb74e,


        0x6d9a982d, 0x02503496, 0xbdb4e0d9, 0xbd1f94cf,
        0x6d26f82d, 0xcf5e41cd, 0x88b67b65, 0x3e1b3ee4,
        0xb20e5e53, 0x1d9be438, 0xcef9c692, 0x299bd1b2,
        0xb1279627, 0x210b5f3d, 0x5569bd88, 0x9652ed43,
        0x7e8e0f8c, 0xdfa01085, 0xcd6d6343, 0xb8739826,
        0xa52ce9a0, 0xd33ef231, 0x1b4d92c2, 0xabfa116d,
        0xcdf47800, 0x3a4eefdc, 0xd01f3bcf, 0x30a32f46,
        0xfb54d851, 0x06a98f67, 0xbdcd0a71, 0x21a00949,

        0xfe7049c9, 0x67ef46d2, 0xa1fabcbc, 0xa4c72db4,
        0x4a8a910d, 0x85a890ad, 0xc37e9454, 0xfc3d034a,
        0x6f46cc52, 0x742be7a8, 0xe94ecbc5, 0x5f993659,
        0x98270309, 0x8d1adae9, 0xea6e035e, 0x293d5fae,
        0x669955b3, 0x5afe23b5, 0x4c74efbf, 0x98106505,
        0xfbe09627, 0x3c00e8df, 0x5b03975d, 0x78edc83c,
        0x117c49c6, 0x66cdfc73, 0xfa55c94f, 0x5bf285fe,
        0x2db49b7d, 0xfbfeb8f0, 0xb7631bab, 0x837849f3,

        0xf77f3ae5, 0x6e5db9bc, 0xfdd76f15, 0x545abf92,
        0x8b538102, 0xdd5c9b65, 0xa5adfd55, 0xecbd7bc5,
        0x9f99ebdd, 0x67500dcb, 0xf5246d1f, 0x2b0c061c,
        0x927a3747, 0xc77ba267, 0x6da9f855, 0x6240d41a,
        0xe9d1701d, 0xc69f0c55, 0x2c2c37cf, 0x12d82191,
        0x47be40d3, 0x165b35cd, 0xb7db42e1, 0x358786e4,
        0x84b8fc4e, 0x92f57c28, 0xf9c8bbd7, 0xab95a33d,
        0x11009238, 0xe9770420, 0xd6967e2a, 0x97c1589f,

        0x2ee7e7d3, 0x32cc86da, 0xe47767d1, 0x73e9b61e,
        0xd35bac45, 0x835a62bb, 0x5d9217b0, 0x43f3f0ed,
        0x8a97911e, 0x4ec7eb55, 0x4b5a988c, 0xb9056683,
        0x45456f97, 0x1669fe44, 0xafb861b8, 0x8e83a19c,
        0x0bab08d6, 0xe6a145a9, 0xc31e5fc2, 0x27621f4c,
        0x795692fa, 0xb5e33ab9, 0x1bc786b6, 0x45d1c106,
        0x986531c9, 0x40c9a0ec, 0xff0fdf84, 0xa7359a42,
        0xfd1c2091, 0xf73463d4, 0x51b0d635, 0x1d602fb4,


        0xc56b69b7, 0x6909d3f7, 0xa04d68f4, 0x8d1001a7,
        0x8ecace50, 0x21ec4765, 0x3530f6b0, 0x645f3644,
        0x9963ef1e, 0x2b3c70d5, 0xa20c823b, 0x8d26dcae,
        0x05214e0c, 0x1993896d, 0x62085a35, 0x7b620b67,
        0x1dd85da2, 0x09ce9b1d, 0xd7873326, 0x063ff730,
        0xf4ff3c14, 0x09a49d69, 0x532062ba, 0x03ba7729,
        0xbd9a86cc, 0xe26d02a7, 0x7ccbe5d3, 0x4f662214,
        0x8b999a66, 0x3d0b92b4, 0x70b210f0, 0xf5b8f16f,

        0x32146d34, 0x430b92bf, 0x8ab6204c, 0x35e6e1ff,
        0xc2f6c2fa, 0xa2df8a1a, 0x887413ec, 0x7cb7a69f,
        0x7ac6dbe6, 0x9102d1cb, 0x8892a590, 0xc804fe3a,
        0xdfc4920a, 0xfc829840, 0x8910d2eb, 0x38a210fd,
        0x9d840cc9, 0x7b9c827f, 0x3444ca0c, 0x071735ab,
        0x5e9088e4, 0xc995d60e, 0xbe0bb942, 0x17b089ae,
        0x050e1054, 0xcf4324f7, 0x1e3e64dd, 0x436414bb,
        0xc48fc2e3, 0x6b6b83d4, 0x9f6558ac, 0x781b22c5,

        0x7147cfe2, 0x3c221b4d, 0xa5602765, 0x8f01a4f0,
        0x2a9f14ae, 0x12158cb8, 0x28177c50, 0x1091a165,
        0x39e4e4be, 0x3e451b7a, 0xd965419c, 0x52053005,
        0x0798aa53, 0xe6773e13, 0x1207f671, 0xd2ef998b,
        0xab88a38f, 0xc77a8482, 0xa88fb031, 0x5199e0cd,
        0x01b30536, 0x46eeb0ef, 0x814259ff, 0x9789a8cf,
        0x376ec5ac, 0x7087034a, 0x948b6bdd, 0x4281e628,
        0x2c848370, 0xd76ce66a, 0xe9b6959e, 0x24321a8e,

        0xdeddd622, 0xb890f960, 0xea26c00a, 0x55e7d8b2,
        0xeab67f09, 0x9227fb08, 0xeebbed06, 0xcac1b0d1,
        0xb6412083, 0x05d2b0e7, 0x9037624a, 0xc9702198,
        0x2c8d1a86, 0x3e7d416e, 0xc3f1a39f, 0xf04bdce4,
        0xc88cdb61, 0xbdc89587, 0x4d29b63b, 0x6f24c267,
        0x4b529c87, 0x573f5a53, 0xdb3316e9, 0x288eb53b,
        0xd2c074bd, 0xef44a99a, 0x2b404d2d, 0xf6706464,
        0xfe824f4c, 0xc3debaf8, 0x12f44f98, 0x03135e76,


        0xb4888e7f, 0xb6b2325d, 0x3a138259, 0x513c83ec,
        0x2386d214, 0x94555500, 0xfbd1522d, 0xda2af018,
        0x15b054c0, 0x5ad654e6, 0xb6ed00aa, 0xa2f2180e,
        0x5f662825, 0xecd11366, 0x1de5e99d, 0x07afd2ad,
        0xcf457b04, 0xe631e10b, 0x83ae8a21, 0x709f0d59,
        0x3e278bf9, 0x246816db, 0x9f5e8fd3, 0xc5b5b5a2,
        0xd54a9d5c, 0x4b6f2856, 0x2eb5a666, 0xfc68bdd4,
        0x1ed1a7f8, 0x98a34b75, 0xc895ada9, 0x2907cc69,

        0x87b0b455, 0xddaf96d9, 0xe7da15a6, 0x9298c82a,
        0x72bd5cab, 0x2e2a6ad4, 0x7f4b6bb8, 0x525225fe,
        0x985abe90, 0xac1fd6e1, 0xb8340f23, 0x92985159,
        0x7d29501d, 0xe75dc744, 0x687501b4, 0x92077dc3,
        0x58281a67, 0xe7e8e9be, 0xd0e64fd1, 0xb2eb0a30,
        0x0e1feccd, 0xc0dc4a9e, 0x5c4aeace, 0x2ca5b93c,
        0xee0ec34f, 0xad78467b, 0x0830e76e, 0x0df63f8b,
        0x2c2dfd95, 0x9b41ed31, 0x9ff4cddc, 0x1590c412,

        0x2366fc82, 0x7a83294f, 0x9336c4de, 0x2343823c,
        0x5b681096, 0xf320e4c2, 0xc22b70e2, 0xb5fbfb2a,
        0x3ebc2fed, 0x11af07bd, 0x429a08c5, 0x42bee387,
        0x58629e33, 0xfb63b486, 0x52135fbe, 0xf1380e60,
        0x6355de87, 0x2f0bb19a, 0x167f63ac, 0x507224cf,
        0xf7c99d00, 0x71646f50, 0x74feb1ca, 0x5f9abfdd,
        0x278f7d68, 0x70120cd7, 0x4281b0f2, 0xdc8ebe5c,
        0x36c32163, 0x2da1e884, 0x61877598, 0xbef04402,

        0x304db695, 0xfa8e9add, 0x503bac31, 0x0fe04722,
        0xf0d59f47, 0xcdc5c595, 0x918c39dd, 0x0cad8d05,
        0x6b3ed1eb, 0x4d43e089, 0x7ab051f8, 0xdeec371f,
        0x0f4816ae, 0xf8a1a240, 0xd15317f6, 0xb8efbf0b,
        0xcdd05df8, 0x4fd5633e, 0x7cf19668, 0x25d8f422,
        0x72d156f2, 0x2a778502, 0xda7aefb9, 0x4f4f66e8,
        0x19db6bff, 0x74e468da, 0xa754f358, 0x7339ec50,
        0x139006f6, 0xefbd0b91, 0x217e9a73, 0x939bd79c
    };

    uint8_t buf[BUFSIZE];
    uint32_t saw[BUFSIZE];
    for (int i=0; i<BUFSIZE; ++i)
    {
        buf[i] = i+128;
        saw[i] = SpookyHashV1::Hash32(buf, i, 0);
        if (saw[i] != expected[i])
        {
            printf("%d: saw 0x%.8x, expected 0x%.8x\n", i, saw[i], expected[i]);
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
        SpookyHashV1::Hash128(buf[i], BUFSIZE, &hash1, &hash2);
    }
    uint64_t z = GetClockTickCount();
    printf("SpookyHashV1::Hash128, uncached: time is "
           "%4" PRIu64 " milliseconds\n", z-a);

    a = GetClockTickCount();
    for (uint64_t i=0; i<NUMBUF; ++i)
    {
        Add(buf[i], BUFSIZE, &hash1, &hash2);
    }
    z = GetClockTickCount();
    printf("Addition           , uncached: time is "
           "%4" PRIu64 " milliseconds\n", z-a);

    a = GetClockTickCount();
    for (uint64_t i=0; i<NUMBUF*BUFSIZE/1024; ++i)
    {
        SpookyHashV1::Hash128(buf[0], 1024, &hash1, &hash2);
    }
    z = GetClockTickCount();
    printf("SpookyHashV1::Hash128,   cached: time is "
           "%4" PRIu64 " milliseconds\n", z-a);

    a = GetClockTickCount();
    for (uint64_t i=0; i<NUMBUF*BUFSIZE/1024; ++i)
    {
        Add(buf[0], 1024, &hash1, &hash2);
    }
    z = GetClockTickCount();
    printf("Addition           ,   cached: time is "
           "%4" PRIu64 " milliseconds\n", z-a);

    for (int i=0; i<NUMBUF; ++i)
    {
        free(buf[i]);
        buf[i] = nullptr;
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
            SpookyHashV1::Hash128((char *)buf, i, &hash1, &hash2);
        }
        uint64_t z = GetClockTickCount();
        printf("%d bytes: hash is %.16" PRIx64 " %.16" PRIx64 ", "
               "time is %" PRIu64 "\n", i, hash1, hash2, z-a);
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
            hash[j] = SpookyHashV1::Hash64((const void *)(buf+j+1), i, 0);
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
                    SpookyHashV1::Hash128(buf1, h,
                            &measure[0][0], &measure[0][1]);
                    SpookyHashV1::Hash128(buf2, h,
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
                            if (~counter[m][l]) {
                              done = 0;
                            }
                        }
                    }
                    if (done) {
                      break;
                    }
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
        SpookyHashV1 state;

        // all as one call
        a = seed1;
        b = seed2;
        SpookyHashV1::Hash128(buf, i, &a, &b);

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

TEST(SpookyHashV1, Main) {
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

// clang-format on
