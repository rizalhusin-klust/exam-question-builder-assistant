// Mock database of exam questions for various subjects, topics, and difficulties.
// These are used by the AI simulation generator to give high-quality, realistic results.
const mockQuestionsDatabase = [
  // --- MATHEMATICS ---
  {
    text: "Solve for x in the quadratic equation: x² - 5x + 6 = 0.",
    type: "multiple-choice",
    options: ["x = 2 or x = 3", "x = -2 or x = -3", "x = 1 or x = 5", "x = 0 or x = 6"],
    answer: 0,
    points: 5,
    difficulty: "Medium",
    subject: "Mathematics",
    topic: "Algebra",
    explanation: "By factoring the quadratic equation, we get (x - 2)(x - 3) = 0. Therefore, the roots are x = 2 and x = 3."
  },
  {
    text: "Find the derivative of f(x) = 3x³ - 5x² + 2x - 7 with respect to x.",
    type: "short-answer",
    options: [],
    answer: "9x² - 10x + 2",
    points: 5,
    difficulty: "Hard",
    subject: "Mathematics",
    topic: "Calculus",
    explanation: "Using the power rule for derivatives: d/dx(x^n) = n*x^(n-1). Applying this to each term yields 9x² - 10x + 2."
  },
  {
    text: "The sum of the interior angles of a triangle is always 180 degrees.",
    type: "true-false",
    options: ["True", "False"],
    answer: 0,
    points: 2,
    difficulty: "Easy",
    subject: "Mathematics",
    topic: "Geometry",
    explanation: "In Euclidean geometry, the sum of angles in any triangle is exactly 180 degrees (or pi radians)."
  },
  {
    text: "What is the area of a circle with a radius of 7 cm? (Use π ≈ 22/7)",
    type: "multiple-choice",
    options: ["154 cm²", "44 cm²", "49 cm²", "98 cm²"],
    answer: 0,
    points: 3,
    difficulty: "Easy",
    subject: "Mathematics",
    topic: "Geometry",
    explanation: "Area = πr² = (22/7) * 7 * 7 = 154 cm²."
  },
  {
    text: "If a matrix A has dimensions 3x2 and matrix B has dimensions 2x4, what are the dimensions of the product matrix AB?",
    type: "multiple-choice",
    options: ["3x4", "2x2", "4x3", "Matrix multiplication is undefined"],
    answer: 0,
    points: 5,
    difficulty: "Medium",
    subject: "Mathematics",
    topic: "Linear Algebra",
    explanation: "When multiplying an m x n matrix by an n x p matrix, the resulting matrix has dimensions m x p. Here, 3x2 multiplied by 2x4 results in a 3x4 matrix."
  },

  // --- SCIENCE ---
  {
    text: "Which organelle is known as the powerhouse of the cell?",
    type: "multiple-choice",
    options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi Apparatus"],
    answer: 2,
    points: 2,
    difficulty: "Easy",
    subject: "Science",
    topic: "Biology",
    explanation: "Mitochondria are responsible for generating chemical energy in the form of ATP, making them the 'powerhouse' of the cell."
  },
  {
    text: "DNA replication occurs in the ________ phase of the cell cycle.",
    type: "fill-in-the-blank",
    options: [],
    answer: "S (Synthesis)",
    points: 4,
    difficulty: "Medium",
    subject: "Science",
    topic: "Biology",
    explanation: "DNA replication occurs during the S phase (Synthesis phase) of interphase, preceding mitosis or meiosis."
  },
  {
    text: "Light travels faster in a vacuum than through a glass prism.",
    type: "true-false",
    options: ["True", "False"],
    answer: 0,
    points: 2,
    difficulty: "Easy",
    subject: "Science",
    topic: "Physics",
    explanation: "Light travels at its maximum speed (c ≈ 3 x 10^8 m/s) in a vacuum. In materials like glass, the refractive index decreases its speed."
  },
  {
    text: "What is the chemical formula for photosynthesis?",
    type: "short-answer",
    options: [],
    answer: "6CO₂ + 6H₂O + light energy -> C₆H₁₂O₆ + 6O₂",
    points: 7,
    difficulty: "Hard",
    subject: "Science",
    topic: "Chemistry / Biology",
    explanation: "Photosynthesis converts carbon dioxide and water into glucose and oxygen using light energy absorbed by chlorophyll."
  },
  {
    text: "An element has an atomic number of 17. Which group of the periodic table does it belong to?",
    type: "multiple-choice",
    options: ["Noble Gases", "Halogens", "Alkali Metals", "Alkaline Earth Metals"],
    answer: 1,
    points: 4,
    difficulty: "Medium",
    subject: "Science",
    topic: "Chemistry",
    explanation: "Atomic number 17 is Chlorine, which has 7 valence electrons and belongs to Group 17 (Halogens)."
  },

  // --- HISTORY ---
  {
    text: "In which year did the United States declare independence from Great Britain?",
    type: "multiple-choice",
    options: ["1776", "1789", "1765", "1812"],
    answer: 0,
    points: 2,
    difficulty: "Easy",
    subject: "History",
    topic: "American History",
    explanation: "The Declaration of Independence was adopted by the Continental Congress on July 4, 1776."
  },
  {
    text: "Who was the first Emperor of the Roman Empire?",
    type: "multiple-choice",
    options: ["Julius Caesar", "Augustus (Octavian)", "Nero", "Marcus Aurelius"],
    answer: 1,
    points: 4,
    difficulty: "Medium",
    subject: "History",
    topic: "Ancient Rome",
    explanation: "Following the fall of the Roman Republic, Julius Caesar's adopted son Octavian became the first Roman Emperor in 27 BC, taking the name Augustus."
  },
  {
    text: "The Magna Carta was signed by King John in the year 1215.",
    type: "true-false",
    options: ["True", "False"],
    answer: 0,
    points: 3,
    difficulty: "Medium",
    subject: "History",
    topic: "European History",
    explanation: "King John of England was forced by his barons to sign the Magna Carta (Great Charter) at Runnymede in June 1215, establishing the principle that everyone, including the king, is subject to the law."
  },
  {
    text: "What was the main cause of the Peloponnesian War?",
    type: "short-answer",
    options: [],
    answer: "The growth of Athenian power and the fear it caused in Sparta.",
    points: 6,
    difficulty: "Hard",
    subject: "History",
    topic: "Ancient Greece",
    explanation: "According to historian Thucydides, the primary catalyst was Spartan anxiety over the rapid expansion and imperial dominance of Athens and its Delian League."
  },
  {
    text: "Which civilization built the ancient city of Machu Picchu?",
    type: "multiple-choice",
    options: ["Aztecs", "Mayans", "Incas", "Olmecs"],
    answer: 2,
    points: 2,
    difficulty: "Easy",
    subject: "History",
    topic: "World History",
    explanation: "Machu Picchu is a 15th-century Inca citadel located in the Eastern Cordillera of southern Peru."
  },

  // --- LITERATURE ---
  {
    text: "Who wrote the tragedy play 'Romeo and Juliet'?",
    type: "multiple-choice",
    options: ["William Shakespeare", "Christopher Marlowe", "John Milton", "Geoffrey Chaucer"],
    answer: 0,
    points: 2,
    difficulty: "Easy",
    subject: "Literature",
    topic: "Shakespeare",
    explanation: "Romeo and Juliet is an early tragedy written by William Shakespeare around 1595-1597."
  },
  {
    text: "Which novel opens with the famous line: 'It was the best of times, it was the worst of times'?",
    type: "multiple-choice",
    options: ["Great Expectations", "A Tale of Two Cities", "Oliver Twist", "David Copperfield"],
    answer: 1,
    points: 4,
    difficulty: "Medium",
    subject: "Literature",
    topic: "Victorian Literature",
    explanation: "This classic opening line is from Charles Dickens' 1859 historical novel 'A Tale of Two Cities', set in London and Paris before and during the French Revolution."
  },
  {
    text: "In George Orwell's 'Animal Farm', the pigs represent the ruling class of the Soviet Union.",
    type: "true-false",
    options: ["True", "False"],
    answer: 0,
    points: 3,
    difficulty: "Easy",
    subject: "Literature",
    topic: "Modern Literature",
    explanation: "Orwell's novella is an allegorical satire where the animals mirror the events leading up to the Russian Revolution of 1917 and the subsequent Stalinist era of the Soviet Union."
  },
  {
    text: "What literary device is used in the phrase: 'The wind whispered through the dark trees'?",
    type: "multiple-choice",
    options: ["Metaphor", "Personification", "Alliteration", "Onomatopoeia"],
    answer: 1,
    points: 3,
    difficulty: "Easy",
    subject: "Literature",
    topic: "Literary Devices",
    explanation: "Personification is when human qualities (whispering) are given to non-human things (the wind)."
  },
  {
    text: "Name the captain of the Pequod in Herman Melville's novel 'Moby-Dick'.",
    type: "short-answer",
    options: [],
    answer: "Captain Ahab",
    points: 5,
    difficulty: "Medium",
    subject: "Literature",
    topic: "American Classics",
    explanation: "Captain Ahab is the monomaniacal commander of the whaling ship Pequod, obsessed with killing the white whale Moby Dick."
  }
];

// If window is defined, export it globally. Otherwise export it (for modular Node contexts if needed).
if (typeof window !== 'undefined') {
  window.mockQuestionsDatabase = mockQuestionsDatabase;
} else if (typeof module !== 'undefined') {
  module.exports = mockQuestionsDatabase;
}

export { mockQuestionsDatabase };

