package com.incture.lch.repository;

import java.util.List;
import java.util.Map;

import org.json.JSONException;
import org.json.simple.JSONObject;

import com.incture.lch.dto.AdhocOrderDto;
import com.incture.lch.dto.AdhocOrderWorkflowDto;
import com.incture.lch.dto.AdhocRequestDto;
import com.incture.lch.dto.LkCountriesDto;
import com.incture.lch.dto.LkDivisionsDto;
import com.incture.lch.dto.LkShipperDetailsDto;
import com.incture.lch.dto.PartNumberDescDto;
import com.incture.lch.dto.ReasonCodeDto;
import com.incture.lch.dto.ResponseDto;
import com.incture.lch.entity.AdhocOrders;

public interface AdhocOrdersRepository {

	public AdhocOrderDto exportAdhocOrdersDto(AdhocOrders adhocOrders);

	public AdhocOrders importAdhocOrdersDto(AdhocOrderDto adhocOrdersDto);

	public List<AdhocOrderDto> getAllAdhocOrders();

	List<AdhocOrderDto> getKpi(int days,AdhocRequestDto adhocRequestDto);
	
	
	public List<AdhocOrderDto> getDrafts(AdhocRequestDto adhocRequestDto);

	public ResponseDto addAdhocOrders(AdhocOrderDto adhocOrdersDto);
	
	
	public AdhocOrderDto saveAdhocOrders(AdhocOrderDto adhocOrdersDto);

	public int deleteAdhocOrders(String adhocOrderId, String userId, String partNum);

	public List<AdhocOrderDto> getAdhocOrders(AdhocRequestDto adhocRequestDto);

	public Map<String, List<ReasonCodeDto>> getReasonCode();

	public ResponseDto addReasonCode(ReasonCodeDto reasonCodeDto);

	public String getReasonCodeDescById(String id);

	public List<LkShipperDetailsDto> getShipperDetails(String shipperName);

	public List<LkDivisionsDto> getAllDivisions();

	public List<LkCountriesDto> getAllCountries();
	
	public List<LkShipperDetailsDto> getAllShipperDetails();

	public PartNumberDescDto getByPartNumber(PartNumberDescDto partNum);
	
	public String updateWorflowDetails(AdhocOrderWorkflowDto workflowDto);
	
	public String updateApprovalWorflowDetails(org.json.JSONObject obj) throws JSONException;

}
