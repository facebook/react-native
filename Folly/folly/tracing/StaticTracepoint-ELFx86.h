/*
 * Copyright 2016-present Facebook, Inc.
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

// clang-format off
#include <cstddef>

// Default constraint for the probe arguments as operands.
#ifndef FOLLY_SDT_ARG_CONSTRAINT
#define FOLLY_SDT_ARG_CONSTRAINT      "nor"
#endif

// Instruction to emit for the probe.
#define FOLLY_SDT_NOP                 nop

// Note section properties.
#define FOLLY_SDT_NOTE_NAME           "stapsdt"
#define FOLLY_SDT_NOTE_TYPE           3

// Semaphore variables are put in this section
#define FOLLY_SDT_SEMAPHORE_SECTION   ".probes"

// Size of address depending on platform.
#ifdef __LP64__
#define FOLLY_SDT_ASM_ADDR            .8byte
#else
#define FOLLY_SDT_ASM_ADDR            .4byte
#endif

// Assembler helper Macros.
#define FOLLY_SDT_S(x)                #x
#define FOLLY_SDT_ASM_1(x)            FOLLY_SDT_S(x) "\n"
#define FOLLY_SDT_ASM_2(a, b)         FOLLY_SDT_S(a) "," FOLLY_SDT_S(b) "\n"
#define FOLLY_SDT_ASM_3(a, b, c)      FOLLY_SDT_S(a) "," FOLLY_SDT_S(b) ","    \
                                      FOLLY_SDT_S(c) "\n"
#define FOLLY_SDT_ASM_STRING(x)       FOLLY_SDT_ASM_1(.asciz FOLLY_SDT_S(x))

// Helper to determine the size of an argument.
#define FOLLY_SDT_IS_ARRAY_POINTER(x)  ((__builtin_classify_type(x) == 14) ||  \
                                        (__builtin_classify_type(x) == 5))
#define FOLLY_SDT_ARGSIZE(x)  (FOLLY_SDT_IS_ARRAY_POINTER(x)                   \
                               ? sizeof(void*)                                 \
                               : sizeof(x))

// Format of each probe arguments as operand.
// Size of the arugment tagged with FOLLY_SDT_Sn, with "n" constraint.
// Value of the argument tagged with FOLLY_SDT_An, with configured constraint.
#define FOLLY_SDT_ARG(n, x)                                                    \
  [FOLLY_SDT_S##n] "n"                ((size_t)FOLLY_SDT_ARGSIZE(x)),          \
  [FOLLY_SDT_A##n] FOLLY_SDT_ARG_CONSTRAINT (x)

// Templates to append arguments as operands.
#define FOLLY_SDT_OPERANDS_0()        [__sdt_dummy] "g" (0)
#define FOLLY_SDT_OPERANDS_1(_1)      FOLLY_SDT_ARG(1, _1)
#define FOLLY_SDT_OPERANDS_2(_1, _2)                                           \
  FOLLY_SDT_OPERANDS_1(_1), FOLLY_SDT_ARG(2, _2)
#define FOLLY_SDT_OPERANDS_3(_1, _2, _3)                                       \
  FOLLY_SDT_OPERANDS_2(_1, _2), FOLLY_SDT_ARG(3, _3)
#define FOLLY_SDT_OPERANDS_4(_1, _2, _3, _4)                                   \
  FOLLY_SDT_OPERANDS_3(_1, _2, _3), FOLLY_SDT_ARG(4, _4)
#define FOLLY_SDT_OPERANDS_5(_1, _2, _3, _4, _5)                               \
  FOLLY_SDT_OPERANDS_4(_1, _2, _3, _4), FOLLY_SDT_ARG(5, _5)
#define FOLLY_SDT_OPERANDS_6(_1, _2, _3, _4, _5, _6)                           \
  FOLLY_SDT_OPERANDS_5(_1, _2, _3, _4, _5), FOLLY_SDT_ARG(6, _6)
#define FOLLY_SDT_OPERANDS_7(_1, _2, _3, _4, _5, _6, _7)                       \
  FOLLY_SDT_OPERANDS_6(_1, _2, _3, _4, _5, _6), FOLLY_SDT_ARG(7, _7)
#define FOLLY_SDT_OPERANDS_8(_1, _2, _3, _4, _5, _6, _7, _8)                   \
  FOLLY_SDT_OPERANDS_7(_1, _2, _3, _4, _5, _6, _7), FOLLY_SDT_ARG(8, _8)
#define FOLLY_SDT_OPERANDS_9(_1, _2, _3, _4, _5, _6, _7, _8, _9)               \
  FOLLY_SDT_OPERANDS_8(_1, _2, _3, _4, _5, _6, _7, _8), FOLLY_SDT_ARG(9, _9)

// Templates to reference the arguments from operands in note section.
#define FOLLY_SDT_ARGFMT(no)        %n[FOLLY_SDT_S##no]@%[FOLLY_SDT_A##no]
#define FOLLY_SDT_ARG_TEMPLATE_0    /*No arguments*/
#define FOLLY_SDT_ARG_TEMPLATE_1    FOLLY_SDT_ARGFMT(1)
#define FOLLY_SDT_ARG_TEMPLATE_2    FOLLY_SDT_ARG_TEMPLATE_1 FOLLY_SDT_ARGFMT(2)
#define FOLLY_SDT_ARG_TEMPLATE_3    FOLLY_SDT_ARG_TEMPLATE_2 FOLLY_SDT_ARGFMT(3)
#define FOLLY_SDT_ARG_TEMPLATE_4    FOLLY_SDT_ARG_TEMPLATE_3 FOLLY_SDT_ARGFMT(4)
#define FOLLY_SDT_ARG_TEMPLATE_5    FOLLY_SDT_ARG_TEMPLATE_4 FOLLY_SDT_ARGFMT(5)
#define FOLLY_SDT_ARG_TEMPLATE_6    FOLLY_SDT_ARG_TEMPLATE_5 FOLLY_SDT_ARGFMT(6)
#define FOLLY_SDT_ARG_TEMPLATE_7    FOLLY_SDT_ARG_TEMPLATE_6 FOLLY_SDT_ARGFMT(7)
#define FOLLY_SDT_ARG_TEMPLATE_8    FOLLY_SDT_ARG_TEMPLATE_7 FOLLY_SDT_ARGFMT(8)
#define FOLLY_SDT_ARG_TEMPLATE_9    FOLLY_SDT_ARG_TEMPLATE_8 FOLLY_SDT_ARGFMT(9)

// Semaphore define, declare and probe note format

#define FOLLY_SDT_SEMAPHORE(provider, name)                                    \
  folly_sdt_semaphore_##provider##_##name

#define FOLLY_SDT_DEFINE_SEMAPHORE(provider, name)                             \
  extern "C" {                                                                 \
    volatile unsigned short FOLLY_SDT_SEMAPHORE(provider, name)                \
    __attribute__((section(FOLLY_SDT_SEMAPHORE_SECTION), used)) = 0;           \
  }

#define FOLLY_SDT_DECLARE_SEMAPHORE(provider, name)                            \
  extern "C" volatile unsigned short FOLLY_SDT_SEMAPHORE(provider, name)

#define FOLLY_SDT_SEMAPHORE_NOTE_0(provider, name)                             \
  FOLLY_SDT_ASM_1(     FOLLY_SDT_ASM_ADDR 0) /*No Semaphore*/                  \

#define FOLLY_SDT_SEMAPHORE_NOTE_1(provider, name)                             \
  FOLLY_SDT_ASM_1(FOLLY_SDT_ASM_ADDR FOLLY_SDT_SEMAPHORE(provider, name))

// Structure of note section for the probe.
#define FOLLY_SDT_NOTE_CONTENT(provider, name, has_semaphore, arg_template)    \
  FOLLY_SDT_ASM_1(990: FOLLY_SDT_NOP)                                          \
  FOLLY_SDT_ASM_3(     .pushsection .note.stapsdt,"","note")                   \
  FOLLY_SDT_ASM_1(     .balign 4)                                              \
  FOLLY_SDT_ASM_3(     .4byte 992f-991f, 994f-993f, FOLLY_SDT_NOTE_TYPE)       \
  FOLLY_SDT_ASM_1(991: .asciz FOLLY_SDT_NOTE_NAME)                             \
  FOLLY_SDT_ASM_1(992: .balign 4)                                              \
  FOLLY_SDT_ASM_1(993: FOLLY_SDT_ASM_ADDR 990b)                                \
  FOLLY_SDT_ASM_1(     FOLLY_SDT_ASM_ADDR 0) /*Reserved for Base Address*/     \
  FOLLY_SDT_SEMAPHORE_NOTE_##has_semaphore(provider, name)                     \
  FOLLY_SDT_ASM_STRING(provider)                                               \
  FOLLY_SDT_ASM_STRING(name)                                                   \
  FOLLY_SDT_ASM_STRING(arg_template)                                           \
  FOLLY_SDT_ASM_1(994: .balign 4)                                              \
  FOLLY_SDT_ASM_1(     .popsection)

// Main probe Macro.
#define FOLLY_SDT_PROBE(provider, name, has_semaphore, n, arglist)             \
    __asm__ __volatile__ (                                                     \
      FOLLY_SDT_NOTE_CONTENT(                                                  \
        provider, name, has_semaphore, FOLLY_SDT_ARG_TEMPLATE_##n)             \
      :: FOLLY_SDT_OPERANDS_##n arglist                                        \
    )                                                                          \

// Helper Macros to handle variadic arguments.
#define FOLLY_SDT_NARG_(_0, _1, _2, _3, _4, _5, _6, _7, _8, _9, N, ...) N
#define FOLLY_SDT_NARG(...)                                                    \
  FOLLY_SDT_NARG_(__VA_ARGS__, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0)
#define FOLLY_SDT_PROBE_N(provider, name, has_semaphore, N, ...)               \
  FOLLY_SDT_PROBE(provider, name, has_semaphore, N, (__VA_ARGS__))
