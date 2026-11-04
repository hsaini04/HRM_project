// Fictional employees for the simulated Gurugram office. Names are invented, codes use the
// DEMO- prefix and every email uses the reserved example.com domain. No real personal data.
//
// profile: how the seed generates current proficiency against the role's required levels
//   strong     — mostly meets/exceeds requirements
//   steady     — some moderate gaps
//   developing — more frequent gaps (e.g. newer in role)
//   unassessed — no ratings yet (demonstrates the "assess a new employee" workflow)
//
// Headcount follows the CA-1 field-study estimate: 102 people (the figure CA-1 uses for its gap
// analysis), split across departments in the CA-1 workforce shares — see CA1_CONTEXT.workforceMix.

const coreTeam = [
  // Management & Functional Leadership
  { code: 'DEMO-1001', name: 'Meera Kapoor', title: 'Design & Applications Manager', joined: '2014-07-14', manager: 'DEMO-1024', profile: 'strong' },
  { code: 'DEMO-1002', name: 'Vikram Sethi', title: 'Regional Sales Manager', joined: '2015-03-02', manager: 'DEMO-1024', profile: 'strong' },
  { code: 'DEMO-1023', name: 'Deepak Menon', title: 'Service & Operations Manager', joined: '2016-09-19', manager: 'DEMO-1024', profile: 'strong' },

  // IT, HR, Finance & Administration
  { code: 'DEMO-1003', name: 'Ananya Rao', title: 'HR Business Partner', joined: '2018-01-08', manager: 'DEMO-1030', profile: 'strong' },
  { code: 'DEMO-1004', name: 'Rohan Mehta', title: 'IT Security Specialist', joined: '2019-06-17', manager: 'DEMO-1031', profile: 'steady' },
  { code: 'DEMO-1005', name: 'Kavya Iyer', title: 'Finance Executive', joined: '2021-02-01', manager: 'DEMO-1032', profile: 'steady' },
  { code: 'DEMO-1006', name: 'Sahil Bhatia', title: 'Office Administrator', joined: '2022-08-22', manager: 'DEMO-1032', profile: 'steady' },

  // Lighting Design, Applications & Engineering
  {
    code: 'DEMO-1007',
    name: 'Priya Nair',
    title: 'Lighting Design Specialist',
    joined: '2021-04-12',
    manager: 'DEMO-1001',
    profile: 'custom',
    // Hand-set ratings for the Employee demo persona (role requires: see jobRoles.js)
    levels: 'ps4 co3 ct3 qd4 tla3 lf4 lcs2 tools2 dwg4 est1 psc3 comm3 stk2 xfc3 tpm3 adapt4 own4',
  },
  { code: 'DEMO-1008', name: 'Arjun Malhotra', title: 'Lighting Design Specialist', joined: '2019-11-04', manager: 'DEMO-1001', profile: 'steady' },
  { code: 'DEMO-1009', name: 'Neha Gupta', title: 'Junior Lighting Designer', joined: '2024-07-01', manager: 'DEMO-1001', profile: 'developing' },
  { code: 'DEMO-1010', name: 'Karan Joshi', title: 'Senior Lighting Design Specialist', joined: '2016-05-23', manager: 'DEMO-1001', profile: 'strong' },
  { code: 'DEMO-1011', name: 'Ishita Verma', title: 'Applications Engineer', joined: '2020-10-05', manager: 'DEMO-1001', profile: 'steady' },
  { code: 'DEMO-1012', name: 'Aditya Kulkarni', title: 'Associate Applications Engineer', joined: '2024-01-15', manager: 'DEMO-1001', profile: 'developing' },
  { code: 'DEMO-1013', name: 'Tanvi Desai', title: 'Senior Applications Engineer', joined: '2017-08-28', manager: 'DEMO-1001', profile: 'strong' },

  // System Sales Engineering & Field Service
  { code: 'DEMO-1014', name: 'Rahul Chauhan', title: 'System Sales Engineer', joined: '2021-09-13', manager: 'DEMO-1002', profile: 'steady' },
  { code: 'DEMO-1015', name: 'Sneha Pillai', title: 'Senior System Sales Engineer', joined: '2017-02-20', manager: 'DEMO-1002', profile: 'strong' },
  { code: 'DEMO-1016', name: 'Manish Yadav', title: 'Field Service Engineer', joined: '2023-03-06', manager: 'DEMO-1002', profile: 'developing' },

  // Customer Service & Project Support
  { code: 'DEMO-1017', name: 'Pooja Saxena', title: 'Senior Support Specialist', joined: '2019-04-01', manager: 'DEMO-1023', profile: 'steady' },
  { code: 'DEMO-1018', name: 'Varun Khanna', title: 'Customer Support Associate', joined: '2024-02-12', manager: 'DEMO-1023', profile: 'developing' },
  { code: 'DEMO-1019', name: 'Ritu Agarwal', title: 'Project Coordinator', joined: '2022-06-06', manager: 'DEMO-1023', profile: 'steady' },

  // Sales & Business Development
  { code: 'DEMO-1020', name: 'Nikhil Arora', title: 'Key Account Manager', joined: '2018-10-15', manager: 'DEMO-1002', profile: 'steady' },
  { code: 'DEMO-1021', name: 'Simran Gill', title: 'Business Development Executive', joined: '2023-11-20', manager: 'DEMO-1002', profile: 'developing' },
  { code: 'DEMO-1022', name: 'Aman Thakur', title: 'Business Development Executive', joined: '2026-08-03', manager: 'DEMO-1002', profile: 'unassessed', status: 'Active' },
];

// The rest of the office, listed after the core team so the core team's generated ratings and
// enrolments stay the same. Columns: code, name, job title, joining date, manager code, profile.
const restOfOffice = [
  // Management & Functional Leadership (12 in total)
  ['DEMO-1024', 'Rajiv Bansal', 'Office Head – Gurugram', '2012-04-02', null, 'strong'],
  ['DEMO-1025', 'Sunita Reddy', 'Regional Sales Manager', '2015-08-17', 'DEMO-1024', 'strong'],
  ['DEMO-1026', 'Harish Venkatesh', 'Regional Sales Manager', '2017-01-09', 'DEMO-1024', 'steady'],
  ['DEMO-1027', 'Farah Qureshi', 'Design & Applications Manager', '2016-03-14', 'DEMO-1024', 'strong'],
  ['DEMO-1028', 'Gaurav Sinha', 'Service & Operations Manager', '2018-07-23', 'DEMO-1024', 'steady'],
  ['DEMO-1029', 'Lakshmi Narayan', 'System Sales Engineering Manager', '2016-11-07', 'DEMO-1002', 'strong'],
  ['DEMO-1030', 'Anjali Bhatt', 'HR & Talent Acquisition Manager', '2017-05-29', 'DEMO-1024', 'strong'],
  ['DEMO-1031', 'Siddharth Mathur', 'IT & Infrastructure Manager', '2016-02-15', 'DEMO-1024', 'strong'],
  ['DEMO-1032', 'Prakash Hegde', 'Finance & Administration Manager', '2015-10-05', 'DEMO-1024', 'strong'],

  // Sales & Business Development (21 in total)
  ['DEMO-1033', 'Abhishek Tiwari', 'Sales Manager – Lighting', '2017-06-12', 'DEMO-1025', 'strong'],
  ['DEMO-1034', 'Megha Choudhary', 'Sales Manager – Lighting', '2018-09-03', 'DEMO-1026', 'steady'],
  ['DEMO-1035', 'Rakesh Pandey', 'Key Account Manager', '2019-02-11', 'DEMO-1025', 'steady'],
  ['DEMO-1036', 'Divya Krishnan', 'Key Account Manager', '2020-08-24', 'DEMO-1033', 'steady'],
  ['DEMO-1037', 'Mohit Grover', 'Key Account Manager', '2018-04-16', 'DEMO-1026', 'strong'],
  ['DEMO-1038', 'Shreya Banerjee', 'Key Account Manager', '2021-01-18', 'DEMO-1034', 'steady'],
  ['DEMO-1039', 'Kunal Shah', 'Key Account Manager', '2019-11-25', 'DEMO-1002', 'steady'],
  ['DEMO-1040', 'Tanya Malik', 'Business Development Executive', '2023-05-08', 'DEMO-1033', 'developing'],
  ['DEMO-1041', 'Yash Jain', 'Business Development Executive', '2024-03-11', 'DEMO-1034', 'developing'],
  ['DEMO-1042', 'Bhavna Rawat', 'Business Development Executive', '2022-10-17', 'DEMO-1025', 'steady'],
  ['DEMO-1043', 'Imran Sheikh', 'Business Development Executive', '2023-08-21', 'DEMO-1026', 'developing'],
  ['DEMO-1044', 'Nidhi Sharma', 'Business Development Executive', '2024-09-02', 'DEMO-1033', 'developing'],
  ['DEMO-1045', 'Arvind Nambiar', 'Business Development Executive', '2022-02-07', 'DEMO-1034', 'steady'],
  ['DEMO-1046', 'Ruchi Goel', 'Business Development Executive', '2026-06-15', 'DEMO-1002', 'unassessed'],
  ['DEMO-1047', 'Pallavi Dutta', 'Sales Coordinator', '2021-07-05', 'DEMO-1025', 'steady'],
  ['DEMO-1048', 'Sanjay Negi', 'Sales Coordinator', '2022-12-12', 'DEMO-1026', 'steady'],
  ['DEMO-1049', 'Komal Ahuja', 'Sales Coordinator', '2024-06-10', 'DEMO-1002', 'developing'],
  ['DEMO-1050', 'Vivek Bhardwaj', 'Sales Coordinator', '2023-02-27', 'DEMO-1033', 'steady'],

  // Lighting Design, Applications & Engineering (31 in total)
  ['DEMO-1051', 'Ramesh Krishnamurthy', 'Design Lead', '2013-09-16', 'DEMO-1001', 'strong'],
  ['DEMO-1052', 'Swati Deshpande', 'Technical Lead – Applications', '2015-12-07', 'DEMO-1027', 'strong'],
  ['DEMO-1053', 'Akash Mittal', 'Senior Lighting Design Specialist', '2017-10-09', 'DEMO-1051', 'strong'],
  ['DEMO-1054', 'Nandini Shetty', 'Senior Lighting Design Specialist', '2018-03-19', 'DEMO-1051', 'strong'],
  ['DEMO-1055', 'Rohit Bhalla', 'Lighting Design Specialist', '2020-06-22', 'DEMO-1051', 'steady'],
  ['DEMO-1056', 'Aisha Khan', 'Lighting Design Specialist', '2021-11-08', 'DEMO-1051', 'steady'],
  ['DEMO-1057', 'Varsha Patil', 'Lighting Design Specialist', '2019-08-05', 'DEMO-1053', 'steady'],
  ['DEMO-1058', 'Devansh Oberoi', 'Lighting Design Specialist', '2022-04-18', 'DEMO-1053', 'developing'],
  ['DEMO-1059', 'Kritika Sood', 'Lighting Design Specialist', '2020-01-27', 'DEMO-1054', 'steady'],
  ['DEMO-1060', 'Mayank Rastogi', 'Lighting Design Specialist', '2022-09-12', 'DEMO-1054', 'developing'],
  ['DEMO-1061', 'Riya Mukherjee', 'Junior Lighting Designer', '2025-01-13', 'DEMO-1051', 'developing'],
  ['DEMO-1062', 'Harshit Chawla', 'Junior Lighting Designer', '2025-07-07', 'DEMO-1053', 'developing'],
  ['DEMO-1063', 'Ira Bose', 'Junior Lighting Designer', '2026-07-20', 'DEMO-1054', 'unassessed'],
  ['DEMO-1064', 'Sameer Naik', 'Senior Applications Engineer', '2016-08-01', 'DEMO-1052', 'strong'],
  ['DEMO-1065', 'Preeti Bajaj', 'Senior Applications Engineer', '2018-05-14', 'DEMO-1052', 'strong'],
  ['DEMO-1066', 'Gautam Raman', 'Applications Engineer', '2020-09-21', 'DEMO-1052', 'steady'],
  ['DEMO-1067', 'Sakshi Dhawan', 'Applications Engineer', '2021-03-15', 'DEMO-1064', 'steady'],
  ['DEMO-1068', 'Naveen Prasad', 'Applications Engineer', '2019-12-02', 'DEMO-1064', 'steady'],
  ['DEMO-1069', 'Anushka Rana', 'Applications Engineer', '2022-06-27', 'DEMO-1065', 'developing'],
  ['DEMO-1070', 'Tarun Bedi', 'Applications Engineer', '2021-10-11', 'DEMO-1065', 'steady'],
  ['DEMO-1071', 'Jyoti Kaul', 'Applications Engineer', '2023-01-09', 'DEMO-1052', 'developing'],
  ['DEMO-1072', 'Parth Vyas', 'Associate Applications Engineer', '2025-02-03', 'DEMO-1052', 'developing'],
  ['DEMO-1073', 'Shalini Murthy', 'Associate Applications Engineer', '2024-11-18', 'DEMO-1064', 'developing'],
  ['DEMO-1074', 'Kabir Ahluwalia', 'Associate Applications Engineer', '2026-08-17', 'DEMO-1065', 'unassessed'],

  // System Sales Engineering & Field Service (8 in total)
  ['DEMO-1075', 'Ashok Ramachandran', 'Senior System Sales Engineer', '2016-06-06', 'DEMO-1029', 'strong'],
  ['DEMO-1076', 'Neeraj Kumar', 'System Sales Engineer', '2020-04-13', 'DEMO-1029', 'steady'],
  ['DEMO-1077', 'Monika Tandon', 'System Sales Engineer', '2022-08-08', 'DEMO-1075', 'developing'],
  ['DEMO-1078', 'Rajat Bisht', 'Field Service Engineer', '2021-05-24', 'DEMO-1029', 'steady'],
  ['DEMO-1079', 'Suresh Babu', 'Field Service Engineer', '2023-10-30', 'DEMO-1075', 'developing'],

  // Customer Service & Project Support (9 in total)
  ['DEMO-1080', 'Geeta Pandit', 'Service & Support Lead', '2015-09-28', 'DEMO-1023', 'strong'],
  ['DEMO-1081', 'Rajesh Kamath', 'Senior Support Specialist', '2018-12-10', 'DEMO-1080', 'steady'],
  ['DEMO-1082', 'Ayesha Siddiqui', 'Customer Support Associate', '2024-04-22', 'DEMO-1080', 'developing'],
  ['DEMO-1083', 'Pranav Hooda', 'Customer Support Associate', '2025-03-17', 'DEMO-1081', 'developing'],
  ['DEMO-1084', 'Nisha Verghese', 'Project Coordinator', '2021-08-16', 'DEMO-1028', 'steady'],
  ['DEMO-1085', 'Amit Rathore', 'Project Coordinator', '2022-11-21', 'DEMO-1028', 'steady'],

  // IT, HR, Finance & Administration (21 in total)
  ['DEMO-1086', 'Mehak Sabharwal', 'HR Business Partner', '2020-02-10', 'DEMO-1030', 'steady'],
  ['DEMO-1087', 'Rohini Das', 'Talent Acquisition Specialist', '2021-06-14', 'DEMO-1030', 'steady'],
  ['DEMO-1088', 'Kartik Bhasin', 'Talent Acquisition Specialist', '2023-09-04', 'DEMO-1030', 'developing'],
  ['DEMO-1089', 'Vishal Rajput', 'IT Security Specialist', '2020-07-20', 'DEMO-1031', 'steady'],
  ['DEMO-1090', 'Ankit Dubey', 'IT Support Engineer', '2021-12-06', 'DEMO-1031', 'steady'],
  ['DEMO-1091', 'Sonal Mehra', 'IT Support Engineer', '2022-05-16', 'DEMO-1031', 'steady'],
  ['DEMO-1092', 'Faisal Ansari', 'IT Support Engineer', '2024-01-29', 'DEMO-1089', 'developing'],
  ['DEMO-1093', 'Deepika Lal', 'IT Support Engineer', '2025-05-12', 'DEMO-1089', 'developing'],
  ['DEMO-1094', 'Manoj Agrawal', 'Finance Executive', '2017-11-13', 'DEMO-1032', 'strong'],
  ['DEMO-1095', 'Shweta Kohli', 'Finance Executive', '2019-03-25', 'DEMO-1032', 'steady'],
  ['DEMO-1096', 'Pankaj Mishra', 'Finance Executive', '2020-10-19', 'DEMO-1032', 'steady'],
  ['DEMO-1097', 'Aarti Chopra', 'Finance Executive', '2022-07-11', 'DEMO-1094', 'steady'],
  ['DEMO-1098', 'Nitin Garg', 'Finance Executive', '2024-08-05', 'DEMO-1094', 'developing'],
  ['DEMO-1099', 'Usha Bhandari', 'Office Administrator', '2016-01-18', 'DEMO-1032', 'steady'],
  ['DEMO-1100', 'Ravi Tomar', 'Office Administrator', '2021-04-05', 'DEMO-1099', 'steady'],
  ['DEMO-1101', 'Seema Dhillon', 'Office Administrator', '2023-06-19', 'DEMO-1099', 'developing'],
  ['DEMO-1102', 'Hemant Kalra', 'Office Administrator', '2025-09-01', 'DEMO-1099', 'developing'],
];

export const employees = [
  ...coreTeam,
  ...restOfOffice.map(([code, name, title, joined, manager, profile]) => ({
    code,
    name,
    title,
    joined,
    ...(manager && { manager }),
    profile,
  })),
];

export const emailFor = (name) => `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`;
