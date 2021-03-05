package com.incture.lch.adhoc.helper;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Repository;
import org.springframework.web.multipart.MultipartFile;

import com.incture.lch.adhoc.custom.dto.AdhocApprovalCustomDto;
import com.incture.lch.adhoc.dto.AdhocApprovalRuleDto;

@Repository
public class AdhocExcelHelper {
	public static String TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
	static String[] HEADERs = { "AdhocType", "UserGroup", "ApproverType", "Approver" };
	static String SHEET = "AdhocApproval";

	public static boolean hasExcelFormat(MultipartFile file) {

		if (!TYPE.equals(file.getContentType())) {
			return false;
		}

		return true;
	}

	public static List<AdhocApprovalRuleDto> excelToTableData(InputStream is) {
		try {
			Workbook workbook = new XSSFWorkbook(is);

			Sheet sheet = workbook.getSheet(SHEET);
			Iterator<Row> rows = sheet.iterator();

			List<AdhocApprovalRuleDto> approvalList = new ArrayList<AdhocApprovalRuleDto>();

			int rowNumber = 0;
			while (rows.hasNext()) {
				Row currentRow = rows.next();

				// skip header
				if (rowNumber == 0) {
					rowNumber++;
					continue;
				}

				Iterator<Cell> cellsInRow = currentRow.iterator();

				AdhocApprovalRuleDto dto = new AdhocApprovalRuleDto();

				int cellIdx = 0;
				while (cellsInRow.hasNext()) {
					Cell currentCell = cellsInRow.next();

					switch (cellIdx) {
					case 0:
						dto.setAdhocType(currentCell.getStringCellValue());
						break;

					case 1:
						dto.setUserGroup(currentCell.getStringCellValue());
						break;

					case 2:
						dto.setApproverType(currentCell.getStringCellValue());
						break;

					case 3:
						dto.setApproverEmail(currentCell.getStringCellValue());
						break;

					default:
						break;
					}

					cellIdx++;
				}

				approvalList.add(dto);
			}

			workbook.close();

			return approvalList;
		} catch (IOException e) {
			throw new RuntimeException("fail to parse Excel file: " + e.getMessage());
		}
	}

	public static ByteArrayInputStream tableDataToExcel(List<AdhocApprovalCustomDto> adhocApprovalRuleList) {

		try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream();) {
			Sheet sheet = workbook.createSheet(SHEET);

			// Header
			Row headerRow = sheet.createRow(0);

			for (int col = 0; col < HEADERs.length; col++) {
				Cell cell = headerRow.createCell(col);
				cell.setCellValue(HEADERs[col]);
			}

			int rowIdx = 1;
			for (AdhocApprovalCustomDto dto : adhocApprovalRuleList) {
				Row row = sheet.createRow(rowIdx++);

				row.createCell(0).setCellValue(dto.getAdhocType());
				row.createCell(1).setCellValue(dto.getUserGroup());
				row.createCell(2).setCellValue(dto.getApproverType());
				row.createCell(3).setCellValue(dto.getApproverEmail());
			}

			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		} catch (IOException e) {
			throw new RuntimeException("fail to import data to Excel file: " + e.getMessage());
		}
	}
	
	public static ByteArrayInputStream sampleTableDataToExcel() {

		try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream();) {
			Sheet sheet = workbook.createSheet(SHEET);

			// Header
			Row headerRow = sheet.createRow(0);

			for (int col = 0; col < HEADERs.length; col++) {
				Cell cell = headerRow.createCell(col);
				cell.setCellValue(HEADERs[col]);
			}
			workbook.write(out);
			return new ByteArrayInputStream(out.toByteArray());
		} catch (IOException e) {
			throw new RuntimeException("fail to import data to Excel file: " + e.getMessage());
		}
	}

}
