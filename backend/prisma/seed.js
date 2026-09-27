import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

// 15 customers, each with one order. Orders carry 2-3 items: one "target" item
// that exercises a specific policy branch, plus realistic filler items with no
// issue. Order dates are computed relative to "now" (not hardcoded) so the
// refund-window scenarios (#2, #13) stay valid no matter when this is run.
export const customers = [
  {
    name: "Ava Thompson",
    email: "ava.thompson@example.com",
    order: {
      daysAgo: 5,
      status: "delivered",
      items: [
        { sku: "EARBUDS-PRO", name: "Wireless Earbuds Pro", price: "89.99", listingCondition: "clearance", verifiedIssue: "none" },
        { sku: "CHARGE-CABLE", name: "Charging Cable", price: "12.99", listingCondition: "new", verifiedIssue: "none" },
        { sku: "CARRY-CASE", name: "Carrying Case", price: "12.00", listingCondition: "new", verifiedIssue: "none" },
      ],
    },
  },
  {
    name: "Marcus Chen",
    email: "marcus.chen@example.com",
    order: {
      daysAgo: 52,
      status: "delivered",
      items: [
        { sku: "DESK-STANDING", name: "Standing Desk", price: "349.00", listingCondition: "new", verifiedIssue: "none" },
        { sku: "CABLE-TRAY", name: "Cable Management Tray", price: "19.99", listingCondition: "new", verifiedIssue: "none" },
        { sku: "DESK-MAT", name: "Desk Mat", price: "24.99", listingCondition: "new", verifiedIssue: "none" },
      ],
    },
  },
  {
    name: "Priya Nair",
    email: "priya.nair@example.com",
    order: {
      daysAgo: 10,
      status: "delivered",
      items: [
        { sku: "TV-OLED-4K", name: "4K OLED TV", price: "1299.00", listingCondition: "new", verifiedIssue: "damaged_in_transit" },
        { sku: "WALL-MOUNT", name: "Wall Mount", price: "79.99", listingCondition: "new", verifiedIssue: "none" },
        { sku: "HDMI-2PK", name: "HDMI Cable 2-Pack", price: "14.99", listingCondition: "new", verifiedIssue: "none" },
      ],
    },
  },
  {
    name: "Diego Ramirez",
    email: "diego.ramirez@example.com",
    order: {
      daysAgo: 8,
      status: "delivered",
      items: [
        { sku: "SPEAKER-BT", name: "Bluetooth Speaker", price: "59.99", listingCondition: "new", verifiedIssue: "damaged_in_transit" },
        { sku: "SLEEVE-PROT", name: "Protective Sleeve", price: "9.99", listingCondition: "new", verifiedIssue: "none" },
      ],
    },
  },
  {
    name: "Sofia Mendes",
    email: "sofia.mendes@example.com",
    order: {
      daysAgo: 3,
      status: "delivered",
      items: [
        { sku: "YOGA-MAT", name: "Yoga Mat", price: "34.99", listingCondition: "new", verifiedIssue: "none" },
        { sku: "RESIST-BANDS", name: "Resistance Bands Set", price: "18.99", listingCondition: "new", verifiedIssue: "none" },
        { sku: "YOGA-BLOCK-2", name: "Yoga Block Pair", price: "15.99", listingCondition: "new", verifiedIssue: "none" },
      ],
    },
  },
  {
    name: "James O'Connor",
    email: "james.oconnor@example.com",
    order: {
      daysAgo: 12,
      status: "delivered",
      items: [
        { sku: "ESPRESSO-MACH", name: "Espresso Machine", price: "199.00", listingCondition: "new", verifiedIssue: "none" },
        { sku: "DESCALE-KIT", name: "Descaling Kit", price: "12.99", listingCondition: "new", verifiedIssue: "none" },
        { sku: "TAMPER-TOOL", name: "Tamper Tool", price: "9.99", listingCondition: "new", verifiedIssue: "none" },
      ],
    },
  },
  {
    name: "Grace Okafor",
    email: "grace.okafor@example.com",
    order: {
      daysAgo: 2,
      status: "delivered",
      items: [
        { sku: "PHONE-CASE", name: "Phone Case", price: "19.99", listingCondition: "new", verifiedIssue: "none" },
        { sku: "SCREEN-PROT-2", name: "Screen Protector 2-Pack", price: "9.99", listingCondition: "new", verifiedIssue: "none" },
      ],
    },
  },
  {
    name: "Liam Walsh",
    email: "liam.walsh@example.com",
    order: {
      daysAgo: 6,
      status: "delivered",
      items: [
        { sku: "KEYBOARD-MECH-WHT", name: "Mechanical Keyboard (White)", price: "129.00", listingCondition: "new", verifiedIssue: "wrong_item_shipped" },
        { sku: "WRIST-REST", name: "Wrist Rest", price: "14.99", listingCondition: "new", verifiedIssue: "none" },
        { sku: "KEYCAP-PULLER", name: "Keycap Puller", price: "4.99", listingCondition: "new", verifiedIssue: "none" },
      ],
    },
  },
  {
    name: "Hannah Kim",
    email: "hannah.kim@example.com",
    order: {
      daysAgo: 4,
      status: "delivered",
      items: [
        { sku: "SKINCARE-CLEANSER", name: "Cleanser", price: "25.00", listingCondition: "new", verifiedIssue: "none" },
        { sku: "SKINCARE-SERUM", name: "Serum", price: "30.00", listingCondition: "new", verifiedIssue: "none" },
        { sku: "SKINCARE-MOISTURIZER", name: "Moisturizer", price: "24.00", listingCondition: "new", verifiedIssue: "missing_item" },
      ],
    },
  },
  {
    name: "Noah Fischer",
    email: "noah.fischer@example.com",
    order: {
      daysAgo: 15,
      status: "delivered",
      items: [
        { sku: "LAPTOP-REFURB", name: "Refurbished Laptop", price: "449.00", listingCondition: "refurbished", verifiedIssue: "damaged_in_transit" },
        { sku: "LAPTOP-SLEEVE", name: "Laptop Sleeve", price: "19.99", listingCondition: "new", verifiedIssue: "none" },
        { sku: "MOUSE-WIRELESS", name: "Wireless Mouse", price: "22.99", listingCondition: "new", verifiedIssue: "none" },
      ],
    },
  },
  {
    name: "Ethan Brooks",
    email: "ethan.brooks@example.com",
    order: {
      daysAgo: 7,
      status: "delivered",
      items: [
        { sku: "BOOK-GRAPHIC-NOVEL", name: "Graphic Novel", price: "24.99", listingCondition: "new", verifiedIssue: "none" },
        { sku: "BOOKMARK-SET", name: "Bookmark Set", price: "6.99", listingCondition: "new", verifiedIssue: "none" },
      ],
    },
  },
  {
    name: "Isabella Rossi",
    email: "isabella.rossi@example.com",
    order: {
      daysAgo: 9,
      status: "delivered",
      items: [
        { sku: "COAT-WINTER", name: "Winter Coat", price: "220.00", listingCondition: "clearance", verifiedIssue: "none" },
        { sku: "SCARF-WOOL", name: "Wool Scarf", price: "45.00", listingCondition: "new", verifiedIssue: "damaged_in_transit" },
        { sku: "GLOVES-LEATHER", name: "Leather Gloves", price: "38.00", listingCondition: "new", verifiedIssue: "none" },
      ],
    },
  },
  {
    name: "Oliver Bennett",
    email: "oliver.bennett@example.com",
    order: {
      daysAgo: 30,
      status: "delivered",
      items: [
        { sku: "AIR-FRYER", name: "Air Fryer", price: "99.99", listingCondition: "new", verifiedIssue: "damaged_in_transit" },
        { sku: "RECIPE-BOOK", name: "Recipe Book", price: "14.99", listingCondition: "new", verifiedIssue: "none" },
        { sku: "SILICONE-LINERS", name: "Silicone Liners", price: "9.99", listingCondition: "new", verifiedIssue: "none" },
      ],
    },
  },
  {
    name: "Zara Ahmed",
    email: "zara.ahmed@example.com",
    order: {
      daysAgo: 5,
      status: "delivered",
      items: [
        { sku: "HANDBAG-DESIGNER", name: "Designer Handbag", price: "459.00", listingCondition: "new", verifiedIssue: "damaged_in_transit" },
        { sku: "WALLET-MATCHING", name: "Matching Wallet", price: "40.00", listingCondition: "new", verifiedIssue: "none" },
      ],
    },
  },
  {
    name: "Benjamin Turner",
    email: "benjamin.turner@example.com",
    order: {
      daysAgo: 5,
      status: "delivered",
      items: [
        { sku: "SOUNDBAR", name: "Soundbar", price: "470.00", listingCondition: "new", verifiedIssue: "damaged_in_transit" },
        { sku: "HDMI-CABLE", name: "HDMI Cable", price: "31.00", listingCondition: "new", verifiedIssue: "none" },
      ],
    },
  },
];

async function main() {
  console.log("Clearing existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.refundRequest.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();

  console.log(`Seeding ${customers.length} customers...`);
  for (const c of customers) {
    const total = c.order.items
      .reduce((sum, item) => sum + Number(item.price), 0)
      .toFixed(2);

    const customer = await prisma.customer.create({
      data: {
        name: c.name,
        email: c.email,
        orders: {
          create: [
            {
              orderDate: daysAgo(c.order.daysAgo),
              total,
              status: c.order.status,
              items: {
                create: c.order.items.map((item) => ({
                  sku: item.sku,
                  name: item.name,
                  price: item.price,
                  listingCondition: item.listingCondition,
                  verifiedIssue: item.verifiedIssue,
                })),
              },
            },
          ],
        },
      },
    });

    console.log(`  - ${customer.name} (${c.order.items.length} items, $${total})`);
  }

  console.log("Seed complete.");
}

// Guarded so importing this file for its data (e.g. seedCoverage.test.js)
// never runs the seed against a live database — only `node prisma/seed.js`
// (direct execution) does.
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main()
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
