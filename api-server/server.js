const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const redis = require('redis');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger-config');
// Optional dependencies - wrap in try-catch
let Minio, multer, uuidv4;
try {
  Minio = require('minio');
  multer = require('multer');
  uuidv4 = require('uuid').v4;
} catch (error) {
  console.log('Optional dependencies not available:', error.message);
  // Provide fallback functions
  uuidv4 = () => 'fallback-uuid-' + Math.random().toString(36).substr(2, 9);
}

const app = express();
const PORT = process.env.PORT || 4010;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Configure EJS templating
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Origin', 'Content-Type', 'Accept', 'Authorization', 'X-User-Email', 'X-Public-Browse', 'X-User-Id', 'X-Requested-With']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'WebAImpetus API Documentation'
}));

// Redis client (optional, for session management)
let redisClient;
try {
  redisClient = redis.createClient({
    url: 'redis://redis:6379'
  });
  
  redisClient.on('error', (err) => {
    console.log('Redis Client Error:', err);
  });
  
  redisClient.on('connect', () => {
    console.log('Redis client connected');
  });
  
  // Connect to Redis
  redisClient.connect().catch(err => {
    console.log('Redis connection failed:', err);
  });
} catch (error) {
  console.log('Redis not available, using in-memory storage');
}

// MinIO client for S3-compatible storage
let minioClient;
try {
  minioClient = new Minio.Client({
    endPoint: 'minio',
    port: 9000,
    useSSL: false,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin123'
  });
  console.log('MinIO client initialized');
} catch (error) {
  console.log('MinIO not available:', error);
}

// Multer configuration for file uploads (if available)
let upload;
if (multer) {
  upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB limit
    }
  });
}

// Sample data database (in production, use a real database)

// Helper function to generate random data
const generateRandomData = () => {
  const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Chris', 'Amy', 'Tom', 'Emma', 'Alex', 'Maria', 'James', 'Anna', 'Robert', 'Julia', 'William', 'Sophie', 'Daniel', 'Olivia'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
  const companies = ['TechCorp', 'InnovateInc', 'DataFlow', 'CloudSync', 'NextGen', 'FutureSoft', 'DigitalEdge', 'SmartSys', 'ProTech', 'CyberCore', 'MegaCorp', 'AlphaBeta', 'GammaDelta', 'EpsilonZeta', 'ThetaLambda'];
  const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail', 'Real Estate', 'Consulting', 'Media', 'Transportation', 'Energy', 'Government', 'Non-profit', 'Agriculture', 'Construction'];
  const statuses = ['active', 'inactive', 'pending', 'suspended'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const roles = ['user', 'manager', 'admin', 'editor'];
  const sources = ['website', 'email', 'phone', 'referral', 'social_media', 'advertisement', 'trade_show', 'cold_call'];
  
  return {
    firstNames,
    lastNames,
    companies,
    industries,
    statuses,
    priorities,
    roles,
    sources
  };
};

const randomData = generateRandomData();

// Generate large datasets
const generateWorkspaces = () => {
  const workspaces = [];
  const workspaceNames = ['Default Workspace', 'Client A Workspace', 'Client B Workspace', 'Enterprise Workspace', 'SMB Workspace', 'Startup Workspace', 'Enterprise Solutions', 'Global Operations', 'Regional Office', 'Development Hub'];
  
  for (let i = 1; i <= 10; i++) {
    workspaces.push({
      id: i,
      uuid: `550e8400-e29b-41d4-a716-44665544000${i-1}`,
      name: workspaceNames[i-1] || `Workspace ${i}`,
      description: `Workspace ${i} for testing purposes`,
      status: randomData.statuses[Math.floor(Math.random() * randomData.statuses.length)],
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  return workspaces;
};

const generateUsers = () => {
  const users = [];
  for (let i = 1; i <= 2000; i++) {
    const firstName = randomData.firstNames[Math.floor(Math.random() * randomData.firstNames.length)];
    const lastName = randomData.lastNames[Math.floor(Math.random() * randomData.lastNames.length)];
    const workspaceId = Math.floor(Math.random() * 10) + 1;
    
    users.push({
      id: i,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
      username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${i}`,
      first_name: firstName,
      last_name: lastName,
      name: `${firstName} ${lastName}`,
      role: randomData.roles[Math.floor(Math.random() * randomData.roles.length)],
      status: randomData.statuses[Math.floor(Math.random() * randomData.statuses.length)],
      active: Math.random() > 0.1,
      phone_no: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      address: `${Math.floor(Math.random() * 9999) + 1} ${randomData.lastNames[Math.floor(Math.random() * randomData.lastNames.length)]} Street, City ${i}, ST ${String(Math.floor(Math.random() * 99999) + 10000).padStart(5, '0')}`,
      workspace_id: workspaceId,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  return users;
};

const generateGroups = () => {
  const groups = [];
  const groupNames = ['Administrators', 'Developers', 'Managers', 'Sales Team', 'Support Team', 'Marketing Team', 'QA Team', 'DevOps Team', 'Design Team', 'Analysts', 'Consultants', 'Executives', 'Interns', 'Contractors', 'Partners'];
  
  for (let i = 1; i <= 1000; i++) {
    const groupName = groupNames[Math.floor(Math.random() * groupNames.length)] + ` ${i}`;
    const workspaceId = Math.floor(Math.random() * 10) + 1;
    
    groups.push({
      id: i,
      name: groupName,
      machine_name: groupName.toLowerCase().replace(/\s+/g, '_'),
      description: `Group ${i} for ${groupName}`,
      workspace_id: workspaceId,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  return groups;
};

const generateRoles = () => {
  const roles = [];
  const roleNames = ['admin', 'manager', 'user', 'editor', 'viewer', 'contributor', 'moderator', 'supervisor', 'coordinator', 'specialist', 'analyst', 'consultant', 'developer', 'designer', 'tester'];
  
  for (let i = 1; i <= 1000; i++) {
    const roleName = roleNames[Math.floor(Math.random() * roleNames.length)];
    const workspaceId = Math.floor(Math.random() * 10) + 1;
    
    roles.push({
      id: i,
      role_name: roleName,
      name: roleName.charAt(0).toUpperCase() + roleName.slice(1),
      description: `${roleName} role for workspace ${workspaceId}`,
      permissions: ['read', 'write', 'delete'].slice(0, Math.floor(Math.random() * 3) + 1),
      workspace_id: workspaceId,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  return roles;
};

const generateDepartments = () => {
  const departments = [];
  const deptNames = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Customer Support', 'Product Management', 'Quality Assurance', 'DevOps', 'Design', 'Research', 'Legal', 'Administration', 'Security'];
  const codes = ['ENG', 'MKT', 'SAL', 'HR', 'FIN', 'OPS', 'CS', 'PM', 'QA', 'DEV', 'DSN', 'RSR', 'LEG', 'ADM', 'SEC'];
  
  for (let i = 1; i <= 1000; i++) {
    const deptIndex = Math.floor(Math.random() * deptNames.length);
    const workspaceId = Math.floor(Math.random() * 10) + 1;
    
    departments.push({
      id: i,
      name: deptNames[deptIndex] + ` ${i}`,
      code: codes[deptIndex] + String(i).padStart(3, '0'),
      description: `${deptNames[deptIndex]} department ${i}`,
      status: randomData.statuses[Math.floor(Math.random() * randomData.statuses.length)],
      workspace_id: workspaceId,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  return departments;
};

const generatePermissions = () => {
  const permissions = [];
  const permNames = ['read', 'write', 'delete', 'admin', 'create', 'update', 'view', 'edit', 'manage', 'approve', 'reject', 'publish', 'archive', 'restore', 'export'];
  
  for (let i = 1; i <= 1000; i++) {
    const permName = permNames[Math.floor(Math.random() * permNames.length)];
    const workspaceId = Math.floor(Math.random() * 10) + 1;
    
    permissions.push({
      id: i,
      name: permName,
      description: `${permName} permission for workspace ${workspaceId}`,
      workspace_id: workspaceId,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  return permissions;
};

const generateContacts = () => {
  const contacts = [];
  for (let i = 1; i <= 2000; i++) {
    const firstName = randomData.firstNames[Math.floor(Math.random() * randomData.firstNames.length)];
    const lastName = randomData.lastNames[Math.floor(Math.random() * randomData.lastNames.length)];
    const company = randomData.companies[Math.floor(Math.random() * randomData.companies.length)];
    const workspaceId = Math.floor(Math.random() * 10) + 1;
    
    contacts.push({
      id: i,
      workspace_id: workspaceId,
      first_name: firstName,
      last_name: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${company.toLowerCase()}.com`,
      phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      company: company,
      position: ['CEO', 'CTO', 'Manager', 'Director', 'Analyst', 'Developer', 'Designer', 'Sales Rep', 'Marketing Manager', 'HR Manager'][Math.floor(Math.random() * 10)],
      status: randomData.statuses[Math.floor(Math.random() * randomData.statuses.length)],
      notes: `Contact ${i} - ${company} representative`,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  return contacts;
};

const generateCustomers = () => {
  const customers = [];
  for (let i = 1; i <= 1500; i++) {
    const company = randomData.companies[Math.floor(Math.random() * randomData.companies.length)];
    const industry = randomData.industries[Math.floor(Math.random() * randomData.industries.length)];
    const workspaceId = Math.floor(Math.random() * 10) + 1;
    
    customers.push({
      id: i,
      workspace_id: workspaceId,
      name: `${company} ${i}`,
      email: `contact@${company.toLowerCase()}${i}.com`,
      phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      address: `${Math.floor(Math.random() * 9999) + 1} Business Street, City ${i}, ST ${String(Math.floor(Math.random() * 99999) + 10000).padStart(5, '0')}`,
      status: randomData.statuses[Math.floor(Math.random() * randomData.statuses.length)],
      customer_type: ['enterprise', 'startup', 'small_business', 'individual'][Math.floor(Math.random() * 4)],
      industry: industry,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  return customers;
};

const generateEnquiries = () => {
  const enquiries = [];
  for (let i = 1; i <= 1000; i++) {
    const workspaceId = Math.floor(Math.random() * 10) + 1;
    const customerId = Math.floor(Math.random() * 1500) + 1;
    const contactId = Math.floor(Math.random() * 2000) + 1;
    
    enquiries.push({
      id: i,
      workspace_id: workspaceId,
      customer_id: customerId,
      contact_id: contactId,
      subject: `Enquiry ${i} - ${['Project Management', 'CRM System', 'Website Development', 'Mobile App', 'Cloud Migration', 'Data Analytics', 'Security Audit', 'Process Automation'][Math.floor(Math.random() * 8)]}`,
      description: `Detailed enquiry about ${['project management software', 'CRM solution', 'website development', 'mobile application', 'cloud services', 'data analytics', 'security services', 'automation tools'][Math.floor(Math.random() * 8)]} for customer ${customerId}`,
      status: ['open', 'in_progress', 'closed', 'resolved'][Math.floor(Math.random() * 4)],
      priority: randomData.priorities[Math.floor(Math.random() * randomData.priorities.length)],
      source: randomData.sources[Math.floor(Math.random() * randomData.sources.length)],
      assigned_to: Math.floor(Math.random() * 2000) + 1,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  return enquiries;
};

const generateProjects = () => {
  const projects = [];
  for (let i = 1; i <= 1000; i++) {
    const workspaceId = Math.floor(Math.random() * 10) + 1;
    const customerId = Math.floor(Math.random() * 1500) + 1;
    const projectNames = ['Website Redesign', 'Mobile App Development', 'Cloud Migration', 'CRM Implementation', 'Data Analytics Platform', 'Security Enhancement', 'Process Automation', 'API Development', 'Database Optimization', 'UI/UX Redesign'];
    
    projects.push({
      id: i,
      workspace_id: workspaceId,
      name: `${projectNames[Math.floor(Math.random() * projectNames.length)]} ${i}`,
      description: `Project ${i} description - comprehensive solution for customer ${customerId}`,
      status: ['active', 'planning', 'completed', 'on_hold', 'cancelled'][Math.floor(Math.random() * 5)],
      priority: randomData.priorities[Math.floor(Math.random() * randomData.priorities.length)],
      start_date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: Math.floor(Math.random() * 500000) + 10000,
      customer_id: customerId,
      project_manager: Math.floor(Math.random() * 2000) + 1,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  return projects;
};

const generateJobs = () => {
  const jobs = [];
  for (let i = 1; i <= 2000; i++) {
    const workspaceId = Math.floor(Math.random() * 10) + 1;
    const projectId = Math.floor(Math.random() * 1000) + 1;
    const jobNames = ['Frontend Development', 'Backend Development', 'Database Design', 'API Integration', 'Testing', 'Deployment', 'Documentation', 'Training', 'Support', 'Maintenance'];
    
    jobs.push({
      id: i,
      workspace_id: workspaceId,
      project_id: projectId,
      name: `${jobNames[Math.floor(Math.random() * jobNames.length)]} ${i}`,
      description: `Job ${i} for project ${projectId}`,
      status: ['completed', 'in_progress', 'pending', 'cancelled'][Math.floor(Math.random() * 4)],
      priority: randomData.priorities[Math.floor(Math.random() * randomData.priorities.length)],
      assigned_to: Math.floor(Math.random() * 2000) + 1,
      estimated_hours: Math.floor(Math.random() * 200) + 10,
      actual_hours: Math.floor(Math.random() * 250) + 5,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  return jobs;
};

const generateTasks = () => {
  const tasks = [];
  for (let i = 1; i <= 3000; i++) {
    const workspaceId = Math.floor(Math.random() * 10) + 1;
    const jobId = Math.floor(Math.random() * 2000) + 1;
    const taskNames = ['Setup Project', 'Create Database', 'Implement API', 'Write Tests', 'Code Review', 'Deploy Application', 'Update Documentation', 'Fix Bugs', 'Optimize Performance', 'User Training'];
    
    tasks.push({
      id: i,
      workspace_id: workspaceId,
      job_id: jobId,
      name: `${taskNames[Math.floor(Math.random() * taskNames.length)]} ${i}`,
      description: `Task ${i} for job ${jobId}`,
      status: ['completed', 'in_progress', 'pending', 'cancelled'][Math.floor(Math.random() * 4)],
      priority: randomData.priorities[Math.floor(Math.random() * randomData.priorities.length)],
      assigned_to: Math.floor(Math.random() * 2000) + 1,
      estimated_hours: Math.floor(Math.random() * 50) + 1,
      actual_hours: Math.floor(Math.random() * 60) + 1,
      due_date: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  return tasks;
};

const generateTimesheets = () => {
  const timesheets = [];
  for (let i = 1; i <= 5000; i++) {
    const workspaceId = Math.floor(Math.random() * 10) + 1;
    const userId = Math.floor(Math.random() * 2000) + 1;
    const projectId = Math.floor(Math.random() * 1000) + 1;
    const jobId = Math.floor(Math.random() * 2000) + 1;
    const taskId = Math.floor(Math.random() * 3000) + 1;
    
    timesheets.push({
      id: i,
      workspace_id: workspaceId,
      user_id: userId,
      project_id: projectId,
      job_id: jobId,
      task_id: taskId,
      date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      hours: Math.round((Math.random() * 8 + 0.5) * 4) / 4, // 0.5 to 8.5 hours in 0.25 increments
      description: `Work on project ${projectId}, job ${jobId}, task ${taskId}`,
      status: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)],
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  return timesheets;
};

const generateDocuments = () => {
  const documents = [];
  const fileTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'text/plain', 'application/zip'];
  const fileNames = ['requirements.pdf', 'design.docx', 'specification.xlsx', 'report.pdf', 'presentation.pptx', 'manual.pdf', 'guide.docx', 'analysis.xlsx', 'proposal.pdf', 'contract.docx'];
  
  for (let i = 1; i <= 1000; i++) {
    const workspaceId = Math.floor(Math.random() * 10) + 1;
    const projectId = Math.floor(Math.random() * 1000) + 1;
    const fileName = fileNames[Math.floor(Math.random() * fileNames.length)];
    const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
    
    documents.push({
      id: i,
      workspace_id: workspaceId,
      project_id: projectId,
      name: fileName,
      description: `Document ${i} for project ${projectId}`,
      file_path: `workspace-${workspaceId}/project-${projectId}/${fileName}`,
      file_size: Math.floor(Math.random() * 10000000) + 100000, // 100KB to 10MB
      file_type: fileType,
      uploaded_by: Math.floor(Math.random() * 2000) + 1,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  return documents;
};

// Generate all data
const workspaces = generateWorkspaces();
let users = generateUsers();
const groups = generateGroups();
const roles = generateRoles();
const departments = generateDepartments();
const permissions = generatePermissions();
const contacts = generateContacts();
const customers = generateCustomers();
const enquiries = generateEnquiries();
const projects = generateProjects();
const jobs = generateJobs();
const tasks = generateTasks();
const timesheets = generateTimesheets();
const documents = generateDocuments();

// Add admin user to the beginning of generated users
users.unshift({
  id: 0,
  email: 'administrative@admin.com',
  password: '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjdOj6K6LQqGQqGQqGQqGQqGQqGQqG', // password: Admin@123
  username: 'admin',
  first_name: 'Admin',
  last_name: 'User',
  name: 'Administrator',
  role: 'admin',
  status: 'active',
  active: true,
  phone_no: '+1-555-0100',
  address: '123 Admin Street, Admin City, AC 12345',
  workspace_id: 1,
  createdAt: new Date().toISOString()
});

// Add test users for workspace 2
users.push({
  id: 2001,
  email: 'john.doe@clienta.com',
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
  username: 'johndoe',
  first_name: 'John',
  last_name: 'Doe',
  name: 'John Doe',
  role: 'user',
  status: 'active',
  active: true,
  phone_no: '+1-555-0101',
  address: '456 Client A Street, Client City, CA 54321',
  workspace_id: 2,
  createdAt: new Date().toISOString()
});

users.push({
  id: 2002,
  email: 'jane.smith@clienta.com',
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
  username: 'janesmith',
  first_name: 'Jane',
  last_name: 'Smith',
  name: 'Jane Smith',
  role: 'manager',
  status: 'active',
  active: true,
  phone_no: '+1-555-0102',
  address: '789 Client A Avenue, Client City, CA 54321',
  workspace_id: 2,
  createdAt: new Date().toISOString()
});

// Add test groups for workspace 2
groups.push({
  id: 1001,
  name: 'Client A Developers',
  machine_name: 'client_a_developers',
  description: 'Development team for Client A projects',
  status: 'active',
  workspace_id: 2,
  createdAt: new Date().toISOString()
});

groups.push({
  id: 1002,
  name: 'Client A Managers',
  machine_name: 'client_a_managers',
  description: 'Management team for Client A',
  status: 'active',
  workspace_id: 2,
  createdAt: new Date().toISOString()
});

// Add test roles for workspace 2
roles.push({
  id: 1001,
  name: 'Client A Admin',
  description: 'Administrator role for Client A workspace',
  status: 'active',
  workspace_id: 2,
  createdAt: new Date().toISOString()
});

roles.push({
  id: 1002,
  name: 'Client A User',
  description: 'Standard user role for Client A workspace',
  status: 'active',
  workspace_id: 2,
  createdAt: new Date().toISOString()
});

// Add test departments for workspace 2
departments.push({
  id: 1001,
  name: 'Client A Development',
  code: 'DEV',
  description: 'Development department for Client A',
  status: 'active',
  workspace_id: 2,
  createdAt: new Date().toISOString()
});

departments.push({
  id: 1002,
  name: 'Client A Operations',
  code: 'OPS',
  description: 'Operations department for Client A',
  status: 'active',
  workspace_id: 2,
  createdAt: new Date().toISOString()
});

// Add test enquiries for workspace 2
enquiries.push({
  id: 1001,
  title: 'Website Development Inquiry',
  description: 'Client A needs a new website for their business',
  customer_name: 'John Doe',
  email: 'john.doe@clienta.com',
  phone: '+1-555-0101',
  status: 'open',
  workspace_id: 2,
  createdAt: new Date().toISOString()
});

enquiries.push({
  id: 1002,
  title: 'Mobile App Consultation',
  description: 'Interested in developing a mobile application',
  customer_name: 'Jane Smith',
  email: 'jane.smith@clienta.com',
  phone: '+1-555-0102',
  status: 'in_progress',
  workspace_id: 2,
  createdAt: new Date().toISOString()
});

// Add test projects for workspace 2
projects.push({
  id: 1001,
  name: 'Client A Website Redesign',
  description: 'Complete website redesign and development project',
  customer_id: 1,
  customer_name: 'Client A',
  start_date: new Date().toISOString(),
  end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'active',
  workspace_id: 2,
  createdAt: new Date().toISOString()
});

projects.push({
  id: 1002,
  name: 'Client A Mobile App',
  description: 'Development of mobile application for Client A',
  customer_id: 1,
  customer_name: 'Client A',
  start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'planned',
  workspace_id: 2,
  createdAt: new Date().toISOString()
});

// Update IDs to account for admin user
users.forEach((user, index) => {
  user.id = index;
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Workspace middleware - extracts workspace from headers or query
const workspaceMiddleware = (req, res, next) => {
  const workspaceId = req.headers['x-workspace-id'] || req.query.workspace_id;
  if (workspaceId) {
    req.workspace_id = parseInt(workspaceId);
  } else {
    // Default to workspace 1 if not specified
    req.workspace_id = 1;
  }
  next();
};

// Helper function to filter data by workspace
const filterByWorkspace = (data, workspaceId) => {
  return data.filter(item => item.workspace_id === workspaceId);
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    message: 'Bootstrap Auth API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      login: 'POST /auth/login',
      users: 'GET /users (requires auth)',
      profile: 'GET /auth/profile (requires auth)'
    }
  });
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@admin.com
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password (temporarily simplified for testing)
    const isValidPassword = password === 'Admin@123';
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success response
    res.json({
      message: 'Login successful',
      token: token,
      access_token: token, // Alternative field name
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile (protected route)
app.get('/auth/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt
    }
  });
});

// Get all users (protected route)
// Users API endpoint moved to /api/users

// Dashboard Routes
app.get('/', (req, res) => {
  res.render('layouts/main', {
    title: 'Dashboard',
    currentPage: 'dashboard'
  });
});

app.get('/users', (req, res) => {
  res.render('layouts/main', {
    title: 'Users',
    currentPage: 'users'
  });
});

app.get('/departments', (req, res) => {
  res.render('layouts/main', {
    title: 'Departments',
    currentPage: 'departments'
  });
});

app.get('/kanban', (req, res) => {
  res.render('layouts/main', {
    title: 'Kanban Board',
    currentPage: 'kanban'
  });
});

app.get('/scrum', (req, res) => {
  res.render('layouts/main', {
    title: 'Scrum Board',
    currentPage: 'scrum'
  });
});

app.get('/scheduler', (req, res) => {
  res.render('layouts/main', {
    title: 'Job Scheduler',
    currentPage: 'scheduler'
  });
});

app.get('/projects', (req, res) => {
  res.render('layouts/main', {
    title: 'Projects',
    currentPage: 'projects'
  });
});

app.get('/tasks', (req, res) => {
  res.render('layouts/main', {
    title: 'Tasks',
    currentPage: 'tasks'
  });
});

app.get('/jobs', (req, res) => {
  res.render('layouts/main', {
    title: 'Jobs',
    currentPage: 'jobs'
  });
});

app.get('/data-viewer', (req, res) => {
  res.render('layouts/main', {
    title: 'Database Viewer',
    currentPage: 'data-viewer'
  });
});

app.get('/timesheets', (req, res) => {
  res.render('layouts/main', {
    title: 'Timesheets',
    currentPage: 'timesheets'
  });
});

app.get('/groups', (req, res) => {
  res.render('layouts/main', {
    title: 'Groups',
    currentPage: 'groups'
  });
});

app.get('/permissions', (req, res) => {
  res.render('layouts/main', {
    title: 'Permissions',
    currentPage: 'permissions'
  });
});

app.get('/workspaces', (req, res) => {
  res.render('layouts/main', {
    title: 'Workspaces',
    currentPage: 'workspaces'
  });
});

app.get('/contacts', (req, res) => {
  res.render('layouts/main', {
    title: 'Contacts',
    currentPage: 'contacts'
  });
});

app.get('/customers', (req, res) => {
  res.render('layouts/main', {
    title: 'Customers',
    currentPage: 'customers'
  });
});

app.get('/roles', (req, res) => {
  res.render('layouts/main', {
    title: 'Roles',
    currentPage: 'roles'
  });
});

app.get('/enquiries', (req, res) => {
  res.render('layouts/main', {
    title: 'Enquiries',
    currentPage: 'enquiries'
  });
});

app.get('/documents', (req, res) => {
  res.render('layouts/main', {
    title: 'Documents',
    currentPage: 'documents'
  });
});

app.get('/login.html', (req, res) => {
  res.render('pages/login');
});


// Alternative endpoint for users
app.get('/api/users', authenticateToken, (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const usersList = users.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt
  }));

  res.json(usersList);
});

// Logout endpoint (optional)
app.post('/auth/logout', authenticateToken, (req, res) => {
  // In a real app, you might blacklist the token
  res.json({ message: 'Logout successful' });
});

// ===== API V2 ENDPOINTS =====

// Helper function to get next ID
const getNextId = (array) => {
  return Math.max(...array.map(item => item.id), 0) + 1;
};

// ===== WORKSPACES V2 ENDPOINTS =====

// Get all workspaces
app.get('/api/v2/workspaces', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  res.json(workspaces);
});

// Get single workspace
app.get('/api/v2/workspaces/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const workspaceId = parseInt(req.params.id);
  const workspace = workspaces.find(w => w.id === workspaceId);
  if (!workspace) {
    return res.status(404).json({ error: 'Workspace not found' });
  }
  res.json(workspace);
});

// Create workspace
app.post('/api/v2/workspaces', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const newWorkspace = {
    id: getNextId(workspaces),
    uuid: uuidv4(),
    status: 'active',
    createdAt: new Date().toISOString(),
    ...req.body
  };
  workspaces.push(newWorkspace);
  res.status(201).json(newWorkspace);
});

// Update workspace
app.put('/api/v2/workspaces/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const workspaceId = parseInt(req.params.id);
  const workspaceIndex = workspaces.findIndex(w => w.id === workspaceId);
  if (workspaceIndex === -1) {
    return res.status(404).json({ error: 'Workspace not found' });
  }
  workspaces[workspaceIndex] = { ...workspaces[workspaceIndex], ...req.body };
  res.json(workspaces[workspaceIndex]);
});

// Delete workspace
app.delete('/api/v2/workspaces/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const workspaceId = parseInt(req.params.id);
  const workspaceIndex = workspaces.findIndex(w => w.id === workspaceId);
  if (workspaceIndex === -1) {
    return res.status(404).json({ error: 'Workspace not found' });
  }
  workspaces.splice(workspaceIndex, 1);
  res.json({ message: 'Workspace deleted successfully' });
});

// ===== USERS V2 ENDPOINTS =====

/**
 * @swagger
 * /api/v2/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/v2/users', authenticateToken, workspaceMiddleware, (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const workspaceUsers = filterByWorkspace(users, req.workspace_id);
  const usersList = workspaceUsers.map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    name: user.name,
    role: user.role,
    status: user.status,
    active: user.active,
    phone_no: user.phone_no,
    address: user.address,
    workspace_id: user.workspace_id,
    createdAt: user.createdAt
  }));

  res.json(usersList);
});

// Get single user
app.get('/api/v2/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    name: user.name,
    role: user.role,
    status: user.status,
    active: user.active,
    phone_no: user.phone_no,
    address: user.address,
    createdAt: user.createdAt
  });
});

// Create user
app.post('/api/v2/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const newUser = {
    id: getNextId(users),
    ...req.body,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

// Update user
app.put('/api/v2/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users[userIndex] = { ...users[userIndex], ...req.body };
  res.json(users[userIndex]);
});

// Patch user
app.patch('/api/v2/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users[userIndex] = { ...users[userIndex], ...req.body };
  res.json(users[userIndex]);
});

// Delete user
app.delete('/api/v2/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users.splice(userIndex, 1);
  res.json({ message: 'User deleted successfully' });
});

// ===== DATA VIEWER ENDPOINTS =====

// Get all data for data viewer
app.get('/api/v2/data-viewer/all', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  res.json({
    users: users.slice(0, 50), // Limit to first 50 for performance
    workspaces: workspaces.slice(0, 50),
    projects: projects.slice(0, 50),
    tasks: tasks.slice(0, 50),
    jobs: jobs.slice(0, 50),
    timesheets: timesheets.slice(0, 50),
    groups: groups.slice(0, 50),
    roles: roles.slice(0, 50),
    departments: departments.slice(0, 50),
    permissions: permissions.slice(0, 50),
    contacts: contacts.slice(0, 50),
    customers: customers.slice(0, 50),
    enquiries: enquiries.slice(0, 50),
    documents: documents.slice(0, 50),
    counts: {
      users: users.length,
      workspaces: workspaces.length,
      projects: projects.length,
      tasks: tasks.length,
      jobs: jobs.length,
      timesheets: timesheets.length,
      groups: groups.length,
      roles: roles.length,
      departments: departments.length,
      permissions: permissions.length,
      contacts: contacts.length,
      customers: customers.length,
      enquiries: enquiries.length,
      documents: documents.length
    }
  });
});

// Get Redis key value
app.get('/api/v2/redis/:key', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (!redisClient || !redisClient.isOpen) {
    return res.status(503).json({ error: 'Redis not available' });
  }

  try {
    const key = req.params.key;
    const value = await redisClient.get(key);
    res.json({ key, value, type: typeof value });
  } catch (error) {
    console.error('Redis error:', error);
    res.status(500).json({ error: 'Redis operation failed' });
  }
});

// Get all Redis keys
app.get('/api/v2/redis', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (!redisClient || !redisClient.isOpen) {
    return res.status(503).json({ error: 'Redis not available' });
  }

  try {
    const keys = await redisClient.keys('*');
    const keyValues = {};
    
    for (const key of keys) {
      const value = await redisClient.get(key);
      keyValues[key] = value;
    }
    
    res.json({ keys, keyValues, count: keys.length });
  } catch (error) {
    console.error('Redis error:', error);
    res.status(500).json({ error: 'Redis operation failed' });
  }
});

// Clear all Redis data
app.delete('/api/v2/redis', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (!redisClient || !redisClient.isOpen) {
    return res.status(503).json({ error: 'Redis not available' });
  }

  try {
    await redisClient.flushAll();
    res.json({ message: 'All Redis data cleared successfully' });
  } catch (error) {
    console.error('Redis error:', error);
    res.status(500).json({ error: 'Redis operation failed' });
  }
});

// ===== GROUPS V2 ENDPOINTS =====

/**
 * @swagger
 * /api/v2/groups:
 *   get:
 *     summary: Get all groups
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Group'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/v2/groups', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const workspaceGroups = filterByWorkspace(groups, req.workspace_id);
  res.json(workspaceGroups);
});

// Get single group
app.get('/api/v2/groups/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const groupId = parseInt(req.params.id);
  const group = groups.find(g => g.id === groupId);
  
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  res.json(group);
});

// Create group
app.post('/api/v2/groups', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const newGroup = {
    id: getNextId(groups),
    ...req.body,
    createdAt: new Date().toISOString()
  };

  groups.push(newGroup);
  res.status(201).json(newGroup);
});

// Update group
app.put('/api/v2/groups/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const groupId = parseInt(req.params.id);
  const groupIndex = groups.findIndex(g => g.id === groupId);
  
  if (groupIndex === -1) {
    return res.status(404).json({ error: 'Group not found' });
  }

  groups[groupIndex] = { ...groups[groupIndex], ...req.body };
  res.json(groups[groupIndex]);
});

// Patch group
app.patch('/api/v2/groups/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const groupId = parseInt(req.params.id);
  const groupIndex = groups.findIndex(g => g.id === groupId);
  
  if (groupIndex === -1) {
    return res.status(404).json({ error: 'Group not found' });
  }

  groups[groupIndex] = { ...groups[groupIndex], ...req.body };
  res.json(groups[groupIndex]);
});

// Delete group
app.delete('/api/v2/groups/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const groupId = parseInt(req.params.id);
  const groupIndex = groups.findIndex(g => g.id === groupId);
  
  if (groupIndex === -1) {
    return res.status(404).json({ error: 'Group not found' });
  }

  groups.splice(groupIndex, 1);
  res.json({ message: 'Group deleted successfully' });
});

// ===== ROLES V2 ENDPOINTS =====

// Get all roles
app.get('/api/v2/roles', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  res.json(roles);
});

// Get single role
app.get('/api/v2/roles/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const roleId = parseInt(req.params.id);
  const role = roles.find(r => r.id === roleId);
  
  if (!role) {
    return res.status(404).json({ error: 'Role not found' });
  }

  res.json(role);
});

// Create role
app.post('/api/v2/roles', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const newRole = {
    id: getNextId(roles),
    ...req.body,
    createdAt: new Date().toISOString()
  };

  roles.push(newRole);
  res.status(201).json(newRole);
});

// Update role
app.put('/api/v2/roles/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const roleId = parseInt(req.params.id);
  const roleIndex = roles.findIndex(r => r.id === roleId);
  
  if (roleIndex === -1) {
    return res.status(404).json({ error: 'Role not found' });
  }

  roles[roleIndex] = { ...roles[roleIndex], ...req.body };
  res.json(roles[roleIndex]);
});

// Patch role
app.patch('/api/v2/roles/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const roleId = parseInt(req.params.id);
  const roleIndex = roles.findIndex(r => r.id === roleId);
  
  if (roleIndex === -1) {
    return res.status(404).json({ error: 'Role not found' });
  }

  roles[roleIndex] = { ...roles[roleIndex], ...req.body };
  res.json(roles[roleIndex]);
});

// Delete role
app.delete('/api/v2/roles/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const roleId = parseInt(req.params.id);
  const roleIndex = roles.findIndex(r => r.id === roleId);
  
  if (roleIndex === -1) {
    return res.status(404).json({ error: 'Role not found' });
  }

  roles.splice(roleIndex, 1);
  res.json({ message: 'Role deleted successfully' });
});

// ===== DEPARTMENTS V2 ENDPOINTS =====

// Get all departments
app.get('/api/v2/departments', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  res.json(departments);
});

// Get single department
app.get('/api/v2/departments/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const deptId = parseInt(req.params.id);
  const dept = departments.find(d => d.id === deptId);
  if (!dept) {
    return res.status(404).json({ error: 'Department not found' });
  }
  res.json(dept);
});

// Create department
app.post('/api/v2/departments', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const newDept = {
    id: getNextId(departments),
    status: 'active',
    createdAt: new Date().toISOString(),
    ...req.body
  };
  departments.push(newDept);
  res.status(201).json(newDept);
});

// Update department
app.put('/api/v2/departments/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const deptId = parseInt(req.params.id);
  const idx = departments.findIndex(d => d.id === deptId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Department not found' });
  }
  departments[idx] = { ...departments[idx], ...req.body };
  res.json(departments[idx]);
});

// Patch department
app.patch('/api/v2/departments/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const deptId = parseInt(req.params.id);
  const idx = departments.findIndex(d => d.id === deptId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Department not found' });
  }
  departments[idx] = { ...departments[idx], ...req.body };
  res.json(departments[idx]);
});

// Delete department
app.delete('/api/v2/departments/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const deptId = parseInt(req.params.id);
  const idx = departments.findIndex(d => d.id === deptId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Department not found' });
  }
  departments.splice(idx, 1);
  res.json({ message: 'Department deleted successfully' });
});

// ===== PERMISSIONS V2 ENDPOINTS =====

// Get all permissions
app.get('/api/v2/permissions', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  res.json(permissions);
});

// Get single permission
app.get('/api/v2/permissions/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const permId = parseInt(req.params.id);
  const perm = permissions.find(p => p.id === permId);
  if (!perm) {
    return res.status(404).json({ error: 'Permission not found' });
  }
  res.json(perm);
});

// Create permission
app.post('/api/v2/permissions', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const newPerm = {
    id: getNextId(permissions),
    createdAt: new Date().toISOString(),
    ...req.body
  };
  permissions.push(newPerm);
  res.status(201).json(newPerm);
});

// Update permission
app.put('/api/v2/permissions/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const permId = parseInt(req.params.id);
  const idx = permissions.findIndex(p => p.id === permId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Permission not found' });
  }
  permissions[idx] = { ...permissions[idx], ...req.body };
  res.json(permissions[idx]);
});

// Patch permission
app.patch('/api/v2/permissions/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const permId = parseInt(req.params.id);
  const idx = permissions.findIndex(p => p.id === permId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Permission not found' });
  }
  permissions[idx] = { ...permissions[idx], ...req.body };
  res.json(permissions[idx]);
});

// Delete permission
app.delete('/api/v2/permissions/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const permId = parseInt(req.params.id);
  const idx = permissions.findIndex(p => p.id === permId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Permission not found' });
  }
  permissions.splice(idx, 1);
  res.json({ message: 'Permission deleted successfully' });
});

// ===== CRM V2 ENDPOINTS =====

// CONTACTS ENDPOINTS
app.get('/api/v2/contacts', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const workspaceContacts = filterByWorkspace(contacts, req.workspace_id);
  res.json(workspaceContacts);
});

app.get('/api/v2/contacts/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const contactId = parseInt(req.params.id);
  const workspaceContacts = filterByWorkspace(contacts, req.workspace_id);
  const contact = workspaceContacts.find(c => c.id === contactId);
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  res.json(contact);
});

app.post('/api/v2/contacts', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const newContact = {
    id: getNextId(contacts),
    workspace_id: req.workspace_id,
    status: 'active',
    createdAt: new Date().toISOString(),
    ...req.body
  };
  contacts.push(newContact);
  res.status(201).json(newContact);
});

app.put('/api/v2/contacts/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const contactId = parseInt(req.params.id);
  const contactIndex = contacts.findIndex(c => c.id === contactId && c.workspace_id === req.workspace_id);
  if (contactIndex === -1) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  contacts[contactIndex] = { ...contacts[contactIndex], ...req.body };
  res.json(contacts[contactIndex]);
});

app.delete('/api/v2/contacts/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const contactId = parseInt(req.params.id);
  const contactIndex = contacts.findIndex(c => c.id === contactId && c.workspace_id === req.workspace_id);
  if (contactIndex === -1) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  contacts.splice(contactIndex, 1);
  res.json({ message: 'Contact deleted successfully' });
});

// CUSTOMERS ENDPOINTS
app.get('/api/v2/customers', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const workspaceCustomers = filterByWorkspace(customers, req.workspace_id);
  res.json(workspaceCustomers);
});

app.get('/api/v2/customers/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const customerId = parseInt(req.params.id);
  const workspaceCustomers = filterByWorkspace(customers, req.workspace_id);
  const customer = workspaceCustomers.find(c => c.id === customerId);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  res.json(customer);
});

app.post('/api/v2/customers', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const newCustomer = {
    id: getNextId(customers),
    workspace_id: req.workspace_id,
    status: 'active',
    createdAt: new Date().toISOString(),
    ...req.body
  };
  customers.push(newCustomer);
  res.status(201).json(newCustomer);
});

app.put('/api/v2/customers/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const customerId = parseInt(req.params.id);
  const customerIndex = customers.findIndex(c => c.id === customerId && c.workspace_id === req.workspace_id);
  if (customerIndex === -1) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  customers[customerIndex] = { ...customers[customerIndex], ...req.body };
  res.json(customers[customerIndex]);
});

app.delete('/api/v2/customers/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const customerId = parseInt(req.params.id);
  const customerIndex = customers.findIndex(c => c.id === customerId && c.workspace_id === req.workspace_id);
  if (customerIndex === -1) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  customers.splice(customerIndex, 1);
  res.json({ message: 'Customer deleted successfully' });
});

// ENQUIRIES ENDPOINTS
app.get('/api/v2/enquiries', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const workspaceEnquiries = filterByWorkspace(enquiries, req.workspace_id);
  res.json(workspaceEnquiries);
});

app.get('/api/v2/enquiries/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const enquiryId = parseInt(req.params.id);
  const workspaceEnquiries = filterByWorkspace(enquiries, req.workspace_id);
  const enquiry = workspaceEnquiries.find(e => e.id === enquiryId);
  if (!enquiry) {
    return res.status(404).json({ error: 'Enquiry not found' });
  }
  res.json(enquiry);
});

app.post('/api/v2/enquiries', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const newEnquiry = {
    id: getNextId(enquiries),
    workspace_id: req.workspace_id,
    status: 'open',
    createdAt: new Date().toISOString(),
    ...req.body
  };
  enquiries.push(newEnquiry);
  res.status(201).json(newEnquiry);
});

app.put('/api/v2/enquiries/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const enquiryId = parseInt(req.params.id);
  const enquiryIndex = enquiries.findIndex(e => e.id === enquiryId && e.workspace_id === req.workspace_id);
  if (enquiryIndex === -1) {
    return res.status(404).json({ error: 'Enquiry not found' });
  }
  enquiries[enquiryIndex] = { ...enquiries[enquiryIndex], ...req.body };
  res.json(enquiries[enquiryIndex]);
});

app.delete('/api/v2/enquiries/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const enquiryId = parseInt(req.params.id);
  const enquiryIndex = enquiries.findIndex(e => e.id === enquiryId && e.workspace_id === req.workspace_id);
  if (enquiryIndex === -1) {
    return res.status(404).json({ error: 'Enquiry not found' });
  }
  enquiries.splice(enquiryIndex, 1);
  res.json({ message: 'Enquiry deleted successfully' });
});

// ===== PROJECT MANAGEMENT V2 ENDPOINTS =====

// PROJECTS ENDPOINTS

/**
 * @swagger
 * /api/v2/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/v2/projects', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const workspaceProjects = filterByWorkspace(projects, req.workspace_id);
  res.json(workspaceProjects);
});

app.get('/api/v2/projects/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const projectId = parseInt(req.params.id);
  const workspaceProjects = filterByWorkspace(projects, req.workspace_id);
  const project = workspaceProjects.find(p => p.id === projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

app.post('/api/v2/projects', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const newProject = {
    id: getNextId(projects),
    workspace_id: req.workspace_id,
    status: 'planning',
    createdAt: new Date().toISOString(),
    ...req.body
  };
  projects.push(newProject);
  res.status(201).json(newProject);
});

app.put('/api/v2/projects/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const projectId = parseInt(req.params.id);
  const projectIndex = projects.findIndex(p => p.id === projectId && p.workspace_id === req.workspace_id);
  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }
  projects[projectIndex] = { ...projects[projectIndex], ...req.body };
  res.json(projects[projectIndex]);
});

app.delete('/api/v2/projects/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const projectId = parseInt(req.params.id);
  const projectIndex = projects.findIndex(p => p.id === projectId && p.workspace_id === req.workspace_id);
  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }
  projects.splice(projectIndex, 1);
  res.json({ message: 'Project deleted successfully' });
});

// JOBS ENDPOINTS
app.get('/api/v2/jobs', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const workspaceJobs = filterByWorkspace(jobs, req.workspace_id);
  res.json(workspaceJobs);
});

app.get('/api/v2/jobs/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const jobId = parseInt(req.params.id);
  const workspaceJobs = filterByWorkspace(jobs, req.workspace_id);
  const job = workspaceJobs.find(j => j.id === jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

app.post('/api/v2/jobs', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const newJob = {
    id: getNextId(jobs),
    workspace_id: req.workspace_id,
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...req.body
  };
  jobs.push(newJob);
  res.status(201).json(newJob);
});

app.put('/api/v2/jobs/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const jobId = parseInt(req.params.id);
  const jobIndex = jobs.findIndex(j => j.id === jobId && j.workspace_id === req.workspace_id);
  if (jobIndex === -1) {
    return res.status(404).json({ error: 'Job not found' });
  }
  jobs[jobIndex] = { ...jobs[jobIndex], ...req.body };
  res.json(jobs[jobIndex]);
});

app.delete('/api/v2/jobs/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const jobId = parseInt(req.params.id);
  const jobIndex = jobs.findIndex(j => j.id === jobId && j.workspace_id === req.workspace_id);
  if (jobIndex === -1) {
    return res.status(404).json({ error: 'Job not found' });
  }
  jobs.splice(jobIndex, 1);
  res.json({ message: 'Job deleted successfully' });
});

// TASKS ENDPOINTS
app.get('/api/v2/tasks', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const workspaceTasks = filterByWorkspace(tasks, req.workspace_id);
  res.json(workspaceTasks);
});

app.get('/api/v2/tasks/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const taskId = parseInt(req.params.id);
  const workspaceTasks = filterByWorkspace(tasks, req.workspace_id);
  const task = workspaceTasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

app.post('/api/v2/tasks', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const newTask = {
    id: getNextId(tasks),
    workspace_id: req.workspace_id,
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...req.body
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.put('/api/v2/tasks/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === taskId && t.workspace_id === req.workspace_id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  tasks[taskIndex] = { ...tasks[taskIndex], ...req.body };
  res.json(tasks[taskIndex]);
});

app.delete('/api/v2/tasks/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === taskId && t.workspace_id === req.workspace_id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  tasks.splice(taskIndex, 1);
  res.json({ message: 'Task deleted successfully' });
});

// TIMESHEETS ENDPOINTS
app.get('/api/v2/timesheets', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const workspaceTimesheets = filterByWorkspace(timesheets, req.workspace_id);
  res.json(workspaceTimesheets);
});

app.get('/api/v2/timesheets/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const timesheetId = parseInt(req.params.id);
  const workspaceTimesheets = filterByWorkspace(timesheets, req.workspace_id);
  const timesheet = workspaceTimesheets.find(t => t.id === timesheetId);
  if (!timesheet) {
    return res.status(404).json({ error: 'Timesheet not found' });
  }
  res.json(timesheet);
});

app.post('/api/v2/timesheets', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const newTimesheet = {
    id: getNextId(timesheets),
    workspace_id: req.workspace_id,
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...req.body
  };
  timesheets.push(newTimesheet);
  res.status(201).json(newTimesheet);
});

app.put('/api/v2/timesheets/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const timesheetId = parseInt(req.params.id);
  const timesheetIndex = timesheets.findIndex(t => t.id === timesheetId && t.workspace_id === req.workspace_id);
  if (timesheetIndex === -1) {
    return res.status(404).json({ error: 'Timesheet not found' });
  }
  timesheets[timesheetIndex] = { ...timesheets[timesheetIndex], ...req.body };
  res.json(timesheets[timesheetIndex]);
});

app.delete('/api/v2/timesheets/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const timesheetId = parseInt(req.params.id);
  const timesheetIndex = timesheets.findIndex(t => t.id === timesheetId && t.workspace_id === req.workspace_id);
  if (timesheetIndex === -1) {
    return res.status(404).json({ error: 'Timesheet not found' });
  }
  timesheets.splice(timesheetIndex, 1);
  res.json({ message: 'Timesheet deleted successfully' });
});

// DOCUMENTS ENDPOINTS
app.get('/api/v2/documents', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const workspaceDocuments = filterByWorkspace(documents, req.workspace_id);
  res.json(workspaceDocuments);
});

app.get('/api/v2/documents/:id', authenticateToken, workspaceMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const documentId = parseInt(req.params.id);
  const workspaceDocuments = filterByWorkspace(documents, req.workspace_id);
  const document = workspaceDocuments.find(d => d.id === documentId);
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json(document);
});

// File upload endpoint
app.post('/api/v2/documents/upload', authenticateToken, workspaceMiddleware, upload ? upload.single('file') : (req, res, next) => next(), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const fileName = `${req.workspace_id}/${uuidv4()}-${req.file.originalname}`;
    const bucketName = 'documents';
    
    // Ensure bucket exists
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName);
    }
    
    // Upload file to MinIO
    await minioClient.putObject(bucketName, fileName, req.file.buffer, req.file.size);
    
    const newDocument = {
      id: getNextId(documents),
      workspace_id: req.workspace_id,
      name: req.file.originalname,
      description: req.body.description || '',
      file_path: fileName,
      file_size: req.file.size,
      file_type: req.file.mimetype,
      uploaded_by: req.user.id,
      createdAt: new Date().toISOString()
    };
    
    documents.push(newDocument);
    res.status(201).json(newDocument);
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

app.get('/api/v2/documents/:id/download', authenticateToken, workspaceMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const documentId = parseInt(req.params.id);
  const workspaceDocuments = filterByWorkspace(documents, req.workspace_id);
  const document = workspaceDocuments.find(d => d.id === documentId);
  
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  try {
    // Get file from MinIO
    const fileStream = await minioClient.getObject('documents', document.file_path);
    
    res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    fileStream.pipe(res);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'File download failed' });
  }
});

app.delete('/api/v2/documents/:id', authenticateToken, workspaceMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const documentId = parseInt(req.params.id);
  const documentIndex = documents.findIndex(d => d.id === documentId && d.workspace_id === req.workspace_id);
  if (documentIndex === -1) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  const document = documents[documentIndex];
  
  try {
    // Delete file from MinIO
    await minioClient.removeObject('documents', document.file_path);
    documents.splice(documentIndex, 1);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: 'File deletion failed' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Bootstrap Auth API Server running on port ${PORT}`);
  console.log(`📝 Available endpoints:`);
  console.log(`   POST /auth/login - Login with email/password`);
  console.log(`   GET /auth/profile - Get user profile (requires auth)`);
  console.log(`   GET /users - Get all users (admin only)`);
  console.log(`   GET /api/users - Alternative users endpoint`);
  console.log(`   POST /auth/logout - Logout (requires auth)`);
  console.log(`\n🔑 Test credentials:`);
  console.log(`   Email: administrative@admin.com`);
  console.log(`   Password: Admin@123`);
});

module.exports = app;
