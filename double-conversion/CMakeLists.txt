set(SOURCES
	double-conversion/bignum.cc
	double-conversion/bignum-dtoa.cc
	double-conversion/cached-powers.cc
	double-conversion/diy-fp.cc
	double-conversion/double-conversion.cc
	double-conversion/fast-dtoa.cc
	double-conversion/fixed-dtoa.cc
	double-conversion/strtod.cc)

add_library(double-conversion ${SOURCES})

target_include_directories(double-conversion PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
