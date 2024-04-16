require 'ffi'

module Inotify
  extend FFI::Library
  ffi_lib FFI::Library::LIBC
  class Event < FFI::Struct
    layout \
      :wd, :int,
      :mask, :uint,
      :cookie, :uint,
      :len, :uint
  end
  attach_function :init, :inotify_init, [ ], :int
  attach_function :add_watch, :inotify_add_watch, [ :int, :string, :uint ], :int
  attach_function :rm_watch, :inotify_rm_watch, [ :int, :uint ], :int
  attach_function :read, [ :int, :buffer_out, :uint ], :int
  IN_ACCESS=0x00000001
  IN_MODIFY=0x00000002
  IN_ATTRIB=0x00000004
  IN_CLOSE_WRITE=0x00000008
  IN_CLOSE_NOWRITE=0x00000010
  IN_CLOSE=(IN_CLOSE_WRITE | IN_CLOSE_NOWRITE)
  IN_OPEN=0x00000020
  IN_MOVED_FROM=0x00000040
  IN_MOVED_TO=0x00000080
  IN_MOVE= (IN_MOVED_FROM | IN_MOVED_TO)
  IN_CREATE=0x00000100
  IN_DELETE=0x00000200
  IN_DELETE_SELF=0x00000400
  IN_MOVE_SELF=0x00000800
  # Events sent by the kernel.
  IN_UNMOUNT=0x00002000
  IN_Q_OVERFLOW=0x00004000
  IN_IGNORED=0x00008000
  IN_ONLYDIR=0x01000000
  IN_DONT_FOLLOW=0x02000000
  IN_MASK_ADD=0x20000000
  IN_ISDIR=0x40000000
  IN_ONESHOT=0x80000000
  IN_ALL_EVENTS=(IN_ACCESS | IN_MODIFY | IN_ATTRIB | IN_CLOSE_WRITE \
                          | IN_CLOSE_NOWRITE | IN_OPEN | IN_MOVED_FROM \
                          | IN_MOVED_TO | IN_CREATE | IN_DELETE \
                          | IN_DELETE_SELF | IN_MOVE_SELF)

end
if $0 == __FILE__
  fd = Inotify.init
  puts "fd=#{fd}"
  wd = Inotify.add_watch(fd, "/tmp/", Inotify::IN_ALL_EVENTS)
  fp = FFI::IO.for_fd(fd)
  puts "wfp=#{fp}"
  while true
    buf = FFI::Buffer.alloc_out(Inotify::Event.size + 4096, 1, false)
    ev = Inotify::Event.new buf
    ready = IO.select([ fp ], nil, nil, nil)
    n = Inotify.read(fd, buf, buf.total)
    puts "Read #{n} bytes from inotify fd"
    puts "event.wd=#{ev[:wd]} mask=#{ev[:mask]} len=#{ev[:len]} name=#{ev[:len] > 0 ? buf.get_string(16) : 'unknown'}"
  end
end
