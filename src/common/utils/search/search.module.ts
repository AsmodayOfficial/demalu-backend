import { ElasticsearchModule } from "@nestjs/elasticsearch";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SearchService } from "./search.service";

@Module({
  imports: [
    ConfigModule,
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        node: configService.get("ELASTICSEARCH_NODE"),
        auth: {
          apiKey: configService.get("ELASTICSEARCH_APIKEY"),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
