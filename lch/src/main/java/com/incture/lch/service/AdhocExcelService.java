package com.incture.lch.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.incture.lch.adhoc.custom.dto.AdhocApprovalCustomDto;
import com.incture.lch.dao.AdhocApprovalRuleDao;
import com.incture.lch.dto.AdhocApprovalRuleDto;
import com.incture.lch.helper.AdhocExcelHelper;

@Service
public class AdhocExcelService {

	@Autowired
	private AdhocApprovalRuleDao adhocApprovalRuleDao;

	public void save(MultipartFile file) {
		try {
			List<AdhocApprovalRuleDto> approvalList = AdhocExcelHelper.excelToTableData(file.getInputStream());
			adhocApprovalRuleDao.saveApproval(approvalList);
		} catch (IOException e) {
			throw new RuntimeException("fail to store excel data: " + e.getMessage());
		}
	}

	public List<AdhocApprovalRuleDto> getAllAdhocApprovalList() {
		return adhocApprovalRuleDao.getAllAdhocApprovalList();
	}

	public ByteArrayInputStream load() {
		List<AdhocApprovalRuleDto> appList = adhocApprovalRuleDao.getAllAdhocApprovalList();
		List<AdhocApprovalCustomDto> customAppList = new ArrayList<AdhocApprovalCustomDto>();
		for(AdhocApprovalRuleDto dto : appList)
		{
			AdhocApprovalCustomDto customDto = new AdhocApprovalCustomDto();
			customDto.setAdhocType(dto.getAdhocType());
			customDto.setApproverEmail(dto.getApproverEmail());
			customDto.setApproverType(dto.getApproverType());
			customDto.setUserGroup(dto.getUserGroup());
			customAppList.add(customDto);
		}
		ByteArrayInputStream in = AdhocExcelHelper.tableDataToExcel(customAppList);
		return in;
	}
	public ByteArrayInputStream loadSampleFile() {
		ByteArrayInputStream in = AdhocExcelHelper.sampleTableDataToExcel();
		return in;
	}
}
