require 'ffi'

module Foo
  extend FFI::Library
  ffi_lib FFI::Library::LIBC
  attach_function("cputs", "puts", [ :string ], :int)
end
Foo.cputs("Hello, World via libc puts using FFI on MRI ruby")
