// ============================================================
// src/_mock/dummyQuizzes.ts
// Pre-built quiz datasets for quick-fill during testing/demos
// ============================================================

export interface QuestionInput {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
}

export interface DummyQuizSet {
  label: string;
  title: string;
  level: string;
  semester: string;
  eduStream: string;
  timeLimit: number;
  questions: QuestionInput[];
}

export const DUMMY_QUIZZES: DummyQuizSet[] = [
  {
    label: '📗 Data Structures — Level 2 Sem 1',
    title: 'Data Structures Mid-Term Quiz',
    level: '2',
    semester: 'semester-1',
    eduStream: 'CMIS',
    timeLimit: 15,
    questions: [
      { question_text: 'What is the time complexity of accessing an element in an array by index?', option_a: 'O(1)', option_b: 'O(n)', option_c: 'O(log n)', option_d: 'O(n²)', correct_option: 'A' },
      { question_text: 'Which data structure uses FIFO (First In, First Out) principle?', option_a: 'Stack', option_b: 'Queue', option_c: 'Tree', option_d: 'Graph', correct_option: 'B' },
      { question_text: 'What is the worst-case time complexity of Quick Sort?', option_a: 'O(n log n)', option_b: 'O(n)', option_c: 'O(n²)', option_d: 'O(log n)', correct_option: 'C' },
      { question_text: 'Which traversal of a Binary Search Tree gives nodes in sorted order?', option_a: 'Pre-order', option_b: 'Post-order', option_c: 'In-order', option_d: 'Level-order', correct_option: 'C' },
      { question_text: 'A stack can be used to convert:', option_a: 'Infix to Postfix', option_b: 'Binary to Decimal', option_c: 'Decimal to Octal', option_d: 'ASCII to Unicode', correct_option: 'A' },
      { question_text: 'What is the maximum number of nodes at level "l" of a binary tree?', option_a: '2l', option_b: '2^l', option_c: 'l²', option_d: '2l+1', correct_option: 'B' },
      { question_text: 'Which of the following is NOT a linear data structure?', option_a: 'Array', option_b: 'Linked List', option_c: 'Tree', option_d: 'Queue', correct_option: 'C' },
      { question_text: 'In a singly linked list, each node contains:', option_a: 'Only data', option_b: 'Data and two pointers', option_c: 'Data and one pointer', option_d: 'Only a pointer', correct_option: 'C' },
      { question_text: 'Hash collision can be resolved using:', option_a: 'Chaining', option_b: 'Sorting', option_c: 'Recursion', option_d: 'Backtracking', correct_option: 'A' },
      { question_text: 'The height of a complete binary tree with n nodes is:', option_a: 'n', option_b: 'n/2', option_c: 'log₂(n)', option_d: 'n log n', correct_option: 'C' },
    ],
  },
  {
    label: '📘 Web Engineering — Level 3 Sem 2',
    title: 'Web Engineering Final Quiz',
    level: '3',
    semester: 'semester-2',
    eduStream: 'IMGT',
    timeLimit: 20,
    questions: [
      { question_text: 'What does HTML stand for?', option_a: 'Hyper Text Markup Language', option_b: 'High Tech Modern Language', option_c: 'Hyper Transfer Markup Language', option_d: 'Home Tool Markup Language', correct_option: 'A' },
      { question_text: 'Which CSS property is used to change text color?', option_a: 'font-color', option_b: 'text-color', option_c: 'color', option_d: 'foreground', correct_option: 'C' },
      { question_text: 'Which HTTP method is used to update an existing resource?', option_a: 'GET', option_b: 'POST', option_c: 'PUT', option_d: 'DELETE', correct_option: 'C' },
      { question_text: 'What does REST stand for?', option_a: 'Representational State Transfer', option_b: 'Remote Execution Service Technology', option_c: 'Reliable Endpoint Service Tool', option_d: 'Resource State Transformation', correct_option: 'A' },
      { question_text: 'Which JavaScript keyword declares a block-scoped variable?', option_a: 'var', option_b: 'let', option_c: 'function', option_d: 'define', correct_option: 'B' },
      { question_text: 'What is the default port for HTTPS?', option_a: '80', option_b: '8080', option_c: '443', option_d: '3000', correct_option: 'C' },
      { question_text: 'Which React hook is used for side effects?', option_a: 'useState', option_b: 'useEffect', option_c: 'useRef', option_d: 'useMemo', correct_option: 'B' },
      { question_text: 'What does JSON stand for?', option_a: 'JavaScript Object Notation', option_b: 'Java Source Open Network', option_c: 'JavaScript Online Namespace', option_d: 'Java Standard Object Naming', correct_option: 'A' },
      { question_text: 'Which status code means "Not Found"?', option_a: '200', option_b: '301', option_c: '404', option_d: '500', correct_option: 'C' },
      { question_text: 'In CSS, which selector has the highest specificity?', option_a: 'Element selector', option_b: 'Class selector', option_c: 'ID selector', option_d: 'Universal selector', correct_option: 'C' },
    ],
  },
  {
    label: '📙 Database Systems — Level 2 Sem 2',
    title: 'Database Systems Quiz',
    level: '2',
    semester: 'semester-2',
    eduStream: 'CMIS',
    timeLimit: 15,
    questions: [
      { question_text: 'What does SQL stand for?', option_a: 'Structured Query Language', option_b: 'Simple Query Language', option_c: 'Standard Question Language', option_d: 'Sequential Query Logic', correct_option: 'A' },
      { question_text: 'Which SQL statement is used to extract data from a database?', option_a: 'EXTRACT', option_b: 'GET', option_c: 'SELECT', option_d: 'PULL', correct_option: 'C' },
      { question_text: 'What is a primary key?', option_a: 'A key that allows duplicates', option_b: 'A unique identifier for each record', option_c: 'A foreign reference', option_d: 'An index type', correct_option: 'B' },
      { question_text: 'Which normal form eliminates transitive dependencies?', option_a: '1NF', option_b: '2NF', option_c: '3NF', option_d: 'BCNF', correct_option: 'C' },
      { question_text: 'What does ACID stand for in database transactions?', option_a: 'Atomicity, Consistency, Isolation, Durability', option_b: 'Access, Control, Integrity, Data', option_c: 'Atomic, Central, Independent, Durable', option_d: 'Add, Create, Insert, Delete', correct_option: 'A' },
      { question_text: 'Which JOIN returns all rows from both tables?', option_a: 'INNER JOIN', option_b: 'LEFT JOIN', option_c: 'RIGHT JOIN', option_d: 'FULL OUTER JOIN', correct_option: 'D' },
      { question_text: 'What is a foreign key?', option_a: 'A key from another country', option_b: 'A field that links two tables', option_c: 'A primary key duplicate', option_d: 'An encryption key', correct_option: 'B' },
      { question_text: 'Which command is used to remove all rows from a table without logging?', option_a: 'DELETE', option_b: 'DROP', option_c: 'TRUNCATE', option_d: 'REMOVE', correct_option: 'C' },
      { question_text: 'What is an ER diagram used for?', option_a: 'Error Resolution', option_b: 'Entity Relationship modeling', option_c: 'Encryption Rules', option_d: 'Execution Routing', correct_option: 'B' },
      { question_text: 'Which SQL clause is used to filter grouped results?', option_a: 'WHERE', option_b: 'HAVING', option_c: 'FILTER', option_d: 'GROUP BY', correct_option: 'B' },
    ],
  },
];
