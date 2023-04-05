// JavaScript Coding Quiz

// =============================================================================
// ----------  Class Definitions
// ----------  QuizController Class
/**
 * Represents the quiz: holds the questions, runs the quiz rules and the current state of the quiz
 * @param {number} timePerQuestion - the time allowed per question in seconds
 * @class
 */
class QuizController {
  constructor(timePerQuestion) {
    this.timePerQuestion = timePerQuestion;
    this.quizTotalTime = 0; // amount of time available at the start
    this.currentQuestionIndex = 0; // which question index is being asked at present
    this.questions = new QuizQuestions(); // the available quiz questions
    this.quizIsRunning = false; // flag indicating if the quiz is currently running
    this.showCorrectAnswer = false; // flag indicating if the user wants to see the correct answer after they answer incorrectly
    this.finalTimerScore = 0; // the amount of time left remaining at the conclusion of the quiz (becomes the score)
    this.selectedQuestionsForQuiz = 0; // the user-selected number of questions to be asked in the quiz
    this.questionsAskedSoFar = 0; // the number of questions the user has been asked so far in the quiz
  }

  startQuiz() {
  // reset the quiz state, including loading/reloading the inbuilt questions
  // the quiz timer is handled by the quiz timer class outside of this class
    this.resetQuiz();

    // update/reset the progress bar
    this.raiseEventQuestionAnswered();

    // calculate the time remaining based on the number of questions and the time per question
    this.quizTotalTime = this.timePerQuestion * parseInt(this.selectedQuestionsForQuiz);

    return;
  }

  showQuestion() {
  // show the next question

    // iterate the number of questions that have been asked
    this.questionsAskedSoFar++;

    // choose the index of the question to display (random, but ensures no duplicate questions)
    this.chooseNextQuestion();

    // get the question with the randomly chosen index and flag set so it is not chosen again
    const question = this.currentQuestion();
    question.hasBeenAsked = true;
    // display the question and the answers
    document.getElementById('question').innerHTML = question.question;
    const answerIDs = ['A', 'B', 'C', 'D'];
    let quizAnswer;
    for (const answerID of answerIDs) {
      quizAnswer = question.answers.getAnswerByIdentifier(answerID);
      document.getElementById('answer-' + answerID.toLowerCase()).textContent = answerID + ' ' + quizAnswer.answer;
    }

    return;
  }

  // choose which question to ask and store the index
  chooseNextQuestion() {
    const totalQuestions = this.questions.totalQuestions();
    let randomIndex;
    // loop until an unanswered question is found
    while (true) {
      randomIndex = Math.floor(Math.random() * totalQuestions);
      if (!this.questions.questions[randomIndex].hasBeenAsked) {
        // found an unanswered question
        this.currentQuestionIndex = randomIndex;
        return;
      }
    }
  }

  // this function is called when the user has answered a question
  // the input parameter is the identifier of the answer the user has chosen
  answerQuestion(answerIdentifier) {
    if (this.quizIsRunning) {
      // choose the answer to this question
      const displayedQuestion = this.currentQuestion();
      displayedQuestion.storeAnswerByIdentifier(answerIdentifier);

      // check if the answer is correct and give feedback
      const feedbackElement = document.getElementById('quiz-feedback');
      if (displayedQuestion.answerIsCorrect()) {
        // if so, let the user know
        feedbackElement.textContent = 'Correct!';
        feedbackElement.style.color = 'green';
        feedbackElement.style.fontWeight = '500';
      } else {
        // if not, let the user know and penalise them
        const answerFeedback = 'Incorrect!' + (this.showCorrectAnswer ? ' The correct answer was: "' + displayedQuestion.getCorrectAnswer().answer + '"' : '');
        feedbackElement.textContent = answerFeedback;
        feedbackElement.style.color = 'red';
        feedbackElement.style.fontWeight = '600';

        // tell the timer class to penalise the user by the number of seconds set in the quiz settings
        quizTimer.penaliseForWrongAnswer(secondsPenalty);
      };

      // move to the next question unless have already asked enough questions
      if (this.questionsAskedSoFar >= this.selectedQuestionsForQuiz) {
        // end the quiz as have run out of questions
        document.dispatchEvent(EndedQuestionsEvent);
      } else {
        // show the next question
        this.showQuestion();
        // update the questions to come progress bar
        this.raiseEventQuestionAnswered();
      };
    }
  }
  // Creates and dispatches a new custom event to notify that a question has been answered
  raiseEventQuestionAnswered() {
    // it is shown after each question has been answered, and at the beginning of the quiz
    // it is used to update the questions to come progress bar
    // have to adjust for the first call to this function which is before the first question is asked
    let questionsAskedSoFar = this.questionsAskedSoFar;
    if (questionsAskedSoFar === 0) {
      questionsAskedSoFar = 1;
    };
    // create the custom event and store the current state of the quiz inside it
    const eventQuestionAnswered = new CustomEvent('quizQuestionAnswered',
        {detail: {
          totalQuestions: this.selectedQuestionsForQuiz,
          questionsAsked: questionsAskedSoFar,
        },
        });
    document.dispatchEvent(eventQuestionAnswered);
    return;
  }

  // returns the question object that is currently being asked
  currentQuestion() {
    return this.questions.questions[this.currentQuestionIndex];
  }

  // set flag that the quiz is over, and return the number of questions answered correctly
  endQuiz() {
    // end the quiz
    this.quizIsRunning = false;

    // calculate scores
    return this.answersCorrectScore();
  }

  // calculate the number of questions answered correctly
  answersCorrectScore() {
  // calculate the score
    let score=0;
    for (const question of this.questions.questions) {
      if (question.questionHasBeenAnswered && question.answerIsCorrect()) {
        score++;
      };
    };
    return score;
  }

  // Resets the quiz to its initial state so it can be played again
  resetQuiz() {
    this.timeRemaining = 0; // the time remaining in seconds
    this.currentQuestionIndex = 0;
    this.quizIsRunning = true;
    this.finalTimerScore = 0;
    this.questionsAskedSoFar=0;

    // brute-force and inelegant resetting of state of the QuizQuestions🤷‍♀️
    this.questions = new QuizQuestions();
    this.loadInbuiltQuestions();

    // reset UI elements
    document.getElementById('quiz-feedback').innerHTML = '';
    document.getElementById('enter-initials').value='';

    return;
  }

  // check if the key pressed is a valid key to answer the question and translate it
  // to the correct answer identifier format
  validateKeyPress(keyPressCharacter) {
    // check if the key pressed is a valid key to answer the question
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

  // Loads the inbuilt questions into the quiz and resets other flags back to their initial state
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
 * also stores the user's selected answer and a flag indicating whether the question has been asked
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
    this.hasBeenAsked = false; // flag set when the question has been displayed to the user
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
  totalQuestions() {
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
   * Gets the correct answer from the collection of answers
   * @return {QuestionAnswer} - the correct answer
   */
  correctAnswer() {
    return this.answers.find((answer) => answer.isCorrect);
  }
}

// ---------------------------------------------------------
// ---------- QuizTimer Class ----------
// This class encapsulates the timer functionality for the quiz
// This allows the timer to be started and stopped, and the time
// remaining to be altered and retrieved, and for custom events
// to be raised when the timer runs out or to update the UI with
// the time remaining as the timer counts down.
class QuizTimer {
  constructor() {
    this.timerInterval = 1000;
    this.timeLeft= 0;
    this.quizCountdownTimer = null;
    this.startingTime = 0;
  }

  getSecondsLeft() {
    if (this.timeLeft <= 0) {
      // potentially it could be negative due to penalty for wrong answer
      // so return 0;
      return 0;
    }
    // return the time left in seconds (nearest second)
    return this.timeLeft;
  }

  penaliseForWrongAnswer(penalty) {
    this.timeLeft -= penalty;
    // check to see if the time has run out
    if (this.timeLeft <= 0) {
      // yep, run out of time
      // so stop the timer
      this.stopQuizTimer();
      // raise the timer run out event to end the quiz
      document.dispatchEvent(TimerFinishedEvent);
      // show the timer bar after time has run out
      this.raiseEventTimerTick();
    } else {
      // raise the timer tick event to refresh the UI with the new time remaining
      this.raiseEventTimerTick();
    }
    return;
  }

  // this method raises a custom event that is handled outside the
  // class, and is used to update the countdown page elements
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

  // called at the start of the quiz to begin the countdown
  // parameter is the beginning quiz time remaining, calculated
  // by the calling function based on the number of questions
  startQuizTimer(runForSeconds) {
    this.startingTime=runForSeconds;
    this.timeLeft = runForSeconds;
    // update the UI at the start of the timer, dispatches a custom event
    this.raiseEventTimerTick();

    // start the timer and set the function to run every interval defined by this.timerInterval
    this.quizCountdownTimer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        // the time has run out; the quiz needs to be ended
        // stop the timer immediately
        this.stopQuizTimer();
        // dispatch the timer run out custom event to update the UI and record the final scores
        document.dispatchEvent(TimerFinishedEvent);
      } else {
        // raise the timer tick event to refresh progress bar, etc
        this.raiseEventTimerTick();
      }
    }, this.timerInterval);
    return;
  }

  // stop the timer
  stopQuizTimer() {
    clearInterval(this.quizCountdownTimer);
  }
}

// ---------- HighScore Class ----------
// This class encapsulates an entry for the high score list
class HighScore {
  constructor(questionsInQuiz, userInitials, timerScore, correctScore) {
    this.questionsInQuiz = questionsInQuiz;
    this.userInitials = userInitials;
    this.timerScore = timerScore;
    this.correctScore = correctScore;
    this.isLatestHighScore = false;
  }
}

// ---------- HighScoreList Class ----------
// This class encapsulates the data for a high score list
// It is responsible for loading and saving the high score list
// to local storage, and for adding new high scores to the list
// and sorting the list by questions asked, time-remaining score, and
// correct answers score.
// It also has a method to clear the high score list from local storage
// It also has a method to display the high score list in the UI
class HighScoreList {
  constructor() {
    this.highScores = [];
    this.loadHighScoresFromLocalStorage();
  }
  addHighScore(highScore) {
    // set every high score to not be the latest high score
    this.highScores.forEach((highScore) => {
      highScore.isLatestHighScore = false;
    });
    // set the new high score to be the latest high score
    highScore.isLatestHighScore = true;

    // add the high score to the array
    this.highScores.push(highScore);

    // sort the array
    this.sortHighScores();

    // save the array to local storage
    this.saveHighScoresToLocalStorage();
  }

  saveHighScoresToLocalStorage() {
    // save the high scores to local storage
    localStorage.setItem('highScores', JSON.stringify(this.highScores));
  }

  loadHighScoresFromLocalStorage() {
    // load the high scores from local storage
    const highScores = JSON.parse(localStorage.getItem('highScores'));
    if (highScores) {
      this.highScores = highScores;
    } else {
      this.highScores = [];
    }
  }

  clearHighScores() {
  // clear the high scores from local storage
    localStorage.removeItem('highScores');
    // clear the high scores from the array
    this.highScores = [];
  }

  // Sort the high scores by the number of questions in the quiz, then by the timer score, then by the correct score
  sortHighScores() {
    this.highScores.sort((a, b) => {
      // parseInt probably not needed, but just in case the values are strings
      return parseInt(b.questionsInQuiz) - parseInt(a.questionsInQuiz) || parseInt(b.timerScore) - parseInt(a.timerScore) || parseInt(b.correctScore) - parseInt(a.correctScore);
    });
  };

  displayHighScores() {
    // show the high scores
    const highScoreListElement = document.getElementById('high-score-list');
    const highScoreDescriptionElement = document.getElementById('high-scores-description');
    // clear the high score list
    highScoreListElement.innerHTML = '';
    if (this.highScores.length === 0) {
      // no high scores, so display a message
      highScoreDescriptionElement.innerHTML ='There are no high scores yet.<br>Test yourself and be the first to get a high score!';
      highScoreListElement.style.display = 'none';
    } else {
      highScoreDescriptionElement.textContent='Here are the high scores, with the latest entry highlighted:';
      // add each high score to the list
      let alternateColour = false;
      let oldQuestionsTally = 0;
      for (let i = 0; i < this.highScores.length; i++) {
        const highScore = this.highScores[i];
        if (highScore.questionsInQuiz !== oldQuestionsTally) {
          alternateColour = !alternateColour;
          oldQuestionsTally = highScore.questionsInQuiz;
        }
        const highScoreElement = document.createElement('li');
        highScoreElement.className = 'high-score';
        if (alternateColour) {
          highScoreElement.className += ' list-item-colour-1';
        } else {
          highScoreElement.className += ' list-item-colour-2';
        }
        if (highScore.isLatestHighScore) {
          highScoreElement.className += ' latest-high-score';
        }
        highScoreElement.textContent = `${highScore.questionsInQuiz} questions: ${highScore.userInitials}, ${highScore.timerScore} seconds, ${highScore.correctScore} correct`;
        highScoreListElement.appendChild(highScoreElement);
      };
      highScoreListElement.style.display = 'block';
    }
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
const secondsPerQuestion = 10;
const secondsPenalty = 10;

// create a new quiz controller that has all the quiz questions and rules
const quizController = new QuizController(secondsPerQuestion);

// create a new quiz timer with the quizTimerElement to dispatch events to
const quizTimer = new QuizTimer();

// create a new high score list to store and display the high scores list
const quizHighScoreList = new HighScoreList();


// This function starts the quiz, and it is called by the user clicking the "Start Quz" button
function startTheCodingQuiz() {
  // get the user options
  // see if user wants the correct answer to be shown if they get it wrong from the checkbox
  quizController.showCorrectAnswer = document.getElementById('show-correct-answer').checked;

  // get the number of questions the user would like to answer from the range slider
  quizController.selectedQuestionsForQuiz = document.getElementById('questions-slider').value;

  // ensure the UI for the answers is reset
  resetAnswerElements('block');

  // start the quiz
  quizController.startQuiz();

  // start the timer
  quizTimer.startQuizTimer(quizController.quizTotalTime);

  // hide the start page
  document.getElementById('start-page').style.display = 'none';

  // show the quiz page
  document.getElementById('quiz-page').style.display = 'block';

  // show the first question
  quizController.showQuestion();

  // the rest of the quiz is controlled by the event handlers in
  // an event-oriented paradigm
}

// this is a helper function to tell the QuizController and the QuizTimer that the quiz has ended
// either by running out of questions or the timer running out
function stopQuiz() {
  // end the quiz:
  // disallow any more answers
  quizController.endQuiz();

  // record the timer score
  quizController.finalTimerScore = quizTimer.getSecondsLeft();

  // stop the timer
  quizTimer.stopQuizTimer();
}

// Hide the Quiz screen, show the score/finished quiz screen
function showFinishedPage() {
  // hide the quiz UI, show the quiz finished UI
  document.getElementById('quiz-page').style.display = 'none';
  document.getElementById('quiz-over-page').style.display = 'block';

  // show the scores: construct a message to display the score to the user
  scoreMessageElement = document.getElementById('final-score-time');
  if (quizController.finalTimerScore == 0) {
    scoreMessageElement.style.animation = 'none';
    scoreMessageElement.textContent = 'Bad Luck! You ran out of time and scored zero. Try again soon!';
  } else {
    scoreMessageElement.style.animation = 'changecolor 1.5s linear infinite';
    scoreMessageElement.textContent = 'Congratulations! You scored ' + quizController.finalTimerScore + '!';
  }

  // show the number of questions answered correctly
  let answerScore;
  if (quizController.questionsAskedSoFar < quizController.selectedQuestionsForQuiz ) {
    answerScore = quizController.answersCorrectScore() + ' out of ' + quizController.questionsAskedSoFar + ' questions asked, out of a possible ' + quizController.selectedQuestionsForQuiz + ' questions.';
  } else {
    answerScore = quizController.answersCorrectScore() + ' out of ' + quizController.selectedQuestionsForQuiz + ' questions.';
  };
  document.getElementById('final-score-answers').innerHTML = answerScore;

  // set the focus to the input box for the user initials
  document.getElementById('enter-initials').focus();
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
// update the chosen number of questions by the range slider changing
function selectNumberOfQuestions() {
  document.getElementById('questions-slider-value').textContent = questionsSlider.value + ' questions';
  return;
}

// user changes the slider to choose the number of questions
// this is called when the user clicks on an answer
// (actually triggered by the container div for the answer, using event propagation)
function answerSelected(event) {
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

// this is called when the user clicks one of the "Go Back" or "New Quiz" buttons
function goBackToStart() {
  // reset the quiz
  quizController.resetQuiz();

  // hide the high scores or end of quiz screens and show the start screen
  document.getElementById('high-score-page').style.display = 'none';
  document.getElementById('quiz-over-page').style.display = 'none';
  document.getElementById('start-page').style.display = 'block';
}

// this is called when the user clicks the "Clear High Scores" button
function clearHighScores() {
  // confirm that the user wants to clear the high scores
  if (confirm( 'Are you sure you want to clear the high scores?')) {
  // clear the high scores from the high score list and localStorage
    quizHighScoreList.clearHighScores();

    // update the high scores display
    showHighScores();
  }
}

// save the user score
function saveScore(event) {
  // stop the form from submitting
  event.preventDefault();

  // get the user initials
  let userInitials = document.getElementById('enter-initials').value;
  if (!userInitials.trim().length==0) {
    // trim the initials and convert to upper case, restrict to 5 characters
    userInitials=userInitials.trim().toUpperCase();
    if (userInitials.length > 5) {
      userInitials = userInitials.substring(0, 5);
    }

    // add the score to the high score list
    quizHighScoreList.addHighScore(new HighScore( quizController.selectedQuestionsForQuiz, userInitials, quizController.finalTimerScore, quizController.answersCorrectScore()));

    // show the high scores
    showHighScores();
  } else {
    // if the user has not entered any initials, show an alert
    alert('Please enter your initials');
  }
}

// show the high scores screen
function showHighScores() {
  // hide the quiz start page
  document.getElementById('start-page').style.display = 'none';
  // hide the quiz finished page
  document.getElementById('quiz-over-page').style.display = 'none';
  // show the high scores page
  document.getElementById('high-score-page').style.display = 'block';

  // add the high scores to the page
  quizHighScoreList.displayHighScores();

  // hide or show the clear high scores button
  if (quizHighScoreList.highScores.length == 0) {
    clearHighScoresButton.style.display = 'none';
  } else {
    clearHighScoresButton.style.display = 'block';
  }
}

// ---------- Custom Event Handlers ----------
// This event handles the custom event dispatched by the QuizTimer when the quiz has ended due to running out of time
// async is used to allow the quiz to wait for a delay before showing the finished page
async function quizTimerFinished() {
  // end the quiz, and determine the score
  stopQuiz();

  // update the ui indicating that the timer is up
  document.getElementById('timer').innerHTML = 'Time\'s up!';

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

  // delay to show the result of the last answer
  await delay(1500);

  // show the quiz finished page
  showFinishedPage();
}

// handles the dispatched event from the quiz countdown timer
function quizTimerTickHandler(event) {
  // get the details of the event
  let timeLeft = parseFloat(event.detail.timeLeft);
  if (timeLeft < 0) {
    timeLeft = 0;
  };
  // get the starting total quiz time in float format
  const startingTime = parseFloat(event.detail.startingTime);
  // calculate the percentage of time used
  const percentUsed = Math.round(((startingTime- timeLeft)/startingTime)*100);

  // update the timer display
  if (timeLeft == 0) {
    document.getElementById('timer').innerHTML ='Time\'s up!';
  } else {
    document.getElementById('timer').innerHTML = timeLeft;
  }

  // update the timer progress bar
  setTimeProgressBar(percentUsed);
}

// handles the dispatched event from the quiz controller when a question is answered
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

// ---------- Progress Bar Functions
// This function determines the formatting for the timer progress bar
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

// This function determines the formatting for the question progress bar
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

// This function sets the progress bar to the specified percentage and colour
function setProgressBar(elementID, elementParentID, countDownTextID, countDownPercentage, startBarColour, endBarColour, countTextColour, shadowStyle) {
  let elementToStyle = document.getElementById(elementID);
  elementToStyle.style.backgroundColor = endBarColour;
  elementToStyle.style.background ='linear-gradient(to right, ' + startBarColour + ' 0%, ' + endBarColour + ' 100%)';
  // set its width to the calculated percentage
  elementToStyle.style.width = countDownPercentage + '%';

  // set the shadow of the timer bar to the calculated colour
  elementToStyle = document.getElementById(elementParentID);
  elementToStyle.style.boxShadow = shadowStyle;

  // set the colour of the timer text
  elementToStyle = document.getElementById(countDownTextID);
  elementToStyle.style.color=countTextColour;
  return;
}
// ---------- End of Progress Bar Functions

// ---------- Helper functions ----------
function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
// ---------- End of Helper functions ----------

// ---------- Event Listeners ----------
// Detect if the user has clicked on the start button to start the quiz
var startQuizButton=document.getElementById('start-button');
startQuizButton.addEventListener('click', startTheCodingQuiz);

// Detect if the user has clicked on the high scores button to show the high scores
var showHighScoresButton=document.getElementById('high-scores-button');
showHighScoresButton.addEventListener('click', showHighScores);

// Detect changes to the number of questions slider
var questionsSlider = document.getElementById('questions-slider');
questionsSlider.addEventListener('input', selectNumberOfQuestions);

// Detect clicks on the 'Go Back' button to return to the start screen
var goBackButton = document.getElementById('go-back');
goBackButton.addEventListener('click', goBackToStart);

// Detect clicks on the 'New Quiz' button to return to the start screen
var goToStartButton = document.getElementById('go-back-to-start');
goToStartButton.addEventListener('click', goBackToStart);

// Detect clicks on the 'Clear High Scores' button to clear the high scores
var clearHighScoresButton = document.getElementById('clear-high-scores');
clearHighScoresButton.addEventListener('click', clearHighScores);

// Detect if the user has clicked on the quiz answers with their mouse
var answerDiv = document.getElementById('quiz-answers');
answerDiv.addEventListener('click', answerSelected);

// Detect if the user has pressed (released) a key on the keyboard
// to allow keyboard answers (eg a, b, c, d, 1, 2, 3, 4)
document.addEventListener('keyup', quizKeyUp);

// Detect if the user has clicked on the Submit initials button
var submitInitials = document.getElementById('submit-initials');
submitInitials.addEventListener('click', saveScore);

// create and listen for custom events that are dispatched from the quiz timer and quiz controller
// notifying that the quiz has finished for further actions to be taken
const TimerFinishedEvent = new Event('quizTimerFinished');
const EndedQuestionsEvent = new Event('quizEndedQuestions');
document.addEventListener('quizTimerFinished', quizTimerFinished);
document.addEventListener('quizEndedQuestions', quizEndedQuestions);

// add event listeners for other custom events
// this one is used to update the timer display from the quiz timer
document.addEventListener('quizTimerTick', quizTimerTickHandler);
// this one is used to update the quiz progress bar when the user answers a question
document.addEventListener('quizQuestionAnswered', quizQuestionAnsweredHandler);
// ---------- End Event Listeners ----------
