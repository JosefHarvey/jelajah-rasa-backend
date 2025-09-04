// prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding...');

  // 1. Hapus data user lama untuk menghindari error email duplikat
  await prisma.user.deleteMany();

  // 2. Siapkan data user sesuai dengan yang ada di Postman
  const adminPassword = await bcrypt.hash('admin', 10); // Password 'admin' di-hash
  const userPassword = await bcrypt.hash('user123', 10); // Contoh user kedua

  // 3. Masukkan data ke database menggunakan createMany
  const createdUsers = await prisma.user.createMany({
    data: [
      {
        name: 'admin',
        email: 'admin123@gmail.com', // Email dari screenshot
        password: adminPassword,       // Password yang sudah di-hash
      },
      {
        name: 'user',
        email: 'user@example.com',
        password: userPassword,
      },
    ],
    skipDuplicates: true, // Lewati jika ada data duplikat
  });

  console.log(`✅ Seeding selesai. Berhasil membuat ${createdUsers.count} user baru.`);
}

// Menjalankan fungsi utama dan menutup koneksi
main()
  .catch((e) => {
    console.error('Error saat menjalankan seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });