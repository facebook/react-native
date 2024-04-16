CC = gcc
CFLAGS = -O2 -Wall
prefix =
includedir = $(prefix)/include
libdir = $(prefix)/lib
CPPFLAGS = -I$(includedir)
LDFLAGS = -L$(libdir) -Wl,-rpath,$(libdir)

all: check-call check-callback

test-call: test-call.c testcases.c
	$(CC) $(CPPFLAGS) $(CFLAGS) $(LDFLAGS) -o test-call test-call.c -lffi

test-callback: test-callback.c testcases.c
	$(CC) $(CPPFLAGS) $(CFLAGS) $(LDFLAGS) -o test-callback test-callback.c -lffi

check-call: test-call
	./test-call > test-call.out
	LC_ALL=C uniq -u < test-call.out > failed-call
	test '!' -s failed-call

check-callback: test-callback
	./test-callback > test-callback.out
	LC_ALL=C uniq -u < test-callback.out > failed-callback
	test '!' -s failed-callback

clean:
	rm -f test-call test-callback test-call.out test-callback.out failed-call failed-callback
