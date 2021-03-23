package com.incture.lch.workflow.controller;

import java.io.IOException;

import org.apache.http.client.ClientProtocolException;
import org.json.JSONException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.incture.lch.workflow.service.AdhocWorkflowService;
import com.incture.lch.workflow.dto.AdhocWorkflowCustomDto;
import com.incture.lch.workflow.dto.WorkflowCustomDto;

@RestController
@RequestMapping(value = "/workflow")
public class WorkflowController {
	private final Logger MYLOGGER = LoggerFactory.getLogger(this.getClass());

	@Autowired
	private AdhocWorkflowService adhocWorkflowService;

	@RequestMapping(value = "/updateApprovalWorkflowDetails", method = RequestMethod.POST)
	public String updateApprovalWorkflowDetails(@RequestBody WorkflowCustomDto obj)
			throws ClientProtocolException, IOException, JSONException {
		MYLOGGER.error("ENTERING INTO updateApprovalWorkflowDetails CONTROLLER");
		return adhocWorkflowService.updateApprovalWorflowDetails(obj);
	}
	
	@RequestMapping(value = "/updateWorflowDetailsForType4", method = RequestMethod.POST)
	public String updateWorflowDetailsForType4(@RequestBody AdhocWorkflowCustomDto obj)
			throws ClientProtocolException, IOException, JSONException {
		MYLOGGER.error("ENTERING INTO updateApprovalWorkflowDetails CONTROLLER");
		return adhocWorkflowService.updateApprovalWorflowDetailsForType4(obj);
	}

}
