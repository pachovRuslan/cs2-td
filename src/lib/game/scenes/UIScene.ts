import Phaser from "phaser";

/**
 * UI Scene - РѕРІРµСЂР»РµР№ РїРѕРІРµСЂС… GameScene.
 * Р—Р°РїСѓСЃРєР°РµС‚СЃСЏ РїР°СЂР°Р»Р»РµР»СЊРЅРѕ С‡РµСЂРµР· scene.launch("UIScene") РёР· MenuScene.
 * Р’ Р‘Р»РѕРєРµ 3 вЂ” РїСѓСЃС‚Р°СЏ. Р‘СѓРґРµС‚ РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊСЃСЏ РїРѕР·Р¶Рµ РґР»СЏ РІСЃРїР»С‹РІР°СЋС‰РёС… "+$"
 */
export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });
  }

  create(): void {
    // РїРѕРєР° РїСѓСЃС‚Рѕ вЂ” UI СЂРµРЅРґРµСЂРёС‚СЃСЏ РІ React (HUD.tsx)
  }
}