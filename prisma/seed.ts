// ═══════════════════════════════════════════════════
// ArtVerse — Prisma Seed Script
// ═══════════════════════════════════════════════════

import { PrismaClient, UserRole, ArtCategory } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding ArtVerse database...\n");

  // ── Clean existing data ──
  await prisma.message.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.artProduct.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Cleared existing data");

  // ── Create Users ──
  const passwordHash = await bcrypt.hash("Password@123", 12);

  const admin = await prisma.user.create({
    data: {
      name: "ArtVerse Admin",
      email: "admin@artverse.com",
      passwordHash,
      role: UserRole.ADMIN,
      bio: "Platform administrator",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AA&backgroundColor=c77dff",
    },
  });

  const seller1 = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "priya@artverse.com",
      passwordHash,
      role: UserRole.SELLER,
      bio: "Watercolor artist & illustrator based in Mumbai. Specializing in floral and botanical art.",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=PS&backgroundColor=c77dff",
      socialLinks: {
        instagram: "https://instagram.com/priyaart",
        website: "https://priyasharma.art",
      },
    },
  });

  const seller2 = await prisma.user.create({
    data: {
      name: "Arjun Mehta",
      email: "arjun@artverse.com",
      passwordHash,
      role: UserRole.SELLER,
      bio: "Digital artist & concept designer. Creating fantasy worlds one pixel at a time.",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AM&backgroundColor=7b5ea7",
      socialLinks: {
        instagram: "https://instagram.com/arjundigital",
        behance: "https://behance.net/arjunmehta",
      },
    },
  });

  const seller3 = await prisma.user.create({
    data: {
      name: "Fatima Khan",
      email: "fatima@artverse.com",
      passwordHash,
      role: UserRole.SELLER,
      bio: "Mehndi artist with 10+ years of experience. Traditional and modern designs.",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=FK&backgroundColor=00d4c8",
    },
  });

  const buyer1 = await prisma.user.create({
    data: {
      name: "Rahul Verma",
      email: "rahul@artverse.com",
      passwordHash,
      role: UserRole.BUYER,
      bio: "Art collector and enthusiast.",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=RV&backgroundColor=f4c430",
    },
  });

  const buyer2 = await prisma.user.create({
    data: {
      name: "Sneha Patel",
      email: "sneha@artverse.com",
      passwordHash,
      role: UserRole.BUYER,
      bio: "Interior designer looking for unique art pieces.",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=SP&backgroundColor=ff6b8a",
    },
  });

  console.log("✅ Created 6 users (1 admin, 3 sellers, 2 buyers)");

  // ── Create Products ──
  const products = await Promise.all([
    prisma.artProduct.create({
      data: {
        title: "Sunset Over Mumbai Skyline",
        description:
          "A breathtaking watercolor painting capturing the golden hour over Mumbai's iconic skyline. Painted on 300gsm cold-pressed paper with professional-grade watercolors.",
        price: 4500,
        category: ArtCategory.PAINTINGS,
        tags: ["watercolor", "mumbai", "cityscape", "sunset", "landscape"],
        stock: 3,
        images: [
          "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800",
          "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800",
        ],
        sellerId: seller1.id,
        isApproved: true,
        views: 234,
      },
    }),
    prisma.artProduct.create({
      data: {
        title: "Botanical Rose Study",
        description:
          "Detailed botanical illustration of a heritage rose variety. Hand-painted with fine brushwork showing every petal and leaf detail.",
        price: 3200,
        category: ArtCategory.PAINTINGS,
        tags: ["botanical", "rose", "floral", "watercolor", "nature"],
        stock: 5,
        images: [
          "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800",
        ],
        sellerId: seller1.id,
        isApproved: true,
        views: 189,
      },
    }),
    prisma.artProduct.create({
      data: {
        title: "Cyberpunk City 2077",
        description:
          "Digital art poster featuring a neon-lit futuristic cityscape. High-resolution print-ready file included. Perfect for gaming room or modern office decor.",
        price: 1800,
        category: ArtCategory.DIGITAL_ART,
        tags: ["cyberpunk", "digital", "neon", "futuristic", "poster"],
        stock: 50,
        images: [
          "https://images.unsplash.com/photo-1563089145-599997674d42?w=800",
        ],
        sellerId: seller2.id,
        isApproved: true,
        views: 567,
      },
    }),
    prisma.artProduct.create({
      data: {
        title: "Fantasy Dragon Character",
        description:
          "Detailed concept art of a mythical dragon. Digital painting created in Procreate. Available as high-res download or framed print.",
        price: 2500,
        category: ArtCategory.DIGITAL_ART,
        tags: ["fantasy", "dragon", "concept-art", "character-design"],
        stock: 30,
        images: [
          "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800",
        ],
        sellerId: seller2.id,
        isApproved: true,
        views: 412,
      },
    }),
    prisma.artProduct.create({
      data: {
        title: "Bridal Mehndi Design Collection",
        description:
          "Complete bridal mehndi design template collection with 25+ patterns. Includes full hand, feet, and arm designs in traditional Rajasthani style.",
        price: 999,
        category: ArtCategory.MEHNDI_DESIGNS,
        tags: ["mehndi", "bridal", "henna", "rajasthani", "traditional"],
        stock: 100,
        images: [
          "https://images.unsplash.com/photo-1595854341625-f33e596aee59?w=800",
        ],
        sellerId: seller3.id,
        isApproved: true,
        views: 823,
      },
    }),
    prisma.artProduct.create({
      data: {
        title: "Portrait Pencil Sketch",
        description:
          "Custom portrait pencil sketch from your photo. Hyper-realistic style on premium sketch paper. Ships in a protective tube.",
        price: 5000,
        category: ArtCategory.SKETCHES,
        tags: ["portrait", "pencil", "sketch", "realistic", "custom"],
        stock: 10,
        images: [
          "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=800",
        ],
        sellerId: seller1.id,
        isApproved: true,
        views: 345,
      },
    }),
    prisma.artProduct.create({
      data: {
        title: "Premium Watercolor Set - 48 Colors",
        description:
          "Professional-grade watercolor paint set with 48 vibrant colors. Includes a wooden palette box, 3 brushes, and a mixing guide. Perfect for beginners and professionals.",
        price: 2999,
        category: ArtCategory.ART_MATERIALS,
        tags: ["watercolor", "paint-set", "art-supplies", "professional"],
        stock: 25,
        images: [
          "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800",
        ],
        sellerId: seller2.id,
        isApproved: true,
        views: 678,
      },
    }),
    prisma.artProduct.create({
      data: {
        title: "Glitter Lip Art Tutorial Set",
        description:
          "Complete lip art starter kit with 12 lip-safe glitter colors, precision brushes, setting spray, and video tutorial access. Create stunning festival-ready looks.",
        price: 1499,
        category: ArtCategory.LIP_ART,
        tags: ["lip-art", "glitter", "makeup", "festival", "kit"],
        stock: 40,
        images: [
          "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800",
        ],
        sellerId: seller3.id,
        isApproved: true,
        views: 290,
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products`);

  // ── Create Reviews ──
  await Promise.all([
    prisma.review.create({
      data: {
        productId: products[0].id,
        userId: buyer1.id,
        rating: 5,
        comment:
          "Absolutely stunning! The colors are even more vibrant in person. Priya is incredibly talented.",
      },
    }),
    prisma.review.create({
      data: {
        productId: products[0].id,
        userId: buyer2.id,
        rating: 4,
        comment:
          "Beautiful painting. Packaging was excellent and it arrived in perfect condition.",
      },
    }),
    prisma.review.create({
      data: {
        productId: products[2].id,
        userId: buyer1.id,
        rating: 5,
        comment:
          "The print quality is amazing! It looks incredible on my wall.",
      },
    }),
    prisma.review.create({
      data: {
        productId: products[4].id,
        userId: buyer2.id,
        rating: 5,
        comment:
          "These mehndi designs are gorgeous. Used them for my sister's wedding. Highly recommend!",
      },
    }),
    prisma.review.create({
      data: {
        productId: products[6].id,
        userId: buyer1.id,
        rating: 4,
        comment:
          "Great quality paints. The colors are rich and blend well. Would love more earthy tones.",
      },
    }),
  ]);

  console.log("✅ Created 5 reviews");

  // ── Create Follows ──
  await Promise.all([
    prisma.follow.create({
      data: { followerId: buyer1.id, followingId: seller1.id },
    }),
    prisma.follow.create({
      data: { followerId: buyer1.id, followingId: seller2.id },
    }),
    prisma.follow.create({
      data: { followerId: buyer2.id, followingId: seller1.id },
    }),
    prisma.follow.create({
      data: { followerId: buyer2.id, followingId: seller3.id },
    }),
    prisma.follow.create({
      data: { followerId: seller1.id, followingId: seller2.id },
    }),
  ]);

  console.log("✅ Created 5 follows");

  // ── Create Wishlist Items ──
  await Promise.all([
    prisma.wishlist.create({
      data: { userId: buyer1.id, productId: products[3].id },
    }),
    prisma.wishlist.create({
      data: { userId: buyer1.id, productId: products[5].id },
    }),
    prisma.wishlist.create({
      data: { userId: buyer2.id, productId: products[0].id },
    }),
    prisma.wishlist.create({
      data: { userId: buyer2.id, productId: products[2].id },
    }),
  ]);

  console.log("✅ Created 4 wishlist items");

  // ── Create a Community Group ──
  const group = await prisma.group.create({
    data: {
      name: "Watercolor Enthusiasts",
      description:
        "A community for watercolor painters to share tips, techniques, and inspiration.",
      type: "PUBLIC",
      creatorId: seller1.id,
      members: {
        create: [
          { userId: seller1.id, role: "ADMIN" },
          { userId: seller2.id, role: "MEMBER" },
          { userId: buyer1.id, role: "MEMBER" },
          { userId: buyer2.id, role: "MEMBER" },
        ],
      },
    },
  });

  console.log("✅ Created 1 community group with 4 members");

  // ── Summary ──
  console.log("\n═══════════════════════════════════════════════════");
  console.log("🎨 ArtVerse seed complete!");
  console.log("═══════════════════════════════════════════════════");
  console.log("\nTest accounts (password: Password@123):");
  console.log("  Admin:  admin@artverse.com");
  console.log("  Seller: priya@artverse.com");
  console.log("  Seller: arjun@artverse.com");
  console.log("  Seller: fatima@artverse.com");
  console.log("  Buyer:  rahul@artverse.com");
  console.log("  Buyer:  sneha@artverse.com");
  console.log("═══════════════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
