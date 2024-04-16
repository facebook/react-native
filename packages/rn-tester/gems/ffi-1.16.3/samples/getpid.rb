require 'ffi'

module Foo
  extend FFI::Library
  ffi_lib FFI::Library::LIBC
  attach_function :getpid, [ ], :int
end
puts "My pid=#{Foo.getpid}"
