# frozen_string_literal: true

require "set"
require "active_support/dependencies/interlock"

module ActiveSupport # :nodoc:
  module Dependencies # :nodoc:
    require_relative "dependencies/require_dependency"

    singleton_class.attr_accessor :interlock
    @interlock = Interlock.new

    # :doc:

    # Execute the supplied block without interference from any
    # concurrent loads.
    def self.run_interlock(&block)
      interlock.running(&block)
    end

    # Execute the supplied block while holding an exclusive lock,
    # preventing any other thread from being inside a #run_interlock
    # block at the same time.
    def self.load_interlock(&block)
      interlock.loading(&block)
    end

    # Execute the supplied block while holding an exclusive lock,
    # preventing any other thread from being inside a #run_interlock
    # block at the same time.
    def self.unload_interlock(&block)
      interlock.unloading(&block)
    end

    # :nodoc:

    # The array of directories from which we autoload and reload, if reloading
    # is enabled. The public interface to push directories to this collection
    # from applications or engines is config.autoload_paths.
    #
    # This collection is allowed to have intersection with autoload_once_paths.
    # Common directories are not reloaded.
    singleton_class.attr_accessor :autoload_paths
    self.autoload_paths = []

    # The array of directories from which we autoload and never reload, even if
    # reloading is enabled. The public interface to push directories to this
    # collection from applications or engines is config.autoload_once_paths.
    singleton_class.attr_accessor :autoload_once_paths
    self.autoload_once_paths = []

    # This is a private set that collects all eager load paths during bootstrap.
    # Useful for Zeitwerk integration. The public interface to push custom
    # directories to this collection from applications or engines is
    # config.eager_load_paths.
    singleton_class.attr_accessor :_eager_load_paths
    self._eager_load_paths = Set.new

    # If reloading is enabled, this private set holds autoloaded classes tracked
    # by the descendants tracker. It is populated by an on_load callback in the
    # main autoloader. Used to clear state.
    singleton_class.attr_accessor :_autoloaded_tracked_classes
    self._autoloaded_tracked_classes = Set.new

    # If reloading is enabled, this private attribute stores the main autoloader
    # of a Rails application. It is `nil` otherwise.
    #
    # The public interface for this autoloader is `Rails.autoloaders.main`.
    singleton_class.attr_accessor :autoloader

    # Private method that reloads constants autoloaded by the main autoloader.
    #
    # Rails.application.reloader.reload! is the public interface for application
    # reload. That involves more things, like deleting unloaded classes from the
    # internal state of the descendants tracker, or reloading routes.
    def self.clear
      unload_interlock do
        _autoloaded_tracked_classes.clear
        autoloader.reload
      end
    end

    # Private method used by require_dependency.
    def self.search_for_file(relpath)
      relpath += ".rb" unless relpath.end_with?(".rb")
      autoload_paths.each do |autoload_path|
        abspath = File.join(autoload_path, relpath)
        return abspath if File.file?(abspath)
      end
      nil
    end

    # Private method that helps configuring the autoloaders.
    def self.eager_load?(path)
      _eager_load_paths.member?(path)
    end
  end
end
