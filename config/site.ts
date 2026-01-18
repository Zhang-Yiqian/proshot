/**
 * ProShot 站点配置
 */

export const siteConfig = {
  name: "ProShot 上镜",
  description: "电商智能商拍工具，让商品一键入画",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  
  // 积分配置
  credits: {
    initial: 5,        // 新用户初始积分
    previewCost: 0,    // 预览免费
    downloadCost: 1,   // 下载消耗1积分
  },
  
  // 生成模式
  modes: {
    clothing: {
      id: 'clothing',
      name: '服装上身',
      description: '将服装穿到真人模特身上',
      icon: 'Shirt',
      available: true,
    },
    product: {
      id: 'product', 
      name: '物品场景',
      description: '将物品放置到精美场景中',
      icon: 'Package',
      available: false, // 预留功能
    },
  },
}

export type GenerationMode = keyof typeof siteConfig.modes
