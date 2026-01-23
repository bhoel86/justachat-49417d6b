// Comprehensive music library organized by genre
export interface Song {
  title: string;
  artist: string;
  videoId: string;
  genre: string;
}

export interface Genre {
  name: string;
  icon: string;
  songs: Song[];
}

export const MUSIC_LIBRARY: Genre[] = [
  {
    name: 'Lofi',
    icon: '🎧',
    songs: [
      { title: 'Lofi Hip Hop Radio', artist: 'Lofi Girl', videoId: 'jfKfPfyJRdk', genre: 'Lofi' },
      { title: 'Chillhop Radio', artist: 'Chillhop Music', videoId: '5yx6BWlEVcY', genre: 'Lofi' },
      { title: 'Sleepy Lofi', artist: 'Lofi Girl', videoId: 'rUxyKA_-grg', genre: 'Lofi' },
      { title: 'Coffee Shop Vibes', artist: 'Lofi Fruits', videoId: 'lTRiuFIWV54', genre: 'Lofi' },
      { title: 'Late Night Lofi', artist: 'The Jazz Hop Café', videoId: 'kgx4WGK0oNU', genre: 'Lofi' },
      { title: 'Rainy Day Lofi', artist: 'Chillhop', videoId: 'q76bMs-NwRk', genre: 'Lofi' },
      { title: 'Study Session', artist: 'College Music', videoId: 'TURbeWK2wwg', genre: 'Lofi' },
      { title: 'Midnight Study', artist: 'Lofi Records', videoId: 'lP26UCnoH9s', genre: 'Lofi' },
      { title: 'Chill Beats', artist: 'Chillhop', videoId: '-5KAN9_CzSA', genre: 'Lofi' },
      { title: 'Focus Flow', artist: 'Lofi Girl', videoId: 'DWcJFNfaw9c', genre: 'Lofi' },
    ]
  },
  {
    name: 'Hip Hop',
    icon: '🎤',
    songs: [
      { title: 'HUMBLE.', artist: 'Kendrick Lamar', videoId: 'tvTRZJ-4EyI', genre: 'Hip Hop' },
      { title: 'Sicko Mode', artist: 'Travis Scott', videoId: '6ONRf7h3Mdk', genre: 'Hip Hop' },
      { title: 'God\'s Plan', artist: 'Drake', videoId: 'xpVfcZ0ZcFM', genre: 'Hip Hop' },
      { title: 'Lose Yourself', artist: 'Eminem', videoId: '_Yhyp-_hX2s', genre: 'Hip Hop' },
      { title: 'Mask Off', artist: 'Future', videoId: 'xvZqHgFz51I', genre: 'Hip Hop' },
      { title: 'Rockstar', artist: 'Post Malone', videoId: 'UceaB4D0jpo', genre: 'Hip Hop' },
      { title: 'Old Town Road', artist: 'Lil Nas X', videoId: 'w2Ov5jzm3j8', genre: 'Hip Hop' },
      { title: 'Hot N*gga', artist: 'Bobby Shmurda', videoId: 'vJwKKKd2ZYE', genre: 'Hip Hop' },
      { title: 'XO Tour Llif3', artist: 'Lil Uzi Vert', videoId: 'WrsFXgQk5UI', genre: 'Hip Hop' },
      { title: 'Bodak Yellow', artist: 'Cardi B', videoId: 'PEGccV-NOm8', genre: 'Hip Hop' },
      { title: 'DNA.', artist: 'Kendrick Lamar', videoId: 'NLZRYQMLDW4', genre: 'Hip Hop' },
      { title: 'In Da Club', artist: '50 Cent', videoId: '5qm8PH4xAss', genre: 'Hip Hop' },
      { title: 'Still D.R.E.', artist: 'Dr. Dre ft. Snoop Dogg', videoId: '_CL6n0FJZpk', genre: 'Hip Hop' },
      { title: 'Hotline Bling', artist: 'Drake', videoId: 'uxpDa-c-4Mc', genre: 'Hip Hop' },
      { title: 'Bad and Boujee', artist: 'Migos', videoId: 'S-sJp1FfG7Q', genre: 'Hip Hop' },
      { title: 'Lifestyle', artist: 'Rich Gang', videoId: 'nGt_JGHYEO4', genre: 'Hip Hop' },
      { title: 'Panda', artist: 'Desiigner', videoId: 'E5ONTXHS2mM', genre: 'Hip Hop' },
      { title: 'Black Beatles', artist: 'Rae Sremmurd', videoId: 'b8m9zhNAgKs', genre: 'Hip Hop' },
      { title: 'Congratulations', artist: 'Post Malone', videoId: 'SC4xMk98Pdc', genre: 'Hip Hop' },
      { title: 'Antidote', artist: 'Travis Scott', videoId: 'KnZ8h3MRuYg', genre: 'Hip Hop' },
    ]
  },
  {
    name: 'Drill',
    icon: '🔫',
    songs: [
      { title: 'Welcome to the Party', artist: 'Pop Smoke', videoId: 'HKu0hZ8pM04', genre: 'Drill' },
      { title: 'Dior', artist: 'Pop Smoke', videoId: 'sXjQ9j5nkQA', genre: 'Drill' },
      { title: 'Mr Whoever You Are', artist: 'Pop Smoke', videoId: 'J6pFoLFBI4I', genre: 'Drill' },
      { title: 'Shake The Room', artist: 'Pop Smoke', videoId: '0xZ20DY5-D8', genre: 'Drill' },
      { title: 'Body', artist: 'Tion Wayne & Russ Millions', videoId: '9_E0YoWP5wo', genre: 'Drill' },
      { title: 'Keisha Becky', artist: 'Russ Millions', videoId: 'PsfzujQsLT4', genre: 'Drill' },
      { title: 'Next Up', artist: 'Digga D', videoId: 'r9KsnwLfR3s', genre: 'Drill' },
      { title: 'Bringing It Back', artist: 'Digga D & AJ Tracey', videoId: '5rW_IjQogaw', genre: 'Drill' },
      { title: 'Exposing Me', artist: 'Memo600 & King Von', videoId: 'W7WxyL4cFFg', genre: 'Drill' },
      { title: 'Crazy Story', artist: 'King Von', videoId: 'X5k7IP6ZEHo', genre: 'Drill' },
      { title: 'Armed & Dangerous', artist: 'King Von', videoId: 'g0xtX-LGQJE', genre: 'Drill' },
      { title: 'PHPD', artist: 'Central Cee', videoId: 'dZr0xI6HM3o', genre: 'Drill' },
      { title: 'Loading', artist: 'Central Cee', videoId: 'mJt-UfECUdg', genre: 'Drill' },
      { title: 'Obsessed With You', artist: 'Central Cee', videoId: '2T1D12aGfio', genre: 'Drill' },
      { title: 'No Hook', artist: 'Dave & AJ Tracey', videoId: 'jdD90zUFl9E', genre: 'Drill' },
      { title: 'Woi', artist: 'Digga D', videoId: 'bIe9lN53v4I', genre: 'Drill' },
      { title: 'Ain\'t It Different', artist: 'Headie One', videoId: 'RBMScGxU0d4', genre: 'Drill' },
      { title: 'Only You Freestyle', artist: 'Headie One', videoId: 'LzfGWjMPVVQ', genre: 'Drill' },
      { title: 'War', artist: 'Pop Smoke', videoId: '3vWknTVFlBQ', genre: 'Drill' },
      { title: 'Mood Swings', artist: 'Pop Smoke', videoId: 'fOEWqJsKoJE', genre: 'Drill' },
    ]
  },
  {
    name: 'Rock',
    icon: '🎸',
    songs: [
      { title: 'Bohemian Rhapsody', artist: 'Queen', videoId: 'fJ9rUzIMcZQ', genre: 'Rock' },
      { title: 'Smells Like Teen Spirit', artist: 'Nirvana', videoId: 'hTWKbfoikeg', genre: 'Rock' },
      { title: 'Back In Black', artist: 'AC/DC', videoId: 'pAgnJDJN4VA', genre: 'Rock' },
      { title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', videoId: '1w7OgIMMRc4', genre: 'Rock' },
      { title: 'Stairway to Heaven', artist: 'Led Zeppelin', videoId: 'QkF3oxziUI4', genre: 'Rock' },
      { title: 'Hotel California', artist: 'Eagles', videoId: 'EqPtz5qN7HM', genre: 'Rock' },
      { title: 'November Rain', artist: 'Guns N\' Roses', videoId: '8SbUC-UaAxE', genre: 'Rock' },
      { title: 'Thunderstruck', artist: 'AC/DC', videoId: 'v2AC41dglnM', genre: 'Rock' },
      { title: 'Highway to Hell', artist: 'AC/DC', videoId: 'l482T0yNkeo', genre: 'Rock' },
      { title: 'Paradise City', artist: 'Guns N\' Roses', videoId: 'Rbm6GXllBiw', genre: 'Rock' },
      { title: 'Welcome to the Jungle', artist: 'Guns N\' Roses', videoId: 'o1tj2zJ2Wvg', genre: 'Rock' },
      { title: 'Don\'t Stop Believin\'', artist: 'Journey', videoId: '1k8craCGpgs', genre: 'Rock' },
      { title: 'Livin\' on a Prayer', artist: 'Bon Jovi', videoId: 'lDK9QqIzhwk', genre: 'Rock' },
      { title: 'Enter Sandman', artist: 'Metallica', videoId: 'CD-E-LDc384', genre: 'Rock' },
      { title: 'Nothing Else Matters', artist: 'Metallica', videoId: 'tAGnKpE4NCI', genre: 'Rock' },
      { title: 'We Will Rock You', artist: 'Queen', videoId: '-tJYN-eG1zk', genre: 'Rock' },
      { title: 'We Are the Champions', artist: 'Queen', videoId: '04854XqcfCY', genre: 'Rock' },
      { title: 'Crazy Train', artist: 'Ozzy Osbourne', videoId: 'tMDFv5m18Pw', genre: 'Rock' },
      { title: 'Iron Man', artist: 'Black Sabbath', videoId: '8aQRq9hhDWA', genre: 'Rock' },
      { title: 'Smoke on the Water', artist: 'Deep Purple', videoId: 'zUwEIt9ez7M', genre: 'Rock' },
    ]
  },
  {
    name: 'Metal',
    icon: '🤘',
    songs: [
      { title: 'Master of Puppets', artist: 'Metallica', videoId: 'xnKhsTXoKCI', genre: 'Metal' },
      { title: 'One', artist: 'Metallica', videoId: 'WM8bTdBs-cw', genre: 'Metal' },
      { title: 'Raining Blood', artist: 'Slayer', videoId: 'z8ZqFlw6hYg', genre: 'Metal' },
      { title: 'Holy Wars', artist: 'Megadeth', videoId: '9d4ui9q7eDM', genre: 'Metal' },
      { title: 'Peace Sells', artist: 'Megadeth', videoId: 'T0LfHEwEXXw', genre: 'Metal' },
      { title: 'Ace of Spades', artist: 'Motörhead', videoId: '3mbvWn1EY6g', genre: 'Metal' },
      { title: 'The Trooper', artist: 'Iron Maiden', videoId: '2G5rfPISIwo', genre: 'Metal' },
      { title: 'Run to the Hills', artist: 'Iron Maiden', videoId: '86URGgqONvA', genre: 'Metal' },
      { title: 'Painkiller', artist: 'Judas Priest', videoId: 'nM__lPTWThU', genre: 'Metal' },
      { title: 'Breaking the Law', artist: 'Judas Priest', videoId: 'L397TWLwrUU', genre: 'Metal' },
      { title: 'Walk', artist: 'Pantera', videoId: 'AkFqg5wAuFk', genre: 'Metal' },
      { title: 'Cowboys from Hell', artist: 'Pantera', videoId: 'i97OkCXwotE', genre: 'Metal' },
      { title: 'Chop Suey!', artist: 'System of a Down', videoId: 'CSvFpBOe8eY', genre: 'Metal' },
      { title: 'Toxicity', artist: 'System of a Down', videoId: 'iywaBOMvYLI', genre: 'Metal' },
      { title: 'B.Y.O.B.', artist: 'System of a Down', videoId: 'zUzd9KyIDrM', genre: 'Metal' },
      { title: 'Down with the Sickness', artist: 'Disturbed', videoId: '09LTT0xwdfw', genre: 'Metal' },
      { title: 'The Sound of Silence', artist: 'Disturbed', videoId: 'u9Dg-g7t2l4', genre: 'Metal' },
      { title: 'Bodies', artist: 'Drowning Pool', videoId: '04F4xlWSFh0', genre: 'Metal' },
      { title: 'Before I Forget', artist: 'Slipknot', videoId: 'qw2LU1yS7aw', genre: 'Metal' },
      { title: 'Duality', artist: 'Slipknot', videoId: '6fVE8kSM43I', genre: 'Metal' },
    ]
  },
  {
    name: 'EDM',
    icon: '🎛️',
    songs: [
      { title: 'Levels', artist: 'Avicii', videoId: '_ovdm2yX4MA', genre: 'EDM' },
      { title: 'Wake Me Up', artist: 'Avicii', videoId: 'IcrbM1l_BoI', genre: 'EDM' },
      { title: 'Titanium', artist: 'David Guetta ft. Sia', videoId: 'JRfuAukYTKg', genre: 'EDM' },
      { title: 'Animals', artist: 'Martin Garrix', videoId: 'gCYcHz2k5x0', genre: 'EDM' },
      { title: 'Tremor', artist: 'Dimitri Vegas & Like Mike', videoId: '9vMh9f41pqE', genre: 'EDM' },
      { title: 'Don\'t You Worry Child', artist: 'Swedish House Mafia', videoId: '1y6smkh6c-0', genre: 'EDM' },
      { title: 'Save The World', artist: 'Swedish House Mafia', videoId: 'BXpdmKELE1k', genre: 'EDM' },
      { title: 'Clarity', artist: 'Zedd ft. Foxes', videoId: 'IxxstCcJlsc', genre: 'EDM' },
      { title: 'Stay', artist: 'Zedd & Alessia Cara', videoId: 'h--P8HzYZ74', genre: 'EDM' },
      { title: 'Lean On', artist: 'Major Lazer & DJ Snake', videoId: 'YqeW9_5kURI', genre: 'EDM' },
      { title: 'Turn Down for What', artist: 'DJ Snake & Lil Jon', videoId: 'HMUDVMiITOU', genre: 'EDM' },
      { title: 'Get Lucky', artist: 'Daft Punk', videoId: '5NV6Rdv1a3I', genre: 'EDM' },
      { title: 'One More Time', artist: 'Daft Punk', videoId: 'FGBhQbmPwH8', genre: 'EDM' },
      { title: 'Harder Better Faster Stronger', artist: 'Daft Punk', videoId: 'gAjR4_CbPpQ', genre: 'EDM' },
      { title: 'Faded', artist: 'Alan Walker', videoId: '60ItHLz5WEA', genre: 'EDM' },
      { title: 'Alone', artist: 'Alan Walker', videoId: '1-xGerv5FOk', genre: 'EDM' },
      { title: 'The Spectre', artist: 'Alan Walker', videoId: 'wJnBTPUQS5A', genre: 'EDM' },
      { title: 'Scared to Be Lonely', artist: 'Martin Garrix & Dua Lipa', videoId: 'e2vBLd5Egnk', genre: 'EDM' },
      { title: 'In The Name Of Love', artist: 'Martin Garrix & Bebe Rexha', videoId: 'RnBT9uUYb1w', genre: 'EDM' },
      { title: 'Something Just Like This', artist: 'Chainsmokers & Coldplay', videoId: 'FM7MFYoylVs', genre: 'EDM' },
    ]
  },
  {
    name: 'House',
    icon: '🏠',
    songs: [
      { title: 'Finally', artist: 'CeCe Peniston', videoId: 'xk8mm1Qmt-Y', genre: 'House' },
      { title: 'Show Me Love', artist: 'Robin S', videoId: 'Ps2Jc28tQrw', genre: 'House' },
      { title: 'Cola', artist: 'CamelPhat & Elderbrook', videoId: 'zRkWguLk_Gg', genre: 'House' },
      { title: 'Opus', artist: 'Eric Prydz', videoId: 'iRA82xLsb_w', genre: 'House' },
      { title: 'One Kiss', artist: 'Calvin Harris & Dua Lipa', videoId: 'DkeiKbqa02g', genre: 'House' },
      { title: 'Summer', artist: 'Calvin Harris', videoId: 'ebXbLfLACGM', genre: 'House' },
      { title: 'This Is What You Came For', artist: 'Calvin Harris ft. Rihanna', videoId: 'kOkQ4T5WO9E', genre: 'House' },
      { title: 'How Deep Is Your Love', artist: 'Calvin Harris & Disciples', videoId: 'EgqUJOudrcM', genre: 'House' },
      { title: 'Promises', artist: 'Calvin Harris & Sam Smith', videoId: 'b3rkHsAoeu4', genre: 'House' },
      { title: 'Deep Down', artist: 'Alok', videoId: 'bkk-EpstAjE', genre: 'House' },
      { title: 'Hear Me Now', artist: 'Alok & Bruno Martini', videoId: 'fkDpVgGA8cQ', genre: 'House' },
      { title: 'Runaway (U & I)', artist: 'Galantis', videoId: '5XR7naZ_zZA', genre: 'House' },
      { title: 'No Money', artist: 'Galantis', videoId: 'xMWtLaWgFqQ', genre: 'House' },
      { title: 'Pjanoo', artist: 'Eric Prydz', videoId: 'llfNRGQ7Tlg', genre: 'House' },
      { title: 'I Gotta Feeling', artist: 'Black Eyed Peas', videoId: 'uSD4vsh1zDA', genre: 'House' },
      { title: 'Insomnia', artist: 'Faithless', videoId: 'P8JEm4d6Wu4', genre: 'House' },
      { title: 'Finally Moving', artist: 'Pretty Lights', videoId: 'Sk9XYQMRiLY', genre: 'House' },
      { title: 'Be Right There', artist: 'Diplo & Sleepy Tom', videoId: 'tg00YEETFzg', genre: 'House' },
      { title: 'Rather Be', artist: 'Clean Bandit', videoId: 'm-M1AtrxztU', genre: 'House' },
      { title: 'Rockabye', artist: 'Clean Bandit ft. Anne-Marie', videoId: 'papuvlVeZg8', genre: 'House' },
    ]
  },
  {
    name: 'Dubstep',
    icon: '💥',
    songs: [
      { title: 'Scary Monsters and Nice Sprites', artist: 'Skrillex', videoId: 'WSeNSzJ2-Jw', genre: 'Dubstep' },
      { title: 'Bangarang', artist: 'Skrillex', videoId: 'YJVmu6yttiw', genre: 'Dubstep' },
      { title: 'First of the Year', artist: 'Skrillex', videoId: '2cXDgFwE13g', genre: 'Dubstep' },
      { title: 'Cinema', artist: 'Skrillex Remix', videoId: 'Ua0KpfJsxKo', genre: 'Dubstep' },
      { title: 'Bass Cannon', artist: 'Flux Pavilion', videoId: 'gYGioWinQQE', genre: 'Dubstep' },
      { title: 'I Can\'t Stop', artist: 'Flux Pavilion', videoId: 'hzExWz7KP5M', genre: 'Dubstep' },
      { title: 'Cracks', artist: 'Flux Pavilion', videoId: 'K1VLaXoRRdk', genre: 'Dubstep' },
      { title: 'Bonfire', artist: 'Knife Party', videoId: 'e-IWRmpefzE', genre: 'Dubstep' },
      { title: 'Internet Friends', artist: 'Knife Party', videoId: 'gcejLp72iCE', genre: 'Dubstep' },
      { title: 'Promises', artist: 'Nero', videoId: 'llDikI2hTtk', genre: 'Dubstep' },
      { title: 'Must Be the Feeling', artist: 'Nero', videoId: 'PYGS0yyPl5E', genre: 'Dubstep' },
      { title: 'Red Lips', artist: 'Skrillex Remix', videoId: 'Cy4CKKP9xHw', genre: 'Dubstep' },
      { title: 'Still Getting It', artist: 'Foreign Beggars ft. Skrillex', videoId: 'bw2o_Go4QWI', genre: 'Dubstep' },
      { title: 'Bassline Kickin', artist: 'Zomboy', videoId: 'aUv6nHrjxM8', genre: 'Dubstep' },
      { title: 'Like A Bitch', artist: 'Zomboy', videoId: 'RIjHlJfXzSk', genre: 'Dubstep' },
      { title: 'Louder', artist: 'Doctor P & Flux Pavilion', videoId: 'rMR8Oo_pvqM', genre: 'Dubstep' },
      { title: 'Tetris', artist: 'Doctor P', videoId: 'OBq8bqPwV68', genre: 'Dubstep' },
      { title: 'Core', artist: 'RL Grime', videoId: 'sbawxvG3lo0', genre: 'Dubstep' },
      { title: 'Tell Me', artist: 'RL Grime', videoId: 'E_Qj45GfsFg', genre: 'Dubstep' },
      { title: 'Midnight Tyrannosaurus Mix', artist: 'Midnight T', videoId: '0VG1aP3ym30', genre: 'Dubstep' },
    ]
  },
  {
    name: 'Jazz',
    icon: '🎷',
    songs: [
      { title: 'Take Five', artist: 'Dave Brubeck', videoId: 'vmDDOFXSgAs', genre: 'Jazz' },
      { title: 'So What', artist: 'Miles Davis', videoId: 'ylXk1LBvIqU', genre: 'Jazz' },
      { title: 'Blue in Green', artist: 'Miles Davis', videoId: 'PoPL7BExSQU', genre: 'Jazz' },
      { title: 'My Favorite Things', artist: 'John Coltrane', videoId: 'qWG2dsXV5HI', genre: 'Jazz' },
      { title: 'A Love Supreme', artist: 'John Coltrane', videoId: 'll3CMgiUPuU', genre: 'Jazz' },
      { title: 'All Blues', artist: 'Miles Davis', videoId: '-488UORrfJ0', genre: 'Jazz' },
      { title: 'Fly Me to the Moon', artist: 'Frank Sinatra', videoId: 'ZEcqHA7dbwM', genre: 'Jazz' },
      { title: 'What a Wonderful World', artist: 'Louis Armstrong', videoId: 'VqhCQZaH4Vs', genre: 'Jazz' },
      { title: 'Autumn Leaves', artist: 'Nat King Cole', videoId: 'PxNfY1GwEP4', genre: 'Jazz' },
      { title: 'Round Midnight', artist: 'Thelonious Monk', videoId: 'ojtuDUbRoxI', genre: 'Jazz' },
      { title: 'Summertime', artist: 'Ella Fitzgerald', videoId: 'ysov6iV2vLs', genre: 'Jazz' },
      { title: 'Feeling Good', artist: 'Nina Simone', videoId: 'D5Y11hwjMNs', genre: 'Jazz' },
      { title: 'Misty', artist: 'Erroll Garner', videoId: '9UmLsu0Z3L8', genre: 'Jazz' },
      { title: 'In a Sentimental Mood', artist: 'Duke Ellington', videoId: 'klCj8YybS5A', genre: 'Jazz' },
      { title: 'Strange Fruit', artist: 'Billie Holiday', videoId: 'Web007rzSOI', genre: 'Jazz' },
      { title: 'Watermelon Man', artist: 'Herbie Hancock', videoId: '4bjPlBC4h_8', genre: 'Jazz' },
      { title: 'Cantaloupe Island', artist: 'Herbie Hancock', videoId: '8B1oIXGX0Io', genre: 'Jazz' },
      { title: 'Girl from Ipanema', artist: 'Stan Getz', videoId: 'j8VPmtyLqSY', genre: 'Jazz' },
      { title: 'Cafe Music Radio', artist: 'Cafe Music BGM', videoId: 'Dx5qFachd3A', genre: 'Jazz' },
      { title: 'Smooth Jazz Radio', artist: 'Smooth Jazz', videoId: 'M0gvVZs0wTA', genre: 'Jazz' },
    ]
  },
  {
    name: 'Pop',
    icon: '🎵',
    songs: [
      { title: 'Blinding Lights', artist: 'The Weeknd', videoId: '4NRXx6U8ABQ', genre: 'Pop' },
      { title: 'Shape of You', artist: 'Ed Sheeran', videoId: 'JGwWNGJdvx8', genre: 'Pop' },
      { title: 'Uptown Funk', artist: 'Bruno Mars', videoId: 'OPf0YbXqDm0', genre: 'Pop' },
      { title: 'Bad Guy', artist: 'Billie Eilish', videoId: 'DyDfgMOUjCI', genre: 'Pop' },
      { title: 'Dance Monkey', artist: 'Tones and I', videoId: 'q0hyYWKXF0Q', genre: 'Pop' },
      { title: 'Someone You Loved', artist: 'Lewis Capaldi', videoId: 'zABLecsR5UE', genre: 'Pop' },
      { title: 'Shallow', artist: 'Lady Gaga & Bradley Cooper', videoId: 'bo_efYhYU2A', genre: 'Pop' },
      { title: 'Perfect', artist: 'Ed Sheeran', videoId: '2Vv-BfVoq4g', genre: 'Pop' },
      { title: 'Havana', artist: 'Camila Cabello', videoId: 'BQ0mxQXmLsk', genre: 'Pop' },
      { title: 'Drivers License', artist: 'Olivia Rodrigo', videoId: 'ZmDBbnmKpqQ', genre: 'Pop' },
      { title: 'Levitating', artist: 'Dua Lipa', videoId: 'TUVcZfQe-Kw', genre: 'Pop' },
      { title: 'Don\'t Start Now', artist: 'Dua Lipa', videoId: 'oygrmJFKYZY', genre: 'Pop' },
      { title: 'Watermelon Sugar', artist: 'Harry Styles', videoId: 'E07s5ZYygMg', genre: 'Pop' },
      { title: 'As It Was', artist: 'Harry Styles', videoId: 'H5v3kku4y6Q', genre: 'Pop' },
      { title: 'Anti-Hero', artist: 'Taylor Swift', videoId: 'b1kbLwvqugk', genre: 'Pop' },
      { title: 'Shake It Off', artist: 'Taylor Swift', videoId: 'nfWlot6h_JM', genre: 'Pop' },
      { title: 'Blank Space', artist: 'Taylor Swift', videoId: 'e-ORhEE9VVg', genre: 'Pop' },
      { title: 'Rolling in the Deep', artist: 'Adele', videoId: 'rYEDA3JcQqw', genre: 'Pop' },
      { title: 'Hello', artist: 'Adele', videoId: 'YQHsXMglC9A', genre: 'Pop' },
      { title: 'Easy On Me', artist: 'Adele', videoId: 'U3ASj1L6_sY', genre: 'Pop' },
    ]
  },
  {
    name: 'R&B',
    icon: '💜',
    songs: [
      { title: 'Blinding Lights', artist: 'The Weeknd', videoId: '4NRXx6U8ABQ', genre: 'R&B' },
      { title: 'Save Your Tears', artist: 'The Weeknd', videoId: 'XXYlFuWEuKI', genre: 'R&B' },
      { title: 'Starboy', artist: 'The Weeknd', videoId: '34Na4j8AVgA', genre: 'R&B' },
      { title: 'The Hills', artist: 'The Weeknd', videoId: 'yzTuBuRdAyA', genre: 'R&B' },
      { title: 'Earned It', artist: 'The Weeknd', videoId: 'waU75jdUnYw', genre: 'R&B' },
      { title: 'Redbone', artist: 'Childish Gambino', videoId: 'Kp7eSUzdc0E', genre: 'R&B' },
      { title: 'Location', artist: 'Khalid', videoId: 'by3yRdlQvzs', genre: 'R&B' },
      { title: 'Young Dumb & Broke', artist: 'Khalid', videoId: 'IPfJnp1guPc', genre: 'R&B' },
      { title: 'Talk', artist: 'Khalid', videoId: 'hE2Ira-Cwxo', genre: 'R&B' },
      { title: 'Best Part', artist: 'Daniel Caesar ft. H.E.R.', videoId: 'vBy7FaapGRo', genre: 'R&B' },
      { title: 'Get You', artist: 'Daniel Caesar ft. Kali Uchis', videoId: 'uQFVqltOXRg', genre: 'R&B' },
      { title: 'Focus', artist: 'H.E.R.', videoId: 'l5qb5eL8uJg', genre: 'R&B' },
      { title: 'Drunk in Love', artist: 'Beyoncé', videoId: 'p1JPKLa-Ofc', genre: 'R&B' },
      { title: 'Crazy in Love', artist: 'Beyoncé', videoId: 'ViwtNLUqkMY', genre: 'R&B' },
      { title: 'Formation', artist: 'Beyoncé', videoId: 'WDZJPJV__bQ', genre: 'R&B' },
      { title: 'No Guidance', artist: 'Chris Brown ft. Drake', videoId: 'AoE0rlEf-iQ', genre: 'R&B' },
      { title: 'Go Crazy', artist: 'Chris Brown & Young Thug', videoId: 'VTn9QLnftnY', genre: 'R&B' },
      { title: 'Needed Me', artist: 'Rihanna', videoId: 'cMPoHEf9K4g', genre: 'R&B' },
      { title: 'Work', artist: 'Rihanna ft. Drake', videoId: 'HL1UzIK-flA', genre: 'R&B' },
      { title: 'Kiss It Better', artist: 'Rihanna', videoId: '49lY0HqqUVc', genre: 'R&B' },
    ]
  },
  {
    name: 'Synthwave',
    icon: '🌆',
    songs: [
      { title: 'Nightcall', artist: 'Kavinsky', videoId: 'MV_3Dpw-BRY', genre: 'Synthwave' },
      { title: 'A Real Hero', artist: 'College & Electric Youth', videoId: '-DSVDcw6iW8', genre: 'Synthwave' },
      { title: 'Tech Noir', artist: 'Gunship', videoId: 'c80dWbiOR0Y', genre: 'Synthwave' },
      { title: 'Dark All Day', artist: 'Gunship', videoId: '60ruvzfXQoE', genre: 'Synthwave' },
      { title: 'Resonance', artist: 'Home', videoId: '8GW6sLrK40k', genre: 'Synthwave' },
      { title: 'Turbo Killer', artist: 'Carpenter Brut', videoId: 'er416Ad3R1g', genre: 'Synthwave' },
      { title: 'Le Perv', artist: 'Carpenter Brut', videoId: 'RYtVf0wvPpc', genre: 'Synthwave' },
      { title: 'Roller Mobster', artist: 'Carpenter Brut', videoId: 'qFfybn_W8Ak', genre: 'Synthwave' },
      { title: 'Blood Red', artist: 'Waterfront Dining', videoId: 'PuQe8_L0E2E', genre: 'Synthwave' },
      { title: 'Blizzard', artist: 'Kavinsky', videoId: 'a2CUUloT2YA', genre: 'Synthwave' },
      { title: 'Odd Look', artist: 'Kavinsky', videoId: 'qT0iQRjHbW4', genre: 'Synthwave' },
      { title: 'Crystals', artist: 'M.O.O.N.', videoId: '-8X0sJJRKq0', genre: 'Synthwave' },
      { title: 'Hydrogen', artist: 'M.O.O.N.', videoId: 'oKD-MVfC9Ag', genre: 'Synthwave' },
      { title: 'The Encounter', artist: 'Danger', videoId: '0J5PsKR5QHM', genre: 'Synthwave' },
      { title: 'Sunset', artist: 'The Midnight', videoId: 'w2D4iCzRW7E', genre: 'Synthwave' },
      { title: 'Los Angeles', artist: 'The Midnight', videoId: 'E71DLWB50jU', genre: 'Synthwave' },
      { title: 'Daytona', artist: 'Lazerhawk', videoId: 'Ewe5rKP2EpQ', genre: 'Synthwave' },
      { title: 'Overdrive', artist: 'Lazerhawk', videoId: 'Pkj9yxd6XCA', genre: 'Synthwave' },
      { title: 'Synthwave Radio', artist: 'Synthwave Goose', videoId: '4xDzrJKXOOY', genre: 'Synthwave' },
      { title: 'Electric Dreams', artist: 'Synthwave Mix', videoId: 'rDBbaGCCIhk', genre: 'Synthwave' },
    ]
  },
  {
    name: 'Classical',
    icon: '🎻',
    songs: [
      { title: 'Für Elise', artist: 'Beethoven', videoId: '_mVW8tgGY_w', genre: 'Classical' },
      { title: 'Moonlight Sonata', artist: 'Beethoven', videoId: '4Tr0otuiQuU', genre: 'Classical' },
      { title: 'Symphony No. 5', artist: 'Beethoven', videoId: 'fOk8Tm815lE', genre: 'Classical' },
      { title: 'Canon in D', artist: 'Pachelbel', videoId: 'NlprozGcs80', genre: 'Classical' },
      { title: 'Four Seasons - Spring', artist: 'Vivaldi', videoId: 'l-dYNttdgl0', genre: 'Classical' },
      { title: 'Four Seasons - Winter', artist: 'Vivaldi', videoId: 'TZCfydWF48c', genre: 'Classical' },
      { title: 'Clair de Lune', artist: 'Debussy', videoId: 'CvFH_6DNRCY', genre: 'Classical' },
      { title: 'Nocturne Op. 9 No. 2', artist: 'Chopin', videoId: '9E6b3swbnWg', genre: 'Classical' },
      { title: 'Waltz in C# Minor', artist: 'Chopin', videoId: 'hOcryGEw1NY', genre: 'Classical' },
      { title: 'Swan Lake', artist: 'Tchaikovsky', videoId: '9cNQFB0TDfY', genre: 'Classical' },
      { title: 'The Nutcracker Suite', artist: 'Tchaikovsky', videoId: 'M8J8urC_8Jw', genre: 'Classical' },
      { title: 'Eine Kleine Nachtmusik', artist: 'Mozart', videoId: 'oy2zDJPIgwc', genre: 'Classical' },
      { title: 'Requiem - Lacrimosa', artist: 'Mozart', videoId: 'k1-TrAvp_xs', genre: 'Classical' },
      { title: 'The Blue Danube', artist: 'Strauss', videoId: '_CTYymbbEL4', genre: 'Classical' },
      { title: 'In the Hall of the Mountain King', artist: 'Grieg', videoId: 'kLp_Hh6DKWc', genre: 'Classical' },
      { title: 'Ride of the Valkyries', artist: 'Wagner', videoId: 'GGU1P6lBW6Q', genre: 'Classical' },
      { title: 'Habanera - Carmen', artist: 'Bizet', videoId: 'K2snTkaD64U', genre: 'Classical' },
      { title: 'Air on the G String', artist: 'Bach', videoId: 'pzlw6fUux4o', genre: 'Classical' },
      { title: 'Toccata and Fugue', artist: 'Bach', videoId: 'ho9rZjlsyYY', genre: 'Classical' },
      { title: 'Classical Piano Radio', artist: 'Rousseau', videoId: 'klPZIGQcrHA', genre: 'Classical' },
    ]
  },
  {
    name: 'Trap',
    icon: '🔊',
    songs: [
      { title: 'Goosebumps', artist: 'Travis Scott', videoId: 'Dst9gZkq1a8', genre: 'Trap' },
      { title: 'Highest in the Room', artist: 'Travis Scott', videoId: 'tfSS1e3kYeo', genre: 'Trap' },
      { title: 'HUMBLE.', artist: 'Kendrick Lamar', videoId: 'tvTRZJ-4EyI', genre: 'Trap' },
      { title: 'Bad and Boujee', artist: 'Migos', videoId: 'S-sJp1FfG7Q', genre: 'Trap' },
      { title: 'T-Shirt', artist: 'Migos', videoId: 'Z-ou1wYh-GY', genre: 'Trap' },
      { title: 'Versace', artist: 'Migos', videoId: 'rF-hq_CHNH0', genre: 'Trap' },
      { title: 'XO Tour Llif3', artist: 'Lil Uzi Vert', videoId: 'WrsFXgQk5UI', genre: 'Trap' },
      { title: 'Money Longer', artist: 'Lil Uzi Vert', videoId: '1eoVcSIJ-7U', genre: 'Trap' },
      { title: 'March Madness', artist: 'Future', videoId: '6Prfg3vyZkA', genre: 'Trap' },
      { title: 'Mask Off', artist: 'Future', videoId: 'xvZqHgFz51I', genre: 'Trap' },
      { title: 'Gucci Gang', artist: 'Lil Pump', videoId: '4LfJnj66HVQ', genre: 'Trap' },
      { title: 'ESSKEETIT', artist: 'Lil Pump', videoId: 'A7Ury2mVkVs', genre: 'Trap' },
      { title: 'I\'m The One', artist: 'DJ Khaled', videoId: 'weeI1G46q0o', genre: 'Trap' },
      { title: 'Wild Thoughts', artist: 'DJ Khaled', videoId: 'fyMhvkC3A84', genre: 'Trap' },
      { title: 'Congratulations', artist: 'Post Malone', videoId: 'SC4xMk98Pdc', genre: 'Trap' },
      { title: 'White Iverson', artist: 'Post Malone', videoId: 'SLsTskUWUP4', genre: 'Trap' },
      { title: 'rockstar', artist: 'Post Malone', videoId: 'UceaB4D0jpo', genre: 'Trap' },
      { title: 'Drip Too Hard', artist: 'Lil Baby & Gunna', videoId: 'THChnxOzV3w', genre: 'Trap' },
      { title: 'Yes Indeed', artist: 'Lil Baby & Drake', videoId: 'VeCptbAqjW8', genre: 'Trap' },
      { title: 'Woah', artist: 'Lil Baby', videoId: 'Qdf2EiQpHCU', genre: 'Trap' },
    ]
  },
];

// Get all songs flattened
export const getAllSongs = (): Song[] => {
  return MUSIC_LIBRARY.flatMap(genre => genre.songs);
};

// Get songs by genre
export const getSongsByGenre = (genreName: string): Song[] => {
  const genre = MUSIC_LIBRARY.find(g => g.name.toLowerCase() === genreName.toLowerCase());
  return genre?.songs || [];
};

// Get a random song
export const getRandomSong = (): Song => {
  const allSongs = getAllSongs();
  return allSongs[Math.floor(Math.random() * allSongs.length)];
};

// Get album art URL from video ID
export const getAlbumArt = (videoId: string): string => {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
};
