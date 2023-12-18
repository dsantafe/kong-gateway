const { Client } = require('pg');

class TransformTokenToBasicPlugin {
    constructor(config) {
        this.config = config;
    }

    async access(kong) {

        // Get consumer ID from x-consumer-id header    
        let consumerId = await kong.request.getHeader('x-consumer-id');

        const client = new Client({
            host: this.config.db_host,
            user: this.config.db_username,
            password: this.config.db_password,
            port: this.config.db_port,
            database: this.config.db_name,
            ssl: this.config.db_ssl
        });

        try {

            await client.connect()

            // Fetch the basic auth credentials from postgres
            const res = await client.query(`SELECT api_user, api_password FROM consumers_info WHERE consumer_id = '${consumerId}'`)

            // Decrypt the password
            let username = res.rows[0].api_user;
            let password = res.rows[0].api_password;
            password = Buffer.from(password, 'base64').toString('utf8');

            // Set Authorization header with basic auth format    
            let auth_token = 'Basic ' + Buffer(username + ':' + password).toString('base64');
            await kong.service.request.setHeader('Authorization', auth_token);

            await client.end()

        } catch (error) {
            kong.log('Error TransformTokenToBasic ', JSON.stringify(error))
        }
    }
}

module.exports = {
    Plugin: TransformTokenToBasicPlugin,
    Schema: [
        { db_host: { type: "string" } },
        { db_username: { type: "string" } },
        { db_password: { type: "string" } },
        { db_port: { type: "number" } },
        { db_name: { type: "string" } },
        { db_ssl: { type: "boolean" } }
    ],
    Version: '0.0.1',
    Priority: 0,
}