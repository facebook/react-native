# frozen_string_literal: false
require_relative 'functions'
require_relative 'xpath_parser'

module REXML
  # Wrapper class.  Use this class to access the XPath functions.
  class XPath
    include Functions
    # A base Hash object, supposing to be used when initializing a
    # default empty namespaces set, but is currently unused.
    # TODO: either set the namespaces=EMPTY_HASH, or deprecate this.
    EMPTY_HASH = {}

    # Finds and returns the first node that matches the supplied xpath.
    # element::
    #   The context element
    # path::
    #   The xpath to search for.  If not supplied or nil, returns the first
    #   node matching '*'.
    # namespaces::
    #   If supplied, a Hash which defines a namespace mapping.
    # variables::
    #   If supplied, a Hash which maps $variables in the query
    #   to values. This can be used to avoid XPath injection attacks
    #   or to automatically handle escaping string values.
    #
    #  XPath.first( node )
    #  XPath.first( doc, "//b"} )
    #  XPath.first( node, "a/x:b", { "x"=>"http://doofus" } )
    #  XPath.first( node, '/book/publisher/text()=$publisher', {}, {"publisher"=>"O'Reilly"})
    def XPath::first(element, path=nil, namespaces=nil, variables={}, options={})
      raise "The namespaces argument, if supplied, must be a hash object." unless namespaces.nil? or namespaces.kind_of?(Hash)
      raise "The variables argument, if supplied, must be a hash object." unless variables.kind_of?(Hash)
      parser = XPathParser.new(**options)
      parser.namespaces = namespaces
      parser.variables = variables
      path = "*" unless path
      element = [element] unless element.kind_of? Array
      parser.parse(path, element).flatten[0]
    end

    # Iterates over nodes that match the given path, calling the supplied
    # block with the match.
    # element::
    #   The context element
    # path::
    #   The xpath to search for.  If not supplied or nil, defaults to '*'
    # namespaces::
    #   If supplied, a Hash which defines a namespace mapping
    # variables::
    #   If supplied, a Hash which maps $variables in the query
    #   to values. This can be used to avoid XPath injection attacks
    #   or to automatically handle escaping string values.
    #
    #  XPath.each( node ) { |el| ... }
    #  XPath.each( node, '/*[@attr='v']' ) { |el| ... }
    #  XPath.each( node, 'ancestor::x' ) { |el| ... }
    #  XPath.each( node, '/book/publisher/text()=$publisher', {}, {"publisher"=>"O'Reilly"}) \
    #    {|el| ... }
    def XPath::each(element, path=nil, namespaces=nil, variables={}, options={}, &block)
      raise "The namespaces argument, if supplied, must be a hash object." unless namespaces.nil? or namespaces.kind_of?(Hash)
      raise "The variables argument, if supplied, must be a hash object." unless variables.kind_of?(Hash)
      parser = XPathParser.new(**options)
      parser.namespaces = namespaces
      parser.variables = variables
      path = "*" unless path
      element = [element] unless element.kind_of? Array
      parser.parse(path, element).each( &block )
    end

    # Returns an array of nodes matching a given XPath.
    def XPath::match(element, path=nil, namespaces=nil, variables={}, options={})
      parser = XPathParser.new(**options)
      parser.namespaces = namespaces
      parser.variables = variables
      path = "*" unless path
      element = [element] unless element.kind_of? Array
      parser.parse(path,element)
    end
  end
end
