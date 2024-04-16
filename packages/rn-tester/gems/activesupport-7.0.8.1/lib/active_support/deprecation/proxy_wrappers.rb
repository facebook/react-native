# frozen_string_literal: true

module ActiveSupport
  class Deprecation
    class DeprecationProxy # :nodoc:
      def self.new(*args, &block)
        object = args.first

        return object unless object
        super
      end

      instance_methods.each { |m| undef_method m unless /^__|^object_id$/.match?(m) }

      # Don't give a deprecation warning on inspect since test/unit and error
      # logs rely on it for diagnostics.
      def inspect
        target.inspect
      end

      private
        def method_missing(called, *args, &block)
          warn caller_locations, called, args
          target.__send__(called, *args, &block)
        end
    end

    # DeprecatedObjectProxy transforms an object into a deprecated one. It
    # takes an object, a deprecation message, and optionally a deprecator. The
    # deprecator defaults to +ActiveSupport::Deprecator+ if none is specified.
    #
    #   deprecated_object = ActiveSupport::Deprecation::DeprecatedObjectProxy.new(Object.new, "This object is now deprecated")
    #   # => #<Object:0x007fb9b34c34b0>
    #
    #   deprecated_object.to_s
    #   DEPRECATION WARNING: This object is now deprecated.
    #   (Backtrace)
    #   # => "#<Object:0x007fb9b34c34b0>"
    class DeprecatedObjectProxy < DeprecationProxy
      def initialize(object, message, deprecator = ActiveSupport::Deprecation.instance)
        @object = object
        @message = message
        @deprecator = deprecator
      end

      private
        def target
          @object
        end

        def warn(callstack, called, args)
          @deprecator.warn(@message, callstack)
        end
    end

    # DeprecatedInstanceVariableProxy transforms an instance variable into a
    # deprecated one. It takes an instance of a class, a method on that class
    # and an instance variable. It optionally takes a deprecator as the last
    # argument. The deprecator defaults to +ActiveSupport::Deprecator+ if none
    # is specified.
    #
    #   class Example
    #     def initialize
    #       @request = ActiveSupport::Deprecation::DeprecatedInstanceVariableProxy.new(self, :request, :@request)
    #       @_request = :special_request
    #     end
    #
    #     def request
    #       @_request
    #     end
    #
    #     def old_request
    #       @request
    #     end
    #   end
    #
    #   example = Example.new
    #   # => #<Example:0x007fb9b31090b8 @_request=:special_request, @request=:special_request>
    #
    #   example.old_request.to_s
    #   # => DEPRECATION WARNING: @request is deprecated! Call request.to_s instead of
    #      @request.to_s
    #      (Backtrace information…)
    #      "special_request"
    #
    #   example.request.to_s
    #   # => "special_request"
    class DeprecatedInstanceVariableProxy < DeprecationProxy
      def initialize(instance, method, var = "@#{method}", deprecator = ActiveSupport::Deprecation.instance)
        @instance = instance
        @method = method
        @var = var
        @deprecator = deprecator
      end

      private
        def target
          @instance.__send__(@method)
        end

        def warn(callstack, called, args)
          @deprecator.warn("#{@var} is deprecated! Call #{@method}.#{called} instead of #{@var}.#{called}. Args: #{args.inspect}", callstack)
        end
    end

    # DeprecatedConstantProxy transforms a constant into a deprecated one. It
    # takes the names of an old (deprecated) constant and of a new constant
    # (both in string form) and optionally a deprecator. The deprecator defaults
    # to +ActiveSupport::Deprecator+ if none is specified. The deprecated constant
    # now returns the value of the new one.
    #
    #   PLANETS = %w(mercury venus earth mars jupiter saturn uranus neptune pluto)
    #
    #   # (In a later update, the original implementation of `PLANETS` has been removed.)
    #
    #   PLANETS_POST_2006 = %w(mercury venus earth mars jupiter saturn uranus neptune)
    #   PLANETS = ActiveSupport::Deprecation::DeprecatedConstantProxy.new('PLANETS', 'PLANETS_POST_2006')
    #
    #   PLANETS.map { |planet| planet.capitalize }
    #   # => DEPRECATION WARNING: PLANETS is deprecated! Use PLANETS_POST_2006 instead.
    #        (Backtrace information…)
    #        ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"]
    class DeprecatedConstantProxy < Module
      def self.new(*args, **options, &block)
        object = args.first

        return object unless object
        super
      end

      def initialize(old_const, new_const, deprecator = ActiveSupport::Deprecation.instance, message: "#{old_const} is deprecated! Use #{new_const} instead.")
        Kernel.require "active_support/inflector/methods"

        @old_const = old_const
        @new_const = new_const
        @deprecator = deprecator
        @message = message
      end

      instance_methods.each { |m| undef_method m unless /^__|^object_id$/.match?(m) }

      # Don't give a deprecation warning on inspect since test/unit and error
      # logs rely on it for diagnostics.
      def inspect
        target.inspect
      end

      # Don't give a deprecation warning on methods that IRB may invoke
      # during tab-completion.
      delegate :hash, :instance_methods, :name, :respond_to?, to: :target

      # Returns the class of the new constant.
      #
      #   PLANETS_POST_2006 = %w(mercury venus earth mars jupiter saturn uranus neptune)
      #   PLANETS = ActiveSupport::Deprecation::DeprecatedConstantProxy.new('PLANETS', 'PLANETS_POST_2006')
      #   PLANETS.class # => Array
      def class
        target.class
      end

      private
        def target
          ActiveSupport::Inflector.constantize(@new_const.to_s)
        end

        def const_missing(name)
          @deprecator.warn(@message, caller_locations)
          target.const_get(name)
        end

        def method_missing(called, *args, &block)
          @deprecator.warn(@message, caller_locations)
          target.__send__(called, *args, &block)
        end
    end
  end
end
