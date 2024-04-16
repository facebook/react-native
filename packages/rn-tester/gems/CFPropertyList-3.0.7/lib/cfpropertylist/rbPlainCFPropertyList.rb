# -*- coding: utf-8 -*-

require 'strscan'

module CFPropertyList
  # XML parser
  class PlainParser < XMLParserInterface
    # read a XML file
    # opts::
    # * :file - The filename of the file to load
    # * :data - The data to parse
    def load(opts)
      @doc = nil

      if(opts.has_key?(:file)) then
        File.open(opts[:file], :external_encoding => "ASCII") do |fd|
          @doc = StringScanner.new(fd.read)
        end
      else
        @doc = StringScanner.new(opts[:data])
      end

      if @doc
        root = import_plain
        raise CFFormatError.new('content after root object') unless @doc.eos?

        return root
      end

      raise CFFormatError.new('invalid plist string or file not found')
    end

    SPACES_AND_COMMENTS =  %r{((?:/\*.*?\*/)|(?://.*?$\n?)|(?:\s*))+}x

    # serialize CFPropertyList object to XML
    # opts = {}:: Specify options: :formatted - Use indention and line breaks
    def to_str(opts={})
      opts[:root].to_plain(self)
    end

    protected
    def skip_whitespaces
      @doc.skip SPACES_AND_COMMENTS
    end

    def read_dict
      skip_whitespaces
      hsh = {}

      while not @doc.scan(/\}/)
        key = import_plain
        raise CFFormatError.new("invalid dictionary format") if !key

        if key.is_a?(CFString)
          key = key.value
        elsif key.is_a?(CFInteger) or key.is_a?(CFReal)
          key = key.value.to_s
        else
          raise CFFormatError.new("invalid key format")
        end

        skip_whitespaces

        raise CFFormatError.new("invalid dictionary format") unless @doc.scan(/=/)

        skip_whitespaces
        val = import_plain

        skip_whitespaces
        raise CFFormatError.new("invalid dictionary format") unless @doc.scan(/;/)
        skip_whitespaces

        hsh[key] = val
        raise CFFormatError.new("invalid dictionary format") if @doc.eos?
      end

      CFDictionary.new(hsh)
    end

    def read_array
      skip_whitespaces
      ary = []

      while not @doc.scan(/\)/)
        val = import_plain

        return nil if not val or not val.value
        skip_whitespaces

        if not @doc.skip(/,\s*/)
          if @doc.scan(/\)/)
            ary << val
            return CFArray.new(ary)
          end

          raise CFFormatError.new("invalid array format")
        end

        ary << val
        raise CFFormatError.new("invalid array format") if @doc.eos?
      end

      CFArray.new(ary)
    end

    def escape_char
      case @doc.matched
      when '"'
        '"'
      when '\\'
        '\\'
      when 'a'
        "\a"
      when 'b'
        "\b"
      when 'f'
        "\f"
      when 'n'
        "\n"
      when 'v'
        "\v"
      when 'r'
        "\r"
      when 't'
        "\t"
      when 'U'
        @doc.scan(/.{4}/).hex.chr('utf-8')
      end
    end

    def read_quoted
      str = ''

      while not @doc.scan(/"/)
        if @doc.scan(/\\/)
          @doc.scan(/./)
          str << escape_char

        elsif @doc.eos?
          raise CFFormatError.new("unterminated string")

        else @doc.scan(/./)
          str << @doc.matched
        end
      end

      CFString.new(str)
    end

    def read_unquoted
      raise CFFormatError.new("unexpected end of file") if @doc.eos?

      if @doc.scan(/(\d\d\d\d)-(\d\d)-(\d\d)\s+(\d\d):(\d\d):(\d\d)(?:\s+(\+|-)(\d\d)(\d\d))?/)
        year,month,day,hour,min,sec,pl_min,tz_hour, tz_min = @doc[1], @doc[2], @doc[3], @doc[4], @doc[5], @doc[6], @doc[7], @doc[8], @doc[9]
        CFDate.new(Time.new(year, month, day, hour, min, sec, pl_min ? sprintf("%s%s:%s", pl_min, tz_hour, tz_min) : nil))

      elsif @doc.scan(/-?\d+?\.\d+\b/)
        CFReal.new(@doc.matched.to_f)

      elsif @doc.scan(/-?\d+\b/)
        CFInteger.new(@doc.matched.to_i)

      elsif @doc.scan(/\b(true|false)\b/)
        CFBoolean.new(@doc.matched == 'true')
      else
        CFString.new(@doc.scan(/\w+/))
      end
    end

    def read_binary
      @doc.scan(/(.*?)>/)

      hex_str = @doc[1].gsub(/ /, '')
      CFData.new([hex_str].pack("H*"), CFData::DATA_RAW)
    end

    # import the XML values
    def import_plain
      skip_whitespaces
      ret = nil

      if @doc.scan(/\{/) # dict
        ret = read_dict
      elsif @doc.scan(/\(/) # array
        ret = read_array
      elsif @doc.scan(/"/) # string
        ret = read_quoted
      elsif @doc.scan(/</) # binary
        ret = read_binary
      else # string w/o quotes
        ret = read_unquoted
      end

      return ret
    end
  end
end

# eof
