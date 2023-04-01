// JavaScript Coding Quiz

// set the number of seconds per question and the penalty for a wrong answer
const secondsPerQuestion = 10;
const secondsPenalty = 10;

var startQuizButton=document.getElementById('start-button');
startQuizButton.addEventListener('click', startQuiz);

// create an element to receive events from the quiz timer
const TimerFinishedEvent = new Event('quizTimerFinished');
const TimerTickEvent = new Event('quizTimerTick');
const EndedQuestionsEvent = new Event('quizEndedQuestions');

document.addEventListener('quizTimerFinished', quizTimerFinished);
document.addEventListener('quizTimerTick', quizTimerTick);
document.addEventListener('quizEndedQuestions', quizEndedQuestions);

var answerDivs = document.getElementById('quiz-answers');
answerDivs.addEventListener('click', answerSelected);
const rootDirectory = location.origin;

console.log('The root directory is:', rootDirectory);

function answerSelected() {
  console.log(event.target.nodeName);
  if (event.target.nodeName === 'P') {
    const answerID=event.target.id;
    const answerIdentifier=answerID.substring(answerID.length - 1).toUpperCase();
    console.log(answerIdentifier);
    quizController.answerQuestion(answerIdentifier);
  }
  return;
};

// ----------  Class Definitions
// ----------  QuizController Class
/**
 * Represents the the rules and current state of the quiz
 * @param {number} timePerQuestion - the time allowed per question in seconds
 * @class
 */
class QuizController {
  constructor(timePerQuestion) {
    this.timePerQuestion = timePerQuestion;
    this.quizTotalTime = 0;
    this.currentQuestionIndex = 0;
    this.questions = new QuizQuestions();
    this.quizIsRunning = false;
  }

  startQuiz() {
  // reset the quiz, including loading/reloading the inbuilt questions
    this.resetQuiz();

    // calculate the time remaining based on the number of questions and the time per question
    this.quizTotalTime = this.timePerQuestion * this.questions.questions.length;
  }

  showQuestion() {
  // show the next question
    const question = this.questions.questions[this.currentQuestionIndex];
    document.getElementById('question').innerHTML = question.question;
    const answerIDs = ['A', 'B', 'C', 'D'];
    let quizAnswer;
    for (const answerID of answerIDs) {
      quizAnswer=question.answers.getAnswerByIdentifier(answerID);
      document.getElementById('answer-' + answerID.toLowerCase()).innerHTML = answerID + ' ' + quizAnswer.answer;
    }
    return;
  }

  answerQuestion(answerIdentifier) {
    if (this.quizIsRunning) {
      // choose the answer to this question
      console.log(this.currentQuestionIndex);
      const displayedQuestion = this.currentQuestion();
      displayedQuestion.storeAnswerByIdentifier(answerIdentifier);
      // check if the answer is correct
      if (displayedQuestion.userSelection.isCorrect) {
        // if so, let the user know
        document.getElementById('quiz-feedback').innerHTML = 'Correct!';
      } else {
        // if not, let the user know and penalise them
        document.getElementById('quiz-feedback').innerHTML = 'Incorrect!' + ' The correct answer is ' + displayedQuestion.getCorrectAnswer().answer;
        quizTimer.penaliseForWrongAnswer(secondsPenalty);
      };
      // move to the next question
      this.currentQuestionIndex++;
      if (this.currentQuestionIndex > this.questions.questions.length-1) {
        // end the quiz as have run out of questions
        document.dispatchEvent(EndedQuestionsEvent);
      } else {
        this.showQuestion();
      };
    }
  }

  currentQuestion() {
    if (this.currentQuestionIndex > this.questions.questions.length-1) {
      return null;
    } else {
      return this.questions.questions[this.currentQuestionIndex];
    }
  }

  endQuiz() {
    // end the quiz
    this.quizIsRunning = false;

    // calculate and the score
    return this.userScore();
  }

  userScore() {
  // calculate the score
    let score=0;
    for (const question of this.questions.questions) {
      if (question.questionHasBeenAnswered && question.userSelection.isCorrect) {
        score++;
      };
    };
    return score;
  }

  /**
 * Resets the quiz to its initial state so it can be played again
 * @return {void}
 */
  resetQuiz() {
    this.timeRemaining = 0; // the time remaining in seconds
    this.currentQuestionIndex = 0;
    this.questions = new QuizQuestions();
    this.loadInbuiltQuestions();
    this.quizIsRunning = true;
    return;
  }

  /**
* adds the user's score to the high scores list, identified by their initials
* @param {string} userInitials
*/
  storeHighScore(userInitials) {
    // TODO: store the high score in local storage as a JSON object
    if (useLocalStorage) {
      // TODO: this is not functional yet, just playing around with JSON stuff
      // store the high score in localStorage
      const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
      highScores.push({initials: userInitials, score: this.score});
      localStorage.setItem('highScores', JSON.stringify(highScores));
    }
  }
  /**
 * Loads the inbuilt questions into the quiz
 * @return {void}
 */
  loadInbuiltQuestions() {
  // load inbuilt questions
  // ideally this would be loaded from a file or database but for now it's hard coded
    let newQuestion = 'What is the correct way to declare a variable in JavaScript?';
    let newAnswers= new QuestionAnswers([
      new QuestionAnswer('var = myVar;', 'A', false),
      new QuestionAnswer('myVar: var;', 'B', false),
      new QuestionAnswer('var myVar;', 'C', true),
      new QuestionAnswer('var myVar =;', 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'What is the output of the following code? console.log(5 + "5");';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('55', 'A', true),
      new QuestionAnswer(10, 'B', false),
      new QuestionAnswer('"55"', 'C', false),
      new QuestionAnswer('undefined', 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'What is the result of `typeof null`?';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('null', 'A', false),
      new QuestionAnswer('undefined', 'B', false),
      new QuestionAnswer('object', 'C', true),
      new QuestionAnswer('number', 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'Which of the following is not a primitive data type in JavaScript?';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('String', 'A', false),
      new QuestionAnswer('Object', 'B', true),
      new QuestionAnswer('Boolean', 'C', false),
      new QuestionAnswer('Number', 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'What is the result of the following code? let x = 10; console.log(x++);';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer(10, 'A', true),
      new QuestionAnswer(11, 'B', false),
      new QuestionAnswer(undefined, 'C', false),
      new QuestionAnswer(NaN, 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'Which of the following is not a valid way to declare a variable in JavaScript?';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('let x = 5;', 'A', false),
      new QuestionAnswer('const y = 10;', 'B', false),
      new QuestionAnswer('var z = 15;', 'C', false),
      new QuestionAnswer('int w = 20;', 'D', true)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'What is the result of the following code? let myArray = [1, 2, 3]; console.log(myArray.length);';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer(0, 'A', false),
      new QuestionAnswer(1, 'B', false),
      new QuestionAnswer(2, 'C', false),
      new QuestionAnswer(3, 'D', true)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'What is the result of the following code? console.log(Math.floor(3.6));';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer(3, 'A', true),
      new QuestionAnswer(4, 'B', false),
      new QuestionAnswer(3.6, 'C', false),
      new QuestionAnswer(4.2, 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'What does the `splice()` method do in JavaScript?';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('Adds elements to the end of an array', 'A', false),
      new QuestionAnswer('Removes elements from an array', 'B', true),
      new QuestionAnswer('Sorts the elements of an array', 'C', false),
      new QuestionAnswer('Reverses the order of the elements in an array', 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'Which of the following is a truthy value in JavaScript?';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('""', 'A', false),
      new QuestionAnswer('0', 'B', false),
      new QuestionAnswer('null', 'C', false),
      new QuestionAnswer('true', 'D', true)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'What is the result of the following code? let myObj = {a: 1, b: 2, c: 3}; console.log(Object.keys(myObj));';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('[1, 2, 3]', 'A', false),
      new QuestionAnswer('["a", "b", "c"]', 'B', true),
      new QuestionAnswer('["1", "2", "3"]', 'C', false),
      new QuestionAnswer('["a": 1, "b": 2, "c": 3]', 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'What is the result of the following code? let myString = "Hello, world!"; console.log(myString.slice(0, 5));';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('world', 'A', false),
      new QuestionAnswer('Hello', 'B', true),
      new QuestionAnswer('Hello,', 'C', false),
      new QuestionAnswer('world!', 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'What does the `this` keyword refer to in JavaScript?';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('The current function\'s scope', 'A', false),
      new QuestionAnswer('The global scope', 'B', false),
      new QuestionAnswer('The parent object of a method', 'C', true),
      new QuestionAnswer('The previous function\'s scope', 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'What is event bubbling in JavaScript?';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('The process of assigning multiple event listeners to the same element', 'A', false),
      new QuestionAnswer('The process of triggering an event on a parent element when it\'s been triggered on a child element', 'B', true),
      new QuestionAnswer('The process of capturing an event before it\'s triggered on the target element', 'C', false),
      new QuestionAnswer('The process of delaying an event until other events have finished executing', 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'What is the `stopPropagation()` method used for in JavaScript?';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('To prevent an event from bubbling up the DOM tree', 'A', true),
      new QuestionAnswer('To trigger an event on a parent element when it\'s been triggered on a child element', 'B', false),
      new QuestionAnswer('To capture an event before it\'s triggered on the target element', 'C', false),
      new QuestionAnswer('To delay an event until other events have finished executing', 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'Which of the following is a valid way to add an event listener to an element in JavaScript?';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('element.addEventListener("click", myFunction);', 'A', true),
      new QuestionAnswer('element.on("click", myFunction);', 'B', false),
      new QuestionAnswer('element.click(myFunction);', 'C', false),
      new QuestionAnswer('element.attachEvent("onclick", myFunction);', 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'What is the `localStorage` object used for in JavaScript?';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('To store data on the server', 'A', false),
      new QuestionAnswer('To store data on the client\'s computer', 'B', true),
      new QuestionAnswer('To store data in memory', 'C', false),
      new QuestionAnswer('To store data in a cookie', 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'What is the `setTimeout()` method used for in JavaScript?';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('To execute a function after a set amount of time', 'A', true),
      new QuestionAnswer('To execute a function repeatedly at set intervals', 'B', false),
      new QuestionAnswer('To execute a function immediately', 'C', false),
      new QuestionAnswer('To stop the execution of a function', 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'Which of the following is not a valid data type in JavaScript?';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('string', 'A', false),
      new QuestionAnswer('integer', 'B', true),
      new QuestionAnswer('boolean', 'C', false),
      new QuestionAnswer('object', 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'Which of the following is not a valid comparison operator in JavaScript?';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('==', 'A', false),
      new QuestionAnswer('!=', 'B', false),
      new QuestionAnswer('===', 'C', false),
      new QuestionAnswer('!===', 'D', true)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'What is the result of the following code? let myArray = ["apple", "banana", "cherry"]; myArray.splice(1, 1); console.log(myArray);';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('["apple", "cherry"]', 'A', true),
      new QuestionAnswer('["banana", "cherry"]', 'B', false),
      new QuestionAnswer('["apple", "banana"]', 'C', false),
      new QuestionAnswer('["cherry"]', 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'What is the `setInterval()` method used for in JavaScript?';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('To execute a function after a set amount of time', 'A', false),
      new QuestionAnswer('To execute a function repeatedly at set intervals', 'B', true),
      new QuestionAnswer('To execute a function immediately', 'C', false),
      new QuestionAnswer('To stop the execution of a function', 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'Which is the most correct answer for a valid way to declare a variable in JavaScript?';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('var myVariable = "value";', 'A', false),
      new QuestionAnswer('let myVariable = "value";', 'B', false),
      new QuestionAnswer('const myVariable = "value";', 'C', false),
      new QuestionAnswer('All of the above', 'D', true)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'What is the `clearInterval()` method used for in JavaScript?';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('To execute a function after a set amount of time', 'A', false),
      new QuestionAnswer('To execute a function repeatedly at set intervals', 'B', false),
      new QuestionAnswer('To execute a function immediately', 'C', false),
      new QuestionAnswer('To stop the execution of a function', 'D', true)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'Which of the following is not a valid way to comment code in JavaScript?';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('// Single-line comment', 'A', false),
      new QuestionAnswer('/* Multi-line comment */', 'B', false),
      new QuestionAnswer('<!-- HTML comment -->', 'C', true),
      new QuestionAnswer('/** Documentation comment */', 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'What is the difference between `==` and `===` in JavaScript?';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('`==` compares the values of two variables, while `===` compares their values and types', 'A', true),
      new QuestionAnswer('`==` compares the values and types of two variables, while `===` compares their values only', 'B', false),
      new QuestionAnswer('`==` and `===` are interchangeable', 'C', false),
      new QuestionAnswer('`==` is used for strings, while `===` is used for numbers', 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'What is the difference between `let` and `var` in JavaScript?';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('`let` is used for global variables, while `var` is used for local variables', 'A', false),
      new QuestionAnswer('`let` is used for local variables, while `var` is used for global variables', 'B', true),
      new QuestionAnswer('`let` and `var` are interchangeable', 'C', false),
      new QuestionAnswer('There is no difference between `let` and `var`', 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    newQuestion = 'What is the output of the following code? const myArray = [1, 2, 3]; myArray.pop(); console.log(myArray.length);';
    newAnswers= new QuestionAnswers([
      new QuestionAnswer('0', 'A', false),
      new QuestionAnswer('1', 'B', false),
      new QuestionAnswer('2', 'C', true),
      new QuestionAnswer('3', 'D', false)]);
    this.questions.addQuestion(new QuizQuestion(newQuestion, newAnswers));

    return;
  }
}


// ----------  QuizQuestion Class
/**
 * Represents a Quiz Question with a question, a collection of answers and the correct answer
 * @class
 */
class QuizQuestion {
  /**
   * Creates a Quiz Question
   * @param {string} question - the question to be asked
   * @param {QuestionAnswers} answers  - contains an array of QuestionAnswer objects
   */
  constructor(question, answers) {
    this.question = question;
    this.answers = answers;
    this.userSelection = new QuestionAnswer('', '', false); // the user's selected answer
  }
  /**
   * Stores the user's selected answer
   * @param {QuestionAnswer} answer - the user's selected answer
   * @return {void}
   */
  storeAnswer(answer) {
    this.userSelection = answer;
    return;
  }
  /**
   * Stores the user's selected answer by the answer's identifier
   * @param {string} identifier - the identifier of the answer (eg A, B, C, D)
   * @return {boolean} - true if the answer is found and stored, false if the answer is not found
   */
  storeAnswerByIdentifier(identifier) {
    this.userSelection = this.answers.answers.find(
        (answer) => answer.identifier === identifier);
    // if not found, this.userSelection will be undefined
    if (this.userSelection) {
      return true;
    }
    return false;
  }
  /**
   * Returns the user's selected answer
   * @return {boolean} - if the user's selected answer exists and is true, otherwise false
   */
  answerIsCorrect() {
    if (this.userSelection) {
      return this.userSelection.isCorrect;
    }
    return false;
  }
  /**
   * Checks to see if an answer has been selected by the user
   * @return {boolean} - true if the user has selected an answer, otherwise false
   */
  questionHasBeenAnswered() {
    if (this.userSelection) {
      return true;
    }
    return false;
  }

  /**
   * Returns the correct answer for this question
   * @return {QuestionAnswer} - the correct answer for this question
   */
  getCorrectAnswer() {
    return this.answers.answers.find((answer) => answer.isCorrect);
  }

}

// ----------  QuizQuestions Class
/**
 * Represents a collection of Quiz Questions that makes up this quiz
 * @class
 */
class QuizQuestions {
  /**
   * Creates a new QuizQuestions object
   */
  constructor() {
    this.questions = [];
  }

  /**
   * Adds a question to the collection of questions for the quiz
   * @param {QuizQuestion} question - the question to add to the collection
   * @return {void}
   */
  addQuestion(question) {
    this.questions.push(question);
    return;
  }

  /**
   * returns the question at the specified index in the collection of questions
   * @param {number} index - the index of the question to return
   * @return {QuizQuestion} - the question at the specified index
   */
  getQuestion(index) {
    return this.questions[index];
  }

  /**
   * returns the number of questions in the collection of questions
   * @return {number} - the number of questions in the collection of questions
   */
  getQuestionCount() {
    return this.questions.length;
  }
}

// ----------  Answer Class
/**
 * Represents an answer to a question
 * @class
 */
class QuestionAnswer {
  /**
   * Creates a new QuestionAnswer object
   * @param {string} answer - the possible answer to a question
   * @param {string} identifier - the identifier for the answer (eg A, B, C, D)
   * @param {boolean} isCorrect - is this the correct answer to the question?
   */
  constructor(answer, identifier, isCorrect) {
    this.answer = answer;
    this.identifier = identifier;
    this.isCorrect = isCorrect;
  }
}

// ----------  QuestionAnswers Class
/**
 * Represents the collection of answers to a question
 * @class
 */
class QuestionAnswers {
  /**
   * Creates a new QuestionAnswers object
   * @param {QuestionAnswer[]} answerArray - an array of QuestionAnswer objects
   */
  constructor(answerArray) {
    if (!Array.isArray(answerArray)) {
      this.answers = [];
    } else {
      this.answers = answerArray;
    }
  }

  /**
   * returns the question with the specified identifier in the collection of questions
   * @param {string} identifier - the identifier of the question to return eg (A, B, C, D)
   * @return {QuizQuestion} - the question with the specified identifier
   * @return {null} - if the question is not found or the identifier is not valid
   */
  getAnswerByIdentifier(identifier) {
    console.log(this.answers);
    for (let i = 0; i < this.answers.length; i++) {
      if (this.answers[i].identifier === identifier) {
        return this.answers[i];
      };
    };
    return null;
  }

  /**
   * Adds an answer to the collection of answers
   * @param {QuestionAnswer} answer - the possible answer to a quiz question to add to the collection
   * @return {void}
   */
  addAnswer(answer) {
    this.answers.push(answer);
    return;
  }

  /**
   * Gets the correct answer from the collection of answers
   * @return {QuestionAnswer} - the correct answer
   */
  correctAnswer() {
    return this.answers.find((answer) => answer.isCorrect);
  }
}

// ---------------------------------------------------------
// ---------- QuizTimer Class ----------
class QuizTimer {
  constructor() {
    this.timerInterval = 1000;
    this.timeLeft= 0;
    this.quizTimer = null;
  }

  getSecondsLeft() {
    if (this.timeLeft <= 0) {
      // potentially it could be negative due to penalty for wrong answer
      // so return 0;
      return 0;
    }
    // return the time left in seconds (nearest second)
    return Math.round(this.timeLeft/1000);
  }

  penaliseForWrongAnswer(penalty) {
    this.timeLeft -= penalty;
    if (this.timeLeft <= 0) {
      // stop the timer
      this.stop();
      // raise the timer run out event
      document.dispatchEvent(TimerFinishedEvent);
    } else {
      // raise the timer tick event to refresh screen, etc
      document.dispatchEvent(TimerTickEvent);
    }
  }

  start(runForSeconds) {
    this.timeLeft = runForSeconds;
    console.log(`Starting timer for ${this.timeLeft} seconds`);
    // start the timer and set the function to run every interval defined by this.timerInterval
    this.quizTimer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        // stop the timer
        this.stop();
        // raise the timer run out event
        console.log('Timer finished');
        document.dispatchEvent(TimerFinishedEvent);
      } else {
        // raise the timer tick event to refresh screen, etc
        console.log('Timer tick' + this.timeLeft );
        document.dispatchEvent(TimerTickEvent);
      }
    }, this.timerInterval);
    return;
  }

  stop() {
    clearInterval(this.quizTimer);
  }
}

// ---------- End QuizTimer Class ----------

// ---------------------------------------------------------
// ================ MAIN CODE ==============================
// create a new quiz timer with the quizTimerElement to dispatch events to
const quizTimer = new QuizTimer();


// create a new quiz controller that has all the quiz questions and rules
const quizController = new QuizController(secondsPerQuestion);

function startQuiz() {
  // start the quiz
  console.log('start quiz');
  quizController.startQuiz();

  // start the timer
  console.log('start timer');
  quizTimer.start(quizController.quizTotalTime);

  // hide the start page
  document.getElementById('start-page').style.display = 'none';

  // show the quiz page
  document.getElementById('progress-percentage').innerHTML = quizController.quizTotalTime;
  document.getElementById('quiz-page').style.display = 'block';

  // show the first question
  quizController.showQuestion();
}

async function quizTimerFinished() {
  // end the quiz
  stopQuiz();
  document.getElementById('progress-percentage').innerHTML = 'time\'s up!';

  // wait a second before showing the finished page
  await delay(1000);

  // show the quiz finished page
  showFinishedPage();
}

async function quizEndedQuestions() {
  // end the quiz
  stopQuiz();
  // show a message that the quiz has ended
  document.getElementById('progress-percentage').innerHTML = 'All done!';
  // delay to show the result of the last answer
  await delay(2000);
  // show the quiz finished page
  showFinishedPage();
}

function stopQuiz() {
  // end the quiz:
  // disallow any more answers
  // stop the timer
  quizController.endQuiz();
  quizTimer.stop();
}

function showFinishedPage() {
  // show the quiz finished page
  document.getElementById('quiz-page').style.display = 'none';
  document.getElementById('quiz-over-page').style.display = 'block';
  // show the score
  document.getElementById('final-score').innerHTML = quizController.userScore();
}

function quizTimerTick() {
  // update the timer display
  document.getElementById('progress-percentage').innerHTML = quizTimer.timeLeft;
}

// ----------  End Start Page
// ---------------------------------------------------------

// ---------------------------------------------------------
// ----------  Quiz Page
// ----------  End Quiz Page
// ---------------------------------------------------------

// ---------------------------------------------------------
// ----------  Quiz Finished Page
// ----------  End Quiz Finished Page
// ---------------------------------------------------------

// ---------------------------------------------------------
// ----------  High Scores Page
// ----------  End High Scores Page
// ---------------------------------------------------------

// ---------------------------------------------------------
// ----------  Initialise Variables

// See if localStorage is available to use
const useLocalStorage = storageAvailable('localStorage');

// store questions and answers in this variable

// ----------  End Initialise Variables
// ---------------------------------------------------------

// ---------------------------------------------------------
// ----------  localStorage Functions

// see if the storage type is supported and available
// credit: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
function storageAvailable(type) {
  let storage;
  try {
    storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return (
      e instanceof DOMException &&
        // everything except Firefox
        (e.code === 22 ||
          // Firefox
          e.code === 1014 ||
          // test name field too, because code might not be present
          // everything except Firefox
          e.name === 'QuotaExceededError' ||
          // Firefox
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
        // acknowledge QuotaExceededError only if there's something already stored
        storage &&
        storage.length !== 0
    );
  }
}
// ----------  End localStorage Functions
// ---------------------------------------------------------

// ---------------------------------------------------------

// ---------------------------------------------------------

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

