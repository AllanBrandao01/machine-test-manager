/*
  Warnings:

  - The primary key for the `Machine` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "public"."Machine" DROP CONSTRAINT "Machine_shiftSessionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Stop" DROP CONSTRAINT "Stop_machineId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Test" DROP CONSTRAINT "Test_machineId_fkey";

-- AlterTable
ALTER TABLE "public"."Machine" DROP CONSTRAINT "Machine_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "frequency" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "shiftSessionId" DROP NOT NULL,
ADD CONSTRAINT "Machine_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Machine_id_seq";

-- AlterTable
ALTER TABLE "public"."Stop" ALTER COLUMN "machineId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."Test" ALTER COLUMN "machineId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "public"."Machine" ADD CONSTRAINT "Machine_shiftSessionId_fkey" FOREIGN KEY ("shiftSessionId") REFERENCES "public"."ShiftSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Stop" ADD CONSTRAINT "Stop_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "public"."Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Test" ADD CONSTRAINT "Test_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "public"."Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
