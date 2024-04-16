module Pod
  class BuildType
    # @return [Array<Symbol>] known packaging options.
    #
    KNOWN_PACKAGING_OPTIONS = %i(library framework).freeze

    # @return [Array<Symbol>] known linking options.
    #
    KNOWN_LINKAGE_OPTIONS = %i(static dynamic).freeze

    # @return [Symbol] the packaging for this build type, one of #KNOWN_PACKAGING_OPTIONS
    #
    attr_reader :packaging

    # @return [Symbol] the linkage for this build type, one of #KNOWN_LINKAGE_OPTIONS
    #
    attr_reader :linkage

    attr_reader :hash

    def initialize(linkage: :static, packaging: :library)
      unless KNOWN_LINKAGE_OPTIONS.include?(linkage)
        raise ArgumentError, "Invalid linkage option #{linkage.inspect}, valid options are #{KNOWN_LINKAGE_OPTIONS.inspect}"
      end
      unless KNOWN_PACKAGING_OPTIONS.include?(packaging)
        raise ArgumentError, "Invalid packaging option #{packaging.inspect}, valid options are #{KNOWN_PACKAGING_OPTIONS.inspect}"
      end
      @packaging = packaging
      @linkage = linkage
      @hash = packaging.hash ^ linkage.hash
    end

    # @return [BuildType] the build type for a dynamic library
    def self.dynamic_library
      new(:linkage => :dynamic, :packaging => :library)
    end

    # @return [BuildType] the build type for a static library
    #
    def self.static_library
      new(:linkage => :static, :packaging => :library)
    end

    # @return [BuildType] the build type for a dynamic framework
    #
    def self.dynamic_framework
      new(:linkage => :dynamic, :packaging => :framework)
    end

    # @return [BuildType] the build type for a static framework
    #
    def self.static_framework
      new(:linkage => :static, :packaging => :framework)
    end

    # @return [Boolean] whether the target is built dynamically
    #
    def dynamic?
      linkage == :dynamic
    end

    # @return [Boolean] whether the target is built statically
    #
    def static?
      linkage == :static
    end

    # @return [Boolean] whether the target is built as a framework
    #
    def framework?
      packaging == :framework
    end

    # @return [Boolean] whether the target is built as a library
    #
    def library?
      packaging == :library
    end

    # @return [Boolean] whether the target is built as a dynamic framework
    #
    def dynamic_framework?
      dynamic? && framework?
    end

    # @return [Boolean] whether the target is built as a dynamic library
    #
    def dynamic_library?
      dynamic? && library?
    end

    # @return [Boolean] whether the target is built as a static framework
    #
    def static_framework?
      static? && framework?
    end

    # @return [Boolean] whether the target is built as a static library
    #
    def static_library?
      static? && library?
    end

    def to_s
      "#{linkage} #{packaging}"
    end

    def to_hash
      { :linkage => linkage, :packaging => packaging }
    end

    def inspect
      "#<#{self.class} linkage=#{linkage} packaging=#{packaging}>"
    end

    def ==(other)
      linkage == other.linkage &&
        packaging == other.packaging
    end
  end
end
