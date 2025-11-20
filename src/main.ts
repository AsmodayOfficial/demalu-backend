import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { openApiConfig } from "./configs/openapi.config";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import * as dotenv from "dotenv";
import { useContainer } from "class-validator";

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.setGlobalPrefix("api/v1");

  if (process.env.NODE_ENV === "production" && !process.env.STAGING) {
    app.useLogger(["fatal", "error"]);
  }
  app.use(cookieParser());

  app.enableCors({
    origin: (origin, callback) => {
      callback(null, origin);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );


  const options = new DocumentBuilder()
    .setTitle(openApiConfig.title)
    .setDescription(openApiConfig.description)
    .setVersion(openApiConfig.version)
    .addBasicAuth({ type: "http", scheme: "basic" }, "basic")
    .build();

  const document = SwaggerModule.createDocument(app, options);

  document.paths = Object.keys(document.paths)
    .filter(path => path.startsWith(openApiConfig.prefix) || path === "/")
    .reduce((obj, key) => {
      obj[key] = document.paths[key];
      return obj;
    }, {});

  SwaggerModule.setup(openApiConfig.path, app, document);

  console.log(`API documentation is available at ${openApiConfig.path}`);
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
