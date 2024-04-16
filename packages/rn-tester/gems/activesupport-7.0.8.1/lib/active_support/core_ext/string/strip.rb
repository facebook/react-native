# frozen_string_literal: true

class String
  # Strips indentation in heredocs.
  #
  # For example in
  #
  #   if options[:usage]
  #     puts <<-USAGE.strip_heredoc
  #       This command does such and such.
  #
  #       Supported options are:
  #         -h         This message
  #         ...
  #     USAGE
  #   end
  #
  # the user would see the usage message aligned against the left margin.
  #
  # Technically, it looks for the least indented non-empty line
  # in the whole string, and removes that amount of leading whitespace.
  def strip_heredoc
    gsub(/^#{scan(/^[ \t]*(?=\S)/).min}/, "").tap do |stripped|
      stripped.freeze if frozen?
    end
  end
end
