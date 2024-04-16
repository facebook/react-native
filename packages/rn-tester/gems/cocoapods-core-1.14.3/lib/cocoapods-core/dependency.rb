module Pod
  # The Dependency allows to specify dependencies of a {Podfile} or a
  # {Specification} on a Pod. It stores the name of the dependency, version
  # requirements and external sources information.
  #
  # This class is based on the dependency class of RubyGems and mimics its
  # implementation with adjustments specific to CocoaPods. RubyGems is
  # available under the
  # [MIT license](https://github.com/rubygems/rubygems/blob/master/MIT.txt).
  #
  class Dependency
    # @return [String] The name of the Pod described by this dependency.
    #
    attr_accessor :name

    # @return [Hash{Symbol=>String}] a hash describing the external source
    #         where the pod should be fetched. The external source has to
    #         provide its own {Specification} file.
    #
    attr_accessor :external_source

    # @return [String] The source URL of the podspec repo to use to resolve
    #         this dependency. If not set then the standard source list
    #         should be used to resolve the dependency.
    attr_accessor :podspec_repo

    # @overload   initialize(name, requirements)
    #
    #   @param    [String] name
    #             the name of the Pod.
    #
    #   @param    [Array, Version, String, Requirement] requirements
    #             an array specifying the version requirements of the
    #             dependency.
    #
    #   @example  Initialization with version requirements.
    #
    #             Dependency.new('AFNetworking')
    #             Dependency.new('AFNetworking', '~> 1.0')
    #             Dependency.new('AFNetworking', '>= 0.5', '< 0.7')
    #
    # @overload   initialize(name, external_source)
    #
    #   @param    [String] name
    #             the name of the Pod.
    #
    #   @param    [Hash] external_source
    #             a hash describing the external source.
    #
    #   @example  Initialization with an external source.
    #
    #             Dependency.new('libPusher', {:git     => 'example.com/repo.git'})
    #             Dependency.new('libPusher', {:path    => 'path/to/folder'})
    #             Dependency.new('libPusher', {:podspec => 'example.com/libPusher.podspec'})
    #
    # @overload   initialize(name, requirements, podspec_repo)
    #
    #   @param    [String] name
    #             the name of the Pod.
    #
    #   @param    [Array, Version, String, Requirement] requirements
    #             an array specifying the version requirements of the
    #             dependency.
    #
    #   @param    [Hash] podspec_repo
    #             The URL of the specific podspec repo to resolve this dependency from.
    #
    #   @example  Initialization with a specific podspec repo
    #
    #             Dependency.new('Artsy+UILabels', '~> 1.0', :source => 'https://github.com/Artsy/Specs.git')
    #
    def initialize(name = nil, *requirements)
      if requirements.last.is_a?(Hash)
        additional_params = requirements.pop.select { |_, v| !v.nil? }
        additional_params = nil if additional_params.empty?

        if additional_params && @podspec_repo = additional_params[:source]
          # This dependency specifies the exact source podspec repo to use.
          additional_params.delete(:source)
          unless additional_params.empty?
            raise Informative, 'A dependency with a specified podspec repo may ' \
              "not include other source parameters (#{name})."
          end
        elsif @external_source = additional_params
          unless requirements.empty?
            raise Informative, 'A dependency with an external source may not ' \
              "specify version requirements (#{name})."
          end
        end

      elsif requirements.last == :head
        raise Informative, '`:head` dependencies have been removed. Please use ' \
          "normal external source dependencies (`:git => 'GIT_REPO_URL'`) " \
          "instead of `:head` for `#{name}`."
      end

      if requirements.length == 1 && requirements.first.is_a?(Requirement)
        requirements = requirements.first
      end
      @name = name
      @requirement = Requirement.create(requirements)
      @specific_requirement ||= nil
      @external_source ||= nil
    end

    # @return [Version] whether the dependency points to a specific version.
    #
    attr_reader :specific_version

    # @return [Requirement] the requirement of this dependency (a set of
    #         one or more version restrictions).
    #
    def requirement
      @specific_requirement || @requirement
    end

    # @param [Version] version the specific version to point to
    #
    def specific_version=(version)
      @specific_version = version
      @specific_requirement = if version
                                Requirement.new(Version.new(version.version))
                              end
    end

    # @return [Boolean] whether the dependency points to a subspec.
    #
    def subspec_dependency?
      @name.include?('/')
    end

    # @return [Boolean] whether the dependency points to an external source.
    #
    def external?
      !@external_source.nil?
    end

    # @return [Boolean] whether the dependency points to a local path.
    #
    def local?
      if external_source
        external_source[:path]
      end
    end

    # Creates a new dependency with the name of the top level spec and the same
    # version requirements.
    #
    # @note   This is used by the {Specification::Set} class to merge
    #         dependencies and resolve the required version of a Pod regardless
    #         what particular specification (subspecs or top level) is
    #         required.
    #
    # @todo   This should not use `dup`. The `name` property should be an
    #         attr_reader.
    #
    # @return [Dependency] a dependency with the same versions requirements
    #         that is guaranteed to point to a top level specification.
    #
    def to_root_dependency
      dep = dup
      dep.name = root_name
      dep
    end

    # Returns the name of the Pod that the dependency is pointing to.
    #
    # @note   In case this is a dependency for a subspec, e.g.
    #         'RestKit/Networking', this returns 'RestKit', which is what the
    #         Pod::Source needs to know to retrieve the correct {Specification}
    #         from disk.
    #
    # @return [String] the name of the Pod.
    #
    def root_name
      subspec_dependency? ? @name.split('/').first : @name
    end

    # Checks if a dependency would be satisfied by the requirements of another
    # dependency.
    #
    # @param  [Dependency] other
    #         the other dependency.
    #
    # @note   This is used by the Lockfile to check if a stored dependency is
    #         still compatible with the Podfile.
    #
    # @return [Boolean] whether the dependency is compatible with the given one.
    #
    def compatible?(other)
      return false unless name == other.name
      return false unless external_source == other.external_source

      other.requirement.requirements.all? do |_operator, version|
        requirement.satisfied_by? Version.new(version)
      end
    end

    # @return [Boolean] whether the dependency is equal to another taking into
    #         account the loaded specification, the head options and the
    #         external source.
    #
    def ==(other)
      self.class == other.class &&
        name == other.name &&
        external_source == other.external_source &&
        podspec_repo == other.podspec_repo &&
        requirement == other.requirement
    end
    alias_method :eql?, :==

    #  @return [Fixnum] The hash value based on the name and on the
    #  requirements.
    #
    def hash
      name.hash ^ requirement.hash
    end

    # @return [Fixnum] How the dependency should be sorted respect to another
    #         one according to its name.
    #
    def <=>(other)
      name <=> other.name
    end

    # Merges the version requirements of the dependency with another one.
    #
    # @param  [Dependency] other
    #         the other dependency to merge with.
    #
    # @note   If one of the dependencies specifies an external source or is head,
    #         the resulting dependency preserves this attributes.
    #
    # @return [Dependency] a dependency (not necessarily a new instance) that
    #         also includes the version requirements of the given one.
    #
    def merge(other)
      unless name == other.name
        raise ArgumentError, "#{self} and #{other} have different names"
      end

      default   = Requirement.default
      self_req  = requirement
      other_req = other.requirement

      req = if other_req == default
              self_req
            elsif self_req == default
              other_req
            else
              self_req.as_list.concat(other_req.as_list)
            end

      opts = {}

      if external_source || other.external_source
        opts.
          merge!(external_source || {}).
          merge!(other.external_source || {})

        req_to_set = req
        req = []
      end

      if podspec_repo && other.podspec_repo && podspec_repo != other.podspec_repo
        raise ArgumentError, "#{self} and #{other} have different podspec repos"
      end

      if repo = podspec_repo || other.podspec_repo
        opts[:source] = repo
      end

      self.class.new(name, *req, opts).tap do |dep|
        dep.instance_variable_set(:@requirement, Requirement.create(req_to_set)) if req_to_set
      end
    end

    # Whether the dependency has any pre-release requirements
    #
    # @return [Boolean] Whether the dependency has any pre-release requirements
    #
    def prerelease?
      return @prerelease if defined?(@prerelease)
      @prerelease = requirement.requirements.any? { |_op, version| version.prerelease? }
    end

    # Checks whether the dependency would be satisfied by the specification
    # with the given name and version.
    #
    # @param  [String]
    #         The proposed name.
    #
    # @param  [String, Version] version
    #         The proposed version.
    #
    # @return [Boolean] Whether the dependency is satisfied.
    #
    def match?(name, version)
      return false unless self.name == name
      return true if requirement.none?
      requirement.satisfied_by?(Version.new(version))
    end

    #-------------------------------------------------------------------------#

    # !@group String representation

    # Creates a string representation of the dependency suitable for
    # serialization and de-serialization without loss of information. The
    # string is also suitable for UI.
    #
    # @note     This representation is used by the {Lockfile}.
    #
    # @example  Output examples
    #
    #           "libPusher"
    #           "libPusher (= 1.0)"
    #           "libPusher (~> 1.0.1)"
    #           "libPusher (> 1.0, < 2.0)"
    #           "libPusher (from `www.example.com')"
    #           "libPusher (defined in Podfile)"
    #           "RestKit/JSON"
    #
    # @return   [String] the representation of the dependency.
    #
    def to_s
      version = ''
      if external?
        version << external_source_description(external_source)
      elsif requirement != Requirement.default
        version << requirement.to_s
      end
      result = @name.dup
      result << " (#{version})" unless version.empty?
      result
    end

    # Generates a dependency from its string representation.
    #
    # @param    [String] string
    #           The string that describes the dependency generated from
    #           {#to_s}.
    #
    # @note     The information about external sources is not completely
    #           serialized in the string representation and should be stored a
    #           part by clients that need to create a dependency equal to the
    #           original one.
    #
    # @return   [Dependency] the dependency described by the string.
    #
    def self.from_string(string)
      match_data = string.match(/((?:\s?[^\s(])+)( (?:.*))?/)
      name = match_data[1]
      version = match_data[2]
      version = version.gsub(/[()]/, '') if version
      case version
      when nil, /from `(.*)(`|')/
        Dependency.new(name)
      else
        version_requirements = version.split(',') if version
        Dependency.new(name, version_requirements)
      end
    end

    # @return [String] a string representation suitable for debugging.
    #
    def inspect
      "<#{self.class} name=#{name} requirements=#{requirement} " \
        "source=#{podspec_repo || 'nil'} external_source=#{external_source || 'nil'}>"
    end

    #--------------------------------------#

    private

    # Creates a string representation of the external source suitable for UI.
    #
    # @example  Output examples
    #
    #           "from `www.example.com/libPusher.git', tag `v0.0.1'"
    #           "from `www.example.com/libPusher.podspec'"
    #           "from `~/path/to/libPusher'"
    #
    # @todo     Improve the description for Mercurial and Subversion.
    #
    # @return   [String] the description of the external source.
    #
    def external_source_description(source)
      if source.key?(:git)
        desc =  "`#{source[:git]}`"
        desc << ", commit `#{source[:commit]}`" if source[:commit]
        desc << ", branch `#{source[:branch]}`" if source[:branch]
        desc << ", tag `#{source[:tag]}`"       if source[:tag]
      elsif source.key?(:hg)
        desc =  "`#{source[:hg]}`"
      elsif source.key?(:svn)
        desc =  "`#{source[:svn]}`"
      elsif source.key?(:podspec)
        desc = "`#{source[:podspec]}`"
      elsif source.key?(:path)
        desc = "`#{source[:path]}`"
      else
        desc = "`#{source}`"
      end
      "from #{desc}"
    end
  end
end
