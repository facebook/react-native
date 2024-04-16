# encoding: UTF-8

module TZInfo
  # Represents time zones that are defined as a link to or alias for another
  # time zone.
  class LinkedTimezone < InfoTimezone
    # Initializes a new {LinkedTimezone}.
    #
    # {LinkedTimezone} instances should not normally be created directly. Use
    # the {Timezone.get} method to obtain {Timezone} instances.
    #
    # @param info [DataSources::LinkedTimezoneInfo] a
    #   {DataSources::LinkedTimezoneInfo} instance supplied by a {DataSource}
    #   that will be used as the source of data for this {LinkedTimezone}.
    def initialize(info)
      super
      @linked_timezone = Timezone.get(info.link_to_identifier)
    end

    # (see Timezone#period_for)
    def period_for(time)
      @linked_timezone.period_for(time)
    end

    # (see Timezone#periods_for_local)
    def periods_for_local(local_time)
      @linked_timezone.periods_for_local(local_time)
    end

    # (see Timezone#transitions_up_to)
    def transitions_up_to(to, from = nil)
      @linked_timezone.transitions_up_to(to, from)
    end

    # Returns the canonical {Timezone} instance for this {LinkedTimezone}.
    #
    # For a {LinkedTimezone}, this is the canonical zone of the link target.
    #
    # @return [Timezone] the canonical {Timezone} instance for this {Timezone}.
    def canonical_zone
      @linked_timezone.canonical_zone
    end
  end
end
