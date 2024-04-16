module Concurrent
  module Concern

    # Object references in Ruby are mutable. This can lead to serious problems when
    # the `#value` of a concurrent object is a mutable reference. Which is always the
    # case unless the value is a `Fixnum`, `Symbol`, or similar "primitive" data type.
    # Most classes in this library that expose a `#value` getter method do so using the
    # `Dereferenceable` mixin module.
    #
    # @!macro copy_options
    module Dereferenceable
      # NOTE: This module is going away in 2.0. In the mean time we need it to
      # play nicely with the synchronization layer. This means that the
      # including class SHOULD be synchronized and it MUST implement a
      # `#synchronize` method. Not doing so will lead to runtime errors.

      # Return the value this object represents after applying the options specified
      # by the `#set_deref_options` method.
      #
      # @return [Object] the current value of the object
      def value
        synchronize { apply_deref_options(@value) }
      end
      alias_method :deref, :value

      protected

      # Set the internal value of this object
      #
      # @param [Object] value the new value
      def value=(value)
        synchronize{ @value = value }
      end

      # @!macro dereferenceable_set_deref_options
      #   Set the options which define the operations #value performs before
      #   returning data to the caller (dereferencing).
      #
      #   @note Most classes that include this module will call `#set_deref_options`
      #     from within the constructor, thus allowing these options to be set at
      #     object creation.
      #
      #   @param [Hash] opts the options defining dereference behavior.
      #   @option opts [String] :dup_on_deref (false) call `#dup` before returning the data
      #   @option opts [String] :freeze_on_deref (false) call `#freeze` before returning the data
      #   @option opts [String] :copy_on_deref (nil) call the given `Proc` passing
      #     the internal value and returning the value returned from the proc
      def set_deref_options(opts = {})
        synchronize{ ns_set_deref_options(opts) }
      end

      # @!macro dereferenceable_set_deref_options
      # @!visibility private
      def ns_set_deref_options(opts)
        @dup_on_deref = opts[:dup_on_deref] || opts[:dup]
        @freeze_on_deref = opts[:freeze_on_deref] || opts[:freeze]
        @copy_on_deref = opts[:copy_on_deref] || opts[:copy]
        @do_nothing_on_deref = !(@dup_on_deref || @freeze_on_deref || @copy_on_deref)
        nil
      end

      # @!visibility private
      def apply_deref_options(value)
        return nil if value.nil?
        return value if @do_nothing_on_deref
        value = @copy_on_deref.call(value) if @copy_on_deref
        value = value.dup if @dup_on_deref
        value = value.freeze if @freeze_on_deref
        value
      end
    end
  end
end
