# -*- makefile -*-
#
# Makefile for BSD systems
#

LOCAL_LIBS += ${LIBFFI} -lpthread

LIBFFI_CFLAGS = ${FFI_MMAP_EXEC} -pthread
LIBFFI_BUILD_DIR = ${.CURDIR}/libffi-${arch}
INCFLAGS := -I${LIBFFI_BUILD_DIR}/include -I${INCFLAGS}

.if ${srcdir} == "."
  LIBFFI_SRC_DIR := ${.CURDIR}/libffi
.else
  LIBFFI_SRC_DIR := ${srcdir}/libffi
.endif


LIBFFI = ${LIBFFI_BUILD_DIR}/.libs/libffi_convenience.a
LIBFFI_AUTOGEN = ${LIBFFI_SRC_DIR}/autogen.sh
LIBFFI_CONFIGURE = ${LIBFFI_SRC_DIR}/configure --disable-shared --enable-static \
	--with-pic=yes --disable-dependency-tracking --disable-docs $(LIBFFI_DEBUG)

$(OBJS):	${LIBFFI}

$(LIBFFI):
	@mkdir -p ${LIBFFI_BUILD_DIR}
	@if [ ! -f $(LIBFFI_SRC_DIR)/configure ]; then \
		echo "Running autoreconf for libffi"; \
		cd "$(LIBFFI_SRC_DIR)" && \
		/bin/sh $(LIBFFI_AUTOGEN) > /dev/null; \
	fi
	@if [ ! -f ${LIBFFI_BUILD_DIR}/Makefile ]; then \
		echo "Configuring libffi"; \
		cd ${LIBFFI_BUILD_DIR} && \
		/usr/bin/env CC="${CC}" LD="${LD}" CFLAGS="${LIBFFI_CFLAGS}" GREP_OPTIONS="" \
		/bin/sh ${LIBFFI_CONFIGURE} ${LIBFFI_HOST} > /dev/null; \
	fi
	@cd ${LIBFFI_BUILD_DIR} && ${MAKE}

