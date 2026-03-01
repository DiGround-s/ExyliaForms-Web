-- CreateTable
CREATE TABLE "form_user_unlocks" (
    "formId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_user_unlocks_pkey" PRIMARY KEY ("formId","userId")
);

-- AddForeignKey
ALTER TABLE "form_user_unlocks" ADD CONSTRAINT "form_user_unlocks_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_user_unlocks" ADD CONSTRAINT "form_user_unlocks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
