# frozen_string_literal: true

require "active_support/inflector/methods"

module ActiveSupport
  # Autoload and eager load conveniences for your library.
  #
  # This module allows you to define autoloads based on
  # Rails conventions (i.e. no need to define the path
  # it is automatically guessed based on the filename)
  # and also define a set of constants that needs to be
  # eager loaded:
  #
  #   module MyLib
  #     extend ActiveSupport::Autoload
  #
  #     autoload :Model
  #
  #     eager_autoload do
  #       autoload :Cache
  #     end
  #   end
  #
  # Then your library can be eager loaded by simply calling:
  #
  #   MyLib.eager_load!
  module Autoload
    def self.extended(base) # :nodoc:
      base.class_eval do
        @_autoloads = {}
        @_under_path = nil
        @_at_path = nil
        @_eager_autoload = false
      end
    end

    def autoload(const_name, path = @_at_path)
      unless path
        full = [name, @_under_path, const_name.to_s].compact.join("::")
        path = Inflector.underscore(full)
      end

      if @_eager_autoload
        @_autoloads[const_name] = path
      end

      super const_name, path
    end

    def autoload_under(path)
      @_under_path, old_path = path, @_under_path
      yield
    ensure
      @_under_path = old_path
    end

    def autoload_at(path)
      @_at_path, old_path = path, @_at_path
      yield
    ensure
      @_at_path = old_path
    end

    def eager_autoload
      old_eager, @_eager_autoload = @_eager_autoload, true
      yield
    ensure
      @_eager_autoload = old_eager
    end

    def eager_load!
      @_autoloads.each_value { |file| require file }
    end

    def autoloads
      @_autoloads
    end
  end
end
