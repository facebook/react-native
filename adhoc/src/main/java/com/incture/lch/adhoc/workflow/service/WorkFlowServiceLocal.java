package com.incture.lch.adhoc.workflow.service;

import com.incture.lch.adhoc.dto.ResponseDataDto;
/*import com.incture.lch.adhoc.helper.ApproverUiDto;
import com.incture.lch.adhoc.helper.WorkFlowTriggerInputDto;*/
import com.incture.lch.adhoc.dto.WorkflowInputDto;

public interface WorkFlowServiceLocal {

	ResponseDataDto triggerWorkflow(WorkflowInputDto triggerWorkFlowDto);

//	ResponseDataDto approveTask(ApproverUiDto approverUiDto);

}
