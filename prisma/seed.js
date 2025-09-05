const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Memulai proses seeding...');

  // 1. Hapus semua data lama untuk memastikan database bersih
  // Urutan penghapusan penting: hapus data "anak" sebelum "induk"
  await prisma.foodOnRestaurant.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.suggestion.deleteMany();
  await prisma.food.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();
  await prisma.region.deleteMany();
  
  console.log('Data lama berhasil dihapus.');

  // 2. Buat data Pengguna (User)
  const hashedPassword1 = await bcrypt.hash('password123', 10);
  const user1 = await prisma.user.create({
    data: {
      firstName: 'Budi',
      lastName: 'Sanjaya',
      email: 'budi@email.com',
      password: hashedPassword1,
    },
  });

  const hashedPassword2 = await bcrypt.hash('password456', 10);
  const user2 = await prisma.user.create({
    data: {
      firstName: 'Citra',
      lastName: 'Lestari',
      email: 'citra@email.com',
      password: hashedPassword2,
    },
  });
  console.log('Users berhasil dibuat.');

  // 3. Buat data Daerah (Region)
  const regionSumbar = await prisma.region.create({
    data: {
      name: 'Sumatera Barat',
      description: 'Provinsi di pesisir barat Pulau Sumatra yang dikenal sebagai tanah kelahiran suku Minangkabau.',
      cuisine_characteristics: 'Didominasi rasa pedas dan gurih dari santan kental, kaya akan rempah kompleks.',
    },
  });

  const regionJabar = await prisma.region.create({
    data: {
      name: 'Jawa Barat',
      description: 'Provinsi di bagian barat Pulau Jawa dengan ibukota Bandung, dikenal sebagai Tanah Pasundan.',
      cuisine_characteristics: 'Cita rasa yang beragam, mulai dari gurih-asin hingga manis-pedas, banyak menggunakan sayuran segar (lalapan).',
    },
  });
  console.log('Regions berhasil dibuat.');

  // 4. Buat data Makanan (Food)
  const rendang = await prisma.food.create({
    data: {
      name: 'Rendang',
      historyAndMeaning: 'Berasal dari Minangkabau, rendang melambangkan musyawarah mufakat dan menjadi bekal ideal bagi perantau karena awet.',
      cookingMethod: 'Dimasak dengan suhu rendah dalam waktu lama (slow cooking) dengan santan dan aneka rempah hingga mengering.',
      quickFacts: 'Pernah dinobatkan sebagai hidangan terlezat di dunia versi CNN pada 2011.',
      latitude: -0.94924,
      longitude: 100.35427,
      region: {
        connect: { id: regionSumbar.id },
      },
    },
  });

  const sateMaranggi = await prisma.food.create({
    data: {
      name: 'Sate Maranggi',
      historyAndMeaning: 'Sate khas Purwakarta yang proses perendamannya dalam bumbu kaya rempah membuatnya unik.',
      cookingMethod: 'Daging sapi direndam (dimarinasi) dalam bumbu sebelum dibakar. Disajikan dengan sambal tomat atau oncom.',
      quickFacts: 'Berbeda dari sate lain, biasanya tidak disajikan dengan saus kacang.',
      latitude: -6.5518,
      longitude: 107.444,
      region: {
        connect: { id: regionJabar.id },
      },
    },
  });
  console.log('Foods berhasil dibuat.');

  // 5. Buat data Restoran
  const rmSederhana = await prisma.restaurant.create({
      data: {
          name: "RM Padang Sederhana",
          address: "Jl. Juanda No. 25, Padang",
          googleMapsLink: "https://maps.google.com",
          region: {
              connect: { id: regionSumbar.id }
          }
      }
  });

  // 6. Hubungkan Makanan dan Restoran (Many-to-Many)
  await prisma.foodOnRestaurant.create({
      data: {
          foodId: rendang.id,
          restaurantId: rmSederhana.id,
      }
  });
  console.log('Makanan dan Restoran berhasil dihubungkan.');

  // 7. Buat data Komentar dan Rating
  await prisma.comment.create({
    data: {
      content: 'Rendangnya juara, bumbunya medok banget!',
      user: { connect: { id: user1.id } },
      food: { connect: { id: rendang.id } },
    },
  });

  await prisma.rating.create({
    data: {
      value: 5,
      user: { connect: { id: user1.id } },
      food: { connect: { id: rendang.id } },
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Sate marangginya empuk, sambelnya seger!',
      user: { connect: { id: user2.id } },
      food: { connect: { id: sateMaranggi.id } },
    },
  });
  
  await prisma.rating.create({
    data: {
      value: 4,
      user: { connect: { id: user2.id } },
      food: { connect: { id: sateMaranggi.id } },
    },
  });
  console.log('Komentar dan Rating berhasil dibuat.');

  console.log('Proses seeding selesai.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });