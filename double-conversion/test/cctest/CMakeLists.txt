
set(CCTEST_SRC
  cctest.cc
  gay-fixed.cc
  gay-precision.cc
  gay-shortest.cc
  gay-shortest-single.cc
  test-bignum.cc
  test-bignum-dtoa.cc
  test-conversions.cc
  test-diy-fp.cc
  test-dtoa.cc
  test-fast-dtoa.cc
  test-fixed-dtoa.cc
  test-ieee.cc
  test-strtod.cc
)

add_executable(cctest ${CCTEST_SRC})
target_link_libraries(cctest double-conversion)

add_test(NAME test_bignum
  WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
  COMMAND $<TARGET_FILE:cctest> test-bignum)

add_test(NAME test_bignum_dtoa
  WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
  COMMAND $<TARGET_FILE:cctest> test-bignum-dtoa)

add_test(NAME test_conversions
  WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
  COMMAND $<TARGET_FILE:cctest> test-conversions)
add_test(NAME test_diy_fp
  WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
  COMMAND $<TARGET_FILE:cctest> test-diy-fp)
add_test(NAME test_dtoa
  WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
  COMMAND $<TARGET_FILE:cctest> test-dtoa)
add_test(NAME test_fast_dtoa
  WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
  COMMAND $<TARGET_FILE:cctest> test-fast-dtoa)
add_test(NAME test_fixed_dtoa
  WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
  COMMAND $<TARGET_FILE:cctest> test-fixed-dtoa)
add_test(NAME test_ieee
  WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
  COMMAND $<TARGET_FILE:cctest> test-ieee)
add_test(NAME test_strtod
  WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
  COMMAND $<TARGET_FILE:cctest> test-strtod)
