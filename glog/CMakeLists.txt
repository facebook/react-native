set(SOURCES
	src/demangle.cc
	src/logging.cc
	src/raw_logging.cc
	src/signalhandler.cc
	src/symbolize.cc
	src/utilities.cc
	src/vlog_is_on.cc)

add_library(glog ${SOURCES})

target_include_directories(glog PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}/src")

target_include_directories(glog PRIVATE "${CMAKE_CURRENT_SOURCE_DIR}/src/glog")
