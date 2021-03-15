package com.incture.lch.adhoc.repository;

import java.util.List;

import com.incture.lch.adhoc.dto.AdhocOrderDto;
import com.incture.lch.adhoc.dto.AdhocRequestDto;
import com.incture.lch.adhoc.dto.ChargeRequestDto;
import com.incture.lch.adhoc.dto.PremiumFreightOrderDto;
import com.incture.lch.adhoc.dto.PremiumRequestDto;
import com.incture.lch.adhoc.entity.AdhocOrders;

public interface PremiumFreightOrdersRepository 
{

	public PremiumFreightOrderDto exportPremiumFreightOrders(AdhocOrders adhocOrders);
	
	//public 
	
	public List<PremiumFreightOrderDto> getAllPremiumFreightOrders(PremiumRequestDto premiumRequestDto);
	//public String setCalculateCarrierCharge(CarrierAdminChargeResponseDto dto);
	
	//public CarrierAdminChargeResponseDto getCalculatedCarrierCharge()
	
	//public int deletePremiumFreightOrders(String adhocOrderId, String userId, String partNum);
	
	//public List<AdhocOrderDto> getPremiumAdhocOrders(String  plannerEmail);
	
	


}
