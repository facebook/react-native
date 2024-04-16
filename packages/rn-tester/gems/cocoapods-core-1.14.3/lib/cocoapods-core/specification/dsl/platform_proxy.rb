module Pod
  class Specification
    module DSL
      # The PlatformProxy works in conjunction with Specification#_on_platform.
      # It provides support for a syntax like `spec.ios.source_files = 'file'`.
      #
      class PlatformProxy
        # @return [Specification] the specification for this platform proxy.
        #
        attr_accessor :spec

        # @return [Symbol] the platform described by this proxy. Can be either
        #         `:ios` or `:osx`.
        #
        attr_reader :platform

        # @param  [Specification] spec @see spec
        # @param  [Symbol] platform @see platform
        #
        def initialize(spec, platform)
          @spec = spec
          @platform = platform
        end

        # Defines a setter method for each attribute of the specification
        # class, that forwards the message to the {#specification} using the
        # {Specification#on_platform} method.
        #
        # @return [void]
        #
        def method_missing(meth, *args, &block)
          return super unless attribute = attribute_for_method(meth)
          raise NoMethodError, "#{attribute} cannot be set per-platform" unless attribute.multi_platform?
          spec.store_attribute(attribute.name, args.first, platform)
        end

        # @!visibility private
        #
        def respond_to_missing?(method, include_all)
          attribute = attribute_for_method(method)
          (attribute && attribute.multi_platform?) || super
        end

        # Allows to add dependency for the platform.
        #
        # @return [void]
        #
        def dependency(*args)
          name, *version_requirements = args
          platform_name = platform.to_s
          platform_hash = spec.attributes_hash[platform_name] || {}
          platform_hash['dependencies'] ||= {}
          platform_hash['dependencies'][name] = version_requirements
          spec.attributes_hash[platform_name] = platform_hash
        end

        # Allows to set the deployment target for the platform.
        #
        # @return [void]
        #
        def deployment_target=(value)
          platform_name = platform.to_s
          spec.attributes_hash['platforms'] ||= {}
          spec.attributes_hash['platforms'][platform_name] = value
        end

        private

        def attribute_for_method(method)
          method = method.to_sym
          Specification::DSL.attributes.values.find do |attribute|
            if attribute.writer_name.to_sym == method
              true
            elsif attribute.writer_singular_form
              attribute.writer_singular_form.to_sym == method
            end
          end
        end
      end
    end
  end
end
