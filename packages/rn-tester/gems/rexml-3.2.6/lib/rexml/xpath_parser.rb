# frozen_string_literal: false

require "pp"

require_relative 'namespace'
require_relative 'xmltokens'
require_relative 'attribute'
require_relative 'parsers/xpathparser'

module REXML
  module DClonable
    refine Object do
      # provides a unified +clone+ operation, for REXML::XPathParser
      # to use across multiple Object types
      def dclone
        clone
      end
    end
    refine Symbol do
      # provides a unified +clone+ operation, for REXML::XPathParser
      # to use across multiple Object types
      def dclone ; self ; end
    end
    refine Integer do
      # provides a unified +clone+ operation, for REXML::XPathParser
      # to use across multiple Object types
      def dclone ; self ; end
    end
    refine Float do
      # provides a unified +clone+ operation, for REXML::XPathParser
      # to use across multiple Object types
      def dclone ; self ; end
    end
    refine Array do
      # provides a unified +clone+ operation, for REXML::XPathParser
      # to use across multiple Object+ types
      def dclone
        klone = self.clone
        klone.clear
        self.each{|v| klone << v.dclone}
        klone
      end
    end
  end
end

using REXML::DClonable

module REXML
  # You don't want to use this class.  Really.  Use XPath, which is a wrapper
  # for this class.  Believe me.  You don't want to poke around in here.
  # There is strange, dark magic at work in this code.  Beware.  Go back!  Go
  # back while you still can!
  class XPathParser
    include XMLTokens
    LITERAL    = /^'([^']*)'|^"([^"]*)"/u

    DEBUG = (ENV["REXML_XPATH_PARSER_DEBUG"] == "true")

    def initialize(strict: false)
      @debug = DEBUG
      @parser = REXML::Parsers::XPathParser.new
      @namespaces = nil
      @variables = {}
      @nest = 0
      @strict = strict
    end

    def namespaces=( namespaces={} )
      Functions::namespace_context = namespaces
      @namespaces = namespaces
    end

    def variables=( vars={} )
      Functions::variables = vars
      @variables = vars
    end

    def parse path, nodeset
      path_stack = @parser.parse( path )
      match( path_stack, nodeset )
    end

    def get_first path, nodeset
      path_stack = @parser.parse( path )
      first( path_stack, nodeset )
    end

    def predicate path, nodeset
      path_stack = @parser.parse( path )
      match( path_stack, nodeset )
    end

    def []=( variable_name, value )
      @variables[ variable_name ] = value
    end


    # Performs a depth-first (document order) XPath search, and returns the
    # first match.  This is the fastest, lightest way to return a single result.
    #
    # FIXME: This method is incomplete!
    def first( path_stack, node )
      return nil if path.size == 0

      case path[0]
      when :document
        # do nothing
        return first( path[1..-1], node )
      when :child
        for c in node.children
          r = first( path[1..-1], c )
          return r if r
        end
      when :qname
        name = path[2]
        if node.name == name
          return node if path.size == 3
          return first( path[3..-1], node )
        else
          return nil
        end
      when :descendant_or_self
        r = first( path[1..-1], node )
        return r if r
        for c in node.children
          r = first( path, c )
          return r if r
        end
      when :node
        return first( path[1..-1], node )
      when :any
        return first( path[1..-1], node )
      end
      return nil
    end


    def match(path_stack, nodeset)
      nodeset = nodeset.collect.with_index do |node, i|
        position = i + 1
        XPathNode.new(node, position: position)
      end
      result = expr(path_stack, nodeset)
      case result
      when Array # nodeset
        unnode(result)
      else
        [result]
      end
    end

    private
    def strict?
      @strict
    end

    # Returns a String namespace for a node, given a prefix
    # The rules are:
    #
    #  1. Use the supplied namespace mapping first.
    #  2. If no mapping was supplied, use the context node to look up the namespace
    def get_namespace( node, prefix )
      if @namespaces
        return @namespaces[prefix] || ''
      else
        return node.namespace( prefix ) if node.node_type == :element
        return ''
      end
    end


    # Expr takes a stack of path elements and a set of nodes (either a Parent
    # or an Array and returns an Array of matching nodes
    def expr( path_stack, nodeset, context=nil )
      enter(:expr, path_stack, nodeset) if @debug
      return nodeset if path_stack.length == 0 || nodeset.length == 0
      while path_stack.length > 0
        trace(:while, path_stack, nodeset) if @debug
        if nodeset.length == 0
          path_stack.clear
          return []
        end
        op = path_stack.shift
        case op
        when :document
          first_raw_node = nodeset.first.raw_node
          nodeset = [XPathNode.new(first_raw_node.root_node, position: 1)]
        when :self
          nodeset = step(path_stack) do
            [nodeset]
          end
        when :child
          nodeset = step(path_stack) do
            child(nodeset)
          end
        when :literal
          trace(:literal, path_stack, nodeset) if @debug
          return path_stack.shift
        when :attribute
          nodeset = step(path_stack, any_type: :attribute) do
            nodesets = []
            nodeset.each do |node|
              raw_node = node.raw_node
              next unless raw_node.node_type == :element
              attributes = raw_node.attributes
              next if attributes.empty?
              nodesets << attributes.each_attribute.collect.with_index do |attribute, i|
                XPathNode.new(attribute, position: i + 1)
              end
            end
            nodesets
          end
        when :namespace
          pre_defined_namespaces = {
            "xml" => "http://www.w3.org/XML/1998/namespace",
          }
          nodeset = step(path_stack, any_type: :namespace) do
            nodesets = []
            nodeset.each do |node|
              raw_node = node.raw_node
              case raw_node.node_type
              when :element
                if @namespaces
                  nodesets << pre_defined_namespaces.merge(@namespaces)
                else
                  nodesets << pre_defined_namespaces.merge(raw_node.namespaces)
                end
              when :attribute
                if @namespaces
                  nodesets << pre_defined_namespaces.merge(@namespaces)
                else
                  nodesets << pre_defined_namespaces.merge(raw_node.element.namespaces)
                end
              end
            end
            nodesets
          end
        when :parent
          nodeset = step(path_stack) do
            nodesets = []
            nodeset.each do |node|
              raw_node = node.raw_node
              if raw_node.node_type == :attribute
                parent = raw_node.element
              else
                parent = raw_node.parent
              end
              nodesets << [XPathNode.new(parent, position: 1)] if parent
            end
            nodesets
          end
        when :ancestor
          nodeset = step(path_stack) do
            nodesets = []
            # new_nodes = {}
            nodeset.each do |node|
              raw_node = node.raw_node
              new_nodeset = []
              while raw_node.parent
                raw_node = raw_node.parent
                # next if new_nodes.key?(node)
                new_nodeset << XPathNode.new(raw_node,
                                             position: new_nodeset.size + 1)
                # new_nodes[node] = true
              end
              nodesets << new_nodeset unless new_nodeset.empty?
            end
            nodesets
          end
        when :ancestor_or_self
          nodeset = step(path_stack) do
            nodesets = []
            # new_nodes = {}
            nodeset.each do |node|
              raw_node = node.raw_node
              next unless raw_node.node_type == :element
              new_nodeset = [XPathNode.new(raw_node, position: 1)]
              # new_nodes[node] = true
              while raw_node.parent
                raw_node = raw_node.parent
                # next if new_nodes.key?(node)
                new_nodeset << XPathNode.new(raw_node,
                                             position: new_nodeset.size + 1)
                # new_nodes[node] = true
              end
              nodesets << new_nodeset unless new_nodeset.empty?
            end
            nodesets
          end
        when :descendant_or_self
          nodeset = step(path_stack) do
            descendant(nodeset, true)
          end
        when :descendant
          nodeset = step(path_stack) do
            descendant(nodeset, false)
          end
        when :following_sibling
          nodeset = step(path_stack) do
            nodesets = []
            nodeset.each do |node|
              raw_node = node.raw_node
              next unless raw_node.respond_to?(:parent)
              next if raw_node.parent.nil?
              all_siblings = raw_node.parent.children
              current_index = all_siblings.index(raw_node)
              following_siblings = all_siblings[(current_index + 1)..-1]
              next if following_siblings.empty?
              nodesets << following_siblings.collect.with_index do |sibling, i|
                XPathNode.new(sibling, position: i + 1)
              end
            end
            nodesets
          end
        when :preceding_sibling
          nodeset = step(path_stack, order: :reverse) do
            nodesets = []
            nodeset.each do |node|
              raw_node = node.raw_node
              next unless raw_node.respond_to?(:parent)
              next if raw_node.parent.nil?
              all_siblings = raw_node.parent.children
              current_index = all_siblings.index(raw_node)
              preceding_siblings = all_siblings[0, current_index].reverse
              next if preceding_siblings.empty?
              nodesets << preceding_siblings.collect.with_index do |sibling, i|
                XPathNode.new(sibling, position: i + 1)
              end
            end
            nodesets
          end
        when :preceding
          nodeset = step(path_stack, order: :reverse) do
            unnode(nodeset) do |node|
              preceding(node)
            end
          end
        when :following
          nodeset = step(path_stack) do
            unnode(nodeset) do |node|
              following(node)
            end
          end
        when :variable
          var_name = path_stack.shift
          return [@variables[var_name]]

        when :eq, :neq, :lt, :lteq, :gt, :gteq
          left = expr( path_stack.shift, nodeset.dup, context )
          right = expr( path_stack.shift, nodeset.dup, context )
          res = equality_relational_compare( left, op, right )
          trace(op, left, right, res) if @debug
          return res

        when :or
          left = expr(path_stack.shift, nodeset.dup, context)
          return true if Functions.boolean(left)
          right = expr(path_stack.shift, nodeset.dup, context)
          return Functions.boolean(right)

        when :and
          left = expr(path_stack.shift, nodeset.dup, context)
          return false unless Functions.boolean(left)
          right = expr(path_stack.shift, nodeset.dup, context)
          return Functions.boolean(right)

        when :div, :mod, :mult, :plus, :minus
          left = expr(path_stack.shift, nodeset, context)
          right = expr(path_stack.shift, nodeset, context)
          left = unnode(left) if left.is_a?(Array)
          right = unnode(right) if right.is_a?(Array)
          left = Functions::number(left)
          right = Functions::number(right)
          case op
          when :div
            return left / right
          when :mod
            return left % right
          when :mult
            return left * right
          when :plus
            return left + right
          when :minus
            return left - right
          else
            raise "[BUG] Unexpected operator: <#{op.inspect}>"
          end
        when :union
          left = expr( path_stack.shift, nodeset, context )
          right = expr( path_stack.shift, nodeset, context )
          left = unnode(left) if left.is_a?(Array)
          right = unnode(right) if right.is_a?(Array)
          return (left | right)
        when :neg
          res = expr( path_stack, nodeset, context )
          res = unnode(res) if res.is_a?(Array)
          return -Functions.number(res)
        when :not
        when :function
          func_name = path_stack.shift.tr('-','_')
          arguments = path_stack.shift

          if nodeset.size != 1
            message = "[BUG] Node set size must be 1 for function call: "
            message += "<#{func_name}>: <#{nodeset.inspect}>: "
            message += "<#{arguments.inspect}>"
            raise message
          end

          node = nodeset.first
          if context
            target_context = context
          else
            target_context = {:size => nodeset.size}
            if node.is_a?(XPathNode)
              target_context[:node]  = node.raw_node
              target_context[:index] = node.position
            else
              target_context[:node]  = node
              target_context[:index] = 1
            end
          end
          args = arguments.dclone.collect do |arg|
            result = expr(arg, nodeset, target_context)
            result = unnode(result) if result.is_a?(Array)
            result
          end
          Functions.context = target_context
          return Functions.send(func_name, *args)

        else
          raise "[BUG] Unexpected path: <#{op.inspect}>: <#{path_stack.inspect}>"
        end
      end # while
      return nodeset
    ensure
      leave(:expr, path_stack, nodeset) if @debug
    end

    def step(path_stack, any_type: :element, order: :forward)
      nodesets = yield
      begin
        enter(:step, path_stack, nodesets) if @debug
        nodesets = node_test(path_stack, nodesets, any_type: any_type)
        while path_stack[0] == :predicate
          path_stack.shift # :predicate
          predicate_expression = path_stack.shift.dclone
          nodesets = evaluate_predicate(predicate_expression, nodesets)
        end
        if nodesets.size == 1
          ordered_nodeset = nodesets[0]
        else
          raw_nodes = []
          nodesets.each do |nodeset|
            nodeset.each do |node|
              if node.respond_to?(:raw_node)
                raw_nodes << node.raw_node
              else
                raw_nodes << node
              end
            end
          end
          ordered_nodeset = sort(raw_nodes, order)
        end
        new_nodeset = []
        ordered_nodeset.each do |node|
          # TODO: Remove duplicated
          new_nodeset << XPathNode.new(node, position: new_nodeset.size + 1)
        end
        new_nodeset
      ensure
        leave(:step, path_stack, new_nodeset) if @debug
      end
    end

    def node_test(path_stack, nodesets, any_type: :element)
      enter(:node_test, path_stack, nodesets) if @debug
      operator = path_stack.shift
      case operator
      when :qname
        prefix = path_stack.shift
        name = path_stack.shift
        new_nodesets = nodesets.collect do |nodeset|
          filter_nodeset(nodeset) do |node|
            raw_node = node.raw_node
            case raw_node.node_type
            when :element
              if prefix.nil?
                raw_node.name == name
              elsif prefix.empty?
                if strict?
                  raw_node.name == name and raw_node.namespace == ""
                else
                  # FIXME: This DOUBLES the time XPath searches take
                  ns = get_namespace(raw_node, prefix)
                  raw_node.name == name and raw_node.namespace == ns
                end
              else
                # FIXME: This DOUBLES the time XPath searches take
                ns = get_namespace(raw_node, prefix)
                raw_node.name == name and raw_node.namespace == ns
              end
            when :attribute
              if prefix.nil?
                raw_node.name == name
              elsif prefix.empty?
                raw_node.name == name and raw_node.namespace == ""
              else
                # FIXME: This DOUBLES the time XPath searches take
                ns = get_namespace(raw_node.element, prefix)
                raw_node.name == name and raw_node.namespace == ns
              end
            else
              false
            end
          end
        end
      when :namespace
        prefix = path_stack.shift
        new_nodesets = nodesets.collect do |nodeset|
          filter_nodeset(nodeset) do |node|
            raw_node = node.raw_node
            case raw_node.node_type
            when :element
              namespaces = @namespaces || raw_node.namespaces
              raw_node.namespace == namespaces[prefix]
            when :attribute
              namespaces = @namespaces || raw_node.element.namespaces
              raw_node.namespace == namespaces[prefix]
            else
              false
            end
          end
        end
      when :any
        new_nodesets = nodesets.collect do |nodeset|
          filter_nodeset(nodeset) do |node|
            raw_node = node.raw_node
            raw_node.node_type == any_type
          end
        end
      when :comment
        new_nodesets = nodesets.collect do |nodeset|
          filter_nodeset(nodeset) do |node|
            raw_node = node.raw_node
            raw_node.node_type == :comment
          end
        end
      when :text
        new_nodesets = nodesets.collect do |nodeset|
          filter_nodeset(nodeset) do |node|
            raw_node = node.raw_node
            raw_node.node_type == :text
          end
        end
      when :processing_instruction
        target = path_stack.shift
        new_nodesets = nodesets.collect do |nodeset|
          filter_nodeset(nodeset) do |node|
            raw_node = node.raw_node
            (raw_node.node_type == :processing_instruction) and
              (target.empty? or (raw_node.target == target))
          end
        end
      when :node
        new_nodesets = nodesets.collect do |nodeset|
          filter_nodeset(nodeset) do |node|
            true
          end
        end
      else
        message = "[BUG] Unexpected node test: " +
          "<#{operator.inspect}>: <#{path_stack.inspect}>"
        raise message
      end
      new_nodesets
    ensure
      leave(:node_test, path_stack, new_nodesets) if @debug
    end

    def filter_nodeset(nodeset)
      new_nodeset = []
      nodeset.each do |node|
        next unless yield(node)
        new_nodeset << XPathNode.new(node, position: new_nodeset.size + 1)
      end
      new_nodeset
    end

    def evaluate_predicate(expression, nodesets)
      enter(:predicate, expression, nodesets) if @debug
      new_nodesets = nodesets.collect do |nodeset|
        new_nodeset = []
        subcontext = { :size => nodeset.size }
        nodeset.each_with_index do |node, index|
          if node.is_a?(XPathNode)
            subcontext[:node] = node.raw_node
            subcontext[:index] = node.position
          else
            subcontext[:node] = node
            subcontext[:index] = index + 1
          end
          result = expr(expression.dclone, [node], subcontext)
          trace(:predicate_evaluate, expression, node, subcontext, result) if @debug
          result = result[0] if result.kind_of? Array and result.length == 1
          if result.kind_of? Numeric
            if result == node.position
              new_nodeset << XPathNode.new(node, position: new_nodeset.size + 1)
            end
          elsif result.instance_of? Array
            if result.size > 0 and result.inject(false) {|k,s| s or k}
              if result.size > 0
                new_nodeset << XPathNode.new(node, position: new_nodeset.size + 1)
              end
            end
          else
            if result
              new_nodeset << XPathNode.new(node, position: new_nodeset.size + 1)
            end
          end
        end
        new_nodeset
      end
      new_nodesets
    ensure
      leave(:predicate, new_nodesets) if @debug
    end

    def trace(*args)
      indent = "  " * @nest
      PP.pp(args, "").each_line do |line|
        puts("#{indent}#{line}")
      end
    end

    def enter(tag, *args)
      trace(:enter, tag, *args)
      @nest += 1
    end

    def leave(tag, *args)
      @nest -= 1
      trace(:leave, tag, *args)
    end

    # Reorders an array of nodes so that they are in document order
    # It tries to do this efficiently.
    #
    # FIXME: I need to get rid of this, but the issue is that most of the XPath
    # interpreter functions as a filter, which means that we lose context going
    # in and out of function calls.  If I knew what the index of the nodes was,
    # I wouldn't have to do this.  Maybe add a document IDX for each node?
    # Problems with mutable documents.  Or, rewrite everything.
    def sort(array_of_nodes, order)
      new_arry = []
      array_of_nodes.each { |node|
        node_idx = []
        np = node.node_type == :attribute ? node.element : node
        while np.parent and np.parent.node_type == :element
          node_idx << np.parent.index( np )
          np = np.parent
        end
        new_arry << [ node_idx.reverse, node ]
      }
      ordered = new_arry.sort_by do |index, node|
        if order == :forward
          index
        else
          -index
        end
      end
      ordered.collect do |_index, node|
        node
      end
    end

    def descendant(nodeset, include_self)
      nodesets = []
      nodeset.each do |node|
        new_nodeset = []
        new_nodes = {}
        descendant_recursive(node.raw_node, new_nodeset, new_nodes, include_self)
        nodesets << new_nodeset unless new_nodeset.empty?
      end
      nodesets
    end

    def descendant_recursive(raw_node, new_nodeset, new_nodes, include_self)
      if include_self
        return if new_nodes.key?(raw_node)
        new_nodeset << XPathNode.new(raw_node, position: new_nodeset.size + 1)
        new_nodes[raw_node] = true
      end

      node_type = raw_node.node_type
      if node_type == :element or node_type == :document
        raw_node.children.each do |child|
          descendant_recursive(child, new_nodeset, new_nodes, true)
        end
      end
    end

    # Builds a nodeset of all of the preceding nodes of the supplied node,
    # in reverse document order
    # preceding:: includes every element in the document that precedes this node,
    # except for ancestors
    def preceding(node)
      ancestors = []
      parent = node.parent
      while parent
        ancestors << parent
        parent = parent.parent
      end

      precedings = []
      preceding_node = preceding_node_of(node)
      while preceding_node
        if ancestors.include?(preceding_node)
          ancestors.delete(preceding_node)
        else
          precedings << XPathNode.new(preceding_node,
                                      position: precedings.size + 1)
        end
        preceding_node = preceding_node_of(preceding_node)
      end
      precedings
    end

    def preceding_node_of( node )
      psn = node.previous_sibling_node
      if psn.nil?
        if node.parent.nil? or node.parent.class == Document
          return nil
        end
        return node.parent
        #psn = preceding_node_of( node.parent )
      end
      while psn and psn.kind_of? Element and psn.children.size > 0
        psn = psn.children[-1]
      end
      psn
    end

    def following(node)
      followings = []
      following_node = next_sibling_node(node)
      while following_node
        followings << XPathNode.new(following_node,
                                    position: followings.size + 1)
        following_node = following_node_of(following_node)
      end
      followings
    end

    def following_node_of( node )
      if node.kind_of? Element and node.children.size > 0
        return node.children[0]
      end
      return next_sibling_node(node)
    end

    def next_sibling_node(node)
      psn = node.next_sibling_node
      while psn.nil?
        if node.parent.nil? or node.parent.class == Document
          return nil
        end
        node = node.parent
        psn = node.next_sibling_node
      end
      return psn
    end

    def child(nodeset)
      nodesets = []
      nodeset.each do |node|
        raw_node = node.raw_node
        node_type = raw_node.node_type
        # trace(:child, node_type, node)
        case node_type
        when :element
          nodesets << raw_node.children.collect.with_index do |child_node, i|
            XPathNode.new(child_node, position: i + 1)
          end
        when :document
          new_nodeset = []
          raw_node.children.each do |child|
            case child
            when XMLDecl, Text
              # Ignore
            else
              new_nodeset << XPathNode.new(child, position: new_nodeset.size + 1)
            end
          end
          nodesets << new_nodeset unless new_nodeset.empty?
        end
      end
      nodesets
    end

    def norm b
      case b
      when true, false
        return b
      when 'true', 'false'
        return Functions::boolean( b )
      when /^\d+(\.\d+)?$/, Numeric
        return Functions::number( b )
      else
        return Functions::string( b )
      end
    end

    def equality_relational_compare(set1, op, set2)
      set1 = unnode(set1) if set1.is_a?(Array)
      set2 = unnode(set2) if set2.is_a?(Array)

      if set1.kind_of? Array and set2.kind_of? Array
        # If both objects to be compared are node-sets, then the
        # comparison will be true if and only if there is a node in the
        # first node-set and a node in the second node-set such that the
        # result of performing the comparison on the string-values of
        # the two nodes is true.
        set1.product(set2).any? do |node1, node2|
          node_string1 = Functions.string(node1)
          node_string2 = Functions.string(node2)
          compare(node_string1, op, node_string2)
        end
      elsif set1.kind_of? Array or set2.kind_of? Array
        # If one is nodeset and other is number, compare number to each item
        # in nodeset s.t. number op number(string(item))
        # If one is nodeset and other is string, compare string to each item
        # in nodeset s.t. string op string(item)
        # If one is nodeset and other is boolean, compare boolean to each item
        # in nodeset s.t. boolean op boolean(item)
        if set1.kind_of? Array
          a = set1
          b = set2
        else
          a = set2
          b = set1
        end

        case b
        when true, false
          each_unnode(a).any? do |unnoded|
            compare(Functions.boolean(unnoded), op, b)
          end
        when Numeric
          each_unnode(a).any? do |unnoded|
            compare(Functions.number(unnoded), op, b)
          end
        when /\A\d+(\.\d+)?\z/
          b = Functions.number(b)
          each_unnode(a).any? do |unnoded|
            compare(Functions.number(unnoded), op, b)
          end
        else
          b = Functions::string(b)
          each_unnode(a).any? do |unnoded|
            compare(Functions::string(unnoded), op, b)
          end
        end
      else
        # If neither is nodeset,
        #   If op is = or !=
        #     If either boolean, convert to boolean
        #     If either number, convert to number
        #     Else, convert to string
        #   Else
        #     Convert both to numbers and compare
        compare(set1, op, set2)
      end
    end

    def value_type(value)
      case value
      when true, false
        :boolean
      when Numeric
        :number
      when String
        :string
      else
        raise "[BUG] Unexpected value type: <#{value.inspect}>"
      end
    end

    def normalize_compare_values(a, operator, b)
      a_type = value_type(a)
      b_type = value_type(b)
      case operator
      when :eq, :neq
        if a_type == :boolean or b_type == :boolean
          a = Functions.boolean(a) unless a_type == :boolean
          b = Functions.boolean(b) unless b_type == :boolean
        elsif a_type == :number or b_type == :number
          a = Functions.number(a) unless a_type == :number
          b = Functions.number(b) unless b_type == :number
        else
          a = Functions.string(a) unless a_type == :string
          b = Functions.string(b) unless b_type == :string
        end
      when :lt, :lteq, :gt, :gteq
        a = Functions.number(a) unless a_type == :number
        b = Functions.number(b) unless b_type == :number
      else
        message = "[BUG] Unexpected compare operator: " +
          "<#{operator.inspect}>: <#{a.inspect}>: <#{b.inspect}>"
        raise message
      end
      [a, b]
    end

    def compare(a, operator, b)
      a, b = normalize_compare_values(a, operator, b)
      case operator
      when :eq
        a == b
      when :neq
        a != b
      when :lt
        a < b
      when :lteq
        a <= b
      when :gt
        a > b
      when :gteq
        a >= b
      else
        message = "[BUG] Unexpected compare operator: " +
          "<#{operator.inspect}>: <#{a.inspect}>: <#{b.inspect}>"
        raise message
      end
    end

    def each_unnode(nodeset)
      return to_enum(__method__, nodeset) unless block_given?
      nodeset.each do |node|
        if node.is_a?(XPathNode)
          unnoded = node.raw_node
        else
          unnoded = node
        end
        yield(unnoded)
      end
    end

    def unnode(nodeset)
      each_unnode(nodeset).collect do |unnoded|
        unnoded = yield(unnoded) if block_given?
        unnoded
      end
    end
  end

  # @private
  class XPathNode
    attr_reader :raw_node, :context
    def initialize(node, context=nil)
      if node.is_a?(XPathNode)
        @raw_node = node.raw_node
      else
        @raw_node = node
      end
      @context = context || {}
    end

    def position
      @context[:position]
    end
  end
end
