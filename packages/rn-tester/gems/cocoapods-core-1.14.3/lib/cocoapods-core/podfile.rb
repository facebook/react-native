require 'cocoapods-core/podfile/dsl'
require 'cocoapods-core/podfile/target_definition'

module Pod
  # The Podfile is a specification that describes the dependencies of the
  # targets of an Xcode project.
  #
  # It supports its own DSL and is stored in a file named `Podfile`.
  #
  # The Podfile creates a hierarchy of target definitions that store the
  # information necessary to generate the CocoaPods libraries.
  #
  class Podfile
    # @!group DSL support

    include Pod::Podfile::DSL

    #-------------------------------------------------------------------------#

    class StandardError < ::StandardError; end

    #-------------------------------------------------------------------------#

    # @return [Pathname] the path used to load the Podfile. It is nil
    #         if the Podfile was generated programmatically.
    #
    attr_accessor :defined_in_file

    # @param    [Pathname] defined_in_file
    #           the path of the podfile.
    #
    # @param    [Proc] block
    #           an optional block that configures the Podfile through the DSL.
    #
    # @example  Creating a Podfile.
    #
    #           platform :ios, "6.0"
    #           target :my_app do
    #             pod "AFNetworking", "~> 1.0"
    #           end
    #
    def initialize(defined_in_file = nil, internal_hash = {}, &block)
      self.defined_in_file = defined_in_file
      @internal_hash = internal_hash
      if block
        default_target_def = TargetDefinition.new('Pods', self)
        default_target_def.abstract = true
        @root_target_definitions = [default_target_def]
        @current_target_definition = default_target_def
        instance_eval(&block)
      else
        @root_target_definitions = []
      end
    end

    # @return [String] a string useful to represent the Podfile in a message
    #         presented to the user.
    #
    def to_s
      'Podfile'
    end

    #-------------------------------------------------------------------------#

    public

    # @!group Working with a Podfile

    # @return [Hash{Symbol,String => TargetDefinition}] the target definitions
    #         of the Podfile stored by their name.
    #
    def target_definitions
      Hash[target_definition_list.map { |td| [td.name, td] }]
    end

    # @return [Array<TargetDefinition>] all target definitions in the Podfile.
    #
    def target_definition_list
      root_target_definitions.map { |td| [td, td.recursive_children] }.flatten
    end

    # @return [Array<TargetDefinition>] The root target definitions.
    #
    attr_accessor :root_target_definitions

    # @return [Array<Dependency>] the dependencies of all of the target
    #         definitions.
    #
    def dependencies
      target_definition_list.map(&:dependencies).flatten.uniq
    end

    #-------------------------------------------------------------------------#

    public

    # @!group Attributes

    # @return [Array<String>] The names of the sources.
    #
    def sources
      get_hash_value('sources') || []
    end

    # @return [Hash<String, Hash>] The plugins, keyed by name.
    #
    def plugins
      get_hash_value('plugins') || {}
    end

    # @return [String] the path of the workspace if specified by the user.
    #
    def workspace_path
      path = get_hash_value('workspace')
      if path
        if File.extname(path) == '.xcworkspace'
          path
        else
          "#{path}.xcworkspace"
        end
      end
    end

    # @return [Boolean] whether the podfile should generate a BridgeSupport
    #         metadata document.
    #
    def generate_bridge_support?
      get_hash_value('generate_bridge_support')
    end

    # @return [Boolean] whether the -fobjc-arc flag should be added to the
    #         OTHER_LD_FLAGS.
    #
    def set_arc_compatibility_flag?
      get_hash_value('set_arc_compatibility_flag')
    end

    # @return [(String,Hash)] the installation strategy and installation options
    #         to be used during installation.
    #
    def installation_method
      get_hash_value('installation_method', 'name' => 'cocoapods', 'options' => {}).
        values_at('name', 'options')
    end

    #-------------------------------------------------------------------------#

    public

    # @!group Hooks

    # Calls the pre install callback if defined.
    #
    # @param  [Pod::Installer] installer
    #         the installer that is performing the installation.
    #
    # @return [Boolean] whether a pre install callback was specified and it was
    #         called.
    #
    def pre_install!(installer)
      if @pre_install_callback
        @pre_install_callback.call(installer)
        true
      else
        false
      end
    end

    # Calls the pre integrate callback if defined.
    #
    # @param  [Pod::Installer] installer
    #         the installer that is performing the installation.
    #
    # @return [Boolean] whether a pre integrate callback was specified and it was
    #         called.
    #
    def pre_integrate!(installer)
      if @pre_integrate_callback
        @pre_integrate_callback.call(installer)
        true
      else
        false
      end
    end

    # Calls the post install callback if defined.
    #
    # @param  [Pod::Installer] installer
    #         the installer that is performing the installation.
    #
    # @return [Boolean] whether a post install callback was specified and it was
    #         called.
    #
    def post_install!(installer)
      if @post_install_callback
        @post_install_callback.call(installer)
        true
      else
        false
      end
    end

    # Calls the post integrate callback if defined.
    #
    # @param  [Pod::Installer] installer
    #         the installer that is performing the installation.
    #
    # @return [Boolean] whether a post install callback was specified and it was
    #         called.
    #
    def post_integrate!(installer)
      if @post_integrate_callback
        @post_integrate_callback.call(installer)
        true
      else
        false
      end
    end

    #-------------------------------------------------------------------------#

    public

    # @!group Representations

    # @return [Array] The keys used by the hash representation of the Podfile.
    #
    HASH_KEYS = %w(
      installation_method
      workspace
      sources
      plugins
      set_arc_compatibility_flag
      generate_bridge_support
      target_definitions
    ).freeze

    # @return [Hash] The hash representation of the Podfile.
    #
    def to_hash
      hash = {}
      hash['target_definitions'] = root_target_definitions.map(&:to_hash)
      hash.merge!(internal_hash)
      hash
    end

    # @return [String] The YAML representation of the Podfile.
    #
    def to_yaml
      require 'cocoapods-core/yaml_helper'
      "---\n" << YAMLHelper.convert_hash(to_hash, HASH_KEYS)
    end

    # @return [String] The SHA1 digest of the file in which the Podfile
    #         is defined.
    #
    # @return [Nil] If the podfile is not defined in a file.
    #
    def checksum
      @checksum ||= begin
        unless defined_in_file.nil?
          require 'digest'
          checksum = Digest::SHA1.hexdigest(File.read(defined_in_file))
          checksum = checksum.encode('UTF-8') if checksum.respond_to?(:encode)
          checksum
        end
      end
    end

    def ==(other)
      self.class == other.class &&
        to_hash == other.to_hash
    end

    # @!group Class methods
    #-------------------------------------------------------------------------#

    # Initializes a Podfile from the file with the given path.
    #
    # @param  [Pathname] path
    #         the path from where the Podfile should be loaded.
    #
    # @return [Podfile] the generated Podfile.
    #
    def self.from_file(path)
      path = Pathname.new(path)
      unless path.exist?
        raise Informative, "No Podfile exists at path `#{path}`."
      end

      case path.extname
      when '', '.podfile', '.rb'
        Podfile.from_ruby(path)
      when '.yaml'
        Podfile.from_yaml(path)
      else
        raise Informative, "Unsupported Podfile format `#{path}`."
      end
    end

    # Configures a new Podfile from the given ruby string.
    #
    # @param  [Pathname] path
    #         The path from which the Podfile is loaded.
    #
    # @param  [String] contents
    #         The ruby string which will configure the Podfile with the DSL.
    #
    # @return [Podfile] the new Podfile
    #
    def self.from_ruby(path, contents = nil)
      contents ||= File.open(path, 'r:utf-8', &:read)

      # Work around for Rubinius incomplete encoding in 1.9 mode
      if contents.respond_to?(:encoding) && contents.encoding.name != 'UTF-8'
        contents.encode!('UTF-8')
      end

      if contents.tr!('“”‘’‛', %(""'''))
        # Changes have been made
        CoreUI.warn "Smart quotes were detected and ignored in your #{path.basename}. " \
                    'To avoid issues in the future, you should not use ' \
                    'TextEdit for editing it. If you are not using TextEdit, ' \
                    'you should turn off smart quotes in your editor of choice.'
      end

      podfile = Podfile.new(path) do
        # rubocop:disable Lint/RescueException
        begin
          # rubocop:disable Security/Eval
          eval(contents, nil, path.to_s)
          # rubocop:enable Security/Eval
        rescue Exception => e
          message = "Invalid `#{path.basename}` file: #{e.message}"
          raise DSLError.new(message, path, e, contents)
        end
        # rubocop:enable Lint/RescueException
      end
      podfile
    end

    # Configures a new Podfile from the given YAML representation.
    #
    # @param  [Pathname] path
    #         The path from which the Podfile is loaded.
    #
    # @return [Podfile] the new Podfile
    #
    def self.from_yaml(path)
      string = File.open(path, 'r:utf-8', &:read)
      # Work around for Rubinius incomplete encoding in 1.9 mode
      if string.respond_to?(:encoding) && string.encoding.name != 'UTF-8'
        string.encode!('UTF-8')
      end
      hash = YAMLHelper.load_string(string)
      from_hash(hash, path)
    end

    # Configures a new Podfile from the given hash.
    #
    # @param  [Hash] hash
    #         The hash which contains the information of the Podfile.
    #
    # @param  [Pathname] path
    #         The path from which the Podfile is loaded.
    #
    # @return [Podfile] the new Podfile
    #
    def self.from_hash(hash, path = nil)
      internal_hash = hash.dup
      target_definitions = internal_hash.delete('target_definitions') || []
      podfile = Podfile.new(path, internal_hash)
      target_definitions.each do |definition_hash|
        definition = TargetDefinition.from_hash(definition_hash, podfile)
        podfile.root_target_definitions << definition
      end
      podfile
    end

    #-------------------------------------------------------------------------#

    private

    # @!group Private helpers

    # @return [Hash] The hash which store the attributes of the Podfile.
    #
    attr_accessor :internal_hash

    # Set a value in the internal hash of the Podfile for the given key.
    #
    # @param  [String] key
    #         The key for which to store the value.
    #
    # @param  [Object] value
    #         The value to store.
    #
    # @raise  [StandardError] If the key is not recognized.
    #
    # @return [void]
    #
    def set_hash_value(key, value)
      unless HASH_KEYS.include?(key)
        raise StandardError, "Unsupported hash key `#{key}`"
      end
      internal_hash[key] = value
    end

    # Returns the value for the given key in the internal hash of the Podfile.
    #
    # @param  [String] key
    #         The key for which the value is needed.
    #
    # @param  default
    #         The default value to return if the internal hash has no entry for
    #         the given `key`.
    #
    # @raise  [StandardError] If the key is not recognized.
    #
    # @return [Object] The value for the key.
    #
    def get_hash_value(key, default = nil)
      unless HASH_KEYS.include?(key)
        raise StandardError, "Unsupported hash key `#{key}`"
      end
      internal_hash.fetch(key, default)
    end

    # @return [TargetDefinition] The current target definition to which the DSL
    #         commands apply.
    #
    attr_accessor :current_target_definition

    #-------------------------------------------------------------------------#
  end
end
