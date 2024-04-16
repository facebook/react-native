# frozen_string_literal: true

module ActiveSupport
  module Testing
    # Logs a "PostsControllerTest: test name" heading before each test to
    # make test.log easier to search and follow along with.
    module TaggedLogging # :nodoc:
      attr_writer :tagged_logger

      def before_setup
        if tagged_logger && tagged_logger.info?
          heading = "#{self.class}: #{name}"
          divider = "-" * heading.size
          tagged_logger.info divider
          tagged_logger.info heading
          tagged_logger.info divider
        end
        super
      end

      private
        def tagged_logger
          @tagged_logger ||= (defined?(Rails.logger) && Rails.logger)
        end
    end
  end
end
