// Fictional employees for the simulated Gurugram office. Names are invented, codes use the
// DEMO- prefix and every email uses the reserved example.com domain. No real personal data.
//
// profile: how the seed generates current proficiency against the role's required levels
//   strong     — mostly meets/exceeds requirements
//   steady     — some moderate gaps
//   developing — more frequent gaps (e.g. newer in role)
//   unassessed — no ratings yet (demonstrates the "assess a new employee" workflow)

export const employees = [
  // Management & Functional Leadership
  { code: 'DEMO-1001', name: 'Meera Kapoor', title: 'Design & Applications Manager', joined: '2014-07-14', profile: 'strong' },
  { code: 'DEMO-1002', name: 'Vikram Sethi', title: 'Regional Sales Manager', joined: '2015-03-02', profile: 'strong' },
  { code: 'DEMO-1023', name: 'Deepak Menon', title: 'Service & Operations Manager', joined: '2016-09-19', profile: 'strong' },

  // IT, HR, Finance & Administration
  { code: 'DEMO-1003', name: 'Ananya Rao', title: 'HR Business Partner', joined: '2018-01-08', manager: 'DEMO-1023', profile: 'strong' },
  { code: 'DEMO-1004', name: 'Rohan Mehta', title: 'IT Security Specialist', joined: '2019-06-17', manager: 'DEMO-1023', profile: 'steady' },
  { code: 'DEMO-1005', name: 'Kavya Iyer', title: 'Finance Executive', joined: '2021-02-01', manager: 'DEMO-1023', profile: 'steady' },
  { code: 'DEMO-1006', name: 'Sahil Bhatia', title: 'Office Administrator', joined: '2022-08-22', manager: 'DEMO-1023', profile: 'steady' },

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

export const emailFor = (name) => `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`;
