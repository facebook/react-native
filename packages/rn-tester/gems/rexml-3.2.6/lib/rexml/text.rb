# frozen_string_literal: true
require_relative 'security'
require_relative 'entity'
require_relative 'doctype'
require_relative 'child'
require_relative 'doctype'
require_relative 'parseexception'

module REXML
  # Represents text nodes in an XML document
  class Text < Child
    include Comparable
    # The order in which the substitutions occur
    SPECIALS = [ /&(?!#?[\w-]+;)/u, /</u, />/u, /"/u, /'/u, /\r/u ]
    SUBSTITUTES = ['&amp;', '&lt;', '&gt;', '&quot;', '&apos;', '&#13;']
    # Characters which are substituted in written strings
    SLAICEPS = [ '<', '>', '"', "'", '&' ]
    SETUTITSBUS = [ /&lt;/u, /&gt;/u, /&quot;/u, /&apos;/u, /&amp;/u ]

    # If +raw+ is true, then REXML leaves the value alone
    attr_accessor :raw

    NEEDS_A_SECOND_CHECK = /(<|&((#{Entity::NAME});|(#0*((?:\d+)|(?:x[a-fA-F0-9]+)));)?)/um
    NUMERICENTITY = /&#0*((?:\d+)|(?:x[a-fA-F0-9]+));/
    VALID_CHAR = [
      0x9, 0xA, 0xD,
      (0x20..0xD7FF),
      (0xE000..0xFFFD),
      (0x10000..0x10FFFF)
    ]

    if String.method_defined? :encode
      VALID_XML_CHARS = Regexp.new('^['+
        VALID_CHAR.map { |item|
          case item
          when Integer
            [item].pack('U').force_encoding('utf-8')
          when Range
            [item.first, '-'.ord, item.last].pack('UUU').force_encoding('utf-8')
          end
        }.join +
      ']*$')
    else
      VALID_XML_CHARS = /^(
           [\x09\x0A\x0D\x20-\x7E]            # ASCII
         | [\xC2-\xDF][\x80-\xBF]             # non-overlong 2-byte
         |  \xE0[\xA0-\xBF][\x80-\xBF]        # excluding overlongs
         | [\xE1-\xEC\xEE][\x80-\xBF]{2}      # straight 3-byte
         |  \xEF[\x80-\xBE]{2}                #
         |  \xEF\xBF[\x80-\xBD]               # excluding U+fffe and U+ffff
         |  \xED[\x80-\x9F][\x80-\xBF]        # excluding surrogates
         |  \xF0[\x90-\xBF][\x80-\xBF]{2}     # planes 1-3
         | [\xF1-\xF3][\x80-\xBF]{3}          # planes 4-15
         |  \xF4[\x80-\x8F][\x80-\xBF]{2}     # plane 16
       )*$/nx;
    end

    # Constructor
    # +arg+ if a String, the content is set to the String.  If a Text,
    # the object is shallowly cloned.
    #
    # +respect_whitespace+ (boolean, false) if true, whitespace is
    # respected
    #
    # +parent+ (nil) if this is a Parent object, the parent
    # will be set to this.
    #
    # +raw+ (nil) This argument can be given three values.
    # If true, then the value of used to construct this object is expected to
    # contain no unescaped XML markup, and REXML will not change the text. If
    # this value is false, the string may contain any characters, and REXML will
    # escape any and all defined entities whose values are contained in the
    # text.  If this value is nil (the default), then the raw value of the
    # parent will be used as the raw value for this node.  If there is no raw
    # value for the parent, and no value is supplied, the default is false.
    # Use this field if you have entities defined for some text, and you don't
    # want REXML to escape that text in output.
    #   Text.new( "<&", false, nil, false ) #-> "&lt;&amp;"
    #   Text.new( "&lt;&amp;", false, nil, false ) #-> "&amp;lt;&amp;amp;"
    #   Text.new( "<&", false, nil, true )  #-> Parse exception
    #   Text.new( "&lt;&amp;", false, nil, true )  #-> "&lt;&amp;"
    #   # Assume that the entity "s" is defined to be "sean"
    #   # and that the entity    "r" is defined to be "russell"
    #   Text.new( "sean russell" )          #-> "&s; &r;"
    #   Text.new( "sean russell", false, nil, true ) #-> "sean russell"
    #
    # +entity_filter+ (nil) This can be an array of entities to match in the
    # supplied text.  This argument is only useful if +raw+ is set to false.
    #   Text.new( "sean russell", false, nil, false, ["s"] ) #-> "&s; russell"
    #   Text.new( "sean russell", false, nil, true, ["s"] ) #-> "sean russell"
    # In the last example, the +entity_filter+ argument is ignored.
    #
    # +illegal+ INTERNAL USE ONLY
    def initialize(arg, respect_whitespace=false, parent=nil, raw=nil,
      entity_filter=nil, illegal=NEEDS_A_SECOND_CHECK )

      @raw = false
      @parent = nil
      @entity_filter = nil

      if parent
        super( parent )
        @raw = parent.raw
      end

      if arg.kind_of? String
        @string = arg.dup
      elsif arg.kind_of? Text
        @string = arg.instance_variable_get(:@string).dup
        @raw = arg.raw
        @entity_filter = arg.instance_variable_get(:@entity_filter)
      else
        raise "Illegal argument of type #{arg.type} for Text constructor (#{arg})"
      end

      @string.squeeze!(" \n\t") unless respect_whitespace
      @string.gsub!(/\r\n?/, "\n")
      @raw = raw unless raw.nil?
      @entity_filter = entity_filter if entity_filter
      clear_cache

      Text.check(@string, illegal, doctype) if @raw
    end

    def parent= parent
      super(parent)
      Text.check(@string, NEEDS_A_SECOND_CHECK, doctype) if @raw and @parent
    end

    # check for illegal characters
    def Text.check string, pattern, doctype

      # illegal anywhere
      if !string.match?(VALID_XML_CHARS)
        if String.method_defined? :encode
          string.chars.each do |c|
            case c.ord
            when *VALID_CHAR
            else
              raise "Illegal character #{c.inspect} in raw string #{string.inspect}"
            end
          end
        else
          string.scan(/[\x00-\x7F]|[\x80-\xBF][\xC0-\xF0]*|[\xC0-\xF0]/n) do |c|
            case c.unpack('U')
            when *VALID_CHAR
            else
              raise "Illegal character #{c.inspect} in raw string #{string.inspect}"
            end
          end
        end
      end

      # context sensitive
      string.scan(pattern) do
        if $1[-1] != ?;
          raise "Illegal character #{$1.inspect} in raw string #{string.inspect}"
        elsif $1[0] == ?&
          if $5 and $5[0] == ?#
            case ($5[1] == ?x ? $5[2..-1].to_i(16) : $5[1..-1].to_i)
            when *VALID_CHAR
            else
              raise "Illegal character #{$1.inspect} in raw string #{string.inspect}"
            end
          # FIXME: below can't work but this needs API change.
          # elsif @parent and $3 and !SUBSTITUTES.include?($1)
          #   if !doctype or !doctype.entities.has_key?($3)
          #     raise "Undeclared entity '#{$1}' in raw string \"#{string}\""
          #   end
          end
        end
      end
    end

    def node_type
      :text
    end

    def empty?
      @string.size==0
    end


    def clone
      return Text.new(self, true)
    end


    # Appends text to this text node.  The text is appended in the +raw+ mode
    # of this text node.
    #
    # +returns+ the text itself to enable method chain like
    # 'text << "XXX" << "YYY"'.
    def <<( to_append )
      @string << to_append.gsub( /\r\n?/, "\n" )
      clear_cache
      self
    end


    # +other+ a String or a Text
    # +returns+ the result of (to_s <=> arg.to_s)
    def <=>( other )
      to_s() <=> other.to_s
    end

    def doctype
      if @parent
        doc = @parent.document
        doc.doctype if doc
      end
    end

    REFERENCE = /#{Entity::REFERENCE}/
    # Returns the string value of this text node.  This string is always
    # escaped, meaning that it is a valid XML text node string, and all
    # entities that can be escaped, have been inserted.  This method respects
    # the entity filter set in the constructor.
    #
    #   # Assume that the entity "s" is defined to be "sean", and that the
    #   # entity "r" is defined to be "russell"
    #   t = Text.new( "< & sean russell", false, nil, false, ['s'] )
    #   t.to_s   #-> "&lt; &amp; &s; russell"
    #   t = Text.new( "< & &s; russell", false, nil, false )
    #   t.to_s   #-> "&lt; &amp; &s; russell"
    #   u = Text.new( "sean russell", false, nil, true )
    #   u.to_s   #-> "sean russell"
    def to_s
      return @string if @raw
      @normalized ||= Text::normalize( @string, doctype, @entity_filter )
    end

    def inspect
      @string.inspect
    end

    # Returns the string value of this text.  This is the text without
    # entities, as it might be used programmatically, or printed to the
    # console.  This ignores the 'raw' attribute setting, and any
    # entity_filter.
    #
    #   # Assume that the entity "s" is defined to be "sean", and that the
    #   # entity "r" is defined to be "russell"
    #   t = Text.new( "< & sean russell", false, nil, false, ['s'] )
    #   t.value   #-> "< & sean russell"
    #   t = Text.new( "< & &s; russell", false, nil, false )
    #   t.value   #-> "< & sean russell"
    #   u = Text.new( "sean russell", false, nil, true )
    #   u.value   #-> "sean russell"
    def value
      @unnormalized ||= Text::unnormalize( @string, doctype )
    end

    # Sets the contents of this text node.  This expects the text to be
    # unnormalized.  It returns self.
    #
    #   e = Element.new( "a" )
    #   e.add_text( "foo" )   # <a>foo</a>
    #   e[0].value = "bar"    # <a>bar</a>
    #   e[0].value = "<a>"    # <a>&lt;a&gt;</a>
    def value=( val )
      @string = val.gsub( /\r\n?/, "\n" )
      clear_cache
      @raw = false
    end

    def wrap(string, width, addnewline=false)
      # Recursively wrap string at width.
      return string if string.length <= width
      place = string.rindex(' ', width) # Position in string with last ' ' before cutoff
      if addnewline then
        return "\n" + string[0,place] + "\n" + wrap(string[place+1..-1], width)
      else
        return string[0,place] + "\n" + wrap(string[place+1..-1], width)
      end
    end

    def indent_text(string, level=1, style="\t", indentfirstline=true)
      return string if level < 0
      new_string = ''
      string.each_line { |line|
        indent_string = style * level
        new_line = (indent_string + line).sub(/[\s]+$/,'')
        new_string << new_line
      }
      new_string.strip! unless indentfirstline
      return new_string
    end

    # == DEPRECATED
    # See REXML::Formatters
    #
    def write( writer, indent=-1, transitive=false, ie_hack=false )
      Kernel.warn("#{self.class.name}.write is deprecated.  See REXML::Formatters", uplevel: 1)
      formatter = if indent > -1
          REXML::Formatters::Pretty.new( indent )
        else
          REXML::Formatters::Default.new
        end
      formatter.write( self, writer )
    end

    # FIXME
    # This probably won't work properly
    def xpath
      path = @parent.xpath
      path += "/text()"
      return path
    end

    # Writes out text, substituting special characters beforehand.
    # +out+ A String, IO, or any other object supporting <<( String )
    # +input+ the text to substitute and the write out
    #
    #   z=utf8.unpack("U*")
    #   ascOut=""
    #   z.each{|r|
    #     if r <  0x100
    #       ascOut.concat(r.chr)
    #     else
    #       ascOut.concat(sprintf("&#x%x;", r))
    #     end
    #   }
    #   puts ascOut
    def write_with_substitution out, input
      copy = input.clone
      # Doing it like this rather than in a loop improves the speed
      copy.gsub!( SPECIALS[0], SUBSTITUTES[0] )
      copy.gsub!( SPECIALS[1], SUBSTITUTES[1] )
      copy.gsub!( SPECIALS[2], SUBSTITUTES[2] )
      copy.gsub!( SPECIALS[3], SUBSTITUTES[3] )
      copy.gsub!( SPECIALS[4], SUBSTITUTES[4] )
      copy.gsub!( SPECIALS[5], SUBSTITUTES[5] )
      out << copy
    end

    private
    def clear_cache
      @normalized = nil
      @unnormalized = nil
    end

    # Reads text, substituting entities
    def Text::read_with_substitution( input, illegal=nil )
      copy = input.clone

      if copy =~ illegal
        raise ParseException.new( "malformed text: Illegal character #$& in \"#{copy}\"" )
      end if illegal

      copy.gsub!( /\r\n?/, "\n" )
      if copy.include? ?&
        copy.gsub!( SETUTITSBUS[0], SLAICEPS[0] )
        copy.gsub!( SETUTITSBUS[1], SLAICEPS[1] )
        copy.gsub!( SETUTITSBUS[2], SLAICEPS[2] )
        copy.gsub!( SETUTITSBUS[3], SLAICEPS[3] )
        copy.gsub!( SETUTITSBUS[4], SLAICEPS[4] )
        copy.gsub!( /&#0*((?:\d+)|(?:x[a-f0-9]+));/ ) {
          m=$1
          #m='0' if m==''
          m = "0#{m}" if m[0] == ?x
          [Integer(m)].pack('U*')
        }
      end
      copy
    end

    EREFERENCE = /&(?!#{Entity::NAME};)/
    # Escapes all possible entities
    def Text::normalize( input, doctype=nil, entity_filter=nil )
      copy = input.to_s
      # Doing it like this rather than in a loop improves the speed
      #copy = copy.gsub( EREFERENCE, '&amp;' )
      copy = copy.gsub( "&", "&amp;" ) if copy.include?("&")
      if doctype
        # Replace all ampersands that aren't part of an entity
        doctype.entities.each_value do |entity|
          copy = copy.gsub( entity.value,
            "&#{entity.name};" ) if entity.value and
              not( entity_filter and entity_filter.include?(entity.name) )
        end
      else
        # Replace all ampersands that aren't part of an entity
        DocType::DEFAULT_ENTITIES.each_value do |entity|
          if copy.include?(entity.value)
            copy = copy.gsub(entity.value, "&#{entity.name};" )
          end
        end
      end
      copy
    end

    # Unescapes all possible entities
    def Text::unnormalize( string, doctype=nil, filter=nil, illegal=nil )
      sum = 0
      string.gsub( /\r\n?/, "\n" ).gsub( REFERENCE ) {
        s = Text.expand($&, doctype, filter)
        if sum + s.bytesize > Security.entity_expansion_text_limit
          raise "entity expansion has grown too large"
        else
          sum += s.bytesize
        end
        s
      }
    end

    def Text.expand(ref, doctype, filter)
      if ref[1] == ?#
        if ref[2] == ?x
          [ref[3...-1].to_i(16)].pack('U*')
        else
          [ref[2...-1].to_i].pack('U*')
        end
      elsif ref == '&amp;'
        '&'
      elsif filter and filter.include?( ref[1...-1] )
        ref
      elsif doctype
        doctype.entity( ref[1...-1] ) or ref
      else
        entity_value = DocType::DEFAULT_ENTITIES[ ref[1...-1] ]
        entity_value ? entity_value.value : ref
      end
    end
  end
end
