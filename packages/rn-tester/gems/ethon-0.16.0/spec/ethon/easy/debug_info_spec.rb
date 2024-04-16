# frozen_string_literal: true
require 'spec_helper'

describe Ethon::Easy::DebugInfo do
  let(:easy) { Ethon::Easy.new }

  before do
    easy.url = "http://localhost:3001/"
    easy.perform
  end

  describe "#debug_info" do
    context "when verbose is not set to true" do
      it "does not save any debug info after a request" do
        expect(easy.debug_info.to_a.length).to eq(0)
        expect(easy.debug_info.to_h.values.flatten.length).to eq(0)
      end
    end

    context "when verbose is set to true" do
      before do
        easy.verbose = true
        easy.perform
      end

      after do
        easy.verbose = false
        easy.reset
      end

      it "saves debug info after a request" do
        expect(easy.debug_info.to_a.length).to be > 0
      end

      it "saves request headers" do
        expect(easy.debug_info.header_out.join).to include('GET / HTTP/1.1')
      end

      it "saves response headers" do
        expect(easy.debug_info.header_in.length).to be > 0
        expect(easy.response_headers).to include(easy.debug_info.header_in.join)
      end

      it "saves incoming data" do
        expect(easy.debug_info.data_in.length).to be > 0
        expect(easy.response_body).to include(easy.debug_info.data_in.join)
      end

      it "saves debug text" do
        expect(easy.debug_info.text.length).to be > 0
      end
    end
  end
end
