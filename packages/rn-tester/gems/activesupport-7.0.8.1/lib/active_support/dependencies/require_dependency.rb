# frozen_string_literal: true

module ActiveSupport::Dependencies::RequireDependency
  # <b>Warning:</b> This method is obsolete. The semantics of the autoloader
  # match Ruby's and you do not need to be defensive with load order anymore.
  # Just refer to classes and modules normally.
  #
  # Engines that do not control the mode in which their parent application runs
  # should call +require_dependency+ where needed in case the runtime mode is
  # +:classic+.
  def require_dependency(filename)
    filename = filename.to_path if filename.respond_to?(:to_path)

    unless filename.is_a?(String)
      raise ArgumentError, "the file name must be either a String or implement #to_path -- you passed #{filename.inspect}"
    end

    if abspath = ActiveSupport::Dependencies.search_for_file(filename)
      require abspath
    else
      require filename
    end
  end

  # We could define require_dependency in Object directly, but a module makes
  # the extension apparent if you list ancestors.
  Object.prepend(self)
end
