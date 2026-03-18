/*
  Warnings:

  - A unique constraint covering the columns `[code,shiftSessionId]` on the table `Machine` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `shift` on the `Machine` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `shiftSessionId` on table `Machine` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `shift` on the `ShiftSession` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."Shift" AS ENUM ('A', 'B', 'C', 'D');

-- DropForeignKey
ALTER TABLE "public"."Machine" DROP CONSTRAINT "Machine_shiftSessionId_fkey";

-- AlterTable
ALTER TABLE "public"."Machine" ALTER COLUMN "frequency" SET DEFAULT 1,
DROP COLUMN "shift",
ADD COLUMN     "shift" "public"."Shift" NOT NULL,
ALTER COLUMN "shiftSessionId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."ShiftSession" DROP COLUMN "shift",
ADD COLUMN     "shift" "public"."Shift" NOT NULL;

-- CreateIndex
CREATE INDEX "Machine_shiftSessionId_idx" ON "public"."Machine"("shiftSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_code_shiftSessionId_key" ON "public"."Machine"("code", "shiftSessionId");

-- CreateIndex
CREATE INDEX "Stop_machineId_idx" ON "public"."Stop"("machineId");

-- CreateIndex
CREATE INDEX "Test_machineId_idx" ON "public"."Test"("machineId");

-- AddForeignKey
ALTER TABLE "public"."Machine" ADD CONSTRAINT "Machine_shiftSessionId_fkey" FOREIGN KEY ("shiftSessionId") REFERENCES "public"."ShiftSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
