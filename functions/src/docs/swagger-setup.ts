import express from 'express';
import * as swaggerUi from 'swagger-ui-express';
import * as YAML from 'yamljs';
import * as path from 'path';
import * as fs from 'fs';

// ✅ Function to load OpenAPI spec from the same directory
const loadSwaggerDocument = () => {
    try {
        // Since openapi.yaml is in the same directory as this file
        const yamlPath = path.join(__dirname, 'openapi.yaml');

        console.log(`Looking for OpenAPI spec at: ${yamlPath}`);
        if (fs.existsSync(yamlPath)) {
            console.log(`✅ Found OpenAPI spec at: ${yamlPath}`);
            const document = YAML.load(yamlPath);
            console.log(`✅ Successfully loaded OpenAPI spec with ${Object.keys(document.paths || {}).length} endpoints`);
            return document;
        } else {
            console.log(`❌ OpenAPI spec not found at: ${yamlPath}`);
            throw new Error(`OpenAPI YAML file not found at: ${yamlPath}`);
        }
    } catch (error) {
        console.error('❌ Error loading OpenAPI spec:', error);

        // Fallback to a minimal spec
        console.log('📄 Using fallback OpenAPI specification');
        return {
            openapi: '3.1.0',
            info: {
                title: 'FinBuddy API',
                version: '1.0.0',
                description: '⚠️ API documentation is using fallback spec (YAML file not found)'
            },
            servers: [
                {
                    url: 'http://localhost:5001/finbuddy-6af05/us-central1',
                    description: 'Local development server'
                }
            ],
            paths: {
                '/health': {
                    get: {
                        summary: 'Health check',
                        description: 'Check if the API is running',
                        responses: {
                            200: {
                                description: 'API is healthy'
                            }
                        }
                    }
                }
            }
        };
    }
};

export const createDocsApp = () => {
    const app = express();

    const swaggerDocument = loadSwaggerDocument();

    const swaggerOptions = {
        explorer: true,
        customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #1976d2; font-size: 2em; }
      .swagger-ui .info .description { font-size: 1.1em; margin: 20px 0; }
      .swagger-ui .scheme-container { 
        background: #f8f9fa; 
        padding: 15px; 
        border-radius: 5px; 
        margin: 20px 0; 
        border-left: 4px solid #1976d2;
      }
      .swagger-ui .info { margin: 30px 0; }
      .swagger-ui .btn.authorize { 
        background-color: #1976d2; 
        border-color: #1976d2; 
      }
    `,
        customSiteTitle: 'FinBuddy API Documentation',
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            docExpansion: 'list',
            filter: true,
            tryItOutEnabled: true
        }
    };

    app.use('/', swaggerUi.serve);
    app.get('/', swaggerUi.setup(swaggerDocument, swaggerOptions));

    app.get('/health', (req, res) => {
        const isYamlLoaded = !swaggerDocument.info.description?.includes('fallback spec');

        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            endpoints: Object.keys(swaggerDocument.paths || {}).length,
            yamlLoaded: isYamlLoaded,
            yamlPath: path.join(__dirname, 'openapi.yaml')
        });
    });

    app.get('/debug', (req, res) => {
        const yamlPath = path.join(__dirname, 'openapi.yaml');
        res.json({
            __dirname,
            yamlPath,
            yamlExists: fs.existsSync(yamlPath),
            dirContents: fs.readdirSync(__dirname)
        });
    });

    return app;
};

