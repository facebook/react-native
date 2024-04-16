# frozen_string_literal: true

module ActiveSupport
  # Wrapping a string in this class gives you a prettier way to test
  # for equality. The value returned by <tt>Rails.env</tt> is wrapped
  # in a StringInquirer object, so instead of calling this:
  #
  #   Rails.env == 'production'
  #
  # you can call this:
  #
  #   Rails.env.production?
  #
  # == Instantiating a new StringInquirer
  #
  #   vehicle = ActiveSupport::StringInquirer.new('car')
  #   vehicle.car?   # => true
  #   vehicle.bike?  # => false
  class StringInquirer < String
    private
      def respond_to_missing?(method_name, include_private = false)
        method_name.end_with?("?") || super
      end

      def method_missing(method_name, *arguments)
        if method_name.end_with?("?")
          self == method_name[0..-2]
        else
          super
        end
      end
  end
end
