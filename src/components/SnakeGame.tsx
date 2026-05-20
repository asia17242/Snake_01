/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCw, Play, Pause, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Point, Direction } from '../types';
import { GRID_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, INITIAL_SNAKE, GAME_SPEED } from '../constants';

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>(Direction.RIGHT);
  const [nextDirection, setNextDirection] = useState<Direction>(Direction.RIGHT);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snake-high-score');
    return saved ? parseInt(saved, 10) : 0;
  });

  const lastMoveTime = useRef<number>(0);
  const requestRef = useRef<number>(0);

  // 生成隨機食物位置
  const generateFood = useCallback((currentSnake: Point[]): Point => {
    const cols = CANVAS_WIDTH / GRID_SIZE;
    const rows = CANVAS_HEIGHT / GRID_SIZE;
    let newFood: Point;
    
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
      };
      
      // 確保食物不會出現在蛇身上
      const isColliding = currentSnake.some(
        segment => segment.x === newFood.x && segment.y === newFood.y
      );
      
      if (!isColliding) break;
    }
    return newFood;
  }, []);

  // 遊戲初始化
  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(generateFood(INITIAL_SNAKE));
    setDirection(Direction.RIGHT);
    setNextDirection(Direction.RIGHT);
    setIsGameOver(false);
    setScore(0);
    setIsPaused(false);
  };

  // 處理按鍵
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction !== Direction.DOWN) setNextDirection(Direction.UP);
          break;
        case 'ArrowDown':
          if (direction !== Direction.UP) setNextDirection(Direction.DOWN);
          break;
        case 'ArrowLeft':
          if (direction !== Direction.RIGHT) setNextDirection(Direction.LEFT);
          break;
        case 'ArrowRight':
          if (direction !== Direction.LEFT) setNextDirection(Direction.RIGHT);
          break;
        case ' ': // 空白鍵暫停
          setIsPaused(prev => !prev);
          break;
        case 'Enter': // Enter 鍵重新開始
          if (isGameOver) resetGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isGameOver]);

  // 更新邏輯
  const update = useCallback((time: number) => {
    if (isGameOver || isPaused) return;

    if (time - lastMoveTime.current > GAME_SPEED) {
      lastMoveTime.current = time;

      setSnake(prevSnake => {
        const head = prevSnake[0];
        const currentDir = nextDirection;
        setDirection(currentDir);
        
        const newHead = { ...head };
        if (currentDir === Direction.UP) newHead.y -= 1;
        if (currentDir === Direction.DOWN) newHead.y += 1;
        if (currentDir === Direction.LEFT) newHead.x -= 1;
        if (currentDir === Direction.RIGHT) newHead.x += 1;

        // 碰撞檢測：牆壁
        const cols = CANVAS_WIDTH / GRID_SIZE;
        const rows = CANVAS_HEIGHT / GRID_SIZE;
        if (
          newHead.x < 0 || 
          newHead.x >= cols || 
          newHead.y < 0 || 
          newHead.y >= rows
        ) {
          setIsGameOver(true);
          return prevSnake;
        }

        // 碰撞檢測：自己
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setIsGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // 吃到食物
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => {
            const newScore = s + 10;
            if (newScore > highScore) {
              setHighScore(newScore);
              localStorage.setItem('snake-high-score', newScore.toString());
            }
            return newScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop(); // 沒吃到食物，移除尾巴
        }

        return newSnake;
      });
    }

    requestRef.current = requestAnimationFrame(update);
  }, [isGameOver, isPaused, food, nextDirection, highScore, generateFood]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update]);

  // 繪製邏輯
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清除畫布
    ctx.fillStyle = '#f8fafc'; // 明亮背景
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 繪製格線（可選，增加質感）
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // 繪製蛇
    snake.forEach((segment, index) => {
      // 漸層色
      const gradient = ctx.createRadialGradient(
        segment.x * GRID_SIZE + GRID_SIZE / 2,
        segment.y * GRID_SIZE + GRID_SIZE / 2,
        0,
        segment.x * GRID_SIZE + GRID_SIZE / 2,
        segment.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE
      );
      
      if (index === 0) {
        gradient.addColorStop(0, '#4ade80'); // 亮綠色頭部
        gradient.addColorStop(1, '#166534');
      } else {
        gradient.addColorStop(0, '#22c55e'); // 綠色身體
        gradient.addColorStop(1, '#14532d');
      }

      ctx.fillStyle = gradient;
      // 繪製圓角矩形蛇節
      const x = segment.x * GRID_SIZE + 2;
      const y = segment.y * GRID_SIZE + 2;
      const size = GRID_SIZE - 4;
      const radius = 4;
      
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + size - radius, y);
      ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
      ctx.lineTo(x + size, y + size - radius);
      ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
      ctx.lineTo(x + radius, y + size);
      ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();

      // 如果是蛇頭，畫上眼睛
      if (index === 0) {
        ctx.fillStyle = 'white';
        const eyeSize = 3;
        const offset = 5;
        
        if (direction === Direction.UP || direction === Direction.DOWN) {
          ctx.beginPath();
          ctx.arc(x + offset, y + size/2, eyeSize, 0, Math.PI * 2);
          ctx.arc(x + size - offset, y + size/2, eyeSize, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(x + size/2, y + offset, eyeSize, 0, Math.PI * 2);
          ctx.arc(x + size/2, y + size - offset, eyeSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    // 繪製食物
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ef4444';
    ctx.fillStyle = '#ef4444'; // 紅色食物
    ctx.beginPath();
    ctx.arc(
      food.x * GRID_SIZE + GRID_SIZE / 2,
      food.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

  }, [snake, food, direction]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent text-slate-900 p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[800px] mb-6 flex items-center justify-between"
      >
        <div className="flex flex-col">
          <h1 className="text-4xl font-black italic tracking-tighter text-emerald-600">
            SNAKE <span className="text-slate-700 not-italic font-light">CLASSIC</span>
          </h1>
          <p className="text-slate-600 text-sm">使用方向鍵移動，空白鍵暫停</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white/60 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">High Score</span>
              <span className="text-xl font-mono leading-none">{highScore}</span>
            </div>
          </div>
          <div className="bg-white/60 border border-slate-200 rounded-xl p-3 flex items-center gap-3 min-w-[100px]">
            <div className="flex flex-col items-end w-full">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Current Score</span>
              <span className="text-2xl font-mono leading-none text-emerald-600">{score}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative rounded-xl overflow-hidden border-4 border-slate-200 shadow-lg">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block"
            id="game-canvas"
          />

          {/* Overlays */}
          <AnimatePresence>
            {isPaused && !isGameOver && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-10"
              >
                <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-lg flex flex-col items-center max-w-xs text-center text-slate-900">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                    <Play className="w-10 h-10 text-emerald-400 fill-emerald-400 ml-1" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">遊戲暫停中</h2>
                  <p className="text-slate-600 mb-8 text-sm">按下空白鍵或下方按鈕繼續挑戰！</p>
                  <button
                    onClick={() => setIsPaused(false)}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                  >
                    繼續遊戲
                  </button>
                </div>
              </motion.div>
            )}

            {isGameOver && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-20"
              >
                <div className="p-10 rounded-3xl bg-white border-2 border-red-200 shadow-[0_0_50px_rgba(239,68,68,0.08)] flex flex-col items-center max-w-sm text-center text-slate-900">
                  <div className="text-red-500 mb-4 animate-pulse">
                    <RefreshCw className="w-16 h-16" />
                  </div>
                  <h2 className="text-4xl font-black mb-2 text-slate-900">GAME OVER</h2>
                  <div className="space-y-1 mb-8">
                    <p className="text-slate-600 text-sm">分數：<span className="text-slate-900 font-mono">{score}</span></p>
                    {score === highScore && score > 0 && (
                      <p className="text-amber-600 text-xs font-bold font-mono">恭喜創下最高紀錄！</p>
                    )}
                  </div>
                  <button
                    onClick={resetGame}
                    className="w-full py-4 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    再試一次
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Control Help / Touch Controls */}
      <div className="mt-8 grid grid-cols-2 gap-8 w-full max-w-[800px]">
        <div className="flex flex-col gap-4">
          <h3 className="text-slate-600 text-[10px] uppercase font-bold tracking-[0.2em]">操作說明</h3>
          <div className="flex gap-2">
            {[
              { key: '↑', label: '向上' },
              { key: '↓', label: '向下' },
              { key: '←', label: '向左' },
              { key: '→', label: '向右' }
            ].map(item => (
              <div key={item.key} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-lg font-bold text-slate-700">
                  {item.key}
                </div>
              </div>
            ))}
            <div className="flex flex-col items-center gap-1 ml-2">
              <div className="h-10 px-4 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-xs font-bold uppercase text-slate-700">
                SPACE
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 items-end">
          <h3 className="text-slate-600 text-[10px] uppercase font-bold tracking-[0.2em]">遊戲統計</h3>
          <div className="text-sm text-slate-600 text-right">
            當前長度: <span className="text-slate-900 font-mono">{snake.length}</span><br />
            遊戲難度: <span className="text-emerald-600 font-mono">標準</span>
          </div>
        </div>
      </div>
    </div>
  );
}
