package com.incture.lch.workflow.service;

import java.io.IOException;

import org.apache.http.HttpResponse;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpRequestBase;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.util.EntityUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.incture.lch.workflow.constant.WorkflowConstants;
import com.incture.lch.workflow.dto.AdhocWorkflowCustomDto;
import com.incture.lch.workflow.dto.WorkflowCustomDto;
import com.incture.lch.workflow.util.ServiceUtil;

@Service
public class AdhocWorkflowService {

	private final Logger MYLOGGER = LoggerFactory.getLogger(this.getClass());

	private String url;
	private String clientid;
	private String clientsecret;

	public AdhocWorkflowService() {
		try {
			JSONObject jsonObj = new JSONObject(System.getenv("VCAP_SERVICES"));
			System.err.println("[WorkflowInvoker:VCAP_SERVICES] : " + jsonObj.toString());

			JSONArray jsonArr = jsonObj.getJSONArray("xsuaa");
			JSONObject credentials = jsonArr.getJSONObject(0).getJSONObject("credentials");
			clientid = credentials.getString("clientid");
			clientsecret = credentials.getString("clientsecret");
			url = credentials.getString("url");

			System.err.println("[WorkflowInvoker] : " + jsonArr.toString());

		} catch (JSONException e) {
			MYLOGGER.error("[WorkflowInvoker] reading environmental variables failed:" + e.getMessage());
		}
	}

	private String getBearerToken(CloseableHttpClient httpClient)
			throws ClientProtocolException, IOException, JSONException {
		MYLOGGER.info("LCH | WorkflowInvoker | getBearerToken | Execution Start ");
		HttpRequestBase httpRequestBase = new HttpPost(url + "/oauth/token?grant_type=client_credentials");
		ServiceUtil.getBasicAuthWorkflow(clientid, clientsecret);
		httpRequestBase.addHeader(WorkflowConstants.AUTHORIZATION, ServiceUtil.getBasicAuth(clientid, clientsecret));
		try {
			HttpResponse httpResponse = httpClient.execute(httpRequestBase);
			ServiceUtil.getBasicAuthWorkflow(clientid, clientsecret);
			String jsonString = EntityUtils.toString(httpResponse.getEntity());
			JSONObject responseObj = new JSONObject(jsonString);
			String token = responseObj.getString("access_token");
			MYLOGGER.info("LCH | WorkflowInvoker | getBearerToken | Execution End ");
			return token;
		} catch (Exception e) {
			MYLOGGER.info("LCH | WorkflowInvoker | getBearerToken | Exception " + e.toString());
		}

		return null;

	}

	public String callLchAppToUpdateWorkflowTables(WorkflowCustomDto input)
			throws ClientProtocolException, IOException, JSONException {
		MYLOGGER.error("Enter into AdhocOWorkflowService: callLchAppToUpdateWorkflowTables:");
		RestTemplate callRestApi = new RestTemplate();

		try {
			CloseableHttpClient httpClient = HttpClientBuilder.create().build();
			String bearerToken = getBearerToken(httpClient);
			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);
			headers.set("Authorization", "Bearer " + bearerToken);
			HttpEntity<WorkflowCustomDto> entity = new HttpEntity<WorkflowCustomDto>(input, headers);
			String responseMessage = callRestApi.postForObject(WorkflowConstants.LCH_APP_URL_FOR_UPDATE, entity,
					String.class);
			MYLOGGER.error("Enter into AdhocOWorkflowService: callLchAppToUpdateWorkflowTables:responseMessage "
					+ responseMessage);

			return responseMessage;
		} catch (Exception e) {
			MYLOGGER.error("AdhocOWorkflowService: callLchAppToUpdateWorkflowTables: error " + e.toString());
		}
		return null;

	}

	public String callLchAppToUpdateWorkflowTables(AdhocWorkflowCustomDto input)
			throws ClientProtocolException, IOException, JSONException {
		MYLOGGER.error("Enter into AdhocOWorkflowService: callLchAppToUpdateWorkflowTables:");
		RestTemplate callRestApi = new RestTemplate();

		try {
			CloseableHttpClient httpClient = HttpClientBuilder.create().build();
			String bearerToken = getBearerToken(httpClient);
			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);
			headers.set("Authorization", "Bearer " + bearerToken);
			HttpEntity<AdhocWorkflowCustomDto> entity = new HttpEntity<AdhocWorkflowCustomDto>(input, headers);
			String responseMessage = callRestApi.postForObject(WorkflowConstants.LCH_APP_URL_FOR_UPDATETYPE4, entity,
					String.class);
			MYLOGGER.error("Enter into AdhocOWorkflowService: callLchAppToUpdateWorkflowTables:responseMessage "
					+ responseMessage);

			return responseMessage;
		} catch (Exception e) {
			MYLOGGER.error("AdhocOWorkflowService: callLchAppToUpdateWorkflowTables: error " + e.toString());
		}
		return null;

	}

	public String updateApprovalWorflowDetails(WorkflowCustomDto obj)
			throws ClientProtocolException, JSONException, IOException {
		MYLOGGER.error("AdhocOWorkflowService: updateApprovalWorflowDetails: enter ");
		return callLchAppToUpdateWorkflowTables(obj);
	}

	public String updateApprovalWorflowDetailsForType4(AdhocWorkflowCustomDto obj)
			throws ClientProtocolException, JSONException, IOException {
		// TODO Auto-generated method stub
		MYLOGGER.error("AdhocOWorkflowService: updateApprovalWorflowDetailsForType4: enter ");
		return callLchAppToUpdateWorkflowTables(obj);
	}

}
