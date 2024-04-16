require 'ffi'
require 'rbconfig'

class Timeval < FFI::Struct
  layout tv_sec: :ulong, tv_usec: :ulong
end
module LibC
  extend FFI::Library
  if FFI::Platform.windows?
    ffi_lib RbConfig::CONFIG["LIBRUBY_SO"]
  else
    ffi_lib FFI::Library::LIBC
  end
  attach_function :gettimeofday, [ :pointer, :pointer ], :int
end
t = Timeval.new
LibC.gettimeofday(t.pointer, nil)
puts "t.tv_sec=#{t[:tv_sec]} t.tv_usec=#{t[:tv_usec]}"
