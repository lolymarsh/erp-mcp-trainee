import "dotenv/config";
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/config/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'versus',
    password: process.env.MYSQL_PASSWORD || 'versus_dev',
    database: process.env.MYSQL_DATABASE || 'versus_erp',
  },
});
