/*
  Warnings:

  - A unique constraint covering the columns `[userId,foodId]` on the table `Comment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Comment_userId_foodId_key" ON "public"."Comment"("userId", "foodId");
