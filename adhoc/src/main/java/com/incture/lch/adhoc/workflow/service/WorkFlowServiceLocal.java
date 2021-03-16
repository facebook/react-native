package com.incture.lch.adhoc.workflow.service;

import com.incture.lch.adhoc.dto.ResponseDataDto;
import com.incture.lch.adhoc.workflow.dto.WorkflowApprovalTaskDto;

public interface WorkFlowServiceLocal {

	ResponseDataDto triggerWorkflow(WorkflowApprovalTaskDto triggerWorkFlowDto);

//	ResponseDataDto approveTask(ApproverUiDto approverUiDto);

}
