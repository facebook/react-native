# -*- coding: utf-8 -*-

require 'stringio'

module CFPropertyList
  # Binary PList parser class
  class Binary
    # Read a binary plist file
    def load(opts)
      @unique_table = {}
      @count_objects = 0
      @object_refs = 0

      @written_object_count = 0
      @object_table = []
      @object_ref_size = 0

      @offsets = []

      fd = nil
      if(opts.has_key?(:file))
        fd = File.open(opts[:file],"rb")
        file = opts[:file]
      else
        fd = StringIO.new(opts[:data],"rb")
        file = "<string>"
      end

      # first, we read the trailer: 32 byte from the end
      fd.seek(-32,IO::SEEK_END)
      buff = fd.read(32)

      offset_size, object_ref_size, number_of_objects, top_object, table_offset = buff.unpack "x6CCx4Nx4Nx4N"

      # after that, get the offset table
      fd.seek(table_offset, IO::SEEK_SET)
      coded_offset_table = fd.read(number_of_objects * offset_size)
      raise CFFormatError.new("#{file}: Format error!") unless coded_offset_table.bytesize == number_of_objects * offset_size

      @count_objects = number_of_objects

      # decode offset table
      if(offset_size != 3)
        formats = ["","C*","n*","","N*"]
        @offsets = coded_offset_table.unpack(formats[offset_size])
      else
        @offsets = coded_offset_table.unpack("C*").each_slice(3).map {
          |x,y,z| (x << 16) | (y << 8) | z
        }
      end

      @object_ref_size = object_ref_size
      val = read_binary_object_at(file,fd,top_object)

      fd.close
      val
    end


    # Convert CFPropertyList to binary format; since we have to count our objects we simply unique CFDictionary and CFArray
    def to_str(opts={})
      @unique_table = {}
      @count_objects = 0
      @object_refs = 0

      @written_object_count = 0
      @object_table = []

      @offsets = []

      binary_str = "bplist00"

      @object_refs = count_object_refs(opts[:root])

      opts[:root].to_binary(self)

      next_offset = 8
      offsets = @object_table.map do |object|
        offset = next_offset
        next_offset += object.bytesize
        offset
      end
      binary_str << @object_table.join

      table_offset = next_offset
      offset_size = Binary.bytes_needed(table_offset)

      if offset_size < 8
        # Fast path: encode the entire offset array at once.
        binary_str << offsets.pack((%w(C n N N)[offset_size - 1]) + '*')
      else
        # Slow path: host may be little or big endian, must pack each offset
        # separately.
        offsets.each do |offset|
          binary_str << "#{Binary.pack_it_with_size(offset_size,offset)}"
        end
      end

      binary_str << [offset_size, object_ref_size(@object_refs)].pack("x6CC")
      binary_str << [@object_table.size].pack("x4N")
      binary_str << [0].pack("x4N")
      binary_str << [table_offset].pack("x4N")

      binary_str
    end

    def object_ref_size object_refs
      Binary.bytes_needed(object_refs)
    end

    # read a „null” type (i.e. null byte, marker byte, bool value)
    def read_binary_null_type(length)
      case length
      when 0  then 0 # null byte
      when 8  then CFBoolean.new(false)
      when 9  then CFBoolean.new(true)
      when 15 then 15 # fill type
      else
        raise CFFormatError.new("unknown null type: #{length}")
      end
    end
    protected :read_binary_null_type

    # read a binary int value
    def read_binary_int(fname,fd,length)
      if length > 4
        raise CFFormatError.new("Integer greater than 16 bytes: #{length}")
      end

      nbytes = 1 << length

      buff = fd.read(nbytes)

      CFInteger.new(
        case length
        when 0 then buff.unpack("C")[0]
        when 1 then buff.unpack("n")[0]
        when 2 then buff.unpack("N")[0]
        # 8 byte integers are always signed
        when 3 then buff.unpack("q>")[0]
        # 16 byte integers are used to represent unsigned 8 byte integers
        # where the unsigned value is stored in the lower 8 bytes and the
        # upper 8 bytes are unused.
        when 4 then buff.unpack("Q>Q>")[1]
        end
      )
    end
    protected :read_binary_int

    # read a binary real value
    def read_binary_real(fname,fd,length)
      raise CFFormatError.new("Real greater than 8 bytes: #{length}") if length > 3

      nbytes = 1 << length
      buff = fd.read(nbytes)

      CFReal.new(
        case length
        when 0 # 1 byte float? must be an error
          raise CFFormatError.new("got #{length+1} byte float, must be an error!")
        when 1 # 2 byte float? must be an error
          raise CFFormatError.new("got #{length+1} byte float, must be an error!")
        when 2 then
          buff.reverse.unpack("e")[0]
        when 3 then
          buff.reverse.unpack("E")[0]
        else
          fail "unexpected length: #{length}"
        end
      )
    end
    protected :read_binary_real

    # read a binary date value
    def read_binary_date(fname,fd,length)
      raise CFFormatError.new("Date greater than 8 bytes: #{length}") if length > 3

      nbytes = 1 << length
      buff = fd.read(nbytes)

      CFDate.new(
        case length
        when 0 then # 1 byte CFDate is an error
          raise CFFormatError.new("#{length+1} byte CFDate, error")
        when 1 then # 2 byte CFDate is an error
          raise CFFormatError.new("#{length+1} byte CFDate, error")
        when 2 then
          buff.reverse.unpack("e")[0]
        when 3 then
          buff.reverse.unpack("E")[0]
        end,
        CFDate::TIMESTAMP_APPLE
      )
    end
    protected :read_binary_date

    # Read a binary data value
    def read_binary_data(fname,fd,length)
      CFData.new(read_fd(fd, length), CFData::DATA_RAW)
    end
    protected :read_binary_data

    def read_fd fd, length
      length > 0 ? fd.read(length) : ""
    end

    # Read a binary string value
    def read_binary_string(fname,fd,length)
      buff = read_fd fd, length
      @unique_table[buff] = true unless @unique_table.has_key?(buff)
      CFString.new(buff)
    end
    protected :read_binary_string

    # Convert the given string from one charset to another
    def Binary.charset_convert(str,from,to="UTF-8")
      return str.dup.force_encoding(from).encode(to) if str.respond_to?("encode")
      Iconv.conv(to,from,str)
    end

    # Count characters considering character set
    def Binary.charset_strlen(str,charset="UTF-8")
      if str.respond_to?(:encode)
        size = str.length
      else
        utf8_str = Iconv.conv("UTF-8",charset,str)
        size = utf8_str.scan(/./mu).size
      end

      # UTF-16 code units in the range D800-DBFF are the beginning of
      # a surrogate pair, and count as one additional character for
      # length calculation.
      if charset =~ /^UTF-16/
        if str.respond_to?(:encode)
          str.bytes.to_a.each_slice(2) { |pair| size += 1 if (0xd8..0xdb).include?(pair[0]) }
        else
          str.split('').each_slice(2) { |pair| size += 1 if ("\xd8".."\xdb").include?(pair[0]) }
        end
      end

      size
    end

    # Read a unicode string value, coded as UTF-16BE
    def read_binary_unicode_string(fname,fd,length)
      # The problem is: we get the length of the string IN CHARACTERS;
      # since a char in UTF-16 can be 16 or 32 bit long, we don't really know
      # how long the string is in bytes
      buff = fd.read(2*length)

      @unique_table[buff] = true unless @unique_table.has_key?(buff)
      CFString.new(Binary.charset_convert(buff,"UTF-16BE","UTF-8"))
    end
    protected :read_binary_unicode_string

    def unpack_with_size(nbytes, buff)
      format = ["C*", "n*", "N*", "N*"][nbytes - 1];

      if nbytes == 3
        buff = "\0" + buff.scan(/.{1,3}/).join("\0")
      end

      return buff.unpack(format)
    end

    # Read an binary array value, including contained objects
    def read_binary_array(fname,fd,length)
      ary = []

      # first: read object refs
      if(length != 0)
        buff = fd.read(length * @object_ref_size)
        objects = unpack_with_size(@object_ref_size, buff) #buff.unpack(@object_ref_size == 1 ? "C*" : "n*")

        # now: read objects
        0.upto(length-1) do |i|
          object = read_binary_object_at(fname,fd,objects[i])
          ary.push object
        end
      end

      CFArray.new(ary)
    end
    protected :read_binary_array

    # Read a dictionary value, including contained objects
    def read_binary_dict(fname,fd,length)
      dict = {}

      # first: read keys
      if(length != 0) then
        buff = fd.read(length * @object_ref_size)
        keys = unpack_with_size(@object_ref_size, buff)

        # second: read object refs
        buff = fd.read(length * @object_ref_size)
        objects = unpack_with_size(@object_ref_size, buff)

        # read real keys and objects
        0.upto(length-1) do |i|
          key = read_binary_object_at(fname,fd,keys[i])
          object = read_binary_object_at(fname,fd,objects[i])
          dict[key.value] = object
        end
      end

      CFDictionary.new(dict)
    end
    protected :read_binary_dict

    # Read an object type byte, decode it and delegate to the correct
    # reader function
    def read_binary_object(fname,fd)
      # first: read the marker byte
      buff = fd.read(1)

      object_length = buff.unpack("C*")
      object_length = object_length[0] & 0xF

      buff = buff.unpack("H*")
      object_type = buff[0][0].chr

      if(object_type != "0" && object_length == 15) then
        object_length = read_binary_object(fname,fd)
        object_length = object_length.value
      end

      case object_type
      when '0' # null, false, true, fillbyte
        read_binary_null_type(object_length)
      when '1' # integer
        read_binary_int(fname,fd,object_length)
      when '2' # real
        read_binary_real(fname,fd,object_length)
      when '3' # date
        read_binary_date(fname,fd,object_length)
      when '4' # data
        read_binary_data(fname,fd,object_length)
      when '5' # byte string, usually utf8 encoded
        read_binary_string(fname,fd,object_length)
      when '6' # unicode string (utf16be)
        read_binary_unicode_string(fname,fd,object_length)
      when '8'
        CFUid.new(read_binary_int(fname, fd, object_length).value)
      when 'a' # array
        read_binary_array(fname,fd,object_length)
      when 'd' # dictionary
        read_binary_dict(fname,fd,object_length)
      end
    end
    protected :read_binary_object

    # Read an object type byte at position $pos, decode it and delegate to the correct reader function
    def read_binary_object_at(fname,fd,pos)
      position = @offsets[pos]
      fd.seek(position,IO::SEEK_SET)
      read_binary_object(fname,fd)
    end
    protected :read_binary_object_at

    # pack an +int+ of +nbytes+ with size
    def Binary.pack_it_with_size(nbytes,int)
      case nbytes
      when 1 then [int].pack('c')
      when 2 then [int].pack('n')
      when 4 then [int].pack('N')
      when 8
        [int >> 32, int & 0xFFFFFFFF].pack('NN')
      else
        raise CFFormatError.new("Don't know how to pack #{nbytes} byte integer")
      end
    end

    def Binary.pack_int_array_with_size(nbytes, array)
      case nbytes
      when 1 then array.pack('C*')
      when 2 then array.pack('n*')
      when 4 then array.pack('N*')
      when 8
        array.map { |int| [int >> 32, int & 0xFFFFFFFF].pack('NN') }.join
      else
        raise CFFormatError.new("Don't know how to pack #{nbytes} byte integer")
      end
    end

    # calculate how many bytes are needed to save +count+
    def Binary.bytes_needed(count)
      case
      when count < 2**8  then 1
      when count < 2**16 then 2
      when count < 2**32 then 4
      when count < 2**64 then 8
      else
        raise CFFormatError.new("Data size too large: #{count}")
      end
    end

    # Create a type byte for binary format as defined by apple
    def Binary.type_bytes(type, length)
      if length < 15
        [(type << 4) | length].pack('C')
      else
        bytes = [(type << 4) | 0xF]
        if length <= 0xFF
          bytes.push(0x10, length).pack('CCC')                              # 1 byte length
        elsif length <= 0xFFFF
          bytes.push(0x11, length).pack('CCn')                              # 2 byte length
        elsif length <= 0xFFFFFFFF
          bytes.push(0x12, length).pack('CCN')                              # 4 byte length
        elsif length <= 0x7FFFFFFFFFFFFFFF
          bytes.push(0x13, length >> 32, length & 0xFFFFFFFF).pack('CCNN')  # 8 byte length
        else
          raise CFFormatError.new("Integer too large: #{int}")
        end
      end
    end

    def count_object_refs(object)
      case object
      when CFArray
        contained_refs = 0
        object.value.each do |element|
          if CFArray === element || CFDictionary === element
            contained_refs += count_object_refs(element)
          end
        end
        return object.value.size + contained_refs
      when CFDictionary
        contained_refs = 0
        object.value.each_value do |value|
          if CFArray === value || CFDictionary === value
            contained_refs += count_object_refs(value)
          end
        end
        return object.value.keys.size * 2 + contained_refs
      else
        return 0
      end
    end

    def Binary.ascii_string?(str)
      if str.respond_to?(:ascii_only?)
        str.ascii_only?
      else
        str !~ /[\x80-\xFF]/mn
      end
    end

    # Uniques and transforms a string value to binary format and adds it to the object table
    def string_to_binary(val)
      val = val.to_s

      @unique_table[val] ||= begin
        if !Binary.ascii_string?(val)
          val = Binary.charset_convert(val,"UTF-8","UTF-16BE")
          bdata = Binary.type_bytes(0b0110, Binary.charset_strlen(val,"UTF-16BE"))

          val.force_encoding("ASCII-8BIT") if val.respond_to?("encode")
          @object_table[@written_object_count] = bdata << val
        else
          bdata = Binary.type_bytes(0b0101,val.bytesize)
          @object_table[@written_object_count] = bdata << val
        end

        @written_object_count += 1
        @written_object_count - 1
      end
    end

    # Codes an integer to binary format
    def int_to_binary(value)
      # Note: nbytes is actually an exponent.  number of bytes = 2**nbytes.
      nbytes = 0
      nbytes = 1  if value > 0xFF # 1 byte unsigned integer
      nbytes += 1 if value > 0xFFFF # 4 byte unsigned integer
      nbytes += 1 if value > 0xFFFFFFFF # 8 byte unsigned integer
      nbytes += 1 if value > 0x7FFFFFFFFFFFFFFF # 8 byte unsigned integer, stored in lower half of 16 bytes
      nbytes = 3  if value < 0 # signed integers always stored in 8 bytes

      Binary.type_bytes(0b0001, nbytes) <<
        if nbytes < 4
          [value].pack(["C", "n", "N", "q>"][nbytes])
        else # nbytes == 4
          [0,value].pack("Q>Q>")
        end
    end

    # Codes a real value to binary format
    def real_to_binary(val)
      Binary.type_bytes(0b0010,3) << [val].pack("E").reverse
    end

    # Converts a numeric value to binary and adds it to the object table
    def num_to_binary(value)
      @object_table[@written_object_count] =
        if value.is_a?(CFInteger)
          int_to_binary(value.value)
        else
          real_to_binary(value.value)
        end

      @written_object_count += 1
      @written_object_count - 1
    end

    def uid_to_binary(value)
      nbytes = 0
      nbytes = 1  if value > 0xFF # 1 byte integer
      nbytes += 1 if value > 0xFFFF # 4 byte integer
      nbytes += 1 if value > 0xFFFFFFFF # 8 byte integer
      nbytes = 3  if value < 0 # 8 byte integer, since signed

      @object_table[@written_object_count] = Binary.type_bytes(0b1000, nbytes) <<
        if nbytes < 3
          [value].pack(
            if nbytes == 0    then "C"
            elsif nbytes == 1 then "n"
            else "N"
            end
          )
        else
          # 64 bit signed integer; we need the higher and the lower 32 bit of the value
          high_word = value >> 32
          low_word = value & 0xFFFFFFFF
          [high_word,low_word].pack("NN")
        end

      @written_object_count += 1
      @written_object_count - 1
    end

    # Convert date value (apple format) to binary and adds it to the object table
    def date_to_binary(val)
      val = val.getutc.to_f - CFDate::DATE_DIFF_APPLE_UNIX # CFDate is a real, number of seconds since 01/01/2001 00:00:00 GMT

      @object_table[@written_object_count] =
        (Binary.type_bytes(0b0011, 3) << [val].pack("E").reverse)

      @written_object_count += 1
      @written_object_count - 1
    end

    # Convert a bool value to binary and add it to the object table
    def bool_to_binary(val)

      @object_table[@written_object_count] = val ? "\x9" : "\x8" # 0x9 is 1001, type indicator for true; 0x8 is 1000, type indicator for false
      @written_object_count += 1
      @written_object_count - 1
    end

    # Convert data value to binary format and add it to the object table
    def data_to_binary(val)
      @object_table[@written_object_count] =
        (Binary.type_bytes(0b0100, val.bytesize) << val)

      @written_object_count += 1
      @written_object_count - 1
    end

    # Convert array to binary format and add it to the object table
    def array_to_binary(val)
      saved_object_count = @written_object_count
      @written_object_count += 1
      #@object_refs += val.value.size

      values = val.value.map { |v| v.to_binary(self) }
      bdata = Binary.type_bytes(0b1010, val.value.size) <<
        Binary.pack_int_array_with_size(object_ref_size(@object_refs),
                                        values)

      @object_table[saved_object_count] = bdata
      saved_object_count
    end

    # Convert dictionary to binary format and add it to the object table
    def dict_to_binary(val)
      saved_object_count = @written_object_count
      @written_object_count += 1

      #@object_refs += val.value.keys.size * 2

      keys_and_values = val.value.keys.map { |k| CFString.new(k).to_binary(self) }
      keys_and_values.concat(val.value.values.map { |v| v.to_binary(self) })

      bdata = Binary.type_bytes(0b1101,val.value.size) <<
        Binary.pack_int_array_with_size(object_ref_size(@object_refs), keys_and_values)

      @object_table[saved_object_count] = bdata
      return saved_object_count
    end
  end
end

# eof
