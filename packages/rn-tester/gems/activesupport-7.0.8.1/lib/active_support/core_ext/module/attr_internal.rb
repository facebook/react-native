# frozen_string_literal: true

class Module
  # Declares an attribute reader backed by an internally-named instance variable.
  def attr_internal_reader(*attrs)
    attrs.each { |attr_name| attr_internal_define(attr_name, :reader) }
  end

  # Declares an attribute writer backed by an internally-named instance variable.
  def attr_internal_writer(*attrs)
    attrs.each { |attr_name| attr_internal_define(attr_name, :writer) }
  end

  # Declares an attribute reader and writer backed by an internally-named instance
  # variable.
  def attr_internal_accessor(*attrs)
    attr_internal_reader(*attrs)
    attr_internal_writer(*attrs)
  end
  alias_method :attr_internal, :attr_internal_accessor

  class << self; attr_accessor :attr_internal_naming_format end
  self.attr_internal_naming_format = "@_%s"

  private
    def attr_internal_ivar_name(attr)
      Module.attr_internal_naming_format % attr
    end

    def attr_internal_define(attr_name, type)
      internal_name = attr_internal_ivar_name(attr_name).delete_prefix("@")
      # use native attr_* methods as they are faster on some Ruby implementations
      public_send("attr_#{type}", internal_name)
      attr_name, internal_name = "#{attr_name}=", "#{internal_name}=" if type == :writer
      alias_method attr_name, internal_name
      remove_method internal_name
    end
end
