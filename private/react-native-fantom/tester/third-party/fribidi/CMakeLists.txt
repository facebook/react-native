# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set(FRIBIDI_SRC_DIR ${CMAKE_CURRENT_SOURCE_DIR}/fribidi-1.0.13)

add_library(fribidi STATIC
    ${FRIBIDI_SRC_DIR}/lib/fribidi.c
    ${FRIBIDI_SRC_DIR}/lib/fribidi-arabic.c
    ${FRIBIDI_SRC_DIR}/lib/fribidi-bidi.c
    ${FRIBIDI_SRC_DIR}/lib/fribidi-bidi-types.c
    ${FRIBIDI_SRC_DIR}/lib/fribidi-brackets.c
    ${FRIBIDI_SRC_DIR}/lib/fribidi-char-sets.c
    ${FRIBIDI_SRC_DIR}/lib/fribidi-char-sets-cap-rtl.c
    ${FRIBIDI_SRC_DIR}/lib/fribidi-char-sets-cp1255.c
    ${FRIBIDI_SRC_DIR}/lib/fribidi-char-sets-cp1256.c
    ${FRIBIDI_SRC_DIR}/lib/fribidi-char-sets-iso8859-6.c
    ${FRIBIDI_SRC_DIR}/lib/fribidi-char-sets-iso8859-8.c
    ${FRIBIDI_SRC_DIR}/lib/fribidi-char-sets-utf8.c
    ${FRIBIDI_SRC_DIR}/lib/fribidi-deprecated.c
    ${FRIBIDI_SRC_DIR}/lib/fribidi-joining.c
    ${FRIBIDI_SRC_DIR}/lib/fribidi-joining-types.c
    ${FRIBIDI_SRC_DIR}/lib/fribidi-mirroring.c
    ${FRIBIDI_SRC_DIR}/lib/fribidi-run.c
    ${FRIBIDI_SRC_DIR}/lib/fribidi-shape.c
)

target_include_directories(fribidi
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
        ${FRIBIDI_SRC_DIR}/lib
)

target_compile_definitions(fribidi
    PRIVATE
        HAVE_STRING_H=1
        HAVE_STRINGS_H=1
        HAVE_STDLIB_H=1
        HAVE_MEMORY_H=1
        HAVE_STRINGIZE=1
        FRIBIDI_LIB_STATIC=1
)
