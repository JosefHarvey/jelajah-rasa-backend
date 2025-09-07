// prisma/seed.js
const { PrismaClient, ArticleType } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  console.log('Memulai proses seeding...');

  await prisma.review.deleteMany();              
  await prisma.foodOnRestaurant.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.suggestion.deleteMany();
  await prisma.article.deleteMany();             
  await prisma.food.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();
  await prisma.region.deleteMany();
  console.log('Data lama berhasil dihapus.');

  // 1) Users
  const user1 = await prisma.user.create({
    data: {
      firstName: 'Naufal',
      lastName: 'Fakhri',
      email: 'naufal@email.com',
      password: await bcrypt.hash('password123', 10),
    },
  });

  const user2 = await prisma.user.create({
    data: {
      firstName: 'Josef',
      lastName: 'Harvey',
      email: 'josef@email.com',
      password: await bcrypt.hash('password456', 10),
    },
  });
  console.log('Users berhasil dibuat.');

  // 2) Regions (dengan profil citarasa + slug)
  const regionSumbar = await prisma.region.create({
    data: {
      name: 'Sumatera Barat',
      description: 'Provinsi di pesisir barat Pulau Sumatra yang dikenal sebagai tanah kelahiran suku Minangkabau.',
      cuisine_characteristics: 'Didominasi rasa pedas dan gurih dari santan kental, kaya akan rempah kompleks.',
      profileContent:
        'Profil citarasa Sumatera Barat menonjolkan bumbu kaya rempah dan teknik memasak perlahan. Hidangan ikoniknya: rendang, gulai, dendeng balado.',
      profileImageUrl: 'https://picsum.photos/seed/sumbar/800/400',
      slug: slugify('Sumatera Barat'),
    },
  });

  const regionJabar = await prisma.region.create({
    data: {
      name: 'Jawa Barat',
      description: 'Provinsi di bagian barat Pulau Jawa dengan ibukota Bandung, dikenal sebagai Tanah Pasundan.',
      cuisine_characteristics:
        'Cita rasa beragam, dari gurih-asin hingga manis-pedas; banyak menggunakan sayuran segar (lalapan).',
      profileContent:
        'Kuliner Sunda identik dengan kesegaran sayuran, sambal, dan rasa gurih ringan. Hidangan populer: karedok, nasi timbel, sate maranggi.',
      profileImageUrl: 'https://picsum.photos/seed/jabar/800/400',
      slug: slugify('Jawa Barat'),
    },
  });
  console.log('Regions berhasil dibuat.');

  // 3) Articles (profil daerah & cerita)
  const artikelProfilSumbar = await prisma.article.create({
    data: {
      title: 'Profil Citarasa: Sumatera Barat',
      slug: slugify('Profil Citarasa: Sumatera Barat'),
      content:
        'Artikel mendalam mengenai citarasa Minangkabau: sejarah, bumbu dasar, serta ragam hidangan legendaris.',
      type: ArticleType.REGION_PROFILE,
      regionId: regionSumbar.id,
      coverImageUrl: 'https://picsum.photos/seed/profilsumbar/1200/630',
      publishedAt: new Date(),
      authorId: user1.id,
    },
  });

  const artikelSejarahRendang = await prisma.article.create({
    data: {
      title: 'Sejarah dan Filosofi Rendang',
      slug: slugify('Sejarah dan Filosofi Rendang'),
      content:
        'Rendang bermula dari tradisi merantau dan kebutuhan mengawetkan makanan. Proses memasak lama membuat bumbu meresap sempurna.',
      type: ArticleType.STORY,
      regionId: regionSumbar.id,
      coverImageUrl: 'https://picsum.photos/seed/rendang/1200/630',
      publishedAt: new Date(),
      authorId: user1.id,
    },
  });

  const artikelSateMaranggi = await prisma.article.create({
    data: {
      title: 'Sate Maranggi: Marinasi Bumbu yang Kuat',
      slug: slugify('Sate Maranggi: Marinasi Bumbu yang Kuat'),
      content:
        'Sate khas Purwakarta dengan marinasi bumbu sebelum dibakar, menghasilkan rasa kuat bahkan tanpa saus kacang.',
      type: ArticleType.STORY,
      regionId: regionJabar.id,
      coverImageUrl: 'https://picsum.photos/seed/maranggi/1200/630',
      publishedAt: new Date(),
      authorId: user2.id,
    },
  });
  console.log('Articles berhasil dibuat.');

  // 4) Foods (dengan field baru + tautkan ke article via nested connect)
  const rendang = await prisma.food.create({
    data: {
      name: 'Rendang',
      historyAndMeaning:
        'Rendang (bahasa Minangkabau: randang; Jawi: رندڠ) adalah hidangan lauk pauk yang berasal Minangkabau, Indonesia dengan bahan dasar daging (ayam, bebek, telur,rusa, sapi, kerbau, dan lainnya) yang melalui proses memasak dengan suhu rendah dalam waktu lama dengan menggunakan aneka rempah-rempah dan santan. Hidangan ini terlahir akibat perilaku sedari lampau suku Minangkabau yang gemar merantau ke sana kemari sehingga butuh banyak perbekalan, terutama hidangan yang awet, tahan lama, dan bercita rasa sesuai lidah asli orang Minang. Awalnya menggunakan daging rusa. Namun, karena rusa mulai sulit didapat, bahan dasarnya beralih menjadi daging sapi atau kerbau.',
      cookingMethod:
        'Proses memasak rendang berlangsung lama, biasanya sekitar empat jam, hingga menyisakan potongan daging dengan tekstur yang empuk serta bumbu kehitaman yang mengering. proses ini dikenal sebagai merendang atau slow cooking. Dalam suhu ruang, rendang dapat bertahan hingga berminggu-minggu..',
      quickFacts:
        'Pernah dinobatkan sebagai hidangan terlezat di dunia (CNN, 2011).',
      latitude: -0.94924,
      longitude: 100.35427,
      influencerComment:
        'Salah satu hidangan daging paling menakjubkan di dunia. Bumbunya meresap sempurna.',
      commentSource: 'Mark Wiens - YouTube',
      // field 
      intro: 'Ikon kuliner Minangkabau dengan bumbu rempah pekat.',
      body:
        'Rendang dimasak perlahan hingga bumbu menyerap dan kuah mengering. Tekstur daging empuk, rasa kompleks.',
      imageUrl: 'https://picsum.photos/seed/rendangimg/600/400',
      cityName: 'Padang',

      article: { connect: { id: artikelSejarahRendang.id } }, 
      region: { connect: { id: regionSumbar.id } },
    },
  });

  const sateMaranggi = await prisma.food.create({
    data: {
      name: 'Sate Maranggi',
      historyAndMeaning:
        'Sate khas Purwakarta, Jawa Barat. Unik karena proses marinasi sebelum dibakar.',
      cookingMethod:
        'Daging sapi dimarinasi bumbu manis-gurih lalu dibakar; disajikan dengan sambal tomat/oncom.',
      quickFacts:
        'Biasanya tidak menggunakan saus kacang karena rasanya sudah kuat dari marinasi.',
      latitude: -6.5518,
      longitude: 107.444,
      // field 
      intro: 'Sate marinasi khas Purwakarta dengan cita rasa kuat.',
      body:
        'Perpaduan manis-gurih dari bumbu marinasi menyerap hingga ke serat daging. Nikmat dengan sambal tomat.',
      imageUrl: 'https://picsum.photos/seed/maranggiimg/600/400',
      cityName: 'Purwakarta',

      article: { connect: { id: artikelSateMaranggi.id } }, 
      region: { connect: { id: regionJabar.id } },
    },
  });
  console.log('Foods berhasil dibuat.');

  // 5) Restaurants
  const rmSederhana = await prisma.restaurant.create({
    data: {
      name: 'RM Padang Sederhana',
      address: 'Jl. Juanda No. 25, Padang',
      googleMapsLink: 'https://maps.google.com',
      region: { connect: { id: regionSumbar.id } },
    },
  });

  // 6) Link Food x Restaurant
  await prisma.foodOnRestaurant.create({
    data: { foodId: rendang.id, restaurantId: rmSederhana.id },
  });
  console.log('Makanan dan Restoran berhasil dihubungkan.');

  // 7) Komentar & Rating (Food) 
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
  console.log('Komentar & Rating Food berhasil dibuat.');

  // 8) Review Artikel (baru) — contoh 1 user/artikel
  await prisma.review.create({
    data: {
      articleId: artikelSejarahRendang.id,
      userId: user1.id,
      rating: 5,
      comment: 'Artikel rendangnya informatif sekali!',
    },
  });
  await prisma.review.create({
    data: {
      articleId: artikelProfilSumbar.id,
      userId: user2.id,
      rating: 4,
      comment: 'Profil daerah ringkas dan jelas.',
    },
  });
  console.log('Review Artikel berhasil dibuat.');

  // 9) Suggestions (opsional contoh)
  await prisma.suggestion.create({
    data: {
      foodName: 'Ayam Pop',
      origin: 'Sumatera Barat',
      description: 'Ayam goreng ala Minang dengan bumbu ringan dan sambal spesial.',
      suggesterName: 'User Demo',
    },
  });

  console.log('Proses seeding selesai ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
