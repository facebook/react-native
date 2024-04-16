module Pod
  class Specification
    class Linter
      class Results
        public

        class Result
          # @return [Symbol] the type of result.
          #
          attr_reader :type

          # @return[String] the name of the attribute associated with result.
          #
          attr_reader :attribute_name

          # @return [String] the message associated with result.
          #
          attr_reader :message

          # @return [Boolean] whether the result only applies to public specs.
          #
          attr_reader :public_only
          alias_method :public_only?, :public_only

          # @param [Symbol] type    @see type
          # @param [String] message @see message
          #
          def initialize(type, attribute_name, message, public_only = false)
            @type = type
            @attribute_name = attribute_name
            @message = message
            @public_only = public_only
            @platforms = []
          end

          # @return [Array<Platform>] the platforms where this result was
          #         generated.
          #
          attr_reader :platforms

          # @return [String] a string representation suitable for UI output.
          #
          def to_s
            r = "[#{type.to_s.upcase}] [#{attribute_name}] #{message}"
            if platforms != Specification::PLATFORMS
              platforms_names = platforms.uniq.map do |p|
                Platform.string_name(p)
              end
              r << " [#{platforms_names * ' - '}]" unless platforms.empty?
            end
            r
          end
        end

        def initialize
          @results = []
          @consumer = nil
        end

        include Enumerable

        def each
          results.each { |r| yield r }
        end

        def empty?
          results.empty?
        end

        # @return [Specification::Consumer] the current consumer.
        #
        attr_accessor :consumer

        # Adds an error result with the given message.
        #
        # @param  [String] message
        #         The message of the result.
        #
        # @return [void]
        #
        def add_error(attribute_name, message, public_only = false)
          add_result(:error, attribute_name, message, public_only)
        end

        # Adds a warning result with the given message.
        #
        # @param  [String] message
        #         The message of the result.
        #
        # @return [void]
        #
        def add_warning(attribute_name, message, public_only = false)
          add_result(:warning, attribute_name, message, public_only)
        end

        private

        # @return [Array<Result>] all of the generated results.
        #
        attr_reader :results

        # Adds a result of the given type with the given message. If there is a
        # current platform it is added to the result. If a result with the same
        # type and the same message is already available the current platform is
        # added to the existing result.
        #
        # @param  [Symbol] type
        #         The type of the result (`:error`, `:warning`).
        #
        # @param  [String] message
        #         The message of the result.
        #
        # @return [void]
        #
        def add_result(type, attribute_name, message, public_only)
          result = results.find do |r|
            r.type == type && r.attribute_name == attribute_name && r.message == message && r.public_only? == public_only
          end
          unless result
            result = Result.new(type, attribute_name, message, public_only)
            results << result
          end
          result.platforms << @consumer.platform_name if @consumer
        end
      end
    end
  end
end
