# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

# Util function that help us verify that you're not including a header file
# which has an invalid import path. Most of the time this is causing a C++ circular dependency.
function(check_for_circular_dependencies allowed_imports_paths)
  file(GLOB headers CONFIGURE_DEPENDS *.h)
  foreach(file ${headers})
    file(STRINGS ${file} header_file)
    while(header_file)
      list(POP_FRONT header_file line)
      if (line MATCHES "^#include <react")
        set(matched_import false)
        foreach(allowed_import ${allowed_imports_paths})
          if (line MATCHES "^#include <${allowed_import}")
            set(matched_import true)
            continue()
          endif()
        endforeach()
        if (NOT matched_import)
          message(FATAL_ERROR "!!!!!\nDiscovered an invalid include on file\n${file}\nfor include\n${line}\n")
          break()
        endif()
      endif()
    endwhile()
  endforeach()
endfunction()
