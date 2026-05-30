/**
 * ============================================================
 * 延边州旅游客流预测大屏 — 主应用逻辑
 * ============================================================
 */

// ==================== 全局状态 ====================
const STATE = {
  activeCityId: null,
  map: null,
  markers: {},
  chart: null,
  dataCache: null,     // { cities, predictions, products, guides }
  debounceTimer: null
};

// ==================== 内置数据（离线备选） ====================
const EMBEDDED_DATA = {
  cities: [
    { city_id: 1, city_name: '延吉市', lon: 129.5088, lat: 42.8913,
      visitor_2025: 1160, visitor_2024: 1080, visitor_2023: 877.9, visitor_2022: 641, visitor_2021: 590.40 },
    { city_id: 2, city_name: '图们市', lon: 129.8439, lat: 42.9680,
      visitor_2025: 277, visitor_2024: 249, visitor_2023: 210, visitor_2022: 103.2, visitor_2021: null },
    { city_id: 3, city_name: '敦化市', lon: 128.2322, lat: 43.3728,
      visitor_2025: null, visitor_2024: 820.6, visitor_2023: 692, visitor_2022: 385, visitor_2021: null },
    { city_id: 4, city_name: '珲春市', lon: 130.3660, lat: 42.8625,
      visitor_2025: 1200, visitor_2024: 800.86, visitor_2023: 557.73, visitor_2022: 193.62, visitor_2021: 271 },
    { city_id: 5, city_name: '龙井市', lon: 129.4270, lat: 42.7663,
      visitor_2025: 456.37, visitor_2024: 496.34, visitor_2023: 478.25, visitor_2022: 188.56, visitor_2021: 204.53 },
    { city_id: 6, city_name: '和龙市', lon: 129.0108, lat: 42.5464,
      visitor_2025: null, visitor_2024: 744.3, visitor_2023: null, visitor_2022: 199, visitor_2021: 181 },
    { city_id: 7, city_name: '汪清县', lon: 129.7712, lat: 43.3128,
      visitor_2025: null, visitor_2024: 116, visitor_2023: 98.3, visitor_2022: 25, visitor_2021: 24 },
    { city_id: 8, city_name: '安图县', lon: 128.8997, lat: 43.1116,
      visitor_2025: 1038.4, visitor_2024: 890, visitor_2023: 767, visitor_2022: 367, visitor_2021: null },
    { city_id: 9, city_name: '长白山', lon: 128.0552, lat: 42.0348,
      visitor_2025: 409.73, visitor_2024: 339.84, visitor_2023: 274.81, visitor_2022: 149.28, visitor_2021: 301.67 }
  ],

  // 拟合参数（从 Python 模型运行后更新）
  modelParams: {
    1: { r: 0.2783, K: 2320.0, r2: 0.960, year80: 2030, hotness: 82.1 },
    2: { r: 0.4941, K: 546.7,  r2: 0.856, year80: 2028, hotness: 95.2 },
    3: { r: 0.4819, K: 1959.4, r2: 0.915, year80: 2028, hotness: 94.5 },
    4: { r: 0.4239, K: 2400.0, r2: 0.869, year80: 2030, hotness: 91.0 },
    5: { r: 0.3931, K: 912.7,  r2: 0.673, year80: 2028, hotness: 89.6 },
    6: { r: 0.4989, K: 2118.8, r2: 0.895, year80: 2029, hotness: 95.3 },
    7: { r: 0.5836, K: 335.9,  r2: 0.797, year80: 2028, hotness: 99.9 },
    8: { r: 0.4918, K: 2099.7, r2: 0.875, year80: 2028, hotness: 95.0 },
    9: { r: 0.0444, K: 797.7,  r2: 0.094, year80: null, hotness: 53.5 }
  },

  products: {
    1: [
      { name: '延吉冷面', desc: '朝鲜族传统冷面，荞麦面配冰镇牛肉汤', icon: '🍜' },
      { name: '延边辣白菜', desc: '朝鲜族传统泡菜，酸辣爽脆', icon: '🥬' },
      { name: '朝鲜族打糕', desc: '糯米捶打制成，口感Q弹', icon: '🍡' },
      { name: '延吉烤串', desc: '朝鲜族风味烤肉串', icon: '🍢', url: 'https://baike.baidu.com/item/%E7%83%A4%E4%B8%B2' }
    ],
    2: [
      { name: '图们江鱼', desc: '图们江野生江鱼，肉质鲜美', icon: '🐟', url: 'https://baike.baidu.com/item/%E5%9B%BE%E4%BB%AC%E6%B1%9F' },
      { name: '朝鲜族米肠', desc: '糯米灌制的传统米肠', icon: '🌭' },
      { name: '口岸纪念品', desc: '中朝边境特色纪念品', icon: '🎁', url: 'https://baike.baidu.com/item/%E5%9B%BE%E4%BB%AC%E5%8F%A3%E5%B2%B8' }
    ],
    3: [
      { name: '敦化煎饼', desc: '传统手工摊制煎饼', icon: '🥞' },
      { name: '人参制品', desc: '长白山人参系列产品', icon: '🌿', url: 'https://baike.baidu.com/item/%E4%BA%BA%E5%8F%82' },
      { name: '六鼎山素斋', desc: '佛家素斋食品', icon: '🥗', url: 'https://baike.baidu.com/item/%E5%BB%B6%E8%BE%B9%E6%9C%9D%E9%B2%9C%E6%97%8F%E8%87%AA%E6%B2%BB%E5%B7%9E%E5%85%AD%E9%BC%8E%E5%B1%B1%E6%96%87%E5%8C%96%E6%97%85%E6%B8%B8%E5%8C%BA' },
      { name: '敦化小粒黄', desc: '传统发酵大豆酱', icon: '🫘', url: 'https://baike.baidu.com/item/%E5%B0%8F%E7%B2%92%E9%BB%84' }
    ],
    4: [
      { name: '俄罗斯商品', desc: '珲春口岸进口食品与工艺品', icon: '🎪', url: 'https://baike.baidu.com/item/%E4%BF%84%E7%BD%97%E6%96%AF' },
      { name: '珲春海鲜', desc: '日本海新鲜海产品', icon: '🦀', url: 'https://www.jl.gov.cn/yaowen/202508/t20250811_3488815.html' },
      { name: '朝鲜族服饰', desc: '传统韩服租赁与定制', icon: '👗' },
      { name: '防川纪念币', desc: '一眼望三国主题纪念币', icon: '🪙', url: 'https://baike.baidu.com/item/%E9%98%B2%E5%B7%9D%E9%A3%8E%E6%99%AF%E5%90%8D%E8%83%9C%E5%8C%BA' }
    ],
    5: [
      { name: '龙井苹果梨', desc: '延边特产水果，甘甜多汁', icon: '🍐' },
      { name: '琵岩山特产', desc: '琵岩山景区周边特产', icon: '⛰️', url: 'https://baike.baidu.com/item/%E7%90%B5%E5%B2%A9%E5%B1%B1%E9%A3%8E%E6%99%AF%E5%8C%BA' },
      { name: '龙井大米', desc: '海兰江流域优质大米', icon: '🍚', url: 'https://baike.baidu.com/item/%E5%BB%B6%E8%BE%B9%E5%A4%A7%E7%B1%B3' }
    ],
    6: [
      { name: '和龙松茸', desc: '长白山野生松茸', icon: '🍄', url: 'https://baike.baidu.com/item/%E6%9D%BE%E8%8C%B8%E8%8F%8C' },
      { name: '光东村大米', desc: '有机大米', icon: '🌾', url: 'https://baike.baidu.com/item/%E5%85%89%E4%B8%9C%E6%9D%91' },
      { name: '和龙黑木耳', desc: '长白山林区天然黑木耳', icon: '🪸', url: 'https://baike.baidu.com/item/%E9%BB%91%E6%9C%A8%E8%80%B3' }
    ],
    7: [
      { name: '汪清黑木耳', desc: '国家地理标志产品', icon: '🪸' },
      { name: '汪清松子', desc: '长白山红松松子', icon: '🥜', url: 'https://baike.baidu.com/item/%E6%9D%BE%E5%AD%90' },
      { name: '汪清山野菜', desc: '野生蕨菜、刺嫩芽', icon: '🥬', url: 'http://www.wangqing.gov.cn/xwzx/wqyw/202407/t20240719_463118.html' }
    ],
    8: [
      { name: '安图矿泉水', desc: '长白山天然矿泉水', icon: '💧', url: 'https://baike.baidu.com/item/%E5%AE%89%E5%9B%BE%E9%95%BF%E7%99%BD%E5%B1%B1%E5%A4%A9%E7%84%B6%E7%9F%BF%E6%B3%89%E6%B0%B4%E4%BA%A7%E4%B8%9A%E5%9B%AD%E5%8C%BA' },
      { name: '安图蓝莓', desc: '长白山野生蓝莓', icon: '🫐', url: 'http://www.antu.gov.cn/xq/cyat/attc/syl/201912/t20191203_24602.html' },
      { name: '安图林蛙油', desc: '长白山林蛙提取物', icon: '🧪', url: 'http://www.antu.gov.cn/xq/cyat/attc/yyl/201912/t20191203_24614.html' },
      { name: '安图蜂蜜', desc: '椴树蜜，东北特产', icon: '🍯', url: 'http://www.antu.gov.cn/xq/cyat/attc/syl/201912/t20191203_24612.html' }
    ],
    9: [
      { name: '长白山人参', desc: '野山参及制品', icon: '🌿' },
      { name: '长白山鹿茸', desc: '梅花鹿茸制品', icon: '🦌' },
      { name: '长白山灵芝', desc: '野生灵芝孢子粉', icon: '🍄' },
      { name: '温泉鸡蛋', desc: '长白山温泉煮鸡蛋', icon: '🥚' }
    ]
  },

  competition: {
    1: { partners: [2,5,6], rivals: [4,8], neutral: [3,7,9] },
    2: { partners: [7], rivals: [], neutral: [1,3,4,5,6,8,9] },
    3: { partners: [5,8], rivals: [], neutral: [1,2,4,6,7,9] },
    4: { partners: [], rivals: [1,8], neutral: [2,3,5,6,7,9] },
    5: { partners: [1,3,6], rivals: [], neutral: [2,4,7,8,9] },
    6: { partners: [1,5], rivals: [], neutral: [2,3,4,7,8,9] },
    7: { partners: [2], rivals: [], neutral: [1,3,4,5,6,8,9] },
    8: { partners: [3,9], rivals: [1,4], neutral: [2,5,6,7] },
    9: { partners: [8], rivals: [], neutral: [1,2,3,4,5,6,7] }
  },

  guides: {
    1: {
      title: '延吉市 · 朝鲜族风情之都',
      transport: '🚄 延吉西站高铁直达，长春出发约2.5小时；市内公交/打车便捷',
      route: 'D1：中国朝鲜族民俗园→延大网红墙→水上市场；D2：帽儿山恐龙王国→延吉博物馆→西市场',
      tips: '💡 民俗园下午光线好，适合旅拍；水上市场早市9点前最佳；冷面推荐服务大楼'
    },
    2: {
      title: '图们市 · 边境口岸之城',
      transport: '🚄 延吉西→图们北，高铁约20分钟',
      route: 'D1：图们口岸国门→日光山森林公园→图们江边步道；D2：百年部落→月晴镇朝鲜族民俗村',
      tips: '💡 口岸景区需携带身份证；日光山观景台可远眺朝鲜；建议搭配延吉一日往返'
    },
    3: {
      title: '敦化市 · 六鼎山佛国圣地',
      transport: '🚄 敦化站高铁直达，长春/延吉均有车次',
      route: 'D1：六鼎山文化旅游区→金鼎大佛→正觉寺；D2：雁鸣湖湿地→渤海广场→敖东古城',
      tips: '💡 六鼎山建议上午去光线好；金鼎大佛是世界最高释迦牟尼坐佛；秋季红叶极美'
    },
    4: {
      title: '珲春市 · 一眼望三国',
      transport: '🚄 延吉西→珲春，高铁约40分钟',
      route: 'D1：防川风景区→龙虎阁→土字牌→圈河口岸；D2：珲春海鲜街→俄罗斯商品街',
      tips: '💡 防川距珲春市区约70公里，建议自驾或包车；海鲜推荐帝王蟹和板蟹；可顺便购买俄罗斯商品'
    },
    5: {
      title: '龙井市 · 苹果梨之乡',
      transport: '🚄 延吉→龙井，客车约40分钟',
      route: 'D1：琵岩山文化旅游风景区→海兰江民俗园；D2：龙井苹果梨采摘园→尹东柱故居',
      tips: '💡 9-10月苹果梨采摘季最佳；琵岩山彩虹滑道适合亲子；距延吉市区仅20分钟车程'
    },
    6: {
      title: '和龙市 · 仙峰雪韵',
      transport: '🚗 延吉自驾/包车约1.5小时',
      route: 'D1：光东村朝鲜族民俗村→仙峰国家森林公园；D2：老里克湖→千年红豆杉',
      tips: '💡 冬季老里克湖雪景绝美；光东村可体验朝鲜族民宿和辣白菜制作；松茸8-9月为采集季'
    },
    7: {
      title: '汪清县 · 红色记忆',
      transport: '🚗 延吉自驾约1小时',
      route: 'D1：满天星国家森林公园→汪清红色教育基地；D2：屏风山→汪清黑木耳基地',
      tips: '💡 满天星秋季红叶极佳；黑木耳基地可参观采摘；红色教育基地适合研学旅行'
    },
    8: {
      title: '安图县 · 长白山门户',
      transport: '🚄 敦化/延吉乘车至二道白河镇',
      route: 'D1：大关东文化园→峡谷浮石林→奶头山村；D2：长白山北坡→天池→瀑布→绿渊潭',
      tips: '💡 登天池需提前预约；7-8月最佳观赏期；二道白河镇住宿选择多；温泉煮鸡蛋别错过'
    },
    9: {
      title: '长白山 · 东北屋脊',
      transport: '✈️ 长白山机场；🚄 敦化/安图转乘至二道白河',
      route: 'D1：北坡→天池→长白瀑布→聚龙温泉→绿渊潭；D2：西坡→高山花园→锦江大峡谷',
      tips: '💡 天池开放受天气影响，提前查预报；门票需微信预约；夏季带薄外套，山顶温差大'
    }
  }
};

// ==================== 数据加载 ====================
async function loadData() {
  // 尝试从外部加载模型预测数据
  try {
    const resp = await fetch('../data/predictions.json');
    if (resp.ok) {
      const pred = await resp.json();
      // 用预测数据更新模型参数
      pred.cities.forEach(c => {
        if (EMBEDDED_DATA.modelParams[c.city_id]) {
          EMBEDDED_DATA.modelParams[c.city_id] = {
            r: c.r,
            K: c.K,
            r2: c.r_squared,
            year80: c.year80,
            predicted: c.predicted,
            fitted: c.fitted,
            hotness: c.hotness
          };
        }
      });
      console.log('✅ 预测数据加载成功');
    }
  } catch(e) {
    console.log('ℹ️ 使用内置模型参数（预测数据文件未就绪）');
  }

  // 尝试加载产品/攻略JSON
  try {
    const [prodResp, guideResp] = await Promise.all([
      fetch('../data/products.json'),
      fetch('../data/guides.json')
    ]);
    if (prodResp.ok) {
      const prod = await prodResp.json();
      EMBEDDED_DATA.products = prod.products;
    }
    if (guideResp.ok) {
      const guide = await guideResp.json();
      EMBEDDED_DATA.guides = guide.guides;
    }
  } catch(e) {
    console.log('ℹ️ 使用内置产品/攻略数据');
  }

  STATE.dataCache = EMBEDDED_DATA;
  return EMBEDDED_DATA;
}

// ==================== 地图初始化 ====================
async function initMap() {
  const data = STATE.dataCache || await loadData();

  try {
    // 尝试使用高德地图
    STATE.map = new AMap.Map('mapContainer', {
      center: [129.0, 42.8],
      zoom: 9,
      mapStyle: 'amap://styles/light',
      resizeEnable: true
    });

    // 添加标记和文字标签
    data.cities.forEach(city => {
      const marker = createMarker(city);
      STATE.markers[city.city_id] = marker;
      STATE.map.add(marker);

      // 在标记上方显示地名
      const label = createLabel(city);
      STATE.map.add(label);
    });

    console.log('✅ 高德地图初始化成功');
  } catch(e) {
    console.warn('⚠️ 高德地图加载失败，使用Leaflet备选地图');
    initLeafletFallback(data);
  }

  // 更新底部统计栏
  updateMapStats(data);
}

function initLeafletFallback(data) {
  console.log('请在 index.html 中替换 YOUR_AMAP_KEY 为高德地图Key');
  // 简易备选：显示静态点位列表
  const container = document.getElementById('mapContainer');
  container.innerHTML = `
    <div style="padding:40px;text-align:center;background:linear-gradient(135deg,#E8F0FE,#F5F8FC);height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <div style="font-size:48px;margin-bottom:16px;">🗺️</div>
      <h3 style="color:#1A3C6D;margin-bottom:8px;">延边州旅游客流监测</h3>
      <p style="color:#8A8FB0;margin-bottom:24px;">请配置高德地图 API Key 以启用交互地图</p>
      <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:500px;">
        ${data.cities.map(c => `
          <button onclick="selectCity(${c.city_id})"
            style="padding:8px 16px;background:#FFF;border:1px solid #DA251D;border-radius:20px;cursor:pointer;font-size:13px;color:#1A3C6D;font-weight:600;transition:all 0.2s;"
            onmouseover="this.style.background='#DA251D';this.style.color='#FFF';"
            onmouseout="this.style.background='#FFF';this.style.color='#1A3C6D';">
            📍 ${c.city_name}
          </button>
        `).join('')}
      </div>
    </div>`;
}

function createMarker(city) {
  // 根据游客量决定标记大小和颜色
  const v = city.visitor_2025;
  let color, size;
  if (v >= 800) { color = '#DA251D'; size = 36; }
  else if (v >= 400) { color = '#E8751A'; size = 30; }
  else if (v >= 200) { color = '#F0B90B'; size = 26; }
  else if (v >= 100) { color = '#3B9C5C'; size = 22; }
  else { color = '#2E75B6'; size = 20; }

  const markerContent = `
    <div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:3px solid #FFF;
      border-radius:50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      font-size:${size*0.35}px;font-weight:700;color:#FFF;
      cursor:pointer;
      transition: transform 0.2s;
    ">${city.visitor_2025 >= 500 ? '★' : '●'}</div>`;

  const marker = new AMap.Marker({
    position: [city.lon, city.lat],
    content: markerContent,
    offset: new AMap.Pixel(-size/2, -size/2),
    title: city.city_name,
    zIndex: 10
  });

  marker.on('click', () => selectCity(city.city_id));

  return marker;
}

function createLabel(city) {
  const v = city.visitor_2025;
  let color;
  if (v >= 800) color = '#DA251D';
  else if (v >= 400) color = '#E8751A';
  else if (v >= 200) color = '#C49B30';
  else if (v >= 100) color = '#3B9C5C';
  else color = '#2E75B6';

  const label = new AMap.Text({
    position: [city.lon, city.lat],
    text: city.city_name,
    offset: new AMap.Pixel(-30, -38),
    style: {
      'font-size': '12px',
      'font-weight': '700',
      'color': color,
      'background-color': 'rgba(255,255,255,0.85)',
      'padding': '2px 6px',
      'border-radius': '3px',
      'font-family': 'PingFang SC, Microsoft YaHei, SimHei, sans-serif',
      'white-space': 'nowrap',
      'text-shadow': '0 0 2px #FFF'
    },
    zIndex: 5
  });

  return label;
}

// ==================== 城市选择 ====================
function selectCity(cityId) {
  // 防抖
  if (STATE.debounceTimer) clearTimeout(STATE.debounceTimer);
  STATE.debounceTimer = setTimeout(() => {
    STATE.activeCityId = cityId;
    updateAllPanels(cityId);
    highlightMarker(cityId);
  }, 150);
}

function highlightMarker(cityId) {
  // 重置所有标记
  Object.values(STATE.markers).forEach(m => {
    const el = m.getContent();
    if (el.includes('3px solid #FFD700')) {
      m.setContent(el.replace('3px solid #FFD700', '3px solid #FFF'));
    }
  });

  // 高亮选中标记
  const marker = STATE.markers[cityId];
  if (marker) {
    const el = marker.getContent();
    marker.setContent(el.replace('3px solid #FFF', '3px solid #FFD700'));
  }
}

// ==================== 更新左栏 ====================
function updateLeftPanel(cityId) {
  const data = STATE.dataCache;
  const city = data.cities.find(c => c.city_id === cityId);
  if (!city) return;

  // 更新标签
  document.getElementById('leftCityLabel').textContent = city.city_name;
  document.getElementById('leftCityLabel').classList.add('active');

  // 城市信息卡片
  const infoCard = document.getElementById('cityInfoCard');
  infoCard.className = 'info-card active';
  infoCard.innerHTML = `
    <div class="city-title">📍 ${city.city_name}</div>
    <div class="city-stats-row">
      <div class="city-stat">2025年游客<br/><strong>${city.visitor_2025 ? city.visitor_2025+'wan' : '暂无数据'}</strong></div>
      <div class="city-stat">较2024年<br/><strong>${(city.visitor_2025 && city.visitor_2024) ? ((city.visitor_2025/city.visitor_2024-1)*100).toFixed(1)+'%' : '--'}</strong></div>
      <div class="city-stat">较2021年<br/><strong>${(city.visitor_2025 && city.visitor_2021) ? ((city.visitor_2025/city.visitor_2021-1)*100).toFixed(1)+'%' : '--'}</strong></div>
    </div>
  `;

  // 特色商品
  const products = data.products[cityId] || [];
  const productGrid = document.getElementById('productGrid');
  if (products.length > 0) {
    productGrid.innerHTML = products.map(p => {
      var linkUrl = p.url || ('https://baike.baidu.com/item/' + encodeURIComponent(p.name));
      return `
      <div class="product-item" onclick="window.open('${linkUrl}', '_blank')" title="点击查看「${p.name}」详情">
        <span class="product-icon">${p.icon || '📦'}</span>
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-desc">${p.desc}</div>
        </div>
        <span class="product-arrow">🔗</span>
      </div>
    `;}).join('');
  } else {
    productGrid.innerHTML = '<div class="product-empty">暂无特色商品数据</div>';
  }

  // 竞争关系
  const comp = data.competition[cityId];
  const competitionList = document.getElementById('competitionList');
  if (comp) {
    const nameMap = {};
    data.cities.forEach(c => { nameMap[c.city_id] = c.city_name; });

    let html = '';
    if (comp.rivals.length > 0) {
      html += comp.rivals.map(id => `
        <div class="competition-item">
          <span class="comp-name">🔴 ${nameMap[id]}</span>
          <span class="comp-type rival">竞争</span>
        </div>
      `).join('');
    }
    if (comp.partners.length > 0) {
      html += comp.partners.map(id => `
        <div class="competition-item">
          <span class="comp-name">🟢 ${nameMap[id]}</span>
          <span class="comp-type friend">协同</span>
        </div>
      `).join('');
    }
    if (comp.neutral.length > 0) {
      html += comp.neutral.map(id => `
        <div class="competition-item">
          <span class="comp-name">🔵 ${nameMap[id]}</span>
          <span class="comp-type neutral">中性</span>
        </div>
      `).join('');
    }
    competitionList.innerHTML = html;
  } else {
    competitionList.innerHTML = '<div class="product-empty">暂无竞争分析数据</div>';
  }
}

// ==================== 更新右栏 ====================
function updateRightPanel(cityId) {
  const data = STATE.dataCache;
  const city = data.cities.find(c => c.city_id === cityId);
  const params = data.modelParams[cityId];
  if (!city || !params) return;

  // 更新标签
  document.getElementById('rightCityLabel').textContent = city.city_name;
  document.getElementById('rightCityLabel').classList.add('active');

  // 更新图表
  renderPredictionChart(city, params);

  // 更新统计卡片
  document.getElementById('statK').textContent = params.K.toFixed(0) + '万';
  document.getElementById('statR').textContent = params.r.toFixed(3);
  document.getElementById('statYear').textContent = params.year80 || '--';
  document.getElementById('statHotness').textContent =
    (params.hotness || computeHotness(city, params)).toFixed(1);

  // 更新攻略
  const guide = data.guides[cityId];
  const guideCard = document.getElementById('guideCard');
  if (guide) {
    guideCard.innerHTML = `
      <div class="guide-title">${guide.title || city.city_name + '旅游攻略'}</div>
      <div class="guide-section"><strong>交通：</strong>${guide.transport}</div>
      <div class="guide-section"><strong>路线：</strong>${guide.route}</div>
      <div class="guide-section"><strong>贴士：</strong>${guide.tips}</div>
    `;
  } else {
    guideCard.innerHTML = '<div class="product-empty">暂无攻略数据</div>';
  }
}

// ==================== Runge-Kutta 求解器 ====================
function getRKParams(cityId) {
  var data = STATE.dataCache;
  // r, K for all cities
  var rVec = [], KVec = [], N0Vec = [];
  for (var i = 1; i <= 9; i++) {
    var p = data.modelParams[i];
    rVec.push(p.r);
    KVec.push(p.K);
    var c = data.cities.find(function(x){return x.city_id===i;});
    N0Vec.push(c.visitor_2021 || c.visitor_2022 || 1);
  }
  // Default competition alpha (spatial decay model)
  var alphaBase = 0.08, lambda = 80;
  var coords = {
    1:[129.5088,42.8913],2:[129.8439,42.9680],3:[128.2322,43.3728],
    4:[130.3660,42.8625],5:[129.4270,42.7663],6:[129.0108,42.5464],
    7:[129.7712,43.3128],8:[128.8997,43.1116],9:[128.0552,42.0348]
  };
  function haversine(lon1,lat1,lon2,lat2){
    var R=6371,dlon=(lon2-lon1)*Math.PI/180,dlat=(lat2-lat1)*Math.PI/180;
    var a=Math.sin(dlat/2)*Math.sin(dlat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dlon/2)*Math.sin(dlon/2);
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  }
  var alpha = [];
  for (var i=0;i<9;i++){alpha[i]=[];for(var j=0;j<9;j++)alpha[i][j]=0;}
  for (var i=1;i<=9;i++){
    for (var j=1;j<=9;j++){
      if(i!==j){
        var d=haversine(coords[i][0],coords[i][1],coords[j][0],coords[j][1]);
        alpha[i-1][j-1]=alphaBase*Math.exp(-d/lambda);
      }
    }
  }
  return {rVec:rVec, KVec:KVec, N0:N0Vec, alpha:alpha};
}

function competitionODE(t, N, rVec, KVec, alpha) {
  var dNdt = new Array(9).fill(0);
  for (var i=0;i<9;i++){
    var comp=0;
    for (var j=0;j<9;j++){
      if(i!==j) comp+=alpha[i][j]*N[j];
    }
    dNdt[i]=rVec[i]*N[i]*(1-(N[i]+comp)/KVec[i]);
  }
  return dNdt;
}

function rkStep(method, t, N, h, rVec, KVec, alpha) {
  // method: 1=Euler, 2=Midpoint, 3=Kutta3, 4=RK4
  var f=competitionODE;
  var k1,k2,k3,k4,dN=new Array(9);

  if(method===1){ // Euler
    k1=f(t,N,rVec,KVec,alpha);
    for(var i=0;i<9;i++) dN[i]=N[i]+h*k1[i];
  }else if(method===2){ // Midpoint (RK2)
    k1=f(t,N,rVec,KVec,alpha);
    var Nmid=new Array(9);
    for(var i=0;i<9;i++) Nmid[i]=N[i]+0.5*h*k1[i];
    k2=f(t+0.5*h,Nmid,rVec,KVec,alpha);
    for(var i=0;i<9;i++) dN[i]=N[i]+h*k2[i];
  }else if(method===3){ // Kutta3
    k1=f(t,N,rVec,KVec,alpha);
    var N2=new Array(9);
    for(var i=0;i<9;i++) N2[i]=N[i]+0.5*h*k1[i];
    k2=f(t+0.5*h,N2,rVec,KVec,alpha);
    var N3=new Array(9);
    for(var i=0;i<9;i++) N3[i]=N[i]-h*k1[i]+2*h*k2[i];
    k3=f(t+h,N3,rVec,KVec,alpha);
    for(var i=0;i<9;i++) dN[i]=N[i]+(h/6)*(k1[i]+4*k2[i]+k3[i]);
  }else{ // RK4
    k1=f(t,N,rVec,KVec,alpha);
    var Nk2=new Array(9);
    for(var i=0;i<9;i++) Nk2[i]=N[i]+0.5*h*k1[i];
    k2=f(t+0.5*h,Nk2,rVec,KVec,alpha);
    var Nk3=new Array(9);
    for(var i=0;i<9;i++) Nk3[i]=N[i]+0.5*h*k2[i];
    k3=f(t+0.5*h,Nk3,rVec,KVec,alpha);
    var Nk4=new Array(9);
    for(var i=0;i<9;i++) Nk4[i]=N[i]+h*k3[i];
    k4=f(t+h,Nk4,rVec,KVec,alpha);
    for(var i=0;i<9;i++) dN[i]=N[i]+(h/6)*(k1[i]+2*k2[i]+2*k3[i]+k4[i]);
  }
  return dN;
}

function rkSolve(method, hMonths) {
  // hMonths: step size in months, converted to years
  var h = hMonths / 12.0;
  var p = getRKParams(1);
  var rVec=p.rVec, KVec=p.KVec, N0=p.N0, alpha=p.alpha;

  var N = N0.slice();
  var t = 2021.0;
  var tEnd = 2035.0;
  var results = [];
  // Record yearly snapshots
  var nextRecordYear = 2021;
  results.push({t:2021, N:N.slice()});

  while (t < tEnd - 1e-10) {
    N = rkStep(method, t, N, h, rVec, KVec, alpha);
    t += h;
    if (t >= nextRecordYear + 1 - 1e-10) {
      nextRecordYear = Math.floor(t);
      results.push({t: nextRecordYear, N: N.slice()});
    }
  }
  return results; // [{t:year, N:[9 values]}, ...]
}

// ==================== 预测图表 ====================
function renderPredictionChart(city, params) {
  const container = document.getElementById('chartContainer');
  container.innerHTML = '';

  const chartDom = document.createElement('div');
  chartDom.style.width = '100%';
  chartDom.style.height = '100%';
  container.appendChild(chartDom);

  if (STATE.chart) STATE.chart.dispose();

  STATE.chart = echarts.init(chartDom);

  // 历史年份
  var histYears = [2021,2022,2023,2024,2025];
  var histData = [city.visitor_2021, city.visitor_2022, city.visitor_2023, city.visitor_2024, city.visitor_2025];

  // 获取当前RK设置
  var orderEl=document.getElementById('rkOrder');
  var stepEl=document.getElementById('rkStep');
  var method=orderEl?parseInt(orderEl.value):4;
  var hMonths=stepEl?parseFloat(stepEl.value):1;

  // 用RK求解器生成预测
  var rkResults=rkSolve(method, hMonths);
  var cityIdx=city.city_id-1;

  var predYears=[];
  var predData=[];
  for(var i=0;i<rkResults.length;i++){
    predYears.push(rkResults[i].t);
    predData.push(rkResults[i].N[cityIdx]);
  }

  var K=params.K;
  var r=params.r;
  var methodNames={1:'Euler',2:'RK2中点',3:'RK3 Kutta',4:'RK4'};
  var methodName=methodNames[method]||'RK4';
  var stepLabel=hMonths+'月步长';
  var seriesLabel='RK预测';

  var option = {
    tooltip: {
      trigger: 'axis',
      confine: false,
      extraCssText: 'max-width:220px;white-space:normal;z-index:999;',
      formatter: function(ps) {
        var html = '<strong>' + ps[0].axisValue + '年</strong><br/>';
        var items = [];
        for (var i = 0; i < ps.length; i++) {
          if (ps[i].value !== undefined && ps[i].value !== null) {
            items.push(ps[i].marker + ' ' + ps[i].seriesName + '<br/>' +
                       '&nbsp;&nbsp;&nbsp;&nbsp;<strong>' + ps[i].value.toFixed(1) + '</strong> 万人次');
          }
        }
        return html + items.join('<br/><br/>');
      }
    },
    legend: {
      data: [seriesLabel, '环境容量 K'],
      orient: 'vertical',
      right: 10,
      top: 5,
      textStyle: { fontSize: 11, color: '#5A5F7A' }
    },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: predYears.map(String),
      axisLabel: { fontSize: 10, color: '#8A8FB0' },
      axisLine: { lineStyle: { color: '#E2E5ED' } }
    },
    yAxis: {
      type: 'value',
      name: '万人次',
      axisLabel: { fontSize: 10, color: '#8A8FB0' },
      splitLine: { lineStyle: { color: '#F0F2F5' } }
    },
    series: [
      {
        name: seriesLabel,
        type: 'line',
        data: predData,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2.5, color: '#2E75B6' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0,0,0,1,[
            { offset: 0, color: 'rgba(46,117,182,0.15)' },
            { offset: 1, color: 'rgba(46,117,182,0.02)' }
          ])
        }
      },
      {
        name: '环境容量 K',
        type: 'line',
        data: predYears.map(() => K),
        symbol: 'none',
        lineStyle: { width: 1.5, color: '#C49B30', type: 'dashed' }
      }
    ]
  };

  STATE.chart.setOption(option);

  // 响应式
  window.addEventListener('resize', () => {
    if (STATE.chart) STATE.chart.resize();
  });
}

// ==================== 热度计算 ====================
function computeHotness(city, params) {
  const N = city.visitor_2025;
  const K = params.K;
  const r = params.r;
  const maxR = 0.45; // 所有城市中预估的最大增长率

  const saturation = N / K;
  const growthScore = r / maxR;
  const competitionScore = 0.9; // 默认低竞争压力

  return Math.min(100, Math.max(0,
    40 * saturation + 30 * growthScore + 30 * competitionScore
  ));
}

// ==================== 更新底部统计栏 ====================
function updateMapStats(data) {
  const total2025 = data.cities.reduce((sum, c) => sum + c.visitor_2025, 0);
  const total2024 = data.cities.reduce((sum, c) => sum + c.visitor_2024, 0);
  const growth = ((total2025 / total2024 - 1) * 100).toFixed(1);

  // 找热度最高的
  let hottest = null;
  let maxHot = -1;
  data.cities.forEach(c => {
    const p = data.modelParams[c.city_id];
    if (p) {
      const h = p.hotness || computeHotness(c, p);
      if (h > maxHot) { maxHot = h; hottest = c; }
    }
  });

  document.getElementById('statTotal2025').textContent = total2025.toFixed(0);
  document.getElementById('statGrowth').textContent = growth + '%';
  document.getElementById('statHottest').textContent = hottest ? hottest.city_name : '--';
}

// ==================== 更新所有面板 ====================
function updateAllPanels(cityId) {
  updateLeftPanel(cityId);
  updateRightPanel(cityId);
}

// ==================== 启动 ====================
async function main() {
  // 加载数据
  const data = await loadData();

  // 初始化地图
  await initMap();

  // 默认选中延吉市
  setTimeout(() => selectCity(1), 500);

  // RK控件事件：切换阶数或步长时重新渲染图表
  ['rkOrder','rkStep'].forEach(function(id){
    var el=document.getElementById(id);
    if(el) el.addEventListener('change',function(){
      if(STATE.activeCityId) updateAllPanels(STATE.activeCityId);
    });
  });

  console.log('🚀 延边州旅游客流预测大屏已就绪');
  console.log(`   ${data.cities.length} 个地点已加载`);
  console.log('   点击地图标记或下方按钮选择市/县');
}

// 暴露到全局作用域
window.selectCity = selectCity;

// DOM就绪后启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
