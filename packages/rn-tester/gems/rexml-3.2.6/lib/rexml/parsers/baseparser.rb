# frozen_string_literal: false
require_relative '../parseexception'
require_relative '../undefinednamespaceexception'
require_relative '../source'
require 'set'
require "strscan"

module REXML
  module Parsers
    # = Using the Pull Parser
    # <em>This API is experimental, and subject to change.</em>
    #  parser = PullParser.new( "<a>text<b att='val'/>txet</a>" )
    #  while parser.has_next?
    #    res = parser.next
    #    puts res[1]['att'] if res.start_tag? and res[0] == 'b'
    #  end
    # See the PullEvent class for information on the content of the results.
    # The data is identical to the arguments passed for the various events to
    # the StreamListener API.
    #
    # Notice that:
    #  parser = PullParser.new( "<a>BAD DOCUMENT" )
    #  while parser.has_next?
    #    res = parser.next
    #    raise res[1] if res.error?
    #  end
    #
    # Nat Price gave me some good ideas for the API.
    class BaseParser
      LETTER = '[:alpha:]'
      DIGIT = '[:digit:]'

      COMBININGCHAR = '' # TODO
      EXTENDER = ''      # TODO

      NCNAME_STR= "[#{LETTER}_][-[:alnum:]._#{COMBININGCHAR}#{EXTENDER}]*"
      QNAME_STR= "(?:(#{NCNAME_STR}):)?(#{NCNAME_STR})"
      QNAME = /(#{QNAME_STR})/

      # Just for backward compatibility. For example, kramdown uses this.
      # It's not used in REXML.
      UNAME_STR= "(?:#{NCNAME_STR}:)?#{NCNAME_STR}"

      NAMECHAR = '[\-\w\.:]'
      NAME = "([\\w:]#{NAMECHAR}*)"
      NMTOKEN = "(?:#{NAMECHAR})+"
      NMTOKENS = "#{NMTOKEN}(\\s+#{NMTOKEN})*"
      REFERENCE = "&(?:#{NAME};|#\\d+;|#x[0-9a-fA-F]+;)"
      REFERENCE_RE = /#{REFERENCE}/

      DOCTYPE_START = /\A\s*<!DOCTYPE\s/um
      DOCTYPE_END = /\A\s*\]\s*>/um
      ATTRIBUTE_PATTERN = /\s*(#{QNAME_STR})\s*=\s*(["'])(.*?)\4/um
      COMMENT_START = /\A<!--/u
      COMMENT_PATTERN = /<!--(.*?)-->/um
      CDATA_START = /\A<!\[CDATA\[/u
      CDATA_END = /\A\s*\]\s*>/um
      CDATA_PATTERN = /<!\[CDATA\[(.*?)\]\]>/um
      XMLDECL_START = /\A<\?xml\s/u;
      XMLDECL_PATTERN = /<\?xml\s+(.*?)\?>/um
      INSTRUCTION_START = /\A<\?/u
      INSTRUCTION_PATTERN = /<\?#{NAME}(\s+.*?)?\?>/um
      TAG_MATCH = /\A<((?>#{QNAME_STR}))/um
      CLOSE_MATCH = /\A\s*<\/(#{QNAME_STR})\s*>/um

      VERSION = /\bversion\s*=\s*["'](.*?)['"]/um
      ENCODING = /\bencoding\s*=\s*["'](.*?)['"]/um
      STANDALONE = /\bstandalone\s*=\s*["'](.*?)['"]/um

      ENTITY_START = /\A\s*<!ENTITY/
      ELEMENTDECL_START = /\A\s*<!ELEMENT/um
      ELEMENTDECL_PATTERN = /\A\s*(<!ELEMENT.*?)>/um
      SYSTEMENTITY = /\A\s*(%.*?;)\s*$/um
      ENUMERATION = "\\(\\s*#{NMTOKEN}(?:\\s*\\|\\s*#{NMTOKEN})*\\s*\\)"
      NOTATIONTYPE = "NOTATION\\s+\\(\\s*#{NAME}(?:\\s*\\|\\s*#{NAME})*\\s*\\)"
      ENUMERATEDTYPE = "(?:(?:#{NOTATIONTYPE})|(?:#{ENUMERATION}))"
      ATTTYPE = "(CDATA|ID|IDREF|IDREFS|ENTITY|ENTITIES|NMTOKEN|NMTOKENS|#{ENUMERATEDTYPE})"
      ATTVALUE = "(?:\"((?:[^<&\"]|#{REFERENCE})*)\")|(?:'((?:[^<&']|#{REFERENCE})*)')"
      DEFAULTDECL = "(#REQUIRED|#IMPLIED|(?:(#FIXED\\s+)?#{ATTVALUE}))"
      ATTDEF = "\\s+#{NAME}\\s+#{ATTTYPE}\\s+#{DEFAULTDECL}"
      ATTDEF_RE = /#{ATTDEF}/
      ATTLISTDECL_START = /\A\s*<!ATTLIST/um
      ATTLISTDECL_PATTERN = /\A\s*<!ATTLIST\s+#{NAME}(?:#{ATTDEF})*\s*>/um

      TEXT_PATTERN = /\A([^<]*)/um

      # Entity constants
      PUBIDCHAR = "\x20\x0D\x0Aa-zA-Z0-9\\-()+,./:=?;!*@$_%#"
      SYSTEMLITERAL = %Q{((?:"[^"]*")|(?:'[^']*'))}
      PUBIDLITERAL = %Q{("[#{PUBIDCHAR}']*"|'[#{PUBIDCHAR}]*')}
      EXTERNALID = "(?:(?:(SYSTEM)\\s+#{SYSTEMLITERAL})|(?:(PUBLIC)\\s+#{PUBIDLITERAL}\\s+#{SYSTEMLITERAL}))"
      NDATADECL = "\\s+NDATA\\s+#{NAME}"
      PEREFERENCE = "%#{NAME};"
      ENTITYVALUE = %Q{((?:"(?:[^%&"]|#{PEREFERENCE}|#{REFERENCE})*")|(?:'([^%&']|#{PEREFERENCE}|#{REFERENCE})*'))}
      PEDEF = "(?:#{ENTITYVALUE}|#{EXTERNALID})"
      ENTITYDEF = "(?:#{ENTITYVALUE}|(?:#{EXTERNALID}(#{NDATADECL})?))"
      PEDECL = "<!ENTITY\\s+(%)\\s+#{NAME}\\s+#{PEDEF}\\s*>"
      GEDECL = "<!ENTITY\\s+#{NAME}\\s+#{ENTITYDEF}\\s*>"
      ENTITYDECL = /\s*(?:#{GEDECL})|(?:#{PEDECL})/um

      NOTATIONDECL_START = /\A\s*<!NOTATION/um
      EXTERNAL_ID_PUBLIC = /\A\s*PUBLIC\s+#{PUBIDLITERAL}\s+#{SYSTEMLITERAL}\s*/um
      EXTERNAL_ID_SYSTEM = /\A\s*SYSTEM\s+#{SYSTEMLITERAL}\s*/um
      PUBLIC_ID = /\A\s*PUBLIC\s+#{PUBIDLITERAL}\s*/um

      EREFERENCE = /&(?!#{NAME};)/

      DEFAULT_ENTITIES = {
        'gt' => [/&gt;/, '&gt;', '>', />/],
        'lt' => [/&lt;/, '&lt;', '<', /</],
        'quot' => [/&quot;/, '&quot;', '"', /"/],
        "apos" => [/&apos;/, "&apos;", "'", /'/]
      }

      def initialize( source )
        self.stream = source
        @listeners = []
      end

      def add_listener( listener )
        @listeners << listener
      end

      attr_reader :source

      def stream=( source )
        @source = SourceFactory.create_from( source )
        @closed = nil
        @document_status = nil
        @tags = []
        @stack = []
        @entities = []
        @nsstack = []
      end

      def position
        if @source.respond_to? :position
          @source.position
        else
          # FIXME
          0
        end
      end

      # Returns true if there are no more events
      def empty?
        return (@source.empty? and @stack.empty?)
      end

      # Returns true if there are more events.  Synonymous with !empty?
      def has_next?
        return !(@source.empty? and @stack.empty?)
      end

      # Push an event back on the head of the stream.  This method
      # has (theoretically) infinite depth.
      def unshift token
        @stack.unshift(token)
      end

      # Peek at the +depth+ event in the stack.  The first element on the stack
      # is at depth 0.  If +depth+ is -1, will parse to the end of the input
      # stream and return the last event, which is always :end_document.
      # Be aware that this causes the stream to be parsed up to the +depth+
      # event, so you can effectively pre-parse the entire document (pull the
      # entire thing into memory) using this method.
      def peek depth=0
        raise %Q[Illegal argument "#{depth}"] if depth < -1
        temp = []
        if depth == -1
          temp.push(pull()) until empty?
        else
          while @stack.size+temp.size < depth+1
            temp.push(pull())
          end
        end
        @stack += temp if temp.size > 0
        @stack[depth]
      end

      # Returns the next event.  This is a +PullEvent+ object.
      def pull
        pull_event.tap do |event|
          @listeners.each do |listener|
            listener.receive event
          end
        end
      end

      def pull_event
        if @closed
          x, @closed = @closed, nil
          return [ :end_element, x ]
        end
        return [ :end_document ] if empty?
        return @stack.shift if @stack.size > 0
        #STDERR.puts @source.encoding
        #STDERR.puts "BUFFER = #{@source.buffer.inspect}"
        if @document_status == nil
          word = @source.match( /\A((?:\s+)|(?:<[^>]*>))/um )
          word = word[1] unless word.nil?
          #STDERR.puts "WORD = #{word.inspect}"
          case word
          when COMMENT_START
            return [ :comment, @source.match( COMMENT_PATTERN, true )[1] ]
          when XMLDECL_START
            #STDERR.puts "XMLDECL"
            results = @source.match( XMLDECL_PATTERN, true )[1]
            version = VERSION.match( results )
            version = version[1] unless version.nil?
            encoding = ENCODING.match(results)
            encoding = encoding[1] unless encoding.nil?
            if need_source_encoding_update?(encoding)
              @source.encoding = encoding
            end
            if encoding.nil? and /\AUTF-16(?:BE|LE)\z/i =~ @source.encoding
              encoding = "UTF-16"
            end
            standalone = STANDALONE.match(results)
            standalone = standalone[1] unless standalone.nil?
            return [ :xmldecl, version, encoding, standalone ]
          when INSTRUCTION_START
            return process_instruction
          when DOCTYPE_START
            base_error_message = "Malformed DOCTYPE"
            @source.match(DOCTYPE_START, true)
            @nsstack.unshift(curr_ns=Set.new)
            name = parse_name(base_error_message)
            if @source.match(/\A\s*\[/um, true)
              id = [nil, nil, nil]
              @document_status = :in_doctype
            elsif @source.match(/\A\s*>/um, true)
              id = [nil, nil, nil]
              @document_status = :after_doctype
            else
              id = parse_id(base_error_message,
                            accept_external_id: true,
                            accept_public_id: false)
              if id[0] == "SYSTEM"
                # For backward compatibility
                id[1], id[2] = id[2], nil
              end
              if @source.match(/\A\s*\[/um, true)
                @document_status = :in_doctype
              elsif @source.match(/\A\s*>/um, true)
                @document_status = :after_doctype
              else
                message = "#{base_error_message}: garbage after external ID"
                raise REXML::ParseException.new(message, @source)
              end
            end
            args = [:start_doctype, name, *id]
            if @document_status == :after_doctype
              @source.match(/\A\s*/um, true)
              @stack << [ :end_doctype ]
            end
            return args
          when /\A\s+/
          else
            @document_status = :after_doctype
            if @source.encoding == "UTF-8"
              @source.buffer.force_encoding(::Encoding::UTF_8)
            end
          end
        end
        if @document_status == :in_doctype
          md = @source.match(/\A\s*(.*?>)/um)
          case md[1]
          when SYSTEMENTITY
            match = @source.match( SYSTEMENTITY, true )[1]
            return [ :externalentity, match ]

          when ELEMENTDECL_START
            return [ :elementdecl, @source.match( ELEMENTDECL_PATTERN, true )[1] ]

          when ENTITY_START
            match = @source.match( ENTITYDECL, true ).to_a.compact
            match[0] = :entitydecl
            ref = false
            if match[1] == '%'
              ref = true
              match.delete_at 1
            end
            # Now we have to sort out what kind of entity reference this is
            if match[2] == 'SYSTEM'
              # External reference
              match[3] = match[3][1..-2] # PUBID
              match.delete_at(4) if match.size > 4 # Chop out NDATA decl
              # match is [ :entity, name, SYSTEM, pubid(, ndata)? ]
            elsif match[2] == 'PUBLIC'
              # External reference
              match[3] = match[3][1..-2] # PUBID
              match[4] = match[4][1..-2] # HREF
              match.delete_at(5) if match.size > 5 # Chop out NDATA decl
              # match is [ :entity, name, PUBLIC, pubid, href(, ndata)? ]
            else
              match[2] = match[2][1..-2]
              match.pop if match.size == 4
              # match is [ :entity, name, value ]
            end
            match << '%' if ref
            return match
          when ATTLISTDECL_START
            md = @source.match( ATTLISTDECL_PATTERN, true )
            raise REXML::ParseException.new( "Bad ATTLIST declaration!", @source ) if md.nil?
            element = md[1]
            contents = md[0]

            pairs = {}
            values = md[0].scan( ATTDEF_RE )
            values.each do |attdef|
              unless attdef[3] == "#IMPLIED"
                attdef.compact!
                val = attdef[3]
                val = attdef[4] if val == "#FIXED "
                pairs[attdef[0]] = val
                if attdef[0] =~ /^xmlns:(.*)/
                  @nsstack[0] << $1
                end
              end
            end
            return [ :attlistdecl, element, pairs, contents ]
          when NOTATIONDECL_START
            base_error_message = "Malformed notation declaration"
            unless @source.match(/\A\s*<!NOTATION\s+/um, true)
              if @source.match(/\A\s*<!NOTATION\s*>/um)
                message = "#{base_error_message}: name is missing"
              else
                message = "#{base_error_message}: invalid declaration name"
              end
              raise REXML::ParseException.new(message, @source)
            end
            name = parse_name(base_error_message)
            id = parse_id(base_error_message,
                          accept_external_id: true,
                          accept_public_id: true)
            unless @source.match(/\A\s*>/um, true)
              message = "#{base_error_message}: garbage before end >"
              raise REXML::ParseException.new(message, @source)
            end
            return [:notationdecl, name, *id]
          when DOCTYPE_END
            @document_status = :after_doctype
            @source.match( DOCTYPE_END, true )
            return [ :end_doctype ]
          end
        end
        if @document_status == :after_doctype
          @source.match(/\A\s*/um, true)
        end
        begin
          @source.read if @source.buffer.size<2
          if @source.buffer[0] == ?<
            if @source.buffer[1] == ?/
              @nsstack.shift
              last_tag = @tags.pop
              md = @source.match( CLOSE_MATCH, true )
              if md and !last_tag
                message = "Unexpected top-level end tag (got '#{md[1]}')"
                raise REXML::ParseException.new(message, @source)
              end
              if md.nil? or last_tag != md[1]
                message = "Missing end tag for '#{last_tag}'"
                message << " (got '#{md[1]}')" if md
                raise REXML::ParseException.new(message, @source)
              end
              return [ :end_element, last_tag ]
            elsif @source.buffer[1] == ?!
              md = @source.match(/\A(\s*[^>]*>)/um)
              #STDERR.puts "SOURCE BUFFER = #{source.buffer}, #{source.buffer.size}"
              raise REXML::ParseException.new("Malformed node", @source) unless md
              if md[0][2] == ?-
                md = @source.match( COMMENT_PATTERN, true )

                case md[1]
                when /--/, /-\z/
                  raise REXML::ParseException.new("Malformed comment", @source)
                end

                return [ :comment, md[1] ] if md
              else
                md = @source.match( CDATA_PATTERN, true )
                return [ :cdata, md[1] ] if md
              end
              raise REXML::ParseException.new( "Declarations can only occur "+
                "in the doctype declaration.", @source)
            elsif @source.buffer[1] == ??
              return process_instruction
            else
              # Get the next tag
              md = @source.match(TAG_MATCH, true)
              unless md
                raise REXML::ParseException.new("malformed XML: missing tag start", @source)
              end
              @document_status = :in_element
              prefixes = Set.new
              prefixes << md[2] if md[2]
              @nsstack.unshift(curr_ns=Set.new)
              attributes, closed = parse_attributes(prefixes, curr_ns)
              # Verify that all of the prefixes have been defined
              for prefix in prefixes
                unless @nsstack.find{|k| k.member?(prefix)}
                  raise UndefinedNamespaceException.new(prefix,@source,self)
                end
              end

              if closed
                @closed = md[1]
                @nsstack.shift
              else
                @tags.push( md[1] )
              end
              return [ :start_element, md[1], attributes ]
            end
          else
            md = @source.match( TEXT_PATTERN, true )
            if md[0].length == 0
              @source.match( /(\s+)/, true )
            end
            #STDERR.puts "GOT #{md[1].inspect}" unless md[0].length == 0
            #return [ :text, "" ] if md[0].length == 0
            # unnormalized = Text::unnormalize( md[1], self )
            # return PullEvent.new( :text, md[1], unnormalized )
            return [ :text, md[1] ]
          end
        rescue REXML::UndefinedNamespaceException
          raise
        rescue REXML::ParseException
          raise
        rescue => error
          raise REXML::ParseException.new( "Exception parsing",
            @source, self, (error ? error : $!) )
        end
        return [ :dummy ]
      end
      private :pull_event

      def entity( reference, entities )
        value = nil
        value = entities[ reference ] if entities
        if not value
          value = DEFAULT_ENTITIES[ reference ]
          value = value[2] if value
        end
        unnormalize( value, entities ) if value
      end

      # Escapes all possible entities
      def normalize( input, entities=nil, entity_filter=nil )
        copy = input.clone
        # Doing it like this rather than in a loop improves the speed
        copy.gsub!( EREFERENCE, '&amp;' )
        entities.each do |key, value|
          copy.gsub!( value, "&#{key};" ) unless entity_filter and
                                      entity_filter.include?(entity)
        end if entities
        copy.gsub!( EREFERENCE, '&amp;' )
        DEFAULT_ENTITIES.each do |key, value|
          copy.gsub!( value[3], value[1] )
        end
        copy
      end

      # Unescapes all possible entities
      def unnormalize( string, entities=nil, filter=nil )
        rv = string.clone
        rv.gsub!( /\r\n?/, "\n" )
        matches = rv.scan( REFERENCE_RE )
        return rv if matches.size == 0
        rv.gsub!( /&#0*((?:\d+)|(?:x[a-fA-F0-9]+));/ ) {
          m=$1
          m = "0#{m}" if m[0] == ?x
          [Integer(m)].pack('U*')
        }
        matches.collect!{|x|x[0]}.compact!
        if matches.size > 0
          matches.each do |entity_reference|
            unless filter and filter.include?(entity_reference)
              entity_value = entity( entity_reference, entities )
              if entity_value
                re = /&#{entity_reference};/
                rv.gsub!( re, entity_value )
              else
                er = DEFAULT_ENTITIES[entity_reference]
                rv.gsub!( er[0], er[2] ) if er
              end
            end
          end
          rv.gsub!( /&amp;/, '&' )
        end
        rv
      end

      private
      def need_source_encoding_update?(xml_declaration_encoding)
        return false if xml_declaration_encoding.nil?
        return false if /\AUTF-16\z/i =~ xml_declaration_encoding
        true
      end

      def parse_name(base_error_message)
        md = @source.match(/\A\s*#{NAME}/um, true)
        unless md
          if @source.match(/\A\s*\S/um)
            message = "#{base_error_message}: invalid name"
          else
            message = "#{base_error_message}: name is missing"
          end
          raise REXML::ParseException.new(message, @source)
        end
        md[1]
      end

      def parse_id(base_error_message,
                   accept_external_id:,
                   accept_public_id:)
        if accept_external_id and (md = @source.match(EXTERNAL_ID_PUBLIC, true))
          pubid = system = nil
          pubid_literal = md[1]
          pubid = pubid_literal[1..-2] if pubid_literal # Remove quote
          system_literal = md[2]
          system = system_literal[1..-2] if system_literal # Remove quote
          ["PUBLIC", pubid, system]
        elsif accept_public_id and (md = @source.match(PUBLIC_ID, true))
          pubid = system = nil
          pubid_literal = md[1]
          pubid = pubid_literal[1..-2] if pubid_literal # Remove quote
          ["PUBLIC", pubid, nil]
        elsif accept_external_id and (md = @source.match(EXTERNAL_ID_SYSTEM, true))
          system = nil
          system_literal = md[1]
          system = system_literal[1..-2] if system_literal # Remove quote
          ["SYSTEM", nil, system]
        else
          details = parse_id_invalid_details(accept_external_id: accept_external_id,
                                             accept_public_id: accept_public_id)
          message = "#{base_error_message}: #{details}"
          raise REXML::ParseException.new(message, @source)
        end
      end

      def parse_id_invalid_details(accept_external_id:,
                                   accept_public_id:)
        public = /\A\s*PUBLIC/um
        system = /\A\s*SYSTEM/um
        if (accept_external_id or accept_public_id) and @source.match(/#{public}/um)
          if @source.match(/#{public}(?:\s+[^'"]|\s*[\[>])/um)
            return "public ID literal is missing"
          end
          unless @source.match(/#{public}\s+#{PUBIDLITERAL}/um)
            return "invalid public ID literal"
          end
          if accept_public_id
            if @source.match(/#{public}\s+#{PUBIDLITERAL}\s+[^'"]/um)
              return "system ID literal is missing"
            end
            unless @source.match(/#{public}\s+#{PUBIDLITERAL}\s+#{SYSTEMLITERAL}/um)
              return "invalid system literal"
            end
            "garbage after system literal"
          else
            "garbage after public ID literal"
          end
        elsif accept_external_id and @source.match(/#{system}/um)
          if @source.match(/#{system}(?:\s+[^'"]|\s*[\[>])/um)
            return "system literal is missing"
          end
          unless @source.match(/#{system}\s+#{SYSTEMLITERAL}/um)
            return "invalid system literal"
          end
          "garbage after system literal"
        else
          unless @source.match(/\A\s*(?:PUBLIC|SYSTEM)\s/um)
            return "invalid ID type"
          end
          "ID type is missing"
        end
      end

      def process_instruction
        match_data = @source.match(INSTRUCTION_PATTERN, true)
        unless match_data
          message = "Invalid processing instruction node"
          raise REXML::ParseException.new(message, @source)
        end
        [:processing_instruction, match_data[1], match_data[2]]
      end

      def parse_attributes(prefixes, curr_ns)
        attributes = {}
        closed = false
        match_data = @source.match(/^(.*?)(\/)?>/um, true)
        if match_data.nil?
          message = "Start tag isn't ended"
          raise REXML::ParseException.new(message, @source)
        end

        raw_attributes = match_data[1]
        closed = !match_data[2].nil?
        return attributes, closed if raw_attributes.nil?
        return attributes, closed if raw_attributes.empty?

        scanner = StringScanner.new(raw_attributes)
        until scanner.eos?
          if scanner.scan(/\s+/)
            break if scanner.eos?
          end

          pos = scanner.pos
          loop do
            break if scanner.scan(ATTRIBUTE_PATTERN)
            unless scanner.scan(QNAME)
              message = "Invalid attribute name: <#{scanner.rest}>"
              raise REXML::ParseException.new(message, @source)
            end
            name = scanner[0]
            unless scanner.scan(/\s*=\s*/um)
              message = "Missing attribute equal: <#{name}>"
              raise REXML::ParseException.new(message, @source)
            end
            quote = scanner.scan(/['"]/)
            unless quote
              message = "Missing attribute value start quote: <#{name}>"
              raise REXML::ParseException.new(message, @source)
            end
            unless scanner.scan(/.*#{Regexp.escape(quote)}/um)
              match_data = @source.match(/^(.*?)(\/)?>/um, true)
              if match_data
                scanner << "/" if closed
                scanner << ">"
                scanner << match_data[1]
                scanner.pos = pos
                closed = !match_data[2].nil?
                next
              end
              message =
                "Missing attribute value end quote: <#{name}>: <#{quote}>"
              raise REXML::ParseException.new(message, @source)
            end
          end
          name = scanner[1]
          prefix = scanner[2]
          local_part = scanner[3]
          # quote = scanner[4]
          value = scanner[5]
          if prefix == "xmlns"
            if local_part == "xml"
              if value != "http://www.w3.org/XML/1998/namespace"
                msg = "The 'xml' prefix must not be bound to any other namespace "+
                  "(http://www.w3.org/TR/REC-xml-names/#ns-decl)"
                raise REXML::ParseException.new( msg, @source, self )
              end
            elsif local_part == "xmlns"
              msg = "The 'xmlns' prefix must not be declared "+
                "(http://www.w3.org/TR/REC-xml-names/#ns-decl)"
              raise REXML::ParseException.new( msg, @source, self)
            end
            curr_ns << local_part
          elsif prefix
            prefixes << prefix unless prefix == "xml"
          end

          if attributes.has_key?(name)
            msg = "Duplicate attribute #{name.inspect}"
            raise REXML::ParseException.new(msg, @source, self)
          end

          attributes[name] = value
        end
        return attributes, closed
      end
    end
  end
end

=begin
  case event[0]
  when :start_element
  when :text
  when :end_element
  when :processing_instruction
  when :cdata
  when :comment
  when :xmldecl
  when :start_doctype
  when :end_doctype
  when :externalentity
  when :elementdecl
  when :entity
  when :attlistdecl
  when :notationdecl
  when :end_doctype
  end
=end
