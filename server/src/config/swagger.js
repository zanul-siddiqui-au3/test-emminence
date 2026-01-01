const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Test Project API',
      version: '1.0.0',
      description: 'Emminence Innovation Management API Documentation'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken'
        }
      }
    }
  },
  apis: ['./src/routes/*.js'] // Read JSDoc from all route files
};

module.exports = swaggerJsdoc(options);