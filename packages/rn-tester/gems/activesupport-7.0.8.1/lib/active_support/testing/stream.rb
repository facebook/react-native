# frozen_string_literal: true

module ActiveSupport
  module Testing
    module Stream # :nodoc:
      private
        def silence_stream(stream)
          old_stream = stream.dup
          stream.reopen(IO::NULL)
          stream.sync = true
          yield
        ensure
          stream.reopen(old_stream)
          old_stream.close
        end

        def quietly(&block)
          silence_stream(STDOUT) do
            silence_stream(STDERR, &block)
          end
        end

        def capture(stream)
          stream = stream.to_s
          captured_stream = Tempfile.new(stream)
          stream_io = eval("$#{stream}")
          origin_stream = stream_io.dup
          stream_io.reopen(captured_stream)

          yield

          stream_io.rewind
          captured_stream.read
        ensure
          captured_stream.close
          captured_stream.unlink
          stream_io.reopen(origin_stream)
        end
    end
  end
end
