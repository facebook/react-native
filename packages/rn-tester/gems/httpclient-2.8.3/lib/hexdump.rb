# encoding: binary

# This was written by Arai-san and published at
# http://blade.nagaokaut.ac.jp/cgi-bin/scat.rb/ruby/ruby-list/31987


module HexDump
  # str must be in BINARY encoding in 1.9
  def encode(str)
    offset = 0
    result = []
    while raw = str.slice(offset, 16) and raw.length > 0
      # data field
      data = ''
      for v in raw.unpack('N* a*')
	if v.kind_of? Integer
	  data << sprintf("%08x ", v)
	else
	  v.each_byte {|c| data << sprintf("%02x", c) }
	end
      end
      # text field
      text = raw.tr("\000-\037\177-\377", ".")
      result << sprintf("%08x  %-36s  %s", offset, data, text)
      offset += 16
      # omit duplicate line
      if /^(#{regex_quote_n(raw)})+/n =~ str[offset .. -1]
	result << sprintf("%08x  ...", offset)
	offset += $&.length
	# should print at the end
	if offset == str.length
	  result << sprintf("%08x  %-36s  %s", offset-16, data, text)
	end
      end
    end
    result
  end
  module_function :encode

  if RUBY_VERSION >= "1.9"
    # raw must be in BINARY encoding in 1.9
    def self.regex_quote_n(raw)
      Regexp.quote(raw)
    end
  else
    def self.regex_quote_n(raw)
      Regexp.quote(raw, 'n')
    end
  end
end
