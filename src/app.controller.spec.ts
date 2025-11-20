import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController", () => {
  let appController: AppController; ///Hello
  let appService: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHello: jest.fn(() => "Hello World!"),
          },
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService);
  });

  it("should be defined", () => {
    expect(appController).toBeDefined();
  });

  it('should return "Hello World!"', () => {
    expect(appController.getHello()).toBe("Hello World!");
  });

  it("should call getHello method of AppService", () => {
    const getHelloSpy = jest.spyOn(appService, "getHello");
    appController.getHello();
    expect(getHelloSpy).toHaveBeenCalled();
  });
});
