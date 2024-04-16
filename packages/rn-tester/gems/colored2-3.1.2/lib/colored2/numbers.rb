require 'colored2' unless defined?(Colored2) && Colored2.respond_to?(:decorate)

module Colored2
  def self.integer_class
    major, minor = RUBY_VERSION.split(/\./).map(&:to_i)
    major >= 2 && minor >= 4 ? Integer : Kernel.const_get(:Fixnum)
  end
end

Colored2.decorate(Colored2.integer_class)
Colored2.decorate(Float)
