package com.incture.lch.adhoc.workflow.service;

import com.incture.lch.adhoc.workflow.dto.WorkflowApprovalTaskDto;
import com.incture.lch.dto.ResponseDataDto;

public interface WorkFlowServiceLocal {

	ResponseDataDto triggerWorkflow(WorkflowApprovalTaskDto triggerWorkFlowDto);

//	ResponseDataDto approveTask(ApproverUiDto approverUiDto);

}
