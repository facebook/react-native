package com.incture.lch.adhoc.workflow.service;

import java.util.Date;

import javax.transaction.Transactional;

import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.incture.lch.adhoc.dao.AdhocOrderWorkflowDao;
import com.incture.lch.adhoc.dto.AdhocOrderWorkflowDto;
import com.incture.lch.adhoc.dto.ResponseDataDto;
/*import com.incture.lch.adhoc.dao.WorkflowDao;
import com.incture.lch.adhoc.dao.WorkflowTaskDao;
import com.incture.lch.adhoc.dto.WorkFlowTaskDto;
import com.incture.lch.adhoc.dto.WorkflowDto;*/
import com.incture.lch.adhoc.dto.WorkflowInputDto;
import com.incture.lch.adhoc.util.ServicesUtil;
import com.incture.lch.adhoc.workflow.constant.WorkflowConstants;

/**
 * @author Ravi Kumar P
 *
 */
@Transactional
@Service
public class WorkFlowService implements WorkFlowServiceLocal {

	private final Logger MYLOGGER = LoggerFactory.getLogger(this.getClass());

	@Autowired
	private AdhocOrderWorkflowDao adhocOrderWorkflowDao;

	@Autowired
	private WorkflowInvokerLocal workflowInvokerLocal;

	/**
	 * Trigger workflow
	 * 
	 * @param WorkFlowTriggerInputDto
	 * @return ResponseDto Success/Failure message
	 */
	@Override
	public ResponseDataDto triggerWorkflow(WorkflowInputDto triggerWorkFlowDto) {
		MYLOGGER.info(
				"LCH | WorkFlowService | triggerWorkflow | Execution Start Input : " + triggerWorkFlowDto.toString());
		ResponseDataDto responseDto = new ResponseDataDto();
		try {

			String wfInput = buildWorkflowTriggerPayload(triggerWorkFlowDto);
			MYLOGGER.debug("LCH | WorkFlowService | triggerWorkflow | wfInput : " + wfInput);
			// Map<String, String> destinationProperties = callDestination();
			JSONObject resWfObj = workflowInvokerLocal.triggerWorkflow(wfInput);
			AdhocOrderWorkflowDto workflowDto = new AdhocOrderWorkflowDto();
			workflowDto.setInstanceId(resWfObj.getString("id"));
			workflowDto.setDefinitionId(resWfObj.getString("definitionId"));
			workflowDto.setWorkflowName("AdhocOrders");
			workflowDto.setSubject(resWfObj.getString("subject"));
			workflowDto.setBusinessKey(triggerWorkFlowDto.getAdhocInfo().getUserId());
			workflowDto.setRequestedDate(ServicesUtil.convertDate(new Date()));
			workflowDto.setStatus(WorkflowConstants.INPROGRESS);
			workflowDto.setRequestedBy(resWfObj.getString("createdBy"));
			adhocOrderWorkflowDao.saveWorkFlowDetails(workflowDto);
			responseDto.setStatus(Boolean.TRUE);
			responseDto.setStatusCode(200);
		} catch (Exception e) {
			MYLOGGER.error("LCH | WorkFlowService | triggerWorkflow | Exception : " + e.getMessage());
			responseDto.setStatus(Boolean.FALSE);
			responseDto.setStatusCode(500);
			responseDto.setMessage(e.getMessage());
		}
		MYLOGGER.info("LCH | WorkFlowService | triggerWorkflow | Execution Output : " + responseDto.toString());
		return responseDto;
	}

	/**
	 * Approve Task
	 * 
	 * @param ApproverUiDto
	 * @return ResponseDto Success/Failure message
	 */
	/*
	 * @Override public ResponseDataDto approveTask(ApproverUiDto approverUiDto)
	 * { MYLOGGER.
	 * info("LCH | WorkFlowService | approveTask | Execution Start Input : " +
	 * approverUiDto.toString()); ResponseDataDto responseDto = new
	 * ResponseDataDto(); try { responseDto.setStatus(Boolean.TRUE);
	 * responseDto.setStatusCode(200); // Map<String, String>
	 * destinationProperties = callDestination(); Object[] workflowInstanceId =
	 * workFlowTaskDao.getWorkflowInstanceId(approverUiDto.getTaskId());
	 * JSONArray taskArray =
	 * workflowInvokerLocal.getWorkflowTaskInstanceId((String)
	 * workflowInstanceId[3]); JSONObject taskObj = taskArray.getJSONObject(0);
	 * String taskInstanceId = taskObj.getString(WorkflowConstants.ID); String
	 * input = buildWorkflowApproverPayload(approverUiDto); HttpResponse
	 * wfResponse = workflowInvokerLocal.approveTask(input, taskInstanceId); if
	 * ((wfResponse.getStatusLine().getStatusCode()) ==
	 * WorkflowConstants.SUCCESS_CODE) {
	 * workFlowTaskDao.updateTaskDetails(approverUiDto); } } catch (Exception e)
	 * { MYLOGGER.error("LCH | WorkFlowService | approveTask | Exception : " +
	 * e.getMessage()); responseDto.setStatus(Boolean.FALSE);
	 * responseDto.setStatusCode(500); responseDto.setMessage(e.getMessage()); }
	 * MYLOGGER.info("LCH | WorkFlowService | approveTask | Execution Output : "
	 * + responseDto.toString()); return responseDto; }
	 */

	/**
	 * Build payload for trigger workflow
	 * 
	 * @param WorkFlowTriggerInputDto
	 * @throws JSONException
	 * @return Context Json string
	 */
	private String buildWorkflowTriggerPayload(WorkflowInputDto triggerWorkFlowDto) throws JSONException {
		JSONObject reponse = new JSONObject();
		JSONObject context = new JSONObject();
		reponse.put(WorkflowConstants.DEFINITION_ID, WorkflowConstants.USER_WF_DEFINITION_ID);
		context.put("adhocType", triggerWorkFlowDto.getAdhocType());
		context.put("createdBy",
				(triggerWorkFlowDto.getRequestedBy() == null ? "" : triggerWorkFlowDto.getRequestedBy()));
		context.put("manager", triggerWorkFlowDto.getManager());
		context.put("planner", triggerWorkFlowDto.getPlanner());
		context.put("adhocInfo", triggerWorkFlowDto.getAdhocInfo());
		/*
		 * context.put("roleId", triggerWorkFlowDto.getRoleId());
		 * context.put("inboxUrl", triggerWorkFlowDto.getApproverInboxLink() !=
		 * null ? triggerWorkFlowDto.getApproverInboxLink() : "");
		 */
		reponse.put(WorkflowConstants.CONTEXT, context);
		return reponse.toString();
	}

	/**
	 * Build payload for approve task
	 * 
	 * @param ApproverUiDto
	 * @throws JSONException
	 * @return Context Json string
	 */
	/*
	 * private String buildWorkflowApproverPayload(ApproverUiDto approverUiDto)
	 * throws JSONException { JSONObject response = new JSONObject(); JSONObject
	 * context = new JSONObject(); response.put(WorkflowConstants.STATUS,
	 * "completed"); context.put("status", approverUiDto.getStatus());
	 * context.put("approverComments", approverUiDto.getApproverComments()); if
	 * (ServicesUtil.isEmpty(approverUiDto.getApproverName())) {
	 * context.put("approverName", " "); } else { context.put("approverName",
	 * approverUiDto.getApproverName()); } context.put("approverId",
	 * approverUiDto.getApproverId()); if
	 * (approverUiDto.getStatus().equals(WorkflowConstants.APPROVED)) {
	 * context.put("isApproved", Boolean.TRUE); } else {
	 * context.put("isApproved", Boolean.FALSE); }
	 * response.put(WorkflowConstants.CONTEXT, context); return
	 * response.toString(); }
	 */

	// private Map<String, String> callDestination() throws NamingException {
	// return
	// DestinationReaderUtil.getDestination(ApplicationConstants.WORKFLOW_DEST_NAME);
	// }
}
