require 'set'

module Pod
  class Installer
    class Analyzer
      # Collects all {PodVariant}.
      class PodVariantSet
        # @return [Array<PodVariant>] the different variants within this set.
        #
        attr_reader :variants

        # Initialize a new instance.
        #
        # @param [Array<PodVariant>] variants  @see #variants
        #
        def initialize(variants)
          @variants = variants
        end

        # Describes what makes each {PodVariant} distinct among the others.
        #
        # @return [Hash<PodVariant, String>]
        #
        def scope_suffixes
          return { variants.first => nil } if variants.count == 1
          Hash[scope_by_specs.map do |variant, scope|
            require 'digest'
            scope = Digest::MD5.hexdigest(scope)[0..7] if !scope.nil? && scope.length >= 50
            [variant, scope]
          end]
        end

        # Groups the collection by result of the block.
        #
        # @param [Block<Variant, #hash>] block
        # @return [Array<PodVariantSet>]
        #
        def group_by(&block)
          variants.group_by(&block).map { |_, v| PodVariantSet.new(v) }
        end

        # @private
        #
        # Prepends the given scoped {PodVariant}s with another scoping label, if there
        # was more than one group of {PodVariant}s given.
        #
        # @param [Array<Hash<PodVariant, String>>] scoped_variants
        #        {PodVariant}s, which where grouped on base of a criteria, which is used
        #        in the block argument to generate a descriptive label.
        #
        # @param [Block<PodVariant, String>] block
        #        takes a {PodVariant} and returns a scope suffix which is prepended, if
        #        necessary.
        #
        # @return [Hash<PodVariant, String>]
        #
        def scope_if_necessary(scoped_variants, &block)
          if scoped_variants.count == 1
            return scoped_variants.first
          end
          Hash[scoped_variants.flat_map do |variants|
            variants.map do |variant, suffix|
              prefix = block.call(variant)
              scope = [prefix, suffix].compact.join('-')
              [variant, !scope.empty? ? scope : nil]
            end
          end]
        end

        # @private
        # @return [Hash<PodVariant, String>]
        #
        def scope_by_build_type
          scope_if_necessary(group_by { |v| v.build_type.packaging }.map(&:scope_by_linkage)) do |variant|
            variant.build_type.packaging
          end
        end

        # @private
        # @return [Hash<PodVariant, String>]
        #
        def scope_by_linkage
          scope_if_necessary(group_by { |v| v.build_type.linkage }.map(&:scope_by_platform)) do |variant|
            variant.build_type.linkage
          end
        end

        # @private
        # @return [Hash<PodVariant, String>]
        #
        def scope_by_platform
          grouped_variants = group_by { |v| v.platform.name }
          if grouped_variants.all? { |set| set.variants.count == 1 }
            # => Platform name
            platform_name_proc = proc { |v| Platform.string_name(v.platform.symbolic_name).tr(' ', '') }
          else
            grouped_variants = group_by(&:platform)
            # => Platform name + SDK version
            platform_name_proc = proc { |v| v.platform.to_s.tr(' ', '') }
          end
          scope_if_necessary(grouped_variants.map(&:scope_by_swift_version), &platform_name_proc)
        end

        # @private
        # @return [Hash<PodVariant, String>]
        #
        def scope_by_swift_version
          scope_if_necessary(group_by(&:swift_version).map(&:scope_without_suffix)) do |variant|
            variant.swift_version ? "Swift#{variant.swift_version}" : ''
          end
        end

        # @private
        # @return [Hash<PodVariant, String>]
        #
        def scope_by_specs
          root_spec = variants.first.root_spec
          specs = [root_spec]
          specs += if root_spec.default_subspecs.empty?
                     root_spec.subspecs.compact
                   else
                     root_spec.default_subspecs.map do |subspec_name|
                       root_spec.subspec_by_name("#{root_spec.name}/#{subspec_name}")
                     end
                   end
          default_specs = Set.new(specs)
          grouped_variants = group_by(&:specs)
          all_spec_variants = grouped_variants.map { |set| set.variants.first.specs }
          common_specs = all_spec_variants.map(&:to_set).flatten.inject(&:&)
          omit_common_specs = common_specs.any? && common_specs.proper_superset?(default_specs)
          scope_if_necessary(grouped_variants.map(&:scope_by_build_type)) do |variant|
            specs = variant.specs.to_set

            # The current variant contains all default specs
            omit_default_specs = default_specs.any? && default_specs.subset?(specs)
            if omit_default_specs
              specs -= default_specs
            end

            # There are common specs, which are different from the default specs
            if omit_common_specs
              specs -= common_specs
            end

            spec_names = specs.map do |spec|
              spec.root? ? '.root' : spec.name.split('/')[1..-1].join('_')
            end.sort
            if spec_names.empty?
              omit_common_specs ? '.common' : nil
            else
              if omit_common_specs
                spec_names.unshift('.common')
              elsif omit_default_specs
                spec_names.unshift('.default')
              end
              spec_names.reduce('') do |acc, name|
                "#{acc}#{acc.empty? || name[0] == '.' ? '' : '-'}#{name}"
              end
            end
          end
        end

        # @private
        #
        # Helps to define scope suffixes recursively.
        #
        # @return [Hash<PodVariant, String>]
        #
        def scope_without_suffix
          Hash[variants.map { |v| [v, nil] }]
        end
      end
    end
  end
end
