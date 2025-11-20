## Development
### Open your Terminal and run these command  and press w:

```bash
docker compose up
```

## Database migration
#### Open backend shell
```bash
docker compose exec -it jic_backend bash
```
#### Inside backend shell run
```bash
npx prisma migrate dev
```

## Run tests
#### Open backend shell
```bash
docker compose exec -it jic_backend bash
```
#### Inside backend shell run
```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
