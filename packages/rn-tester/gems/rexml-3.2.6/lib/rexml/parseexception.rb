# frozen_string_literal: false
module REXML
  class ParseException < RuntimeError
    attr_accessor :source, :parser, :continued_exception

    def initialize( message, source=nil, parser=nil, exception=nil )
      super(message)
      @source = source
      @parser = parser
      @continued_exception = exception
    end

    def to_s
      # Quote the original exception, if there was one
      if @continued_exception
        err = @continued_exception.inspect
        err << "\n"
        err << @continued_exception.backtrace.join("\n")
        err << "\n...\n"
      else
        err = ""
      end

      # Get the stack trace and error message
      err << super

      # Add contextual information
      if @source
        err << "\nLine: #{line}\n"
        err << "Position: #{position}\n"
        err << "Last 80 unconsumed characters:\n"
        err << @source.buffer[0..80].force_encoding("ASCII-8BIT").gsub(/\n/, ' ')
      end

      err
    end

    def position
      @source.current_line[0] if @source and defined? @source.current_line and
      @source.current_line
    end

    def line
      @source.current_line[2] if @source and defined? @source.current_line and
      @source.current_line
    end

    def context
      @source.current_line
    end
  end
end
