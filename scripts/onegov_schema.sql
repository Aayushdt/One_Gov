-- ============================================================================
-- OneGov — Universal Citizen ID Interoperability Middleware Database Schema
-- Compatible with PostgreSQL 15+ and Supabase
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Universal Citizen Registry
CREATE TABLE IF NOT EXISTS onegov_citizens (
    onegov_id VARCHAR(32) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(250) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    date_of_birth DATE NOT NULL,
    nationality VARCHAR(50) DEFAULT 'INDIAN',
    marital_status VARCHAR(30),
    occupation VARCHAR(100),
    address_line1 VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    phone_masked VARCHAR(20),
    email_masked VARCHAR(100),
    citizen_status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citizens_state ON onegov_citizens(state);
CREATE INDEX IF NOT EXISTS idx_citizens_district ON onegov_citizens(district);
CREATE INDEX IF NOT EXISTS idx_citizens_dob ON onegov_citizens(date_of_birth);

-- 2. Federated Identity Resolution Layer
CREATE TABLE IF NOT EXISTS department_identity_mapping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    department VARCHAR(50) NOT NULL,
    departmental_identifier VARCHAR(100) NOT NULL,
    identifier_type VARCHAR(50) NOT NULL,
    verification_status VARCHAR(30) DEFAULT 'VERIFIED',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_dept_mapping UNIQUE (department, departmental_identifier)
);

CREATE INDEX IF NOT EXISTS idx_dept_map_onegov ON department_identity_mapping(onegov_id);
CREATE INDEX IF NOT EXISTS idx_dept_map_lookup ON department_identity_mapping(department, departmental_identifier);

-- 3. Identity / Aadhaar Simulation
CREATE TABLE IF NOT EXISTS identity_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    simulated_aadhaar_id VARCHAR(32) UNIQUE NOT NULL,
    aadhaar_masked VARCHAR(20) NOT NULL,
    name VARCHAR(250) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    mobile_linked BOOLEAN DEFAULT TRUE,
    email_linked BOOLEAN DEFAULT TRUE,
    biometric_status VARCHAR(30) DEFAULT 'LOCKED',
    kyc_status VARCHAR(30) DEFAULT 'ACTIVE',
    identity_status VARCHAR(30) DEFAULT 'ACTIVE',
    verification_status VARCHAR(30) DEFAULT 'VERIFIED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ident_onegov ON identity_records(onegov_id);

-- 4. PAN / Tax Simulation
CREATE TABLE IF NOT EXISTS pan_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    simulated_pan VARCHAR(20) UNIQUE NOT NULL,
    pan_masked VARCHAR(20) NOT NULL,
    name VARCHAR(250) NOT NULL,
    date_of_birth DATE NOT NULL,
    tax_residency VARCHAR(50) DEFAULT 'RESIDENT_INDIVIDUAL',
    income_range VARCHAR(50) NOT NULL,
    income_band VARCHAR(20) NOT NULL,
    occupation VARCHAR(100),
    filing_status VARCHAR(50) DEFAULT 'FILED_VERIFIED',
    last_filing_year VARCHAR(20) DEFAULT 'AY 2024-25',
    tax_compliance_status VARCHAR(30) DEFAULT 'COMPLIANT',
    verification_status VARCHAR(30) DEFAULT 'VERIFIED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pan_onegov ON pan_records(onegov_id);

-- 5. Banking Simulation
CREATE TABLE IF NOT EXISTS bank_customers (
    customer_id VARCHAR(50) PRIMARY KEY,
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    primary_bank_name VARCHAR(100) NOT NULL,
    kyc_status VARCHAR(30) DEFAULT 'ACTIVE',
    customer_since DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bank_accounts (
    account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id VARCHAR(50) NOT NULL REFERENCES bank_customers(customer_id) ON DELETE CASCADE,
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    bank_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(30) NOT NULL,
    account_number_masked VARCHAR(30) NOT NULL,
    simulated_ifsc VARCHAR(20) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    account_status VARCHAR(30) DEFAULT 'ACTIVE',
    kyc_status VARCHAR(30) DEFAULT 'VERIFIED',
    balance_range VARCHAR(50) NOT NULL,
    balance_threshold_flag BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_acc_onegov ON bank_accounts(onegov_id);

-- 6. Driving Licences (RTO)
CREATE TABLE IF NOT EXISTS driving_licences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    simulated_dl_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(250) NOT NULL,
    date_of_birth DATE NOT NULL,
    licence_class VARCHAR(50)[] NOT NULL,
    issuing_rto VARCHAR(100) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    licence_status VARCHAR(30) DEFAULT 'ACTIVE',
    address TEXT NOT NULL,
    verification_status VARCHAR(30) DEFAULT 'VERIFIED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dl_onegov ON driving_licences(onegov_id);

-- 7. Vehicles & Traffic Challans
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id VARCHAR(50) PRIMARY KEY,
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    simulated_registration_number VARCHAR(30) UNIQUE NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    fuel_type VARCHAR(30) NOT NULL,
    registration_date DATE NOT NULL,
    registration_expiry DATE NOT NULL,
    ownership_status VARCHAR(30) DEFAULT 'FIRST_OWNER',
    insurance_status VARCHAR(30) DEFAULT 'ACTIVE_COMPREHENSIVE',
    pollution_certificate_status VARCHAR(30) DEFAULT 'VALID',
    rto_code VARCHAR(20) NOT NULL,
    vehicle_status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_veh_onegov ON vehicles(onegov_id);

CREATE TABLE IF NOT EXISTS traffic_challans (
    challan_id VARCHAR(50) PRIMARY KEY,
    vehicle_id VARCHAR(50) NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    violation_type VARCHAR(100) NOT NULL,
    violation_date TIMESTAMPTZ NOT NULL,
    location VARCHAR(200) NOT NULL,
    fine_amount NUMERIC(10, 2) NOT NULL,
    payment_status VARCHAR(30) DEFAULT 'UNPAID',
    due_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challan_onegov ON traffic_challans(onegov_id);
CREATE INDEX IF NOT EXISTS idx_challan_status ON traffic_challans(payment_status);

-- 8. Police Verifications & Cases
CREATE TABLE IF NOT EXISTS police_verifications (
    verification_id VARCHAR(50) PRIMARY KEY,
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    police_station VARCHAR(150) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    verification_date DATE NOT NULL,
    identity_verified BOOLEAN DEFAULT TRUE,
    address_verified BOOLEAN DEFAULT TRUE,
    criminal_record_flag BOOLEAN DEFAULT FALSE,
    pending_case_flag BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(30) DEFAULT 'CLEAR',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS police_cases (
    case_id VARCHAR(50) PRIMARY KEY,
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    fir_number VARCHAR(100) NOT NULL,
    police_station VARCHAR(150) NOT NULL,
    sections VARCHAR(200) NOT NULL,
    case_status VARCHAR(30) DEFAULT 'UNDER_INVESTIGATION',
    filing_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pol_onegov ON police_verifications(onegov_id);

-- 9. Passports
CREATE TABLE IF NOT EXISTS passports (
    simulated_passport_number VARCHAR(30) PRIMARY KEY,
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    name VARCHAR(250) NOT NULL,
    date_of_birth DATE NOT NULL,
    nationality VARCHAR(50) DEFAULT 'INDIAN',
    passport_type VARCHAR(20) DEFAULT 'REGULAR_P',
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    passport_status VARCHAR(30) DEFAULT 'ACTIVE',
    police_verification_status VARCHAR(30) DEFAULT 'VERIFIED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pass_onegov ON passports(onegov_id);

-- 10. Voter ID (EPIC)
CREATE TABLE IF NOT EXISTS voter_records (
    simulated_voter_id VARCHAR(30) PRIMARY KEY,
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    name VARCHAR(250) NOT NULL,
    constituency VARCHAR(150) NOT NULL,
    polling_station VARCHAR(200) NOT NULL,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    electoral_status VARCHAR(30) DEFAULT 'ACTIVE_ENROLLED',
    address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voter_onegov ON voter_records(onegov_id);

-- 11. Property / Land Records
CREATE TABLE IF NOT EXISTS property_records (
    property_id VARCHAR(50) PRIMARY KEY,
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    property_reference VARCHAR(100) NOT NULL,
    property_type VARCHAR(50) NOT NULL,
    ownership_type VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    area_range VARCHAR(50) NOT NULL,
    registration_date DATE NOT NULL,
    encumbrance_status VARCHAR(30) DEFAULT 'NIL_ENCUMBRANCE',
    property_status VARCHAR(30) DEFAULT 'VERIFIED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prop_onegov ON property_records(onegov_id);

-- 12. Municipal Data
CREATE TABLE IF NOT EXISTS municipal_records (
    holding_number VARCHAR(50) PRIMARY KEY,
    property_id VARCHAR(50) REFERENCES property_records(property_id) ON DELETE CASCADE,
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    municipal_body VARCHAR(150) NOT NULL,
    ward VARCHAR(50) NOT NULL,
    property_tax_status VARCHAR(30) DEFAULT 'PAID',
    water_connection VARCHAR(30) DEFAULT 'ACTIVE',
    waste_collection VARCHAR(30) DEFAULT 'SUBSCRIBED',
    building_permission VARCHAR(30) DEFAULT 'APPROVED',
    occupancy_certificate VARCHAR(30) DEFAULT 'ISSUED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_muni_onegov ON municipal_records(onegov_id);

-- 13. Education Records
CREATE TABLE IF NOT EXISTS education_records (
    education_record_id VARCHAR(50) PRIMARY KEY,
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    institution VARCHAR(200) NOT NULL,
    board_or_university VARCHAR(200) NOT NULL,
    qualification VARCHAR(100) NOT NULL,
    specialization VARCHAR(150),
    enrollment_year INT NOT NULL,
    graduation_year INT,
    grade_range VARCHAR(50) NOT NULL,
    certificate_reference VARCHAR(100),
    verification_status VARCHAR(30) DEFAULT 'VERIFIED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edu_onegov ON education_records(onegov_id);

-- 14. Employment Records (EPFO)
CREATE TABLE IF NOT EXISTS employment_records (
    employment_id VARCHAR(50) PRIMARY KEY,
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    employer VARCHAR(200) NOT NULL,
    employee_reference VARCHAR(100),
    designation VARCHAR(150),
    employment_type VARCHAR(50) NOT NULL,
    joining_date DATE NOT NULL,
    leaving_date DATE,
    employment_status VARCHAR(30) DEFAULT 'ACTIVE',
    salary_range VARCHAR(50),
    work_location VARCHAR(100),
    verification_status VARCHAR(30) DEFAULT 'VERIFIED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emp_onegov ON employment_records(onegov_id);

-- 15. Business / GST
CREATE TABLE IF NOT EXISTS business_records (
    business_id VARCHAR(50) PRIMARY KEY,
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    business_name VARCHAR(200) NOT NULL,
    business_type VARCHAR(50) NOT NULL,
    registration_number VARCHAR(50),
    simulated_gst_number VARCHAR(30) UNIQUE NOT NULL,
    registration_date DATE NOT NULL,
    registered_address TEXT NOT NULL,
    turnover_range VARCHAR(50) NOT NULL,
    gst_status VARCHAR(30) DEFAULT 'ACTIVE',
    business_status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_biz_onegov ON business_records(onegov_id);

-- 16. Government Welfare Schemes
CREATE TABLE IF NOT EXISTS welfare_records (
    application_id VARCHAR(50) PRIMARY KEY,
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    scheme_name VARCHAR(200) NOT NULL,
    application_number VARCHAR(100) UNIQUE NOT NULL,
    application_date DATE NOT NULL,
    eligibility_status VARCHAR(30) DEFAULT 'ELIGIBLE',
    application_status VARCHAR(30) DEFAULT 'APPROVED',
    benefit_type VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    approval_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_welfare_onegov ON welfare_records(onegov_id);

-- 17. Pension Records
CREATE TABLE IF NOT EXISTS pension_records (
    pension_id VARCHAR(50) PRIMARY KEY,
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    pension_reference VARCHAR(100) UNIQUE NOT NULL,
    pension_type VARCHAR(50) NOT NULL,
    eligibility_status VARCHAR(30) DEFAULT 'ELIGIBLE',
    pension_status VARCHAR(30) DEFAULT 'ACTIVE',
    contribution_years_range VARCHAR(50),
    registration_date DATE NOT NULL,
    verification_status VARCHAR(30) DEFAULT 'VERIFIED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pen_onegov ON pension_records(onegov_id);

-- 18. Utility Data (Power, Water, Gas)
CREATE TABLE IF NOT EXISTS utility_records (
    utility_id VARCHAR(50) PRIMARY KEY,
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    utility_type VARCHAR(30) NOT NULL,
    provider VARCHAR(150) NOT NULL,
    account_reference VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    connection_status VARCHAR(30) DEFAULT 'ACTIVE',
    billing_status VARCHAR(30) DEFAULT 'CURRENT_NO_DUES',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_util_onegov ON utility_records(onegov_id);

-- 19. Insurance Policies
CREATE TABLE IF NOT EXISTS insurance_records (
    policy_id VARCHAR(50) PRIMARY KEY,
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    provider VARCHAR(150) NOT NULL,
    policy_reference VARCHAR(50) NOT NULL,
    policy_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    coverage_range VARCHAR(50) NOT NULL,
    policy_status VARCHAR(30) DEFAULT 'ACTIVE',
    verification_status VARCHAR(30) DEFAULT 'VERIFIED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ins_onegov ON insurance_records(onegov_id);

-- 20. Court / Judiciary Records
CREATE TABLE IF NOT EXISTS court_records (
    case_id VARCHAR(50) PRIMARY KEY,
    onegov_id VARCHAR(32) NOT NULL REFERENCES onegov_citizens(onegov_id) ON DELETE CASCADE,
    case_reference VARCHAR(100) NOT NULL,
    court_name VARCHAR(200) NOT NULL,
    case_category VARCHAR(50) NOT NULL,
    citizen_role VARCHAR(30) NOT NULL,
    filing_date DATE NOT NULL,
    case_status VARCHAR(30) DEFAULT 'DISPOSED',
    next_hearing_date DATE,
    disposition_status VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_court_onegov ON court_records(onegov_id);
