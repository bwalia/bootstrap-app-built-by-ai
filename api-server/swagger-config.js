const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WebAImpetus API',
      version: '1.0.0',
      description: 'API documentation for WebAImpetus application',
      contact: {
        name: 'WebAImpetus Support',
        email: 'support@webaimpetus.com'
      }
    },
    servers: [
      {
        url: 'https://dev007.webaimpetus.com',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'user'] },
            workspace_id: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Group: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            machine_name: { type: 'string' },
            description: { type: 'string' },
            workspace_id: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Role: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            machine_name: { type: 'string' },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Workspace: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            machine_name: { type: 'string' },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Contact: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            company: { type: 'string' },
            position: { type: 'string' },
            workspace_id: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            company: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive', 'prospect'] },
            workspace_id: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['planning', 'active', 'completed', 'cancelled'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            workspace_id: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            project_id: { type: 'integer' },
            workspace_id: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Timesheet: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            project_id: { type: 'integer' },
            task_id: { type: 'integer' },
            hours: { type: 'number' },
            date: { type: 'string', format: 'date' },
            description: { type: 'string' },
            workspace_id: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./server.js'] // Path to the API files
};

const specs = swaggerJSDoc(options);
module.exports = specs;
