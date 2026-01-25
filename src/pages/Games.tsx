import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Gamepad2, Spade, Type, Users, X, Maximize2 } from 'lucide-react';

interface Game {
  id: string;
  name: string;
  description: string;
  embedUrl: string;
  thumbnail: string;
  category: 'card' | 'word' | 'arcade' | 'multiplayer';
}

const GAMES: Game[] = [
  // Card Games
  {
    id: 'solitaire',
    name: 'Solitaire',
    description: 'Classic Klondike Solitaire',
    embedUrl: 'https://www.solitr.com/',
    thumbnail: '🃏',
    category: 'card',
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    description: 'Beat the dealer to 21',
    embedUrl: 'https://www.247blackjack.com/',
    thumbnail: '🎰',
    category: 'card',
  },
  {
    id: 'freecell',
    name: 'FreeCell',
    description: 'Strategic card puzzle',
    embedUrl: 'https://www.free-freecell-solitaire.com/',
    thumbnail: '♠️',
    category: 'card',
  },
  {
    id: 'spider',
    name: 'Spider Solitaire',
    description: 'Build stacks of cards',
    embedUrl: 'https://www.spidersolitaire.org/',
    thumbnail: '🕷️',
    category: 'card',
  },
  // Word Games
  {
    id: 'wordle',
    name: 'Wordle',
    description: 'Guess the 5-letter word',
    embedUrl: 'https://wordly.org/',
    thumbnail: '📝',
    category: 'word',
  },
  {
    id: 'crossword',
    name: 'Daily Crossword',
    description: 'Classic crossword puzzles',
    embedUrl: 'https://www.boatloadpuzzles.com/playcrossword',
    thumbnail: '✏️',
    category: 'word',
  },
  {
    id: 'wordsearch',
    name: 'Word Search',
    description: 'Find hidden words',
    embedUrl: 'https://thewordsearch.com/',
    thumbnail: '🔍',
    category: 'word',
  },
  {
    id: 'hangman',
    name: 'Hangman',
    description: 'Guess letters to save the man',
    embedUrl: 'https://hangmanwordgame.com/',
    thumbnail: '🪢',
    category: 'word',
  },
  // Arcade Games
  {
    id: '2048',
    name: '2048',
    description: 'Slide tiles to reach 2048',
    embedUrl: 'https://play2048.co/',
    thumbnail: '🔢',
    category: 'arcade',
  },
  {
    id: 'tetris',
    name: 'Tetris',
    description: 'Classic block stacking',
    embedUrl: 'https://tetris.com/play-tetris',
    thumbnail: '🧱',
    category: 'arcade',
  },
  {
    id: 'snake',
    name: 'Snake',
    description: 'Eat food and grow',
    embedUrl: 'https://playsnake.org/',
    thumbnail: '🐍',
    category: 'arcade',
  },
  {
    id: 'pacman',
    name: 'Pac-Man',
    description: 'Eat dots, avoid ghosts',
    embedUrl: 'https://freepacman.org/',
    thumbnail: '👾',
    category: 'arcade',
  },
  // Multiplayer Games
  {
    id: 'chess',
    name: 'Chess',
    description: 'Play chess online',
    embedUrl: 'https://www.chess.com/play/online',
    thumbnail: '♟️',
    category: 'multiplayer',
  },
  {
    id: 'checkers',
    name: 'Checkers',
    description: 'Classic board game',
    embedUrl: 'https://www.247checkers.com/',
    thumbnail: '⚫',
    category: 'multiplayer',
  },
  {
    id: 'pool',
    name: '8 Ball Pool',
    description: 'Online billiards',
    embedUrl: 'https://www.miniclip.com/games/8-ball-pool-multiplayer/en/',
    thumbnail: '🎱',
    category: 'multiplayer',
  },
  {
    id: 'tic-tac-toe',
    name: 'Tic Tac Toe',
    description: 'Classic X and O game',
    embedUrl: 'https://playtictactoe.org/',
    thumbnail: '⭕',
    category: 'multiplayer',
  },
];

const CATEGORY_INFO = {
  card: { label: 'Card Games', icon: Spade, color: 'from-red-500 to-pink-500' },
  word: { label: 'Word Games', icon: Type, color: 'from-blue-500 to-cyan-500' },
  arcade: { label: 'Arcade', icon: Gamepad2, color: 'from-green-500 to-emerald-500' },
  multiplayer: { label: 'Multiplayer', icon: Users, color: 'from-purple-500 to-violet-500' },
};

export default function Games() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const getGamesByCategory = (category: Game['category']) => 
    GAMES.filter(game => game.category === category);

  const GameCard = ({ game }: { game: Game }) => (
    <Card 
      className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl bg-card/80 backdrop-blur-sm border-border/50"
      onClick={() => setSelectedGame(game)}
    >
      <CardHeader className="pb-2">
        <div className="text-5xl mb-2 group-hover:scale-110 transition-transform">
          {game.thumbnail}
        </div>
        <CardTitle className="text-lg">{game.name}</CardTitle>
        <CardDescription className="text-sm">{game.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="jac" size="sm" className="w-full">
          Play Now
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Chat
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Game Arcade
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Free Games</h2>
          <p className="text-muted-foreground">Play classic games right in your browser - no downloads required!</p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5 mb-8">
            <TabsTrigger value="all">All Games</TabsTrigger>
            <TabsTrigger value="card" className="gap-1">
              <Spade className="h-3 w-3" /> Cards
            </TabsTrigger>
            <TabsTrigger value="word" className="gap-1">
              <Type className="h-3 w-3" /> Words
            </TabsTrigger>
            <TabsTrigger value="arcade" className="gap-1">
              <Gamepad2 className="h-3 w-3" /> Arcade
            </TabsTrigger>
            <TabsTrigger value="multiplayer" className="gap-1">
              <Users className="h-3 w-3" /> Multi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {Object.entries(CATEGORY_INFO).map(([category, info]) => (
              <div key={category} className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${info.color}`}>
                    <info.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">{info.label}</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {getGamesByCategory(category as Game['category']).map(game => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {Object.keys(CATEGORY_INFO).map(category => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {getGamesByCategory(category as Game['category']).map(game => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Game Modal */}
      <Dialog open={!!selectedGame} onOpenChange={(open) => !open && setSelectedGame(null)}>
        <DialogContent className={`${isFullscreen ? 'max-w-[100vw] h-[100vh] m-0 rounded-none' : 'max-w-5xl h-[80vh]'} p-0 overflow-hidden`}>
          <DialogHeader className="p-4 pb-2 flex flex-row items-center justify-between bg-background/95 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedGame?.thumbnail}</span>
              <div>
                <DialogTitle>{selectedGame?.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">{selectedGame?.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSelectedGame(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 h-full">
            {selectedGame && (
              <iframe
                src={selectedGame.embedUrl}
                className="w-full h-full border-0"
                title={selectedGame.name}
                allow="fullscreen"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>All games are free to play and hosted by their respective providers.</p>
          <p className="mt-1">© {new Date().getFullYear()} Justachat Game Arcade</p>
        </div>
      </footer>
    </div>
  );
}
