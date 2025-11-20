import { Injectable, Logger } from "@nestjs/common";
import { ElasticsearchService } from "@nestjs/elasticsearch";

@Injectable()
export class SearchService {
  constructor(private readonly esService: ElasticsearchService) {}
  private readonly logger = new Logger(SearchService.name);

  async indexDocument(index: string, id: string, document: any) {
    try {
      await this.esService.index({
        index: index,
        id,
        body: document,
      });
      this.logger.log(`Successfully indexed document ${id} in index ${index}`);
    } catch (error) {
      this.logger.error(`Error indexing document: ${error.message}`);
    }
  }
  async removeDocument(index: string, id: string) {
    try {
      await this.esService.delete({
        index,
        id,
      });
      this.logger.log(`Successfully deleted document ${id} from index ${index}`);
    } catch (error) {
      this.logger.warn(`Failed to delete document ${id} from index ${index}: ${error.message}`);
    }
  }
  async searchDocuments(index: string, query: string): Promise<any[]> {
    try {
      const result = await this.esService.search({
        index,
        body: {
          query: {
            multi_match: {
              query,
              fields: ["name^3", "description", "category"],
              fuzziness: "AUTO", // optional: allows minor typos
            },
          },
        },
      });

      return result.hits.hits.map(hit => hit._source);
    } catch (error) {
      this.logger.error(`Search failed on index ${index}: ${error.message}`);
      return [];
    }
  }
}
