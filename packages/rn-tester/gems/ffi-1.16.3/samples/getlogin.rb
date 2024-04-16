require 'ffi'

module Foo
  extend FFI::Library
  ffi_lib FFI::Library::LIBC
  attach_function :getlogin, [ ], :string
end
puts "getlogin=#{Foo.getlogin}"
