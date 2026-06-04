import { Vec2, type LevelData, type Wall, type Obstacle } from '../logic/physics'

/** Helper to create a wall */
function wall(x: number, y: number, w: number, h: number, bounciness = 0.7, type: 'wall' | 'bounce' = 'wall'): Wall {
  return { x, y, width: w, height: h, bounciness, type }
}

/** Helper to create a circle obstacle */
function circle(cx: number, cy: number, radius: number): Obstacle {
  return { type: 'circle', center: new Vec2(cx, cy), radius }
}

/** 50 hand-crafted levels */
export const LEVELS: LevelData[] = [
  {
    id: 1,
    name: 'First Swing',
    ballStart: new Vec2(100, 500),
    hole: { center: new Vec2(700, 550), radius: 18 },
    par: 2,
    obstacles: [],
    walls: [],
    stars: [
      { type: 'par', target: 1, description: 'Hole in one!' },
      { type: 'time', target: 5, description: 'Under 5 seconds' },
      { type: 'collect', target: 3, description: 'Collect 3 stars' },
    ],
  },
  {
    id: 2,
    name: 'The Wall',
    ballStart: new Vec2(100, 500),
    hole: { center: new Vec2(700, 550), radius: 18 },
    par: 3,
    obstacles: [],
    walls: [wall(380, 300, 20, 300)],
    stars: [
      { type: 'par', target: 2, description: '2 strokes or less' },
      { type: 'time', target: 8, description: 'Under 8 seconds' },
      { type: 'collect', target: 3, description: 'Collect 3 stars' },
    ],
  },
  {
    id: 3,
    name: 'Bounce Pad Alley',
    ballStart: new Vec2(100, 500),
    hole: { center: new Vec2(700, 200), radius: 18 },
    par: 3,
    obstacles: [],
    walls: [
      wall(250, 450, 80, 10, 1.5, 'bounce'),
      wall(450, 350, 80, 10, 1.5, 'bounce'),
    ],
    stars: [
      { type: 'par', target: 2, description: '2 strokes or less' },
      { type: 'time', target: 10, description: 'Under 10 seconds' },
      { type: 'collect', target: 3, description: 'Collect 3 stars' },
    ],
  },
  {
    id: 4,
    name: 'Circle Maze',
    ballStart: new Vec2(100, 300),
    hole: { center: new Vec2(700, 300), radius: 18 },
    par: 4,
    obstacles: [circle(300, 300, 40), circle(500, 250, 35), circle(400, 400, 30)],
    walls: [],
    stars: [
      { type: 'par', target: 3, description: '3 strokes or less' },
      { type: 'time', target: 12, description: 'Under 12 seconds' },
      { type: 'collect', target: 3, description: 'Collect 3 stars' },
    ],
  },
  {
    id: 5,
    name: 'Portal Hop',
    ballStart: new Vec2(100, 500),
    hole: { center: new Vec2(700, 100), radius: 18 },
    par: 3,
    obstacles: [
      { type: 'portal', center: new Vec2(400, 500), radius: 25, exit: new Vec2(400, 100) },
    ],
    walls: [],
    stars: [
      { type: 'par', target: 2, description: '2 strokes or less' },
      { type: 'time', target: 8, description: 'Under 8 seconds' },
      { type: 'collect', target: 3, description: 'Collect 3 stars' },
    ],
  },
]

/** Generate remaining levels (6-50) programmatically with increasing difficulty */
for (let i = 6; i <= 50; i++) {
  const difficulty = Math.floor(i / 5) // 0-9
  const obstacleCount = Math.min(difficulty, 5)
  const wallCount = Math.min(Math.floor(difficulty / 2), 4)

  const obstacles: Obstacle[] = []
  const walls: Wall[] = []

  for (let j = 0; j < obstacleCount; j++) {
    obstacles.push(circle(200 + j * 120, 200 + (j % 3) * 120, 20 + difficulty * 3))
  }

  for (let j = 0; j < wallCount; j++) {
    const isBouncePad = j % 3 === 0
    walls.push(wall(
      250 + j * 130,
      250 + (j % 2) * 150,
      80,
      isBouncePad ? 10 : 20 + difficulty * 5,
      isBouncePad ? 1.5 : 0.7,
      isBouncePad ? 'bounce' : 'wall',
    ))
  }

  LEVELS.push({
    id: i,
    name: `Level ${i}`,
    ballStart: new Vec2(100, 500),
    hole: { center: new Vec2(650 + (i % 3) * 30, 100 + (i % 4) * 100), radius: 18 - Math.min(difficulty, 5) },
    par: 3 + Math.floor(difficulty / 2),
    obstacles,
    walls,
    stars: [
      { type: 'par', target: 2 + Math.floor(difficulty / 3), description: `${2 + Math.floor(difficulty / 3)} strokes or less` },
      { type: 'time', target: 8 + difficulty * 2, description: `Under ${8 + difficulty * 2} seconds` },
      { type: 'collect', target: 3, description: 'Collect 3 stars' },
    ],
  })
}
