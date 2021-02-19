package com.incture.lch.adhoc.dto;

/**
 * @author Shruti Bodhe(INC01011) created on (29-Apr-2020)
 */
public class ApplicationConstants {

	public static final int LIMIT = 100;
	public static final int ASSEMBLY_COUNT = 10;

	public static final String SAVE_OP = "save";
	public static final String UPDATE_OP = "update";
	public static final String DELETE_OP = "delete";

	public static final String HTTP_GET = "GET";
	public static final String HTTP_PUT = "PUT";
	public static final String HTTP_DELETE = "DELETE";
	public static final String HTTP_POST = "POST";

	public static final String DEST_TYPE = "Type";
	public static final String DEST_URL = "URL";

	public static final String BASIC_AUTH = "BasicAuthentication";
	public static final String NO_AUTH = "NoAuthentication";
	public static final String OAUTH2_CLIENT_CREDENTIALS = "OAuth2ClientCredentials";
	public static final String OAUTH2_USER_PASSWORD_AUTH = "OAuth2Password";
	public static final String OAUTH2_USER_TOKEN_EXCHANGE = "OAuth2UserTokenExchange";

	public static final String APPLICATION = "Application";
	public static final String USAGE = "Usage";
	public static final String RULE_MAINTENCE_SET = "Rule Maintenance Set";
	public static final String RULE_SET = "Rule Set";
	public static final String DECISION_TABLE = "Decision Table";
	public static final String RULE_LIST = "Rule List";

	public static final String SAVE_ACTION = "Save";
	public static final String SUBMIT_ACTION = "Submit";
	public static final String STATUS_DRAFT = "Draft";
	public static final String STATUS_ACTIVE = "Active";

	// Entities
	public static final String APPLICATION_ENTITY = "Application";
	public static final String ACTION_TYPE_ENTITY = "Action Type";
	public static final String FIELD_ENTITY = "Field_Catalog_Entity";
	public static final String USAGE_ENTITY = "Usage";
	public static final String USAGE_FIELD_ENTITY = "Field_Catalog_Entity";
	public static final String RULE_TYPE_DEF_ENTITY = "RuleTypeDefination";
	public static final String RULE_SET_ENTITY = "RuleSets";
	public static final String RULE_MAINTENCE_SET_ENTITY = "RuleMaintenanceSet";
	public static final String RULE_LIST_ENTITY = "RuleList";
	public static final String LABEL_ENTITY = "Label";
	public static final String DESCRIPTION_ENTITY = "Description";
	public static final String ID_MAPPER_ENTITY = "IdMapper";
	public static final String RULE_SET_DT_MAPPING_ENTITY = "RuleSetDtMapping";
	public static final String RULE_SET_RMS_MAPPING = "RuleSetRmsMapping";

	// SCP Brm Entities
	public static final String SCP_PROJECT_ENTITY = "Project";
	public static final String SCP_DATA_OBJECT_ENTITY = "DataObject";
	public static final String SCP_ATTRIBUTE_ENTITY = "Attribute";
	public static final String SCP_RULESET_ENTITY = "Ruleset";
	public static final String SCP_RULE_ENTITY = "Rule";
	public static final String SCP_RULE_SERVICE = "RuleService";

	public static final String DECISION_TABLE_FIELD_ENTITY = "DecisionTableField";
	public static final String DECISION_TABLE_ENTITY = "DecisionTable";
	public static final String RULE_TYPES_ENTITY = "RuleTypes";
	public static final String ACTION_TYPE_OBJECT_MAPPING_ENTITY = "ActionTypeObjectMapping";
	public static final String FIELD_LOOKUP_ENTITY = "FieldLookup";
	public static final String LOOKUP_CONFIG_ENTITY = "LookupConfig";
	public static final String STATIC_LOOKUP_ENITY = "StaticLookup";
	public static final String API_LOOKUP_ENITY = "ApiLookup";

	public static final String VALUE_HELP_TYPE_STATIC = "Static";
	public static final String VALUE_HELP_TYPE_EXTERNAL = "External";
	public static final String BUSINESS_TYPE_CONDITION = "C";
	public static final String BUSINESS_TYPE_ACTION = "A";
	public static final String DYNAMIC_TABLE_COUNTER = "DynamicTableCounter";
	public static final String DECISION_TABLE_STATIC_NAME = "CW_WR_RULE_RECORDS_";

	public static final String NAVIGATION_FOR_MODELING = "RuleModeling";
	public static final String NAVIGATION_FOR_AUTHORING = "RuleAuthoring";
	public static final String DATA_OBJECTS_ENTITY = "DataObject";

	// Hierarchy Types
	public static final String NAVIGATION_APP_USAGE_RMS_RS_DT = "5AURMSRSDT";
	public static final String NAVIGATION_APP_RMS_USAGE_RS_DT = "5ARMSURSDT";
	public static final String NAVIGATION_APP_RMS_RS_DT = "4ARMSRSDT";
	public static final String NAVIGATION_USAGE_RMS_RS_DT = "4URMSRSDT";
	public static final String NAVIGATION_RMS_USAGE_RS_DT = "4RMSURSDT";
	public static final String NAVIGATION_APP_RS_DT = "3ARSDT";

	public static final String NAVIGATION_RMS_RS_DT = "3RMSRSDT";

	// Data Types
	public static final String NVARCHAR = "NVARCHAR";
	public static final String VARCHAR = "VARCHAR";
	public static final String STRING = "STRING";
	public static final String CHAR = "CHAR";
	public static final String DATE = "DATE";
	public static final String TIMESTAMP = "TIMESTAMP";
	public static final String INTEGER = "INTEGER";
	public static final String BOOLEAN = "BOOLEAN";
	public static final String DECIMAL = "DECIMAL";
	public static final String DOUBLE = "DOUBLE";
	public static final String FLOAT = "FLOAT";
	public static final String CLOB = "CLOB";
	public static final String LOB = "LOB";

	public static final String UPDATE_ACTION = "Update";
	public static final String OBJECT_TYPE_RULE_SET = "RS";
	public static final String OBJECT_TYPE_DECISION_TABLE = "DT";
	public static final String OBJECT_TYPE_APPLICATION = "APP";
	public static final String OBJECT_TYPE_RULE_MAINTENANCE_SET = "RMS";

	// static table columns needs for hierarchy query and Split logic
	public static final String VALID_FROM = "VALID_FROM";
	public static final String VALID_TO = "VALID_TO";
	public static final String RULE_RECORD_ID = "RULE_RECORD_ID";
	public static final String ID = "ID";
	public static final String TYPE = "TYPE";
	public static final String PARENT = "PARENT";
	public static final String LEVEL = "LEVEL";
	public static final String NAME = "NAME";
	public static final String STATUS = "STATUS";
	public static final String LABEL = "LABEL";
	public static final String DESCRIPTION = "DESCRIPTION";

	public static final String DEFAULT_LANGUAGE = "en";

	public static final String STATIC_VALUE_TYPE = "ST";
	public static final String URL_BASED_VALUE_TYPE = "ET";

	// Rule Records Status
	public static final String MODIFIED = "Modified";
	public static final String APPROVED = "Approved";
	public static final String APPROVED_CREATION = "Approved Creation";
	public static final String APPROVED_MODIFICATION = "Approved Modification";
	public static final String APPROVED_DEACTIVATION = "Approved Deactivation";
	public static final String PENDING_APPROVAL = "Pending Approval";
	public static final String PENDING_APPROVAL_CREATION = "Pending Approval Creation";
	public static final String PENDING_APPROVAL_MODIFICATION = "Pending Approval Modification";
	public static final String PENDING_APPROVAL_DEACTIVATION = "Pending Approval Deactivation";
	public static final String PENDING_DEPLOYMENT = "Pending Deployment";
	public static final String PENDING_DEPLOYMENT_CREATION = "Pending Deployment Creation";
	public static final String PENDING_DEPLOYMENT_MODIFICATION = "Pending Deployment Modification";
	public static final String PENDING_DEPLOYMENT_DEACTIVATION = "Pending Deployment Deactivation";
	public static final String DEACTIVATED = "Deactivated";
	public static final String REJECTED = "Rejected";
	public static final String REJECTED_CREATION = "Rejected Creation";
	public static final String REJECTED_MODIFICATION = "Rejected Modification";
	public static final String REJECTED_DEACTIVATION = "Rejected Deactivation";

	public static final String CREATED = "Created";
	public static final String DRAFT_CREATED = "Draft Created";
	public static final String DRAFT_MODIFIED = "Draft Modified";
	public static final String IMPACTED = "Impacted";
	public static final String DELETED = "Deleted";
	public static final String INACTIVE = "Inactive";

	public static final String STORED_IN_DB = "Stored In Db?";
	public static final String IS_IMPACTED = "Is_Impacted?";
	public static final String OLD_STATUS = "OLD_STATUS";

	// Json Element name used to get json object from ui for Date Splits
	public static final String EXISTING_RULE_RECORD = "existingRecords";
	public static final String NEW_RULE_RECORD = "newRecords";
	public static final String DECISION_TABLE_ID = "decisionTable";
	public static final String BUSINESS_TYPE_SYSTEM = "S";

	public static final String EXCLUSIVE_RULE_POLICY = "Exclusive";
	public static final String SUCCESS = "Success";
	public static final String LOOKUP_TYPE_DB = "DB";
	public static final String LOOKUP_TYPE_API = "API";
	public static final String LOOKUP_TYPE_STATIC_VALUE = "VL";
	public static final String EQ = "EQ";
	public static final String GTE = "GTE";
	public static final String GT = "GT";
	public static final String LTE = "LTE";
	public static final String LT = "LT";

	public static final String RULE_PROCEDURE_ENTITY = "RuleProcedure";
	public static final String INPUT = "input";
	public static final String OUTPUT = "output";
	public static final String INCLUSIVE_RULE_POLICY = "Inclusive";
	public static final String DECISION_TABLE_STATIC_FIELDS = "DecisionTableStaticFields";
	public static final String ALL = "All";
	public static final String SELECTIVE = "Selective";
	public static final String FIELD_CATALOG_ENTITY = "Field_Catalog_Entity";
	public static final String DECISION_TABLE_CONDITION = "decision_table_condition";
	public static final String DUMMY_TABLE = "dummy";
	public static final String BUSINESS_TYPE_INTERNAL = "I";
	public static final String BUSINESS_TYPE_PERIOD = "P";

	public static final String AUTH_TYPE_USER = "User";
	public static final String AUTH_TYPE_GROUP = "Group";

	public static final String DEFAULT_AUTH_TYPE = "GROUP";
	public static final String DEFAULT_GROUP = "workRules_Admin";
	public static final String DEFAULT_PERMISSION = "WRITE";
	public static final String DEFAULT_ENABLE_OPTION = "YES";
	public static final String DEFAULT_VISIBLE_OPTION = "YES";
	public static final String DEFAULT_MASTER_DATA_ENABLED = "YES";
	public static final String DEFAULT_PASSWORD_PROTECTED = "YES";
	public static final String DEFAULT_CONDITION_FIELD_EDITABLE = "YES";
	public static final String DEFAULT_ACTION_FIELD_EDITABLE = "YES";
	public static final String DEFAULT_EXCEL_FILE_TYPE = "XLSX";

	public static final String DEFAULT_CONDITION_FIELD_COLOR = "13";
	public static final String DEFAULT_ACTION_FIELD_COLOR = "42";
	public static final String DEFAULT_SYSTEM_FIELD_COLOR = "22";

	public static final String DEFAULT_AUTH_TYPE_TEXT = "Group";
	public static final String DEFAULT_GROUP_TEXT = "Workrules Admin";
	public static final String DEFAULT_PERMISSION_TEXT = "Write";
	public static final String DEFAULT_ENABLE_OPTION_TEXT = "Yes";
	public static final String DEFAULT_VISIBLE_OPTION_TEXT = "Yes";
	public static final String DEFAULT_MASTER_DATA_ENABLED_TEXT = "Yes";
	public static final String DEFAULT_PASSWORD_PROTECTED_TEXT = "Yes";
	public static final String DEFAULT_CONDITION_FIELD_EDITABLE_TEXT = "Yes";
	public static final String DEFAULT_ACTION_FIELD_EDITABLE_TEXT = "Yes";
	public static final String DEFAULT_EXCEL_FILE_TYPE_TEXT = "xlsx";

	public static final String DEFAULT_CONDITION_FIELD_COLOR_TEXT = "YELLOW";
	public static final String DEFAULT_ACTION_FIELD_COLOR_TEXT = "LIGHT_GREEN";
	public static final String DEFAULT_SYSTEM_FIELD_COLOR_TEXT = "GREY_25_PERCENT";

	public static final String GLOBAL_FIELD_APPLICATION = "global";
	public static final String SYSTEM_USER = "System";
	public static final String NEELAM_ACCOUNTS_COOKIE = "BIGipServerdispatcher.hana.ondemand.com=!EoyfOdzV2lfetO4oYkA3pkz2/u/BY8wsXXDOszIzc7oi0U1s5CbeEW/unrArsy2dshZXgambPSA2IO4=; oucrsmsrpklybkczyfcqeihep=dRW70zga0lQzeygjhRjz8ZjeyJEj1eJPV6eRtcfnM2T5woD8PCDE09PQk1GK0uMK8xGZoYjUg14eab55vS9GvlhdXBINlJzoHd6L9KOkwjP8Accoh%2FhsX0FsIVWyn%2FoWpMVtQ3%2B58x%2FzbLdOK61XJTv8HV0SasYX2aGKnWHdL3dJF0C0yBZkxybApDrjbFeJSxlpcH7GTIUoQuMYtgQOcuWtEGSov8um1gGrqcIhFdMqCxcIiA5ykFn9rLvciEFQ; JSESSIONID=8F86860553D3DA1BA9F88688870AB700EA8A0938095A5195821426A8A573D45A; slo_regular_domains_eu1_kbniwmq1aj_kbniwmq1aj=H4sIAAAAAAAAAAEwAM%2F%2FGwjo1YWfrjqmuuyTTQWyTAZqrSlppsZSGVwbiHzG%2BA%2FkxRZ%2B6BX9uyO3uo%2BudHmKQPMQwjAAAAA%3D; JTENANTSESSIONID_kbniwmq1aj=N642ylTsKQjdCe%2B%2Bo%2F2Q73%2FkE%2FvVPhjjwRVw8J%2F5ZBo%3D";
	public static final String PRRETHAM_ACCOUNTS_COOKIE = "BIGipServerdispatcher.hana.ondemand.com=!aW4WUPwxUeDlYbR7oF+IyEeB/xMyQnOeO37zXSo1G+ypVUVP5yy0PgpcmxCrV35+PZkWQeB1FcojWQ==; slo_regular_domains_eu1_kbniwmq1aj_kbniwmq1aj=H4sIAAAAAAAAAAEwAM%2F%2FGwjo1YWfrjqmuuyTTQWyTAZqrSlppsZSGVwbiHzG%2BA%2FkxRZ%2B6BX9uyO3uo%2BudHmKQPMQwjAAAAA%3D; JTENANTSESSIONID_kbniwmq1aj=zx5hFqnerdXwAJe1QgrQrIYTHYNhaEjckdV8LXHm9qc%3D; oucrsljqclrfnpdnbormhcvfc=O6rpo3IAUnal075rfqUeVM3v8x2uzUyuRlMafTJRInsTY9sNDN0y8DKNyf9aFel1CuXUBx%2B0qZBnvsKJcusqWf2mEBcqO6VDa2Czq1VpwG0%2B4lMEhaRiNbDQEHxcGwYFsQfC8G4UAmwn1CocDpmKG3yLTUigknFVcEvMxEo7P32nsiAJsTj1b%2B2%2FxbZTEfPkF4POcurRafD5LmRU%2FJpIqeW12aC0I8jS522BjBu2QtCSbWOD29QJhxa7DTs0tPBOD5mVyCuYs4%2Bcn7ZL2JKNuSHHXnU5J5zM0ZeGPCnvGz4AowAnWNJo6jbz6rsNLcXM71MFOCASmz8LH3o9gT%2BR7hrNTaKzkJFgWFVDRLfYVO%2FB2jYrDKYoZlmmGIBxAZ%2Fm; JSESSIONID=8BC2EEDAAB4C38E49571B377BAE3A679502774C4D80BF2CFDA5034AE1721A3E7";
	public static final String WORKBOX_API_DESTINATION = "https://testbotkbniwmq1aj.hana.ondemand.com/workbox-product/workbox/";
	public static final String RULE_RECORD = "RuleRecord";
	public static final String TEXT = "_TEXT";
	public static final String BASIC_MODE = "Basic";
	public static final String DT_MODE = "DT";
	public static final String FLEXIBLE_FORM_MODE = "FlexibleForm";
	public static final String STATIC_FORM_MODE = "StaticForm";

	public static final String SAVE_MODE = "Save";
	public static final String SUBMIT_MODE = "Submit";
	public static final String MODE_WORKRULES = "WorkRules";
	public static final String MODE_WORKBOX = "WorkBox";
	public static final String INPROGRESS = "InProgress";
	public static final String EXCEL_TYPE_REPORT = "Report";
	public static final String INBOX_TYPE_MY_INBOX = "MyInbox";
	public static final String INBOX_TYPE_COMPLETED_TASK = "CompletedTasks";
	public static final String INBOX_TYPE_CREATED_TASK = "CreatedTasks";
	public static final String IMPORT_MODE = "Import";

	public static final String ENTITY_ACCESS_DT_NAME = "ENTITY_ACCESS";
	public static final String RULE_ACTION_CONTROL_DT_NAME = "RULE_ACTION_CONTROL";
	public static final String EXPORT_CONFIG_DT_NAME = "EXPORT_CONFIG";
	public static final String APPROVAL_RULE_DT_NAME = "APPROVAL_RULE";
	public static final String VALIDATION_RULE_DT_NAME = "VALIDATION_RULE";

	public static final String GLOBAL_APP = "Global";
	public static final String MANAGE_WORKRULES_RMS = "MANAGE_WORKRULES";
	public static final String MANAGE_ACCESS_RS = "MANAGE_ACCESS";
	public static final String MANAGE_ACTIONS_RS = "MANAGE_ACTIONS";
	public static final String MANAGE_APPROVALS_RS = "MANAGE_APPROVALS";
	public static final String MANAGE_VALIDATIONS_RS = "MANAGE_VALIDATIONS";
	public static final String MANAGE_EXPORT_RS = "MANAGE_EXPORT";

	public static final String AUTHORIZATION_API_DESTINATION = "https://api.authentication.eu10.hana.ondemand.com/sap/rest/authorization";
	public static final String XSUAA_TOKEN_URL = "https://hrapps.authentication.eu10.hana.ondemand.com/oauth/token";
	public static final String XSUAA_CLIENT_ID = "sb-cwworkRules!t19391";
	public static final String XSUAA_CLIENT_SECRET = "od/tNBzVCJZOmPxYVWYdkSx6PZE=";
	public static final String XSUAA_USER = "ramesh@incture.com";
	public static final String XSUAA_USER_PASSWORD = "Reddy@1989";

	public static final String ROLE_COLLECTION_NAME = "name";
	public static final String ROLE_COLLECTION_DESCRIPTION = "description";
	public static final String ROLE_COLLECTION_USERS = "userReferences";
	public static final String USER_NAME = "username";
	public static final String USER_FIRST_NAME = "givenName";
	public static final String USER_LAST_NAME = "familyName";
	public static final String USER_EMAIL = "email";
	public static final String WORKRULES_ROLE_COLLECTION_PREFIX = "workrules";
	public static final String BASIC_AUTHENTICATION = "Basic";
	public static final String DT_ID = "DT_ID";
	public static final String RULE_NAME = "RULE_NAME";
	public static final String CREATED_BY = "CREATED_BY";
	public static final String UPDATED_BY = "UPDATED_BY";
	public static final String CREATED_ON = "CREATED_ON";
	public static final String UPDATED_ON = "UPDATED_ON";

	public static final String ADMIN_ROLE_COLLECTION_NAME = "workRules_Admin";

	public static final String DES_BASE_URL = "https://destination-configuration.cfapps.eu10.hana.ondemand.com/destination-configuration/v1/subaccountDestinations";
	public static final String DES_TOKEN_URL = "https://hrapps.authentication.eu10.hana.ondemand.com/oauth/token";
	public static final String DES_CLIENT_ID = "sb-cloneb9606f8a4cce481c982414bfedebf50a!b19391|destination-xsappname!b404";
	public static final String DES_CLIENT_SECRET = "/jeWtbxn3Esn77htGOgnGONM82E=";

	public static final String CLIENT_ID_NAME = "clientId";
	public static final String CLIENT_SECRET_NAME = "clientSecret";
	public static final String TOKEN_SERVICE_URL = "tokenServiceURL";
	public static final String AUTHORIZATION = "Authorization";
	public static final String APPLICATION_CATALOG_DATASET_DEFINITION = "Application field catalogue";
	public static final String ACTION_TYPE_DATASET_DEFINITION = "Action types";
	public static final String EXPRESSION_LANGUAGE = "Expression Language";
	public static final String DEFAULT_SCP_CONNECTOR_DESC = "scp_connector_destination";
	public static final String REST_API = "Rest";
	public static final String ODATA_API = "Odata";
	public static final String VALIDATION_STATUS = "VALIDATION_STATUS";
	public static final String VALIDATION_ERROR = "VALIDATION_ERROR";
	public static final String ODATA_DESTINATION_URL = "http://34.210.142.28:8080";

	public static final String SCALE_BASIS = "SCALE_BASIS";
	public static final String SCALE_TYPE = "SCALE_TYPE";
	public static final String SCALE_CHECK = "SCALE_CHECK";
	public static final String PLUS_MINUS = "PLUS_MINUS";
	public static final String EXPORT_SCENARIO = "export_scenario";
	public static final String IMPORT_SCENARIO = "import_scenario";
	public static final String EXCEL_TYPE_NORMAL = "Normal";
	public static final String CRON_EXP = "CRON";
	public static final String REPEAT_INTERVAL = "REPEAT_INTERVAL";

	// Dev Schema
	public static final String ENTITY_ACCESS_DT_ID = "DT_000188";
	public static final String RULE_ACTION_CONTROL_DT_ID = "DT_000193";
	public static final String EXPORT_CONFIG_DT_ID = "DT_001302";
	public static final String SEQUENCE = "SEQUENCE";
	public static final String BUSINESS_TYPE_TABLE = "T";
	public static final String CLASS_STANDARD = "CLASS_STANDARD";
	public static final String CLASS_SUBJECT = "CLASS_SUBJECT";
	public static final String IS_APPROVED = "IS_APPROVED";
	public static final String SUBJECT_MIN_MARKS = "SUBJECT_MIN_MARKS";
	public static final String SUBJECT_MAX_MARKS = "SUBJECT_MAX_MARKS";
	public static final String TOTAL_MARKS = "TOTAL_MARKS";
	public static final String AVERAGE_MARKS = "AVERAGE_MARKS";
	public static final String DT_001295 = "DT_001295";
	public static final String TOTAL_PERCENTAGE = "TOTAL_PERCENTAGE";
	public static final String CLASS_STANDARD_TEXT = "CLASS_STANDARD_TEXT";
	public static final String CLASS_SUBJECT_TEXT = "CLASS_SUBJECT_TEXT";
	public static final String FALSE = "false";
	public static final String IS_APPROVED_TEXT = "IS_APPROVED_TEXT";
	public static final String DT_000193 = "DT_000193";
	public static final String KUNNR = "KUNNR";
	public static final String MATNR = "MATNR";
	public static final String MAKTX = "MAKTX";
	public static final String OBJ_TYPE = "Type";
	public static final String OBJ_STATE = "State";
	public static final String E_COMMERCE = "E_COMMERCE";
	public static final String E_COMMERCE_NAME = "E_COMMERCE_NAME";
	public static final String E_COMMERCE_ADD_VALUE = "E_COMMERCE_ADD_VALUE";
	public static final String JOINT_INPUT = "_input";
	public static final String EXCEPTION_MESSAGE = " Exception Occured  message :";
	public static final String DATA_TYPE = "DATA_TYPE";
	public static final String EXCEL_MESSAGE = "Please contact admin !";
	public static final String AUTHORING_EXCEL_SHEET = "Authoring";
	public static final String ENTER_VALID_EXCEL_MESSAGE = "Please import valid Excel file!";
	public static final String YES = "YES";
	public static final String EXCEL_SHEET_PASS = "1234@12";
	public static final String EXCEL_SHEET_PASS_ALL = "123";
	public static final String NO = "NO";
	public static final String COND_CELL_CLR = "COND_CELL_CLR";
	public static final String COND_EDIT = "COND_EDIT";
	public static final String ACT_CELL_CLR = "ACT_CELL_CLR";
	public static final String ACTION_EDIT = "ACTION_EDIT";
	public static final String SYS_CELL_CLR = "SYS_CELL_CLR";
	public static final String SEQUENCE_NO = "SEQUENCE_NO";
	public static final String EXCEL_OPERATOR_DATA_TYPE = "Data Type";
	public static final String EXCEL_OPERATOR_CATEGORY = "Category";
	public static final String EXCEL_OPERATOR_SYNTAX = "Operator Syntax";
	public static final String EXCEL_OPERATOR_DESCRIPTION = "Operator Description";
	public static final String EXCEL_OPERATOR_EXPRESSION_EXAMPLE = "Expression Example";
	public static final String USER_GUIDE_SR_NO = "snoId";
	public static final String USER_GUIDE_GUIDELINES = "GuideLinesId";
	public static final String ERROR_EXCEL_SR_NO = "Sr No.";
	public static final String ERROR_EXCEL_DESCRIPTION = "Error Description";
	public static final String PROCESS_DEFINITION_ID = "Process Insatnce Id";
	public static final String TASK_INSTANCE_ID = "Task Insatnce Id";
	public static final String TASK_NAME = "Task Name";
	public static final String TASK_STATUS = "Task Status";
	public static final String TASK_UPDATED_BY = "Task Updated By";
	public static final String TASK_UPDATED_ON = "Task Updated On";
	public static final String APPROVAL_PROCESS_STATUS = "Approval Process Status";
	public static final String RULE_MAINT_SET_ID = "RULE_MAINT_SET_ID";
	public static final String SYSTEM_ID = "SYSTEM_ID";
	public static final String BUSINESS_TYPE = "BUSINESS_TYPE";
	public static final String DATASET_NAME = "DATASET_NAME";
	public static final String ATTRIBUTE_MASTER_NAME = "ATTRIBUTE_MASTER_NAME";
	public static final String SCP_EXCLUSIVE_SHF = "SHF";
	public static final String ATTRIBUTE_ID = "ATTRIBUTE_ID";
	public static final String USER_ECC = "ECC";
	public static final String APPROVAL_WORKRULES_URL = "https://incture-technologies-hrapps-cw-price-management-cw-work68563852.cfapps.eu10.hana.ondemand.com/cwworkRulesApproval-1.0.0/index.html#";
	public static final String CONTENT_TYPE = "Content-Type";
	public static final String APPLICATION_JSON = "application/json;charset=utf-8";
	public static final String SUCCESS_STATUS = "SUCCESS";
	public static final String P000041 = "neelam.raj@incture.com";
	public static final String P000072 = "polireddy.m@incture.com";
	public static final String P000032 = "ramesh@incture.com";
	public static final String BLOB_CLASS = "[B";
	public static final String DATASET_ID = "DATASET_ID";
	public static final String ACCESS_TOKEN = "access_token";

}
