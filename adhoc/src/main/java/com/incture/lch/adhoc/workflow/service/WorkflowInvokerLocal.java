package com.incture.lch.adhoc.workflow.service;

import java.io.IOException;

import org.apache.http.HttpResponse;
import org.apache.http.client.ClientProtocolException;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * @author Ravi Kumar.P
 *
 */
public interface WorkflowInvokerLocal  {

	JSONObject triggerWorkflow(String input) throws ClientProtocolException, IOException, JSONException;

	HttpResponse approveTask(String input, String taskInstanceId)
			throws ClientProtocolException, IOException, JSONException;

	JSONArray getWorkflowTaskInstanceId(String workflowInstanceId)
			throws ClientProtocolException, IOException, JSONException;

	Boolean validateString(String input);

}