import { Injectable, Logger } from "@nestjs/common";
import * as sql from "mssql";
import * as dotenv from "dotenv";

dotenv.config();
const dbConfig: sql.config = {
  user: process.env.RK7_DB_USER!,
  password: process.env.RK7_DB_PASSWORD!,
  server: process.env.RK7_DB_SERVER!,
  port: Number(process.env.RK7_DB_PORT || 1433),
  database: process.env.RK7_DB_NAME!,
  options: {
    encrypt: process.env.RK7_DB_ENCRYPT === "true",
    trustServerCertificate: process.env.RK7_DB_TRUST_CERT === "true",
  },
};

export default dbConfig;

@Injectable()
export class MssqlService {
  private readonly logger = new Logger(MssqlService.name);

  async query<T = any>(queryText: string): Promise<T[]> {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query<T>(queryText);
    await pool.close();
    return result.recordset;
  }
}
