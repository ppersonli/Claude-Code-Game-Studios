import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../../data/constants';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Background
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-menu')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    // Title
    this.add.text(GAME_WIDTH / 2, 180, 'SPACE FACTORY', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '42px',
      color: COLORS.primary,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 230, 'I D L E', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: COLORS.accent,
      letterSpacing: 20,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.graphics();
    const btnX = GAME_WIDTH / 2 - 100;
    const btnY = 400;
    playBtn.fillStyle(0x00d4ff, 1);
    playBtn.fillRoundedRect(btnX, btnY, 200, 60, 12);
    playBtn.lineStyle(3, 0x00aacc, 1);
    playBtn.strokeRoundedRect(btnX, btnY, 200, 60, 12);

    const playText = this.add.text(GAME_WIDTH / 2, btnY + 30, '▶  PLAY', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Make button interactive
    const hitArea = this.add.zone(GAME_WIDTH / 2, btnY + 30, 200, 60).setInteractive();
    hitArea.on('pointerover', () => {
      playBtn.clear();
      playBtn.fillStyle(0x00eeff, 1);
      playBtn.fillRoundedRect(btnX, btnY, 200, 60, 12);
      playBtn.lineStyle(3, 0x00ccff, 1);
      playBtn.strokeRoundedRect(btnX, btnY, 200, 60, 12);
    });
    hitArea.on('pointerout', () => {
      playBtn.clear();
      playBtn.fillStyle(0x00d4ff, 1);
      playBtn.fillRoundedRect(btnX, btnY, 200, 60, 12);
      playBtn.lineStyle(3, 0x00aacc, 1);
      playBtn.strokeRoundedRect(btnX, btnY, 200, 60, 12);
    });
    hitArea.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // Version
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, 'v0.1.0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#666666',
    }).setOrigin(0.5);
  }
}
