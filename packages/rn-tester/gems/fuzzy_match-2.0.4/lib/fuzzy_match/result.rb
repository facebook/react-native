# encoding: utf-8
require 'erb'
require 'pp'

class FuzzyMatch
  class Result #:nodoc: all
    EXPLANATION = <<-ERB
#####################################################
# SUMMARY
#####################################################

Needle: <%= needle.inspect %>
Match:  <%= winner.inspect %>

#####################################################
# OPTIONS
#####################################################

<%= PP.pp(options, '') %>

<% timeline.each_with_index do |event, index| %>
(<%= index+1 %>) <%= event %>
<% end %>
ERB

    attr_accessor :needle
    attr_accessor :read
    attr_accessor :haystack
    attr_accessor :options
    attr_accessor :groupings
    attr_accessor :identities
    attr_accessor :stop_words
    attr_accessor :winner
    attr_accessor :score
    attr_reader :timeline

    def initialize
      @timeline = []
    end
    
    def explain
      $stdout.puts ::ERB.new(EXPLANATION, 0, '%<').result(binding)
    end
  end
end
