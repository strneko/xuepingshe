export async function seedShopModule(prisma) {
  const rows = [
    { name: "校园文创帆布袋", needPoints: 120, coverText: "帆布袋", stock: 99 },
    { name: "联名马克杯", needPoints: 180, coverText: "马克杯", stock: 64 },
    { name: "学评社限定徽章", needPoints: 80, coverText: "徽章", stock: 320 },
    { name: "无线鼠标", needPoints: 420, coverText: "无线鼠标", stock: 35 },
    { name: "便携保温杯", needPoints: 260, coverText: "保温杯", stock: 47 },
    { name: "机械键盘", needPoints: 680, coverText: "机械键盘", stock: 16 },
    { name: "课程资料礼包", needPoints: 300, coverText: "资料礼包", stock: null },
    { name: "降噪耳机", needPoints: 980, coverText: "降噪耳机", stock: 8 },
  ];

  for (const row of rows) {
    const existing = await prisma.shopProduct.findFirst({
      where: { name: row.name },
      select: { id: true },
    });

    if (existing) {
      await prisma.shopProduct.update({
        where: { id: existing.id },
        data: {
          needPoints: row.needPoints,
          coverText: row.coverText,
          stock: row.stock,
          isActive: true,
        },
      });
    } else {
      await prisma.shopProduct.create({
        data: {
          name: row.name,
          needPoints: row.needPoints,
          coverText: row.coverText,
          stock: row.stock,
          isActive: true,
        },
      });
    }
  }
}
