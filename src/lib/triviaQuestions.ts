/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

// Trivia questions database
export interface TriviaQuestion {
  question: string;
  answer: string;
  alternatives?: string[]; // Alternative accepted answers
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  // Technology
  { question: "What does CPU stand for?", answer: "central processing unit", alternatives: ["cpu"], category: "Technology", difficulty: "easy", points: 10 },
  { question: "What programming language is known as the 'mother of all languages'?", answer: "c", alternatives: ["c language"], category: "Technology", difficulty: "easy", points: 10 },
  { question: "What year was the first iPhone released?", answer: "2007", category: "Technology", difficulty: "easy", points: 10 },
  { question: "What company created JavaScript?", answer: "netscape", alternatives: ["netscape communications"], category: "Technology", difficulty: "medium", points: 20 },
  { question: "What does HTML stand for?", answer: "hypertext markup language", alternatives: ["html"], category: "Technology", difficulty: "easy", points: 10 },
  { question: "Who is the founder of Microsoft?", answer: "bill gates", alternatives: ["gates", "bill gates and paul allen"], category: "Technology", difficulty: "easy", points: 10 },
  { question: "What was the first computer virus called?", answer: "creeper", alternatives: ["the creeper"], category: "Technology", difficulty: "hard", points: 30 },
  { question: "What does RAM stand for?", answer: "random access memory", alternatives: ["ram"], category: "Technology", difficulty: "easy", points: 10 },
  { question: "In what year was Bitcoin created?", answer: "2009", category: "Technology", difficulty: "medium", points: 20 },
  { question: "What programming language was created by Guido van Rossum?", answer: "python", category: "Technology", difficulty: "medium", points: 20 },

  // Science
  { question: "What is the chemical symbol for gold?", answer: "au", category: "Science", difficulty: "easy", points: 10 },
  { question: "How many planets are in our solar system?", answer: "8", alternatives: ["eight"], category: "Science", difficulty: "easy", points: 10 },
  { question: "What is the largest organ in the human body?", answer: "skin", alternatives: ["the skin"], category: "Science", difficulty: "easy", points: 10 },
  { question: "What gas do plants absorb from the atmosphere?", answer: "carbon dioxide", alternatives: ["co2"], category: "Science", difficulty: "easy", points: 10 },
  { question: "What is the speed of light in km/s (approximately)?", answer: "300000", alternatives: ["300,000", "299792"], category: "Science", difficulty: "hard", points: 30 },
  { question: "What is the hardest natural substance on Earth?", answer: "diamond", category: "Science", difficulty: "easy", points: 10 },
  { question: "What planet is known as the Red Planet?", answer: "mars", category: "Science", difficulty: "easy", points: 10 },
  { question: "What is the smallest bone in the human body?", answer: "stapes", alternatives: ["stirrup"], category: "Science", difficulty: "hard", points: 30 },

  // History
  { question: "In what year did World War II end?", answer: "1945", category: "History", difficulty: "easy", points: 10 },
  { question: "Who was the first President of the United States?", answer: "george washington", alternatives: ["washington"], category: "History", difficulty: "easy", points: 10 },
  { question: "What ancient wonder was located in Alexandria?", answer: "lighthouse", alternatives: ["the lighthouse", "pharos", "lighthouse of alexandria"], category: "History", difficulty: "medium", points: 20 },
  { question: "Who painted the Mona Lisa?", answer: "leonardo da vinci", alternatives: ["da vinci", "davinci"], category: "History", difficulty: "easy", points: 10 },
  { question: "What year did the Titanic sink?", answer: "1912", category: "History", difficulty: "easy", points: 10 },
  { question: "Who was the first person to walk on the moon?", answer: "neil armstrong", alternatives: ["armstrong"], category: "History", difficulty: "easy", points: 10 },
  { question: "What empire was ruled by Julius Caesar?", answer: "roman", alternatives: ["rome", "roman empire"], category: "History", difficulty: "easy", points: 10 },

  // Geography
  { question: "What is the capital of Japan?", answer: "tokyo", category: "Geography", difficulty: "easy", points: 10 },
  { question: "What is the longest river in the world?", answer: "nile", alternatives: ["the nile", "nile river"], category: "Geography", difficulty: "easy", points: 10 },
  { question: "What is the largest country by area?", answer: "russia", category: "Geography", difficulty: "easy", points: 10 },
  { question: "What ocean is the largest?", answer: "pacific", alternatives: ["pacific ocean"], category: "Geography", difficulty: "easy", points: 10 },
  { question: "What is the capital of Australia?", answer: "canberra", category: "Geography", difficulty: "medium", points: 20 },
  { question: "How many continents are there?", answer: "7", alternatives: ["seven"], category: "Geography", difficulty: "easy", points: 10 },
  { question: "What is the smallest country in the world?", answer: "vatican city", alternatives: ["vatican"], category: "Geography", difficulty: "medium", points: 20 },

  // Entertainment
  { question: "What is the name of Harry Potter's owl?", answer: "hedwig", category: "Entertainment", difficulty: "easy", points: 10 },
  { question: "What movie features the character Jack Sparrow?", answer: "pirates of the caribbean", alternatives: ["pirates"], category: "Entertainment", difficulty: "easy", points: 10 },
  { question: "Who played Iron Man in the MCU?", answer: "robert downey jr", alternatives: ["robert downey junior", "rdj"], category: "Entertainment", difficulty: "easy", points: 10 },
  { question: "What is the highest-grossing film of all time?", answer: "avatar", category: "Entertainment", difficulty: "medium", points: 20 },
  { question: "What band was Freddie Mercury the lead singer of?", answer: "queen", category: "Entertainment", difficulty: "easy", points: 10 },
  { question: "In what year was the first Star Wars movie released?", answer: "1977", category: "Entertainment", difficulty: "medium", points: 20 },

  // Sports
  { question: "How many players are on a soccer team?", answer: "11", alternatives: ["eleven"], category: "Sports", difficulty: "easy", points: 10 },
  { question: "What country has won the most FIFA World Cups?", answer: "brazil", category: "Sports", difficulty: "easy", points: 10 },
  { question: "What sport is played at Wimbledon?", answer: "tennis", category: "Sports", difficulty: "easy", points: 10 },
  { question: "How many rings are on the Olympic flag?", answer: "5", alternatives: ["five"], category: "Sports", difficulty: "easy", points: 10 },
  { question: "What is the highest score in a single frame of bowling?", answer: "30", alternatives: ["thirty"], category: "Sports", difficulty: "hard", points: 30 },
  { question: "Who holds the record for most Grand Slam tennis titles (men)?", answer: "novak djokovic", alternatives: ["djokovic"], category: "Sports", difficulty: "medium", points: 20 },

  // Music
  { question: "What instrument has 88 keys?", answer: "piano", category: "Music", difficulty: "easy", points: 10 },
  { question: "What city is the birthplace of jazz?", answer: "new orleans", category: "Music", difficulty: "medium", points: 20 },
  { question: "Who is known as the 'King of Pop'?", answer: "michael jackson", alternatives: ["jackson", "mj"], category: "Music", difficulty: "easy", points: 10 },
  { question: "How many strings does a standard guitar have?", answer: "6", alternatives: ["six"], category: "Music", difficulty: "easy", points: 10 },
  { question: "What year did Elvis Presley die?", answer: "1977", category: "Music", difficulty: "hard", points: 30 },
];

export const getRandomQuestion = (): TriviaQuestion => {
  const index = Math.floor(Math.random() * TRIVIA_QUESTIONS.length);
  return TRIVIA_QUESTIONS[index];
};

export const checkAnswer = (question: TriviaQuestion, userAnswer: string): boolean => {
  const normalizedAnswer = userAnswer.toLowerCase().trim();
  const correctAnswer = question.answer.toLowerCase().trim();
  
  // Check exact match
  if (normalizedAnswer === correctAnswer) return true;
  
  // Check alternatives
  if (question.alternatives) {
    for (const alt of question.alternatives) {
      if (normalizedAnswer === alt.toLowerCase().trim()) return true;
    }
  }
  
  // Check if answer contains the correct answer (for longer responses)
  if (normalizedAnswer.includes(correctAnswer) && correctAnswer.length > 3) return true;
  
  return false;
};
