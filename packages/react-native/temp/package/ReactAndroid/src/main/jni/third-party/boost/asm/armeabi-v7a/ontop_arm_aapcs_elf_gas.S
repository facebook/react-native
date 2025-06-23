/*
            Copyright Oliver Kowalke 2009.
   Distributed under the Boost Software License, Version 1.0.
      (See accompanying file LICENSE_1_0.txt or copy at
          http://www.boost.org/LICENSE_1_0.txt)
*/

/*******************************************************
 *                                                     *
 *  -------------------------------------------------  *
 *  |  0  |  1  |  2  |  3  |  4  |  5  |  6  |  7  |  *
 *  -------------------------------------------------  *
 *  | 0x0 | 0x4 | 0x8 | 0xc | 0x10| 0x14| 0x18| 0x1c|  *
 *  -------------------------------------------------  *
 *  | s16 | s17 | s18 | s19 | s20 | s21 | s22 | s23 |  *
 *  -------------------------------------------------  *
 *  -------------------------------------------------  *
 *  |  8  |  9  |  10 |  11 |  12 |  13 |  14 |  15 |  *
 *  -------------------------------------------------  *
 *  | 0x20| 0x24| 0x28| 0x2c| 0x30| 0x34| 0x38| 0x3c|  *
 *  -------------------------------------------------  *
 *  | s24 | s25 | s26 | s27 | s28 | s29 | s30 | s31 |  *
 *  -------------------------------------------------  *
 *  -------------------------------------------------  *
 *  |  16 |  17 |  18 |  19 |  20 |  21 |  22 |  23 |  *
 *  -------------------------------------------------  *
 *  | 0x40| 0x44| 0x48| 0x4c| 0x50| 0x54| 0x58| 0x5c|  *
 *  -------------------------------------------------  *
 *  |hiddn|  v1 |  v2 |  v3 |  v4 |  v5 |  v6 |  v7 |  *
 *  -------------------------------------------------  *
 *  -------------------------------------------------  *
 *  |  24 |  25 |  26 |  27 |  28 |  29 |  30 |  31 |  *
 *  -------------------------------------------------  *
 *  | 0x60| 0x64| 0x68| 0x6c| 0x70| 0x74| 0x78| 0x7c|  *
 *  -------------------------------------------------  *
 *  |  v8 |  lr |  pc | FCTX| DATA|                 |  *
 *  -------------------------------------------------  *
 *                                                     *
 *******************************************************/

.text
.globl ontop_fcontext
.align 2
.type ontop_fcontext,%function
ontop_fcontext:
    @ save LR as PC
    push {lr}
    @ save hidden,V1-V8,LR
    push {a1,v1-v8,lr}

    @ prepare stack for FPU
    sub  sp, sp, #64
#if (defined(__VFP_FP__) && !defined(__SOFTFP__))
    @ save S16-S31
    vstmia sp, {d8-d15}
#endif

    @ store RSP (pointing to context-data) in A1
    mov  a1, sp

    @ restore RSP (pointing to context-data) from A2
    mov  sp, a2

    @ store parent context in A2
    mov  a2, a1

#if (defined(__VFP_FP__) && !defined(__SOFTFP__))
    @ restore S16-S31
    vldmia  sp, {d8-d15}
#endif
    @ prepare stack for FPU
    add  sp, sp, #64

    @ restore hidden,V1-V8,LR
    pop {a1,v1-v8,lr}

    @ return transfer_t from jump
    str  a2, [a1, #0]
    str  a3, [a1, #4]
    @ pass transfer_t as first arg in context function
    @ A1 == hidden, A2 == FCTX, A3 == DATA

    @ skip PC
    add  sp, sp, #4

    @ jump to ontop-function
    bx  a4
.size ontop_fcontext,.-ontop_fcontext

@ Mark that we don't need executable stack.
.section .note.GNU-stack,"",%progbits
