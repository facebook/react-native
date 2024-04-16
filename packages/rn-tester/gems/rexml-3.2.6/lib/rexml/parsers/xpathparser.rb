# frozen_string_literal: false

require_relative '../namespace'
require_relative '../xmltokens'

module REXML
  module Parsers
    # You don't want to use this class.  Really.  Use XPath, which is a wrapper
    # for this class.  Believe me.  You don't want to poke around in here.
    # There is strange, dark magic at work in this code.  Beware.  Go back!  Go
    # back while you still can!
    class XPathParser
      include XMLTokens
      LITERAL    = /^'([^']*)'|^"([^"]*)"/u

      def namespaces=( namespaces )
        Functions::namespace_context = namespaces
        @namespaces = namespaces
      end

      def parse path
        path = path.dup
        path.gsub!(/([\(\[])\s+/, '\1') # Strip ignorable spaces
        path.gsub!( /\s+([\]\)])/, '\1')
        parsed = []
        rest = OrExpr(path, parsed)
        if rest
          unless rest.strip.empty?
            raise ParseException.new("Garbage component exists at the end: " +
                                     "<#{rest}>: <#{path}>")
          end
        end
        parsed
      end

      def predicate path
        parsed = []
        Predicate( "[#{path}]", parsed )
        parsed
      end

      def abbreviate(path_or_parsed)
        if path_or_parsed.kind_of?(String)
          parsed = parse(path_or_parsed)
        else
          parsed = path_or_parsed
        end
        components = []
        component = nil
        while parsed.size > 0
          op = parsed.shift
          case op
          when :node
            component << "node()"
          when :attribute
            component = "@"
            components << component
          when :child
            component = ""
            components << component
          when :descendant_or_self
            next_op = parsed[0]
            if next_op == :node
              parsed.shift
              component = ""
              components << component
            else
              component = "descendant-or-self::"
              components << component
            end
          when :self
            next_op = parsed[0]
            if next_op == :node
              parsed.shift
              components << "."
            else
              component = "self::"
              components << component
            end
          when :parent
            next_op = parsed[0]
            if next_op == :node
              parsed.shift
              components << ".."
            else
              component = "parent::"
              components << component
            end
          when :any
            component << "*"
          when :text
            component << "text()"
          when :following, :following_sibling,
                :ancestor, :ancestor_or_self, :descendant,
                :namespace, :preceding, :preceding_sibling
            component = op.to_s.tr("_", "-") << "::"
            components << component
          when :qname
            prefix = parsed.shift
            name = parsed.shift
            component << prefix+":" if prefix.size > 0
            component << name
          when :predicate
            component << '['
            component << predicate_to_path(parsed.shift) {|x| abbreviate(x)}
            component << ']'
          when :document
            components << ""
          when :function
            component << parsed.shift
            component << "( "
            component << predicate_to_path(parsed.shift[0]) {|x| abbreviate(x)}
            component << " )"
          when :literal
            component << quote_literal(parsed.shift)
          else
            component << "UNKNOWN("
            component << op.inspect
            component << ")"
          end
        end
        case components
        when [""]
          "/"
        when ["", ""]
          "//"
        else
          components.join("/")
        end
      end

      def expand(path_or_parsed)
        if path_or_parsed.kind_of?(String)
          parsed = parse(path_or_parsed)
        else
          parsed = path_or_parsed
        end
        path = ""
        document = false
        while parsed.size > 0
          op = parsed.shift
          case op
          when :node
            path << "node()"
          when :attribute, :child, :following, :following_sibling,
                :ancestor, :ancestor_or_self, :descendant, :descendant_or_self,
                :namespace, :preceding, :preceding_sibling, :self, :parent
            path << "/" unless path.size == 0
            path << op.to_s.tr("_", "-")
            path << "::"
          when :any
            path << "*"
          when :qname
            prefix = parsed.shift
            name = parsed.shift
            path << prefix+":" if prefix.size > 0
            path << name
          when :predicate
            path << '['
            path << predicate_to_path( parsed.shift ) { |x| expand(x) }
            path << ']'
          when :document
            document = true
          else
            path << "UNKNOWN("
            path << op.inspect
            path << ")"
          end
        end
        path = "/"+path if document
        path
      end

      def predicate_to_path(parsed, &block)
        path = ""
        case parsed[0]
        when :and, :or, :mult, :plus, :minus, :neq, :eq, :lt, :gt, :lteq, :gteq, :div, :mod, :union
          op = parsed.shift
          case op
          when :eq
            op = "="
          when :lt
            op = "<"
          when :gt
            op = ">"
          when :lteq
            op = "<="
          when :gteq
            op = ">="
          when :neq
            op = "!="
          when :union
            op = "|"
          end
          left = predicate_to_path( parsed.shift, &block )
          right = predicate_to_path( parsed.shift, &block )
          path << left
          path << " "
          path << op.to_s
          path << " "
          path << right
        when :function
          parsed.shift
          name = parsed.shift
          path << name
          path << "("
          parsed.shift.each_with_index do |argument, i|
            path << ", " if i > 0
            path << predicate_to_path(argument, &block)
          end
          path << ")"
        when :literal
          parsed.shift
          path << quote_literal(parsed.shift)
        else
          path << yield( parsed )
        end
        return path.squeeze(" ")
      end
      # For backward compatibility
      alias_method :preciate_to_string, :predicate_to_path

      private
      def quote_literal( literal )
        case literal
        when String
          # XPath 1.0 does not support escape characters.
          # Assumes literal does not contain both single and double quotes.
          if literal.include?("'")
            "\"#{literal}\""
          else
            "'#{literal}'"
          end
        else
          literal.inspect
        end
      end

      #LocationPath
      #  | RelativeLocationPath
      #  | '/' RelativeLocationPath?
      #  | '//' RelativeLocationPath
      def LocationPath path, parsed
        path = path.lstrip
        if path[0] == ?/
          parsed << :document
          if path[1] == ?/
            parsed << :descendant_or_self
            parsed << :node
            path = path[2..-1]
          else
            path = path[1..-1]
          end
        end
        return RelativeLocationPath( path, parsed ) if path.size > 0
      end

      #RelativeLocationPath
      #  |                                                    Step
      #    | (AXIS_NAME '::' | '@' | '')                     AxisSpecifier
      #      NodeTest
      #        Predicate
      #    | '.' | '..'                                      AbbreviatedStep
      #  |  RelativeLocationPath '/' Step
      #  | RelativeLocationPath '//' Step
      AXIS = /^(ancestor|ancestor-or-self|attribute|child|descendant|descendant-or-self|following|following-sibling|namespace|parent|preceding|preceding-sibling|self)::/
      def RelativeLocationPath path, parsed
        loop do
          original_path = path
          path = path.lstrip

          return original_path if path.empty?

          # (axis or @ or <child::>) nodetest predicate  >
          # OR                                          >  / Step
          # (. or ..)                                    >
          if path[0] == ?.
            if path[1] == ?.
              parsed << :parent
              parsed << :node
              path = path[2..-1]
            else
              parsed << :self
              parsed << :node
              path = path[1..-1]
            end
          else
            path_before_axis_specifier = path
            parsed_not_abberviated = []
            if path[0] == ?@
              parsed_not_abberviated << :attribute
              path = path[1..-1]
              # Goto Nodetest
            elsif path =~ AXIS
              parsed_not_abberviated << $1.tr('-','_').intern
              path = $'
              # Goto Nodetest
            else
              parsed_not_abberviated << :child
            end

            path_before_node_test = path
            path = NodeTest(path, parsed_not_abberviated)
            if path == path_before_node_test
              return path_before_axis_specifier
            end
            path = Predicate(path, parsed_not_abberviated)

            parsed.concat(parsed_not_abberviated)
          end

          original_path = path
          path = path.lstrip
          return original_path if path.empty?

          return original_path if path[0] != ?/

          if path[1] == ?/
            parsed << :descendant_or_self
            parsed << :node
            path = path[2..-1]
          else
            path = path[1..-1]
          end
        end
      end

      # Returns a 1-1 map of the nodeset
      # The contents of the resulting array are either:
      #   true/false, if a positive match
      #   String, if a name match
      #NodeTest
      #  | ('*' | NCNAME ':' '*' | QNAME)                NameTest
      #  | '*' ':' NCNAME                                NameTest since XPath 2.0
      #  | NODE_TYPE '(' ')'                             NodeType
      #  | PI '(' LITERAL ')'                            PI
      #    | '[' expr ']'                                Predicate
      PREFIX_WILDCARD = /^\*:(#{NCNAME_STR})/u
      LOCAL_NAME_WILDCARD = /^(#{NCNAME_STR}):\*/u
      QNAME     = Namespace::NAMESPLIT
      NODE_TYPE  = /^(comment|text|node)\(\s*\)/m
      PI        = /^processing-instruction\(/
      def NodeTest path, parsed
        original_path = path
        path = path.lstrip
        case path
        when PREFIX_WILDCARD
          prefix = nil
          name = $1
          path = $'
          parsed << :qname
          parsed << prefix
          parsed << name
        when /^\*/
          path = $'
          parsed << :any
        when NODE_TYPE
          type = $1
          path = $'
          parsed << type.tr('-', '_').intern
        when PI
          path = $'
          literal = nil
          if path =~ /^\s*\)/
            path = $'
          else
            path =~ LITERAL
            literal = $1
            path = $'
            raise ParseException.new("Missing ')' after processing instruction") if path[0] != ?)
            path = path[1..-1]
          end
          parsed << :processing_instruction
          parsed << (literal || '')
        when LOCAL_NAME_WILDCARD
          prefix = $1
          path = $'
          parsed << :namespace
          parsed << prefix
        when QNAME
          prefix = $1
          name = $2
          path = $'
          prefix = "" unless prefix
          parsed << :qname
          parsed << prefix
          parsed << name
        else
          path = original_path
        end
        return path
      end

      # Filters the supplied nodeset on the predicate(s)
      def Predicate path, parsed
        original_path = path
        path = path.lstrip
        return original_path unless path[0] == ?[
        predicates = []
        while path[0] == ?[
          path, expr = get_group(path)
          predicates << expr[1..-2] if expr
        end
        predicates.each{ |pred|
          preds = []
          parsed << :predicate
          parsed << preds
          OrExpr(pred, preds)
        }
        path
      end

      # The following return arrays of true/false, a 1-1 mapping of the
      # supplied nodeset, except for axe(), which returns a filtered
      # nodeset

      #| OrExpr S 'or' S AndExpr
      #| AndExpr
      def OrExpr path, parsed
        n = []
        rest = AndExpr( path, n )
        if rest != path
          while rest =~ /^\s*( or )/
            n = [ :or, n, [] ]
            rest = AndExpr( $', n[-1] )
          end
        end
        if parsed.size == 0 and n.size != 0
          parsed.replace(n)
        elsif n.size > 0
          parsed << n
        end
        rest
      end

      #| AndExpr S 'and' S EqualityExpr
      #| EqualityExpr
      def AndExpr path, parsed
        n = []
        rest = EqualityExpr( path, n )
        if rest != path
          while rest =~ /^\s*( and )/
            n = [ :and, n, [] ]
            rest = EqualityExpr( $', n[-1] )
          end
        end
        if parsed.size == 0 and n.size != 0
          parsed.replace(n)
        elsif n.size > 0
          parsed << n
        end
        rest
      end

      #| EqualityExpr ('=' | '!=')  RelationalExpr
      #| RelationalExpr
      def EqualityExpr path, parsed
        n = []
        rest = RelationalExpr( path, n )
        if rest != path
          while rest =~ /^\s*(!?=)\s*/
            if $1[0] == ?!
              n = [ :neq, n, [] ]
            else
              n = [ :eq, n, [] ]
            end
            rest = RelationalExpr( $', n[-1] )
          end
        end
        if parsed.size == 0 and n.size != 0
          parsed.replace(n)
        elsif n.size > 0
          parsed << n
        end
        rest
      end

      #| RelationalExpr ('<' | '>' | '<=' | '>=') AdditiveExpr
      #| AdditiveExpr
      def RelationalExpr path, parsed
        n = []
        rest = AdditiveExpr( path, n )
        if rest != path
          while rest =~ /^\s*([<>]=?)\s*/
            if $1[0] == ?<
              sym = "lt"
            else
              sym = "gt"
            end
            sym << "eq" if $1[-1] == ?=
            n = [ sym.intern, n, [] ]
            rest = AdditiveExpr( $', n[-1] )
          end
        end
        if parsed.size == 0 and n.size != 0
          parsed.replace(n)
        elsif n.size > 0
          parsed << n
        end
        rest
      end

      #| AdditiveExpr ('+' | '-') MultiplicativeExpr
      #| MultiplicativeExpr
      def AdditiveExpr path, parsed
        n = []
        rest = MultiplicativeExpr( path, n )
        if rest != path
          while rest =~ /^\s*(\+|-)\s*/
            if $1[0] == ?+
              n = [ :plus, n, [] ]
            else
              n = [ :minus, n, [] ]
            end
            rest = MultiplicativeExpr( $', n[-1] )
          end
        end
        if parsed.size == 0 and n.size != 0
          parsed.replace(n)
        elsif n.size > 0
          parsed << n
        end
        rest
      end

      #| MultiplicativeExpr ('*' | S ('div' | 'mod') S) UnaryExpr
      #| UnaryExpr
      def MultiplicativeExpr path, parsed
        n = []
        rest = UnaryExpr( path, n )
        if rest != path
          while rest =~ /^\s*(\*| div | mod )\s*/
            if $1[0] == ?*
              n = [ :mult, n, [] ]
            elsif $1.include?( "div" )
              n = [ :div, n, [] ]
            else
              n = [ :mod, n, [] ]
            end
            rest = UnaryExpr( $', n[-1] )
          end
        end
        if parsed.size == 0 and n.size != 0
          parsed.replace(n)
        elsif n.size > 0
          parsed << n
        end
        rest
      end

      #| '-' UnaryExpr
      #| UnionExpr
      def UnaryExpr path, parsed
        path =~ /^(\-*)/
        path = $'
        if $1 and (($1.size % 2) != 0)
          mult = -1
        else
          mult = 1
        end
        parsed << :neg if mult < 0

        n = []
        path = UnionExpr( path, n )
        parsed.concat( n )
        path
      end

      #| UnionExpr '|' PathExpr
      #| PathExpr
      def UnionExpr path, parsed
        n = []
        rest = PathExpr( path, n )
        if rest != path
          while rest =~ /^\s*(\|)\s*/
            n = [ :union, n, [] ]
            rest = PathExpr( $', n[-1] )
          end
        end
        if parsed.size == 0 and n.size != 0
          parsed.replace( n )
        elsif n.size > 0
          parsed << n
        end
        rest
      end

      #| LocationPath
      #| FilterExpr ('/' | '//') RelativeLocationPath
      def PathExpr path, parsed
        path = path.lstrip
        n = []
        rest = FilterExpr( path, n )
        if rest != path
          if rest and rest[0] == ?/
            rest = RelativeLocationPath(rest, n)
            parsed.concat(n)
            return rest
          end
        end
        rest = LocationPath(rest, n) if rest =~ /\A[\/\.\@\[\w*]/
        parsed.concat(n)
        return rest
      end

      #| FilterExpr Predicate
      #| PrimaryExpr
      def FilterExpr path, parsed
        n = []
        path_before_primary_expr = path
        path = PrimaryExpr(path, n)
        return path_before_primary_expr if path == path_before_primary_expr
        path = Predicate(path, n)
        parsed.concat(n)
        path
      end

      #| VARIABLE_REFERENCE
      #| '(' expr ')'
      #| LITERAL
      #| NUMBER
      #| FunctionCall
      VARIABLE_REFERENCE  = /^\$(#{NAME_STR})/u
      NUMBER              = /^(\d*\.?\d+)/
      NT        = /^comment|text|processing-instruction|node$/
      def PrimaryExpr path, parsed
        case path
        when VARIABLE_REFERENCE
          varname = $1
          path = $'
          parsed << :variable
          parsed << varname
          #arry << @variables[ varname ]
        when /^(\w[-\w]*)(?:\()/
          fname = $1
          tmp = $'
          return path if fname =~ NT
          path = tmp
          parsed << :function
          parsed << fname
          path = FunctionCall(path, parsed)
        when NUMBER
          varname = $1.nil? ? $2 : $1
          path = $'
          parsed << :literal
          parsed << (varname.include?('.') ? varname.to_f : varname.to_i)
        when LITERAL
          varname = $1.nil? ? $2 : $1
          path = $'
          parsed << :literal
          parsed << varname
        when /^\(/                                               #/
          path, contents = get_group(path)
          contents = contents[1..-2]
          n = []
          OrExpr( contents, n )
          parsed.concat(n)
        end
        path
      end

      #| FUNCTION_NAME '(' ( expr ( ',' expr )* )? ')'
      def FunctionCall rest, parsed
        path, arguments = parse_args(rest)
        argset = []
        for argument in arguments
          args = []
          OrExpr( argument, args )
          argset << args
        end
        parsed << argset
        path
      end

      # get_group( '[foo]bar' ) -> ['bar', '[foo]']
      def get_group string
        ind = 0
        depth = 0
        st = string[0,1]
        en = (st == "(" ? ")" : "]")
        begin
          case string[ind,1]
          when st
            depth += 1
          when en
            depth -= 1
          end
          ind += 1
        end while depth > 0 and ind < string.length
        return nil unless depth==0
        [string[ind..-1], string[0..ind-1]]
      end

      def parse_args( string )
        arguments = []
        ind = 0
        inquot = false
        inapos = false
        depth = 1
        begin
          case string[ind]
          when ?"
            inquot = !inquot unless inapos
          when ?'
            inapos = !inapos unless inquot
          else
            unless inquot or inapos
              case string[ind]
              when ?(
                depth += 1
                if depth == 1
                  string = string[1..-1]
                  ind -= 1
                end
              when ?)
                depth -= 1
                if depth == 0
                  s = string[0,ind].strip
                  arguments << s unless s == ""
                  string = string[ind+1..-1]
                end
              when ?,
                if depth == 1
                  s = string[0,ind].strip
                  arguments << s unless s == ""
                  string = string[ind+1..-1]
                  ind = -1
                end
              end
            end
          end
          ind += 1
        end while depth > 0 and ind < string.length
        return nil unless depth==0
        [string,arguments]
      end
    end
  end
end
