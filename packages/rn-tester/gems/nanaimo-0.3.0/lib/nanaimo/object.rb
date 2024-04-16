# frozen_string_literal: true

module Nanaimo
  # An object that belongs to a plist.
  #
  class Object
    # @return The underlying native Ruby value
    #
    attr_accessor :value

    # @return [String] The annotation comment
    #
    attr_accessor :annotation

    def initialize(value, annotation)
      self.value = value
      self.annotation = annotation

      raise 'Item cannot be initialize with a nil value' if value.nil?
    end

    def ==(other)
      return unless other
      if other.is_a?(self.class)
        other.value == value && annotation == other.annotation
      elsif other.is_a?(value.class)
        other == value
      end
    end
    alias eql? ==

    def hash
      value.hash
    end

    def <=>(other)
      other_value = if other.is_a?(Object)
                      other.value
                    elsif other.is_a?(value.class)
                      other
                    end
      return unless other_value

      value <=> other_value
    end

    def to_s
      format('<%s %s>', self.class, value)
    end

    # @return A native Ruby object representation
    #
    def as_ruby
      raise 'unimplemented'
    end
  end

  # A string object in a Plist.
  #
  class String < Object
    def as_ruby
      value
    end
  end

  # A string object surrounded by quotes in a Plist.
  #
  class QuotedString < Object
    def as_ruby
      value
    end
  end

  # A data object in a Plist, represented by a binary-encoded string.
  #
  class Data < Object
    def initialize(value, annotation)
      value &&= value.dup.force_encoding(Encoding::BINARY)
      super(value, annotation)
    end

    def as_ruby
      value
    end
  end

  # An array object in a Plist.
  #
  class Array < Object
    def as_ruby
      value.map(&:as_ruby)
    end
  end

  # A dictionary object in a Plist.
  #
  class Dictionary < Object
    def as_ruby
      Hash[value.map { |k, v| [k.as_ruby, v.as_ruby] }]
    end
  end
end
