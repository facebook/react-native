# -*- makefile -*-

include ${srcdir}/libffi.gnu.mk

CCACHE := $(shell type -p ccache)
BUILD_DIR := $(shell pwd)

INCFLAGS += -I"$(BUILD_DIR)"

# Work out which arches we need to compile the lib for
ARCHES :=
ARCHFLAGS ?= $(filter -arch %, $(CFLAGS))

ifneq ($(findstring -arch ppc,$(ARCHFLAGS)),)
  ARCHES += ppc
endif

ifneq ($(findstring -arch i386,$(ARCHFLAGS)),)
  ARCHES += i386
endif

ifneq ($(findstring -arch x86_64,$(ARCHFLAGS)),)
  ARCHES += x86_64
endif

ifeq ($(strip $(ARCHES)),)
LIBFFI_BUILD_DIR = $(BUILD_DIR)/libffi-$(arch)
# Just build the one (default) architecture
$(LIBFFI):
	@mkdir -p "$(LIBFFI_BUILD_DIR)" "$(@D)"
	@if [ ! -f "$(LIBFFI_SRC_DIR)"/configure ]; then \
		echo "Running autoreconf for libffi"; \
		cd "$(LIBFFI_SRC_DIR)" && \
		/bin/sh $(LIBFFI_AUTOGEN) > /dev/null; \
	fi
	@if [ ! -f "$(LIBFFI_BUILD_DIR)"/Makefile ]; then \
		echo "Configuring libffi"; \
		cd "$(LIBFFI_BUILD_DIR)" && \
		/usr/bin/env CC="$(CC)" LD="$(LD)" CFLAGS="$(LIBFFI_CFLAGS)" GREP_OPTIONS="" \
		/bin/sh $(LIBFFI_CONFIGURE) $(LIBFFI_HOST) > /dev/null; \
	fi
	cd "$(LIBFFI_BUILD_DIR)" && $(MAKE)

else
LIBTARGETS = $(foreach arch,$(ARCHES),"$(BUILD_DIR)"/libffi-$(arch)/.libs/libffi_convenience.a)

# Build a fat binary and assemble
build_ffi = \
	mkdir -p "$(BUILD_DIR)"/libffi-$(1); \
	(if [ ! -f "$(LIBFFI_SRC_DIR)"/configure ]; then \
		echo "Running autoreconf for libffi"; \
		cd "$(LIBFFI_SRC_DIR)" && \
		/bin/sh $(LIBFFI_AUTOGEN) > /dev/null; \
	fi); \
	(if [ ! -f "$(BUILD_DIR)"/libffi-$(1)/Makefile ]; then \
	    echo "Configuring libffi for $(1)"; \
	    cd "$(BUILD_DIR)"/libffi-$(1) && \
	      env CC="$(CCACHE) $(CC)" CFLAGS="-arch $(1) $(LIBFFI_CFLAGS)" LDFLAGS="-arch $(1)" \
		$(LIBFFI_CONFIGURE) --host=$(1)-apple-darwin > /dev/null; \
	fi); \
	$(MAKE) -C "$(BUILD_DIR)"/libffi-$(1)

target_ffi = "$(BUILD_DIR)"/libffi-$(1)/.libs/libffi_convenience.a:; $(call build_ffi,$(1))

# Work out which arches we need to compile the lib for
ifneq ($(findstring ppc,$(ARCHES)),)
  $(call target_ffi,ppc)
endif

ifneq ($(findstring i386,$(ARCHES)),)
  $(call target_ffi,i386)
endif

ifneq ($(findstring x86_64,$(ARCHES)),)
  $(call target_ffi,x86_64)
endif


$(LIBFFI):	$(LIBTARGETS)
	# Assemble into a FAT (x86_64, i386, ppc) library
	@mkdir -p "$(@D)"
	/usr/bin/libtool -static -o $@ \
	    $(foreach arch, $(ARCHES),"$(BUILD_DIR)"/libffi-$(arch)/.libs/libffi_convenience.a)
	@mkdir -p "$(LIBFFI_BUILD_DIR)"/include
	$(RM) "$(LIBFFI_BUILD_DIR)"/include/ffi.h
	@( \
		printf "#if defined(__i386__)\n"; \
		printf "#include \"libffi-i386/include/ffi.h\"\n"; \
		printf "#elif defined(__x86_64__)\n"; \
		printf "#include \"libffi-x86_64/include/ffi.h\"\n";\
		printf "#elif defined(__ppc__)\n"; \
		printf "#include \"libffi-ppc/include/ffi.h\"\n";\
		printf "#endif\n";\
	) > "$(LIBFFI_BUILD_DIR)"/include/ffi.h
	@( \
		printf "#if defined(__i386__)\n"; \
		printf "#include \"libffi-i386/include/ffitarget.h\"\n"; \
		printf "#elif defined(__x86_64__)\n"; \
		printf "#include \"libffi-x86_64/include/ffitarget.h\"\n";\
		printf "#elif defined(__ppc__)\n"; \
		printf "#include \"libffi-ppc/include/ffitarget.h\"\n";\
		printf "#endif\n";\
	) > "$(LIBFFI_BUILD_DIR)"/include/ffitarget.h

endif
