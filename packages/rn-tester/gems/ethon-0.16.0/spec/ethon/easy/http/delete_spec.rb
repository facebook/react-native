# frozen_string_literal: true
require 'spec_helper'

describe Ethon::Easy::Http::Delete do
  let(:easy) { Ethon::Easy.new }
  let(:url) { "http://localhost:3001/" }
  let(:params) { nil }
  let(:form) { nil }
  let(:delete) { described_class.new(url, {:params => params, :body => form}) }

  context "when requesting" do
    before do
      delete.setup(easy)
      easy.perform
    end

    it "makes a delete request" do
      expect(easy.response_body).to include('"REQUEST_METHOD":"DELETE"')
    end
  end
end
