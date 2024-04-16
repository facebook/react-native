require 'ffi'

module Foo
  extend FFI::Library
  ffi_lib FFI::Library::LIBC
  attach_function("cputs", "puts", [ :string ], :int)
  freeze
end
Ractor.new do
  Foo.cputs("Hello, World via libc puts using FFI in a Ractor")
end.take
