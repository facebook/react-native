module Pod
  class Specification
    module DSL
      # @return [Array<Attribute>] The attributes of the class.
      #
      class << self
        attr_reader :attributes
      end

      # This module provides support for storing the runtime information of the
      # {Specification} DSL.
      #
      module AttributeSupport
        # Defines a root attribute for the extended class.
        #
        # Root attributes make sense only in root specification, they never are
        # multi-platform, they don't have inheritance, and they never have a
        # default value.
        #
        # @param  [Symbol, String] name
        #         The name of the attribute.
        #
        # @param  [Hash] options
        #         The options used to initialize the attribute.
        #
        # @return [void]
        #
        def root_attribute(name, options = {})
          options[:root_only] = true
          options[:multi_platform] = false
          store_attribute(name, options)
        end

        # Defines an attribute for the extended class.
        #
        # Regular attributes in general support inheritance and multi-platform
        # values, so resolving them for a given specification is not trivial.
        #
        # @param  [Symbol, String] name
        #         The name of the attribute.
        #
        # @param  [Hash] options
        #         The options used to initialize the attribute.
        #
        # @return [void]
        #
        def attribute(name, options = {})
          store_attribute(name, options)
        end

        #---------------------------------------------------------------------#

        # Creates an attribute with the given name and options and stores it in
        # the {DSL.attributes} hash.
        #
        # @param  [String] name
        #         The name of the attribute.
        #
        # @param  [Hash] options
        #         The options used to initialize the attribute.
        #
        # @return [void]
        #
        # @visibility private
        #
        def store_attribute(name, options)
          attr = Attribute.new(name, options)
          @attributes ||= {}
          @attributes[name] = attr
        end
      end
    end
  end
end
