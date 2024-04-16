# frozen_string_literal: true

class Object
  # Provides a way to check whether some class acts like some other class based on the existence of
  # an appropriately-named marker method.
  #
  # A class that provides the same interface as <tt>SomeClass</tt> may define a marker method named
  # <tt>acts_like_some_class?</tt> to signal its compatibility to callers of
  # <tt>acts_like?(:some_class)</tt>.
  #
  # For example, Active Support extends <tt>Date</tt> to define an <tt>acts_like_date?</tt> method,
  # and extends <tt>Time</tt> to define <tt>acts_like_time?</tt>. As a result, developers can call
  # <tt>x.acts_like?(:time)</tt> and <tt>x.acts_like?(:date)</tt> to test duck-type compatibility,
  # and classes that are able to act like <tt>Time</tt> can also define an <tt>acts_like_time?</tt>
  # method to interoperate.
  #
  # Note that the marker method is only expected to exist. It isn't called, so its body or return
  # value are irrelevant.
  #
  # ==== Example: A class that provides the same interface as <tt>String</tt>
  #
  # This class may define:
  #
  #   class Stringish
  #     def acts_like_string?
  #     end
  #   end
  #
  # Then client code can query for duck-type-safeness this way:
  #
  #   Stringish.new.acts_like?(:string) # => true
  #
  def acts_like?(duck)
    case duck
    when :time
      respond_to? :acts_like_time?
    when :date
      respond_to? :acts_like_date?
    when :string
      respond_to? :acts_like_string?
    else
      respond_to? :"acts_like_#{duck}?"
    end
  end
end
