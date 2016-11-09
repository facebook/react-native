ios9:
	IOS_VERSION=9 \
	JSC_VERSION=7601.1.46.3 \
	WEB_CORE_VERSION=7601.1.46.10 \
	WTF_VERSION=7601.1.46.3 \
	make -f Makefile.base

ios8:
	IOS_VERSION=8 \
	JSC_VERSION=7600.1.17 \
	WEB_CORE_VERSION=7600.1.25 \
	WTF_VERSION=7600.1.24 \
	make -f Makefile.base

.PHONY: clean
clean:
	-rm -rf $(wildcard *.dylib)
	-rm -rf download
