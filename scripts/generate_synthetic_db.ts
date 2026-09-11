import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// OneGov Synthetic Data Generator (10,000 Citizens & 22 Departmental Silos)
// ============================================================================

const FIRST_NAMES_MALE = [
  'Rahul', 'Amit', 'Vikram', 'Rohan', 'Arjun', 'Suresh', 'Deepak', 'Manish', 'Aditya', 'Abhishek',
  'Gaurav', 'Nitin', 'Prateek', 'Kunal', 'Ashok', 'Vijay', 'Prakash', 'Rajesh', 'Sanjay', 'Alok',
  'Harish', 'Tarun', 'Anand', 'Naveen', 'Vishal', 'Manoj', 'Karan', 'Sunil', 'Ajay', 'Varun',
  'Ramesh', 'Mohan', 'Kailash', 'Siddharth', 'Yash', 'Devendra', 'Shubham', 'Pankaj', 'Vikas', 'Girish'
];

const FIRST_NAMES_FEMALE = [
  'Priya', 'Sneha', 'Ananya', 'Pooja', 'Neha', 'Kavita', 'Shalini', 'Meenakshi', 'Divya', 'Ritu',
  'Sunita', 'Aarti', 'Deepa', 'Swati', 'Preeti', 'Rashmi', 'Geeta', 'Suman', 'Jyoti', 'Shweta',
  'Archana', 'Monika', 'Kiran', 'Anita', 'Shruti', 'Nandini', 'Meera', 'Rupal', 'Vandana', 'Smita',
  'Pallavi', 'Tanvi', 'Isha', 'Bhavna', 'Radha', 'Komal', 'Sangeeta', 'Payal', 'Reena', 'Mamta'
];

const MIDDLE_NAMES_MALE = ['Kumar', 'Prasad', 'Chandra', 'Nath', 'Singh', 'Lal', 'Dev', 'Raj', 'Kant', ''];
const MIDDLE_NAMES_FEMALE = ['Kumari', 'Devi', 'Lata', 'Shree', 'Rani', 'Ben', 'Priya', ''];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Singh', 'Gupta', 'Kumar', 'Joshi', 'Bose', 'Chatterjee', 'Roy',
  'Nair', 'Iyer', 'Reddy', 'Rao', 'Deshmukh', 'Kulkarni', 'Hegde', 'Mehta', 'Shah', 'Agarwal',
  'Banerjee', 'Mishra', 'Pandey', 'Choudhary', 'Yadav', 'Thakur', 'Mukherjee', 'Dutta', 'Das', 'Sen',
  'Saxena', 'Bhat', 'Menon', 'Pillai', 'Gowda', 'Shetty', 'Bhattacharya', 'Chauhan', 'Dubey', 'Tiwari'
];

const STATES_CITIES: Record<string, { capital: string; cities: string[]; districts: string[]; pincodeBase: number }> = {
  'Maharashtra': { capital: 'Mumbai', cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'], districts: ['Mumbai City', 'Pune', 'Nagpur', 'Nashik', 'Thane'], pincodeBase: 400000 },
  'Karnataka': { capital: 'Bengaluru', cities: ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi'], districts: ['Bengaluru Urban', 'Mysuru', 'Dharwad', 'Dakshina Kannada', 'Belagavi'], pincodeBase: 560000 },
  'Tamil Nadu': { capital: 'Chennai', cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'], districts: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'], pincodeBase: 600000 },
  'Delhi': { capital: 'New Delhi', cities: ['New Delhi', 'North Delhi', 'South Delhi', 'Dwarka', 'Rohini'], districts: ['New Delhi', 'Central Delhi', 'South Delhi', 'West Delhi', 'East Delhi'], pincodeBase: 110000 },
  'Bihar': { capital: 'Patna', cities: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga'], districts: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga'], pincodeBase: 800000 },
  'Uttar Pradesh': { capital: 'Lucknow', cities: ['Lucknow', 'Kanpur', 'Varanasi', 'Noida', 'Prayagraj'], districts: ['Lucknow', 'Kanpur Nagar', 'Varanasi', 'Gautam Buddha Nagar', 'Prayagraj'], pincodeBase: 226000 },
  'West Bengal': { capital: 'Kolkata', cities: ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri', 'Asansol'], districts: ['Kolkata', 'Howrah', 'Paschim Bardhaman', 'Darjeeling', 'North 24 Parganas'], pincodeBase: 700000 },
  'Gujarat': { capital: 'Gandhinagar', cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'], districts: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'], pincodeBase: 380000 },
  'Telangana': { capital: 'Hyderabad', cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'], districts: ['Hyderabad', 'Warangal Urban', 'Nizamabad', 'Karimnagar', 'Khammam'], pincodeBase: 500000 },
  'Rajasthan': { capital: 'Jaipur', cities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'], districts: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'], pincodeBase: 302000 },
};

const UNIVERSITIES = [
  { name: 'National Institute of Technology, Trichy', board: 'NIT Council / MoE' },
  { name: 'Indian Institute of Technology Delhi', board: 'IIT Council / MoE' },
  { name: 'University of Delhi', board: 'UGC / Central University' },
  { name: 'Jadavpur University, Kolkata', board: 'State University, WB' },
  { name: 'Indian Institute of Science, Bengaluru', board: 'IISc Bangalore' },
  { name: 'Anna University, Chennai', board: 'Anna University' },
  { name: 'University of Mumbai', board: 'Mumbai University' },
  { name: 'Banaras Hindu University', board: 'Central University' },
];

const VEHICLE_MODELS = [
  { mfg: 'Maruti Suzuki', model: 'Swift Dzire', type: 'FOUR_WHEELER_NON_TRANSPORT', fuel: 'PETROL' },
  { mfg: 'Tata Motors', model: 'Nexon EV', type: 'FOUR_WHEELER_NON_TRANSPORT', fuel: 'ELECTRIC' },
  { mfg: 'Hyundai', model: 'Creta', type: 'FOUR_WHEELER_NON_TRANSPORT', fuel: 'DIESEL' },
  { mfg: 'Royal Enfield', model: 'Classic 350', type: 'TWO_WHEELER', fuel: 'PETROL' },
  { mfg: 'Hero MotoCorp', model: 'Splendor Plus', type: 'TWO_WHEELER', fuel: 'PETROL' },
  { mfg: 'Tata Motors', model: 'Ace Gold Commercial', type: 'COMMERCIAL_GOODS', fuel: 'CNG' },
  { mfg: 'Mahindra', model: 'Bolero Camper', type: 'COMMERCIAL_GOODS', fuel: 'DIESEL' },
];

const VIOLATIONS = [
  { type: 'SPEED_LIMIT_VIOLATION', fine: 2000 },
  { type: 'RED_LIGHT_JUMP', fine: 1000 },
  { type: 'NO_HELMET', fine: 500 },
  { type: 'WRONG_SIDE_DRIVING', fine: 1500 },
  { type: 'PUC_EXPIRED', fine: 1000 },
  { type: 'DANGEROUS_PARKING', fine: 500 },
];

// Helper: Deterministic PRNG for repeatability
let seed = 42;
function random(): number {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

function randInt(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

function randChoice<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function escapeSql(str: any): string {
  if (str === null || str === undefined) return 'NULL';
  if (typeof str === 'boolean') return str ? 'TRUE' : 'FALSE';
  if (typeof str === 'number') return String(str);
  if (Array.isArray(str)) return `ARRAY[${str.map(s => `'${escapeSql(s)}'`).join(',')}]`;
  return `'${String(str).replace(/'/g, "''")}'`;
}

// Format OneGov ID: OG-2026-00000001
function formatOneGovId(num: number): string {
  return `OG-2026-${String(num).padStart(8, '0')}`;
}

async function generateDataset(totalCount = 10000) {
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const sqlFile = path.join(outputDir, 'onegov_synthetic_data.sql');
  const writeStream = fs.createWriteStream(sqlFile, { flags: 'w' });

  writeStream.write(`-- OneGov Synthetic Population Data (${totalCount} Citizens + 22 Departments)\n`);
  writeStream.write(`BEGIN;\n\n`);

  console.log(`Generating ${totalCount} OneGov citizens and interconnected departmental silos...`);

  // Batch insert helpers
  const BATCH_SIZE = 1000;

  // 1. Citizens
  console.log('-> Generating onegov_citizens and department mappings...');
  for (let i = 1; i <= totalCount; i++) {
    const onegovId = formatOneGovId(i);
    const isMale = random() > 0.48;
    const firstName = isMale ? randChoice(FIRST_NAMES_MALE) : randChoice(FIRST_NAMES_FEMALE);
    const middleName = isMale ? randChoice(MIDDLE_NAMES_MALE) : randChoice(MIDDLE_NAMES_FEMALE);
    const lastName = randChoice(LAST_NAMES);
    const fullName = middleName ? `${firstName} ${middleName} ${lastName}` : `${firstName} ${lastName}`;

    // Age distribution: 18 to 80
    const age = i <= 50 ? (i % 40 + 20) : randInt(18, 78);
    const birthYear = 2026 - age;
    const birthMonth = randInt(1, 12);
    const birthDay = randInt(1, 28);
    const dob = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;

    const stateName = randChoice(Object.keys(STATES_CITIES));
    const stateInfo = STATES_CITIES[stateName];
    const city = randChoice(stateInfo.cities);
    const district = randChoice(stateInfo.districts);
    const pincode = String(stateInfo.pincodeBase + randInt(1, 999));
    const phoneMasked = `+91-XXXXX-${randInt(10000, 99999)}`;
    const emailMasked = `${firstName.toLowerCase().slice(0, 2)}****${lastName.toLowerCase().slice(0, 1)}@demo.gov.in`;
    const occupation = age < 23 ? 'Student' : age > 60 ? 'Retired' : randChoice(['Software Engineer', 'Teacher', 'Civil Servant', 'Businessman', 'Accountant', 'Farmer', 'Doctor']);

    writeStream.write(`INSERT INTO onegov_citizens (onegov_id, first_name, middle_name, last_name, full_name, gender, date_of_birth, marital_status, occupation, address_line1, city, district, state, pincode, phone_masked, email_masked, citizen_status) VALUES (${escapeSql(onegovId)}, ${escapeSql(firstName)}, ${escapeSql(middleName || null)}, ${escapeSql(lastName)}, ${escapeSql(fullName)}, ${escapeSql(isMale ? 'MALE' : 'FEMALE')}, ${escapeSql(dob)}, ${escapeSql(age > 26 ? 'MARRIED' : 'SINGLE')}, ${escapeSql(occupation)}, ${escapeSql(`House No. ${randInt(1, 999)}, Sector ${randInt(1, 40)}`)}, ${escapeSql(city)}, ${escapeSql(district)}, ${escapeSql(stateName)}, ${escapeSql(pincode)}, ${escapeSql(phoneMasked)}, ${escapeSql(emailMasked)}, 'ACTIVE');\n`);

    // 2. Department Mapping
    const aadhaarId = `SIM-AADHAAR-${String(i).padStart(6, '0')}`;
    const panId = `SIM-PAN-${String(i).padStart(6, '0')}`;
    const custId = `SIM-BANK-CUST-${String(i).padStart(6, '0')}`;
    const dlId = `SIM-DL-${String(i).padStart(6, '0')}`;
    const voterId = `SIM-VOTER-${String(i).padStart(6, '0')}`;
    const passId = `SIM-PASS-${String(i).padStart(6, '0')}`;

    writeStream.write(`INSERT INTO department_identity_mapping (onegov_id, department, departmental_identifier, identifier_type) VALUES (${escapeSql(onegovId)}, 'AADHAAR_SIM', ${escapeSql(aadhaarId)}, 'UID_TOKEN');\n`);
    if (age >= 18 && i <= 8000) {
      writeStream.write(`INSERT INTO department_identity_mapping (onegov_id, department, departmental_identifier, identifier_type) VALUES (${escapeSql(onegovId)}, 'PAN_SIM', ${escapeSql(panId)}, 'PAN_NUMBER');\n`);
    }
    if (i <= 7500) {
      writeStream.write(`INSERT INTO department_identity_mapping (onegov_id, department, departmental_identifier, identifier_type) VALUES (${escapeSql(onegovId)}, 'BANK_SIM', ${escapeSql(custId)}, 'CUSTOMER_ID');\n`);
    }
    if (age >= 18 && i <= 6000) {
      writeStream.write(`INSERT INTO department_identity_mapping (onegov_id, department, departmental_identifier, identifier_type) VALUES (${escapeSql(onegovId)}, 'DL_SIM', ${escapeSql(dlId)}, 'DL_NUMBER');\n`);
    }
    if (age >= 18 && i <= 8500) {
      writeStream.write(`INSERT INTO department_identity_mapping (onegov_id, department, departmental_identifier, identifier_type) VALUES (${escapeSql(onegovId)}, 'VOTER_SIM', ${escapeSql(voterId)}, 'EPIC_NUMBER');\n`);
    }
    if (i <= 4500) {
      writeStream.write(`INSERT INTO department_identity_mapping (onegov_id, department, departmental_identifier, identifier_type) VALUES (${escapeSql(onegovId)}, 'PASSPORT_SIM', ${escapeSql(passId)}, 'PASSPORT_NO');\n`);
    }

    // 3. Identity Records (95%)
    if (i <= 9500) {
      const isMismatched = (i === 5 || (i > 50 && i % 45 === 0));
      const identName = isMismatched ? `${firstName} ${lastName}` : fullName;
      writeStream.write(`INSERT INTO identity_records (onegov_id, simulated_aadhaar_id, aadhaar_masked, name, date_of_birth, gender, address, district, state, pincode, biometric_status, kyc_status, verification_status) VALUES (${escapeSql(onegovId)}, ${escapeSql(aadhaarId)}, ${escapeSql(`XXXXXXXX${randInt(1000, 9999)}`)}, ${escapeSql(identName)}, ${escapeSql(dob)}, ${escapeSql(isMale ? 'MALE' : 'FEMALE')}, ${escapeSql(`${city}, ${district}`)}, ${escapeSql(district)}, ${escapeSql(stateName)}, ${escapeSql(pincode)}, 'LOCKED', 'ACTIVE', 'VERIFIED');\n`);
    }

    // 4. PAN Records (80%)
    if (i <= 8000) {
      const isHighIncome = (i === 13 || i === 20 || (i > 50 && i % 10 === 0));
      const incomeRange = isHighIncome ? `₹${randInt(14, 45)},00,000 / yr` : `₹${randInt(180, 290)},000 / yr`;
      const incomeBand = isHighIncome ? 'HIGH' : (random() > 0.4 ? 'LOW' : 'MEDIUM');
      writeStream.write(`INSERT INTO pan_records (onegov_id, simulated_pan, pan_masked, name, date_of_birth, income_range, income_band, occupation, filing_status, last_filing_year, tax_compliance_status) VALUES (${escapeSql(onegovId)}, ${escapeSql(panId)}, ${escapeSql(`ABCPS${randInt(1000, 9999)}F`)}, ${escapeSql(fullName)}, ${escapeSql(dob)}, ${escapeSql(incomeRange)}, ${escapeSql(incomeBand)}, ${escapeSql(occupation)}, 'FILED_VERIFIED', 'AY 2024-25', 'COMPLIANT');\n`);
    }

    // 5. Bank Customers & Accounts (75%)
    if (i <= 7500) {
      const bankName = randChoice(['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Punjab National Bank']);
      const kycStatus = (i === 7 || (i > 50 && i % 60 === 0)) ? 'EXPIRED_PENDING_REKYC' : 'ACTIVE';
      writeStream.write(`INSERT INTO bank_customers (customer_id, onegov_id, primary_bank_name, kyc_status, customer_since) VALUES (${escapeSql(custId)}, ${escapeSql(onegovId)}, ${escapeSql(bankName)}, ${escapeSql(kycStatus)}, '2020-01-15');\n`);
      writeStream.write(`INSERT INTO bank_accounts (customer_id, onegov_id, bank_name, account_type, account_number_masked, simulated_ifsc, branch, account_status, balance_range, balance_threshold_flag) VALUES (${escapeSql(custId)}, ${escapeSql(onegovId)}, ${escapeSql(bankName)}, 'SAVINGS', ${escapeSql(`XXXXXXXX${randInt(1000, 9999)}`)}, 'SBIN0004921', ${escapeSql(`${city} Main Branch`)}, 'ACTIVE', '₹25,000 - ₹75,000', TRUE);\n`);
      if (i % 3 === 0) {
        writeStream.write(`INSERT INTO bank_accounts (customer_id, onegov_id, bank_name, account_type, account_number_masked, simulated_ifsc, branch, account_status, balance_range, balance_threshold_flag) VALUES (${escapeSql(custId)}, ${escapeSql(onegovId)}, 'HDFC Bank', 'SALARY', ${escapeSql(`XXXXXXXX${randInt(1000, 9999)}`)}, 'HDFC0001822', ${escapeSql(`${city} Sector 18`)}, 'ACTIVE', '₹1,50,000 - ₹3,00,000', TRUE);\n`);
      }
    }

    // 6. Driving Licences (60%)
    if (i <= 6000 && age >= 18) {
      const isExpired = (i === 3 || (i > 50 && i % 35 === 0));
      const expDate = isExpired ? '2023-11-15' : '2038-04-17';
      const status = isExpired ? 'EXPIRED' : (i === 17 ? 'SUSPENDED' : 'ACTIVE');
      writeStream.write(`INSERT INTO driving_licences (onegov_id, simulated_dl_number, name, date_of_birth, licence_class, issuing_rto, issue_date, expiry_date, licence_status, address) VALUES (${escapeSql(onegovId)}, ${escapeSql(dlId)}, ${escapeSql(fullName)}, ${escapeSql(dob)}, ARRAY['LMV', 'MCWG'], ${escapeSql(`${stateName.slice(0, 2).toUpperCase()}-01 (${city})`)}, '2018-04-17', ${escapeSql(expDate)}, ${escapeSql(status)}, ${escapeSql(`${city}, ${stateName}`)});\n`);
    }

    // 7. Vehicles & Challans (70%)
    if (i <= 7000) {
      const vehId = `SIM-VEH-${String(i).padStart(6, '0')}`;
      const vModel = randChoice(VEHICLE_MODELS);
      const regNo = `${stateName.slice(0, 2).toUpperCase()}-${randInt(1, 12).toString().padStart(2, '0')}-AB-${randInt(1000, 9999)}`;
      writeStream.write(`INSERT INTO vehicles (vehicle_id, onegov_id, simulated_registration_number, manufacturer, model, vehicle_type, fuel_type, registration_date, registration_expiry, rto_code) VALUES (${escapeSql(vehId)}, ${escapeSql(onegovId)}, ${escapeSql(regNo)}, ${escapeSql(vModel.mfg)}, ${escapeSql(vModel.model)}, ${escapeSql(vModel.type)}, ${escapeSql(vModel.fuel)}, '2021-06-10', '2036-06-10', ${escapeSql(`${stateName.slice(0, 2).toUpperCase()}-01`)});\n`);

      // Challans
      const challanCount = (i === 4) ? 7 : (i === 9 ? 4 : (i % 3 === 0 ? randInt(1, 3) : 0));
      for (let c = 1; c <= challanCount; c++) {
        const challanId = `SIM-CHALLAN-${i}-${c}`;
        const viol = randChoice(VIOLATIONS);
        const isPaid = (i === 4) ? 'UNPAID' : (random() > 0.3 ? 'PAID' : 'UNPAID');
        writeStream.write(`INSERT INTO traffic_challans (challan_id, vehicle_id, onegov_id, violation_type, violation_date, location, fine_amount, payment_status, due_date) VALUES (${escapeSql(challanId)}, ${escapeSql(vehId)}, ${escapeSql(onegovId)}, ${escapeSql(viol.type)}, NOW() - INTERVAL '${c * 15} days', ${escapeSql(`${city} Ring Road Junction`)}, ${viol.fine}, ${escapeSql(isPaid)}, CURRENT_DATE + INTERVAL '30 days');\n`);
      }
    }

    // 8. Police Verifications (90%)
    if (i <= 9000) {
      const verId = `SIM-POL-VER-${String(i).padStart(6, '0')}`;
      const status = (i === 6) ? 'PENDING_REVIEW' : 'CLEAR';
      writeStream.write(`INSERT INTO police_verifications (verification_id, onegov_id, police_station, district, state, verification_date, verification_status) VALUES (${escapeSql(verId)}, ${escapeSql(onegovId)}, ${escapeSql(`${city} Central Station`)}, ${escapeSql(district)}, ${escapeSql(stateName)}, '2023-08-12', ${escapeSql(status)});\n`);
    }

    // 9. Passports (45%)
    if (i <= 4500) {
      const isExp = (i === 8);
      const pExp = isExp ? '2024-02-10' : '2032-05-19';
      writeStream.write(`INSERT INTO passports (simulated_passport_number, onegov_id, name, date_of_birth, issue_date, expiry_date, passport_status) VALUES (${escapeSql(passId)}, ${escapeSql(onegovId)}, ${escapeSql(fullName)}, ${escapeSql(dob)}, '2022-05-19', ${escapeSql(pExp)}, ${escapeSql(isExp ? 'EXPIRED' : 'ACTIVE')});\n`);
    }

    // 10. Voter ID (85%)
    if (i <= 8500 && age >= 18) {
      writeStream.write(`INSERT INTO voter_records (simulated_voter_id, onegov_id, name, constituency, polling_station, state, district, address) VALUES (${escapeSql(voterId)}, ${escapeSql(onegovId)}, ${escapeSql(fullName)}, ${escapeSql(`${city} Central AC`)}, ${escapeSql(`Government Higher Secondary School, Ward ${randInt(1, 30)}`)}, ${escapeSql(stateName)}, ${escapeSql(district)}, ${escapeSql(`${city}, ${stateName}`)});\n`);
    }

    // 11. Property Records (35%)
    if (i <= 3500) {
      const propId = `SIM-PROP-${String(i).padStart(6, '0')}`;
      const encumbrance = (i === 10) ? 'DISPUTED' : 'NIL_ENCUMBRANCE';
      writeStream.write(`INSERT INTO property_records (property_id, onegov_id, property_reference, property_type, ownership_type, address, district, state, area_range, registration_date, encumbrance_status) VALUES (${escapeSql(propId)}, ${escapeSql(onegovId)}, ${escapeSql(`KHATA-A-${randInt(10000, 99999)}`)}, 'RESIDENTIAL_APARTMENT', 'SOLE_OWNER', ${escapeSql(`Flat ${randInt(101, 904)}, ${city}`)}, ${escapeSql(district)}, ${escapeSql(stateName)}, '1,250 sqft', '2019-11-20', ${escapeSql(encumbrance)});\n`);
      writeStream.write(`INSERT INTO municipal_records (holding_number, property_id, onegov_id, municipal_body, ward, property_tax_status) VALUES (${escapeSql(`HOLD-${i}`)}, ${escapeSql(propId)}, ${escapeSql(onegovId)}, ${escapeSql(`${city} Municipal Corporation`)}, ${escapeSql(`Ward ${randInt(1, 45)}`)}, ${escapeSql(i === 19 ? 'ARREARS_PENDING' : 'PAID')});\n`);
    }

    // 12. Education Records (70%)
    if (i <= 7000) {
      const eduId = `SIM-EDU-${String(i).padStart(6, '0')}`;
      const univ = (i === 1 || i === 2) ? UNIVERSITIES[0] : randChoice(UNIVERSITIES);
      const qual = age < 24 ? 'BACHELORS' : (age < 30 ? 'MASTERS' : 'SECONDARY_10TH');
      const prog = (i === 1 || i === 2) ? 'B.Tech in Computer Science & Engineering' : (i === 18 ? 'PhD in Applied Economics' : 'Bachelor of Engineering');
      const cgpa = (i === 1 || i === 2) ? '8.92 / 10.0' : `${randInt(7, 9)}.${randInt(10, 99)} / 10.0`;
      writeStream.write(`INSERT INTO education_records (education_record_id, onegov_id, institution, board_or_university, qualification, program, enrollment_year, graduation_year, grade_range, enrollment_status) VALUES (${escapeSql(eduId)}, ${escapeSql(onegovId)}, ${escapeSql(univ.name)}, ${escapeSql(univ.board)}, ${escapeSql(qual)}, ${escapeSql(prog)}, ${2026 - (age - 18)}, ${2026 + (22 - age)}, ${escapeSql(cgpa)}, 'ACTIVE');\n`);
    }

    // 13. Employment Records (55%)
    if (i <= 5500 && age >= 22 && age <= 60) {
      const empId = `SIM-EMP-${String(i).padStart(6, '0')}`;
      writeStream.write(`INSERT INTO employment_records (employment_id, onegov_id, employer, designation, employment_type, joining_date, salary_range, work_location) VALUES (${escapeSql(empId)}, ${escapeSql(onegovId)}, ${escapeSql(`${city} Infotech Pvt Ltd`)}, ${escapeSql(occupation)}, 'FULL_TIME_SALARIED', '2021-04-01', '₹45,000 - ₹85,000 / mo', ${escapeSql(city)});\n`);
    }

    // 14. Business Records (12%)
    if (i <= 1200 && age >= 25) {
      const bizId = `SIM-BIZ-${String(i).padStart(6, '0')}`;
      const gstNo = `${stateName.slice(0, 2).toUpperCase()}ABCDE${randInt(1000, 9999)}F1Z5`;
      writeStream.write(`INSERT INTO business_records (business_id, onegov_id, business_name, business_type, simulated_gst_number, registration_date, registered_address, turnover_range, gst_status) VALUES (${escapeSql(bizId)}, ${escapeSql(onegovId)}, ${escapeSql(`${lastName} Enterprises`)}, 'PROPRIETORSHIP', ${escapeSql(gstNo)}, '2019-03-12', ${escapeSql(`${city}, ${stateName}`)}, '₹50 Lakhs - ₹1.5 Cr', 'ACTIVE');\n`);
    }

    // 15. Welfare & Schemes (20%)
    if (i <= 2000) {
      const welId = `SIM-WEL-${String(i).padStart(6, '0')}`;
      const isSchol = (i === 1 || i === 2 || i === 13);
      writeStream.write(`INSERT INTO welfare_records (application_id, onegov_id, scheme_name, application_number, application_date, eligibility_status, application_status, benefit_type, department, approval_date) VALUES (${escapeSql(welId)}, ${escapeSql(onegovId)}, 'National Merit Scholarship 2025', ${escapeSql(`APP-SCH-2025-${i}`)}, '2025-01-10', ${escapeSql(isSchol ? 'ELIGIBLE' : 'INELIGIBLE')}, ${escapeSql(isSchol ? 'APPROVED' : 'REJECTED')}, 'Direct Benefit Transfer (DBT)', 'Education & Welfare', '2025-01-25');\n`);
    }

    // 16. Pension Records (10%)
    if (i <= 1000 && (age >= 60 || i === 14)) {
      const penId = `SIM-PEN-${String(i).padStart(6, '0')}`;
      writeStream.write(`INSERT INTO pension_records (pension_id, onegov_id, pension_reference, pension_type, eligibility_status, pension_status, contribution_years_range, registration_date) VALUES (${escapeSql(penId)}, ${escapeSql(onegovId)}, ${escapeSql(`PEN-REF-${i}`)}, 'SENIOR_CITIZEN_OLD_AGE', 'ELIGIBLE', 'ACTIVE', '25+ Years', '2020-08-15');\n`);
    }

    // 17. Utility Records (70%)
    if (i <= 7000) {
      const utilId = `SIM-UTIL-${String(i).padStart(6, '0')}`;
      writeStream.write(`INSERT INTO utility_records (utility_id, onegov_id, utility_type, provider, account_reference, address, connection_status, billing_status) VALUES (${escapeSql(utilId)}, ${escapeSql(onegovId)}, 'ELECTRICITY', ${escapeSql(`${city} Power Distribution Corp`)}, ${escapeSql(`CA-${randInt(100000, 999999)}`)}, ${escapeSql(`${city}, ${stateName}`)}, 'ACTIVE', 'CURRENT_NO_DUES');\n`);
    }

    // 18. Insurance Records (30%)
    if (i <= 3000) {
      const insId = `SIM-INS-${String(i).padStart(6, '0')}`;
      writeStream.write(`INSERT INTO insurance_records (policy_id, onegov_id, provider, policy_reference, policy_type, start_date, expiry_date, coverage_range, policy_status) VALUES (${escapeSql(insId)}, ${escapeSql(onegovId)}, 'Life Insurance Corporation (LIC)', ${escapeSql(`POL-LIC-${randInt(100000, 999999)}`)}, 'TERM_LIFE', '2020-01-01', '2040-01-01', '₹50,00,000', 'ACTIVE');\n`);
    }

    // 19. Court Records (10%)
    if (i <= 1000) {
      const courtId = `SIM-COURT-${String(i).padStart(6, '0')}`;
      writeStream.write(`INSERT INTO court_records (case_id, onegov_id, case_reference, court_name, case_category, citizen_role, filing_date, case_status, disposition_status) VALUES (${escapeSql(courtId)}, ${escapeSql(onegovId)}, ${escapeSql(`CC/${randInt(1000, 9999)}/2023`)}, ${escapeSql(`District Court, ${city}`)}, 'CIVIL_PROPERTY_DISPUTE', 'PETITIONER', '2023-05-14', 'DISPOSED', 'SETTLED_COMPROMISE');\n`);
    }

    if (i % 2000 === 0) {
      console.log(`Processed ${i} / ${totalCount} citizens...`);
    }
  }

  writeStream.write(`\nCOMMIT;\n`);
  writeStream.end();

  console.log(`\n✅ Generated complete synthetic database SQL dump: ${sqlFile}`);
}

generateDataset(10000).catch(console.error);
