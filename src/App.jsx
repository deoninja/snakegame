import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon, faVolumeUp, faVolumeMute, faPlay, faPause, faRedo, faArrowUp, faArrowDown, faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';

import eatSoundFile from './assets/sounds/eat.mp3';
import gameOverSoundFile from './assets/sounds/gameover.mp3';
import moveSoundFile from './assets/sounds/lies-and-more-lies.mp3';

const eatSound = new Audio(eatSoundFile);
const gameOverSound = new Audio(gameOverSoundFile);
const moveSound = new Audio(moveSoundFile);

const playSoundSafely = (sound, enabled = true) => {
  if (!enabled) return;
  
  try {
    if (sound.readyState >= 2) {
      sound.currentTime = 0;
      const playPromise = sound.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => console.log(`${sound.src} played successfully`))
          .catch(e => console.error(`Failed to play ${sound.src}:`, e));
      }
    } else {
      console.warn(`${sound.src} not ready, state: ${sound.readyState}`);
    }
  } catch (e) {
    console.error("Sound error:", e);
  }
};

function App() {
  const GRID_SIZE = 20;
  const CELL_SIZE = 20;
  const INITIAL_SPEED = 150;
  
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState('RIGHT');
  const [pendingDirection, setPendingDirection] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [darkMode, setDarkMode] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  
  const gameLoopRef = useRef();
  const boardRef = useRef();
  const containerRef = useRef();
  const lastMoveTimeRef = useRef(0);
  const directionRef = useRef('RIGHT');
  const gameStartedRef = useRef(false);
  const isPausedRef = useRef(false);
  const gameOverRef = useRef(false);
  const snakeRef = useRef([{ x: 10, y: 10 }]);
  const foodRef = useRef({ x: 5, y: 5 });
  const soundEnabledRef = useRef(true);
  const soundsLoadedRef = useRef(false);

  moveSound.loop = true;

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    gameStartedRef.current = gameStarted;
    if (gameStarted) {
      containerRef.current?.focus();
    }
  }, [gameStarted]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);

  useEffect(() => {
    foodRef.current = food;
  }, [food]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    if (!soundEnabled) {
      moveSound.pause();
    } else if (gameStartedRef.current && !isPausedRef.current && !gameOverRef.current) {
      playSoundSafely(moveSound, soundEnabled && soundsLoadedRef.current);
    }
  }, [soundEnabled]);

  useEffect(() => {
    soundsLoadedRef.current = soundsLoaded;
  }, [soundsLoaded]);

  useEffect(() => {
    const loadSoundsAsync = async () => {
      try {
        eatSound.volume = 0.4;
        gameOverSound.volume = 0.5;
        moveSound.volume = 0.4;

        const promises = [
          new Promise((resolve, reject) => {
            eatSound.oncanplaythrough = () => resolve();
            eatSound.onerror = () => reject(new Error("Failed to load eat.mp3"));
            eatSound.load();
          }),
          new Promise((resolve, reject) => {
            gameOverSound.oncanplaythrough = () => resolve();
            gameOverSound.onerror = () => reject(new Error("Failed to load gameover.mp3"));
            gameOverSound.load();
          }),
          new Promise((resolve, reject) => {
            moveSound.oncanplaythrough = () => resolve();
            moveSound.onerror = () => reject(new Error("Failed to load move.mp3"));
            moveSound.load();
          })
        ];

        await Promise.all(promises);
        setSoundsLoaded(true);
        console.log("All sounds loaded successfully");
      } catch (error) {
        console.error("Error loading sounds:", error);
        setSoundsLoaded(false);
      }
    };

    loadSoundsAsync();
  }, []);

  const generateFood = useCallback(() => {
    let newFood;
    const currentSnake = snakeRef.current;
    const isOnSnake = (pos) => currentSnake.some(segment => segment.x === pos.x && segment.y === pos.y);
    
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (isOnSnake(newFood));

    return newFood;
  }, [GRID_SIZE]);

  const handleKeyDown = useCallback((e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    
    if (e.key === ' ') {
      if (!gameStartedRef.current) {
        startGame();
      } else if (!gameOverRef.current) {
        togglePause();
      }
      return;
    }

    if (e.key === 'p' || e.key === 'P') {
      if (gameStartedRef.current && !gameOverRef.current) {
        togglePause();
      }
      return;
    }

    if (isPausedRef.current || gameOverRef.current || !gameStartedRef.current) return;

    let newDirection = directionRef.current;
    
    switch (e.key) {
      case 'ArrowUp':
        if (directionRef.current !== 'DOWN') newDirection = 'UP';
        break;
      case 'ArrowDown':
        if (directionRef.current !== 'UP') newDirection = 'DOWN';
        break;
      case 'ArrowLeft':
        if (directionRef.current !== 'RIGHT') newDirection = 'LEFT';
        break;
      case 'ArrowRight':
        if (directionRef.current !== 'LEFT') newDirection = 'RIGHT';
        break;
      default:
        return;
    }

    if (newDirection !== directionRef.current) {
      setDirection(newDirection);
      directionRef.current = newDirection;
      setPendingDirection(newDirection);
    }
  }, []);

  const checkFoodCollision = useCallback((head) => {
    const currentFood = foodRef.current;
    return head.x === currentFood.x && head.y === currentFood.y;
  }, []);

  const moveSnake = useCallback(() => {
    if (gameOverRef.current || isPausedRef.current || !gameStartedRef.current) return;

    const now = Date.now();
    if (now - lastMoveTimeRef.current < speed) return;
    lastMoveTimeRef.current = now;

    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };
      
      switch (directionRef.current) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
        default: break;
      }

      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        gameOverAction();
        return prevSnake;
      }

      for (let i = 0; i < prevSnake.length - 1; i++) {
        if (prevSnake[i].x === head.x && prevSnake[i].y === head.y) {
          gameOverAction();
          return prevSnake;
        }
      }

      const newSnake = [head, ...prevSnake];
      const ateFood = checkFoodCollision(head);
      
      if (ateFood) {
        playSoundSafely(eatSound, soundEnabledRef.current && soundsLoadedRef.current);
        setFood(generateFood());
        setScore(prev => {
          const newScore = prev + 10;
          if (newScore > 0 && newScore % 50 === 0) {
            setSpeed(prevSpeed => Math.max(prevSpeed - 10, 50));
          }
          return newScore;
        });
      } else {
        newSnake.pop();
      }

      return newSnake;
    });

    setPendingDirection(null);
  }, [speed, checkFoodCollision, GRID_SIZE, generateFood]);

  const gameOverAction = useCallback(() => {
    moveSound.pause();
    playSoundSafely(gameOverSound, soundEnabledRef.current && soundsLoadedRef.current);
    setGameOver(true);
    gameOverRef.current = true;

    if(score > highScore)
      setHighScore(prev => {
        const newHighScore = Math.max(prev, score);
        console.log("Game Over - Score:", score, "New High Score:", newHighScore);
        return newHighScore;
      });
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
  }, [score]);

  const startGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    snakeRef.current = initialSnake;
    
    const initialFood = generateFood();
    setFood(initialFood);
    foodRef.current = initialFood;
    
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setPendingDirection(null);
    setGameOver(false);
    gameOverRef.current = false;
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameStarted(true);
    gameStartedRef.current = true;
    setIsPaused(false);
    isPausedRef.current = false;
    lastMoveTimeRef.current = Date.now();

    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    if (soundEnabledRef.current && soundsLoadedRef.current) {
      console.log("Attempting to play moveSound");
      playSoundSafely(moveSound, true);
    }

    containerRef.current?.focus();
  }, [generateFood, INITIAL_SPEED]);

  const togglePause = useCallback(() => {
    if (gameOverRef.current || !gameStartedRef.current) return;

    setIsPaused(prev => {
      const newIsPaused = !prev;
      isPausedRef.current = newIsPaused;

      if (newIsPaused) {
        moveSound.pause();
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      } else {
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        lastMoveTimeRef.current = Date.now();
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        if (soundEnabledRef.current && soundsLoadedRef.current) {
          playSoundSafely(moveSound, true);
        }
      }
      return newIsPaused;
    });
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newSoundEnabled = !prev;
      if (!newSoundEnabled) {
        moveSound.pause();
      } else if (gameStartedRef.current && !isPausedRef.current && !gameOverRef.current) {
        playSoundSafely(moveSound, soundsLoadedRef.current);
      }
      return newSoundEnabled;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (!gameStartedRef.current) {
      startGame();
      return;
    }

    if (gameOverRef.current || isPausedRef.current) return;

    const touch = e.touches[0];
    const rect = boardRef.current.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const deltaX = touchX - centerX;
    const deltaY = touchY - centerY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0 && directionRef.current !== 'LEFT') {
        setDirection('RIGHT');
        directionRef.current = 'RIGHT';
      }
      else if (deltaX < 0 && directionRef.current !== 'RIGHT') {
        setDirection('LEFT');
        directionRef.current = 'LEFT';
      }
    } else {
      if (deltaY > 0 && directionRef.current !== 'UP') {
        setDirection('DOWN');
        directionRef.current = 'DOWN';
      }
      else if (deltaY < 0 && directionRef.current !== 'DOWN') {
        setDirection('UP');
        directionRef.current = 'UP';
      }
    }
  }, [startGame]);

  const gameLoop = useCallback(() => {
    if (gameStartedRef.current && !gameOverRef.current && !isPausedRef.current) {
      moveSnake();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [moveSnake]);

  useEffect(() => {
    const storedHighScore = localStorage.getItem('snakeHighScore');
    if (storedHighScore) {
      const parsedScore = parseInt(storedHighScore, 10);
      if (!isNaN(parsedScore)) {
        setHighScore(parsedScore);
        console.log("Loaded High Score from localStorage:", parsedScore);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      moveSound.pause();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    if (score > highScore) {
      localStorage.setItem('snakeHighScore', score.toString());
      setHighScore(score);
    }
  }, [score, highScore]);

  const handleBlur = useCallback(() => {
    if (gameStartedRef.current && !gameOverRef.current && !isPausedRef.current) {
      containerRef.current?.focus();
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      autoFocus
      onBlur={handleBlur}
      className={`flex flex-col items-center justify-center min-h-screen p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} outline-none`}
    >
      <div className={`flex flex-col items-center ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-2xl w-full max-w-md`}>
        <div className="flex justify-between w-full mb-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'}`}
            >
              <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
            </button>
            <button 
              onClick={toggleSound}
              className={`p-2 rounded-full ${soundEnabled ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600') : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-400')}`}
            >
              <FontAwesomeIcon icon={soundEnabled ? faVolumeUp : faVolumeMute} />
            </button>
          </div>
          <div className="flex items-center space-x-6">
            <div className={`text-center ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
              <div className="text-sm font-semibold">SCORE</div>
              <div className="text-2xl font-bold">{gameStarted ? score : '-'}</div>
            </div>
            <div className={`text-center ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>
              <div className="text-sm font-semibold">HIGH SCORE</div>
              <div className="text-2xl font-bold">{highScore > 0 ? highScore : '-'}</div>
            </div>
          </div>
        </div>

        <div 
          ref={boardRef}
          className={`game-board relative ${darkMode ? 'bg-gray-900' : 'bg-gray-200'} rounded-lg overflow-hidden mb-4`}
          style={{
            width: `${GRID_SIZE * CELL_SIZE}px`,
            height: `${GRID_SIZE * CELL_SIZE}px`,
          }}
          onTouchStart={handleTouchStart}
        >
          {!gameStarted && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${darkMode ? 'bg-black bg-opacity-70' : 'bg-white bg-opacity-80'} z-10`}>
              <h2 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>SNAKE GAME</h2>
              <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Use arrow keys to move</p>
              <button
                onClick={startGame}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all transform hover:scale-105 pulse-animation"
              >
                <FontAwesomeIcon icon={faPlay} className="mr-2" /> START GAME
              </button>
            </div>
          )}

          {gameOver && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${darkMode ? 'bg-black bg-opacity-70' : 'bg-white bg-opacity-80'} z-10`}>
              <h2 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>GAME OVER!</h2>
              <p className={`text-xl mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Score: {score}</p>
              <button
                onClick={startGame}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all transform hover:scale-105"
              >
                <FontAwesomeIcon icon={faRedo} className="mr-2" /> PLAY AGAIN
              </button>
            </div>
          )}

          {isPaused && (
            <div className={`absolute inset-0 flex items-center justify-center ${darkMode ? 'bg-black bg-opacity-50' : 'bg-white bg-opacity-50'} z-10`}>
              <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>PAUSED</div>
            </div>
          )}

          <div
            className={`absolute food-cell ${darkMode ? 'bg-red-500' : 'bg-red-600'} rounded-full`}
            style={{
              width: `${CELL_SIZE}px`,
              height: `${CELL_SIZE}px`,
              left: `${food.x * CELL_SIZE}px`,
              top: `${food.y * CELL_SIZE}px`,
              boxShadow: `0 0 10px ${darkMode ? 'rgba(239, 68, 68, 0.7)' : 'rgba(220, 38, 38, 0.7)'}`
            }}
          ></div>

          {snake.map((segment, index) => (
            <div
              key={index}
              className={`absolute snake-cell ${index === 0 ? (darkMode ? 'bg-blue-400' : 'bg-blue-500') : (darkMode ? 'bg-blue-500' : 'bg-blue-400')} rounded-sm`}
              style={{
                width: `${CELL_SIZE}px`,
                height: `${CELL_SIZE}px`,
                left: `${segment.x * CELL_SIZE}px`,
                top: `${segment.y * CELL_SIZE}px`,
                zIndex: snake.length - index,
                opacity: `${0.8 + (index / snake.length) * 0.2}`,
                boxShadow: index === 0 ? `0 0 8px ${darkMode ? 'rgba(96, 165, 250, 0.8)' : 'rgba(59, 130, 246, 0.8)'}` : 'none'
              }}
            ></div>
          ))}
        </div>

        <div className="flex justify-center space-x-4 w-full">
          <button
            onClick={() => !gameStarted ? startGame() : togglePause()}
            className={`px-6 py-3 rounded-full font-bold flex items-center ${gameOver ? 'bg-green-600 hover:bg-green-700' : isPaused ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'} text-white transition-all`}
          >
            <FontAwesomeIcon icon={!gameStarted || isPaused ? faPlay : faPause} className="mr-2" />
            {!gameStarted ? 'Start' : isPaused ? 'Resume' : 'Pause'}
          </button>
          
          <button
            onClick={startGame}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full transition-all flex items-center"
          >
            <FontAwesomeIcon icon={faRedo} className="mr-2" />
            Restart
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 w-full">
          <button 
            onClick={() => {
              if (directionRef.current !== 'DOWN' && gameStarted && !gameOver && !isPaused) {
                setDirection('UP');
                setPendingDirection('UP');
                directionRef.current = 'UP';
              }
            }}
            className={`py-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg flex justify-center`}
            disabled={!gameStarted || gameOver || isPaused}
          >
            <FontAwesomeIcon icon={faArrowUp} />
          </button>
          <button 
            onClick={() => {
              if (directionRef.current !== 'RIGHT' && gameStarted && !gameOver && !isPaused) {
                setDirection('LEFT');
                setPendingDirection('LEFT');
                directionRef.current = 'LEFT';
              }
            }}
            className={`py-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg flex justify-center`}
            disabled={!gameStarted || gameOver || isPaused}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <button 
            onClick={() => {
              if (directionRef.current !== 'LEFT' && gameStarted && !gameOver && !isPaused) {
                setDirection('RIGHT');
                setPendingDirection('RIGHT');
                directionRef.current = 'RIGHT';
              }
            }}
            className={`py-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg flex justify-center`}
            disabled={!gameStarted || gameOver || isPaused}
          >
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
          <button 
            onClick={() => {
              if (directionRef.current !== 'UP' && gameStarted && !gameOver && !isPaused) {
                setDirection('DOWN');
                setPendingDirection('DOWN');
                directionRef.current = 'DOWN';
              }
            }}
            className={`py-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg flex justify-center col-start-2`}
            disabled={!gameStarted || gameOver || isPaused}
          >
            <FontAwesomeIcon icon={faArrowDown} />
          </button>
        </div>

        <div className={`mt-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <p>Press <span className="font-bold">P</span> to pause, <span className="font-bold">SPACE</span> to start/pause</p>
        </div>
      </div>
    </div>
  );
}

export default App;