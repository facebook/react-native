# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

class CodegenScriptPhaseExtractorMock

    attr_reader :extract_script_phase_params
    @script_phase

    def initialize(script_phase)
        @script_phase = script_phase
        @extract_script_phase_params = []
    end

    def extract_script_phase(options)
        @extract_script_phase_params.push(options)
        return @script_phase
    end

end
