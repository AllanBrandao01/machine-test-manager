-- CreateTable
CREATE TABLE "public"."Machine" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL,
    "firstTest" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);
