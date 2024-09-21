-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "registration_id" TEXT NOT NULL,
    "variable_symbol" TEXT NOT NULL,
    "qr_data" TEXT NOT NULL,
    "paid" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_registration_id_key" ON "Payment"("registration_id");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "Registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
