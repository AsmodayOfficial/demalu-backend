import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/database/prisma.service";
import { useContainer } from "class-validator";

describe("AppController (e2e)", () => {
  let app: INestApplication | null = null;
  let prisma: PrismaService | null = null;

  beforeAll(async () => {
    try {
      const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleRef.createNestApplication();
      useContainer(app.select(AppModule), { fallbackOnErrors: true });

      app.useGlobalPipes(
        new ValidationPipe({
          transform: true,
          whitelist: true,
          forbidNonWhitelisted: true,
        }),
      );

      await app.init();

      prisma = app.get(PrismaService);
    } catch (error) {
      console.error("🔥 Failed to init app", error);
      if (prisma) await prisma.$disconnect(); // ensure cleanup if init failed
    }
  }, 15000);

  it("/ (GET)", async () => {
    if (!app) throw new Error("App is not initialized");
    const res = await request(app.getHttpServer()).get("/").expect(200);
    expect(res.text).toBe("Hello World!");
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
    if (app) await app.close();
  });
});
