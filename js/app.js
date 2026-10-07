// ==========================================
// ITIL Foundation Study App
// STEP 8 統合版
// ==========================================

let questions = [];
let activeQuestions = [];

let currentQuestion = 0;
let score = 0;
let answered = false;

// normal / weak / category
let quizMode = "normal";

let selectedCategoryId = null;
let selectedCategoryName = "";

const STORAGE_KEY = "itilStudyProgress";


// ==========================================
// 分野定義
// ==========================================

const CATEGORIES = [

    {
        id: "01",
        name: "基本概念と価値"
    },

    {
        id: "02",
        name: "4つのディメンション"
    },

    {
        id: "03",
        name: "ITIL Value System"
    },

    {
        id: "04",
        name: "Guiding Principles"
    },

    {
        id: "05",
        name: "Product & Service Lifecycle"
    },

    {
        id: "06",
        name: "Management Practices"
    },

    {
        id: "07",
        name: "Continual Improvement"
    },

    {
        id: "08",
        name: "Value Streams"
    }
];


// ==========================================
// 日付
// ==========================================

function getTodayString() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ==========================================
// 学習履歴
// ==========================================

function getProgress() {

    const saved =
        localStorage.getItem(
            STORAGE_KEY
        );

    if (saved) {

        try {

            const progress =
                JSON.parse(saved);

            progress.totalAnswered ??= 0;
            progress.totalCorrect ??= 0;
            progress.daily ??= {};
            progress.questions ??= {};

            return progress;

        } catch (error) {

            console.error(
                "学習履歴の読み込みに失敗しました。",
                error
            );
        }
    }

    return {
        totalAnswered: 0,
        totalCorrect: 0,
        daily: {},
        questions: {}
    };
}


function saveProgress(progress) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(progress)
    );
}


// ==========================================
// 回答記録
// ==========================================

function recordAnswer(
    questionId,
    isCorrect
) {

    const progress =
        getProgress();

    const today =
        getTodayString();


    progress.totalAnswered++;

    if (isCorrect) {
        progress.totalCorrect++;
    }


    if (!progress.daily[today]) {

        progress.daily[today] = {
            answered: 0,
            correct: 0
        };
    }


    progress.daily[today].answered++;

    if (isCorrect) {
        progress.daily[today].correct++;
    }


    if (!progress.questions[questionId]) {

        progress.questions[questionId] = {

            answered: 0,
            correct: 0,
            wrong: 0,
            consecutiveWrong: 0,
            lastAnswered: null
        };
    }


    const questionProgress =
        progress.questions[questionId];


    questionProgress.answered++;


    if (isCorrect) {

        questionProgress.correct++;
        questionProgress.consecutiveWrong = 0;

    } else {

        questionProgress.wrong++;
        questionProgress.consecutiveWrong++;
    }


    questionProgress.lastAnswered =
        new Date().toISOString();


    saveProgress(progress);

    updateHomeProgress();
    updateWeakSummary();
}


// ==========================================
// 苦手判定
// ==========================================

function isWeakQuestion(
    questionProgress
) {

    if (!questionProgress) {
        return false;
    }


    if (
        questionProgress.consecutiveWrong >= 2
    ) {
        return true;
    }


    if (
        questionProgress.answered === 1 &&
        questionProgress.wrong === 1
    ) {
        return true;
    }


    if (
        questionProgress.answered >= 2
    ) {

        const rate =
            questionProgress.correct /
            questionProgress.answered;

        if (rate < 0.5) {
            return true;
        }
    }


    return false;
}


function getWeakQuestions() {

    const progress =
        getProgress();


    return questions.filter(
        question => {

            const data =
                progress.questions[
                    question.id
                ];

            return isWeakQuestion(data);
        }
    );
}


function updateWeakSummary() {

    const summary =
        document.getElementById(
            "weak-summary"
        );

    if (!summary) {
        return;
    }


    if (questions.length === 0) {

        summary.textContent =
            "間違えた問題を復習する";

        return;
    }


    const weakQuestions =
        getWeakQuestions();


    if (weakQuestions.length === 0) {

        summary.textContent =
            "現在、苦手問題はありません";

    } else {

        summary.textContent =
            `現在 ${weakQuestions.length}問を復習できます`;
    }
}


// ==========================================
// ホーム進捗
// ==========================================

function updateHomeProgress() {

    const progress =
        getProgress();

    const today =
        getTodayString();

    const todayData =
        progress.daily[today] || {
            answered: 0,
            correct: 0
        };


    const progressText =
        document.querySelector(
            ".progress-text"
        );

    const progressFill =
        document.querySelector(
            ".progress-fill"
        );


    if (!progressText || !progressFill) {
        return;
    }


    if (todayData.answered === 0) {

        progressText.innerHTML =
            "まだ学習していません";

        progressFill.style.width =
            "0%";

        return;
    }


    const percentage =
        Math.round(
            todayData.correct /
            todayData.answered *
            100
        );


    progressText.innerHTML = `

        <strong>
            今日 ${todayData.answered}問
        </strong>

        <br>

        ${todayData.correct}問正解
        ・ 正答率 ${percentage}%

        <br>

        <span class="total-progress">
            累計 ${progress.totalAnswered}問回答
        </span>
    `;


    progressFill.style.width =
        `${percentage}%`;
}


// ==========================================
// 問題読み込み
// ==========================================

async function loadQuestions() {

    try {

        const response =
            await fetch(
                "data/questions.json",
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "問題データを読み込めませんでした。"
            );
        }


        questions =
            await response.json();


        console.log(
            `${questions.length}問を読み込みました`
        );


        updateWeakSummary();


    } catch (error) {

        console.error(error);

        alert(
            "問題データの読み込みに失敗しました。"
        );
    }
}


// ==========================================
// 通常一問一答
// ==========================================

async function startQuiz() {

    if (questions.length === 0) {
        await loadQuestions();
    }

    if (questions.length === 0) {
        return;
    }


    quizMode = "normal";

    selectedCategoryId = null;
    selectedCategoryName = "";

    activeQuestions =
        [...questions];

    currentQuestion = 0;
    score = 0;


    hideAllScreens();

    document.getElementById(
        "quiz-screen"
    ).style.display = "block";


    restoreQuizScreen();
    showQuestion();

    window.scrollTo(0, 0);
}


// ==========================================
// 苦手問題
// ==========================================

async function startWeakQuiz() {

    if (questions.length === 0) {
        await loadQuestions();
    }


    const weakQuestions =
        getWeakQuestions();


    if (weakQuestions.length === 0) {

        alert(
            "現在、苦手問題はありません。\n\n一問一答で問題を解くと、間違えた問題がここに追加されます。"
        );

        return;
    }


    quizMode = "weak";

    selectedCategoryId = null;
    selectedCategoryName = "";

    activeQuestions =
        [...weakQuestions];

    currentQuestion = 0;
    score = 0;


    hideAllScreens();

    document.getElementById(
        "quiz-screen"
    ).style.display = "block";


    restoreQuizScreen();
    showQuestion();

    window.scrollTo(0, 0);
}


// ==========================================
// 分野別画面
// ==========================================

async function showCategoryScreen() {

    if (questions.length === 0) {
        await loadQuestions();
    }


    renderCategoryList();

    hideAllScreens();


    document.getElementById(
        "category-screen"
    ).style.display = "block";


    window.scrollTo(0, 0);
}


// ==========================================
// 分野一覧生成
// ==========================================

function renderCategoryList() {

    const list =
        document.getElementById(
            "category-list"
        );


    const progress =
        getProgress();


    let html = "";


    CATEGORIES.forEach(
        category => {

            const categoryQuestions =
                questions.filter(
                    question =>
                        question.category_id ===
                        category.id
                );


            const total =
                categoryQuestions.length;


            let learned = 0;
            let answered = 0;
            let correct = 0;


            categoryQuestions.forEach(
                question => {

                    const questionProgress =
                        progress.questions[
                            question.id
                        ];


                    if (!questionProgress) {
                        return;
                    }


                    if (
                        questionProgress.answered > 0
                    ) {
                        learned++;
                    }


                    answered +=
                        questionProgress.answered;


                    correct +=
                        questionProgress.correct;
                }
            );


            const correctRate =
                answered > 0
                ?
                Math.round(
                    correct /
                    answered *
                    100
                )
                :
                0;


            const learningRate =
                total > 0
                ?
                Math.round(
                    learned /
                    total *
                    100
                )
                :
                0;


            let infoHTML = "";
            let buttonHTML = "";


            if (total === 0) {

                infoHTML = `

                    <div class="preparing-text">
                        問題準備中
                    </div>
                `;


                buttonHTML = `

                    <button
                        class="category-start-button"
                        disabled
                    >
                        準備中
                    </button>
                `;

            } else {

                infoHTML = `

                    <div class="category-learning-info">

                        学習済み
                        ${learned} / ${total}問

                        <br>

                        ${
                            answered > 0
                            ?
                            `正答率 ${correctRate}%`
                            :
                            "まだ回答していません"
                        }

                    </div>


                    <div class="category-progress-bar">

                        <div
                            class="category-progress-fill"
                            style="width:${learningRate}%"
                        >
                        </div>

                    </div>
                `;


                buttonHTML = `

                    <button
                        class="category-start-button"
                        onclick="startCategoryQuiz('${category.id}')"
                    >
                        この分野を学習
                    </button>
                `;
            }


            html += `

                <div class="category-list-card">

                    <div class="category-number">
                        CATEGORY ${category.id}
                    </div>

                    <h2>
                        ${category.name}
                    </h2>

                    ${infoHTML}

                    ${buttonHTML}

                </div>
            `;
        }
    );


    list.innerHTML =
        html;
}


// ==========================================
// 分野別問題開始
// ==========================================

async function startCategoryQuiz(
    categoryId
) {

    if (questions.length === 0) {
        await loadQuestions();
    }


    const category =
        CATEGORIES.find(
            item =>
                item.id === categoryId
        );


    if (!category) {
        return;
    }


    const categoryQuestions =
        questions.filter(
            question =>
                question.category_id ===
                categoryId
        );


    if (categoryQuestions.length === 0) {

        alert(
            "この分野の問題は現在準備中です。"
        );

        return;
    }


    quizMode = "category";

    selectedCategoryId =
        categoryId;

    selectedCategoryName =
        category.name;


    activeQuestions =
        [...categoryQuestions];


    currentQuestion = 0;
    score = 0;


    hideAllScreens();


    document.getElementById(
        "quiz-screen"
    ).style.display = "block";


    restoreQuizScreen();
    showQuestion();

    window.scrollTo(0, 0);
}


// ==========================================
// 問題画面
// ==========================================

function restoreQuizScreen() {

    const quizScreen =
        document.getElementById(
            "quiz-screen"
        );


    let modeTitle =
        "❓ 一問一答";


    if (quizMode === "weak") {

        modeTitle =
            "🔥 苦手問題";

    } else if (
        quizMode === "category"
    ) {

        modeTitle =
            `📖 ${selectedCategoryName}`;
    }


    quizScreen.innerHTML = `

        <button
            class="back-button"
            onclick="returnFromQuiz()"
        >
            ← 戻る
        </button>


        <div class="quiz-header">

            <span id="question-number">
            </span>

            <span>
                ${modeTitle}
            </span>

            <span id="score">
            </span>

        </div>


        <div class="question-card">

            <div
                id="category"
                class="category"
            >
            </div>


            <h2 id="question-text">
            </h2>


            <div id="choices">
            </div>

        </div>


        <div
            id="result-box"
            class="result-box"
            style="display:none;"
        >

            <h2 id="result-title">
            </h2>


            <div id="explanation">
            </div>


            <button
                id="next-button"
                class="next-button"
                onclick="nextQuestion()"
            >
                次の問題へ →
            </button>

        </div>
    `;
}


// ==========================================
// 問題表示
// ==========================================

function showQuestion() {

    answered = false;


    const question =
        activeQuestions[
            currentQuestion
        ];


    document.getElementById(
        "question-number"
    ).textContent =
        `問題 ${currentQuestion + 1} / ${activeQuestions.length}`;


    document.getElementById(
        "score"
    ).textContent =
        `正解 ${score}`;


    document.getElementById(
        "category"
    ).textContent =
        question.category;


    document.getElementById(
        "question-text"
    ).textContent =
        question.question;


    const choices =
        document.getElementById(
            "choices"
        );


    choices.innerHTML = "";


    question.choices.forEach(
        (choice, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "choice-button";


            button.textContent =
                `${String.fromCharCode(
                    65 + index
                )}. ${choice}`;


            button.onclick =
                () =>
                    selectAnswer(index);


            choices.appendChild(
                button
            );
        }
    );


    document.getElementById(
        "result-box"
    ).style.display = "none";
}


// ==========================================
// 回答
// ==========================================

function selectAnswer(
    selectedIndex
) {

    if (answered) {
        return;
    }


    answered = true;


    const question =
        activeQuestions[
            currentQuestion
        ];


    const isCorrect =
        selectedIndex ===
        question.answer;


    recordAnswer(
        question.id,
        isCorrect
    );


    const buttons =
        document.querySelectorAll(
            ".choice-button"
        );


    buttons.forEach(
        (button, index) => {

            button.disabled = true;


            if (
                index ===
                question.answer
            ) {

                button.classList.add(
                    "correct"
                );
            }


            if (
                index === selectedIndex &&
                selectedIndex !==
                    question.answer
            ) {

                button.classList.add(
                    "wrong"
                );
            }
        }
    );


    const resultTitle =
        document.getElementById(
            "result-title"
        );


    const explanation =
        document.getElementById(
            "explanation"
        );


    if (isCorrect) {

        score++;

        resultTitle.textContent =
            "⭕ 正解！";

    } else {

        resultTitle.textContent =
            "❌ 不正解";
    }


    const correctLetter =
        String.fromCharCode(
            65 + question.answer
        );


    let explanationHTML = `

        <p>
            <strong>
                正解：
                ${correctLetter}.
                ${question.choices[
                    question.answer
                ]}
            </strong>
        </p>

        <p>
            <strong>解説</strong>
        </p>

        <p>
            ${question.explanation}
        </p>
    `;


    if (!isCorrect) {

        const wrongReason =
            question
                .wrong_explanations?.[
                    selectedIndex
                ]
            ||
            "この選択肢は最も適切な回答ではありません。";


        explanationHTML += `

            <p class="wrong-reason">

                <strong>
                    選んだ回答が違う理由
                </strong>

                <br>

                ${wrongReason}

            </p>
        `;
    }


    explanation.innerHTML =
        explanationHTML;


    document.getElementById(
        "score"
    ).textContent =
        `正解 ${score}`;


    const nextButton =
        document.getElementById(
            "next-button"
        );


    if (
        currentQuestion ===
        activeQuestions.length - 1
    ) {

        nextButton.textContent =
            "結果を見る";

    } else {

        nextButton.textContent =
            "次の問題へ →";
    }


    document.getElementById(
        "result-box"
    ).style.display =
        "block";
}


// ==========================================
// 次の問題
// ==========================================

function nextQuestion() {

    currentQuestion++;


    if (
        currentQuestion <
        activeQuestions.length
    ) {

        showQuestion();

        window.scrollTo(0, 0);

    } else {

        showFinalResult();
    }
}


// ==========================================
// 結果
// ==========================================

function showFinalResult() {

    const percentage =
        Math.round(
            score /
            activeQuestions.length *
            100
        );


    const quizScreen =
        document.getElementById(
            "quiz-screen"
        );


    let title =
        "学習終了！";


    if (quizMode === "weak") {

        title =
            "苦手問題の復習終了！";

    } else if (
        quizMode === "category"
    ) {

        title =
            `${selectedCategoryName} 学習終了！`;
    }


    let retryFunction =
        "startQuiz()";


    if (quizMode === "weak") {

        retryFunction =
            "startWeakQuiz()";

    } else if (
        quizMode === "category"
    ) {

        retryFunction =
            `startCategoryQuiz('${selectedCategoryId}')`;
    }


    quizScreen.innerHTML = `

        <button
            class="back-button"
            onclick="returnFromQuiz()"
        >
            ← 戻る
        </button>


        <div class="final-result">

            <div class="result-icon">
                🎉
            </div>

            <h1>
                ${title}
            </h1>

            <div class="final-score">
                ${score}
                /
                ${activeQuestions.length}
            </div>

            <div class="percentage">
                正答率 ${percentage}%
            </div>


            <button
                class="next-button"
                onclick="${retryFunction}"
            >
                もう一度挑戦
            </button>


            <button
                class="home-button"
                onclick="goHome()"
            >
                ホームへ戻る
            </button>

        </div>
    `;
}


// ==========================================
// 問題画面から戻る
// ==========================================

function returnFromQuiz() {

    if (
        quizMode === "category"
    ) {

        showCategoryScreen();

    } else {

        goHome();
    }
}


// ==========================================
// 学習成績
// ==========================================

async function showStats() {

    if (questions.length === 0) {
        await loadQuestions();
    }


    const progress =
        getProgress();

    const today =
        getTodayString();

    const todayData =
        progress.daily[today] || {
            answered: 0,
            correct: 0
        };


    const todayRate =
        todayData.answered > 0
        ?
        Math.round(
            todayData.correct /
            todayData.answered *
            100
        )
        :
        0;


    const totalRate =
        progress.totalAnswered > 0
        ?
        Math.round(
            progress.totalCorrect /
            progress.totalAnswered *
            100
        )
        :
        0;


    const weakQuestions =
        getWeakQuestions();


    // -------------------------
    // 分野別
    // -------------------------

    let categoryHTML = "";


    CATEGORIES.forEach(
        category => {

            const categoryQuestions =
                questions.filter(
                    question =>
                        question.category_id ===
                        category.id
                );


            if (
                categoryQuestions.length === 0
            ) {
                return;
            }


            let answeredCount = 0;
            let correctCount = 0;


            categoryQuestions.forEach(
                question => {

                    const data =
                        progress.questions[
                            question.id
                        ];


                    if (!data) {
                        return;
                    }


                    answeredCount +=
                        data.answered;


                    correctCount +=
                        data.correct;
                }
            );


            if (answeredCount === 0) {
                return;
            }


            const rate =
                Math.round(
                    correctCount /
                    answeredCount *
                    100
                );


            categoryHTML += `

                <div class="category-stat">

                    <div class="category-stat-top">

                        <strong>
                            ${category.name}
                        </strong>

                        <span>
                            ${rate}%
                        </span>

                    </div>


                    <div class="stats-progress-bar">

                        <div
                            class="stats-progress-fill"
                            style="width:${rate}%"
                        >
                        </div>

                    </div>


                    <small>
                        ${correctCount}
                        /
                        ${answeredCount}
                        正解
                    </small>

                </div>
            `;
        }
    );


    if (categoryHTML === "") {

        categoryHTML = `

            <p class="empty-message">
                まだ分野別の成績はありません。
            </p>
        `;
    }


    // -------------------------
    // 最近7日
    // -------------------------

    let recentHTML = "";


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const date =
            new Date();


        date.setDate(
            date.getDate() - i
        );


        const year =
            date.getFullYear();


        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");


        const day =
            String(
                date.getDate()
            ).padStart(2, "0");


        const key =
            `${year}-${month}-${day}`;


        const data =
            progress.daily[key];


        if (!data) {
            continue;
        }


        const rate =
            data.answered > 0
            ?
            Math.round(
                data.correct /
                data.answered *
                100
            )
            :
            0;


        recentHTML += `

            <div class="recent-row">

                <span>
                    ${month}/${day}
                </span>

                <span>
                    ${data.answered}問
                </span>

                <strong>
                    ${rate}%
                </strong>

            </div>
        `;
    }


    if (recentHTML === "") {

        recentHTML = `

            <p class="empty-message">
                最近の学習記録はありません。
            </p>
        `;
    }


    const statsContent =
        document.getElementById(
            "stats-content"
        );


    statsContent.innerHTML = `

        <div class="stats-card">

            <h2>今日</h2>

            <div class="stats-big-row">

                <div>
                    <strong>
                        ${todayData.answered}
                    </strong>
                    <span>回答</span>
                </div>

                <div>
                    <strong>
                        ${todayData.correct}
                    </strong>
                    <span>正解</span>
                </div>

                <div>
                    <strong>
                        ${todayRate}%
                    </strong>
                    <span>正答率</span>
                </div>

            </div>

        </div>


        <div class="stats-card">

            <h2>累計</h2>

            <div class="stats-big-row">

                <div>
                    <strong>
                        ${progress.totalAnswered}
                    </strong>
                    <span>回答</span>
                </div>

                <div>
                    <strong>
                        ${progress.totalCorrect}
                    </strong>
                    <span>正解</span>
                </div>

                <div>
                    <strong>
                        ${totalRate}%
                    </strong>
                    <span>正答率</span>
                </div>

            </div>

        </div>


        <div class="stats-card">

            <h2>
                📚 分野別成績
            </h2>

            ${categoryHTML}

        </div>


        <div
            class="
                stats-card
                weak-stats-card
            "
        >

            <h2>
                🔥 苦手問題
            </h2>

            <div class="weak-count">

                ${weakQuestions.length}

                <span>問</span>

            </div>

            <p>
                現在、復習が必要と判定されている問題
            </p>

        </div>


        <div class="stats-card">

            <h2>
                📅 最近7日間
            </h2>

            ${recentHTML}

        </div>
    `;


    hideAllScreens();


    document.getElementById(
        "stats-screen"
    ).style.display =
        "block";


    window.scrollTo(0, 0);
}


// ==========================================
// 画面制御
// ==========================================

function hideAllScreens() {

    const screens = [

        "home-screen",
        "category-screen",
        "quiz-screen",
        "mock-screen",
        "stats-screen"
    ];


    screens.forEach(
        id => {

            const element =
                document.getElementById(id);


            if (element) {

                element.style.display =
                    "none";
            }
        }
    );
}


// ==========================================
// ホーム
// ==========================================

function goHome() {

    hideAllScreens();


    document.getElementById(
        "home-screen"
    ).style.display =
        "block";


    updateHomeProgress();
    updateWeakSummary();


    window.scrollTo(0, 0);
}


// ==========================================
// 初期化
// ==========================================

document.addEventListener(

    "DOMContentLoaded",

    async () => {

        updateHomeProgress();

        await loadQuestions();

        updateWeakSummary();
    }
);
// ==========================================
// STEP 11
// ITIL Foundation 模擬試験
// ==========================================

let mockQuestions = [];
let mockAnswers = [];
let mockCurrentQuestion = 0;

let mockTimeRemaining = 60 * 60;
let mockTimerId = null;

let mockExamFinished = false;


// ==========================================
// 配列シャッフル
// ==========================================

function shuffleArray(array) {

    const copy = [...array];

    for (
        let i = copy.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            copy[i],
            copy[j]
        ] = [
            copy[j],
            copy[i]
        ];
    }

    return copy;
}


// ==========================================
// 模擬試験説明画面
// ==========================================

async function showMockExamIntro() {

    if (questions.length === 0) {
        await loadQuestions();
    }

    hideAllScreens();

    const screen =
        document.getElementById(
            "mock-screen"
        );

    screen.style.display =
        "block";


    const isFullExam =
        questions.length >= 40;


    const examCount =
        isFullExam
        ? 40
        : questions.length;


    screen.innerHTML = `

        <button
            class="back-button"
            onclick="goHome()"
        >
            ← ホーム
        </button>


        <div class="mock-intro">

            <h1>
                📝 模擬試験
            </h1>


            ${
                isFullExam
                ?
                `
                <div class="mock-info">

                    <strong>
                        本番形式
                    </strong>

                    <br><br>

                    問題数：40問<br>
                    制限時間：60分<br>
                    合格基準：65%以上<br>
                    形式：四択

                </div>
                `
                :
                `
                <div class="mock-warning">

                    <strong>
                        ⚠ 開発テストモード
                    </strong>

                    <br><br>

                    現在の問題数は
                    ${questions.length}問です。

                    <br><br>

                    本番形式では40問必要ですが、
                    現在は全${questions.length}問を使って
                    模擬試験機能をテストします。

                </div>
                `
            }


            <p>
                試験中は正解や解説を表示しません。
            </p>

            <p>
                回答は途中で変更できます。
            </p>

            <p>
                最後にまとめて採点し、
                正解と解説を確認できます。
            </p>


            <div class="mock-info">

                出題数：
                <strong>${examCount}問</strong>

                <br>

                制限時間：
                <strong>60分</strong>

                <br>

                合格基準：
                <strong>65%</strong>

            </div>


            <button
                class="mock-start-button"
                onclick="startMockExam()"
            >
                模擬試験を開始
            </button>

        </div>
    `;

    window.scrollTo(0, 0);
}


// ==========================================
// 模擬試験開始
// ==========================================

function startMockExam() {

    if (questions.length === 0) {
        return;
    }


    const shuffled =
        shuffleArray(questions);


    mockQuestions =
        shuffled.slice(
            0,
            Math.min(
                40,
                shuffled.length
            )
        );


    mockAnswers =
        new Array(
            mockQuestions.length
        ).fill(null);


    mockCurrentQuestion = 0;

    mockTimeRemaining =
        60 * 60;

    mockExamFinished = false;


    clearInterval(
        mockTimerId
    );


    renderMockQuestion();

    startMockTimer();
}


// ==========================================
// タイマー
// ==========================================

function startMockTimer() {

    updateMockTimer();


    mockTimerId =
        setInterval(
            () => {

                mockTimeRemaining--;


                updateMockTimer();


                if (
                    mockTimeRemaining <= 0
                ) {

                    clearInterval(
                        mockTimerId
                    );

                    alert(
                        "制限時間になりました。\n自動的に採点します。"
                    );

                    finishMockExam(true);
                }

            },
            1000
        );
}


function updateMockTimer() {

    const timer =
        document.getElementById(
            "mock-timer"
        );


    if (!timer) {
        return;
    }


    const minutes =
        Math.floor(
            mockTimeRemaining / 60
        );


    const seconds =
        mockTimeRemaining % 60;


    timer.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


// ==========================================
// 問題表示
// ==========================================

function renderMockQuestion() {

    const screen =
        document.getElementById(
            "mock-screen"
        );


    screen.style.display =
        "block";


    const question =
        mockQuestions[
            mockCurrentQuestion
        ];


    const answeredCount =
        mockAnswers.filter(
            answer =>
                answer !== null
        ).length;


    let choicesHTML = "";


    question.choices.forEach(
        (choice, index) => {

            const selected =
                mockAnswers[
                    mockCurrentQuestion
                ] === index;


            choicesHTML += `

                <button
                    class="
                        mock-choice
                        ${selected ? "selected" : ""}
                    "
                    onclick="selectMockAnswer(${index})"
                >

                    ${String.fromCharCode(65 + index)}.
                    ${choice}

                </button>
            `;
        }
    );


    let numberHTML = "";


    mockQuestions.forEach(
        (item, index) => {

            const answered =
                mockAnswers[index] !== null;


            const current =
                index ===
                mockCurrentQuestion;


            numberHTML += `

                <button
                    class="
                        mock-number-button
                        ${answered ? "answered" : ""}
                        ${current ? "current" : ""}
                    "
                    onclick="jumpMockQuestion(${index})"
                >
                    ${index + 1}
                </button>
            `;
        }
    );


    screen.innerHTML = `

        <div class="mock-header">

            <div class="mock-header-top">

                <strong>
                    📝 模擬試験
                </strong>

                <div
                    id="mock-timer"
                    class="mock-timer"
                >
                    60:00
                </div>

            </div>


            <div class="mock-progress">

                問題
                ${mockCurrentQuestion + 1}
                /
                ${mockQuestions.length}

                ・

                回答済み
                ${answeredCount}
                /
                ${mockQuestions.length}

            </div>

        </div>


        <div class="mock-question-card">

            <div class="category">
                ${question.category}
            </div>

            <h2>
                ${question.question}
            </h2>

            <div>
                ${choicesHTML}
            </div>


            <div class="mock-navigation">

                <button
                    class="mock-nav-button"
                    onclick="previousMockQuestion()"
                    ${
                        mockCurrentQuestion === 0
                        ? "disabled"
                        : ""
                    }
                >
                    ← 前へ
                </button>


                <button
                    class="mock-nav-button"
                    onclick="nextMockQuestion()"
                    ${
                        mockCurrentQuestion ===
                        mockQuestions.length - 1
                        ? "disabled"
                        : ""
                    }
                >
                    次へ →
                </button>

            </div>


            <div class="mock-number-grid">
                ${numberHTML}
            </div>


            <button
                class="mock-submit-button"
                onclick="confirmFinishMockExam()"
            >
                試験を終了して採点
            </button>

        </div>
    `;


    updateMockTimer();

    window.scrollTo(0, 0);
}


// ==========================================
// 回答
// ==========================================

function selectMockAnswer(
    selectedIndex
) {

    mockAnswers[
        mockCurrentQuestion
    ] = selectedIndex;


    renderMockQuestion();
}


// ==========================================
// 前後移動
// ==========================================

function previousMockQuestion() {

    if (
        mockCurrentQuestion > 0
    ) {

        mockCurrentQuestion--;

        renderMockQuestion();
    }
}


function nextMockQuestion() {

    if (
        mockCurrentQuestion <
        mockQuestions.length - 1
    ) {

        mockCurrentQuestion++;

        renderMockQuestion();
    }
}


function jumpMockQuestion(index) {

    mockCurrentQuestion =
        index;

    renderMockQuestion();
}


// ==========================================
// 終了確認
// ==========================================

function confirmFinishMockExam() {

    const unanswered =
        mockAnswers.filter(
            answer =>
                answer === null
        ).length;


    let message =
        "模擬試験を終了して採点しますか？";


    if (unanswered > 0) {

        message =
            `未回答が${unanswered}問あります。\n\nこのまま採点しますか？`;
    }


    if (
        confirm(message)
    ) {

        finishMockExam(false);
    }
}


// ==========================================
// 採点
// ==========================================

function finishMockExam(
    timeExpired = false
) {

    if (mockExamFinished) {
        return;
    }


    mockExamFinished = true;


    clearInterval(
        mockTimerId
    );


    let correctCount = 0;


    mockQuestions.forEach(
        (question, index) => {

            const selected =
                mockAnswers[index];


            const isCorrect =
                selected ===
                question.answer;


            if (isCorrect) {
                correctCount++;
            }


            // 未回答は学習履歴へ入れない
            if (selected !== null) {

                recordAnswer(
                    question.id,
                    isCorrect
                );
            }
        }
    );


    const percentage =
        Math.round(
            correctCount /
            mockQuestions.length *
            100
        );


    const passed =
        percentage >= 65;


    showMockResult(
        correctCount,
        percentage,
        passed,
        timeExpired
    );
}


// ==========================================
// 結果
// ==========================================

function showMockResult(
    correctCount,
    percentage,
    passed,
    timeExpired
) {

    const screen =
        document.getElementById(
            "mock-screen"
        );


    let reviewHTML = "";


    mockQuestions.forEach(
        (question, index) => {

            const selected =
                mockAnswers[index];


            const isCorrect =
                selected ===
                question.answer;


            const selectedText =
                selected === null
                ?
                "未回答"
                :
                `${String.fromCharCode(65 + selected)}. ${question.choices[selected]}`;


            const correctText =
                `${String.fromCharCode(65 + question.answer)}. ${question.choices[question.answer]}`;


            reviewHTML += `

                <div
                    class="
                        mock-review
                        ${isCorrect ? "correct" : "wrong"}
                    "
                >

                    <strong>
                        問題 ${index + 1}
                        ${isCorrect ? "⭕" : "❌"}
                    </strong>


                    <p>
                        ${question.question}
                    </p>


                    <p>
                        あなたの回答：
                        <strong>
                            ${selectedText}
                        </strong>
                    </p>


                    <p>
                        正解：
                        <strong>
                            ${correctText}
                        </strong>
                    </p>


                    <p>
                        <strong>解説</strong>
                        <br>
                        ${question.explanation}
                    </p>

                </div>
            `;
        }
    );


    screen.innerHTML = `

        <div class="mock-result-card">

            <h1>
                📝 模擬試験結果
            </h1>


            ${
                timeExpired
                ?
                `
                <div class="mock-warning">
                    ⏰ 制限時間終了により自動採点しました。
                </div>
                `
                :
                ""
            }


            <div class="mock-result-score">

                ${correctCount}
                /
                ${mockQuestions.length}

            </div>


            <div class="${passed ? "mock-pass" : "mock-fail"}">

                ${
                    passed
                    ? "合格ライン達成"
                    : "合格ライン未達"
                }

            </div>


            <p style="text-align:center;">

                正答率
                <strong>${percentage}%</strong>

                <br>

                合格基準 65%

            </p>


            ${
                mockQuestions.length < 40
                ?
                `
                <div class="mock-warning">

                    現在は問題数が40問未満のため、
                    開発テストモードです。

                    <br>

                    この結果は本番試験の合格予測には使用しません。

                </div>
                `
                :
                ""
            }


            <button
                class="mock-start-button"
                onclick="showMockExamIntro()"
            >
                もう一度挑戦
            </button>


            <button
                class="home-button"
                onclick="goHome()"
            >
                ホームへ戻る
            </button>

        </div>


        <h2>
            問題ごとの確認
        </h2>


        ${reviewHTML}
    `;


    window.scrollTo(0, 0);
}