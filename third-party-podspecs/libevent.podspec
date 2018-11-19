
Pod::Spec.new do |s|

  s.name         = "libevent"
  s.version      = "2.1.5-beta"
  s.summary      = "An event notification library."

  s.description  = <<-DESC
The libevent API provides a mechanism to execute a callback function when a
specific event occurs on a file descriptor or after a timeout has been reached.
Furthermore, libevent also supports callbacks due to signals or regular
timeouts.
                   DESC

  s.homepage     = "http://libevent.org"
  s.documentation_url = "http://www.wangafu.net/~nickm/libevent-2.1/doxygen/html/"

  s.license      = "BSD"

  s.authors             = { "Nick Mathewson" => "nickm@alum.mit.edu",
                            "Niels Provos" => "provos@umich.edu" }

  s.platform     = :ios, "8.0"

  #  When using multiple platforms
  # s.ios.deployment_target = "5.0"
  # s.osx.deployment_target = "10.7"
  # s.watchos.deployment_target = "2.0"
  s.compiler_flags = '-Wno-shorten-64-to-32', '-Wno-unused-function', '-Wno-unreachable-code',
                     '-Wno-tautological-constant-out-of-range-compare',
                     '-Wno-constant-conversion',
                     '-Wno-ambiguous-macro'

  s.source = { :git => "https://github.com/libevent/libevent.git",
               :tag => "release-2.1.5-beta" }

  s.source_files  = [ "*.h",
                      "buffer.c",
                      "bufferevent.c",
                      "bufferevent_filter.c",
                      "bufferevent_pair.c",
                      "bufferevent_ratelim.c",
                      "bufferevent_sock.c",
                      "evdns.c",
                      "event.c",
                      "event_tagging.c",
                      "evmap.c",
                      "evthread.c",
                      "evthread_pthread.c",
                      "evrpc.c",
                      "evutil.c",
                      "evutil_rand.c",
                      "evutil_time.c",
                      "http.c",
                      "kqueue.c",
                      "listener.c",
                      "log.c",
                      "poll.c",
                      "select.c",
                      "signal.c",
                      "include/event.h",
                      "include/evutil.h",
                      "include/event2/buffer.h",
                      "include/event2/buffer_compat.h",
                      "include/event2/bufferevent.h",
                      "include/event2/bufferevent_compat.h",
                      "include/event2/bufferevent_struct.h",
                      "include/event2/dns.h",
                      "include/event2/dns_compat.h",
                      "include/event2/tag_compat.h",
                      "include/event2/dns_struct.h",
                      "include/event2/event.h",
                      "include/event2/event_compat.h",
                      "include/event2/event_struct.h",
                      "include/event2/event-config.h",
                      "include/event2/http.h",
                      "include/event2/http_compat.h",
                      "include/event2/http_struct.h",
                      "include/event2/keyvalq_struct.h",
                      "include/event2/listener.h",
                      "include/event2/tag.h",
                      "include/event2/thread.h",
                      "include/event2/rpc.h",
                      "include/event2/rpc_struct.h",
                      "include/event2/util.h",
                      "include/event2/visibility.h",
                      "include/sys/queue.h" ]
  s.header_mappings_dir = "include"
  s.xcconfig = {
    'USE_HEADERMAP' => 'NO',
  }

  s.public_header_files = "include/event2/*.h",
                          "include/*.h"

  s.prepare_command = <<-CMD
mkdir -p include/sys
cp compat/sys/queue.h include/sys
cat > include/event2/event-config.h <<EVENT_CONFIG_H
#ifndef EVENT2_EVENT_CONFIG_H_INCLUDED_
#define EVENT2_EVENT_CONFIG_H_INCLUDED_
#define EVENT__HAVE_ARC4RANDOM 1
#define EVENT__HAVE_ARC4RANDOM_BUF 1
#define EVENT__HAVE_ARPA_INET_H 1
#define EVENT__HAVE_DECL_CTL_KERN 1
#define EVENT__HAVE_DECL_KERN_ARND 0
#define EVENT__HAVE_DECL_KERN_RANDOM 0
#define EVENT__HAVE_DECL_RANDOM_UUID 0
#define EVENT__HAVE_DLFCN_H 1
#define EVENT__HAVE_FCNTL 1
#define EVENT__HAVE_FCNTL_H 1
#define EVENT__HAVE_FD_MASK 1
#define EVENT__HAVE_GETADDRINFO 1
#define EVENT__HAVE_GETEGID 1
#define EVENT__HAVE_GETEUID 1
#define EVENT__HAVE_GETIFADDRS 1
#define EVENT__HAVE_GETNAMEINFO 1
#define EVENT__HAVE_GETPROTOBYNUMBER 1
#define EVENT__HAVE_GETTIMEOFDAY 1
#define EVENT__HAVE_IFADDRS_H 1
#define EVENT__HAVE_INET_NTOP 1
#define EVENT__HAVE_INET_PTON 1
#define EVENT__HAVE_INTTYPES_H 1
#define EVENT__HAVE_ISSETUGID 1
#define EVENT__HAVE_KQUEUE 1
#define EVENT__HAVE_LIBZ 1
#define EVENT__HAVE_MACH_ABSOLUTE_TIME 1
#define EVENT__HAVE_MACH_MACH_TIME_H 1
#define EVENT__HAVE_MEMORY_H 1
#define EVENT__HAVE_MMAP 1
#define EVENT__HAVE_NANOSLEEP 1
#define EVENT__HAVE_NETDB_H 1
#define EVENT__HAVE_NETINET_IN_H 1
#define EVENT__HAVE_NETINET_TCP_H 1
#define EVENT__HAVE_PIPE 1
#define EVENT__HAVE_POLL 1
#define EVENT__HAVE_POLL_H 1
#define EVENT__HAVE_PTHREADS 1
#define EVENT__HAVE_PUTENV 1
#define EVENT__HAVE_SA_FAMILY_T 1
#define EVENT__HAVE_SELECT 1
#define EVENT__HAVE_SENDFILE 1
#define EVENT__HAVE_SETENV 1
#define EVENT__HAVE_SETFD 1
#define EVENT__HAVE_SETRLIMIT 1
#define EVENT__HAVE_SIGACTION 1
#define EVENT__HAVE_SIGNAL 1
#define EVENT__HAVE_STDARG_H 1
#define EVENT__HAVE_STDDEF_H 1
#define EVENT__HAVE_STDINT_H 1
#define EVENT__HAVE_STDLIB_H 1
#define EVENT__HAVE_STRINGS_H 1
#define EVENT__HAVE_STRING_H 1
#define EVENT__HAVE_STRLCPY 1
#define EVENT__HAVE_STRSEP 1
#define EVENT__HAVE_STRTOK_R 1
#define EVENT__HAVE_STRTOLL 1
#define EVENT__HAVE_STRUCT_ADDRINFO 1
#define EVENT__HAVE_STRUCT_IN6_ADDR 1
#define EVENT__HAVE_STRUCT_SOCKADDR_IN6 1
#define EVENT__HAVE_STRUCT_SOCKADDR_IN6_SIN6_LEN 1
#define EVENT__HAVE_STRUCT_SOCKADDR_IN_SIN_LEN 1
#define EVENT__HAVE_STRUCT_SOCKADDR_STORAGE 1
#define EVENT__HAVE_STRUCT_SOCKADDR_STORAGE_SS_FAMILY 1
#define EVENT__HAVE_SYSCTL 1
#define EVENT__HAVE_SYS_EVENT_H 1
#define EVENT__HAVE_SYS_IOCTL_H 1
#define EVENT__HAVE_SYS_MMAN_H 1
#define EVENT__HAVE_SYS_PARAM_H 1
#define EVENT__HAVE_SYS_QUEUE_H 1
#define EVENT__HAVE_SYS_RESOURCE_H 1
#define EVENT__HAVE_SYS_SELECT_H 1
#define EVENT__HAVE_SYS_SOCKET_H 1
#define EVENT__HAVE_SYS_STAT_H 1
#define EVENT__HAVE_SYS_SYSCTL_H 1
#define EVENT__HAVE_SYS_TIME_H 1
#define EVENT__HAVE_SYS_TYPES_H 1
#define EVENT__HAVE_SYS_UIO_H 1
#define EVENT__HAVE_SYS_WAIT_H 1
#define EVENT__HAVE_TAILQFOREACH 1
#define EVENT__HAVE_TIMERADD 1
#define EVENT__HAVE_TIMERCLEAR 1
#define EVENT__HAVE_TIMERCMP 1
#define EVENT__HAVE_TIMERISSET 1
#define EVENT__HAVE_UINT16_T 1
#define EVENT__HAVE_UINT32_T 1
#define EVENT__HAVE_UINT64_T 1
#define EVENT__HAVE_UINT8_T 1
#define EVENT__HAVE_UINTPTR_T 1
#define EVENT__HAVE_UMASK 1
#define EVENT__HAVE_UNISTD_H 1
#define EVENT__HAVE_UNSETENV 1
#define EVENT__HAVE_USLEEP 1
#define EVENT__HAVE_VASPRINTF 1
#define EVENT__HAVE_ZLIB_H 1
#define EVENT__LT_OBJDIR ".libs/"
#define EVENT__NUMERIC_VERSION 0x02010500
#define EVENT__PACKAGE "libevent"
#define EVENT__PACKAGE_BUGREPORT ""
#define EVENT__PACKAGE_NAME "libevent"
#define EVENT__PACKAGE_STRING "libevent 2.1.5-beta"
#define EVENT__PACKAGE_TARNAME "libevent"
#define EVENT__PACKAGE_URL ""
#define EVENT__PACKAGE_VERSION "2.1.5-beta"
#define EVENT__SIZEOF_INT 4
#define EVENT__SIZEOF_LONG 8
#define EVENT__SIZEOF_LONG_LONG 8
#define EVENT__SIZEOF_OFF_T 8
#define EVENT__SIZEOF_PTHREAD_T 8
#define EVENT__SIZEOF_SHORT 2
#define EVENT__SIZEOF_SIZE_T 8
#define EVENT__SIZEOF_VOID_P 8
#define EVENT__STDC_HEADERS 1
#define EVENT__TIME_WITH_SYS_TIME 1
#ifndef EVENT___ALL_SOURCE
# define EVENT___ALL_SOURCE 1
#endif
#ifndef EVENT___GNU_SOURCE
# define EVENT___GNU_SOURCE 1
#endif
#ifndef EVENT___POSIX_PTHREAD_SEMANTICS
# define EVENT___POSIX_PTHREAD_SEMANTICS 1
#endif
#ifndef EVENT___TANDEM_SOURCE
# define EVENT___TANDEM_SOURCE 1
#endif
#ifndef EVENT____EXTENSIONS__
# define EVENT____EXTENSIONS__ 1
#endif
#define EVENT__VERSION "2.1.5-beta"
#ifndef EVENT___DARWIN_USE_64_BIT_INODE
# define EVENT___DARWIN_USE_64_BIT_INODE 1
#endif
#endif /* event2/event-config.h */
EVENT_CONFIG_H

cat > evconfig-private.h << EVCONFIG_PRIVATE_H
#ifndef EVCONFIG_PRIVATE_H_INCLUDED_
#define EVCONFIG_PRIVATE_H_INCLUDED_
#ifndef _ALL_SOURCE
# define _ALL_SOURCE 1
#endif
#ifndef _GNU_SOURCE
# define _GNU_SOURCE 1
#endif
#ifndef _POSIX_PTHREAD_SEMANTICS
# define _POSIX_PTHREAD_SEMANTICS 1
#endif
#ifndef _TANDEM_SOURCE
# define _TANDEM_SOURCE 1
#endif
#ifndef __EXTENSIONS__
# define __EXTENSIONS__ 1
#endif
#endif
EVCONFIG_PRIVATE_H
CMD

  s.requires_arc = false
end