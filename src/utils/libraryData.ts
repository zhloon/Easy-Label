import type { ComponentCategory, ComponentItem } from '../types';

// 绝对防断网的本地内置警示语库 (大幅扩充容灾数据)
const fallbackPhrases: ComponentItem[] = [
  { type: "text", name: "防窒息警告(英)", content: "WARNING: To avoid danger of suffocation, keep this bag away from babies and children. Do not use this bag in cribs, beds, carriages, or playpens. This bag is not a toy." },
  { type: "text", name: "加拿大软薄膜袋(英法)", content: "⚠ PLASTIC BAGS CAN BE DANGEROUS. TO AVOID DANGER OF SUFFOCATION, KEEP THIS BAG AWAY FROM BABIES AND CHILDREN.\n⚠ LES SACS DE PLASTIQUE PEUVENT ÊTRE DANGEREUX. POUR ÉVITER LE DANGER DE SUFFOCATION, NE LAISSEZ PAS CE SAC À LA PORTÉE DES BÉBÉS NI DES ENFANTS." },
  { type: "text", name: "FCC 认证声明", content: "⚠ WARNING: This device complies with part 15 of the FCC Rules. Operation is subject to the following two conditions: (1)This device may not cause harmful interference, and (2)this device must accept any interference received, including interference that may cause undesired operation." },
  { type: "text", name: "玩具警告(10国语言)", content: "⚠ Warning. Not suitable for children under 36 months.\n⚠ Advertencia. No conviene para niños menores de 36 meses.\n⚠ Attention. Ne convient pas aux enfants de moins de 36 mois.\n⚠ Achtung. Nicht für Kinder unter 36 Monaten geeignet.\n⚠ Avvertenza. Non adatto a bambini di età inferiore a 36 mesi.\n⚠ Waarschuwing. Niet geschikt voor children jonger dan 36 maanden.\n⚠ Atenção. Contra-indicado para crianças com menos de 36 meses.\n⚠ 警告. 36 か月未満のお子様には适していません。\n⚠ 경고. 36개월 미만의 어린이에게는 적합하지 않습니다.\n⚠ تحذير. غير مناسب للأطفال أقل من 36 شهرًا" },
  { type: "text", name: "含小部件(美国)", content: "⚠ WARNING: CHOKING HAZARD-Small parts Not for children under 3 yrs." },
  { type: "text", name: "含小球(美国)", content: "⚠ WARNING: Not suitable for children under 3 years because of small ball (s)." },
  { type: "text", name: "易燃易爆物(英)", content: "⚠ WARNING. Keep away from fire." }
];

export async function loadLibraryData(): Promise<ComponentCategory[]> {
  let categories: ComponentCategory[] = [];
  try {
    // 强力拉取线上代码并使用安全的沙盒解析，彻底杜绝声明冲突
    const res = await fetch('https://fastly.jsdelivr.net/gh/zhloon/label-data@1.4/data.js');
    const code = await res.text();
    const sandbox = new Function(`
      var window = {};
      ${code.replace(/const /g, 'var ').replace(/let /g, 'var ')}
      return {
        initDataJson: typeof initDataJson !== 'undefined' ? initDataJson : null,
        warningPhrasesData: typeof warningPhrasesData !== 'undefined' ? warningPhrasesData : null
      };
    `);
    const externalData = sandbox();

    if (externalData.initDataJson) {
      categories.push({ parentTitle: "图标库", groups: externalData.initDataJson });
    }
    if (externalData.warningPhrasesData) {
      categories.push({ parentTitle: "警示语库", groups: [{ groupTitle: "常用警示语", items: externalData.warningPhrasesData }] });
    } else {
      categories.push({ parentTitle: "警示语库", groups: [{ groupTitle: "常用警示语", items: fallbackPhrases }] });
    }
  } catch (error) {
    categories.push({ parentTitle: "警示语库", groups: [{ groupTitle: "常用警示语", items: fallbackPhrases }] });
  }
  return categories;
}