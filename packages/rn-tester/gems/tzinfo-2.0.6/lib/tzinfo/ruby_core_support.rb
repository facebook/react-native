module TZInfo

  # Methods to support different versions of Ruby.
  #
  # @private
  module RubyCoreSupport #:nodoc:
    class << self
      # Object#untaint is deprecated and becomes a no-op in Ruby >= 2.7. It has
      # been removed from Ruby 3.2.
      if !Object.new.respond_to?(:untaint) || RUBY_VERSION =~ /\A(\d+)\.(\d+)(?:\.|\z)/ && ($1 == '2' && $2.to_i >= 7 || $1.to_i >= 3)
        # :nocov_functional_untaint:

        # Returns the supplied `Object`
        #
        # @param o [Object] the `Object` to untaint.
        # @return [Object] `o`.
        def untaint(o)
          o
        end

        # :nocov_functional_untaint:
      else
        # :nocov_no_functional_untaint:

        # Untaints and returns the supplied `Object`.
        #
        # @param o [Object] the `Object` to untaint.
        # @return [Object] `o`.
        def untaint(o)
          o.untaint
        end

        # :nocov_no_functional_untaint:
      end
    end
  end
  private_constant :RubyCoreSupport
end
