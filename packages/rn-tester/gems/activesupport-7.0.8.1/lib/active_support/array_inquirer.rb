# frozen_string_literal: true

module ActiveSupport
  # Wrapping an array in an +ArrayInquirer+ gives a friendlier way to check
  # its string-like contents:
  #
  #   variants = ActiveSupport::ArrayInquirer.new([:phone, :tablet])
  #
  #   variants.phone?    # => true
  #   variants.tablet?   # => true
  #   variants.desktop?  # => false
  class ArrayInquirer < Array
    # Passes each element of +candidates+ collection to ArrayInquirer collection.
    # The method returns true if any element from the ArrayInquirer collection
    # is equal to the stringified or symbolized form of any element in the +candidates+ collection.
    #
    # If +candidates+ collection is not given, method returns true.
    #
    #   variants = ActiveSupport::ArrayInquirer.new([:phone, :tablet])
    #
    #   variants.any?                      # => true
    #   variants.any?(:phone, :tablet)     # => true
    #   variants.any?('phone', 'desktop')  # => true
    #   variants.any?(:desktop, :watch)    # => false
    def any?(*candidates)
      if candidates.none?
        super
      else
        candidates.any? do |candidate|
          include?(candidate.to_sym) || include?(candidate.to_s)
        end
      end
    end

    private
      def respond_to_missing?(name, include_private = false)
        name.end_with?("?") || super
      end

      def method_missing(name, *args)
        if name.end_with?("?")
          any?(name[0..-2])
        else
          super
        end
      end
  end
end
