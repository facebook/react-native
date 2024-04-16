# frozen_string_literal: true

#--
# Most objects are cloneable, but not all. For example you can't dup methods:
#
#   method(:puts).dup # => TypeError: allocator undefined for Method
#
# Classes may signal their instances are not duplicable removing +dup+/+clone+
# or raising exceptions from them. So, to dup an arbitrary object you normally
# use an optimistic approach and are ready to catch an exception, say:
#
#   arbitrary_object.dup rescue object
#
# Rails dups objects in a few critical spots where they are not that arbitrary.
# That rescue is very expensive (like 40 times slower than a predicate), and it
# is often triggered.
#
# That's why we hardcode the following cases and check duplicable? instead of
# using that rescue idiom.
#++
class Object
  # Can you safely dup this object?
  #
  # False for method objects;
  # true otherwise.
  def duplicable?
    true
  end
end

class Method
  # Methods are not duplicable:
  #
  #   method(:puts).duplicable? # => false
  #   method(:puts).dup         # => TypeError: allocator undefined for Method
  def duplicable?
    false
  end
end

class UnboundMethod
  # Unbound methods are not duplicable:
  #
  #   method(:puts).unbind.duplicable? # => false
  #   method(:puts).unbind.dup         # => TypeError: allocator undefined for UnboundMethod
  def duplicable?
    false
  end
end

require "singleton"

module Singleton
  # Singleton instances are not duplicable:
  #
  #   Class.new.include(Singleton).instance.dup # TypeError (can't dup instance of singleton
  def duplicable?
    false
  end
end
