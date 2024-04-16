require 'ffi'

module LibC
  extend FFI::Library
  ffi_lib FFI::Library::LIBC
  callback :qsort_cmp, [ :pointer, :pointer ], :int
  attach_function :qsort, [ :pointer, :ulong, :ulong, :qsort_cmp ], :int

  freeze # Freeze the module variables, so that it can be shared across ractors.
end

p = FFI::MemoryPointer.new(:int, 3)
p.put_array_of_int32(0, [ 2, 3, 1 ])   # Write some unsorted data into the memory
# Ractor.make_shareable(p)             # freeze the pointer to be shared between ractors instead of copied
puts "main  -ptr=#{p.inspect}"
res = Ractor.new(p) do |p|
  puts "ractor-ptr=#{p.inspect}"
  puts "Before qsort #{p.get_array_of_int32(0, 3).join(', ')}"
  LibC.qsort(p, 3, 4) do |p1, p2|
    i1 = p1.get_int32(0)
    i2 = p2.get_int32(0)
    puts "In block: comparing #{i1} and #{i2}"
    i1 < i2 ? -1 : i1 > i2 ? 1 : 0
  end
  puts "After qsort #{p.get_array_of_int32(0, 3).join(', ')}"
end.take

puts "After ractor termination #{p.get_array_of_int32(0, 3).join(', ')}"
