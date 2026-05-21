-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "foto_url" TEXT;

-- AddForeignKey
ALTER TABLE "livros" ADD CONSTRAINT "livros_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
