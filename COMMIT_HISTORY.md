# Commit history

Full commit log of the `develop` branch (26 commits), generated from
`git log --pretty=format:'| `%h` | %ad | %an | %s |' --date=format:'%Y-%m-%d %H:%M'`.

Repo: <https://github.com/Froggys974/Art-nest-project>

| Hash | Date | Author | Message |
| --- | --- | --- | --- |
| `df594d0` | 2026-09-01 10:05 | Florent | Merge pull request #10 from LMV0911/feat/e2e-test-suites |
| `afe44ff` | 2026-09-01 04:35 | Louis-Martin Vanderlynden | feat: e2e test suites for API modules |
| `1807210` | 2026-09-01 02:46 | Florent | Merge pull request #9 from Froggys974/fix/readme_seeds |
| `81eb821` | 2026-09-01 02:45 | Grondin Florent | fix seeds and readme |
| `af40743` | 2026-09-01 01:35 | Florent | Merge pull request #8 from Froggys974/fix/swagger |
| `c154b5a` | 2026-08-31 22:38 | Brubru | fix(docs): make sure swagger gives out all the relevant infos for testing |
| `828e621` | 2026-08-25 08:29 | Brutal | Merge pull request #7 from Froggys974/feature/exhibitions-sales-reports |
| `a7fa3d3` | 2026-08-24 22:37 | Brubru | fix(sales,exhibitions,artists): lock artworks against sale/loan races, enforce date-only exhibition dates, and correct the transfer rollback test (#CodeRabbit) |
| `b464615` | 2026-08-24 22:03 | Brubru | fix(sales,artists,exhibitions,money): make artist transfer atomic, surface concurrent double-sells as a business error, reject inverted exhibition dates, and correct commission rounding drift (#CodeRabbit) |
| `1693add` | 2026-08-24 20:47 | Brubru | fix(artists,exhibitions,reports): scope artist queries, sync transfer with artwork ownership, wrap exhibition creation in a transaction, and add artist self-service linking |
| `93448a4` | 2026-08-24 15:33 | Brubru | feat(exhibitions,sales,reports): add exhibition loan/return, transactional sales with commission tiers, and reporting endpoints |
| `7eb3987` | 2026-08-24 11:16 | Brutal | Merge pull request #6 from Froggys974/feat/role-auth-refresh |
| `913ce13` | 2026-08-24 11:08 | Brubru | Fix(auht): recheck gallery validation status on token refresh |
| `4793c9b` | 2026-08-24 09:44 | Brutal | Merge pull request #5 from Froggys974/feat/artists-artworks |
| `e2aa07f` | 2026-08-24 00:06 | Grondin Florent | feat: add artist crud and artwork and some rules |
| `c757a14` | 2026-08-23 23:07 | Grondin Florent | add refresh token, test for user and auth, register and logout and role |
| `7f3f5f2` | 2026-08-23 20:51 | Florent | Merge pull request #3 from Froggys974/feature/core-infra |
| `dd1f34f` | 2026-08-23 20:51 | Florent | Merge pull request #2 from Froggys974/feature/domain-entities |
| `11120dc` | 2026-08-23 20:48 | Florent | Merge pull request #1 from Froggys974/feature/auth-jwt-local |
| `6c1c080` | 2026-08-23 20:36 | Grondin Florent | fix(auth): remove insecure JWT secret fallback and align JWT_EXPIRES_IN default to 14m |
| `e5b4a63` | 2026-07-10 15:58 | Brubru | feat(infra): add global validation pipe, response envelope, logs, filters for exception, Joi w/ env validation, api/v1 versionning, date/price transformation pipes, DB health check and swagger |
| `3552cd8` | 2026-07-10 12:09 | Brubru | feat(domain): add Artist, Artwork, StatusHistory, Exhibition, Sale entities with enums and indexes |
| `8b3e140` | 2026-06-25 14:35 | Grondin Florent | feat: bootstrap auth (JWT, guards, decorators, TypeORM, Docker) |
| `74ba09c` | 2026-06-03 09:43 | Grondin Florent | fix app module |
| `3454f0e` | 2026-06-03 09:35 | Grondin Florent | add skeleton project nest |
| `50d6f6c` | 2026-06-02 16:39 | Grondin Florent | First Commit |

To regenerate this table after new commits:

```bash
git log --pretty=format:'| `%h` | %ad | %an | %s |' --date=format:'%Y-%m-%d %H:%M'
```
