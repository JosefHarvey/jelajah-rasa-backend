const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Memulai proses seeding...');

  // 1. Hapus semua data lama untuk memastikan database bersih
  // Urutan penghapusan penting untuk menghindari error relasi
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
      firstName: 'Naufal',
      lastName: 'Fakhri',
      email: 'naufal@email.com',
      password: hashedPassword1,
    },
  });

  const hashedPassword2 = await bcrypt.hash('password456', 10);
  const user2 = await prisma.user.create({
    data: {
      firstName: 'Josef',
      lastName: 'Harvey',
      email: 'josef@email.com',
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
      historyAndMeaning: 'Asal-usul rendang ditelusuri berasal dari tanah Minangkabau, Sumatera Barat. Bagi masyarakat Minang, rendang sudah ada sejak dahulu dan telah menjadi masakan tradisi yang dihidangkan dalam berbagai acara adat dan hidangan keseharian.  Sebagai masakan tradisi, rendang diduga telah lahir sejak orang Minang menggelar acara adat pertamanya. Kemudian seni memasak ini berkembang ke kawasan serantau berbudaya Melayu lainnya; mulai dari Mandailing, Riau, Jambi, hingga ke negeri seberang di Negeri Sembilan yang banyak dihuni perantau asal Minangkabau. Karena itulah rendang dikenal luas baik di Sumatera dan Semenanjung Malaya.',
      cookingMethod: 'Proses memasak rendang asli dapat menghabiskan waktu berjam-jam (biasanya sekitar empat jam), karena itulah memasak rendang memerlukan waktu dan kesabaran. Potongan daging dimasak bersama bumbu dan santan dalam panas api yang tepat, diaduk pelan-pelan hingga santan dan bumbu terserap daging. Setelah mendidih, apinya dikecilkan dan terus diaduk hingga santan mengental dan menjadi kering. ',
      quickFacts: 'Pernah dinobatkan sebagai hidangan terlezat di dunia versi CNN pada 2011 dan merupakan salah satu hidangan nasional Indonesia.',
      latitude: -0.94924,
      longitude: 100.35427,
      influencerComment: 'Salah satu hidangan daging paling menakjubkan di dunia. Bumbunya meresap sempurna, sangat kaya akan rempah.',
      commentSource: 'Mark Wiens - YouTube',
      region: {
        connect: { id: regionSumbar.id },
      },
    },
  });

  const sateMaranggi = await prisma.food.create({
    data: {
      name: 'Sate Maranggi',
      historyAndMeaning: 'Sate khas dari Purwakarta, Jawa Barat. Keunikannya terletak pada proses marinasi daging dalam bumbu kaya rempah sebelum dibakar, sehingga bumbunya meresap hingga ke dalam.',
      cookingMethod: 'Daging sapi dipotong dadu, direndam (dimarinasi) dalam bumbu manis-gurih, lalu dibakar di atas bara api. Disajikan dengan sambal tomat segar atau sambal oncom.',
      quickFacts: 'Berbeda dari sate lain, biasanya tidak disajikan dengan saus kacang karena rasanya sudah kuat dari proses marinasi.',
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

  // 6. Hubungkan Makanan dan Restoran
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
      user: { connect: { id: user1.id } }, // Naufal
      food: { connect: { id: rendang.id } },
    },
  });

  await prisma.rating.create({
    data: {
      value: 5,
      user: { connect: { id: user1.id } }, // Naufal
      food: { connect: { id: rendang.id } },
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Sate marangginya empuk, sambelnya seger!',
      user: { connect: { id: user2.id } }, // Josef
      food: { connect: { id: sateMaranggi.id } },
    },
  });
  
  await prisma.rating.create({
    data: {
      value: 4,
      user: { connect: { id: user2.id } }, // Josef
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

