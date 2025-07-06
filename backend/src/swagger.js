const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'SwarnaAI API',
    version: '1.0.0',
    description: 'API documentation for SwarnaAI gold/silver assistant',
  },
  servers: [
    {
      url: process.env.BASE_URL,
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJSDoc(options);

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}

module.exports = setupSwagger;
