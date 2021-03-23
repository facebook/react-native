package com.incture.lch.workflow.constant;

/**
 * this class Contains application related Constants
 * 
 * @author Ravi Kumar P
 * @since 2021-03-04
 * @version 1.0
 */

public class ApplicationConstants {

	public static final String NEW_USER = "NEW_USER";
	public static final String ACTIVATED = "ACTIVE";
	public static final String INACTIVE = "INACTIVE";
	public static final String REVOKED = "REVOKED";
	public static final String USER_EXPIRED = "EXPIRED";
	public static final String EXPIRE_DAYS = "EXPIRE_DAYS";
	public static final String NOTIFICATION_DAYS = "NOTIFICATION_DAYS";
	public static final String SUCCESS = "success";
	public static final String NO_DATA_FOUND = "no data found";

	public static final String SELECTED_CUSTOMERS = "Selected Customers";
	public static final String SELECTED_COMMODITIES = "Selected Commodities";
	public static final String COMMODITIES = "Commodities";
	public static final String CUSTOMERS = "Customers";

	public static final String SCDM_ID = "scdm";
	public static final String SCDM_LEAD_ID = "scdm_lead";
	public static final String PRICING_MANAGER_ID = "pricing_manager";
	public static final String DCM_ID = "dcm";
	public static final String DCM_LEAD_ID = "dcm_lead";
	public static final String GCM_ID = "gcm";
	public static final String GCM_LEAD_ID = "gcm_lead";
	public static final String DIVISION_LEAD_ID = "division_lead";
	public static final String DIVISION_ADMIN_ID = "division_admin";

	public static final String BUSINESS_ADMIN_ID = "business_admin";
	public static final String IT_ADMIN_ID = "it_admin";

	public static final String SECTOR_CODE = "SEC";
	public static final String AREA_CODE = "AREA";
	public static final String DIV_CODE = "DIV";
	public static final String CUST_CODE = "CUST";
	public static final String COMM_CODE = "COMM";
	public static final String LEVEL_CODE = "LEVEL";

	public static final int LIMIT = 100;
	public static final int ASSEMBLY_COUNT = 10;

	public static final String ACTIVATED_VERSION = "Active";
	public static final String EXPIRED_VERSION = "Expired";
	public static final String DRAFT_VERSION = "Draft";
	public static final String NEW_VERSION = "New";
	public static final String REVOKE_VERSION = "Revoked";

	public static final String SAVE_BUTTON_MODE = "SAVE";
	public static final String REVOKE_BUTTON_MODE = "REVOKE";
	public static final String SUBMIT_BUTTON_MODE = "SUBMIT";
	public static final String COMPLETED_BUTTON_MODE = "COMPLETED";
	public static final String REGENERATE_BUTTON_MODE = "REGENERATE";

	public static final String NO_CUSTOMER_FOUND = "No customer associated for the user.";
	public static final String MANUFACTURING = "Manufacturing";
	public static final String ENGINEERING_AND_TECHNOLOGY = "Engineering and Technology";
	public static final String OTHERS = "Others";
	public static final String SUPPLY_CHAIN_SERVICES = "Supply Chain Services";

	public static final String CUST_EXCEL_MODE_ALL = "ALL Customers";
	public static final String CUST_EXCEL_MODE_SINGLE = "Single Customer";

	public static final String GET_ASSOCIATED_VALUES = "https://pricinghad58fe93.us3.hana.ondemand.com/pricing/rest/user/getCustOrCommsList";

	public static final String CUST = "CUST";
	public static final String RELEASED = "released";
	public static final String LOCKED = "locked";

	public static final String DRAFT = "Draft";
	public static final String ACTIVE = "Active";
	public static final String EXPIRED = "Expired";
	public static final String UI_APPLICATION_LINK = "UI_APPLICATION_LINK";
	public static final String UI_APPROVAL_INBOX_LINK = "UI_APPROVAL_INBOX_LINK";

	// destination infromation
	public static final String AUTHIRIZATION_DEST_NAME = "authorizationsjava";
	public static final String WORKFLOW_DEST_NAME = "bpmworkflowruntimejava";

	public static final String DESC_URL = "URL";
	public static final String DESC_USER = "User";
	public static final String DESC_PWD = "Password";
	public static final String DESC_DESCRIPTION = "Description";
	public static final String CLIENT_ID = "clientId";
	public static final String CLIENT_SECRET = "clientSecret";
	public static final String TOKEN_SERVICE_URL = "tokenServiceURL";

	// job names
	public static final String USERPROFILE_EXPIRATION_NOTIFICATION_JOB = "UserProfileExpirationNotificationJob";
	public static final String EXPIRE_USERPROFILE_JOB = "ExpireUserProfileJob";
	public static final String PENDINGTASKS_NOTIFICATION_TO_APPROVER = "PendingTasksNotificationToApprover";
	public static final String GENERATE_WORKBOOK = "generateWorkbook";

	// pricing workbook
	public static final String PP1 = "PP1";
	public static final String WEIGHTED_AVG_QUOTED_COST = "Weighted Avg. Quoted Cost";
	public static final String PREV_QUARTER_PP1 = "Prev Quarter PP1";
	public static final String WEIGHTED_AVG_PO_COST = "Weighted Avg. PO Cost";
	public static final String NEW_PART = "New Part";
	public static final String STANDARD_COST = "Standard Cost";
	public static final String NEGATIVE_MARGIN = "Negative Margin";
	public static final String MARGIN_EROSION = "Margin Erosion";
	public static final String SRC_DEC_CHANGE = "Src Dec Change";
	public static final String QUOTE_INCREASE = "Quote Increase";
	public static final String QUOTE_DECREASE = "Quote Decrease";
	public static final String SUPPLY = "SUPPLY";
	public static final String COST = "PRICE";
	public static final String DYNAMICS = "MARKET DYNAMICS";
	public static final String DEFAULT = "Default";
	public static final String CUSTOMER_PROFILE = "customer_profile";
	public static final String RISK = "Risk";
	public static final String OPPORTUNITY = "Opportunity";
	public static final String MONTHLY = "Monthly";
	public static final String QUARTERLY = "Quarterly";
	public static final String SEMI_ANNUALLY = "Semi Annually";
	public static final String ANNUALLY = "Annually";
	public static final String NVARCHAR = "NVARCHAR";
	public static final String CONTAINS = "CONTAINS";
	public static final String EQUALS = "EQUALS";
	public static final String NOT_EQUALS = "NOT EQUALS";
	public static final String IN = "IN";
	public static final String NOT_IN = "NOT IN";
	public static final String INTEGER = "INTEGER";
	public static final String DECIMAL = "DECIMAL";
	public static final String BETWEEN = "BETWEEN";
	public static final String LESS_THAN = "LESS THAN";
	public static final String GREATER_THAN = "GREATER THAN";
	public static final String LESS_THAN_OR_EQUAL_TO = "LESS THAN OR EQUAL TO";
	public static final String GREATER_THAN_OR_EQUAL_TO = "GREATER  THAN OR EQUAL TO";
	public static final String DATE = "DATE";
	public static final String ASCENDING = "ASCE";
	public static final String DESCENDING = "DESC";
	public static final String STATUS_NEW = "New";
	public static final String TRUE = "T";
	public static final String FALSE = "F";
	public static final String YES = "Y";
	public static final String NO = "N";
	public static final String BOOLEAN = "BOOLEAN";
	public static final Object WORKBOOK_STATUS_AUTO = "Auto";
	public static final String REGENERATE = "Regenerate";
	public static final String WORKBOOK_GENERATED = "Generated";
	public static final String REPRICE = "Reprice";
	public static final String VARIANT_TYPE_GLOBAL = "Global";
	public static final String VARIANT_TYPE_PRIVATE = "Private";
	public static final String VARIANT_TYPE_SYSTEM = "System";
	public static final Object MAKE_BUY = "BUY";
	public static final Object ACTIVE_ONLY = "Active only";
	public static final Object ALL = "All";
	public static final Object PARTS_WITH_GROSS_DEMAND_FOR_PERIOD = "Parts with Gross Demand for Period";
	public static final Object PARTS_WITH_NET_DEMAND_FOR_CYCLE = "Parts with Net Demand for Cycle";
	public static final String BODS = "Bods";
	public static final String NO_VALUE = "No value";

	public static final String INPROGRESS_WB_VERSION = "In Progress";
	public static final String COMPLETED_WB_VERSION = "Completed";
	public static final String SUBMITTED_WB_VERSION = "Submitted";
	public static final String EXPIRED_WB_VERSION = "Expired";
	public static final String REVOKED_WB_VERSION = "Revoked";
	public static final String DELETED_WB_VERSION = "Deleted";

	public static final String BUTTON_MASS_EDIT = "Mass Edit";
	public static final String REPRICE_BUTTON_MODE = "Reprice";

	// workbook genaration constants for Excel
	public static final String DIVISION_SUMM = "Division Summary";
	public static final String SECTOR_SUMM = "Sector Summary";
	public static final String GCM_DEV_SUMM = "GCM Summary - Division Level";
	public static final String GCM_CUST_SUMM = "GCM Summary - Customer Level";

	public static final String GENERAL_PRICE = "General Price";
	public static final String CUSTOMER_RESTRICTED = "Customer Restricted Price";
	public static final String CUSTOMER_AGREED = "Customer Agreed Price";
	public static final String ACTIVITY_TYPE_USER = "USER";
	public static final String ACTIVITY_TYPE_SYSTEM = "SYSTEM";
	public static final String MODULE_JPN_PRICE_SETTING = "jpn_price_setting";
	public static final String COLUMN_IS_REVIEWED = "IS_REVIEWED";
	public static final String COLUMN_SCDM_REASON = "SCDM_REASON";
	public static final String COLUMN_SCDM_NOTES = "SCDM_NOTES";
	public static final String COLUMN_IS_REVIEWED_LABEL = "Actioned (Yes / No)";
	public static final String COLUMN_SCDM_REASON_LABEL = "Pricing manager reason";
	public static final String COLUMN_SCDM_NOTES_LABEL = "Pricing manager notes";
	public static final String COLUMN_FINAL_FCST_COST_LABEL = "Final Fcst Cost (PP1)";
	public static final String COLUMN_FINAL_MARGIN_LABEL = "Final net price";
	public static final String COLUMN_FINAL_PRICE_LABEL = "Final margin %";
	public static final String COLUMN_CUSTOMER_AGREED_PRICE_LABEL = "Customer Agreed Price";
	public static final String VARIANT_TYPE_USER = "User";
	public static final String QUOTE_CYCLE = "Quote cycle";
	public static final String JPS_TO_INCLUDE = "JPN’s to Include";
	public static final String QUOTE_INITIATED = "How is the quote initiated";
	public static final String TOOL_USED = "What tool is used";
	public static final String CURRENCY = "Currency";
	public static final String USD = "USD";
	public static final String RECOUP_DIFFRENCE = "How to recoup the reval difference";
	public static final String MANUFACTURERS = "Manufacturers";
	public static final String INITIATORS = "Initiators";
	public static final String EMAIL_DEST_NAME = "pricing_mails";

	// Gcm

	public static final String SUBCOMMODITY_TYPE = "SUBCOMMODITY";
	public static final String ATTRIBUTE1_TYPE = "ATTRIBUTE1";
	public static final String ATTRIBUTE2_TYPE = "ATTRIBUTE2";
	public static final String ATTRIBUTE3_TYPE = "ATTRIBUTE3";
	public static final String ATTRIBUTE4_TYPE = "ATTRIBUTE4";
	public static final String END_DATE = "9999-12-31";

	public static final String ALL_SECTORS = "ALL SECTORS";
	public static final String ALL_SOURCING_OWNER = "ALL";
	public static final String GLOBAL_NODE_ID = "globalNode";

	public static final String START_DATE_KEY = "startDate";
	public static final String END_DATE_KEY = "endDate";
	public static final String EXPIRED_END_DATE_KEY = "expiredEndDate";

	public static final String REVENUE_CLASS_A_CODE = "A";
	public static final String REVENUE_CLASS_B_CODE = "B";
	public static final String REVENUE_CLASS_C_CODE = "C";

	public static final String NORMAL_MARGIN = "MARGIN";

	public static final Integer DEFAULT_INHERITANCE_LEVEL_FOR_COMM_SECTOR_MARGIN = -2;
	public static final Integer DEFAULT_INHERITANCE_LEVEL_FOR_COMM_CUST_MARGIN = -2;
	public static final Integer INHERITANCE_LEVEL_TO_COPY_DATA_FROM_ALL_SECTOR_ALL_SO = -2;
	public static final Integer INHERITANCE_LEVEL_TO_COPY_DATA_FROM_ALL_SECTOR_SINGLE_SO = -3;
	public static final Integer INHERITANCE_LEVEL_TO_COPY_DATA_FROM_SINGLE_SECTOR_ALL_SO = -4;
	public static final Integer INHERITANCE_LEVEL_TO_COPY_DATA_FROM_SINGLE_CUSTOMER_ALL_SO = -5;
	public static final Integer INHERITANCE_LEVEL_TO_CHANGE_AFTER_IMPORT_AT_COMM_SECTOR_MARGIN = -1;
	public static final Integer INHERITANCE_LEVEL_TO_CHANGE_AFTER_IMPORT_AT_COMM_CUST_MARGIN = -1;

	public static final String SAT_PP2_OVERRIDE = "SAT PP2 Override";
	public static final String MARGIN_MATRIX = "Margin Matrix";
	public static final String EXPIRE_WORKBOOK = "EXPIRE";
	public static final String DELETE_WORKBOOK = "DELETE";
	public static final String IMPORT_STARTED = "Import started";
	public static final String IMPORT = "Import";
	public static final String IMPORT_COMPLETED = "Import completed";
	public static final String STD = "STD";
	public static final String COLUMN_JPN = "JPN";
	public static final String COLUMN_PLANT = "PLANT";
	public static final String FIVE_STEP_LOGIC = "5 Step Logic";
	public static final String NOT_AVAILABLE = "N/A";
	public static final String NODE_NA = "NANANANANA";

	public static final String GENERAL = "general";
	public static final String CRP = "crp";
	public static final String DEFAULT_EXPIRE_DATE = "12/31/9999";
	public static final String GLOBAL = "global";
	public static final String STATUS_CHANGE = "Status Changed";
	public static final String REGENERATE_ACTIVITY = "Regenerate Pricing Workbook";
	public static final String All_JPN = "ALL";
	public static final String SYSTEM_USER = "System";
	public static final String WORKBOOK_REVOKED = "Revoked";
	public static final String LOCKED_FOR_REGENERATION = "Locked for Regeneration";
	public static final String LOCKED_FOR_REPRICE = "Re-Pricing";
	public static final String HOLD_PP2 = "HOLD PP2";
	public static final String CAl_COLUMN_LIST = " JPN,PLANT,IS_REVIEWED,SCDM_REASON,SCDM_NOTES,PP2,FINAL_FCST_COST,LAST_CYCLE_FINAL_PRICE,GROSS_DEMAND,CUSTOMER_CURR_FX_RATE,FINAL_PRICE_NEW,FINAL_MARGIN ";
	public static final String ALL_COLUMNS_VARIANT = "All Columns";
	public static final String FALSE_FLAG = "False";
	public static final String TRUE_FLAG = "True";
	public static final String EQUALS_TRUE = "EQUALS TRUE";
	public static final String EQUALS_FALSE = "EQUALS FALSE";
	public static final String REPRICE_ACTIVITY = "Reprice";
	public static final String RULE_SERVICE_ID = "RULE_SERVICE_ID";

	public static final String DATABASE_DESC = "pricing_hana";

}
