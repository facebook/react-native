# -*- makefile -*-

include ${srcdir}/libffi.gnu.mk

$(LIBFFI):
	@mkdir -p "$(LIBFFI_BUILD_DIR)" "$@(D)"
	@if [ ! -f "$(LIBFFI_SRC_DIR)"/configure ]; then \
		echo "Running autoreconf for libffi"; \
		cd "$(LIBFFI_SRC_DIR)" && \
		/bin/sh $(LIBFFI_AUTOGEN) > /dev/null; \
	fi
	@if [ ! -f "$(LIBFFI_BUILD_DIR)"/Makefile ]; then \
		echo "Configuring libffi"; \
		cd "$(LIBFFI_BUILD_DIR)" && \
		env CFLAGS="$(LIBFFI_CFLAGS)" GREP_OPTIONS="" \
		sh $(LIBFFI_CONFIGURE) $(LIBFFI_HOST) > /dev/null; \
	fi
	$(MAKE) -C "$(LIBFFI_BUILD_DIR)"
