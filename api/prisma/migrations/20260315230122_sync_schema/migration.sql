/*
  Warnings:

  - Added the required column `shiftSessionId` to the `Machine` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Machine" ADD COLUMN     "shiftSessionId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."ShiftSession" (
    "id" SERIAL NOT NULL,
    "shift" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Stop" (
    "id" SERIAL NOT NULL,
    "machineId" INTEGER NOT NULL,
    "stopTime" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "resumeTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Test" (
    "id" SERIAL NOT NULL,
    "machineId" INTEGER NOT NULL,
    "testTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Machine" ADD CONSTRAINT "Machine_shiftSessionId_fkey" FOREIGN KEY ("shiftSessionId") REFERENCES "public"."ShiftSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Stop" ADD CONSTRAINT "Stop_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "public"."Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Test" ADD CONSTRAINT "Test_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "public"."Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
