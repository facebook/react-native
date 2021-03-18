package com.incture.lch.adhoc.workflow.service;

import java.util.Date;

import javax.transaction.Transactional;

import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.incture.lch.adhoc.workflow.constant.WorkflowConstants;
import com.incture.lch.adhoc.workflow.dto.WorkflowApprovalTaskDto;
import com.incture.lch.dao.AdhocOrderWorkflowDao;
import com.incture.lch.dto.AdhocOrderWorkflowDto;
import com.incture.lch.dto.ResponseDataDto;
import com.incture.lch.helper.AdhocOrderWorkflowHelper;
import com.incture.lch.util.ServicesUtil;

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
	
	@Autowired
	private AdhocOrderWorkflowHelper adhocOrderDao;

	/** 
	 * Trigger workflow
	 * 
	 * @param WorkFlowTriggerInputDto
	 * @return ResponseDto Success/Failure message
	 */
	@Override
	public ResponseDataDto triggerWorkflow(WorkflowApprovalTaskDto triggerWorkFlowDto) {
		MYLOGGER.info(
				"LCH | WorkFlowService | triggerWorkflow | Execution Start Input : " + triggerWorkFlowDto.toString());
		ResponseDataDto responseDto = new ResponseDataDto();
		try {

			String wfInput = buildWorkflowTriggerPayload(triggerWorkFlowDto);
			MYLOGGER.error("LCH | WorkFlowService | triggerWorkflow | wfInput : " + wfInput);
			// Map<String, String> destinationProperties = callDestination();
			JSONObject resWfObj = workflowInvokerLocal.triggerWorkflow(wfInput);
			MYLOGGER.error("LCH | WorkFlowService | triggerWorkflow | JSON WORKFLOW OUT DATA : " + resWfObj.toString());
			AdhocOrderWorkflowDto workflowDto = new AdhocOrderWorkflowDto();
			workflowDto.setInstanceId(resWfObj.getString("id"));
			workflowDto.setDefinitionId(resWfObj.getString("definitionId"));
			workflowDto.setWorkflowName("AdhocOrders");
			workflowDto.setSubject(resWfObj.getString("subject"));
			//workflowDto.setDescription(resWfObj.getString("description"));
			workflowDto.setBusinessKey(triggerWorkFlowDto.getAdhocOrderInfo().getUserId());
			workflowDto.setRequestedDate(ServicesUtil.convertDate(new Date()));
			workflowDto.setStatus(WorkflowConstants.PENDING_AT_MANAGER);
			workflowDto.setRequestedBy(resWfObj.getString("startedBy"));
			workflowDto.setPendingWith(triggerWorkFlowDto.getManager());
			adhocOrderDao.updateWorflowDetails(workflowDto);
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
	private String buildWorkflowTriggerPayload(WorkflowApprovalTaskDto triggerWorkFlowDto) throws JSONException {
		JSONObject reponse = new JSONObject();
		JSONObject context = new JSONObject();
		reponse.put(WorkflowConstants.DEFINITION_ID, WorkflowConstants.USER_WF_DEFINITION_ID);
		context.put("type", triggerWorkFlowDto.getAdhocType());
		context.put("firstName", triggerWorkFlowDto.getCreatedBy());
		context.put("lastName", triggerWorkFlowDto.getUserName());
		context.put("createdDate", triggerWorkFlowDto.getCreatedDate());
		context.put("userId",triggerWorkFlowDto.getUserId());
		context.put("userEmail",triggerWorkFlowDto.getUserEmail());
		context.put("manager", triggerWorkFlowDto.getManager());
		context.put("planner", triggerWorkFlowDto.getPlanner());
		
		//context.put("createdBy",
			//	(triggerWorkFlowDto.getUserId() == null ? "" : triggerWorkFlowDto.getCreatedBy()));
		//context.put("manager", triggerWorkFlowDto.getManager());
		//context.put("planner", triggerWorkFlowDto.getPlanner());
		//context.put("adhocInfo", triggerWorkFlowDto.getAdhocOrderInfo());
		
		context.put("adhocOrderId",triggerWorkFlowDto.getAdhocOrderId());
		context.put("businessDivision",triggerWorkFlowDto.getBusinessDivision());
		context.put("charge",triggerWorkFlowDto.getCharge());
		
		//context.put("createdBy",triggerWorkFlowDto.getCreatedBy());
		//context.put("createdDate",triggerWorkFlowDto.getCreatedDate());
		
		
		context.put("countryOrigin",triggerWorkFlowDto.getCountryOrigin());
		context.put("currency",triggerWorkFlowDto.getCurrency());
		context.put("customerOrderNo",triggerWorkFlowDto.getCustomerOrderNo());
		context.put("destinationName",triggerWorkFlowDto.getDestinationName());
		context.put("destinationCity",triggerWorkFlowDto.getDestinationCity());
		context.put("destinationState",triggerWorkFlowDto.getDestinationState());
		context.put("destinationZip",triggerWorkFlowDto.getDestinationZip());
		context.put("destinationAddress",triggerWorkFlowDto.getDestinationAddress());
		context.put("dimensionL",triggerWorkFlowDto.getDimensionL());
		context.put("dimensionH",triggerWorkFlowDto.getDimensionH());
		context.put("dimensionB",triggerWorkFlowDto.getDimensionB());
		context.put("expectedDeliveryDate",triggerWorkFlowDto.getExpectedDeliveryDate());
		context.put("glcode",triggerWorkFlowDto.getGlcode());
		context.put("hazmatNumber",triggerWorkFlowDto.getHazmatNumber());
		context.put("originAddress",triggerWorkFlowDto.getOriginAddress());
		context.put("originCity",triggerWorkFlowDto.getOriginCity());
		context.put("originState",triggerWorkFlowDto.getOriginState());
		context.put("originZip",triggerWorkFlowDto.getOriginZip());
		context.put("isInternational",triggerWorkFlowDto.getIsInternational());
		
		
		//context.put("isTruck",triggerWorkFlowDto.getIsTruck());
		
		
		context.put("isHazmat",triggerWorkFlowDto.getIsHazmat());
		context.put("packageType",triggerWorkFlowDto.getPackageType());
		context.put("partNum",triggerWorkFlowDto.getPartNum());
		context.put("partDescription",triggerWorkFlowDto.getPartDescription());
		context.put("PODataNumber",triggerWorkFlowDto.getPODataNumber());
		context.put("premiumFreight",triggerWorkFlowDto.getPremiumFreight());
		context.put("projectNumber",triggerWorkFlowDto.getProjectNumber());
		context.put("quantity",triggerWorkFlowDto.getQuantity());
		context.put("reasonCode",triggerWorkFlowDto.getReasonCode());
		context.put("receivingContact",triggerWorkFlowDto.getReceivingContact());
		context.put("referenceNumber",triggerWorkFlowDto.getReferenceNumber());
		context.put("shipDate",triggerWorkFlowDto.getShipDate());
		context.put("shipperName",triggerWorkFlowDto.getShipperName());
		context.put("shippingInstruction",triggerWorkFlowDto.getShippingInstruction());
		context.put("shippingContact",triggerWorkFlowDto.getShippingContact());
		context.put("terms",triggerWorkFlowDto.getTerms());
		context.put("uom",triggerWorkFlowDto.getUom());
		context.put("value",triggerWorkFlowDto.getValue());
		context.put("weight",triggerWorkFlowDto.getWeight());
		
		
		//context.put("vinNumber",triggerWorkFlowDto.getVinNumber());
		
		
		context.put("shipperNameFreeText",triggerWorkFlowDto.getShipperNameFreeText());
		context.put("originCountry",triggerWorkFlowDto.getOriginCountry());
		context.put("destinationNameFreeText",triggerWorkFlowDto.getDestinationNameFreeText());
		context.put("destinationCountry",triggerWorkFlowDto.getDestinationCountry());
		context.put("hazmatUn",triggerWorkFlowDto.getHazmatUn());
		context.put("weightUom",triggerWorkFlowDto.getWeightUom());
		context.put("dimensionsUom",triggerWorkFlowDto.getDimensionsUom());
		context.put("shipperNameDesc",triggerWorkFlowDto.getShipperNameDesc());
		context.put("destinationNameDesc",triggerWorkFlowDto.getDestinationNameDesc());
		context.put("premiumReasonCode",triggerWorkFlowDto.getPremiumReasonCode());
		context.put("plannerEmail",triggerWorkFlowDto.getPlannerEmail());
		context.put("adhocType",triggerWorkFlowDto.getAdhocType());
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
