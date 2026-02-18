# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set(FC_SRC_DIR ${CMAKE_CURRENT_SOURCE_DIR}/fontconfig-2.14.2)

file(GLOB FC_SOURCES ${FC_SRC_DIR}/src/*.c)
# Exclude Windows-specific files
list(FILTER FC_SOURCES EXCLUDE REGEX "fcwindows")

add_library(fontconfig STATIC ${FC_SOURCES})

target_include_directories(fontconfig
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
        ${FC_SRC_DIR}
        ${FC_SRC_DIR}/src
)

target_compile_definitions(fontconfig
    PRIVATE
        HAVE_CONFIG_H=1
        FC_CACHEDIR="/tmp/fontconfig-cache"
        FC_TEMPLATEDIR="/etc/fonts/conf.d"
        FONTCONFIG_PATH="/etc/fonts"
        _GNU_SOURCE=1
        FLEXIBLE_ARRAY_MEMBER=/**/
)

target_compile_options(fontconfig
    PRIVATE
        -Wno-sign-compare
        -Wno-unused-parameter
        -Wno-missing-field-initializers
        -Wno-pointer-sign
)

target_link_libraries(fontconfig PUBLIC freetype expat)
