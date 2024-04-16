# frozen_string_literal: false
require_relative 'child'
require_relative 'source'
require_relative 'xmltokens'

module REXML
  class Entity < Child
    include XMLTokens
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

    attr_reader :name, :external, :ref, :ndata, :pubid

    # Create a new entity.  Simple entities can be constructed by passing a
    # name, value to the constructor; this creates a generic, plain entity
    # reference. For anything more complicated, you have to pass a Source to
    # the constructor with the entity definition, or use the accessor methods.
    # +WARNING+: There is no validation of entity state except when the entity
    # is read from a stream.  If you start poking around with the accessors,
    # you can easily create a non-conformant Entity.
    #
    #  e = Entity.new( 'amp', '&' )
    def initialize stream, value=nil, parent=nil, reference=false
      super(parent)
      @ndata = @pubid = @value = @external = nil
      if stream.kind_of? Array
        @name = stream[1]
        if stream[-1] == '%'
          @reference = true
          stream.pop
        else
          @reference = false
        end
        if stream[2] =~ /SYSTEM|PUBLIC/
          @external = stream[2]
          if @external == 'SYSTEM'
            @ref = stream[3]
            @ndata = stream[4] if stream.size == 5
          else
            @pubid = stream[3]
            @ref = stream[4]
          end
        else
          @value = stream[2]
        end
      else
        @reference = reference
        @external = nil
        @name = stream
        @value = value
      end
    end

    # Evaluates whether the given string matches an entity definition,
    # returning true if so, and false otherwise.
    def Entity::matches? string
      (ENTITYDECL =~ string) == 0
    end

    # Evaluates to the unnormalized value of this entity; that is, replacing
    # all entities -- both %ent; and &ent; entities.  This differs from
    # +value()+ in that +value+ only replaces %ent; entities.
    def unnormalized
      document.record_entity_expansion unless document.nil?
      v = value()
      return nil if v.nil?
      @unnormalized = Text::unnormalize(v, parent)
      @unnormalized
    end

    #once :unnormalized

    # Returns the value of this entity unprocessed -- raw.  This is the
    # normalized value; that is, with all %ent; and &ent; entities intact
    def normalized
      @value
    end

    # Write out a fully formed, correct entity definition (assuming the Entity
    # object itself is valid.)
    #
    # out::
    #   An object implementing <TT>&lt;&lt;</TT> to which the entity will be
    #   output
    # indent::
    #   *DEPRECATED* and ignored
    def write out, indent=-1
      out << '<!ENTITY '
      out << '% ' if @reference
      out << @name
      out << ' '
      if @external
        out << @external << ' '
        if @pubid
          q = @pubid.include?('"')?"'":'"'
          out << q << @pubid << q << ' '
        end
        q = @ref.include?('"')?"'":'"'
        out << q << @ref << q
        out << ' NDATA ' << @ndata if @ndata
      else
        q = @value.include?('"')?"'":'"'
        out << q << @value << q
      end
      out << '>'
    end

    # Returns this entity as a string.  See write().
    def to_s
      rv = ''
      write rv
      rv
    end

    PEREFERENCE_RE = /#{PEREFERENCE}/um
    # Returns the value of this entity.  At the moment, only internal entities
    # are processed.  If the value contains internal references (IE,
    # %blah;), those are replaced with their values.  IE, if the doctype
    # contains:
    #  <!ENTITY % foo "bar">
    #  <!ENTITY yada "nanoo %foo; nanoo>
    # then:
    #  doctype.entity('yada').value   #-> "nanoo bar nanoo"
    def value
      @resolved_value ||= resolve_value
    end

    def parent=(other)
      @resolved_value = nil
      super
    end

    private
    def resolve_value
      return nil if @value.nil?
      return @value unless @value.match?(PEREFERENCE_RE)

      matches = @value.scan(PEREFERENCE_RE)
      rv = @value.clone
      if @parent
        sum = 0
        matches.each do |entity_reference|
          entity_value = @parent.entity( entity_reference[0] )
          if sum + entity_value.bytesize > Security.entity_expansion_text_limit
            raise "entity expansion has grown too large"
          else
            sum += entity_value.bytesize
          end
          rv.gsub!( /%#{entity_reference.join};/um, entity_value )
        end
      end
      rv
    end
  end

  # This is a set of entity constants -- the ones defined in the XML
  # specification.  These are +gt+, +lt+, +amp+, +quot+ and +apos+.
  # CAUTION: these entities does not have parent and document
  module EntityConst
    # +>+
    GT = Entity.new( 'gt', '>' )
    # +<+
    LT = Entity.new( 'lt', '<' )
    # +&+
    AMP = Entity.new( 'amp', '&' )
    # +"+
    QUOT = Entity.new( 'quot', '"' )
    # +'+
    APOS = Entity.new( 'apos', "'" )
  end
end
