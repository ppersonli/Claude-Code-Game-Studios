import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../../data/constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Loading bar
    const barW = 320;
    const barH = 30;
    const barX = (GAME_WIDTH - barW) / 2;
    const barY = GAME_HEIGHT / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1e3f, 1);
    bg.fillRoundedRect(barX - 5, barY - 5, barW + 10, barH + 10, 8);

    const bar = this.add.graphics();
    const text = this.add.text(GAME_WIDTH / 2, barY - 40, 'Loading...', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: COLORS.primary,
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0x00d4ff, 1);
      bar.fillRoundedRect(barX, barY, barW * value, barH, 6);
    });

    this.load.on('complete', () => {
      text.setText('Ready!');
    });

    // Load game assets
    const base = import.meta.env.BASE_URL || './';
    this.load.image('bg-menu', `${base}assets/bg-menu.webp`);
    this.load.image('bg-game', `${base}assets/bg-game.webp`);
    this.load.image('icon', `${base}assets/icon.webp`);

    // Planet images
    this.load.image('planet-earth', `${base}assets/space-factory-idle/planets/earth.webp`);
    this.load.image('planet-moon', `${base}assets/space-factory-idle/planets/moon.webp`);
    this.load.image('planet-mars', `${base}assets/space-factory-idle/planets/mars.webp`);
    this.load.image('planet-europa', `${base}assets/space-factory-idle/planets/jupiter.webp`);
    this.load.image('planet-titan', `${base}assets/space-factory-idle/planets/saturn.webp`);
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
