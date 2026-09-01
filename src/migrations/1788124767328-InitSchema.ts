import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1788124767328 implements MigrationInterface {
  name = 'InitSchema1788124767328';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'gallery', 'artist', 'collector')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("userId" SERIAL NOT NULL, "username" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."user_role_enum" NOT NULL DEFAULT 'collector', "isValidated" boolean NOT NULL DEFAULT false, "refreshTokenHash" character varying, CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "PK_d72ea127f30e21753c9e229891e" PRIMARY KEY ("userId"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."artist_status_enum" AS ENUM('active', 'inactive')`,
    );
    await queryRunner.query(
      `CREATE TABLE "artist" ("id" SERIAL NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "biography" text, "portfolioUrl" character varying, "nationality" character varying NOT NULL, "status" "public"."artist_status_enum" NOT NULL DEFAULT 'active', "entryDate" date NOT NULL, "galleryId" integer NOT NULL, "userId" integer, CONSTRAINT "REL_3c2c776c0a094c15d6c165494c" UNIQUE ("userId"), CONSTRAINT "PK_55b76e71568b5db4d01d3e394ed" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."artwork_status_enum" AS ENUM('available', 'on_loan', 'sold', 'returned')`,
    );
    await queryRunner.query(
      `CREATE TABLE "artwork" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "creationYear" integer NOT NULL, "technique" character varying NOT NULL, "dimensions" character varying NOT NULL, "price" numeric(12,2) NOT NULL, "reservePrice" numeric(12,2) NOT NULL, "status" "public"."artwork_status_enum" NOT NULL DEFAULT 'available', "imageUrl" character varying, "depositDate" date NOT NULL, "artistId" integer NOT NULL, "galleryId" integer NOT NULL, CONSTRAINT "PK_ee2e7c5ad7226179d4113a96fa8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_163cc177551a7a8dcdd53eb423" ON "artwork"  ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_136e2cbe2176afb340c143971f" ON "artwork"  ("artistId", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "exhibition" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "locationOrUrl" character varying NOT NULL, "galleryId" integer NOT NULL, CONSTRAINT "PK_ddc3afc8e0b4daf3b68d51c31f4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."artwork_status_history_previousstatus_enum" AS ENUM('available', 'on_loan', 'sold', 'returned')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."artwork_status_history_newstatus_enum" AS ENUM('available', 'on_loan', 'sold', 'returned')`,
    );
    await queryRunner.query(
      `CREATE TABLE "artwork_status_history" ("id" SERIAL NOT NULL, "artworkId" integer NOT NULL, "previousStatus" "public"."artwork_status_history_previousstatus_enum", "newStatus" "public"."artwork_status_history_newstatus_enum" NOT NULL, "changedById" integer, "changedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_68c60ce6ce8e626831075d5f0b8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sale" ("id" SERIAL NOT NULL, "date" TIMESTAMP NOT NULL DEFAULT now(), "salePrice" numeric(12,2) NOT NULL, "galleryCommission" numeric(12,2) NOT NULL, "artistBalance" numeric(12,2) NOT NULL, "collectorId" integer NOT NULL, "artworkId" integer NOT NULL, CONSTRAINT "REL_a1afa8d02a4e9b6c180aa4bda6" UNIQUE ("artworkId"), CONSTRAINT "PK_d03891c457cbcd22974732b5de2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_25278f8cf755233f1e082dbced" ON "sale"  ("date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "exhibition_artworks_artwork" ("exhibitionId" integer NOT NULL, "artworkId" integer NOT NULL, CONSTRAINT "PK_9b1516e2f2b23c040c0564d7f22" PRIMARY KEY ("exhibitionId", "artworkId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1c98089dc57874fca2f78f9e64" ON "exhibition_artworks_artwork"  ("exhibitionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_48f13bed3efb6abeb2291de289" ON "exhibition_artworks_artwork"  ("artworkId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "artist" ADD CONSTRAINT "FK_e5d3c3ecd41b2d5b27c51ee9b85" FOREIGN KEY ("galleryId") REFERENCES "user"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "artist" ADD CONSTRAINT "FK_3c2c776c0a094c15d6c165494c0" FOREIGN KEY ("userId") REFERENCES "user"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "artwork" ADD CONSTRAINT "FK_bd42d534cb52c685d7f17b10a31" FOREIGN KEY ("artistId") REFERENCES "artist"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "artwork" ADD CONSTRAINT "FK_92c3f04f7255b3839ed9dd5c9ae" FOREIGN KEY ("galleryId") REFERENCES "user"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exhibition" ADD CONSTRAINT "FK_3415f0afe5cb4c16af673a89eb5" FOREIGN KEY ("galleryId") REFERENCES "user"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "artwork_status_history" ADD CONSTRAINT "FK_6078def674d6daea60c041a995d" FOREIGN KEY ("artworkId") REFERENCES "artwork"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "artwork_status_history" ADD CONSTRAINT "FK_447d5c7199e637356ea8976525f" FOREIGN KEY ("changedById") REFERENCES "user"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale" ADD CONSTRAINT "FK_59de91fd879e074a3b7db0cd6cc" FOREIGN KEY ("collectorId") REFERENCES "user"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale" ADD CONSTRAINT "FK_a1afa8d02a4e9b6c180aa4bda6d" FOREIGN KEY ("artworkId") REFERENCES "artwork"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exhibition_artworks_artwork" ADD CONSTRAINT "FK_1c98089dc57874fca2f78f9e640" FOREIGN KEY ("exhibitionId") REFERENCES "exhibition"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "exhibition_artworks_artwork" ADD CONSTRAINT "FK_48f13bed3efb6abeb2291de2891" FOREIGN KEY ("artworkId") REFERENCES "artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "exhibition_artworks_artwork" DROP CONSTRAINT "FK_48f13bed3efb6abeb2291de2891"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exhibition_artworks_artwork" DROP CONSTRAINT "FK_1c98089dc57874fca2f78f9e640"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale" DROP CONSTRAINT "FK_a1afa8d02a4e9b6c180aa4bda6d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale" DROP CONSTRAINT "FK_59de91fd879e074a3b7db0cd6cc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "artwork_status_history" DROP CONSTRAINT "FK_447d5c7199e637356ea8976525f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "artwork_status_history" DROP CONSTRAINT "FK_6078def674d6daea60c041a995d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exhibition" DROP CONSTRAINT "FK_3415f0afe5cb4c16af673a89eb5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "artwork" DROP CONSTRAINT "FK_92c3f04f7255b3839ed9dd5c9ae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "artwork" DROP CONSTRAINT "FK_bd42d534cb52c685d7f17b10a31"`,
    );
    await queryRunner.query(
      `ALTER TABLE "artist" DROP CONSTRAINT "FK_3c2c776c0a094c15d6c165494c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "artist" DROP CONSTRAINT "FK_e5d3c3ecd41b2d5b27c51ee9b85"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_48f13bed3efb6abeb2291de289"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1c98089dc57874fca2f78f9e64"`,
    );
    await queryRunner.query(`DROP TABLE "exhibition_artworks_artwork"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_25278f8cf755233f1e082dbced"`,
    );
    await queryRunner.query(`DROP TABLE "sale"`);
    await queryRunner.query(`DROP TABLE "artwork_status_history"`);
    await queryRunner.query(
      `DROP TYPE "public"."artwork_status_history_newstatus_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."artwork_status_history_previousstatus_enum"`,
    );
    await queryRunner.query(`DROP TABLE "exhibition"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_136e2cbe2176afb340c143971f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_163cc177551a7a8dcdd53eb423"`,
    );
    await queryRunner.query(`DROP TABLE "artwork"`);
    await queryRunner.query(`DROP TYPE "public"."artwork_status_enum"`);
    await queryRunner.query(`DROP TABLE "artist"`);
    await queryRunner.query(`DROP TYPE "public"."artist_status_enum"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
  }
}
