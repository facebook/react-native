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

/*
 * memcpy: An optimized memcpy implementation for x86_64. It uses AVX when
 * __AVX__ is defined, and uses SSE2 otherwise.
 *
 * @author Bin Liu <binliu@fb.com>
 */

#if defined(__x86_64__) && defined(__linux__) && !defined(__CYGWIN__)

        .file     "memcpy.S"
        .text

/*
 * _memcpy_short is a local helper used when length < 8. It cannot be called
 * from outside, because it expects a non-standard calling convention:
 *
 *    %rax:  destination buffer address.
 *    %rsi:  source buffer address.
 *    %edx:  length, in the range of [0, 7]
 */
        .type     _memcpy_short, @function
_memcpy_short:
.LSHORT:
        .cfi_startproc
        //        if (length == 0) return;
        test      %edx, %edx
        jz        .LEND

        movzbl    (%rsi), %ecx
        //        if (length - 4 < 0) goto LS4;
        sub       $4, %edx
        jb        .LS4

        mov       (%rsi), %ecx
        mov       (%rsi, %rdx), %edi
        mov       %ecx, (%rax)
        mov       %edi, (%rax, %rdx)
.LEND:
        rep
        ret
        nop

.LS4:
        //        At this point, length can be 1 or 2 or 3, and $cl contains
        //        the first byte.
        mov       %cl, (%rax)
        //        if (length - 4 + 2 < 0) return;
        add       $2, %edx
        jnc       .LEND

        //        length is 2 or 3 here. In either case, just copy the last
        //        two bytes.
        movzwl    (%rsi, %rdx), %ecx
        mov       %cx, (%rax, %rdx)
        ret

        .cfi_endproc
        .size     _memcpy_short, .-_memcpy_short


/*
 * void* memcpy(void* dst, void* src, uint32_t length);
 *
 */
        .align    16
        .globl    memcpy
        .type     memcpy, @function
memcpy:
        .cfi_startproc

        mov       %rdx, %rcx
        mov       %rdi, %rax
        cmp       $8, %rdx
        jb        .LSHORT

        mov       -8(%rsi, %rdx), %r8
        mov       (%rsi), %r9
        mov       %r8, -8(%rdi, %rdx)
        and       $24, %rcx
        jz        .L32

        mov       %r9, (%rdi)
        mov       %rcx, %r8
        sub       $16, %rcx
        jb        .LT32
#ifndef __AVX__
        movdqu    (%rsi, %rcx), %xmm1
        movdqu    %xmm1, (%rdi, %rcx)
#else
        vmovdqu   (%rsi, %rcx), %xmm1
        vmovdqu   %xmm1, (%rdi, %rcx)
#endif
        //        Test if there are 32-byte groups
.LT32:
        add       %r8, %rsi
        and       $-32, %rdx
        jnz       .L32_adjDI
        ret

        .align    16
.L32_adjDI:
        add       %r8, %rdi
.L32:
#ifndef __AVX__
        movdqu    (%rsi), %xmm0
        movdqu    16(%rsi), %xmm1
#else
        vmovdqu   (%rsi), %ymm0
#endif
        shr       $6, %rdx
        jnc       .L64_32read
#ifndef __AVX__
        movdqu    %xmm0, (%rdi)
        movdqu    %xmm1, 16(%rdi)
#else
        vmovdqu   %ymm0, (%rdi)
#endif
        lea       32(%rsi), %rsi
        jnz       .L64_adjDI
#ifdef __AVX__
        vzeroupper
#endif
        ret

.L64_adjDI:
        add       $32, %rdi

.L64:
#ifndef __AVX__
        movdqu    (%rsi), %xmm0
        movdqu    16(%rsi), %xmm1
#else
        vmovdqu   (%rsi), %ymm0
#endif

.L64_32read:
#ifndef __AVX__
        movdqu    32(%rsi), %xmm2
        movdqu    48(%rsi), %xmm3
        add       $64, %rsi
        movdqu    %xmm0, (%rdi)
        movdqu    %xmm1, 16(%rdi)
        movdqu    %xmm2, 32(%rdi)
        movdqu    %xmm3, 48(%rdi)
#else
        vmovdqu   32(%rsi), %ymm1
        add       $64, %rsi
        vmovdqu   %ymm0, (%rdi)
        vmovdqu   %ymm1, 32(%rdi)
#endif
        add       $64, %rdi
        dec       %rdx
        jnz       .L64
#ifdef __AVX__
        vzeroupper
#endif
        ret

        .cfi_endproc
        .size memcpy, .-memcpy

#endif
