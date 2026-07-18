import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/config/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: 'localhost',
    port: 3306,
    user: 'versus',
    password: 'versus_dev',
    database: 'versus_erp',
  },
});
