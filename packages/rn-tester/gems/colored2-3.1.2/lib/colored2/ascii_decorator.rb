require 'colored2/codes'
require 'forwardable'

module Colored2
  def self.enable!
    Colored2::AsciiDecorator.enable!
  end
  def self.disable!
    Colored2::AsciiDecorator.disable!
  end
  def self.background_next!
    Colored2::AsciiDecorator.background_next!
  end
  def self.foreground_next!
    Colored2::AsciiDecorator.foreground_next!
  end
  def self.background_next?
    Colored2::AsciiDecorator.background_next?
  end

  class AsciiDecorator
    @__background_next = false
    @__colors_disabled = false
    class << self
      attr_accessor :__background_next, :__colors_disabled
      def enable!
        self.__colors_disabled = false
      end
      def enabled?
        !self.__colors_disabled
      end
      def disable!
        self.__colors_disabled = true
      end
      def background_next!
        self.__background_next = true
      end
      def foreground_next!
        self.__background_next = false
      end
      def background_next?
        self.__background_next
      end
    end

    extend Forwardable
    def_delegators :@my_class, :enable!, :disable!

    attr_accessor :string, :my_class

    def initialize(a_string)
      self.string = a_string.instance_of?(Object) ? '' : a_string.to_s
      self.my_class = self.class
    end

    # options[:start] = :color
    # options[:end]   = :color | :no_color
    def decorate(options = {})
      return string if !self.class.enabled? || string.length == 0
      escape_sequence = [
        Colored2::TextColor.new(options[:foreground]),
        Colored2::BackgroundColor.new(options[:background]),
        Colored2::Effect.new(options[:effect])
      ].compact.join

      colored = ''
      colored << escape_sequence if options[:beginning] == :on
      colored << string
      if options[:end]
        colored << no_color if options[:end] == :off && !colored.end_with?(no_color)
        colored << escape_sequence if options[:end] == :on
      end
      colored
    end

    def un_decorate
      string.gsub(%r{\e\[\d+(;\d+)*m}, '')
    end

    private

    def no_color
      @no_color ||= Colored2::Effect.new(:no_color).to_s
    end
  end
end
