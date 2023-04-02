// JavaScript Coding Quiz

// ---------- Event Listeners ----------
// Detect if the user has clicked on the start button to start the quiz
var startQuizButton=document.getElementById('start-button');
startQuizButton.addEventListener('click', startTheCodingQuiz);

// create custom events that are dispatched from the quiz timer and quiz controller
// notifying that the quiz has finished for further actions to be taken
const TimerFinishedEvent = new Event('quizTimerFinished');
const EndedQuestionsEvent = new Event('quizEndedQuestions');
document.addEventListener('quizTimerFinished', quizTimerFinished);
document.addEventListener('quizEndedQuestions', quizEndedQuestions);

// add event listeners for custom events
// this one is used to update the timer display from the quiz timer
document.addEventListener('quizTimerTick', quizTimerTickHandler);
// this one is used to update the quiz progress bar when the user answers a question
document.addEventListener('quizQuestionAnswered', quizQuestionAnsweredHandler);

// Detect if the user has clicked on the quiz answers with their mouse
var answerDivs = document.getElementById('quiz-answers');
answerDivs.addEventListener('click', answerSelected);

// Detect if the user has pressed (released) a key on the keyboard 
// to allow keyboard answers (eg a, b, c, d, 1, 2, 3, 4)
document.addEventListener('keyup', quizKeyUp);


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
    this.showCorrectAnswer = false;
  }

  startQuiz() {
  // reset the quiz, including loading/reloading the inbuilt questions
    this.resetQuiz();

    // update the progress bar
    this.raiseEventQuestionAnswered();

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
      document.getElementById('answer-' + answerID.toLowerCase()).textContent = answerID + ' ' + quizAnswer.answer;
    }
    return;
  }

  answerQuestion(answerIdentifier) {
    if (this.quizIsRunning) {
      // choose the answer to this question
      console.log(this.currentQuestionIndex);
      const displayedQuestion = this.currentQuestion();
      displayedQuestion.storeAnswerByIdentifier(answerIdentifier);

      // check if the answer is correct and feedback
      const feedbackElement = document.getElementById('quiz-feedback');
      if (displayedQuestion.userSelection.isCorrect) {
        // if so, let the user know
        feedbackElement.innerHTML = 'Correct!';
        feedbackElement.style.color = 'green';
        feedbackElement.style.fontWeight = '500';
      } else {
        // if not, let the user know and penalise them
        const answerFeedback = 'Incorrect!' + (this.showCorrectAnswer ? ' The correct answer was: "' + displayedQuestion.getCorrectAnswer().answer + '"' : '');
        feedbackElement.innerHTML = answerFeedback;
        feedbackElement.style.color = 'red';
        feedbackElement.style.fontWeight = '600';
        quizTimer.penaliseForWrongAnswer(secondsPenalty);
      };
      // move to the next question
      this.currentQuestionIndex++;

      if (this.currentQuestionIndex > this.questions.questions.length-1) {
        // end the quiz as have run out of questions
        document.dispatchEvent(EndedQuestionsEvent);
      } else {
        this.showQuestion();
        // update the progress bar if there are more questions
        this.raiseEventQuestionAnswered();
      };
    }
  }

  raiseEventQuestionAnswered() {
    const eventQuestionAnswered = new CustomEvent('quizQuestionAnswered',
        {detail: {
          totalQuestions: this.questions.questions.length,
          questionsAsked: this.currentQuestionIndex + 1,
        },
        });
    document.dispatchEvent(eventQuestionAnswered);
    return;
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

  validateKeyPress(keyPressCharacter) {
    // check if the key pressed is a valid key to answer the question
    console.log('The key pressed was:', keyPressCharacter);
    keyPressCharacter = keyPressCharacter.toLowerCase();
    const keyTranslationPairs = [
      ['a', 'A'],
      ['b', 'B'],
      ['c', 'C'],
      ['d', 'D'],
      ['1', 'A'],
      ['2', 'B'],
      ['3', 'C'],
      ['4', 'D'],
    ];
    let returnKey = '';
    for (const keyTranslationPair of keyTranslationPairs) {
      if (keyPressCharacter === keyTranslationPair[0]) {
        returnKey = keyTranslationPair[1];
        break;
      }
    }
    return returnKey;
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
    this.startingTime = 0;
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
      this.stopQuizTimer();
      // raise the timer run out event
      document.dispatchEvent(TimerFinishedEvent);
    } else {
      // raise the timer tick event to refresh screen, etc
      this.raiseEventTimerTick();
    }
  }

  raiseEventTimerTick() {
    const timerTickEvent = new CustomEvent('quizTimerTick',
        {detail: {
          timeLeft: this.timeLeft,
          startingTime: this.startingTime,
        },
        });
    document.dispatchEvent(timerTickEvent);
    return;
  }

  startQuizTimer(runForSeconds) {
    this.startingTime=runForSeconds;
    this.timeLeft = runForSeconds;
    // update the UI at the start of the timer
    this.raiseEventTimerTick();

    // start the timer and set the function to run every interval defined by this.timerInterval
    this.quizTimer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        // stop the timer
        this.stopQuizTimer();
        // raise the timer run out event
        console.log('Timer finished');
        document.dispatchEvent(TimerFinishedEvent);
      } else {
        // raise the timer tick event to refresh progress bar, etc
        this.raiseEventTimerTick();
      }
    }, this.timerInterval);
    return;
  }

  stopQuizTimer() {
    clearInterval(this.quizTimer);
  }
}

// ---------- End QuizTimer Class ----------

// ---------------------------------------------------------
// ================ MAIN CODE ==============================
// The quiz is controlled by the QuizController class that contains the
// questions and records the score, and determines if the quiz is finished
// if the user has answered all of the questions
// The QuizTimer class is used to control the timer for the quiz, and it
// determines if the quiz is finished if the timer runs out
// Both the QuizController and QuizTimer classes raise custom events that are
// handled by the event handlers in the main code to update the UI

// set the number of seconds per question and the penalty that reduces the time available
// if the user selects an incorrect answer
const secondsPerQuestion = 8;
const secondsPenalty = 10;

// create a new quiz timer with the quizTimerElement to dispatch events to
const quizTimer = new QuizTimer();

// create a new quiz controller that has all the quiz questions and rules
const quizController = new QuizController(secondsPerQuestion);

// This function starts the quiz, and it is called by the user clicking the "Start Quz" button
function startTheCodingQuiz() {
  // get the user options
  // see if user wants the correct answer to be shown if they get it wrong
  quizController.showCorrectAnswer= document.getElementById('show-correct-answer').checked;

  // ensure the UI for the answers is reset
  resetAnswerElements('block');

  // start the quiz
  console.log('start quiz');
  quizController.startQuiz();

  // start the timer
  // console.log('start timer');
  quizTimer.startQuizTimer(quizController.quizTotalTime);

  // hide the start page
  document.getElementById('start-page').style.display = 'none';

  document.getElementById('quiz-page').style.display = 'block';

  // show the first question
  quizController.showQuestion();
}



// this is a helper function to tell the QuizController and the QuizTimer that the quiz has ended
// either by running out of questions or the timer running out
function stopQuiz() {
  // end the quiz:
  // disallow any more answers
  // stop the timer
  quizController.endQuiz();
  quizTimer.stopQuizTimer();
}

// this is a helper function to move to webpage to the next step, which is the finished quiz page
function showFinishedPage() {
  // show the quiz finished page
  document.getElementById('quiz-page').style.display = 'none';
  document.getElementById('quiz-over-page').style.display = 'block';
  // show the score
  document.getElementById('final-score').innerHTML = quizController.userScore();
}


// tidy up the UI after the last question has been answered
// and before the quiz has started to ensure no old data or unwanted formatting is shown
function resetAnswerElements(displayType) {
  const answerDiv = document.getElementById('quiz-answers');
  const answerElements = answerDiv.querySelectorAll('p');
  answerElements.forEach((answerElement) => {
    answerElement.style.display = displayType;
    answerElement.textContent = '';
  });
}


// ---------- Event Handlers ----------
// this is called when the user clicks on an answer
// (actually triggered by the container div for the answer, using bubbling)
function answerSelected(event) {;
  // only respond if the user clicks one of the answers (<p> elements)
  if (event.target.nodeName === 'P') {
    // get the id of the element
    const answerID = event.target.id;
    // get the last character of the id, which is the answer identifier (a, b, c, d)
    const answerIdentifier=answerID.substring(answerID.length - 1).toUpperCase();
    // pass the answer identifier to the quiz controller to process the answer selected
    quizController.answerQuestion(answerIdentifier);
  }
  return;
};

// this is called when the user releases a key on the keyboard,
// to allow them to use the keyboard to answer
function quizKeyUp(event) {
  // only respond if the quiz is actually running
  if (quizController.quizIsRunning) {
    // check if the key pressed is a valid answer (eg A, B, C, D, a, b, c, d, 1, 2, 3, 4)
    const validKey = quizController.validateKeyPress(event.key);
    if (validKey) {
      // pass the answer identifier to the quiz controller to process the answer selected
      quizController.answerQuestion(validKey);
    };
  }
  return;
}


// ---------- Custom Event Handlers ----------
// This event handles the custom event dispatched by the QuizTimer when the quiz has ended due to running out of time
// async is used to allow the quiz to wait for a delay before showing the finished page
async function quizTimerFinished() {
  // end the quiz
  stopQuiz();
  document.getElementById('timer').innerHTML = 'time\'s up!';

  // wait a second before showing the finished page
  await delay(1000);

  // show the quiz finished page
  showFinishedPage();
}
// This event handles the custom event dispatched by the QuizController when the quiz has ended due to running out of questions
// async is used to allow the quiz to wait for a delay before showing the finished page
async function quizEndedQuestions() {
  // end the quiz
  stopQuiz();

  // clear the questions display after the last question
  document.getElementById('questions-left').textContent = 'all questions answered';

  document.getElementById('question').textContent = '';
  resetAnswerElements('none');

  // show a message that the quiz has ended
  document.getElementById('timer').innerHTML = 'All done!';

  // delay to show the result of the last answer
  await delay(2000);

  // show the quiz finished page
  showFinishedPage();
}

// handles the dispatched event from the quiz countdown timer
function quizTimerTickHandler(event) {
  // get the details of the event
  const timeLeft = parseFloat(event.detail.timeLeft);
  const startingTime = parseFloat(event.detail.startingTime);
  // calculate the percentage of time left
  const percentageLeft = Math.round(((startingTime- timeLeft)/startingTime)*100);
  // update the timer display
  document.getElementById('timer').innerHTML = quizTimer.timeLeft;
  // update the timer progress bar
  setTimeProgressBar(percentageLeft);
}

function quizQuestionAnsweredHandler(event) {
  // get the details of the event
  const questionTally = parseFloat( event.detail.totalQuestions);
  const questionsAsked = parseFloat( event.detail.questionsAsked);
  // calculate the percentage of questions left to be answered
  const percentageDone = Math.round((questionsAsked / questionTally)*100);
  // update the question progress info
  document.getElementById('question-number').innerHTML = `${questionsAsked} of ${questionTally}`;
  document.getElementById('questions-left').innerHTML = `${questionTally - questionsAsked}`;
  // update the progress bar
  setQuestionProgressBar(percentageDone);
}
// ---------- End of Custom Event Handlers ----------

// ---------- localStorage Functions
// See if localStorage is available to use
const useLocalStorage = storageAvailable('localStorage');

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
// ----------  End of localStorage Functions

// ---------- Helper functions ----------
function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
// ---------- End of Helper functions ----------

// ---------- Progress Bar Functions
function setTimeProgressBar(timerPercentage) {
  // ensure the percentage is between 0 and 100
  timerPercentage=parseFloat(timerPercentage);
  if (timerPercentage > 100) {
    timerPercentage = 100;
  } else if (timerPercentage < 0) {
    timerPercentage = 0;
  }

  // calculate the colour of the progress bar based on the percentage
  const red = 255;
  const green = (100-timerPercentage) * 2.3;
  const blue = 0;
  const endBarColour = 'rgb(' + red + ',' + green + ',' + blue + ')';
  const shadowStyle = '1px 1px 8px 0 rgba(' + red + ',' + green + ',' + blue + ', 0.75)';
  const startBarColour = 'rgb(255 230 0)';
  const countTextColour = endBarColour;

  // format the progress bar with the calculated colour and percentage
  setProgressBar('timer-bar', 'timer-bar-outline', 'timer', timerPercentage, startBarColour, endBarColour, countTextColour, shadowStyle);

  return;
}

function setQuestionProgressBar(questionPercentage) {
  // ensure the percentage is between 0 and 100
  questionPercentage=parseFloat(questionPercentage);
  if (questionPercentage > 100) {
    questionPercentage = 100;
  } else if (questionPercentage < 0) {
    questionPercentage = 0;
  }

  // calculate the colour of the progress bar based on the percentage
  const red = 0 + ((100-questionPercentage)/100) * (171 - 0);
  const green = 61 + ((100-questionPercentage)/100) * (171 - 61);
  const blue = 107 + ((100-questionPercentage)/100) * (232 - 107);
  const endBarColour = 'rgb(' + red + ',' + green + ',' + blue + ')';
  const shadowStyle = '1px 1px 10px 0 rgba(98 171 232 / 75%)';
  const startBarColour = 'rgb(98 171 232)';
  const countTextColour = startBarColour;
  // format the progress bar with the calculated colour and percentage
  setProgressBar('questions-bar', 'questions-bar-outline', 'questions-left', questionPercentage, startBarColour, endBarColour, countTextColour, shadowStyle);
  return;
}

function setProgressBar(elementID, elementParentID, countDownTextID, countDownPercentage, startBarColour, endBarColour, countTextColour, shadowStyle) {
  let elementToStyle = document.getElementById(elementID);
  elementToStyle.style.backgroundColor = endBarColour;
  elementToStyle.style.background ='linear-gradient(to right, ' + startBarColour + ' 0%, ' + endBarColour + ' 100%)';
  // set its width to the calculated percentage
  elementToStyle.style.width = countDownPercentage + '%';

  // set the shadow of the timer bar to the calculated colour
  elementToStyle = document.getElementById(elementParentID);
  elementToStyle.style.boxShadow=shadowStyle;

  // set the colour of the timer text
  elementToStyle = document.getElementById(countDownTextID);
  elementToStyle.style.color=countTextColour;
  return;
}
// ---------- End of Progress Bar Functions
