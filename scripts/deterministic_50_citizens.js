// Deterministic dataset of 50 Citizens across 8 Government Department Silos
// Adheres strictly to the OneGov Universal Citizen ID specification (OG-2026-00000001 to OG-2026-00000050)

const STATES_LIST = [
  { state: 'Maharashtra', district: 'Pune', city: 'Pune', pincode: '411001' },
  { state: 'Delhi', district: 'New Delhi', city: 'New Delhi', pincode: '110001' },
  { state: 'Gujarat', district: 'Ahmedabad', city: 'Ahmedabad', pincode: '380001' },
  { state: 'West Bengal', district: 'Kolkata', city: 'Kolkata', pincode: '700001' },
  { state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', pincode: '500001' },
  { state: 'Tamil Nadu', district: 'Chennai', city: 'Chennai', pincode: '600001' },
  { state: 'Karnataka', district: 'Bengaluru Urban', city: 'Bengaluru', pincode: '560001' },
  { state: 'Uttar Pradesh', district: 'Lucknow', city: 'Lucknow', pincode: '226001' },
  { state: 'Bihar', district: 'Patna', city: 'Patna', pincode: '800001' },
  { state: 'Rajasthan', district: 'Jaipur', city: 'Jaipur', pincode: '302001' },
];

const UNIVERSITIES_LIST = [
  { name: 'National Institute of Technology, Trichy', program: 'B.Tech Computer Science & Engg', academicYear: '2024-25 (Year 3)' },
  { name: 'Indian Institute of Technology Delhi', program: 'M.Tech Mechanical Systems', academicYear: '2024-25 (Year 1)' },
  { name: 'University of Delhi', program: 'M.Sc Applied Mathematics', academicYear: '2024-25 (Year 2)' },
  { name: 'Jadavpur University, Kolkata', program: 'B.A. (Hons) Economics & Policy', academicYear: '2024-25 (Year 2)' },
  { name: 'Indian Institute of Science, Bengaluru', program: 'M.S. Computational Data Science', academicYear: '2024-25 (Year 2)' },
  { name: 'Anna University, Chennai', program: 'B.Tech Information Technology', academicYear: '2024-25 (Year 4)' },
  { name: 'University of Mumbai', program: 'B.Com Financial Accounting & Audit', academicYear: '2024-25 (Year 3)' },
  { name: 'Banaras Hindu University, Varanasi', program: 'M.Sc Physics & Electronics', academicYear: '2024-25 (Year 1)' },
];

const RAW_NAMES = [
  { first: 'Rahul', middle: 'Kumar', last: 'Singh', gender: 'Male', dob: '2002-05-14' },
  { first: 'Priya', middle: '', last: 'Sharma', gender: 'Female', dob: '2002-04-15' },
  { first: 'Amitabh', middle: 'Ramesh', last: 'Patel', gender: 'Male', dob: '1998-11-20' },
  { first: 'Sneha', middle: 'Kumari', last: 'Gupta', gender: 'Female', dob: '2003-01-30' },
  { first: 'Mohammed', middle: 'Tariq', last: 'Khan', gender: 'Male', dob: '2001-07-19' },
  { first: 'Ananya', middle: 'Sundaram', last: 'Iyer', gender: 'Female', dob: '2002-09-08' },
  { first: 'Vikramaditya', middle: '', last: 'Roy', gender: 'Male', dob: '1995-12-03' },
  { first: 'Deepak', middle: 'Prasad', last: 'Verma', gender: 'Male', dob: '2001-03-22' },
  { first: 'Kavita', middle: 'Devi', last: 'Yadav', gender: 'Female', dob: '2002-06-11' },
  { first: 'Arjun', middle: 'Nath', last: 'Reddy', gender: 'Male', dob: '2000-10-25' },
  { first: 'Pooja', middle: 'Lata', last: 'Mishra', gender: 'Female', dob: '2003-08-14' },
  { first: 'Suresh', middle: 'Kumar', last: 'Joshi', gender: 'Male', dob: '1999-04-02' },
  { first: 'Meenakshi', middle: 'Shree', last: 'Nair', gender: 'Female', dob: '2002-12-19' },
  { first: 'Gaurav', middle: 'Lal', last: 'Choudhary', gender: 'Male', dob: '2001-01-17' },
  { first: 'Ritu', middle: 'Rani', last: 'Pandey', gender: 'Female', dob: '2003-05-29' },
  { first: 'Nitin', middle: 'Dev', last: 'Deshmukh', gender: 'Male', dob: '1997-09-05' },
  { first: 'Sunita', middle: 'Ben', last: 'Shah', gender: 'Female', dob: '2002-02-18' },
  { first: 'Prateek', middle: 'Raj', last: 'Bhattacharya', gender: 'Male', dob: '2000-07-07' },
  { first: 'Aarti', middle: 'Priya', last: 'Saxena', gender: 'Female', dob: '2003-11-23' },
  { first: 'Kunal', middle: 'Kant', last: 'Bose', gender: 'Male', dob: '1999-08-30' },
  { first: 'Swati', middle: 'Kumari', last: 'Chatterjee', gender: 'Female', dob: '2002-10-12' },
  { first: 'Ashok', middle: 'Kumar', last: 'Rao', gender: 'Male', dob: '1996-03-15' },
  { first: 'Preeti', middle: 'Lata', last: 'Kulkarni', gender: 'Female', dob: '2001-09-27' },
  { first: 'Vijay', middle: 'Prasad', last: 'Hegde', gender: 'Male', dob: '2000-02-14' },
  { first: 'Rashmi', middle: 'Devi', last: 'Dubey', gender: 'Female', dob: '2003-04-06' },
  { first: 'Prakash', middle: 'Nath', last: 'Tiwari', gender: 'Male', dob: '1998-06-21' },
  { first: 'Geeta', middle: 'Rani', last: 'Chauhan', gender: 'Female', dob: '2002-07-16' },
  { first: 'Rajesh', middle: 'Singh', last: 'Thakur', gender: 'Male', dob: '2001-11-09' },
  { first: 'Suman', middle: 'Shree', last: 'Mukherjee', gender: 'Female', dob: '2000-05-04' },
  { first: 'Sanjay', middle: 'Lal', last: 'Dutta', gender: 'Male', dob: '1997-12-28' },
  { first: 'Jyoti', middle: 'Kumari', last: 'Das', gender: 'Female', dob: '2003-03-19' },
  { first: 'Alok', middle: 'Dev', last: 'Sen', gender: 'Male', dob: '2001-08-11' },
  { first: 'Shweta', middle: 'Priya', last: 'Bhat', gender: 'Female', dob: '2002-01-24' },
  { first: 'Harish', middle: 'Raj', last: 'Menon', gender: 'Male', dob: '1999-10-17' },
  { first: 'Archana', middle: 'Lata', last: 'Pillai', gender: 'Female', dob: '2000-04-13' },
  { first: 'Tarun', middle: 'Kant', last: 'Gowda', gender: 'Male', dob: '2002-09-30' },
  { first: 'Monika', middle: 'Devi', last: 'Shetty', gender: 'Female', dob: '2003-06-08' },
  { first: 'Anand', middle: 'Kumar', last: 'Agarwal', gender: 'Male', dob: '1996-01-22' },
  { first: 'Kiran', middle: 'Rani', last: 'Banerjee', gender: 'Female', dob: '2001-12-05' },
  { first: 'Naveen', middle: 'Prasad', last: 'Mehta', gender: 'Male', dob: '2000-08-15' },
  { first: 'Anita', middle: 'Ben', last: 'Joshi', gender: 'Female', dob: '2002-03-02' },
  { first: 'Vishal', middle: 'Nath', last: 'Gupta', gender: 'Male', dob: '1998-05-19' },
  { first: 'Shruti', middle: 'Kumari', last: 'Verma', gender: 'Female', dob: '2003-10-01' },
  { first: 'Manoj', middle: 'Lal', last: 'Singh', gender: 'Male', dob: '2001-04-26' },
  { first: 'Nandini', middle: 'Shree', last: 'Sharma', gender: 'Female', dob: '2002-11-14' },
  { first: 'Karan', middle: 'Dev', last: 'Patel', gender: 'Male', dob: '1999-07-21' },
  { first: 'Meera', middle: 'Priya', last: 'Yadav', gender: 'Female', dob: '2000-09-10' },
  { first: 'Sunil', middle: 'Raj', last: 'Reddy', gender: 'Male', dob: '1997-02-04' },
  { first: 'Rupal', middle: 'Lata', last: 'Mishra', gender: 'Female', dob: '2003-12-18' },
  { first: 'Ajay', middle: 'Kumar', last: 'Choudhary', gender: 'Male', dob: '2002-08-07' },
];

function generate50Citizens() {
  return RAW_NAMES.map((person, idx) => {
    const num = idx + 1;
    const numStr = String(num).padStart(6, '0');
    const onegovId = `OG-2026-${String(num).padStart(8, '0')}`;
    const id = `citizen-${numStr}`;
    const fullName = person.middle ? `${person.first} ${person.middle} ${person.last}` : `${person.first} ${person.last}`;
    const email = `${person.first.toLowerCase()}${num <= 7 ? '' : num}@govlink.demo`;

    const loc = STATES_LIST[(num - 1) % STATES_LIST.length];
    const uni = UNIVERSITIES_LIST[(num - 1) % UNIVERSITIES_LIST.length];

    // Department Identifiers
    const identityDeptId = `SIM-AADHAAR-${numStr}`;
    const revenueDeptId = `SIM-PAN-${numStr}`;
    const educationDeptId = `SIM-EDU-${numStr}`;
    const transportDeptId = `SIM-DL-${numStr}`;
    const policeDeptId = `SIM-POL-${numStr}`;
    const bankingDeptId = `SIM-BANK-${numStr}`;
    const welfareDeptId = `SIM-WEL-${numStr}`;
    const municipalDeptId = `SIM-PROP-${numStr}`;

    // Specific Archetype Rules for Key Demo Personas
    let incomeBand = 'LOW';
    let rawIncome = '₹2,40,000 (0-3LPA Band)';
    let cgpa = '8.75 / 10.0';
    let enrollmentStatus = 'ACTIVE';
    let dlStatus = 'VALID';
    let unpaidChallans = 0;
    let policeStatus = 'CLEARED';
    let bankKycStatus = 'VERIFIED';
    let dbtEnabled = true;
    let bplStatus = true;
    let personaTag = 'Standard Eligible Applicant';

    if (num === 1) { // Rahul Kumar Singh - Golden standard
      personaTag = 'Golden Standard · All Clean & Eligible';
      incomeBand = 'LOW';
      rawIncome = '₹2,10,000 (0-3LPA Band)';
      cgpa = '8.92 / 10.0';
    } else if (num === 2) { // Priya Sharma - Flagship Scholarship
      personaTag = 'Flagship Merit · ₹75k Award Winner';
      incomeBand = 'LOW';
      rawIncome = '₹2,40,000 (0-3LPA Band)';
      cgpa = '9.10 / 10.0';
    } else if (num === 3) { // Amitabh Ramesh Patel - Expired DL
      personaTag = 'Transport Edge Case · Expired DL';
      incomeBand = 'MEDIUM';
      rawIncome = '₹6,50,000 (5-8LPA Band)';
      dlStatus = 'EXPIRED';
      enrollmentStatus = 'INACTIVE';
      bplStatus = false;
    } else if (num === 4) { // Sneha Kumari Gupta - Challan Defaulter / 503 Resilient
      personaTag = 'Fault Injection & Challan Defaulter';
      incomeBand = 'LOW';
      rawIncome = '₹1,90,000 (0-3LPA Band)';
      unpaidChallans = 3;
      cgpa = '8.40 / 10.0';
    } else if (num === 5) { // Mohammed Tariq Khan - Identity Mismatch
      personaTag = 'Identity Mismatch · PAN Mismatch';
      incomeBand = 'MEDIUM';
      rawIncome = '₹5,20,000 (5-8LPA Band)';
      bplStatus = false;
    } else if (num === 6) { // Ananya Sundaram Iyer - Police Pending
      personaTag = 'Security Review · Police Clearance Pending';
      incomeBand = 'LOW';
      rawIncome = '₹2,60,000 (0-3LPA Band)';
      policeStatus = 'PENDING';
      cgpa = '8.80 / 10.0';
    } else if (num === 7) { // Vikramaditya Roy - High Income & Bank KYC Overdue
      personaTag = 'Policy Ineligible · High Income Band';
      incomeBand = 'HIGH';
      rawIncome = '₹14,50,000 (12LPA+ Band)';
      bankKycStatus = 'OVERDUE';
      dbtEnabled = false;
      bplStatus = false;
    } else {
      // Deterministic variations for citizens 8 to 50
      if (num % 3 === 0) {
        incomeBand = 'MEDIUM';
        rawIncome = `₹${500000 + (num * 10000)} (5-8LPA Band)`;
        bplStatus = false;
      } else if (num % 7 === 0) {
        incomeBand = 'HIGH';
        rawIncome = `₹${1200000 + (num * 15000)} (12LPA+ Band)`;
        bplStatus = false;
        dbtEnabled = false;
      }

      if (num % 8 === 0) dlStatus = 'EXPIRED';
      if (num % 9 === 0) unpaidChallans = 2;
      if (num % 11 === 0) policeStatus = 'PENDING';
      if (num % 13 === 0) bankKycStatus = 'OVERDUE';
      if (num % 5 === 0) enrollmentStatus = 'GRADUATED';
    }

    const panPrefix = 'ABCDE'[num % 5] + 'FGHIJ'[num % 5] + 'KLMNO'[num % 5] + 'P' + person.first[0];
    const panMasked = `${panPrefix}****${num % 10}${String.fromCharCode(65 + (num % 26))}`;

    return {
      num,
      onegovId,
      id,
      name: fullName,
      email,
      password: 'demo123',
      dateOfBirth: person.dob,
      gender: person.gender,
      phone: `+91 98${String(70000000 + num * 12345).slice(0, 8)}`,
      state: loc.state,
      district: loc.district,
      city: loc.city,
      pincode: loc.pincode,
      primaryAddress: `#${num * 12}, 4th Cross, Civil Lines, ${loc.city}, ${loc.state} - ${loc.pincode}`,
      personaTag,

      // Department Map Keys
      departmentMap: {
        identityDeptId,
        revenueDeptId,
        educationDeptId,
        transportDeptId,
        policeDeptId,
        bankingDeptId,
        welfareDeptId,
        municipalDeptId,
      },

      // 1. Identity / UIDAI Silo Record
      identityRecord: {
        externalId: identityDeptId,
        fullName: num === 5 ? `${person.first} T. ${person.last}` : fullName,
        dateOfBirth: person.dob,
        gender: person.gender,
        maskedId: `IND-XXXX-${String(1000 + num * 37).slice(-4)}`,
        docType: 'National UID (Aadhaar)',
        phoneLinked: true,
        biometricVerified: true,
        verified: true,
        verifiedAt: '2024-01-10T00:00:00Z',
        source: 'IDENTITY_DEPARTMENT_V2',
      },

      // 2. Revenue / Income Tax Silo Record
      revenueRecord: {
        externalId: revenueDeptId,
        panMasked,
        incomeRange: rawIncome, // ⛔ NEVER exported to CDM
        incomeBand, // 'LOW' | 'MEDIUM' | 'HIGH'
        taxYear: 'AY 2024-25',
        filingStatus: 'VERIFIED_ITR_FILED',
        source: 'REVENUE_DEPARTMENT_V3',
      },

      // 3. Higher Education / NAD Silo Record
      educationRecord: {
        studentId: educationDeptId,
        institutionName: uni.name,
        enrollmentStatus,
        courseLevel: uni.program.startsWith('M.') ? 'POSTGRADUATE' : 'UNDERGRADUATE',
        program: uni.program,
        academicYear: uni.academicYear,
        cgpa,
        source: 'EDUCATION_DEPARTMENT_V1',
      },

      // 4. Transport / RTO Parivahan Record
      transportRecord: {
        externalId: transportDeptId,
        dlNumber: `DL-${loc.state.slice(0, 2).toUpperCase()}-2020-${numStr}`,
        dlStatus, // 'VALID' | 'EXPIRED'
        vehicleRegistration: `${loc.state.slice(0, 2).toUpperCase()}-01-AB-${String(1000 + num).slice(-4)}`,
        vehicleType: 'FOUR_WHEELER_NON_TRANSPORT',
        unpaidChallansCount: unpaidChallans,
        cleanDrivingRecord: dlStatus === 'VALID' && unpaidChallans === 0,
        source: 'PARIVAHAN_RTO_V2',
      },

      // 5. Police / CCTNS Verification Record
      policeRecord: {
        externalId: policeDeptId,
        clearanceStatus: policeStatus, // 'CLEARED' | 'PENDING' | 'ADVERSE'
        incidentCount: policeStatus === 'CLEARED' ? 0 : 1,
        jurisdictionStation: `${loc.city} Central Police Station`,
        verificationDate: '2024-02-15T00:00:00Z',
        source: 'POLICE_CCTNS_NATIONAL_V1',
      },

      // 6. Core Banking & DBT Record
      bankingRecord: {
        externalId: bankingDeptId,
        bankName: 'State Bank of India',
        maskedAccount: `SBIN-XXXX-${String(2000 + num * 43).slice(-4)}`,
        ifscCode: `SBIN000${loc.pincode.slice(0, 3)}`,
        kycStatus: bankKycStatus, // 'VERIFIED' | 'OVERDUE'
        dbtActive: dbtEnabled,
        source: 'NPCI_DBT_CORE_BANKING_V2',
      },

      // 7. Public Welfare & PDS Record
      welfareRecord: {
        externalId: welfareDeptId,
        rationCardNumber: `RC-${loc.state.slice(0, 2).toUpperCase()}-${String(500000 + num * 99)}`,
        bplCardHolder: bplStatus,
        activeSubsidies: bplStatus ? ['FOOD_GRAINS_PDS', 'LPG_PRADHAN_MANTRI_UJJWALA'] : [],
        source: 'NATIONAL_FOOD_SECURITY_PDS_V1',
      },

      // 8. Municipal / Property Record
      municipalRecord: {
        externalId: municipalDeptId,
        propertyId: `PROP-${loc.city.slice(0, 3).toUpperCase()}-${numStr}`,
        zone: `${loc.city} Municipal Zone ${((num - 1) % 5) + 1}`,
        propertyTaxClearance: true,
        source: 'MUNICIPAL_PROPERTY_RECORDS_V1',
      },
    };
  });
}

const DETERMINISTIC_50_CITIZENS = generate50Citizens();

module.exports = {
  DETERMINISTIC_50_CITIZENS,
  generate50Citizens,
};
