require 'ffi'

module LibC
  extend FFI::Library
  ffi_lib FFI::Library::LIBC
  callback :qsort_cmp, [ :pointer, :pointer ], :int
  attach_function :qsort, [ :pointer, :ulong, :ulong, :qsort_cmp ], :int
end

p = FFI::MemoryPointer.new(:int, 2)
p.put_array_of_int32(0, [ 2, 1 ])
puts "ptr=#{p.inspect}"
puts "Before qsort #{p.get_array_of_int32(0, 2).join(', ')}"
LibC.qsort(p, 2, 4) do |p1, p2|
  i1 = p1.get_int32(0)
  i2 = p2.get_int32(0)
  puts "In block: comparing #{i1} and #{i2}"
  i1 < i2 ? -1 : i1 > i2 ? 1 : 0
end
puts "After qsort #{p.get_array_of_int32(0, 2).join(', ')}"
