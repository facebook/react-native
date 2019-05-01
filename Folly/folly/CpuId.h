/*
 * Copyright 2012-present Facebook, Inc.
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

#pragma once

#include <cstdint>

#include <folly/Portability.h>

#ifdef _MSC_VER
#include <intrin.h>
#endif

namespace folly {

/**
 * Identification of an Intel CPU.
 * Supports CPUID feature flags (EAX=1) and extended features (EAX=7, ECX=0).
 * Values from
 * http://www.intel.com/content/www/us/en/processors/processor-identification-cpuid-instruction-note.html
 */
class CpuId {
 public:
  // Always inline in order for this to be usable from a __ifunc__.
  // In shared library mode, a __ifunc__ runs at relocation time, while the
  // PLT hasn't been fully populated yet; thus, ifuncs cannot use symbols
  // with potentially external linkage. (This issue is less likely in opt
  // mode since inlining happens more likely, and it doesn't happen for
  // statically linked binaries which don't depend on the PLT)
  FOLLY_ALWAYS_INLINE CpuId() {
#if defined(_MSC_VER) && (FOLLY_X64 || defined(_M_IX86))
    int reg[4];
    __cpuid(static_cast<int*>(reg), 0);
    const int n = reg[0];
    if (n >= 1) {
      __cpuid(static_cast<int*>(reg), 1);
      f1c_ = uint32_t(reg[2]);
      f1d_ = uint32_t(reg[3]);
    }
    if (n >= 7) {
      __cpuidex(static_cast<int*>(reg), 7, 0);
      f7b_ = uint32_t(reg[1]);
      f7c_ = uint32_t(reg[2]);
    }
#elif defined(__i386__) && defined(__PIC__) && !defined(__clang__) && \
    defined(__GNUC__)
    // The following block like the normal cpuid branch below, but gcc
    // reserves ebx for use of its pic register so we must specially
    // handle the save and restore to avoid clobbering the register
    uint32_t n;
    __asm__(
        "pushl %%ebx\n\t"
        "cpuid\n\t"
        "popl %%ebx\n\t"
        : "=a"(n)
        : "a"(0)
        : "ecx", "edx");
    if (n >= 1) {
      uint32_t f1a;
      __asm__(
          "pushl %%ebx\n\t"
          "cpuid\n\t"
          "popl %%ebx\n\t"
          : "=a"(f1a), "=c"(f1c_), "=d"(f1d_)
          : "a"(1)
          :);
    }
    if (n >= 7) {
      __asm__(
          "pushl %%ebx\n\t"
          "cpuid\n\t"
          "movl %%ebx, %%eax\n\r"
          "popl %%ebx"
          : "=a"(f7b_), "=c"(f7c_)
          : "a"(7), "c"(0)
          : "edx");
    }
#elif FOLLY_X64 || defined(__i386__)
    uint32_t n;
    __asm__("cpuid" : "=a"(n) : "a"(0) : "ebx", "ecx", "edx");
    if (n >= 1) {
      uint32_t f1a;
      __asm__("cpuid" : "=a"(f1a), "=c"(f1c_), "=d"(f1d_) : "a"(1) : "ebx");
    }
    if (n >= 7) {
      uint32_t f7a;
      __asm__("cpuid"
              : "=a"(f7a), "=b"(f7b_), "=c"(f7c_)
              : "a"(7), "c"(0)
              : "edx");
    }
#endif
  }

#define X(name, r, bit)                   \
  FOLLY_ALWAYS_INLINE bool name() const { \
    return ((r) & (1U << bit)) != 0;      \
  }

// cpuid(1): Processor Info and Feature Bits.
#define C(name, bit) X(name, f1c_, bit)
  C(sse3, 0)
  C(pclmuldq, 1)
  C(dtes64, 2)
  C(monitor, 3)
  C(dscpl, 4)
  C(vmx, 5)
  C(smx, 6)
  C(eist, 7)
  C(tm2, 8)
  C(ssse3, 9)
  C(cnxtid, 10)
  C(fma, 12)
  C(cx16, 13)
  C(xtpr, 14)
  C(pdcm, 15)
  C(pcid, 17)
  C(dca, 18)
  C(sse41, 19)
  C(sse42, 20)
  C(x2apic, 21)
  C(movbe, 22)
  C(popcnt, 23)
  C(tscdeadline, 24)
  C(aes, 25)
  C(xsave, 26)
  C(osxsave, 27)
  C(avx, 28)
  C(f16c, 29)
  C(rdrand, 30)
#undef C
#define D(name, bit) X(name, f1d_, bit)
  D(fpu, 0)
  D(vme, 1)
  D(de, 2)
  D(pse, 3)
  D(tsc, 4)
  D(msr, 5)
  D(pae, 6)
  D(mce, 7)
  D(cx8, 8)
  D(apic, 9)
  D(sep, 11)
  D(mtrr, 12)
  D(pge, 13)
  D(mca, 14)
  D(cmov, 15)
  D(pat, 16)
  D(pse36, 17)
  D(psn, 18)
  D(clfsh, 19)
  D(ds, 21)
  D(acpi, 22)
  D(mmx, 23)
  D(fxsr, 24)
  D(sse, 25)
  D(sse2, 26)
  D(ss, 27)
  D(htt, 28)
  D(tm, 29)
  D(pbe, 31)
#undef D

  // cpuid(7): Extended Features.
#define B(name, bit) X(name, f7b_, bit)
  B(bmi1, 3)
  B(hle, 4)
  B(avx2, 5)
  B(smep, 7)
  B(bmi2, 8)
  B(erms, 9)
  B(invpcid, 10)
  B(rtm, 11)
  B(mpx, 14)
  B(avx512f, 16)
  B(avx512dq, 17)
  B(rdseed, 18)
  B(adx, 19)
  B(smap, 20)
  B(avx512ifma, 21)
  B(pcommit, 22)
  B(clflushopt, 23)
  B(clwb, 24)
  B(avx512pf, 26)
  B(avx512er, 27)
  B(avx512cd, 28)
  B(sha, 29)
  B(avx512bw, 30)
  B(avx512vl, 31)
#undef B
#define C(name, bit) X(name, f7c_, bit)
  C(prefetchwt1, 0)
  C(avx512vbmi, 1)
#undef C

#undef X

 private:
  uint32_t f1c_ = 0;
  uint32_t f1d_ = 0;
  uint32_t f7b_ = 0;
  uint32_t f7c_ = 0;
};

} // namespace folly
