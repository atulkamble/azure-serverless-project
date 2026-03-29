const { app } = require('@azure/functions');

app.http('hello', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request.');

        const name = request.query.get('name') || await request.text() || 'World';

        return { 
            status: 200,
            body: `Hello, ${name}! This is Azure Serverless.`
        };
    }
});
