# frozen_string_literal: false
module REXML
  # If you add a method, keep in mind two things:
  # (1) the first argument will always be a list of nodes from which to
  # filter.  In the case of context methods (such as position), the function
  # should return an array with a value for each child in the array.
  # (2) all method calls from XML will have "-" replaced with "_".
  # Therefore, in XML, "local-name()" is identical (and actually becomes)
  # "local_name()"
  module Functions
    @@available_functions = {}
    @@context = nil
    @@namespace_context = {}
    @@variables = {}

    INTERNAL_METHODS = [
      :namespace_context,
      :namespace_context=,
      :variables,
      :variables=,
      :context=,
      :get_namespace,
      :send,
    ]
    class << self
      def singleton_method_added(name)
        unless INTERNAL_METHODS.include?(name)
          @@available_functions[name] = true
        end
      end
    end

    def Functions::namespace_context=(x) ; @@namespace_context=x ; end
    def Functions::variables=(x) ; @@variables=x ; end
    def Functions::namespace_context ; @@namespace_context ; end
    def Functions::variables ; @@variables ; end

    def Functions::context=(value); @@context = value; end

    def Functions::text( )
      if @@context[:node].node_type == :element
        return @@context[:node].find_all{|n| n.node_type == :text}.collect{|n| n.value}
      elsif @@context[:node].node_type == :text
        return @@context[:node].value
      else
        return false
      end
    end

    # Returns the last node of the given list of nodes.
    def Functions::last( )
      @@context[:size]
    end

    def Functions::position( )
      @@context[:index]
    end

    # Returns the size of the given list of nodes.
    def Functions::count( node_set )
      node_set.size
    end

    # Since REXML is non-validating, this method is not implemented as it
    # requires a DTD
    def Functions::id( object )
    end

    def Functions::local_name(node_set=nil)
      get_namespace(node_set) do |node|
        return node.local_name
      end
      ""
    end

    def Functions::namespace_uri( node_set=nil )
      get_namespace( node_set ) {|node| node.namespace}
    end

    def Functions::name( node_set=nil )
      get_namespace( node_set ) do |node|
        node.expanded_name
      end
    end

    # Helper method.
    def Functions::get_namespace( node_set = nil )
      if node_set == nil
        yield @@context[:node] if @@context[:node].respond_to?(:namespace)
      else
        if node_set.respond_to? :each
          result = []
          node_set.each do |node|
            result << yield(node) if node.respond_to?(:namespace)
          end
          result
        elsif node_set.respond_to? :namespace
          yield node_set
        end
      end
    end

    # A node-set is converted to a string by returning the string-value of the
    # node in the node-set that is first in document order. If the node-set is
    # empty, an empty string is returned.
    #
    # A number is converted to a string as follows
    #
    # NaN is converted to the string NaN
    #
    # positive zero is converted to the string 0
    #
    # negative zero is converted to the string 0
    #
    # positive infinity is converted to the string Infinity
    #
    # negative infinity is converted to the string -Infinity
    #
    # if the number is an integer, the number is represented in decimal form
    # as a Number with no decimal point and no leading zeros, preceded by a
    # minus sign (-) if the number is negative
    #
    # otherwise, the number is represented in decimal form as a Number
    # including a decimal point with at least one digit before the decimal
    # point and at least one digit after the decimal point, preceded by a
    # minus sign (-) if the number is negative; there must be no leading zeros
    # before the decimal point apart possibly from the one required digit
    # immediately before the decimal point; beyond the one required digit
    # after the decimal point there must be as many, but only as many, more
    # digits as are needed to uniquely distinguish the number from all other
    # IEEE 754 numeric values.
    #
    # The boolean false value is converted to the string false. The boolean
    # true value is converted to the string true.
    #
    # An object of a type other than the four basic types is converted to a
    # string in a way that is dependent on that type.
    def Functions::string( object=@@context[:node] )
      if object.respond_to?(:node_type)
        case object.node_type
        when :attribute
          object.value
        when :element
          string_value(object)
        when :document
          string_value(object.root)
        when :processing_instruction
          object.content
        else
          object.to_s
        end
      else
        case object
        when Array
          string(object[0])
        when Float
          if object.nan?
            "NaN"
          else
            integer = object.to_i
            if object == integer
              "%d" % integer
            else
              object.to_s
            end
          end
        else
          object.to_s
        end
      end
    end

    # A node-set is converted to a string by
    # returning the concatenation of the string-value
    # of each of the children of the node in the
    # node-set that is first in document order.
    # If the node-set is empty, an empty string is returned.
    def Functions::string_value( o )
      rv = ""
      o.children.each { |e|
        if e.node_type == :text
          rv << e.to_s
        elsif e.node_type == :element
          rv << string_value( e )
        end
      }
      rv
    end

    def Functions::concat( *objects )
      concatenated = ""
      objects.each do |object|
        concatenated << string(object)
      end
      concatenated
    end

    # Fixed by Mike Stok
    def Functions::starts_with( string, test )
      string(string).index(string(test)) == 0
    end

    # Fixed by Mike Stok
    def Functions::contains( string, test )
      string(string).include?(string(test))
    end

    # Kouhei fixed this
    def Functions::substring_before( string, test )
      ruby_string = string(string)
      ruby_index = ruby_string.index(string(test))
      if ruby_index.nil?
        ""
      else
        ruby_string[ 0...ruby_index ]
      end
    end

    # Kouhei fixed this too
    def Functions::substring_after( string, test )
      ruby_string = string(string)
      return $1 if ruby_string =~ /#{test}(.*)/
      ""
    end

    # Take equal portions of Mike Stok and Sean Russell; mix
    # vigorously, and pour into a tall, chilled glass.  Serves 10,000.
    def Functions::substring( string, start, length=nil )
      ruby_string = string(string)
      ruby_length = if length.nil?
                      ruby_string.length.to_f
                    else
                      number(length)
                    end
      ruby_start = number(start)

      # Handle the special cases
      return '' if (
        ruby_length.nan? or
        ruby_start.nan? or
        ruby_start.infinite?
      )

      infinite_length = ruby_length.infinite? == 1
      ruby_length = ruby_string.length if infinite_length

      # Now, get the bounds.  The XPath bounds are 1..length; the ruby bounds
      # are 0..length.  Therefore, we have to offset the bounds by one.
      ruby_start = round(ruby_start) - 1
      ruby_length = round(ruby_length)

      if ruby_start < 0
       ruby_length += ruby_start unless infinite_length
       ruby_start = 0
      end
      return '' if ruby_length <= 0
      ruby_string[ruby_start,ruby_length]
    end

    # UNTESTED
    def Functions::string_length( string )
      string(string).length
    end

    # UNTESTED
    def Functions::normalize_space( string=nil )
      string = string(@@context[:node]) if string.nil?
      if string.kind_of? Array
        string.collect{|x| string.to_s.strip.gsub(/\s+/um, ' ') if string}
      else
        string.to_s.strip.gsub(/\s+/um, ' ')
      end
    end

    # This is entirely Mike Stok's beast
    def Functions::translate( string, tr1, tr2 )
      from = string(tr1)
      to = string(tr2)

      # the map is our translation table.
      #
      # if a character occurs more than once in the
      # from string then we ignore the second &
      # subsequent mappings
      #
      # if a character maps to nil then we delete it
      # in the output.  This happens if the from
      # string is longer than the to string
      #
      # there's nothing about - or ^ being special in
      # http://www.w3.org/TR/xpath#function-translate
      # so we don't build ranges or negated classes

      map = Hash.new
      0.upto(from.length - 1) { |pos|
        from_char = from[pos]
        unless map.has_key? from_char
          map[from_char] =
          if pos < to.length
            to[pos]
          else
            nil
          end
        end
      }

      if ''.respond_to? :chars
        string(string).chars.collect { |c|
          if map.has_key? c then map[c] else c end
        }.compact.join
      else
        string(string).unpack('U*').collect { |c|
          if map.has_key? c then map[c] else c end
        }.compact.pack('U*')
      end
    end

    def Functions::boolean(object=@@context[:node])
      case object
      when true, false
        object
      when Float
        return false if object.zero?
        return false if object.nan?
        true
      when Numeric
        not object.zero?
      when String
        not object.empty?
      when Array
        not object.empty?
      else
        object ? true : false
      end
    end

    # UNTESTED
    def Functions::not( object )
      not boolean( object )
    end

    # UNTESTED
    def Functions::true( )
      true
    end

    # UNTESTED
    def Functions::false(  )
      false
    end

    # UNTESTED
    def Functions::lang( language )
      lang = false
      node = @@context[:node]
      attr = nil
      until node.nil?
        if node.node_type == :element
          attr = node.attributes["xml:lang"]
          unless attr.nil?
            lang = compare_language(string(language), attr)
            break
          else
          end
        end
        node = node.parent
      end
      lang
    end

    def Functions::compare_language lang1, lang2
      lang2.downcase.index(lang1.downcase) == 0
    end

    # a string that consists of optional whitespace followed by an optional
    # minus sign followed by a Number followed by whitespace is converted to
    # the IEEE 754 number that is nearest (according to the IEEE 754
    # round-to-nearest rule) to the mathematical value represented by the
    # string; any other string is converted to NaN
    #
    # boolean true is converted to 1; boolean false is converted to 0
    #
    # a node-set is first converted to a string as if by a call to the string
    # function and then converted in the same way as a string argument
    #
    # an object of a type other than the four basic types is converted to a
    # number in a way that is dependent on that type
    def Functions::number(object=@@context[:node])
      case object
      when true
        Float(1)
      when false
        Float(0)
      when Array
        number(string(object))
      when Numeric
        object.to_f
      else
        str = string(object)
        case str.strip
        when /\A\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*\z/
          $1.to_f
        else
          Float::NAN
        end
      end
    end

    def Functions::sum( nodes )
      nodes = [nodes] unless nodes.kind_of? Array
      nodes.inject(0) { |r,n| r + number(string(n)) }
    end

    def Functions::floor( number )
      number(number).floor
    end

    def Functions::ceiling( number )
      number(number).ceil
    end

    def Functions::round( number )
      number = number(number)
      begin
        neg = number.negative?
        number = number.abs.round
        neg ? -number : number
      rescue FloatDomainError
        number
      end
    end

    def Functions::processing_instruction( node )
      node.node_type == :processing_instruction
    end

    def Functions::send(name, *args)
      if @@available_functions[name.to_sym]
        super
      else
        # TODO: Maybe, this is not XPath spec behavior.
        # This behavior must be reconsidered.
        XPath.match(@@context[:node], name.to_s)
      end
    end
  end
end
